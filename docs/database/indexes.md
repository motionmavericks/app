# Index Strategy

General
- PK on `id` for all tables.
- FK columns indexed (`project_id`, `asset_id`, etc.).

Hot Paths
- `assets(project_id, created_at DESC)` for dashboards.
- `comments(asset_id, timecode_frames)` for player scrubbing.
- `versions(sha256)` unique for preview lookup; `versions(asset_id, created_at DESC)`.
- GIN on `versions.meta` paths used in filters (codec, fps, resolution).
- FTS on `assets.title`, `comments.body`.

Partial/Conditional
- `shares(token)` unique; index `expires_at WHERE expires_at IS NOT NULL`.

Maintenance
- Autovacuum tuned for large write tables (activities, jobs).
