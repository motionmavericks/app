# Migrations

Tooling
- Drizzle or Prisma Migrate; SQL first preferred for clarity.

Practices
- Idempotent migrations; include down where safe.
- Zero-downtime changes: add columns nullable → backfill → set NOT NULL → drop old.
- Avoid table rewrites on large tables; use `CONCURRENTLY` for index creation.

Seeding
- Minimal: roles, test users, demo project. No prod seeding.

Acceptance
- `npm run db:migrate` applies cleanly in CI and staging before prod.
