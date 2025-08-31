# Task Checklist (AI-Friendly)

Each task lists Inputs, Files, Commands, Acceptance.

1) Create monorepo scaffolding
- Inputs: docs/project/structure.md
- Files: root `package.json`, `apps/` folders, `packages/shared`.
- Acceptance: `pnpm -w -r install` works; lint passes.

2) Add `packages/shared`
- Inputs: entities, Zod schemas (assets, versions, shares).
- Files: `packages/shared/src/{entities.ts,schemas.ts}`.
- Acceptance: `tsc -b` passes; used by web/worker/ui.

3) DB setup
- Inputs: docs/database/*
- Files: `apps/web/prisma` or `apps/web/drizzle`; migration SQL.
- Commands: `npm run db:migrate`.
- Acceptance: schema created; seed demo rows.

4) Web/API endpoints
- Inputs: docs/api/endpoints/*, docs/api/auth.md
- Files: `apps/web/src/app/api/*` (Next.js) or routes (Fastify).
- Acceptance: HTTP tests return expected payloads and errors.

5) Worker preview jobs
- Inputs: docs/previews/*, backend/queues.md
- Files: `apps/worker/src/*`; ffmpeg preset module.
- Acceptance: Given master key, writes HLS/MP4 to previews; job state updates.

6) Edge cache
- Inputs: backend/signed-urls.md, previews/edge-cache.md
- Files: `apps/edge/Caddyfile`, small verifier service if needed.
- Acceptance: Signed URL validates; miss fetches; hit serves <50ms.

7) UI screens
- Inputs: frontend/* docs
- Files: `frontend/src/app/*` pages; components per specs.
- Acceptance: Grid renders; player works; comments CRUD; share view loads.

8) CI/CD & Ops
- Inputs: ops/*, deploy/digitalocean.md, infra/*
- Files: `.github/workflows/*`, `infra/compose/docker-compose.yml`, terraform stubs.
- Acceptance: CI builds, tests; `docker compose up` runs stack locally.
