# Service: Workers

Responsibilities
- Transcode previews (HLS/MP4), poster, waveform; compute QC metrics.

Queues
- `preview:build` with `{ sha, sourceKey }`; delayed retries; dead-letter queue.

Concurrency
- Tune per preset; cap CPU/GPU usage; per‑node max parallel jobs.

Artifacts
- Write to previews bucket with atomic rename; emit events.

Health
- Heartbeats; queue depth; success/failure rates.
- Optional HTTP health endpoint: set `WORKER_HEALTH_PORT` and GET `/health` returns `{ ok: true }`.

Runtime Notes
- Image includes FFmpeg (Alpine package). Hardware encoder NVENC is detected at runtime; falls back to `libx264` if unavailable.
- Redis Streams consumer group: `PREVIEW_STREAM` (default `previews:build`), `PREVIEW_CONSUMER_GROUP` (default `previewers`).
- Configure HLS via `PREVIEW_PRESET` (e.g., `720p`) or `PREVIEW_VARIANTS` (comma-separated labels).
- Idempotency: worker skips jobs if `index.m3u8` already exists at the preview prefix.
- Backoff: ffmpeg and upload operations use jittered exponential backoff.
- SSE: uploads to Previews include `ServerSideEncryption: AES256`.

GPU Workers
- Regions: DO GPU droplets available in `nyc2` and `tor1`. Latency to `ap-southeast-2` Wasabi is higher; consider APAC GPU provider if needed.
- Provisioning: `scripts/provision_gpu_worker.sh` (cloud‑init installs Node/ffmpeg, builds worker, starts systemd service).
- Reserved IP: allocate with `scripts/gpu_reserved_ip.sh` and assign to the active GPU droplet for stable addressing.
- Autoscaling: monitor Redis stream depth and spin up/down GPU droplets on demand.
