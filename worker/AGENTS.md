# Worker AGENTS.md

Purpose
- Guide agents contributing to the preview worker: Redis Streams consumption, ffmpeg/NVENC, Wasabi S3 I/O, GPU droplets.

Run
- Dev: `make worker-dev`
- Build: `make worker-build`

Queue
- Stream: `PREVIEW_STREAM` (default `previews:build`), group `PREVIEW_CONSUMER_GROUP` (default `previewers`)
- Fields: `master_bucket`, `master_key`, `previews_bucket`, `preview_prefix`, optional `asset_id`

Behavior
- Detect NVENC; fallback to `libx264`.
- Jittered exponential backoff for ffmpeg and S3 uploads.
- Idempotency: skip if `${preview_prefix}/index.m3u8` exists.
- SSE-S3: set `ServerSideEncryption: AES256` for uploads.
- Optional health: set `WORKER_HEALTH_PORT` and GET `/health` returns `{ ok: true }`.

Environment
- Redis: `REDIS_URL` (required). Use Valkey/Redis TLS URI, e.g., `rediss://user:pass@host:port`.
  - Note: worker reads `process.env.REDIS_URL` directly; ensure the App Platform secret is set.
- Wasabi: `WASABI_ENDPOINT`, `WASABI_REGION`, Masters/Previews creds + buckets
- HLS: `PREVIEW_PRESET` or `PREVIEW_VARIANTS`, `HLS_SEGMENT_SEC`

GPU
- Provision on demand: `scripts/provision_gpu_worker.sh`
- Reserved IP lifecycle: `scripts/gpu_reserved_ip.sh` (assign/unassign)

Do/Don’t
- Do: keep operations idempotent and resumable.
- Do: log key events (received job, uploaded segment, errors) without leaking secrets.
- Don’t: oversubscribe GPU; tune `QUEUE_CONCURRENCY` conservatively.
- Note: Worker exits at startup if `REDIS_URL` is unset to avoid connection spam.
