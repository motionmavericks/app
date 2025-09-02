import './instrument.js';
import 'dotenv/config';
import Fastify from 'fastify';
import * as Sentry from '@sentry/node';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({ logger: true });

// Setup Sentry error handler for Fastify
Sentry.setupFastifyErrorHandler(app);

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 400),
  timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
});
app.get('/health', async () => ({ ok: true, service: 'edge', time: new Date().toISOString() }));

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
const key = process.env.EDGE_SIGNING_KEY || '';

// Startup validation
if (!previewsBucket || !endpoint || !key || key.length < 32) {
  const msg = 'Missing/weak required env: PREVIEWS_BUCKET, WASABI_ENDPOINT, or EDGE_SIGNING_KEY (>=32 chars)';
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

import { validSig as _validSig } from './sign.js';
function validSig(path: string, exp: number, sig: string) { return _validSig(path, exp, sig, key); }

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
