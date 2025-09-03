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
# Individual Service Tests
cd backend && npm run test   # Backend unit tests (Vitest)
cd edge && npm run test      # Edge unit tests (Vitest)
cd worker && npm run test    # Worker unit tests (Vitest)
cd frontend && npm run test  # Frontend unit tests (Vitest)

# Real Data Testing Infrastructure (NO MOCK DATA)
scripts/test-services-start.sh    # Start PostgreSQL, Redis, MinIO test services
scripts/test-services-stop.sh     # Stop test services
scripts/test-db-reset.sh          # Reset test database to clean state
docker-compose -f docker-compose.test.yml up -d  # Manual test services
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
 - **Sentry subagent**: `.claude/agents/sentry-integrator.md` (covers frontend and backend)

## Key Implementation Details

- **HMAC Signing**: Edge service validates signatures (see `edge/src/index.ts`)
- **Queue System**: Redis Streams with consumer groups for job processing
- **Database**: PostgreSQL with Advanced Asset Management schema, migrations via `backend/src/migrate.ts`
- **GPU Processing**: NVENC preferred, fallback to CPU (libx264)
- **Hierarchical Organization**: ltree extension for efficient folder operations, collections across folders
- **Full-Text Search**: PostgreSQL tsvector with automatic search vector maintenance

## Multi-Agent Orchestration System

This repository uses an advanced multi-agent system combining Claude Code, Codex, and Qwen:

### Available Subagents (.claude/agents/)
- **orchestrator**: Delegates tasks and combines tools strategically
- **external-delegator**: Executes Codex and Qwen with specific outputs
- **precision-coder**: Implements critical code after planning
- **validator**: Final quality gate with pass/fail reports
 - **testing-codex**: Runs tests and uses Codex to fix failures with minimal patches
 - **debugger-codex**: Reproduces, diagnoses, and fixes bugs using Codex with verified repros

### Tool Strengths & Usage

#### Codex (GPT-5) - Planning & Analysis
```bash
codex exec "Create task list for X. Return numbered steps."
codex exec "Design architecture for Y. Return component diagram."
codex exec "Analyze bug Z. Return root cause and fix."
```
**Best for**: Task lists, architecture, problem analysis

#### Qwen (Qwen3-Coder) - Bulk Execution
```bash
qwen -p "Generate tests for all services. Return file names."
qwen -p "Refactor X to Y. Return modified file count."
qwen -p "Document all APIs. Return markdown files."
```
**Best for**: Mass generation, refactoring, documentation

#### Claude - Critical Implementation
- Security code → Returns security checklist
- Performance fixes → Returns benchmarks
- Bug fixes → Returns proof of fix

### Optimal Workflow Pattern
```
1. Codex creates plan → "Return numbered task list"
2. Qwen executes bulk → "Return generated files"
3. Claude implements critical → "Return working code with metrics"
4. Validator checks all → "Return pass/fail report"
```

### Key Principles
- **Always specify outputs**: Include "Return [format]" in every prompt
- **Combine tools**: Codex thinks, Qwen does, Claude perfects
- **Measurable results**: Metrics, counts, benchmarks - not just "done"

See `.claude/agents/` for detailed instructions.

## Testing Strategy & Anti-Mock Policy

**CRITICAL**: This codebase uses **ZERO MOCK DATA** policy for all testing:

- All tests use real PostgreSQL, Redis, and MinIO services via Docker
- Test data is created using real database transactions with rollback isolation
- Docker test environment provides: PostgreSQL:5433, Redis:6380, MinIO:9000  
- Configuration: `.env.test` with real service connections
- Enforcement: ESLint rules block mock/stub/spy usage, pre-commit hooks prevent mock code

### Advanced Asset Management Features

The database includes comprehensive schema for:
- **Hierarchical Folders**: ltree-based nested organization with drag-drop
- **Collections**: Cross-folder asset groupings with permissions
- **Custom Metadata**: 7 field types (text, number, date, dropdown, boolean, url, email) with JSONB storage
- **Tagging System**: User/system tags with auto-completion and usage tracking
- **Full-Text Search**: Automatic tsvector maintenance with GIN indexes

## Sentry Ops Examples (Claude)

- Backend issues (dev): `@sentry-integrator List unresolved issues for backend in the last 7 days and summarize top 3.`
- Backend performance: `@sentry-integrator Show slowest backend transactions this week with trace links.`
- SDK help: `@sentry-integrator Give backend instrumentation steps and envs to enable tracing and profiling.`

## Agent OS Workflow System

This repository implements Agent OS specifications located in `.agent-os/` and `specs/`:

- **Feature Specs**: Use `/create-spec` command to generate comprehensive specifications  
- **Task Management**: Use `/create-tasks` and `/execute-tasks` commands for systematic development
- **Real-Time Execution**: Tasks are tracked in `tasks.md` with status updates and validation
- **Post-Execution**: Automated testing, git workflows, and completion verification
