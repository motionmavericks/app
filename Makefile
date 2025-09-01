.PHONY: help install dev build lint typecheck test clean init \
backend-install backend-dev backend-build \
worker-install worker-dev worker-build \
edge-install edge-dev edge-build \
qwen qwen-plan \
qwen-audit-overview \
qwen-audit-backend qwen-audit-worker qwen-audit-edge qwen-audit-frontend qwen-audit-deploy \
qwen-audit-backend-topics qwen-audit-worker-topics qwen-audit-edge-topics qwen-audit-frontend-topics qwen-audit-infra-topics \
qwen-audit-detail \
claude claude-plan \
claude-audit-overview claude-audit-backend claude-audit-worker claude-audit-edge claude-audit-frontend claude-audit-deploy

# Top-level wrappers for the Next.js UI in frontend/

help:
	@echo "Targets: install dev build lint typecheck test clean"
	@echo "Init: init (run scripts/codex_init.sh)"
	@echo "Backend: backend-install backend-dev backend-build"
	@echo "Worker: worker-install worker-dev worker-build"
	@echo "DB: backend-migrate"
	@echo "Edge: edge-install edge-dev edge-build"
	@echo "AI tooling: qwen (Qwen Code CLI), qwen-plan (non-interactive)"
	@echo "Audits: qwen-audit-backend/worker/edge/frontend/deploy (fast)"
	@echo "Multi-pass: qwen-audit-overview (areas), *-topics (subareas), qwen-audit-detail (FOCUS=...)"
	@echo "Claude: claude (REPL), claude-plan (print), claude-audit-* (fast)"

install:
	@echo "Installing frontend dependencies (npm install)"
	cd frontend && npm install

dev:
	@echo "Starting frontend dev server (http://localhost:3001)"
	npm --prefix frontend run dev

build:
	@echo "Building frontend"
	npm --prefix frontend run build

lint:
	@echo "Linting frontend"
	npm --prefix frontend run lint

typecheck:
	@echo "Type-checking frontend"
	cd frontend && npx tsc -p tsconfig.json

test:
	@echo "No tests defined yet; add Jest/Vitest to frontend/"
	@true

clean:
	@echo "Cleaning frontend build artifacts"
	rm -rf frontend/.next

init:
	@echo "Running Codex /init (scripts/codex_init.sh)"
	bash scripts/codex_init.sh

backend-install:
	@echo "Installing backend deps"
	cd backend && npm install

backend-dev:
	@echo "Starting backend dev on :3000"
	npm --prefix backend run dev

backend-build:
	@echo "Building backend"
	npm --prefix backend run build

backend-migrate:
	@echo "Running DB migration"
	npm --prefix backend run migrate

worker-install:
	@echo "Installing worker deps"
	cd worker && npm install

worker-dev:
	@echo "Starting preview worker"
	npm --prefix worker run dev

worker-build:
	@echo "Building preview worker"
	npm --prefix worker run build

edge-install:
	@echo "Installing edge deps"
	cd edge && npm install

edge-dev:
	@echo "Starting edge verifier on :8080"
	npm --prefix edge run dev

edge-build:
	@echo "Building edge"
	npm --prefix edge run build

# --- AI tooling ---
qwen:
	@echo "Launching Qwen Code CLI (npx) in repo root"
	npx -y @qwen-code/qwen-code

qwen-plan:
	@echo "Generating prioritized end-to-end plan via Qwen (non-interactive)";
	PROMPT='Using the entire repository context at ./, produce a prioritized, end-to-end task list to finish coding and deploying all services (frontend, backend, worker, edge) with DigitalOcean App Platform spec at deploy/do-app.yaml. For each task, include: purpose, inputs, files to change, acceptance checks, and dependencies. Output concise Markdown bullets only.'; \
	npx -y @qwen-code/qwen-code --prompt "$$PROMPT" --approval-mode default || true

# Multi-pass audit — pass 1: concise area list
qwen-audit-overview:
	@echo "Qwen audit overview (areas only, 30s timeout)";
	timeout 30s npx -y @qwen-code/qwen-code --prompt "Act as a staff engineer. First pass audit: List the key areas to review in this repo to ensure a fully working system (no details, 8-12 bullets max). Use short area names only, e.g., Backend API, Worker Pipeline, Edge Proxy, Frontend UX, Database Schema, Config/Env, Deploy Spec, Observability, Security, Performance, Docs/Runbooks." --approval-mode default || true

# Faster, scoped audits with timeouts
qwen-audit-backend:
	@echo "Qwen audit: backend (60s timeout)";
	cd backend && timeout 60s npx -y @qwen-code/qwen-code --prompt "Audit ONLY the backend service in ./backend. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." --approval-mode default || true

qwen-audit-worker:
	@echo "Qwen audit: worker (60s timeout)";
	cd worker && timeout 60s npx -y @qwen-code/qwen-code --prompt "Audit ONLY the preview worker in ./worker. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." --approval-mode default || true

qwen-audit-edge:
	@echo "Qwen audit: edge (60s timeout)";
	cd edge && timeout 60s npx -y @qwen-code/qwen-code --prompt "Audit ONLY the edge service in ./edge. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." --approval-mode default || true

