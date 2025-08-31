# CI/CD

Build
- Docker images for web, worker, edge. Lint, typecheck, tests.

Secrets
- Use DO Secrets/1Password; never commit keys. Rotate every 90 days.

Envs
- `POSTGRES_URL`, `REDIS_URL`, `WASABI_*`, `OBJECT_LOCK_*`, `CACHE_*`.

Promotion
- Blue/green or rolling for web/edge; workers drain queues on deploy.
