#!/bin/bash

# PostgreSQL Database Initialization Script for Media Asset Management System
# This script sets up the complete database with all required tables, permissions, and seed data

set -e

# Configuration
DB_NAME="${DB_NAME:-mam_db}"
DB_USER="${DB_USER:-mam_user}"
DB_PASSWORD="${DB_PASSWORD:-mam_password}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_ADMIN_USER="${POSTGRES_ADMIN_USER:-postgres}"

echo "🚀 Starting Media Asset Management Database Setup"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $POSTGRES_HOST:$POSTGRES_PORT"

# Create database and user if they don't exist
echo "📦 Creating database and user..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_ADMIN_USER" -d postgres << SQL
-- Create database
CREATE DATABASE $DB_NAME IF NOT EXISTS;

-- Create user with password
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT CREATE ON DATABASE $DB_NAME TO $DB_USER;
SQL

# Connect to our database and run migrations
echo "🔧 Running database migrations..."
PGPASSWORD="$DB_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PHASE 1: Base Schema (from schema.sql)
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

-- PHASE 2: Auth Tables (from 002_auth_tables.sql)
-- Drop old users table and recreate with proper structure
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with proper auth structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  authz_version INTEGER NOT NULL DEFAULT 1,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access'),
  ('Manager', 'Manage assets and users'),
  ('Editor', 'Create and edit assets'),
  ('Viewer', 'View assets only')
ON CONFLICT (name) DO NOTHING;

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('assets:read', 'View assets'),
  ('assets:write', 'Create and edit assets'),
  ('assets:delete', 'Delete assets'),
  ('assets:publish', 'Publish assets'),
  ('assets:approve', 'Approve asset changes'),
  ('collections:read', 'View collections'),
  ('collections:write', 'Create and edit collections'),
  ('collections:delete', 'Delete collections'),
  ('users:read', 'View users'),
  ('users:write', 'Create and edit users'),
  ('users:delete', 'Delete users'),
  ('roles:read', 'View roles'),
  ('roles:write', 'Manage roles'),
  ('audits:read', 'View audit logs'),
  ('sessions:revoke', 'Revoke user sessions')
ON CONFLICT (name) DO NOTHING;

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Manager' AND p.name IN (
  'assets:read', 'assets:write', 'assets:delete', 'assets:publish', 'assets:approve',
  'collections:read', 'collections:write', 'collections:delete',
  'users:read', 'roles:read', 'audits:read', 'sessions:revoke'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Editor' AND p.name IN (
  'assets:read', 'assets:write',
  'collections:read', 'collections:write'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Viewer' AND p.name IN (
  'assets:read', 'collections:read'
)
ON CONFLICT DO NOTHING;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti UUID NOT NULL UNIQUE,
  refresh_token_hash TEXT NOT NULL,
  parent_jti UUID,
  replaced_by_jti UUID,
  revoked_at TIMESTAMPTZ,
  reuse_detected BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Create access token denylist for emergency revocation
CREATE TABLE IF NOT EXISTS access_token_denylist (
  jti UUID PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_denylist_expires_at ON access_token_denylist(expires_at);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add function to bump authz_version on role changes
CREATE OR REPLACE FUNCTION bump_authz_version()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET authz_version = authz_version + 1
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bump_authz_on_role_change ON user_roles;
CREATE TRIGGER bump_authz_on_role_change
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION bump_authz_version();

-- Recreate assets table with proper foreign keys
CREATE TABLE IF NOT EXISTS assets_new (
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

-- Copy data from old assets if it exists
INSERT INTO assets_new (id, org_id, title, staging_key, master_key, checksum, bytes, mime, created_at)
SELECT id, org_id, title, staging_key, master_key, checksum, bytes, mime, created_at
FROM assets
ON CONFLICT DO NOTHING;

DROP TABLE IF EXISTS assets CASCADE;
ALTER TABLE assets_new RENAME TO assets;

-- Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_assets_staging_key ON assets(staging_key);

-- PHASE 3: Seed Data
-- Create default admin user (password: admin123!)
INSERT INTO users (email, display_name, password_hash, status)
SELECT 
  'admin@mam.local',
  'System Administrator',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'admin123!'
  'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mam.local');

-- Assign admin role to default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r
WHERE u.email = 'admin@mam.local' AND r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Create sample collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON collections(owner_id);

-- Create collection_assets junction table
CREATE TABLE IF NOT EXISTS collection_assets (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, asset_id)
);

-- Add update trigger to collections
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

SQL

echo "✅ Database setup completed successfully!"
echo "🔐 Default admin user created: admin@mam.local (password: admin123!)"
echo "📊 Database ready for deployment!"

# Display summary
PGPASSWORD="$DB_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  'Tables created: ' || count(*) as summary
FROM information_schema.tables 
WHERE table_schema = 'public';

SELECT 
  'Users created: ' || count(*) as user_count
FROM users;

SELECT 
  'Roles created: ' || count(*) as role_count
FROM roles;

SELECT 
  'Permissions created: ' || count(*) as permission_count
FROM permissions;
"

echo "🎉 Media Asset Management Database is ready!"
