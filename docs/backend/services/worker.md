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

Runtime Notes
- Image includes FFmpeg (Alpine package). Hardware encoder NVENC is detected at runtime; falls back to `libx264` if unavailable.
- Redis Streams consumer group: `PREVIEW_STREAM` (default `previews:build`), `PREVIEW_CONSUMER_GROUP` (default `previewers`).
- Configure HLS via `PREVIEW_PRESET` (e.g., `720p`) or `PREVIEW_VARIANTS` (comma-separated labels).
