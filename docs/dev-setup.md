# Dev Setup

Status: MVP-ready. Frontend, Backend API, Preview Worker, and Edge proxy are runnable locally.

Prereqs
- Node 20+, npm 10+.
- Optional: Python 3.11+ (for `tools/` scripts).
- Wasabi buckets and access keys (Staging, Masters, Previews) for end-to-end flow.

Install
- From repo root: `make install` (runs `npm install` in `frontend/`).

Run
- Frontend: `make dev` then open http://localhost:3001
- Backend: `make backend-install && make backend-dev` (http://localhost:3000)
- DB migrate (optional persistence): `make backend-migrate` (applies `database/schema.sql` to `POSTGRES_URL`).
- Worker: `make worker-install && make worker-dev` (FFmpeg installed in image; presets via `PREVIEW_PRESET` or `PREVIEW_VARIANTS`).
- Edge proxy (optional for MVP—fallback presign works without edge): `make edge-install && make edge-dev` (http://localhost:8080)
- Build: `make build`
- Lint: `make lint`
- Typecheck: `make typecheck`

Environment
- Templates provided:
  - `frontend/.env.example`
  - `backend/.env.example`
  - `worker/.env.example`
  - `edge/.env.example`
  - `database/.env.example`
- Frontend reads `NEXT_PUBLIC_*` in the browser; server-only secrets are available to API routes.
- Start with `frontend/.env.local` (copy from example): set `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_EDGE_BASE`.
- Backend: configure Wasabi Staging/Masters/Previews keys and buckets; optionally `POSTGRES_URL`, `REDIS_URL`, `EDGE_SIGNING_KEY`, `EDGE_PUBLIC_BASE`.
- Worker: set Redis URL/stream/group and Wasabi read (Masters) and write (Previews) creds.
- Edge: set `EDGE_SIGNING_KEY`, `PREVIEWS_BUCKET`, and Wasabi endpoint/region.

Testing
- No tests yet. Add Jest/Vitest under `frontend/` and wire `npm test`.

Patterns (AI/Codex friendly)
- Keep tasks atomic; each doc lists inputs/outputs and acceptance.
- Use checklists and copy-pasteable commands.

Acceptance
- Frontend HMR at http://localhost:3001; `make build` completes without errors.
- Backend health: `GET http://localhost:3000/api/health` → `{ ok: true }`.
- Presign: `POST /api/presign` returns a PUT URL; upload to Staging succeeds.
- Promote: `POST /api/promote` copies to Masters; Redis enqueues preview when configured.
- Worker builds HLS under Previews prefix; backend `/api/preview/status?prefix=...` flips ready.
- Playback: `/play?p=<prefix>` or `/assets/<id>` plays via edge-signed URL when configured, or presigned fallback.
