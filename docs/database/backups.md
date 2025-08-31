# Backups & PITR

Strategy
- Managed Postgres automated backups + WAL for Point-In-Time Recovery (PITR).
- Daily full; WAL retained 7–14 days. Weekly logical dump for cold storage.

Process
- Nightly: snapshot + ship to `backups` bucket. Tag with date and git sha.
- Weekly: `pg_dump --format=custom` for schema + data to `backups` bucket.

Restores
- Quarterly: restore to staging and run smoke tests (migrations, app boot, sample queries).

Manifests
- Promotion manifests stored indefinitely; part of DR audit trail.

Acceptance
- RPO ≤ 15 minutes; RTO ≤ 4 hours for primary DB.
