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
- Contains services: `frontend`, `backend`, `preview-worker`, and attachments for Managed Postgres and Redis. Health checks are configured for `frontend` and `backend`.
- Customize domains and secrets, then create/update the app:
  - `doctl apps create --spec deploy/do-app.yaml`
  - `doctl apps update <APP_ID> --spec deploy/do-app.yaml`

Container Images
- Each service includes a Dockerfile (`frontend/Dockerfile`, `backend/Dockerfile`, `worker/Dockerfile`). App Platform builds from repo by default. The worker image installs FFmpeg in its runtime stage.

Environment
- Map Managed DB/Redis connection strings to `POSTGRES_URL` and `REDIS_URL` in App Platform.
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

MCP (DigitalOcean)
- The MCP server is launched via `scripts/mcp_digitalocean.sh`, which sources the DO token from `DIGITALOCEAN_ACCESS_TOKEN` or `~/.config/doctl/config.yaml`.
- Restart Codex CLI to reload MCP servers after config changes. Use MCP to inspect apps/services during rollout.

GPU Workers (Droplets)
- See `docs/deploy/do-gpu-workers.md` for GPU provisioning in `nyc2`/`tor1`.
- Scripts: `scripts/provision_gpu_worker.sh` (provision + systemd) and `scripts/gpu_reserved_ip.sh` (reserved IP lifecycle).
