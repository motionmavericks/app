# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Frontend Development
```bash
make install       # Install frontend dependencies
make dev          # Start dev server on http://localhost:3001
make build        # Production build with Turbopack
make lint         # Run ESLint
make typecheck    # TypeScript type checking
```

### Backend Services
```bash
make backend-install    # Install backend dependencies
make backend-dev       # Start API server on :3000
make backend-build     # Build backend TypeScript
make backend-migrate   # Run database migrations

make worker-install    # Install worker dependencies
make worker-dev       # Start preview worker
make worker-build     # Build worker TypeScript

make edge-install     # Install edge dependencies
make edge-dev        # Start edge verifier on :8080
make edge-build      # Build edge TypeScript
```

### Testing
```bash
cd backend && npm run test   # Backend unit tests (Vitest)
cd edge && npm run test      # Edge unit tests (Vitest)
make test                    # Frontend (placeholder)
```

## Architecture Overview

Multi-service media processing application:

### Services
- **Frontend** (`/frontend`): Next.js 15, port 3001, upload/playback UI
- **Backend API** (`/backend`): Fastify, port 3000, presigned URLs, asset CRUD, PostgreSQL/Redis
- **Preview Worker** (`/worker`): GPU-accelerated HLS/thumbnail generation, Redis streams
- **Edge Service** (`/edge`): Port 8080, HMAC signed URL verification, preview delivery

### Data Flow
1. Upload → API presign → Wasabi Staging
2. Promote → Masters (object lock) → Enqueue preview
3. Worker → Generate HLS/thumbnails → Previews bucket
4. Edge → Validate signature → Serve from Previews

### Key Endpoints (Backend)
- `POST /api/presign`: Get upload URL
- `POST /api/promote`: Copy to Masters
- `POST /api/sign-preview`: Get signed playback URL
- `GET /api/health`: Service health check

### Environment Variables
See `docs/configuration/env.md` and `.env.example` files in each service directory.

## Development Workflow

### Local Setup Order
1. Database → Redis → Backend → Worker → Edge → Frontend
2. Copy `.env.example` to `.env` in each service
3. Run `make <service>-install` then `make <service>-dev`

### Validation Commands
```bash
make lint         # Frontend linting
make typecheck    # Frontend TypeScript
cd backend && npm run test
cd edge && npm run test
```

## Key Files

- **Documentation**: `docs/architecture/services-plan.md`, `docs/configuration/env.md`
- **Service guides**: `{backend,worker,edge,frontend}/AGENTS.md`
- **Deployment**: `deploy/do-app.yaml`, `docs/deploy/digitalocean.md`
- **Environment**: `.env.example` in each service directory

## Key Implementation Details

- **HMAC Signing**: Edge service validates signatures (see `edge/src/index.ts`)
- **Queue System**: Redis Streams with consumer groups for job processing
- **Database**: PostgreSQL, migrations via `backend/src/migrate.ts`
- **GPU Processing**: NVENC preferred, fallback to CPU (libx264)

## Codex Integration

This repository uses Codex CLI as primary orchestrator with Claude Code for execution.

### Task Division
- **Codex**: Multi-service features, refactoring, bulk changes, planning
- **Claude Code**: Precise modifications, debugging, performance optimization, local validation

### When Called by Codex
1. Focus on the specific task provided
2. Make only requested changes
3. Validate with `make lint`, `make typecheck`, relevant tests
4. Report clear status: DONE/BLOCKED/PARTIAL

See `CODEX_INTEGRATION.md` for detailed patterns.