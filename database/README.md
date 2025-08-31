# Database

Planned: Postgres 16 with a simple schema for assets, versions, users, comments, and shares.

Local Development
- Use docker or managed instance. Example DSN: `postgres://app:app@localhost:5432/app`.
- Provision via migrations in the backend (e.g., Prisma or SQL files). For now, a minimal SQL is provided.

Files
- `schema.sql`: baseline DDL for core tables.
- `.env.example`: connection variables.

