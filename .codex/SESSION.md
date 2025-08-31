# Codex CLI Session Snapshot

This repo is prepped for continuation. All context lives in `/docs` with an index and a clean sidebar.

Quick Restart
- Open this repo with Codex CLI and point it at `docs/index.md`.
- Use `docs/project/tasks.md` as the canonical, AI‑friendly checklist (Inputs/Files/Acceptance per task).
- Database DDL sketches live under `docs/database/*`.
- Endpoint contracts live under `docs/api/endpoints/*`.
- Infra plans: `docs/infra/*`. Deployment: `docs/deploy/digitalocean.md`.

Decisions (short)
- Masters in Wasabi (immutable, Object Lock). Previews ephemeral (NVMe + TTL bucket).
- Region `ap-southeast-2`; signed previews with 10‑minute TTL.
- Content identity = sha256 per version; GOP aligned to 2‑second segments.

Next Actions (suggested)
- Generate SQL migrations from `docs/database/*`.
- Scaffold `apps/web`, `apps/worker`, `apps/edge`, `packages/shared` per `docs/project/structure.md`.
- Create `infra/compose/docker-compose.yml` and `.env.example` files per `docs/configuration/env.md`.

Artifacts
- Wasabi audit: `wasabi_audit.json` (read‑only inventory).

Notes
- Do not commit real secrets. Use `.env` files locally and DO Secrets in prod.
