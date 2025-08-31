import 'dotenv/config';
import Fastify from 'fastify';
import crypto from 'node:crypto';
import cors from '@fastify/cors';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || 'info' } });
await app.register(cors, { origin: true });

app.get('/health', async () => {
  return { ok: true, service: 'backend', time: new Date().toISOString() };
});

const PresignSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().optional(),
  bucket: z.string().optional(),
  expires: z.number().int().min(60).max(3600).optional(),
});

app.post('/presign', async (req, reply) => {
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

  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } });
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

app.get('/assets', async () => {
  return { items: Object.values(assets) };
});

app.post('/assets', async (req, reply) => {
  const schema = z.object({ title: z.string().optional(), staging_key: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid body', issues: parsed.error.issues });
  const id = crypto.randomUUID();
  const asset: Asset = { id, ...parsed.data, created_at: new Date().toISOString() };
  assets[id] = asset;
  return reply.code(201).send(asset);
});

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
