import 'dotenv/config';
import Fastify from 'fastify';
import crypto from 'node:crypto';
import IORedis from 'ioredis';
import { Pool } from 'pg';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { signEdgeUrl } from './sign.js';

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
// CORS: allowlist via env ALLOWED_ORIGINS (comma-separated); fallback to true for dev
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
await app.register(cors, allowed.length > 0 ? { origin: allowed } : { origin: true });
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

// Optional DB/Redis wiring (enabled when env is present)
const pgUrl = process.env.POSTGRES_URL;
const pool = pgUrl ? new Pool({ connectionString: pgUrl }) : undefined;
const redisUrl = process.env.REDIS_URL;
// ioredis typing under NodeNext can appear non-constructable; coerce to any
const RedisCtor: any = (IORedis as any);
const redis = redisUrl ? new RedisCtor(redisUrl) : undefined;
const previewStream = process.env.PREVIEW_STREAM || 'previews:build';

app.get('/api/health', async () => {
  const checks: Record<string, any> = {};
  if (pool) {
    try { await pool.query('select 1'); checks.db = true; } catch { checks.db = false; }
  }
  if (redis) {
    try { await redis.ping(); checks.redis = true; } catch { checks.redis = false; }
  }
  return { ok: true, service: 'backend', time: new Date().toISOString(), ...checks };
});

const PresignSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().optional(),
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
    return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  }
  const { key, contentType, bucket: bodyBucket, expires } = parsed.data;

  const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
  const region = process.env.WASABI_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const accessKeyId = process.env.WASABI_STAGING_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.WASABI_STAGING_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = bodyBucket || process.env.STAGING_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return reply.code(501).send({
      error: 'Server not configured for presign',
      missing: {
        WASABI_STAGING_ACCESS_KEY: !accessKeyId,
        WASABI_STAGING_SECRET: !secretAccessKey,
        STAGING_BUCKET: !bucket,
      },
    });
  }

  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string } });
  const put = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType || 'application/octet-stream' });
  const expiresIn = Math.min(Math.max(expires ?? 900, 60), 3600);
  try {
    const url = await getSignedUrl(s3, put, { expiresIn });
    return { url, bucket, key, expiresIn };
  } catch (err: any) {
    req.log.error({ err }, 'presign failed');
    return reply.code(500).send({ error: 'Failed to presign', detail: err?.message ?? String(err) });
  }
});

// Minimal in-memory assets stub to unblock frontend during early phases
type Asset = { id: string; title?: string; staging_key?: string; created_at: string };
const assets: Record<string, Asset> = {};

app.get('/api/assets', async () => {
  if (pool) {
    const { rows } = await pool.query('SELECT id, title, staging_key, created_at FROM assets ORDER BY created_at DESC LIMIT 100');
    return { items: rows };
  }
  return { items: Object.values(assets) };
});

// Get single asset with versions and preview readiness
app.get('/api/assets/:id', async (req, reply) => {
  const id = (req.params as any).id as string;
  if (!pool) return reply.code(501).send({ error: 'DB not configured' });
  const { rows } = await pool.query('SELECT id, title, staging_key, created_at FROM assets WHERE id = $1', [id]);
  if (rows.length === 0) return reply.code(404).send({ error: 'not found' });
  const asset = rows[0];
  const vres = await pool.query('SELECT id, master_key, preview_prefix, created_at FROM versions WHERE asset_id = $1 ORDER BY created_at DESC', [id]);
  const versions = vres.rows;
  let ready = false;
  if (versions.length > 0) {
    // Check if preview playlist exists
    const previewsBucket = process.env.PREVIEWS_BUCKET;
    const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
    const region = process.env.WASABI_REGION || 'us-east-1';
    const accessKeyId = process.env.WASABI_PREVIEWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WASABI_PREVIEWS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
    if (previewsBucket && accessKeyId && secretAccessKey) {
      try {
        const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string } });
        const prefix = versions[0].preview_prefix || `previews/${versions[0].master_key.replace(/^masters\//, '')}`;
        await s3.send(new HeadObjectCommand({ Bucket: previewsBucket, Key: `${prefix}/index.m3u8` }));
        ready = true;
      } catch {}
    }
  }
  return { asset, versions, ready };
});

