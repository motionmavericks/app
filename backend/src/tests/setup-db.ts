// Removed vitest imports to avoid global setup conflicts - these are used in individual test files
import { TestDatabase } from '../test/db-real.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Global test database setup - exported functions to be called in individual test files
export const setupDatabase = {
  async initialize() {
    await TestDatabase.initialize();
    await setupTestSchema();
  },
  
  async startTransaction() {
    await TestDatabase.getTestClient();
  },
  
  async cleanup() {
    await TestDatabase.cleanup();
  },
  
  async close() {
    await TestDatabase.close();
  }
};

// Setup test schema and seed data
async function setupTestSchema(): Promise<void> {
  try {
    // Apply auth tables migration first (complete schema with users, roles, sessions, etc.)
    const authSchemaPath = resolve(process.cwd(), '../database/migrations/002_auth_tables.sql');
    const authSchema = readFileSync(authSchemaPath, 'utf8');
    await TestDatabase.query(authSchema);

    // Apply assets schema parts from base schema (excluding users table to avoid conflict)
    const assetsSchema = getAssetsSchema();
    await TestDatabase.query(assetsSchema);

    // Apply advanced schema from migrate.ts
    const advancedSchema = getAdvancedAssetManagementSchema();
    await TestDatabase.query(advancedSchema);

    // Setup essential roles (additional ones beyond migration)
    await setupEssentialRoles();

    console.log('✅ Test database schema initialized');
  } catch (error) {
    console.error('❌ Failed to setup test schema:', error);
    throw error;
  }
}

// Setup essential roles for testing
async function setupEssentialRoles(): Promise<void> {
  const roles = [
    { name: 'Admin', permissions: ['*'] },
    { name: 'Viewer', permissions: ['assets:read'] },
    { name: 'Editor', permissions: ['assets:read', 'assets:write'] }
  ];

  for (const role of roles) {
    try {
      await TestDatabase.query(`
        INSERT INTO roles (id, name, permissions) 
        VALUES (gen_random_uuid(), $1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [role.name, JSON.stringify(role.permissions)]);
    } catch (error) {
      // Ignore role creation errors - they might already exist
    }
  }
}

// Assets schema from base schema (excluding users to avoid conflicts)
function getAssetsSchema(): string {
  return `
-- Assets and related tables (from base schema)
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
  `;
}

// Advanced schema from migrate.ts (extracted for testing)
function getAdvancedAssetManagementSchema(): string {
  return `
-- Migration: Advanced Asset Management Schema (Test Version)
-- Version: 2025-09-03-001-test
-- Description: Add hierarchical folders, collections, custom metadata, and tags

BEGIN;

-- Enable ltree extension for hierarchical paths
CREATE EXTENSION IF NOT EXISTS ltree;

-- Create new field types
DO $$ BEGIN
    CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'dropdown', 'boolean', 'url', 'email');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT,
    path ltree, -- Materialized path for efficient tree operations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT folder_name_unique_per_parent UNIQUE (name, parent_id, user_id),
    CONSTRAINT folder_no_self_parent CHECK (id != parent_id),
    CONSTRAINT folder_path_valid CHECK (path ~ '^[a-f0-9_-]+(\\.[a-f0-9_-]+)*$')
);

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders USING GIST (path);

-- 2. Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT collection_name_unique_per_user UNIQUE (name, user_id)
);

-- 3. Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    field_type field_type NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT custom_field_name_unique_per_user UNIQUE (name, user_id)
);

-- 4. Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT tag_name_unique_per_user UNIQUE (name, user_id)
);

-- 5. Create asset_collections table
CREATE TABLE IF NOT EXISTS asset_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT asset_collection_unique UNIQUE (asset_id, collection_id)
);

-- 6. Create asset_metadata table
CREATE TABLE IF NOT EXISTS asset_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT asset_metadata_unique UNIQUE (asset_id, field_id)
);

-- 7. Create asset_tags table
CREATE TABLE IF NOT EXISTS asset_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT asset_tag_unique UNIQUE (asset_id, tag_id)
);

-- 8. Modify assets table - add new columns
ALTER TABLE assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS metadata_hash TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS file_size BIGINT;

COMMIT;
  `;
}

// Utility function to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await TestDatabase.initialize();
    return true;
  } catch (error) {
    console.warn('⚠️  Test database not available:', (error as Error).message);
    return false;
  }
}

// Utility function to reset database state
export async function resetDatabaseState(): Promise<void> {
  await TestDatabase.cleanup();
  await TestDatabase.getTestClient();
}