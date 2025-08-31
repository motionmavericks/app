# Backups & DR

Database
- Nightly full + WAL for PITR; stored in `backups` bucket; monthly restore tests.

Manifests
- Promotion/ingest manifests archived; checksum audit logs retained.

DR
- Runbook to rebuild edge and workers; masters bucket is authoritative.
