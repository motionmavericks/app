# Implementation Plan

Phases (high-level)
- P0 Index & Plan: indexer, mapping UI, bucket/IAM definitions.
- P1 Core Platform: masters/previews/staging/docs; promotion; preview pipeline; edge cache.
- P2 Collaboration: comments, annotations, shares, auth/RBAC.
- P3 Migration: pilot projects → roll-out; observability.

Milestones & Deliverables
- M1 Repo structure created; shared package; env templates; docker-compose up.
- M2 DB schema and migrations applied; seed demo data.
- M3 Web/API endpoints `/presign`, `/promote`, `/preview`, `/assets/:id`.
- M4 Worker builds 720p HLS + MP4; events emitted; edge serves.
- M5 UI dashboard, asset player with comments; share page.
- M6 Infra deploy on DO; backups and monitors live.

Dependencies
- Workers depend on DB and buckets; edge depends on previews bucket; UI depends on web endpoints.

Exit Criteria
- See project/acceptance.md for MVP acceptance.
