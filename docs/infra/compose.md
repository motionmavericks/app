# Docker Compose Plan (Draft)

Status
- Today: Frontend runs locally via `make dev`; no compose stack exists.
- Future: introduce compose when backend/worker/edge services are implemented. See `architecture/services-plan.md` for service inventory.

Planned Services
- db: postgres:16 (local only; managed in prod)
- redis: redis:7
- backend: Next.js server or Node service (ports 3000)
- frontend: Next.js UI (ports 3001)
- worker: GPU previews (ffmpeg/NVENC)
- edge: caddy with volume `/var/lib/edge-cache`

Volumes
- `pgdata`, `redisdata`, `edgecache`

Networks
- `app-net` shared network

Env
- Mount `.env` files per service as per `docs/configuration/env.md`.

Acceptance
- When implemented, `docker compose up` brings stack up; UI at 3001; API at 3000.
