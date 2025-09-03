import './instrument.js';
import 'dotenv/config';
import { build } from './app.js';

// Startup validation
const previewsBucket = process.env.PREVIEWS_BUCKET || '';
const endpoint = (process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com').replace(/\/$/, '');
const key = process.env.EDGE_SIGNING_KEY || process.env.HMAC_SECRET || '';

if (!previewsBucket || !endpoint || !key || key.length < 16) {
  const msg = 'Missing/weak required env: PREVIEWS_BUCKET, WASABI_ENDPOINT, or EDGE_SIGNING_KEY (>=16 chars)';
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exit(1);
}

const app = await build({ logger: true });

const port = Number(process.env.PORT || 8080);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});