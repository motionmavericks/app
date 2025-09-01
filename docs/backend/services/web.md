# Service: Web/API

Responsibilities
- Auth/session; presign; promotion orchestration; share management; comments API; signed URL issuance.

Non‑Responsibilities
- Transcoding; cache serving; long‑running jobs.

Key Modules
- auth, presign, promote, signer (HMAC), shares, comments, assets.

API Surface & Limits
- Swagger UI available at `/api/docs`.
- CORS allowlist: set `ALLOWED_ORIGINS` (comma-separated). Defaults to `origin: true` in dev.
- Global rate limit: `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`.
- Per-route limits:
  - `/api/presign`: `RL_PRESIGN_MAX`, `RL_PRESIGN_WINDOW`
  - `/api/promote`: `RL_PROMOTE_MAX`, `RL_PROMOTE_WINDOW`

Observability
- Structured logs, request tracing; metrics for latency and error rate.
