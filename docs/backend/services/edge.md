# Service: Edge Cache

Responsibilities
- Serve previews from NVMe; hydrate from previews bucket on miss; validate signed URLs.

Behavior
- Signature verification (HMAC) on path/query; cache key = `{sha}/{variant}`.
- On miss, fetch object → write `.part` → fsync → rename; update index.

Security
- Public HTTPS only; no access to masters; rate limit by IP.
