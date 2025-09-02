# Neo4j Usage

## Connection
- Env: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, optional `NEO4J_DATABASE`
- Use secure `neo4j+s://` URIs where possible.

## Modeling Guidelines
- Define node labels and relationship types explicitly.
- Add constraints for identifiers and uniqueness; index frequent match properties.
- Avoid Cartesian products; prefer bounded expansions and indexes.

## Query Validation
- Run `EXPLAIN` and `PROFILE` for new/changed queries.
- Confirm index usage and acceptable cardinality.

## Migrations
- Stage-first: apply in staging; verify counts and performance.
- Batched and idempotent; record resume markers.
- Prepare inverse steps (rollback) and snapshot where feasible.

## Example Patterns
- Upsert with MERGE and ON CREATE/ON MATCH
- Pattern comprehension for aggregates
- APOC usage with restraint; document security implications

See also:
- `.claude/agents/graph-architect.md`
- `.claude/agents/graph-ops-migrator.md`
- `docs/ai/claude-subagents.md`
