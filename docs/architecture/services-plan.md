# Service Plan

Status: Draft for implementation. Defines the services, boundaries, and connections required to run the application suite end-to-end.

## Service Taxonomy
- Frontend: Next.js app for user-facing experience.
- API: Web/API service for auth, assets, comments, presign, promotion orchestration.
- Ingest: Upload handling and staging validation.
- Promotion: Server-side object copy to Masters with object lock and checksums.
- Preview Worker: GPU ffmpeg pipeline to generate HLS, thumbnails, waveforms.
- Edge Cache: Signed, cache-first edge for previews delivery.
- DB: Postgres for core relational data.
- Cache/Queue: Redis for caching, rate limiting, and lightweight job queue (XADD/Consumer Groups) in early phases.
- Object Storage: Wasabi buckets (staging, masters, previews, docs, backups).
- Observability: OTel Collector, Prometheus, Loki, Grafana.
- Auth: OIDC provider / NextAuth integration.

## Connectivity Overview
- External → Frontend (HTTP 3001) and Edge (HTTPS 443).
- Frontend → API (HTTP 3000) using `NEXT_PUBLIC_EDGE_BASE`/`API_BASE`.
- API → Postgres (5432), Redis (6379), Wasabi (HTTPS), Queue (Redis streams), Auth Provider (OIDC/OAuth).
- API → emits jobs to Redis streams for Preview Worker.
- Ingest (client) → Wasabi Staging via presigned URLs from API.
- Promotion → Wasabi Masters (server copy) and enqueues preview build.
- Preview Worker → Wasabi Previews; notifies Edge to purge/hydrate.
- Edge → Previews bucket (read-only signed URL or SDK) with HMAC signing.

## Frontend (Next.js)
- Purpose: User interface for upload, review, and management.
- Ingress: HTTP `:3001` in dev; served behind CDN in prod.
- Egress: API base URL, Edge base URL.
- Config: `NEXT_PUBLIC_EDGE_BASE`, future `NEXT_PUBLIC_API_BASE`.
- Scaling: Horizontal; static assets on CDN; ISR where applicable.
- SLOs: p95 TTFB ≤ 200ms for cached pages; availability ≥ 99.9%.

## API (Web)
- Purpose: Auth, presign, asset and comment CRUD, promotion orchestrations.
- Ingress: HTTP `:3000`.
- Data: Postgres (assets, versions, comments, shares), Redis (sessions, cache).
- Storage: Wasabi via SDK.
- Queue: Redis Streams (phase 1-2), optional SQS later.
- Key Endpoints:
  - POST `/api/presign` (staging uploads)
  - POST `/api/promote` (server copy → masters)
  - POST `/api/preview` (enqueue build)
  - GET `/api/assets`, `/api/assets/:id`, `/api/comments`, `/api/shares/*`
- Security: NextAuth/OIDC; HMAC for edge signing; RBAC checks.
- SLOs: Availability ≥ 99.9%; p95 latency ≤ 300ms for typical CRUD.

## Ingest
- Purpose: Client uploads to Staging using presigned PUT; AV scan hook optional.
- Flow: UI → API `/api/presign` → direct PUT to Wasabi Staging.
- Validation: Size/type whitelist; metadata manifest optional.

## Promotion
- Purpose: Immutable copy from Staging → Masters with Object Lock default.
- Steps:
  - Verify size/etag; calculate checksum (server-side or worker).
  - S3 copy with appropriate storage class and retention.
  - Record asset version in Postgres; emit preview job.
- Failure Handling: retry with idempotency key; alert on checksum mismatch.

## Preview Worker (GPU)
- Purpose: Generate HLS, thumbnails, waveforms.
- Ingress: Redis stream `previews:build`.
- Egress: Wasabi Previews bucket; optional callback to API.
- Compute: NVENC-capable nodes; concurrency controlled by `QUEUE_CONCURRENCY` and GPU assignment.
- Artifacts: HLS master/variants, `/thumbs/*`, `/waveforms/*` under asset prefix.
- SLOs: 1080p, 10-minute clip built ≤ 90s on GPU tier.

## Edge Cache
- Purpose: Low-latency delivery and offload.
- Ingress: Public HTTPS with signed URLs.
- Egress: Previews bucket (read-only); hydrate on miss.
- Implementation: Caddy/Nginx with on-disk cache; purge API for targeted invalidation.
- Security: HMAC `EDGE_SIGNING_KEY`; short TTL; range requests enabled.

## Data Stores
- Postgres: assets, versions, users, comments, shares, audit logs.
- Redis: cache, sessions, rate limits, lightweight queues (streams).
- Wasabi: staging (mutable), masters (immutable + object lock), previews (mutable), docs, backups.

## Observability
- Metrics: Prometheus (API, workers, edge) with SLIs.
- Traces: OpenTelemetry traces from Frontend (optional), API, workers.
- Logs: Loki via promtail.
- Dashboards: Grafana; alerts for saturation, latency, error rates, and queue depth.

## Security & IAM
- Separate access keys per bucket/function with least privilege.
- Object Lock on Masters with default retention; legal hold path.
- Signed URLs for Edge; presigned upload for Staging.
- Secrets via platform secret manager; no secrets in VCS.

## Phased Rollout
- Phase 0: Frontend only (current). Acceptance: `make dev` and basic nav.
- Phase 1: API minimal (presign). Add Postgres, Redis. Acceptance: Upload to Staging works.
- Phase 2: Promotion path. Acceptance: Assets promoted to Masters with retention.
- Phase 3: Preview pipeline + Edge. Acceptance: First-playback path hydrates edge and serves HLS.
- Phase 4: Auth, shares, comments, SLOs, and runbooks; Observability complete.

## Local Dev Topology
- Start with Frontend + mock API stubs.
- Compose when API lands: Postgres, Redis, API, Frontend. Workers and Edge optional.
- Example Ports: API `3000`, Frontend `3001`, Postgres `5432`, Redis `6379`, Edge `8080`.

## Configuration (Selected)
- Frontend: `NEXT_PUBLIC_EDGE_BASE`, future `NEXT_PUBLIC_API_BASE`.
- API: `POSTGRES_URL`, `REDIS_URL`, `WASABI_ENDPOINT`, `WASABI_REGION`, per-bucket credentials, `EDGE_SIGNING_KEY`.
- Worker: `QUEUE_CONCURRENCY`, `GPU_DEVICE`, per-bucket credentials.
- Edge: `EDGE_SIGNING_KEY`, `CACHE_PATH`, `CACHE_MAX_BYTES`, `CACHE_TTL_DAYS`.

## Acceptance (End-to-End)
- Upload an asset → presign to Staging succeeds.
- Promote asset → Masters object locked; DB version recorded.
- Preview job builds → HLS + thumbs present in Previews.
- Edge serves HLS with signed URLs and supports range requests.
- UI displays playable preview and comment thread.
