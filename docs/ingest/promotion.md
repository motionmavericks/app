# Promotion Flow (Staging → Masters)

Steps
1) Upload to staging via presigned multipart.
2) AV scan + MediaInfo + checksum.
3) Human review assigns client/project/date/collection.
4) Server copy to masters with Object Lock and metadata; write manifest row.
5) Enqueue preview build.

API Sketch
- `POST /api/presign` → multipart URLs
- `POST /api/promote` → {stagingKey, mapping}

Acceptance
- Idempotent promotions; size and sha256 recorded; error handling with retries.
