# Endpoint: Promote to Masters

POST /api/promote
- Input: `{ stagingKey, mapping: { client, project, shootDate, collection }, sha256 }`
- Output: `{ masterKey, manifestId }`

Behavior
- Verifies checksum, performs server-side copy to masters with Object Lock headers.
- Writes manifest row and activity log; idempotent by `(stagingKey, sha256)`.

Errors
- 400 invalid mapping; 409 checksum mismatch; 403 not permitted.

Acceptance
- Masters object present with retention headers; manifest row created.
