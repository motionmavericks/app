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
