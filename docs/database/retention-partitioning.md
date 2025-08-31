# Retention & Partitioning

High-Volume Tables
- `activities`, `jobs`, `comments` may grow quickly.

Partitioning
- Time-based partitioning by month on `activities` and `jobs`.
- Keep 12–24 months hot; archive older to warehouse or cold storage if needed.

Retention
- Comments: retain indefinitely unless project privacy requires pruning.
- Jobs: keep 30–90 days; aggregate metrics to warehouse.

Vacuum/Analyze
- Tune autovacuum thresholds for partitions; monitor bloat.
