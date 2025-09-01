# Frontend AGENTS.md

Purpose
- Guide agents contributing to the Next.js UI: routes, env usage, upload/play flows, revalidation, and testing.

Run
- Dev: `make dev` (http://localhost:3001)
- Build: `make build`

Env
- `NEXT_PUBLIC_API_BASE` (required in production)
- `NEXT_PUBLIC_EDGE_BASE` (optional; backend falls back if unset)

Routes (selected)
- `/` lists assets (ISR revalidate 30s)
- `/upload` handles staging upload → promote → navigate to player or asset view
- `/play?p=<preview_prefix>` plays HLS via edge signed URL or presigned fallback

Patterns
- Centralize API base in `src/lib/api.ts`
- Sanitize filenames; MIME allowlist for uploads
- Prefer generic user errors; log details in console/dev only
- Revalidation: `export const revalidate = 30` in the Home page

Testing
- Add component/page tests with Vitest/React Testing Library (TBD)

Do/Don’t
- Do: read only `NEXT_PUBLIC_*` on the client; keep secrets server-side
- Do: update `docs/frontend/*` and `/docs/api/*` references as flows change
- Don’t: hardcode backend URLs; rely on env

