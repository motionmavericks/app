# Configuration Matrix (Env Vars)

Current (Frontend)
- `NEXT_PUBLIC_API_BASE`: base URL for backend API (e.g., https://api.example.com)
- `NEXT_PUBLIC_EDGE_BASE`: public base URL for edge cache (e.g., https://edge.example.com)
- Standard Next.js: only `NEXT_PUBLIC_*` are exposed to the browser.

Backend/API
- `POSTGRES_URL`, `REDIS_URL`
- `WASABI_ENDPOINT`, `WASABI_REGION`
- `WASABI_STAGING_ACCESS_KEY`, `WASABI_STAGING_SECRET`
- `WASABI_MASTERS_ACCESS_KEY`, `WASABI_MASTERS_SECRET` (promotion only)
- `MASTERS_BUCKET`, `PREVIEWS_BUCKET`, `STAGING_BUCKET`, `DOCS_BUCKET`, `BACKUPS_BUCKET`
- `OBJECT_LOCK_DEFAULT_DAYS` (e.g., 365)
- `EDGE_SIGNING_KEY` (HMAC secret)
- `EDGE_PUBLIC_BASE` (e.g., https://edge.example.com)
- `AUTH_SECRET`, `AUTH_PROVIDERS...`

Workers (Preview)
- `WASABI_MASTERS_ACCESS_KEY/SECRET` (read), `WASABI_PREVIEWS_ACCESS_KEY/SECRET` (write)
- `PREVIEW_PRESET` (720p), `HLS_SEGMENT_SEC` (2)
- `QUEUE_CONCURRENCY`, `GPU_DEVICE`

Edge Cache
- `EDGE_SIGNING_KEY`, `CACHE_PATH`, `CACHE_MAX_BYTES`, `CACHE_TTL_DAYS`
- `PREVIEWS_BUCKET`, `WASABI_ENDPOINT`, `WASABI_REGION` (read-only)

Acceptance
- Frontend boots with `frontend/.env.local` or defaults.
- When backend exists, each service starts with its `.env` derived from `.env.example` (no secrets in VCS).

Templates
- `frontend/.env.example`
- `backend/.env.example`
- `worker/.env.example`
- `edge/.env.example`
- `database/.env.example`

Notes
- The example files are kept up-to-date with the running services. Use them as a starting point in local dev and map the same variables as App Platform envs/secrets in production.
