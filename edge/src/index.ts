import './instrument.js';
import 'dotenv/config';
import Fastify from 'fastify';
import * as Sentry from '@sentry/node';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

// Setup Sentry error handler for Fastify
Sentry.setupFastifyErrorHandler(app);

// CORS support for browser compatibility  
await app.register(cors, { 
  origin: true,
  methods: ['GET', 'HEAD', 'OPTIONS']
});

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 400),
  timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
});

app.get('/health', async () => ({ ok: true, service: 'edge', time: new Date().toISOString() }));

// Metrics endpoint for monitoring
app.get('/metrics', async () => ({ 
  service: 'edge',
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString()
}));

// Debug Sentry endpoint for testing
app.get('/debug-sentry', async (req, reply) => {
  // Send a log before throwing the error
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
  });
  throw new Error('My first Sentry error!');
});

const previewsBucket = process.env.PREVIEWS_BUCKET || '';
const endpoint = (process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com').replace(/\/$/, '');
const key = process.env.EDGE_SIGNING_KEY || process.env.HMAC_SECRET || '';

// Startup validation
if (!previewsBucket || !endpoint || !key || key.length < 16) {
  const msg = 'Missing/weak required env: PREVIEWS_BUCKET, WASABI_ENDPOINT, or EDGE_SIGNING_KEY (>=16 chars)';
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

import { validSig as _validSig } from './sign.js';
function validSig(path: string, exp: number, sig: string) { return _validSig(path, exp, sig, key); }

// Helper function to create HMAC signature for validation
function createHMACSignature(path: string, expiresAt: number, secret: string): string {
  const message = `${path}:${expiresAt}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// Validate HMAC signature
function validateHMAC(path: string, hmac: string, expires: number): boolean {
  if (!expires || expires < Math.floor(Date.now() / 1000)) {
    return false; // Expired
  }
  const expectedHmac = createHMACSignature(path, expires, key);
  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
}

// Preview content route - matches expected test pattern
app.get('/preview/*', async (req, reply) => {
  const fullPath = (req.params as any)['*'] as string;
  const { hmac, expires } = req.query as any;
  const expNum = Number(expires || 0);
  
  // Path sanitization: only allow alnum, _, -, /, .
  if (!fullPath || !/^[-A-Za-z0-9_./]+$/.test(fullPath)) {
    return reply.code(400).send({ error: 'Invalid path format' });
  }
  
  if (!hmac || !expNum) {
    return reply.code(403).send({ error: 'Missing signature or expiration' });
  }
  
  const requestPath = `/preview/${fullPath}`;
  if (!validateHMAC(requestPath, hmac, expNum)) {
    return reply.code(403).send({ error: 'Invalid signature' });
  }
  
  const target = `${endpoint}/${previewsBucket}/${fullPath}`;
  const range = (req.headers as any)['range'] as string | undefined;
  
  app.log.info({ path: fullPath, range: !!range }, 'proxy request');
  
  // Timeout + single retry wrapper
  const timeoutMs = Number(process.env.FETCH_TIMEOUT_MS || 10000);
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  
  let res: Response;
  try {
    res = await fetch(target, { 
      headers: range ? { Range: range } : undefined, 
      signal: controller.signal 
    });
  } catch (e) {
    // retry once after short backoff
    await sleep(200);
    const controller2 = new AbortController();
    setTimeout(() => controller2.abort(), timeoutMs);
    try {
      res = await fetch(target, { 
        headers: range ? { Range: range } : undefined, 
        signal: controller2.signal 
      });
    } catch (retryError) {
      return reply.code(404).send({ error: 'Content not found' });
    }
  } finally {
    clearTimeout(to as any);
  }
  
  // Set appropriate cache headers based on file type
  const isManifest = fullPath.endsWith('.m3u8');
  const isSegment = fullPath.endsWith('.ts');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fullPath);
  
  if (isManifest) {
    reply.header('cache-control', 'public, max-age=60'); // Shorter cache for manifests
    reply.header('content-type', 'application/vnd.apple.mpegurl');
  } else if (isSegment) {
    reply.header('cache-control', 'public, max-age=3600'); // Longer cache for segments
    reply.header('content-type', 'video/MP2T');
  } else if (isImage) {
    reply.header('cache-control', 'public, max-age=86400'); // Long cache for images
  }
  
  reply.code(res.status);
  for (const [h, v] of res.headers.entries()) {
    if (['connection', 'content-encoding', 'transfer-encoding'].includes(h)) continue;
    reply.header(h, v);
  }
  
  if (res.body) {
    return reply.send(res.body as any);
  }
  return reply.send();
});

// Legacy /s/* route for backward compatibility
app.get('/s/*', async (req, reply) => {
  const p = (req.params as any)['*'] as string;
  const { exp, sig } = req.query as any;
  const expNum = Number(exp || 0);
  // Path sanitization: only allow alnum, _, -, /, .
  if (!p || !/^[-A-Za-z0-9_./]+$/.test(p)) {
    return reply.code(400).send({ error: 'bad path' });
  }
  if (!expNum || !sig || !validSig(`/s/${p}`, expNum, sig)) {
    return reply.code(403).send({ error: 'forbidden' });
  }
  const target = `${endpoint}/${previewsBucket}/${p}`;
  const range = (req.headers as any)['range'] as string | undefined;
  app.log.info({ path: p, range: !!range }, 'proxy request');
  // Timeout + single retry wrapper
  const timeoutMs = Number(process.env.FETCH_TIMEOUT_MS || 10000);
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(target, { headers: range ? { Range: range } : undefined, signal: controller.signal });
  } catch (e) {
    // retry once after short backoff
    await sleep(200);
    const controller2 = new AbortController();
    setTimeout(() => controller2.abort(), timeoutMs);
    res = await fetch(target, { headers: range ? { Range: range } : undefined, signal: controller2.signal });
  } finally {
    clearTimeout(to as any);
  }
  reply.code(res.status);
  for (const [h, v] of res.headers.entries()) {
    if (['connection'].includes(h)) continue;
    reply.header(h, v);
  }
  if (res.body) {
    return reply.send(res.body as any);
  }
  return reply.send();
});

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});