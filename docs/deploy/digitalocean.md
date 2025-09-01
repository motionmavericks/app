# Deployment (DigitalOcean)

Topology
- Frontend (App Platform), Backend API (App Platform), Preview Worker (App Platform or Droplet), Edge Cache (Droplet with NVMe), Managed Postgres, Managed Redis, VPC + firewalls.

Sizing (initial)
- Web: 2–4 vCPU / 4–8 GB.
- Edge: 8 vCPU / 16–32 GB / 800 GB NVMe.
- Worker: C‑Optimized 8–16 vCPU / 16–32 GB (GPU on‑demand if available).

DNS
- `app.<domain>` → web, `edge.<domain>` → edge, `api.<domain>` → web.

Ports
- Public: 80/443 web & edge. Private: DB/Redis via VPC only.

Region & Networking
- Region: choose close to Wasabi region (e.g., `ap-southeast-2`). Use DO VPC; no public ingress for DB/Redis.

Backups
- Managed PG automated backups to `backups` bucket; weekly restore drill. Metrics/logs shipped to centralized store.

Firewalls
- Allowlist outbound HTTPS to Wasabi endpoints only from workers/web; deny all egress from edge except previews bucket.

App Platform Spec
- Spec file: `deploy/do-app.yaml`
- Contains services: `frontend`, `backend`, and a `worker` (`preview-worker`). Health checks are configured for `frontend` and `backend`.
- DOCR images: when `registry_type: DOCR`, omit `image.registry`; set `repository` and `tag`. CI pins image tags to `sha-<commit>` only for services that changed.
- Redis: set `REDIS_URL` as a secret on backend and preview-worker (e.g., Valkey `rediss://…`). Scope should be `RUN_TIME` (build does not need it). Do not include a `databases:` block for non‑production Redis. The worker also accepts `VALKEY_URL` as an alias.
- Create/update the app:
  - First-time create from `deploy/do-app.yaml`.
  - Subsequent deploys fetch the live spec via `doctl apps get` and update only image tags of changed services to preserve secrets (e.g., `REDIS_URL`).
  - Use `scripts/do_app_set_redis.sh` to set/update `REDIS_URL` with scope `RUN_TIME` safely against the live spec.

Container Images
- Each service includes a Dockerfile (`frontend/Dockerfile`, `backend/Dockerfile`, `worker/Dockerfile`).
- CI builds/pushes images to DOCR; the deploy workflow pins backend to the exact commit tag.

Environment
- Map Managed Postgres connection to `POSTGRES_URL`.
- Set `REDIS_URL` (Valkey/Redis, `rediss://…`) on backend and preview-worker as secrets.
- Fill Wasabi keys and bucket names as secrets for backend and worker.
- Frontend uses `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_EDGE_BASE` for routing.
- Backend sets `EDGE_PUBLIC_BASE` (edge domain) and `EDGE_SIGNING_KEY` to enable signed playback URLs.
- Rate limits and CORS (optional): set `ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`, `RL_PRESIGN_*`, `RL_PROMOTE_*` for backend; `RATE_LIMIT_*` and `FETCH_TIMEOUT_MS` for edge.

Edge Cache (Droplet)
- Optional for MVP. If omitted, backend returns presigned Wasabi URLs and the player still works.
- For production, provision a Droplet with NVMe storage; install Caddy/Nginx; configure on-disk cache (`edge/.env.example`).
- Restrict egress to Wasabi Previews endpoint; require HMAC signed URLs.

Zero Downtime
- Enable health checks: `/api/health` for backend. Set timeouts and autoscaling policies.
 - Frontend health check at `/` (App Platform spec includes these).

Post-Deploy Checks
- Frontend resolves and loads.
- Backend `/api/health` returns `{ ok: true }`.
- Presign flow returns valid PUT URL; PUT succeeds; object appears in Staging bucket.
- Promote copies to Masters; preview worker builds; signed playback works (edge or fallback).
- API docs available at `/api/docs` on backend.
 - Logs:
   - `doctl apps logs <APP_ID> backend --type deploy --tail 200`
   - `doctl apps logs <APP_ID> preview-worker --type run --tail 200`

MCP (DigitalOcean)
- The MCP server is launched via `scripts/mcp_digitalocean.sh`, which sources the DO token from `DIGITALOCEAN_ACCESS_TOKEN` or `~/.config/doctl/config.yaml`.
- Restart Codex CLI to reload MCP servers after config changes. Use MCP to inspect apps/services during rollout.

GPU Workers (Droplets)
- See `docs/deploy/do-gpu-workers.md` for GPU provisioning in `nyc2`/`tor1`.
- Scripts: `scripts/provision_gpu_worker.sh` (provision + systemd) and `scripts/gpu_reserved_ip.sh` (reserved IP lifecycle).
