# Growth Plan

Scope
- Define a clear path from MVP → Production scale without re-architecture.

Phases
- Phase A (MVP on App Platform, CPU mode initially):
  - Frontend, Backend, Preview Worker on App Platform (Dockerfiles).
  - Managed Postgres and Redis from DigitalOcean.
  - Edge proxy (optional MVP): presign fallback OK; Droplet recommended soon after launch.
  - If GPU access is unavailable, run Worker in CPU mode with `PREVIEW_PRESET=480p` and `HLS_SEGMENT_SEC=4` to reduce CPU load.

- Phase B (GPU Preview Worker on GPU Droplet — when access granted):
  - Move preview worker to a DigitalOcean GPU Droplet with NVIDIA RTX 4000/6000 Ada or L40S for NVENC.
  - Keep Backend/Frontend on App Platform; retain Managed Postgres/Redis.
  - Deploy worker via Docker with NVIDIA Container Toolkit; use `h264_nvenc` when available; fall back to `libx264`.
  - Autoscaling: begin with manual scale; add simple autoscaler using `XPENDING`/stream depth; provision/destroy GPU Droplets with `doctl`.

- Phase C (Edge NVMe Cache):
  - Deploy Edge on a Droplet with NVMe; Nginx/Caddy proxy cache; cache `.ts` segments; avoid caching `.m3u8`.
  - HMAC signed URLs from Backend; short TTL; range support.

- Phase D (Resilience and Observability):
  - Metrics/tracing (Prometheus/OTel) + alerts on queue depth, error rates, and latency.
  - CI pipelines for build/lint/test and ephemeral preview environments.

- Phase E (Scale-out Options):
  - If needed, move Worker to DOKS (Kubernetes) for horizontal fleet of GPU jobs; or keep per-GPU Droplet design.
  - CDN in front of Edge for global reach.

Data Safety
- Masters are immutable with Object Lock; retention via `OBJECT_LOCK_DEFAULT_DAYS`.
- New application uses new Wasabi buckets; production buckets read-only as per policy.

Migration Posture
- All services are Dockerized; App Platform → Droplet/DOKS migration is container-compatible.
- Env/secrets standardized across targets via `.env.example` and DO App secrets.

Runbook Deltas
- Add autoscaler script for GPU workers (extend `scripts/scale-gpu-workers.sh`) using stream depth.
- Add Nginx/Caddy cache configuration for Edge.
