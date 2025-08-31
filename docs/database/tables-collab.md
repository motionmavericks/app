# Collaboration Tables (DDL Sketch)

Comments
```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  version_id uuid REFERENCES versions(id) ON DELETE SET NULL,
  timecode_frames int NOT NULL,
  body text NOT NULL,
  author_id uuid NOT NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_asset_time_idx ON comments(asset_id, timecode_frames);
CREATE INDEX comments_search_idx ON comments USING GIN (to_tsvector('english', body));
```

Annotations
```sql
CREATE TABLE annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  version_id uuid REFERENCES versions(id) ON DELETE SET NULL,
  t_in int NOT NULL,
  t_out int NOT NULL,
  shape jsonb NOT NULL,
  author_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Shares
```sql
CREATE TABLE shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token char(32) UNIQUE NOT NULL,
  password_hash text,
  allow_download boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  watermark_template jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
