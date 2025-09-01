import 'dotenv/config';
import Redis from 'ioredis';
import { hostname } from 'node:os';
import pino from 'pino';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const redisUrl = process.env.REDIS_URL || process.env.VALKEY_URL;
if (!redisUrl) {
  log.error('REDIS_URL/VALKEY_URL not set; cannot start preview-worker.');
  process.exit(1);
}
const redis = new Redis(redisUrl);
const stream = process.env.PREVIEW_STREAM || 'previews:build';
const group = process.env.PREVIEW_CONSUMER_GROUP || 'previewers';
const consumer = process.env.INSTANCE_ID || `worker-${hostname()}-${cryptoRandom()}`;

function cryptoRandom() {
  try {
    return (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10);
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

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

async function waitForRedis(maxRetries = 30, retryDelayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await redis.ping();
      log.info('Redis ping OK');
      return;
    } catch {
      if (i === maxRetries - 1) break;
      await new Promise((r) => setTimeout(r, retryDelayMs));
    }
  }
  log.error('Failed to connect to Redis after retries');
  process.exit(1);
}

async function handle(msgId: string, fields: string[]) {
  const data: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) data[fields[i]] = fields[i + 1];
  log.info({ msgId, data }, 'received preview job');
  const endpoint = process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com';
  const region = process.env.WASABI_REGION || 'us-east-1';
  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: {
    accessKeyId: process.env.WASABI_PREVIEWS_ACCESS_KEY || '',
    secretAccessKey: process.env.WASABI_PREVIEWS_SECRET || ''
  }});
  const masterBucket = data['master_bucket'];
  const masterKey = data['master_key'];
  const previewsBucket = data['previews_bucket'];
  const previewPrefix = data['preview_prefix'];
  if (!masterBucket || !masterKey || !previewsBucket || !previewPrefix) {
    throw new Error('missing required fields');
  }
  // Idempotency: if preview already exists, skip work
  try {
    await s3.send(new HeadObjectCommand({ Bucket: previewsBucket, Key: `${previewPrefix.replace(/\/$/, '')}/index.m3u8` }));
    log.info({ previewPrefix }, 'preview already exists; skipping');
    return;
  } catch {
    // not found → proceed
  }

  // Detect NVENC support
  const ffprobe = spawn('ffmpeg', ['-hide_banner', '-encoders']);
  let supportsNvenc = false;
  ffprobe.stdout.on('data', (buf) => { if (String(buf).includes('h264_nvenc')) supportsNvenc = true; });
  await new Promise((r) => ffprobe.on('close', () => r(null)));
  const vcodec = supportsNvenc ? 'h264_nvenc' : 'libx264';
  const variants = (process.env.PREVIEW_VARIANTS || process.env.PREVIEW_PRESET || '720p')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Create temp dir, run ffmpeg pulling from object URL
  const tmp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'hls-'));
  const masterUrl = await presignGet(masterBucket, masterKey);
  await buildVariants(masterUrl, tmp, vcodec, variants);
  await uploadDir(s3, previewsBucket, previewPrefix, tmp);
  rmSync(tmp, { recursive: true, force: true });
  // Notify backend (best-effort)
  const apiBase = process.env.API_BASE;
  if (apiBase) {
    try {
      await fetch(`${apiBase.replace(/\/$/, '')}/api/preview/callback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ asset_id: data['asset_id'] || undefined, preview_prefix: previewPrefix, ok: true })
      });
    } catch (e) {
      log.warn({ e }, 'callback failed');
    }
  }
}

async function presignGet(bucket: string, key: string): Promise<string> {
  const endpoint = process.env.WASABI_ENDPOINT || '';
  const region = process.env.WASABI_REGION || '';
  const s3 = new S3Client({ region, endpoint, forcePathStyle: true, credentials: {
    accessKeyId: process.env.WASABI_MASTERS_ACCESS_KEY || '',
    secretAccessKey: process.env.WASABI_MASTERS_SECRET || ''
  }});
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3, cmd, { expiresIn: 900 });
}

type Variant = { label: string; height: number; bw: number };

function variantSet(labels: string[]): Variant[] {
  const map: Record<string, Variant> = {
    '360p': { label: '360p', height: 360, bw: 800000 },
    '480p': { label: '480p', height: 480, bw: 1400000 },
    '720p': { label: '720p', height: 720, bw: 2800000 },
    '1080p': { label: '1080p', height: 1080, bw: 5000000 },
  };
  const result: Variant[] = [];
  for (const l of labels) if (map[l]) result.push(map[l]);
  if (result.length === 0) result.push(map['720p']);
  return result;
}

async function buildVariants(inputUrl: string, outRoot: string, vcodec: string, labels: string[]) {
  const vars = variantSet(labels);
  const segSec = process.env.HLS_SEGMENT_SEC || '2';
  for (const v of vars) {
    const outDir = join(outRoot, v.label);
    mkdirSync(outDir, { recursive: true });
    const vfilter = `scale=-2:${v.height}`;
    const args = [
      '-y', '-i', inputUrl, '-vf', vfilter,
      '-c:v', vcodec,
      '-b:v', `${Math.floor(v.bw*0.56)}k`,
      '-maxrate', `${Math.floor(v.bw*0.64)}k`,
      '-bufsize', `${Math.floor(v.bw)}k`,
      '-preset', 'fast',
      '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k',
      '-hls_time', segSec,
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', join(outDir, 'segment_%03d.ts'),
      join(outDir, 'index.m3u8')
    ];
    await ffmpegRun(args);
  }
  // Master playlist
  let master = '#EXTM3U\n';
  for (const v of vars) {
    master += `#EXT-X-STREAM-INF:BANDWIDTH=${v.bw},RESOLUTION=1280x${v.height}\n`;
    master += `${v.label}/index.m3u8\n`;
  }
  writeFileSync(join(outRoot, 'index.m3u8'), master);
}

function jitter(ms: number) { return Math.floor(ms * (0.5 + Math.random())); }
async function ffmpegRun(args: string[]) {
  const maxAttempts = Number(process.env.FFMPEG_RETRIES || 2);
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const p = spawn('ffmpeg', args, { stdio: 'inherit' });
        p.on('exit', (code) => code === 0 ? resolve(null) : reject(new Error(`ffmpeg exited ${code}`)));
      });
      return;
    } catch (e) {
      if (attempt >= maxAttempts) throw e;
      const base = 750 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, jitter(base)));
    }
  }
}

