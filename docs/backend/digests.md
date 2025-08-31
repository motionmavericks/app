# Version Digests (sha256)

Why
- Content-addressed `versionSha` provides dedupe, integrity, and stable preview keys.

When
- On upload (client can compute optimistically) and on promotion (server verifies).

How
- For local files: stream through sha256 hasher.
- For staging → masters: verify declared sha256 by re-reading from staging (range-chunked 64–128 MB) and hashing.
- For legacy objects: compute once during indexing; store in DB and object metadata.

Performance
- Use multipart range reads to balance memory and throughput; skip hashing if metadata already trusted and verified.

Acceptance
- Every `version` row has a valid 64‑hex sha256; collisions are treated as identical content.
