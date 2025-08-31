# Architecture Blueprint

Scope
- Components, data flow, trust boundaries, and core sequences.

Components
- Web/API (Next.js), GPU Workers (ffmpeg/NVENC), Edge Cache (NVMe + Caddy), Managed Postgres, Managed Redis, Wasabi buckets (masters, previews, staging, docs).

Sequences
1) First playback: client → edge miss → previews bucket miss → enqueue → GPU builds HLS → write previews → edge hydrate → serve.
2) Promotion: upload to staging → review → server copy to masters (Object Lock) → checksum audit → enqueue preview build.

Trust Boundaries
- Public (web, edge) vs private (workers, DB/Redis) vs object storage. Signed URLs; least‑privilege IAM.

Diagrams
- See `architecture/diagrams.md` for system context, containers, and key sequences.
