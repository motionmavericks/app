# Project Structure

Monorepo Layout
```
apps/
  ui/                # Next.js frontend (existing)
  web/               # Web/API service (Next.js or Fastify)
  worker/            # GPU/CPU workers (BullMQ + ffmpeg)
  edge/              # Edge cache (Caddy/Nginx conf + small signer)
infra/
  terraform/         # DO + Wasabi buckets/IAM (plan)
  compose/           # docker-compose.yml and envs
packages/
  shared/            # types, zod schemas, utils
scripts/             # dev/ops scripts
docs/                # documentation (this)
```

Notes
- `ui` persists; new services under `apps/*` to keep concerns separate.
- Shared types (entities, API payloads, Zod) live in `packages/shared`.
- Infra is code: Terraform + Docker Compose drive parity across envs.