qwen-audit-frontend:
	@echo "Qwen audit: frontend (60s timeout)";
	cd frontend && timeout 60s npx -y @qwen-code/qwen-code --prompt "Audit ONLY the frontend in ./frontend. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." --approval-mode default || true

qwen-audit-deploy:
	@echo "Qwen audit: deploy/spec/docs (60s timeout)";
	timeout 60s npx -y @qwen-code/qwen-code --prompt "Audit deploy/do-app.yaml and docs/deploy/*.md. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." --approval-mode default || true

# Claude Code integration
claude:
	@echo "Launching Claude Code (interactive REPL). Use Ctrl+C to exit."
	claude || true

claude-plan:
	@echo "Claude (non-interactive print) — generating plan"
	claude -p "Using the entire repository context at ./, produce a prioritized, end-to-end task list to finish coding and deploying all services (frontend, backend, worker, edge). For each task, include: purpose, inputs, files to change, acceptance checks, and dependencies. Respond in concise Markdown bullets." || true

claude-audit-overview:
	@echo "Claude audit overview (areas only)";
	claude -p "List the key areas to review in this monorepo to ensure a fully working system (no details, 8-12 bullets max). Use short area names only, e.g., Backend API, Worker Pipeline, Edge Proxy, Frontend UX, Database Schema, Config/Env, Deploy Spec, Observability, Security, Performance, Docs/Runbooks." || true

claude-audit-backend:
	@echo "Claude audit: backend";
	cd backend && claude -p "Audit ONLY the backend service in ./backend. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." || true

claude-audit-worker:
	@echo "Claude audit: worker";
	cd worker && claude -p "Audit ONLY the preview worker in ./worker. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." || true

claude-audit-edge:
	@echo "Claude audit: edge";
	cd edge && claude -p "Audit ONLY the edge service in ./edge. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." || true

claude-audit-frontend:
	@echo "Claude audit: frontend";
	cd frontend && claude -p "Audit ONLY the frontend in ./frontend. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." || true

claude-audit-deploy:
	@echo "Claude audit: deploy/spec/docs";
	claude -p "Audit deploy/do-app.yaml and docs/deploy/*.md. List up to 10 bullets: Finding → Impact → Fix (files) → Acceptance. Be concise." || true

# Multi-pass audit — pass 2: topics per component
qwen-audit-backend-topics:
	@echo "Qwen backend topics (areas only, 30s timeout)";
	cd backend && timeout 30s npx -y @qwen-code/qwen-code --prompt "List the main topics to review for the backend service only (no details, 6-10 bullets): e.g., Input Validation, Persistence, Queues, Object Storage, Security, Rate Limiting, API Docs, Health/Readiness, Logging/Tracing." --approval-mode default || true

qwen-audit-worker-topics:
	@echo "Qwen worker topics (areas only, 30s timeout)";
	cd worker && timeout 30s npx -y @qwen-code/qwen-code --prompt "List the main topics to review for the preview worker only (no details, 6-10 bullets): e.g., Stream Consumption, Idempotency, Temp Files, FFmpeg, Retries/Backoff, Upload Robustness, Shutdown, Observability." --approval-mode default || true

qwen-audit-edge-topics:
	@echo "Qwen edge topics (areas only, 30s timeout)";
	cd edge && timeout 30s npx -y @qwen-code/qwen-code --prompt "List the main topics to review for the edge proxy only (no details, 6-10 bullets): e.g., Signature Validation, Path Sanitization, Range/Headers, Timeouts/Retries, Rate Limiting, Logging, Env Validation." --approval-mode default || true

qwen-audit-frontend-topics:
	@echo "Qwen frontend topics (areas only, 30s timeout)";
	cd frontend && timeout 30s npx -y @qwen-code/qwen-code --prompt "List the main topics to review for the frontend only (no details, 6-10 bullets): e.g., Upload Flow, Playback Flow, API Integration, Error Handling, Accessibility, Caching/Revalidation, Env Usage, Testing." --approval-mode default || true

qwen-audit-infra-topics:
	@echo "Qwen infra/deploy topics (areas only, 30s timeout)";
	timeout 30s npx -y @qwen-code/qwen-code --prompt "List the main topics to review across deploy/spec/infra only (no details, 6-10 bullets): e.g., DO App Spec, Health Checks, Secrets, Sizing, Networking/VPC, DNS, Runbooks, Observability." --approval-mode default || true

# Multi-pass audit — pass 3: detail on a specific area (set AREA and FOCUS)
# Usage: make qwen-audit-detail AREA=backend FOCUS="Input Validation"
qwen-audit-detail:
	@if [ -z "$(AREA)" ] || [ -z "$(FOCUS)" ]; then echo "Usage: make qwen-audit-detail AREA=<backend|worker|edge|frontend|infra> FOCUS=\"<topic>\""; exit 1; fi; \
	DIR="."; case "$(AREA)" in backend) DIR=backend;; worker) DIR=worker;; edge) DIR=edge;; frontend) DIR=frontend;; infra) DIR=.;; *) echo "Unknown AREA $(AREA)"; exit 1;; esac; \
	cd $$DIR && timeout 60s npx -y @qwen-code/qwen-code --prompt "Drill-down audit for $(AREA): Focus on $(FOCUS). Output a concise checklist of findings → impact → fixes (files) → acceptance, max 10 bullets. No code edits." --approval-mode default || true
