# Endpoint: Preview Build

POST /api/preview
- Input:
```
{
  "asset_id": "optional-uuid",
  "master_bucket": "...",
  "master_key": "...",
  "previews_bucket": "...",
  "preview_prefix": "asset/<id>/default"
}
```
- Output: `{ "enqueued": true, "id": "job-id" }`

Behavior
- Enqueues GPU job if preview not present; otherwise returns "already-ready".

Errors
- 400 validation error; 501 queue not configured; 500 queue failure.

Acceptance
- Idempotent; job appears in queue; events notify UI.
