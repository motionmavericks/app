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
  const pgUrl = process.env.POSTGRES_URL || (process.env.NODE_ENV === 'test' ? process.env.POSTGRES_TEST_URL : undefined);
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

  // Real assets endpoint - replaces mock
  app.get('/api/assets/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    
    if (!pool) {
      return reply.code(500).send({ error: 'Database not configured' });
    }
    
    try {
      // Query asset with versions and collections
      const assetQuery = `
        SELECT 
          a.id,
          a.title,
          a.staging_key,
          a.master_key,
          a.filename,
          a.original_filename,
          a.mime_type,
          a.file_size,
          a.created_at,
          a.updated_at,
          a.folder_id,
          v.preview_prefix,
          v.metadata as version_metadata,
          CASE WHEN v.preview_prefix IS NOT NULL THEN true ELSE false END as ready
        FROM assets a
        LEFT JOIN versions v ON a.id = v.asset_id
        WHERE a.id = $1
        ORDER BY v.created_at DESC
        LIMIT 1
      `;
      
      const result = await pool.query(assetQuery, [id]);
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Asset not found' });
      }
      
      const asset = result.rows[0];
      
      // Get collections for this asset
      const collectionsQuery = `
        SELECT c.id, c.name, c.description, c.color
        FROM collections c
        JOIN asset_collections ac ON c.id = ac.collection_id
        WHERE ac.asset_id = $1
      `;
      
      const collectionsResult = await pool.query(collectionsQuery, [id]);
      
      // Format response matching frontend expectations
      const response = {
        id: asset.id,
        title: asset.title || asset.filename || asset.original_filename,
        ready: asset.ready,
        filename: asset.filename,
        originalFilename: asset.original_filename,
        mimeType: asset.mime_type,
        fileSize: asset.file_size,
        createdAt: asset.created_at,
        updatedAt: asset.updated_at,
        folderId: asset.folder_id,
        collections: collectionsResult.rows,
        versions: [{
          master_key: asset.master_key,
          preview_prefix: asset.preview_prefix,
          metadata: asset.version_metadata
        }].filter(v => v.master_key) // Only include if master exists
      };
      
      return response;
      
    } catch (error) {
      app.log.error(`Database error fetching asset: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Real preview status endpoint - replaces mock
  app.get('/api/preview/status', async (req, reply) => {
    const { prefix } = req.query as { prefix?: string };
    
    if (!prefix) {
      return reply.code(400).send({ error: 'Missing prefix parameter' });
    }
    
    if (!pool) {
      return reply.code(500).send({ error: 'Database not configured' });
    }
    
    try {
      // Check if preview exists in database
      const versionQuery = `
        SELECT preview_prefix, metadata
        FROM versions
        WHERE preview_prefix = $1
      `;
      
      const result = await pool.query(versionQuery, [prefix]);
      
      if (result.rows.length > 0) {
        return { ready: true, prefix };
      }
      
      // If not in database, check Redis for active job
      if (redis) {
        try {
          // Check recent entries in the preview stream for this prefix
          const streamResults = await redis.xrevrange(
            previewStream,
            '+',
            '-',
            'COUNT', 50
          );
          
          for (const [id, fields] of streamResults) {
            const fieldMap: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              fieldMap[fields[i]] = fields[i + 1];
            }
            
            if (fieldMap.masterKey && fieldMap.masterKey.includes(prefix.replace('previews/', ''))) {
              // Job exists but preview not ready yet
              return { ready: false, prefix, processing: true };
            }
          }
        } catch (redisError) {
          app.log.warn(`Redis error checking preview status: ${redisError instanceof Error ? redisError.message : String(redisError)}`);
        }
      }
      
      // Preview not found and no active job
      return { ready: false, prefix };
      
    } catch (error) {
      app.log.error(`Database error checking preview status: ${error instanceof Error ? error.message : String(error)}`);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Real preview events endpoint (SSE) - replaces mock
  app.get('/api/preview/events', async (req, reply) => {
    const { prefix } = req.query as { prefix?: string };
    
    if (!prefix) {
      return reply.code(400).send({ error: 'Missing prefix parameter' });
    }

    // Set up SSE headers
    reply.header('Content-Type', 'text/event-stream');
    reply.header('Cache-Control', 'no-cache');
    reply.header('Connection', 'keep-alive');
    reply.header('Access-Control-Allow-Origin', '*');
    
    if (!redis) {
      // Send ready status immediately if no Redis (fallback behavior)
      reply.raw.write(`event: status\n`);
      reply.raw.write(`data: ${JSON.stringify({ ready: true, prefix })}\n\n`);
      setTimeout(() => reply.raw.end(), 100);
      return;
    }
    
    try {
      // First check if preview already exists
      if (pool) {
        const versionQuery = `
          SELECT preview_prefix
          FROM versions
          WHERE preview_prefix = $1
        `;
        
        const result = await pool.query(versionQuery, [prefix]);
        
        if (result.rows.length > 0) {
          reply.raw.write(`event: status\n`);
          reply.raw.write(`data: ${JSON.stringify({ ready: true, prefix })}\n\n`);
          reply.raw.end();
          return;
        }
      }
      
      // Set up Redis stream consumer for real-time updates
      const consumerGroup = 'preview-events';
      const consumerName = `consumer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create consumer group if it doesn't exist
      try {
        await redis.xgroup('CREATE', previewStream, consumerGroup, '0', 'MKSTREAM');
      } catch (err: any) {
        if (!err.message.includes('BUSYGROUP')) {
          throw err;
        }
      }
      
      // Listen for new messages
      const checkForUpdates = async () => {
        try {
          const results = await redis.xreadgroup(
            'GROUP', consumerGroup, consumerName,
            'COUNT', 1,
            'BLOCK', 5000, // 5 second timeout
            'STREAMS', previewStream, '>'
          );
          
          if (results && results.length > 0) {
            const [stream, messages] = results[0];
            
            for (const [id, fields] of messages) {
              const fieldMap: Record<string, string> = {};
              for (let i = 0; i < fields.length; i += 2) {
                fieldMap[fields[i]] = fields[i + 1];
              }
              
              // Check if this message is for our prefix
              if (fieldMap.masterKey && fieldMap.masterKey.includes(prefix.replace('previews/', ''))) {
                // Acknowledge the message
                await redis.xack(previewStream, consumerGroup, id);
                
                // Send progress update
                reply.raw.write(`event: progress\n`);
                reply.raw.write(`data: ${JSON.stringify({
                  jobId: fieldMap.jobId,
                  prefix,
                  status: fieldMap.status || 'processing'
                })}\n\n`);
                
                // If job completed, send ready status and close
                if (fieldMap.status === 'completed') {
                  reply.raw.write(`event: status\n`);
                  reply.raw.write(`data: ${JSON.stringify({ ready: true, prefix })}\n\n`);
                  reply.raw.end();
                  return;
                }
              }
            }
          }
          
          // Continue listening if connection is still open
          if (!reply.raw.destroyed) {
            setTimeout(checkForUpdates, 1000);
          }
          
        } catch (err) {
          if (!reply.raw.destroyed) {
            app.log.error(`Redis stream read error: ${err instanceof Error ? err.message : String(err)}`);
            reply.raw.write(`event: error\n`);
            reply.raw.write(`data: ${JSON.stringify({ error: 'Stream read error' })}\n\n`);
            reply.raw.end();
          }
        }
      };
      
      // Start listening
      checkForUpdates();
      
      // Send initial status
      reply.raw.write(`event: status\n`);
      reply.raw.write(`data: ${JSON.stringify({ ready: false, prefix, processing: true })}\n\n`);
      
      // Handle client disconnect
      req.socket.on('close', () => {
        reply.raw.destroy();
      });
      
    } catch (error) {
      app.log.error(`Error setting up preview events stream: ${error instanceof Error ? error.message : String(error)}`);
      reply.raw.write(`event: error\n`);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Failed to setup event stream' })}\n\n`);
      reply.raw.end();
    }
  });

  // Sign preview URL endpoint
  app.post('/api/sign-preview', async (req, reply) => {
    const body = req.body as any;
    // Support both assetId and preview_prefix for compatibility
    const identifier = body.assetId || body.preview_prefix;
    if (!identifier) {
      return reply.code(400).send({ error: 'Missing assetId or preview_prefix' });
    }

    const edgeUrl = process.env.EDGE_PUBLIC_BASE || 'http://localhost:8080';
    const signingKey = process.env.EDGE_SIGNING_KEY;
    
    if (!signingKey) {
      return reply.code(500).send({ error: 'Signing key not configured' });
    }

    // Construct path based on input type
    const path = body.preview_prefix 
      ? `${body.preview_prefix}/playlist.m3u8`
      : `previews/${identifier}/playlist.m3u8`;

    // Sign the URL with a 1 hour expiration
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = signEdgeUrl(edgeUrl, 'previews', path, exp, signingKey);
    return { url: signedUrl };
  });

  return app;
}