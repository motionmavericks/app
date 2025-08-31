-- Minimal baseline schema
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  owner_id uuid REFERENCES users(id),
  title text,
  staging_key text NOT NULL,
  master_key text,
  checksum text,
  bytes bigint,
  mime text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  master_key text NOT NULL,
  checksum text,
  preview_prefix text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Backfill/ensure columns for evolving schema
ALTER TABLE versions ADD COLUMN IF NOT EXISTS preview_prefix text;
ALTER TABLE versions ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Indexes and idempotency helpers
CREATE UNIQUE INDEX IF NOT EXISTS ux_versions_asset_master ON versions(asset_id, master_key);
CREATE INDEX IF NOT EXISTS ix_versions_preview_prefix ON versions(preview_prefix);
CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_staging_key ON assets(staging_key);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  body text NOT NULL,
  ts_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
