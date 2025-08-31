# Asset Tables (DDL Sketch)

Assets & Versions
```sql
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES collections(id) ON DELETE SET NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_project_idx ON assets(project_id);

CREATE TABLE versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  sha256 char(64) NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  container text NOT NULL,
  codec text,
  fps numeric(7,3),
  frames int,
  timecode_start text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sha256),
  INDEXABLE (asset_id)
);
CREATE UNIQUE INDEX versions_asset_latest ON versions(asset_id, created_at DESC);
CREATE INDEX versions_meta_gin ON versions USING GIN (meta);
```

Sidecars
```sql
CREATE TABLE sidecars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  kind text NOT NULL, -- xmp, xml, cpl, lut, captions
  key text NOT NULL, -- object storage key
  byte_size bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```
