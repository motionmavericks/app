- [Docs Home](README.md)
- [Index](index.md)

- Overview
  - [System Overview](overview.md)
  - [Dev Setup](dev-setup.md)

- Project
  - [Structure](project/structure.md)
  - [Implementation Plan](project/implementation-plan.md)
  - [Task Checklist](project/tasks.md)
  - [Acceptance Criteria](project/acceptance.md)

- Architecture
  - [Blueprint](architecture/blueprint.md)
  - [Diagrams](architecture/diagrams.md)
  - [Frontend Architecture](architecture/frontend.md)
  - [Backend Architecture](architecture/backend.md)

- Database
  - [Overview](database/overview.md)
  - [Conventions](database/postgres-conventions.md)
  - [Core Tables](database/tables-core.md)
  - [Asset Tables](database/tables-assets.md)
  - [Collab Tables](database/tables-collab.md)
  - [Ops Tables](database/tables-ops.md)
  - [Indexes](database/indexes.md)
  - [Migrations](database/migrations.md)
  - [Backups & PITR](database/backups.md)
  - [Retention & Partitioning](database/retention-partitioning.md)

- Storage & Security
  - [Buckets & Lifecycle](storage/buckets.md)
  - [IAM Roles](security/iam.md)
  - [Object Lock](security/object-lock.md)
  - [Threat Model](security/threat-model.md)

- Ingest
  - [File Acceptance](ingest/file-acceptance.md)
  - [Manifest Schema](ingest/manifest-schema.md)
  - [Mapping Rules](ingest/mapping-rules.md)
  - [Promotion Flow](ingest/promotion.md)
  - [AV Scan](ingest/av-scan.md)

- Previews
  - [HLS Ladder](previews/hls.md)
  - [ffmpeg Presets](previews/ffmpeg-presets.md)
  - [Watermarking](previews/watermarking.md)
  - [Thumbnails & Waveforms](previews/thumbnails-waveforms.md)
  - [Edge Cache](previews/edge-cache.md)

- API
  - [API Overview](api/reference.md)
  - [Auth & Roles](api/auth.md)
  - [Presign](api/endpoints/presign.md)
  - [Promote](api/endpoints/promote.md)
  - [Preview](api/endpoints/preview.md)
  - [Assets](api/endpoints/assets.md)
  - [Comments](api/endpoints/comments.md)

- Frontend
  - [UI Overview](frontend/ui-overview.md)
  - [Design System](frontend/design-system.md)
  - [Routes & Layout](frontend/routes.md)
  - Components
    - [Player](frontend/components/player.md)
    - [Comments](frontend/components/comments.md)
    - [Annotations](frontend/components/annotations.md)
  - [State](frontend/state.md)
  - [Accessibility](frontend/accessibility.md)
  - [Performance](frontend/performance.md)
  - [Forms](frontend/forms.md)
  - [Testing](frontend/testing.md)

- Backend Services
  - [Web/API](backend/services/web.md)
  - [Workers](backend/services/worker.md)
  - [Edge Cache](backend/services/edge.md)
  - [Queues](backend/queues.md)
  - [Storage Keys](backend/storage/keys.md)
  - [Signed URLs](backend/signed-urls.md)

- Deployment & Infra
  - [DigitalOcean](deploy/digitalocean.md)
  - [Docker Compose Plan](infra/compose.md)
  - [Terraform Plan](infra/terraform-plan.md)

- Operations
  - [CI/CD](ops/ci-cd.md)
  - [Observability](ops/observability.md)
  - [Backups & DR](ops/backups-dr.md)
  - [Costs](ops/costs.md)
  - [SLOs](ops/slos.md)
  - [Dashboards](ops/dashboards.md)

- Migration
  - [Plan](migration/plan.md)
  - [Checklist](migration/checklist.md)

- Runbooks
  - [Cache Full](runbooks/cache-full.md)
  - [GPU Backlog](runbooks/gpu-backlog.md)
  - [Failed Promotion](runbooks/failed-promotion.md)
  - [Wasabi Outage](runbooks/wasabi-outage.md)

- Roadmap
  - [Roadmap](roadmap.md)

- Appendix
  - [Standards](appendix/standards.md)
  - [Glossary](glossary.md)
  - [AI Guidance](ai/codex-cli-guidance.md)
