.PHONY: help install dev build lint typecheck test clean \
backend-install backend-dev backend-build \
worker-install worker-dev worker-build

# Top-level wrappers for the Next.js UI in ui/

help:
	@echo "Targets: install dev build lint typecheck test clean"
	@echo "Backend: backend-install backend-dev backend-build"
	@echo "Worker: worker-install worker-dev worker-build"

install:
	@echo "Installing frontend dependencies (npm ci)"
	cd frontend && npm ci

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
	npm --prefix frontend exec tsc -p tsconfig.json

test:
	@echo "No tests defined yet; add Jest/Vitest to frontend/"
	@true

clean:
	@echo "Cleaning frontend build artifacts"
	rm -rf frontend/.next

backend-install:
	@echo "Installing backend deps"
	cd backend && npm ci

backend-dev:
	@echo "Starting backend dev on :3000"
	npm --prefix backend run dev

backend-build:
	@echo "Building backend"
	npm --prefix backend run build

worker-install:
	@echo "Installing worker deps"
	cd worker && npm ci

worker-dev:
	@echo "Starting preview worker"
	npm --prefix worker run dev

worker-build:
	@echo "Building preview worker"
	npm --prefix worker run build
