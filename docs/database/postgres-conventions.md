# Postgres Conventions

- Naming: `snake_case` table and column names; singular table names are OK if consistent (we use plural).
- Primary keys: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`.
- Foreign keys: `ON DELETE RESTRICT` for masters; `ON DELETE CASCADE` for leafs (comments, annotations).
- Timestamps: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` with trigger to update.
- JSONB: store EBUCore and probes in `versions.meta` (JSONB); index selective paths with GIN.
- Timecode: store in frames (`int4`) and also `timecode_text` for display.
- Constraints: `CHECK (byte_size >= 0)`, `CHECK (sha256 ~ '^[a-f0-9]{64}$')`.
- Text search: FTS vectors for asset titles/comments.
