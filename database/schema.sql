-- Complete schema with authentication tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extended with auth fields)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  display_name text,
  password_hash text,
  status text DEFAULT 'pending',
  authz_version integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS authz_version integer DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Sessions table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti text UNIQUE NOT NULL,
  refresh_token_hash text NOT NULL,
  parent_jti text,
  replaced_by_jti text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Assets table
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

-- Versions table  
CREATE TABLE IF NOT EXISTS versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  master_key text NOT NULL,
  checksum text,
  preview_prefix text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  body text NOT NULL,
  ts_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS ux_versions_asset_master ON versions(asset_id, master_key);
CREATE INDEX IF NOT EXISTS ix_versions_preview_prefix ON versions(preview_prefix);
CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_staging_key ON assets(staging_key);
CREATE INDEX IF NOT EXISTS ix_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS ix_sessions_jti ON sessions(jti);
CREATE INDEX IF NOT EXISTS ix_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS ix_user_roles_user_id ON user_roles(user_id);

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'Administrator with full access'),
  ('00000000-0000-0000-0000-000000000002', 'Editor', 'Can edit and manage content'),
  ('00000000-0000-0000-0000-000000000003', 'Viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;