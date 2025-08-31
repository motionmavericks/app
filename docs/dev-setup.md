# Dev Setup

Status: Frontend scaffolded; backend and preview worker scaffolded. Backend/worker are optional during early UI dev.

Prereqs
- Node 20+, npm 10+.
- Optional: Python 3.11+ (for `tools/` scripts).

Install
- From repo root: `make install` (runs `npm ci` in `frontend/`).

Run
- Frontend: `make dev` then open http://localhost:3001
- Backend: `make backend-install && make backend-dev` (http://localhost:3000)
- Worker: `make worker-install && make worker-dev`
- Build: `make build`
- Lint: `make lint`
- Typecheck: `make typecheck`

Environment
- Frontend reads `NEXT_PUBLIC_*` in the browser and server-only secrets without that prefix in API routes.
- Create `frontend/.env.local` (or copy from `frontend/.env.example`). Example:
  - `NEXT_PUBLIC_EDGE_BASE=http://localhost:3001`
  - `WASABI_ENDPOINT=https://s3.wasabisys.com`
  - `WASABI_REGION=us-east-1`
  - `WASABI_STAGING_ACCESS_KEY=...`
  - `WASABI_STAGING_SECRET=...`
  - `STAGING_BUCKET=your-staging-bucket`

Testing
- No tests yet. Add Jest/Vitest under `frontend/` and wire `npm test`.

Patterns (AI/Codex friendly)
- Keep tasks atomic; each doc lists inputs/outputs and acceptance.
- Use checklists and copy-pasteable commands.

Acceptance
- `make dev` serves frontend with HMR at http://localhost:3001
- `make build` completes without errors.
- Frontend API routes: `POST http://localhost:3001/api/health` returns `{ ok: true, ... }`
- Backend health: `GET http://localhost:3000/health` returns `{ ok: true, ... }` (if backend is running)
- Presign: `POST /api/presign` (frontend or backend) returns a signed URL with valid env.