app.post('/api/assets', async (req, reply) => {
  const schema = z.object({ title: z.string().optional(), staging_key: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  const id = crypto.randomUUID();
  const asset: Asset = { id, ...parsed.data, created_at: new Date().toISOString() };
  if (pool) {
    await pool.query('INSERT INTO assets (id, title, staging_key, created_at) VALUES ($1,$2,$3, now())', [id, asset.title || null, asset.staging_key || null]);
    return reply.code(201).send(asset);
  } else {
    assets[id] = asset;
    return reply.code(201).send(asset);
  }
});

// Enqueue preview build job
app.post('/api/preview', async (req, reply) => {
  const schema = z.object({
    asset_id: z.string().uuid().optional(),
    master_bucket: z.string(),
    master_key: z.string(),
    previews_bucket: z.string(),
    preview_prefix: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  if (!redis) return reply.code(501).send({ error: 'Queue not configured (REDIS_URL missing)' });
  const id = crypto.randomUUID();
  await redis.xadd(
    previewStream,
    '*',
    'id', id,
    'asset_id', parsed.data.asset_id || '',
    'master_bucket', parsed.data.master_bucket,
    'master_key', parsed.data.master_key,
    'previews_bucket', parsed.data.previews_bucket,
    'preview_prefix', parsed.data.preview_prefix
  );
  return reply.code(202).send({ enqueued: true, id });
});

// Simple preview status check
app.get('/api/preview/status', async (req, reply) => {
  const prefix = (req.query as any).prefix as string | undefined;
  if (!prefix) return reply.code(400).send({ error: 'missing prefix' });
  const previewsBucket = process.env.PREVIEWS_BUCKET;
  const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
  const region = process.env.WASABI_REGION || 'us-east-1';
  const accessKeyId = process.env.WASABI_PREVIEWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.WASABI_PREVIEWS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  if (!previewsBucket || !accessKeyId || !secretAccessKey) return { ready: false };
  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string } });
  try {
    await s3.send(new HeadObjectCommand({ Bucket: previewsBucket, Key: `${prefix.replace(/^\//, '')}/index.m3u8` }));
    return { ready: true };
  } catch (err: any) {
    req.log.debug({ err, prefix }, 'preview status check failed');
    return { ready: false };
  }
});

// Server-Sent Events for preview readiness (best-effort polling)
app.get('/api/preview/events', async (req, reply) => {
  const prefix = (req.query as any).prefix as string | undefined;
  if (!prefix) return reply.code(400).send({ error: 'missing prefix' });
  reply.header('Content-Type', 'text/event-stream');
  reply.header('Cache-Control', 'no-cache');
  reply.raw.write(`retry: 2000\n\n`);
  const check = async () => {
    const r = await app.inject({ method: 'GET', url: `/api/preview/status?prefix=${encodeURIComponent(prefix)}` });
    const body = r.json() as any;
    reply.raw.write(`event: status\n`);
    reply.raw.write(`data: ${JSON.stringify(body)}\n\n`);
    return body.ready === true;
  };
  try {
    if (await check()) return reply.raw.end();
    const until = Date.now() + 60000;
    while (Date.now() < until) {
      await new Promise(r => setTimeout(r, 2000));
      if (await check()) break;
    }
  } finally {
    reply.raw.end();
  }
});

// Worker callback to mark preview ready
app.post('/api/preview/callback', async (req, reply) => {
  const schema = z.object({ asset_id: z.string().uuid().optional(), preview_prefix: z.string(), ok: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  // For now, just log. If DB present, update asset state.
  app.log.info({ cb: parsed.data }, 'preview callback');
  return { ok: true };
});

// Sign preview playback URL for edge or return presigned Wasabi fallback
app.post('/api/sign-preview', async (req, reply) => {
  const schema = z.object({ preview_prefix: z.string(), playlist: z.string().default('index.m3u8'), expSec: z.number().int().min(60).max(3600).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  const { preview_prefix, playlist, expSec } = parsed.data;
  const edgeBase = process.env.EDGE_PUBLIC_BASE;
  const key = process.env.EDGE_SIGNING_KEY;
  const previewsBucket = process.env.PREVIEWS_BUCKET;
  const exp = Math.floor(Date.now() / 1000) + (expSec ?? 600);
  const path = `/s/${preview_prefix.replace(/^\//, '')}/${playlist}`;
  if (edgeBase && key) {
    const url = signEdgeUrl(edgeBase, preview_prefix, playlist, exp, key);
    return { url, edge: true, exp };
  }
  // Fallback: presign from previews bucket directly
  const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
  const region = process.env.WASABI_REGION || 'us-east-1';
  const accessKeyId = process.env.WASABI_PREVIEWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.WASABI_PREVIEWS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  if (!previewsBucket || !accessKeyId || !secretAccessKey) {
    return reply.code(501).send({ error: 'Edge/Presign not configured' });
  }
  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string } });
  const objectKey = `${preview_prefix.replace(/^\//, '')}/${playlist}`;
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const obj = new GetObjectCommand({ Bucket: previewsBucket, Key: objectKey });
  const url = await getSignedUrl(s3, obj, { expiresIn: expSec ?? 600 });
  return { url, edge: false, exp };
});

// Promote from Staging to Masters and enqueue preview
app.post('/api/promote', {
  config: {
    rateLimit: {
      max: Number(process.env.RL_PROMOTE_MAX || 30),
      timeWindow: process.env.RL_PROMOTE_WINDOW || '1 minute',
    }
  }
}, async (req, reply) => {
  const schema = z.object({
    stagingKey: z.string(),
    sha256: z.string().optional(),
    mapping: z.object({
      client: z.string().min(1).optional(),
      project: z.string().min(1).optional(),
      shootDate: z.string().min(4).optional(),
      collection: z.string().optional(),
    }).optional(),
    masterKey: z.string().optional(),
    previewPrefix: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  const body = parsed.data;

  const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
  const region = process.env.WASABI_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const stagingBucket = process.env.STAGING_BUCKET;
  const mastersBucket = process.env.MASTERS_BUCKET;
  const accessKeyId = process.env.WASABI_MASTERS_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.WASABI_MASTERS_SECRET || process.env.AWS_SECRET_ACCESS_KEY;
  const previewsBucket = process.env.PREVIEWS_BUCKET;
  if (!stagingBucket || !mastersBucket || !previewsBucket) {
    return reply.code(501).send({ error: 'Buckets not configured', missing: { STAGING_BUCKET: !stagingBucket, MASTERS_BUCKET: !mastersBucket, PREVIEWS_BUCKET: !previewsBucket } });
  }
  if (!accessKeyId || !secretAccessKey) {
    return reply.code(501).send({ error: 'Masters credentials not configured' });
  }
  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string } });

  const src = `/${stagingBucket}/${body.stagingKey}`;
  const destKey = body.masterKey || body.stagingKey.replace(/^staging\//, 'masters/');

  // Optional: verify source exists and checksum if available
  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: stagingBucket, Key: body.stagingKey }));
  } catch (err: any) {
    return reply.code(404).send({ error: 'staging object not found', detail: err?.message });
  }
  if (body.sha256) {
    const meta = (head as any)?.Metadata || {};
    const metaSha = meta.sha256 || meta["x-amz-meta-sha256"];
    if (metaSha && metaSha !== body.sha256) {
      return reply.code(409).send({ error: 'checksum mismatch', expected: body.sha256, got: metaSha });
    }
  }

  // Object Lock retention if configured
  const days = Number(process.env.OBJECT_LOCK_DEFAULT_DAYS || 0);
  const retainUntil = days > 0 ? new Date(Date.now() + days * 86400_000) : undefined;

  // Idempotency: if destination exists, skip copy
  try {
    await s3.send(new HeadObjectCommand({ Bucket: mastersBucket, Key: destKey }));
  } catch {
    try {
      await s3.send(new CopyObjectCommand({
        Bucket: mastersBucket,
        Key: destKey,
        CopySource: src,
        ServerSideEncryption: 'AES256',
        ...(retainUntil ? { ObjectLockMode: 'GOVERNANCE', ObjectLockRetainUntilDate: retainUntil } : {}),
      }));
    } catch (err: any) {
      req.log.error({ err }, 'copy failed');
      return reply.code(500).send({ error: 'copy failed', detail: err?.message });
    }
  }

  // Record version if DB available
  let assetId: string | undefined = (req.query as any)?.asset_id;
  if (pool) {
    if (!assetId) {
      assetId = crypto.randomUUID();
      await pool.query('INSERT INTO assets (id, title, staging_key, created_at) VALUES ($1,$2,$3, now())', [assetId, null, body.stagingKey || null]);
    }
    const previewPrefix = body.previewPrefix || `previews/${destKey.replace(/^masters\//, '')}`;
    await pool.query('INSERT INTO versions (id, asset_id, master_key, preview_prefix, metadata, created_at) VALUES ($1,$2,$3,$4,$5, now())', [crypto.randomUUID(), assetId, destKey, previewPrefix, body.mapping ? JSON.stringify(body.mapping) : null]);
  }

  // Enqueue preview job if queue configured
  let jobId: string | undefined;
  if (redis) {
    jobId = crypto.randomUUID();
    const previewPrefix = body.previewPrefix || `previews/${destKey.replace(/^masters\//, '')}`;
    await redis.xadd(
      previewStream,
      '*',
      'id', jobId,
      'master_bucket', mastersBucket,
      'master_key', destKey,
      'previews_bucket', previewsBucket,
      'preview_prefix', previewPrefix
    );
  }

  return reply.code(200).send({ masterKey: destKey, jobId, assetId });
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
