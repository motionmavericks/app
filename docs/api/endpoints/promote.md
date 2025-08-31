# Endpoint: Promote to Masters

POST /api/promote
- Input (minimum): `{ stagingKey }`
- Optional fields: `{ mapping: {...}, sha256, masterKey, previewPrefix }`
- Output: `{ masterKey, jobId, assetId }`

Behavior
- Performs server-side copy from Staging → Masters with optional Object Lock retention.
- If queue configured, enqueues preview build for the promoted object.
- If DB present, records a new version row.

Errors
- 400 invalid mapping; 409 checksum mismatch; 403 not permitted.

Acceptance
- Masters object present with retention headers (if configured); preview job enqueued; version row recorded when DB present.
