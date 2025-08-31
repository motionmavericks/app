# Deployment (DigitalOcean)

Topology
- Web/API, GPU workers (autoscaled), Edge Cache (NVMe), Managed Postgres, Managed Redis, VPC + firewalls.

Sizing (initial)
- Web: 2–4 vCPU / 4–8 GB.
- Edge: 8 vCPU / 16–32 GB / 800 GB NVMe.
- Worker: C‑Optimized 8–16 vCPU / 16–32 GB (GPU on‑demand if available).

DNS
- `app.<domain>` → web, `edge.<domain>` → edge, `api.<domain>` → web.

Ports
- Public: 80/443 web & edge. Private: DB/Redis via VPC only.

Region & Networking
- Region: choose close to Wasabi region (`ap-southeast-2`). Use DO VPC; no public ingress for DB/Redis.

Backups
- Managed PG automated backups to `backups` bucket; weekly restore drill. Metrics/logs shipped to centralized store.

Firewalls
- Allowlist outbound HTTPS to Wasabi endpoints only from workers/web; deny all egress from edge except previews bucket.
