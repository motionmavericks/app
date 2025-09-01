# Backend AGENTS.md

Purpose
- Guide agents contributing to the Web/API service: endpoints, env, limits, docs, and testing.

Run
- Dev: `make backend-dev` (http://localhost:3000)
- Build: `make backend-build`
- Migrate: `make backend-migrate` (uses `database/schema.sql`)
- Docs: Swagger at `/api/docs`

Endpoints (selected)
- `GET /api/health`: returns `{ ok: true, db?: bool, redis?: bool }`
- `POST /api/presign`: returns S3 PUT URL for Staging
- `POST /api/promote`: copy Staging→Masters; enqueue preview
- `POST /api/preview`: enqueue preview build job
- `GET /api/preview/status?prefix=...`: readiness check
- `POST /api/sign-preview`: returns signed Edge URL or presigned fallback
- `GET /api/assets`, `GET /api/assets/:id`

Environment
- Wasabi: `WASABI_ENDPOINT`, `WASABI_REGION`, Staging/Masters/Previews credentials and buckets
- DB/Cache: `POSTGRES_URL`, `REDIS_URL`
- Edge signing: `EDGE_SIGNING_KEY` (HMAC), `EDGE_PUBLIC_BASE`
- CORS/limits: `ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`
- Per-route limits: `RL_PRESIGN_MAX/_WINDOW`, `RL_PROMOTE_MAX/_WINDOW`

Security
- Never commit secrets; rely on env/secrets manager.
- Use signed URLs only; no public ACLs.
- SSE-S3 for Masters copy is enforced in code.

Testing
- Unit tests: `backend/tests` with Vitest; run `npm test -s` in `backend/`
- Add tests for new helpers under `src/` mirrored in `tests/`

Do/Don’t
- Do: update `docs/backend/services/web.md` when adding/modifying endpoints.
- Do: keep Swagger in sync, validate inputs with Zod.
- Don’t: return stack traces; log details safely.