async function uploadDir(s3: S3Client, bucket: string, prefix: string, dir: string) {
  const entries = readdirSync(dir);
  for (const name of entries) {
    const full = join(dir, name);
    const keyBase = `${prefix.replace(/\/$/, '')}/${name}`;
    if (statSync(full).isDirectory()) {
      await uploadDir(s3, bucket, keyBase, full);
      continue;
    }
    const body = readFileSync(full);
    const maxAttempts = Number(process.env.UPLOAD_RETRIES || 3);
    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      try {
        const contentType = name.endsWith('.m3u8') ? 'application/x-mpegURL' : (name.endsWith('.ts') ? 'video/MP2T' : 'application/octet-stream');
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: keyBase, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
        log.info({ key: keyBase }, 'uploaded');
        break;
      } catch (e) {
        if (attempt >= maxAttempts) throw e;
        const base = 400 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, jitter(base)));
      }
    }
  }
}

async function main() {
  await waitForRedis();
  await ensureGroup();
  log.info({ stream, group, consumer }, 'preview worker started');
  // Optional HTTP health endpoint
  const healthPort = process.env.WORKER_HEALTH_PORT ? Number(process.env.WORKER_HEALTH_PORT) : undefined;
  let server: http.Server | undefined;
  if (healthPort && Number.isFinite(healthPort)) {
    server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, service: 'worker' }));
        return;
      }
      res.statusCode = 404; res.end();
    }).listen(healthPort, '0.0.0.0', () => log.info({ port: healthPort }, 'worker health server listening'));
  }
  const shutdown = async () => {
    try { await redis.quit(); } catch {}
    try { server?.close(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  while (true) {
    const res = await redis.xreadgroup('GROUP', group, consumer, 'COUNT', 1, 'BLOCK', 5000, 'STREAMS', stream, '>') as any;
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
