# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Context

Claude Code operates as part of an orchestrated development workflow in this monorepo, where OpenAI Codex serves as the primary orchestrator. Codex will invoke Claude Code for specific tasks that require local execution, detailed analysis, or precise code modifications. When working in this repository:

- You are being called by Codex to handle specific, well-defined tasks
- Focus on the immediate task at hand rather than broader architectural decisions
- Provide clear, concise feedback about task completion status
- Report any blockers or issues that Codex needs to handle

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

### Service-Specific Scripts
- **Backend**: `npm run dev`, `npm run build`, `npm run start`, `npm run migrate`, `npm run test`
- **Worker**: `npm run dev`, `npm run build`, `npm run start`
- **Edge**: `npm run dev`, `npm run build`, `npm run start`, `npm run test`
- **Frontend**: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`

### Testing
```bash
# Backend and Edge have Vitest configured
cd backend && npm run test
cd edge && npm run test

# Frontend tests are placeholder - add Jest/Vitest when needed
make test
```

## Architecture Overview

This is a multi-service media processing application with the following components:

### Service Topology
1. **Frontend** (`/frontend`) - Next.js 15 with App Router, TailwindCSS v4
   - Runs on port 3001
   - User interface for upload, review, and management
   - Communicates with API and Edge services

2. **Backend API** (`/backend`) - Fastify-based REST API
   - Runs on port 3000
   - Handles auth, presigned URLs, asset CRUD, promotion orchestration
   - Uses PostgreSQL for data, Redis for caching/queues
   - Integrates with Wasabi S3 for object storage

3. **Preview Worker** (`/worker`) - GPU-accelerated media processing
   - Processes jobs from Redis streams
   - Generates HLS streams, thumbnails, waveforms
   - Requires NVENC-capable GPU for optimal performance

4. **Edge Service** (`/edge`) - Cache and signed URL verification
   - Runs on port 8080
   - HMAC-based URL signing for secure content delivery
   - Provides low-latency preview delivery

### Data Flow
1. **Upload**: Frontend → API presign → Direct upload to Wasabi Staging
2. **Promotion**: API validates → Server copy to Masters (with object lock)
3. **Preview**: API enqueues job → Worker processes → Outputs to Previews
4. **Delivery**: Frontend requests → Edge validates/caches → Serves from Previews

### Storage Architecture (Wasabi S3)
- **Staging Bucket**: Temporary uploads (mutable)
- **Masters Bucket**: Immutable assets with object lock and retention
- **Previews Bucket**: Generated HLS, thumbnails, waveforms (mutable)
- **Docs/Backups**: Documentation and system backups

### Key Technologies
- **Frontend**: Next.js 15, React 19, Radix UI, TailwindCSS v4, AWS SDK
- **Backend**: Fastify, Zod validation, PostgreSQL (pg), Redis (ioredis), AWS SDK
- **Worker**: Redis queues, AWS SDK, Pino logging
- **Edge**: Fastify, rate limiting, HMAC signing

### Environment Configuration
Each service requires specific environment variables:
- Frontend: `NEXT_PUBLIC_EDGE_BASE` (and future `NEXT_PUBLIC_API_BASE`)
- Backend: Database URLs, Redis connection, Wasabi credentials, signing keys
- Worker: Queue settings, GPU device, Wasabi credentials
- Edge: Signing key, cache configuration

See `docs/configuration/env.md` for complete environment variable documentation.

## Development Workflow

### Local Development Setup
1. Install dependencies for the service you're working on
2. Set up `.env` files based on `.env.example` templates
3. Start services in this order: Database → Redis → Backend → Worker → Edge → Frontend

### Code Conventions
- TypeScript for all services with strict type checking
- ESM modules (`"type": "module"` in package.json)
- Fastify for API services (backend, edge)
- Minimal, focused changes - avoid unrelated refactoring
- Use existing patterns and libraries already in the codebase

### Documentation Requirements
- Update `/docs/` for any architectural or deployment changes
- Keep `docs/configuration/env.md` in sync with environment variables
- Update service-specific AGENTS.md files when changing service behavior
- API changes must be reflected in `docs/backend/services/*.md`

### Testing Strategy
- Backend and Edge use Vitest for unit tests
- Frontend testing infrastructure to be added (Jest/Vitest)
- Run type checking and linting before committing
- Worker testing focuses on job processing and error handling

## Important Files and Directories

### Documentation
- `docs/index.md` - Documentation entry point
- `docs/architecture/services-plan.md` - Complete service architecture
- `docs/configuration/env.md` - Environment variable reference
- `AGENTS.md` - Repository conventions and AI agent guidance
- Service-specific: `backend/AGENTS.md`, `worker/AGENTS.md`, `edge/AGENTS.md`, `frontend/AGENTS.md`

### Configuration
- `Makefile` - Top-level build and development commands
- `deploy/` - Deployment configurations
- `.env.example` files in each service directory

## Key Implementation Details

### HMAC Signing (Edge Service)
The edge service implements HMAC-based URL signing for secure content delivery. See `docs/edge/hmac-signing.md` for implementation details.

### Queue System
Uses Redis Streams for job queuing between API and workers. Consumer groups ensure exactly-once processing with acknowledgment.

### Database Schema
PostgreSQL stores assets, versions, users, comments, shares, and audit logs. Migrations are managed via `backend/src/migrate.ts`.

### GPU Processing
Preview worker leverages NVENC for hardware-accelerated video transcoding. Falls back to CPU encoding when GPU unavailable.

## Deployment Phases

The system follows a phased rollout plan:
- **Phase 0**: Frontend only (current)
- **Phase 1**: API with basic presign functionality
- **Phase 2**: Promotion path with object lock
- **Phase 3**: Preview pipeline and edge delivery
- **Phase 4**: Full auth, sharing, comments, observability

See `docs/architecture/services-plan.md` for detailed phase requirements and acceptance criteria.

## Working with Codex

As documented in `AGENTS.md`, this repository uses a coordinated AI development approach:

### Division of Responsibilities

**Codex (Orchestrator)**:
- High-level planning and task decomposition
- Bulk refactoring and mechanical changes across the codebase
- Generating scaffolds, tests, and documentation
- Managing CI/CD pipelines and deployment configurations
- Coordinating multi-service changes

**Claude Code (Executor)**:
- Precise, surgical code modifications
- Local testing and validation
- Debugging complex issues requiring deep analysis
- Handling nuanced business logic implementations
- Resolving edge cases and performance optimizations

### Communication Protocol

When invoked by Codex:
1. Focus on the specific task provided
2. Run validation commands (`make lint`, `make typecheck`, `make build`) after changes
3. Report completion status clearly
4. Flag any issues that require Codex intervention
5. Avoid making changes outside the requested scope

### Handoff Patterns

Common workflows as defined in `AGENTS.md`:
- **Spec → Sweep**: Codex plans, Claude executes locally, Codex validates
- **Bulk → Surgical**: Codex handles repo-wide changes, Claude fixes edge cases
- **CI Fail → Local Fix**: Codex identifies failures, Claude debugs and fixes locally

Remember: You're part of a larger orchestrated workflow. Stay focused on your assigned tasks and communicate clearly with Codex about outcomes and blockers.