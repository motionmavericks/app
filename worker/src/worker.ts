import 'dotenv/config';
import Redis from 'ioredis';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const stream = process.env.PREVIEW_STREAM || 'previews:build';
const group = process.env.PREVIEW_CONSUMER_GROUP || 'previewers';
const consumer = process.env.INSTANCE_ID || `worker-${Math.random().toString(36).slice(2, 8)}`;

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', stream, group, '$', 'MKSTREAM');
    log.info({ stream, group }, 'created consumer group');
  } catch (err: any) {
    if (String(err?.message || err).includes('BUSYGROUP')) {
      log.debug('consumer group exists');
    } else {
      throw err;
    }
  }
}

async function handle(msgId: string, fields: string[]) {
  const data: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) data[fields[i]] = fields[i + 1];
  log.info({ msgId, data }, 'received preview job');
  // TODO: download from Masters, run ffmpeg, upload to Previews
  await new Promise((r) => setTimeout(r, 100));
}

async function main() {
  await ensureGroup();
  log.info({ stream, group, consumer }, 'preview worker started');
  while (true) {
    const res = await redis.xreadgroup('GROUP', group, consumer, 'BLOCK', 5000, 'COUNT', 1, 'STREAMS', stream, '>');
    if (!res) continue;
    for (const [, entries] of res) {
      for (const [id, fields] of entries as any) {
        try {
          await handle(id, fields);
          await redis.xack(stream, group, id);
        } catch (err) {
          log.error({ err, id }, 'job failed');
        }
      }
    }
  }
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});

