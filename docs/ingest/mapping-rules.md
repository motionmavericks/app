# Mapping Rules (Legacy → New Paths)

Heuristics
- Date prefix `YYMMDD` or `YYYYMMDD` → shoot_date.
- Client from top-level folder name; project from remainder (kebab-case).
- Folder `01 Footage` → `01-footage`, etc.

Overrides
- Per-project YAML with explicit client/project/shoot overrides and ignore patterns.

Acceptance
- Dry-run produces deterministic `src → dest` mapping; conflicts flagged.
