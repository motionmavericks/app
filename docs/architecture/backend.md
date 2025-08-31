# Backend Architecture

Goals & Constraints
- Immutable masters in Wasabi; previews ephemeral; low egress; fast playback.
- Read-only onboarding of legacy buckets; non-destructive migration.
- Multi-tenant (org/client/project) with RBAC; auditable mutations.

Services (monorepo paths)
- Web/API (`apps/web`): Auth, presign, promotion orchestration, shares, comments.
- Workers (`apps/worker`): BullMQ consumers for preview builds (ffmpeg/NVENC), thumbnails, waveforms, QC metrics.
- Edge Cache (`apps/edge`): Caddy/Nginx serving NVMe previews; pulls from previews bucket on miss.
- Storage: Wasabi buckets (masters, previews, staging, docs); Managed Postgres; Managed Redis.

Data Model (summary)
- See data-model/schema.md. Key tables: organizations, clients, projects, collections, assets, versions, sidecars, shares, comments, jobs, activities.
- Indexes: `versions(sha256)`, `assets(project_id, created_at)`, `comments(asset_id, timecode)`, `shares(token)`.

APIs & Contracts
- Presign: `POST /api/presign {name, size, type}` → presigned multipart URLs (staging).
- Promote: `POST /api/promote {stagingKey, mapping, sha256}` → copy to masters with Object Lock → manifest row.
- Preview: `POST /api/preview {versionSha}` → enqueue build; idempotent.
- Assets: `GET /api/assets/:id` → asset, versions, metadata (EBUCore JSON), shares.
- Comments: CRUD with timecode; WebSocket channel for live updates.

AuthN/Z
- Auth.js session; project membership via join table. Roles: admin, editor, reviewer, viewer.
- Authorization at server boundaries; all writes check role + project scope. Shares bypass auth but enforce token and policy.

Ingest & Promotion
- Staging uploads (client/NAS/C2C) via presigned multipart; optional AV scan.
- Promotion service validates mapping and sha256; S3 copy to masters, sets Object Lock headers; writes manifest and activity log.

Preview Pipeline
- Job queue (BullMQ) per rendition; concurrency tuned by codec.
- ffmpeg NVENC presets (see previews/hls.md). Outputs to previews bucket under `hls/{sha}` and `mp4/{sha}.mp4`.
- Events: job state → notify UI; edges may prefetch hot manifests.

Edge Cache & Signed URLs
- Web/API issues short-lived signed URLs for manifests/segments with claim `{sha, exp, scope}`.
- Edge validates signature (shared secret) and serves from NVMe; on miss fetches from previews bucket, persists to NVMe, then serves.

Shares
- `shares` table stores policy: password, allow_download, expiry, watermark template.
- Tokens are unguessable (≥128-bit). Audit every access (ip, ua, asset, time).

Metadata & QC
- MediaInfo probe + EBU R128 metrics on ingest/promotion stored in `versions.meta` (JSONB).
- Optional IMF/AS-11 detection; link CPL/XML as Sidecar entries.

Observability
- Structured logs (request id, asset id). Metrics: queue depth, build time, cache hit, egress. Traces around promotion + preview builds.

Security & IAM
- uploader: staging Put only; promoter: masters Put; gpu-writer: masters Get + previews Put; edge-reader: previews Get; backup-writer: backups Put.
- Object Lock (governance) on masters; deny deletes; rate limits on mutation endpoints; input validation (Zod).

Scaling & Resilience
- Web horizontally scales (stateless); workers scale by queue depth; edge scales by traffic with sticky DNS.
- Backpressure: if queue age grows, UI shows "building previews" + throttles; overflow policies drop non-critical renditions first.

Migrations & Versioning
- DB migrations via Prisma/Drizzle (TBD). Backfill tasks for digest computation and metadata normalization.

Testing Strategy
- Unit for services (presign, signer, policy checks). Integration for promotion + preview build on fixtures. E2E for upload→promote→playback→share.

Configuration (env)
- WASABI_* (endpoint, region, access/secret for each role via assumed creds)
- DB/Redis URLs, JWT/Session secrets, EDGE_SIGNING_KEY, PREVIEW_TTL, OBJECT_LOCK_DEFAULT_DAYS.

Failure Modes
- Wasabi outage: see runbooks/wasabi-outage.md. Cache continues serving hot previews; promotions paused.
- GPU backlog: see runbooks/gpu-backlog.md. Autoscale; prioritize.
- Cache full: see runbooks/cache-full.md. Trim; adjust TTL.
