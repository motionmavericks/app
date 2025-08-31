# Endpoint: POST /api/presign

Purpose
- Generate a presigned PUT URL for uploading to the Staging bucket.

Request
- Content-Type: application/json
- Body:
```
{
  "key": "staging/path/filename.ext",
  "contentType": "video/mp4",
  "bucket": "optional-override",
  "expires": 900
}
```

Response 200
```
{
  "url": "https://...",
  "bucket": "bucket-name",
  "key": "staging/path/filename.ext",
  "expiresIn": 900
}
```

Errors
- 400: invalid json or missing key
- 501: server not configured (missing env vars)
- 500: presign failure

Env
- `WASABI_ENDPOINT`, `WASABI_REGION`, `WASABI_STAGING_ACCESS_KEY`, `WASABI_STAGING_SECRET`, `STAGING_BUCKET`

Acceptance
- With valid env vars, request returns a URL that accepts a PUT with specified `Content-Type`.
