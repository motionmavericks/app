.PHONY: help install dev build lint typecheck test clean \
backend-install backend-dev backend-build \
worker-install worker-dev worker-build \
edge-install edge-dev edge-build

# Top-level wrappers for the Next.js UI in frontend/

help:
	@echo "Targets: install dev build lint typecheck test clean"
	@echo "Backend: backend-install backend-dev backend-build"
	@echo "Worker: worker-install worker-dev worker-build"
	@echo "DB: backend-migrate"
	@echo "Edge: edge-install edge-dev edge-build"

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
