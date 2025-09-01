# CI/CD

Build
- Selective builds using `dorny/paths-filter`:
  - Backend, Worker, Frontend built only when their folders change.
- Tags:
  - All services push `:latest` and `:sha-${GITHUB_SHA}` when built.

Deploy
- Deploy uses the live App spec from DigitalOcean to preserve secrets (e.g., `REDIS_URL`).
- Image tags are updated only for repositories where the `:sha-${GITHUB_SHA}` tag exists in DOCR (checked via `doctl registry repository list-tags`). This prevents failed deploys when a service wasn't rebuilt.
  - Backend/Worker/Frontend are bumped to `:sha-${GITHUB_SHA}` when the tag exists. A manual input `worker_only` forces only the preview-worker update.
- No-op deploys are skipped unless manually dispatched.

Secrets
- Use DO App Platform Secrets/1Password; never commit keys. Rotate every 90 days.

Envs
- `POSTGRES_URL`, `REDIS_URL`, `WASABI_*`, `OBJECT_LOCK_*`, `CACHE_*`.

Promotion
- Blue/green or rolling for web/edge; workers drain queues on deploy.
