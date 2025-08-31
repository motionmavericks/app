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
- Contains services: `frontend`, `backend`, `preview-worker`, and attachments for Managed Postgres and Redis.
- Customize domains and secrets, then create/update the app:
  - `doctl apps create --spec deploy/do-app.yaml`
  - `doctl apps update <APP_ID> --spec deploy/do-app.yaml`

Container Images
- Each service includes a Dockerfile (`frontend/Dockerfile`, `backend/Dockerfile`, `worker/Dockerfile`). App Platform builds from repo by default.

Environment
- Map Managed DB/Redis connection strings to `POSTGRES_URL` and `REDIS_URL` in App Platform.
- Fill Wasabi keys and bucket names as secrets for backend and worker.
- Frontend uses `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_EDGE_BASE` for routing.

Edge Cache (Droplet)
- Provision a Droplet with NVMe storage; install Caddy/Nginx; configure on-disk cache (`edge/.env.example`).
- Restrict egress to Wasabi Previews endpoint; require HMAC signed URLs.

Zero Downtime
- Enable health checks: `/health` for backend. Set timeouts and autoscaling policies.

Post-Deploy Checks
- Frontend resolves and loads.
- Backend `/health` returns `{ ok: true }`.
- Presign flow returns valid PUT URL; PUT succeeds; object appears in Staging bucket.
