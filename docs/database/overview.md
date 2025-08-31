# Database Overview

Purpose
- Define the operational data model for projects, assets, versions, previews, shares, and activity.

Topology
- Primary: PostgreSQL (Managed) for OLTP and search (JSONB, FTS).
- Ephemeral: Redis for queues/caches (not authoritative).
- Optional (later): Analytics warehouse (ClickHouse/BigQuery) fed by events.

Schema Domains
- Core: organizations, clients, projects, memberships, collections.
- Assets: assets, versions, sidecars, metadata (EBUCore JSONB).
- Collaboration: comments, annotations, shares, notifications.
- Ops: jobs, activities, manifests, audits.

Keys & Identity
- UUIDv7 for primary keys (`gen_random_uuid()` acceptable initially).
- `version.sha256` is unique natural key for file content.

Time & Locale
- All timestamps UTC with `timestamptz`; no local time in DB.

Backups
- See Backups doc: nightly full + WAL for PITR; verify restores.
