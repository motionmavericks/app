# App Workspace

This repository contains a Next.js frontend in `frontend/`, documentation in `docs/`, and a small Python tool in `tools/`.

## Prerequisites
- Node.js 20+ (Next.js 15)
- npm 10+

## Commands
- `make install`: install frontend dependencies (`npm ci` in `frontend/`).
- `make dev`: run the frontend locally at `http://localhost:3001`.
- `make build`: production build of the frontend.
- `make lint`: run ESLint on the frontend.
- `make typecheck`: run TypeScript type checking.
- `make test`: placeholder (add Jest/Vitest under `frontend/`).

Alternatively, you can operate directly inside `frontend/` with `npm run dev`, `npm run build`, etc.

## Structure
- `frontend/`: Next.js app (App Router, TailwindCSS 4).
- `docs/`: project documentation and runbooks.
- `tools/`: one-off utilities (e.g., `tools/wasabi_audit.py`).

See `AGENTS.md` for repository conventions.
