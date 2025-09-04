# Repo Tidying — 2025-09-04

Summary of non-functional cleanups applied across the repo.

Changes
- Next.js: set `turbopack.root` in `frontend/next.config.ts` to silence incorrect workspace root warning when multiple lockfiles exist.
- Edge service: moved `typescript` to `devDependencies` and removed obsolete `@types/node-fetch` (node-fetch v3 ships its own types). No runtime behavior changes.
- Lint/format: ran ESLint autofix within `frontend/`.
- Docs: added build notes to `docs/frontend/README.md` (Turbopack root, visual tests, edge integration tests).

Validations
- Frontend: `make lint`, `make typecheck`, and `make build` pass.
- Edge: unit tests pass; integration tests require a running service at `:8080` and were not executed end-to-end in this pass.

Adoption Notes
- Ensure local `.env` files follow `frontend/.env.example`, `edge/.env.example`, and `worker/.env.example`.
- For visual tests, run `npm --prefix frontend run visual:init` then `npm --prefix frontend run test:visual`.

Risk and Rollback
- Low risk; config and dependency hygiene only. Roll back by reverting this PR.

