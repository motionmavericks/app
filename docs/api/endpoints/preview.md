# Endpoint: Preview Build

POST /api/preview
- Input: `{ versionSha }`
- Output: `{ jobId }`

Behavior
- Enqueues GPU job if preview not present; otherwise returns "already-ready".

Errors
- 404 version not found; 409 already enqueued; 500 queue failure.

Acceptance
- Idempotent; job appears in queue; events notify UI.
