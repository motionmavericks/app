# Job Queues

Queues
- `preview:build` (high): build HLS/MP4.
- `preview:poster` (low): poster thumbnails.
- `qc:loudness` (low): LUFS/TP analysis.

Retry Policy
- Exponential backoff (5s → 5m, max 5 tries). DLQ topic for manual review.

Idempotency
- Keyed by `versionSha`; re-queues are no-ops if outputs exist.
