import 'dotenv/config';
import Fastify from 'fastify';
import crypto from 'node:crypto';

const app = Fastify({ logger: true });
app.get('/health', async () => ({ ok: true, service: 'edge', time: new Date().toISOString() }));
const previewsBucket = process.env.PREVIEWS_BUCKET || '';
const endpoint = (process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com').replace(/\/$/, '');
const key = process.env.EDGE_SIGNING_KEY || '';

function validSig(path: string, exp: number, sig: string) {
  if (!key) return false;
  if (Date.now() / 1000 >= exp) return false;
  const h = crypto.createHmac('sha256', key);
  h.update(`${path}?exp=${exp}`);
  const hex = h.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hex), Buffer.from(sig));
}

app.get('/s/*', async (req, reply) => {
  const p = (req.params as any)['*'] as string;
  const { exp, sig } = req.query as any;
  const expNum = Number(exp || 0);
  if (!p || !expNum || !sig || !validSig(`/s/${p}`, expNum, sig)) {
    return reply.code(403).send({ error: 'forbidden' });
  }
  const target = `${endpoint}/${previewsBucket}/${p}`;
  const range = (req.headers as any)['range'] as string | undefined;
  const res = await fetch(target, { headers: range ? { Range: range } : undefined });
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
