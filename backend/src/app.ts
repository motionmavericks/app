import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import * as Sentry from '@sentry/node';
import crypto from 'node:crypto';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import { S3Client, PutObjectCommand, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { signEdgeUrl } from './sign.js';
import { authRoutes } from './auth/routes.js';

interface BuildOptions {
  logger?: boolean | object;
}

export async function build(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify(opts);

  // Setup Sentry error handler for Fastify (only if configured)
  if (process.env.SENTRY_DSN) {
    Sentry.setupFastifyErrorHandler(app);
  }

  // CORS: allowlist via env ALLOWED_ORIGINS (comma-separated); fallback to true for dev
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  await app.register(cors, allowed.length > 0 ? { origin: allowed } : { origin: true });

  // Cookie support for refresh tokens
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex')
  });

  // Basic rate limiting (configurable via env)
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
  });

  // OpenAPI docs
  await app.register(swagger, {
    openapi: {
      info: { title: 'MotionMavericks API', version: '0.1.0' },
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // Register auth routes
  await app.register(authRoutes);

  // Optional DB/Redis wiring (enabled when env is present)
  const pgUrl = process.env.POSTGRES_URL;
  const pool = pgUrl ? new Pool({ connectionString: pgUrl }) : undefined;
  const redisUrl = process.env.REDIS_URL;
  const RedisCtor: any = (IORedis as any);
  const redis = redisUrl ? new RedisCtor(redisUrl) : undefined;
  const previewStream = process.env.PREVIEW_STREAM || 'previews:build';

  // Health check endpoint
  app.get('/api/health', async (req, reply) => {
    const checks: Record<string, any> = {};
    
    // Check database connection if configured (non-placeholder)
    if (pool && !pgUrl?.includes('placeholder')) {
      try { 
        await pool.query('select 1'); 
        checks.db = true; 
      } catch { 
        checks.db = false; 
      }
    } else if (pool && pgUrl?.includes('placeholder')) {
      checks.db = 'not_configured';
    }
    
    // Check Redis connection if configured (non-placeholder)
    if (redis && !redisUrl?.includes('placeholder')) {
      try { 
        await redis.ping(); 
        checks.redis = true; 
      } catch { 
        checks.redis = false; 
      }
    } else if (redis && redisUrl?.includes('placeholder')) {
      checks.redis = 'not_configured';
    }
    
    // Always return 200 OK since the service itself is healthy
    return reply.code(200).send({ 
      ok: true, 
      service: 'backend', 
      time: new Date().toISOString(), 
      ...checks 
    });
  });

  // Presign endpoint
  const PresignSchema = z.object({
    key: z.string().min(1).refine(
      (key) => !key.includes('../') && !key.startsWith('/'),
      { message: 'Invalid key format' }
    ),
    contentType: z.string().optional().refine(
      (type) => !type || /^(video|audio|image|application)\/.+$/.test(type),
      { message: 'Invalid content type' }
    ),
    contentLength: z.number().optional().refine(
      (size) => !size || size <= 10737418240, // 10GB
      { message: 'File size exceeds limit' }
    ),
    bucket: z.string().optional(),
    expires: z.number().int().min(60).max(3600).optional(),
  });

  app.post('/api/presign', {
    config: {
      rateLimit: {
        max: Number(process.env.RL_PRESIGN_MAX || 120),
        timeWindow: process.env.RL_PRESIGN_WINDOW || '1 minute',
      }
    }
  }, async (req, reply) => {
    const parsed = PresignSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessage = parsed.error.errors?.[0]?.message || 'Invalid body';
      return reply.code(400).send({ error: errorMessage });
    }
    const { key, contentType, bucket: bodyBucket, expires } = parsed.data;

    const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
    const region = process.env.WASABI_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const accessKeyId = process.env.WASABI_STAGING_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WASABI_STAGING_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = bodyBucket || process.env.STAGING_BUCKET;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      return reply.code(501).send({ error: 'Storage configuration missing' });
    }

    const s3 = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey }
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });

    const url = await getSignedUrl(s3, command, { expiresIn: expires || 3600 });
    return { url, bucket, key };
  });

  // Promote endpoint
  const PromoteSchema = z.object({
    stagingKey: z.string().min(1).refine(
      (key) => !key.includes('../') && !key.startsWith('/'),
      { message: 'Invalid staging key format' }
    ),
    mastersBucket: z.string().optional(),
    metadata: z.record(z.string()).optional()
  });

  app.post('/api/promote', async (req, reply) => {
    const parsed = PromoteSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessage = parsed.error.errors?.[0]?.message || 'Invalid body';
      return reply.code(400).send({ error: errorMessage });
    }

    const { stagingKey, mastersBucket, metadata } = parsed.data;
    
    const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
    const region = process.env.WASABI_REGION || 'us-east-1';
    const accessKeyId = process.env.WASABI_MASTERS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WASABI_MASTERS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
    const stagingBucket = process.env.STAGING_BUCKET;
    const targetBucket = mastersBucket || process.env.MASTERS_BUCKET;

    if (!accessKeyId || !secretAccessKey || !stagingBucket || !targetBucket) {
      return reply.code(500).send({ error: 'Storage configuration missing' });
    }

    const s3 = new S3Client({
      endpoint,
      region,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey }
    });

    // Generate master key
    const masterKey = stagingKey.replace(/^(uploads|staging)\//, 'masters/');
    
    // Copy object to masters bucket
    const copyCommand = new CopyObjectCommand({
      CopySource: `${stagingBucket}/${stagingKey}`,
      Bucket: targetBucket,
      Key: masterKey,
      ObjectLockMode: 'COMPLIANCE',
      ObjectLockRetainUntilDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      Metadata: metadata
    });

    try {
      await s3.send(copyCommand);
      
      // Queue preview generation if Redis is available
      if (redis) {
        const jobId = crypto.randomBytes(16).toString('hex');
        await redis.xadd(
          previewStream,
          '*',
          'jobId', jobId,
          'masterKey', masterKey,
          'bucket', targetBucket
        );
        return reply.code(202).send({ 
          masterKey, 
          bucket: targetBucket, 
          previewJobId: jobId 
        });
      }

      return { masterKey, bucket: targetBucket };
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ error: 'Failed to promote asset' });
    }
  });

  // Sign preview URL endpoint
  app.post('/api/sign-preview', async (req, reply) => {
    const body = req.body as any;
    if (!body.assetId) {
      return reply.code(400).send({ error: 'Missing assetId' });
    }

    const edgeUrl = process.env.EDGE_PUBLIC_BASE || 'http://localhost:8080';
    const signingKey = process.env.EDGE_SIGNING_KEY;
    
    if (!signingKey) {
      return reply.code(500).send({ error: 'Signing key not configured' });
    }

    // Sign the URL with a 1 hour expiration
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = signEdgeUrl(edgeUrl, 'previews', `${body.assetId}/playlist.m3u8`, exp, signingKey);
    return { url: signedUrl };
  });

  return app;
}
