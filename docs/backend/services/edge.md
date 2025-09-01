# Service: Edge Cache

Responsibilities
- Serve previews from NVMe; hydrate from previews bucket on miss; validate signed URLs.

Behavior
- Signature verification (HMAC) on path/query; cache key = `{sha}/{variant}`.
- On miss, fetch object → write `.part` → fsync → rename; update index.

Security
- Public HTTPS only; no access to masters; rate limit by IP.
- HMAC signing: `EDGE_SIGNING_KEY` (min length 32) used to validate `exp`+`sig` for `/s/*`.
- Path sanitization: only allow `[A-Za-z0-9._\-/]` to mitigate traversal/SSRF.
- Timeouts & retry: upstream fetch uses abortable timeout (default `FETCH_TIMEOUT_MS=10000`) and one retry.
- Rate limits: configure via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW`.
