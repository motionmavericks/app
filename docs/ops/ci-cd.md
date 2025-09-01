# CI/CD

Build
- Selective builds using `dorny/paths-filter`:
  - Backend, Worker, Frontend built only when their folders change.
- Tags:
  - All services push `:latest` and `:sha-${GITHUB_SHA}` when built.

Deploy
- Deploy uses the live App spec from DigitalOcean to preserve secrets (e.g., `REDIS_URL`).
- Image tags are updated only for changed services to trigger rollouts:
  - Backend/Worker/Frontend → `:sha-${GITHUB_SHA}` when changed.
- No-op deploys are skipped unless manually dispatched.

Secrets
- Use DO App Platform Secrets/1Password; never commit keys. Rotate every 90 days.

Envs
- `POSTGRES_URL`, `REDIS_URL`, `WASABI_*`, `OBJECT_LOCK_*`, `CACHE_*`.

Promotion
- Blue/green or rolling for web/edge; workers drain queues on deploy.
