import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL missing');
  const pool = new Pool({ connectionString: url });
  
  // Apply base schema first
  const ddlPath = resolve(process.cwd(), '../database/schema.sql');
  const sql = readFileSync(ddlPath, 'utf8');
  await pool.query(sql);
  
  // Apply advanced asset management schema
  const advancedSchema = getAdvancedAssetManagementSchema();
  await pool.query(advancedSchema);
  
  await pool.end();
  console.log('Migration applied with advanced asset management');
}

function getAdvancedAssetManagementSchema(): string {
  return `
-- Migration: Advanced Asset Management Schema
-- Version: 2025-09-03-001
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
CREATE INDEX IF NOT EXISTS idx_folders_name_search ON folders USING GIN (to_tsvector('english', name));

-- 2. Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT collection_name_unique_per_user UNIQUE (name, user_id),
    CONSTRAINT collection_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes for collections
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_collections_name_search ON collections USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- 3. Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    field_type field_type NOT NULL,
    options JSONB, -- Configuration: dropdown options, validation rules, etc.
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT custom_field_name_unique_per_user UNIQUE (name, user_id),
    CONSTRAINT custom_field_name_format CHECK (name ~ '^[a-zA-Z0-9_\\s-]{1,100}$'),
    CONSTRAINT custom_field_options_valid CHECK (
        (field_type = 'dropdown' AND options ? 'values' AND jsonb_array_length(options->'values') > 0) OR
        (field_type != 'dropdown')
    )
);

-- Indexes for custom_fields
CREATE INDEX IF NOT EXISTS idx_custom_fields_user_id ON custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_type ON custom_fields(field_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_searchable ON custom_fields(is_searchable) WHERE is_searchable = TRUE;
CREATE INDEX IF NOT EXISTS idx_custom_fields_display_order ON custom_fields(user_id, display_order);

-- 4. Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_count INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE, -- System tags vs user tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT tag_name_unique_per_user UNIQUE (name, user_id),
    CONSTRAINT tag_name_format CHECK (name ~ '^[a-zA-Z0-9\\s_-]{1,100}$'),
    CONSTRAINT tag_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT tag_usage_count_non_negative CHECK (usage_count >= 0)
);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON tags(lower(name));
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_system ON tags(is_system);
CREATE INDEX IF NOT EXISTS idx_tags_name_search ON tags USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- 5. Create asset_collections table
CREATE TABLE IF NOT EXISTS asset_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT asset_collection_unique UNIQUE (asset_id, collection_id)
);

-- Indexes for asset_collections
CREATE INDEX IF NOT EXISTS idx_asset_collections_asset_id ON asset_collections(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_collections_collection_id ON asset_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_asset_collections_added_by ON asset_collections(added_by);
CREATE INDEX IF NOT EXISTS idx_asset_collections_added_at ON asset_collections(added_at DESC);

-- 6. Create asset_metadata table
CREATE TABLE IF NOT EXISTS asset_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT asset_metadata_unique UNIQUE (asset_id, field_id),
    CONSTRAINT asset_metadata_value_not_null CHECK (value IS NOT NULL AND value != 'null'::jsonb)
);

-- Indexes for asset_metadata
CREATE INDEX IF NOT EXISTS idx_asset_metadata_asset_id ON asset_metadata(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_field_id ON asset_metadata(field_id);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_value ON asset_metadata USING GIN (value);
CREATE INDEX IF NOT EXISTS idx_asset_metadata_value_text ON asset_metadata USING GIN ((value #>> '{}')) WHERE jsonb_typeof(value) = 'string';
CREATE INDEX IF NOT EXISTS idx_asset_metadata_value_number ON asset_metadata ((value #>> '{}')::numeric) WHERE jsonb_typeof(value) = 'number';
CREATE INDEX IF NOT EXISTS idx_asset_metadata_value_date ON asset_metadata ((value #>> '{}')::timestamp) WHERE jsonb_typeof(value) = 'string' AND value #>> '{}' ~ '^\\d{4}-\\d{2}-\\d{2}';

-- 7. Create asset_tags table
CREATE TABLE IF NOT EXISTS asset_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT asset_tag_unique UNIQUE (asset_id, tag_id)
);

-- Indexes for asset_tags
CREATE INDEX IF NOT EXISTS idx_asset_tags_asset_id ON asset_tags(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_tags_tag_id ON asset_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_asset_tags_created_at ON asset_tags(created_at DESC);

-- 8. Modify assets table - add new columns
ALTER TABLE assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS metadata_hash TEXT; -- Hash of metadata for change detection
ALTER TABLE assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Update assets table to use consistent naming with spec
UPDATE assets SET user_id = owner_id WHERE user_id IS NULL AND owner_id IS NOT NULL;
UPDATE assets SET mime_type = mime WHERE mime_type IS NULL AND mime IS NOT NULL;
UPDATE assets SET file_size = bytes WHERE file_size IS NULL AND bytes IS NOT NULL;
UPDATE assets SET filename = staging_key WHERE filename IS NULL AND staging_key IS NOT NULL;
UPDATE assets SET original_filename = staging_key WHERE original_filename IS NULL AND staging_key IS NOT NULL;

-- Create indexes for modified assets table
CREATE INDEX IF NOT EXISTS idx_assets_folder_id ON assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_assets_search_vector ON assets USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_hash ON assets(metadata_hash);
CREATE INDEX IF NOT EXISTS idx_assets_folder_date ON assets(folder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_user_folder ON assets(user_id, folder_id);

-- Create functions and triggers

-- Folder path update functions
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path ltree;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path = NEW.id::text::ltree;
    ELSE
        SELECT path INTO parent_path FROM folders WHERE id = NEW.parent_id;
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent folder not found';
        END IF;
        NEW.path = parent_path || NEW.id::text::ltree;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_folder_path_trigger ON folders;
CREATE TRIGGER update_folder_path_trigger
    BEFORE INSERT OR UPDATE OF parent_id ON folders
    FOR EACH ROW EXECUTE FUNCTION update_folder_path();

CREATE OR REPLACE FUNCTION update_child_folder_paths()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.path IS DISTINCT FROM NEW.path THEN
        UPDATE folders 
        SET path = NEW.path || subpath(path, nlevel(OLD.path))
        WHERE path <@ OLD.path AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_child_folder_paths_trigger ON folders;
CREATE TRIGGER update_child_folder_paths_trigger
    AFTER UPDATE OF path ON folders
    FOR EACH ROW EXECUTE FUNCTION update_child_folder_paths();

-- Generic timestamp update function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_collection_timestamp_trigger ON collections;
CREATE TRIGGER update_collection_timestamp_trigger
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_custom_field_timestamp_trigger ON custom_fields;
CREATE TRIGGER update_custom_field_timestamp_trigger
    BEFORE UPDATE ON custom_fields
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_tag_timestamp_trigger ON tags;
CREATE TRIGGER update_tag_timestamp_trigger
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_asset_metadata_timestamp_trigger ON asset_metadata;
CREATE TRIGGER update_asset_metadata_timestamp_trigger
    BEFORE UPDATE ON asset_metadata
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Collection update on asset change
CREATE OR REPLACE FUNCTION update_collection_on_asset_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE collections SET updated_at = NOW() WHERE id = OLD.collection_id;
        RETURN OLD;
    ELSE
        UPDATE collections SET updated_at = NOW() WHERE id = NEW.collection_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collection_on_asset_change_trigger ON asset_collections;
CREATE TRIGGER update_collection_on_asset_change_trigger
    AFTER INSERT OR DELETE ON asset_collections
    FOR EACH ROW EXECUTE FUNCTION update_collection_on_asset_change();

-- Tag usage count update
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
        RETURN OLD;
    ELSE
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tag_usage_count_trigger ON asset_tags;
CREATE TRIGGER update_tag_usage_count_trigger
    AFTER INSERT OR DELETE ON asset_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Metadata value validation
CREATE OR REPLACE FUNCTION validate_metadata_value()
RETURNS TRIGGER AS $$
DECLARE
    field_record custom_fields%ROWTYPE;
    value_text TEXT;
    value_number NUMERIC;
    value_date DATE;
BEGIN
    SELECT * INTO field_record FROM custom_fields WHERE id = NEW.field_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Custom field not found: %', NEW.field_id;
    END IF;
    
    -- Validate based on field type
    CASE field_record.field_type
        WHEN 'text' THEN
            IF jsonb_typeof(NEW.value) != 'string' THEN
                RAISE EXCEPTION 'Text field requires string value';
            END IF;
            value_text := NEW.value #>> '{}';
            IF length(value_text) > 1000 THEN
                RAISE EXCEPTION 'Text value too long (max 1000 characters)';
            END IF;
            
        WHEN 'number' THEN
            IF jsonb_typeof(NEW.value) != 'number' THEN
                RAISE EXCEPTION 'Number field requires numeric value';
            END IF;
            
        WHEN 'date' THEN
            IF jsonb_typeof(NEW.value) != 'string' THEN
                RAISE EXCEPTION 'Date field requires string value in ISO format';
            END IF;
            value_text := NEW.value #>> '{}';
            BEGIN
                value_date := value_text::DATE;
            EXCEPTION WHEN others THEN
                RAISE EXCEPTION 'Invalid date format: %', value_text;
            END;
            
        WHEN 'dropdown' THEN
            IF jsonb_typeof(NEW.value) != 'string' THEN
                RAISE EXCEPTION 'Dropdown field requires string value';
            END IF;
            value_text := NEW.value #>> '{}';
            IF NOT (field_record.options->'values' @> to_jsonb(value_text)) THEN
                RAISE EXCEPTION 'Value not in dropdown options: %', value_text;
            END IF;
            
        WHEN 'boolean' THEN
            IF jsonb_typeof(NEW.value) != 'boolean' THEN
                RAISE EXCEPTION 'Boolean field requires boolean value';
            END IF;
            
        WHEN 'url' THEN
            IF jsonb_typeof(NEW.value) != 'string' THEN
                RAISE EXCEPTION 'URL field requires string value';
            END IF;
            value_text := NEW.value #>> '{}';
            IF NOT (value_text ~ '^https?://[^\\s/$.?#].[^\\s]*$') THEN
                RAISE EXCEPTION 'Invalid URL format: %', value_text;
            END IF;
            
        WHEN 'email' THEN
            IF jsonb_typeof(NEW.value) != 'string' THEN
                RAISE EXCEPTION 'Email field requires string value';
            END IF;
            value_text := NEW.value #>> '{}';
            IF NOT (value_text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$') THEN
                RAISE EXCEPTION 'Invalid email format: %', value_text;
            END IF;
    END CASE;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_metadata_value_trigger ON asset_metadata;
CREATE TRIGGER validate_metadata_value_trigger
    BEFORE INSERT OR UPDATE ON asset_metadata
    FOR EACH ROW EXECUTE FUNCTION validate_metadata_value();

-- Asset search vector update function
CREATE OR REPLACE FUNCTION update_asset_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    metadata_text TEXT := '';
    tag_text TEXT := '';
BEGIN
    -- Collect custom metadata text
    SELECT string_agg(
        CASE 
            WHEN jsonb_typeof(am.value) = 'string' THEN am.value #>> '{}'
            WHEN jsonb_typeof(am.value) = 'number' THEN am.value #>> '{}'
            WHEN jsonb_typeof(am.value) = 'boolean' THEN 
                CASE WHEN (am.value #>> '{}')::boolean THEN 'true' ELSE 'false' END
            ELSE ''
        END, ' '
    ) INTO metadata_text
    FROM asset_metadata am
    JOIN custom_fields cf ON am.field_id = cf.id
    WHERE am.asset_id = NEW.id AND cf.is_searchable = TRUE;
    
    -- Collect tag text
    SELECT string_agg(t.name, ' ')
    INTO tag_text
    FROM asset_tags at
    JOIN tags t ON at.tag_id = t.id
    WHERE at.asset_id = NEW.id;
    
    -- Build search vector
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.filename, '') || ' ' ||
        COALESCE(NEW.original_filename, '') || ' ' ||
        COALESCE(NEW.mime_type, '') || ' ' ||
        COALESCE(metadata_text, '') || ' ' ||
        COALESCE(tag_text, '')
    );
    
    -- Update metadata hash for change detection
    NEW.metadata_hash = md5(
        COALESCE(metadata_text, '') || '|' || COALESCE(tag_text, '')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_asset_search_vector_trigger ON assets;
CREATE TRIGGER update_asset_search_vector_trigger
    BEFORE INSERT OR UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_asset_search_vector();

-- Function to refresh search vector when metadata changes
CREATE OR REPLACE FUNCTION refresh_asset_search_vector(asset_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE assets SET updated_at = updated_at WHERE id = asset_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh asset search vector when metadata changes
CREATE OR REPLACE FUNCTION refresh_asset_on_metadata_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM refresh_asset_search_vector(OLD.asset_id);
        RETURN OLD;
    ELSE
        PERFORM refresh_asset_search_vector(NEW.asset_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS refresh_asset_on_metadata_change_trigger ON asset_metadata;
CREATE TRIGGER refresh_asset_on_metadata_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON asset_metadata
    FOR EACH ROW EXECUTE FUNCTION refresh_asset_on_metadata_change();

DROP TRIGGER IF EXISTS refresh_asset_on_tag_change_trigger ON asset_tags;
CREATE TRIGGER refresh_asset_on_tag_change_trigger
    AFTER INSERT OR DELETE ON asset_tags
    FOR EACH ROW EXECUTE FUNCTION refresh_asset_on_metadata_change();

-- Data migration: Create default folder structure
INSERT INTO folders (name, parent_id, user_id, description)
SELECT 'Imports', NULL, id, 'Default folder for uploaded assets'
FROM users
ON CONFLICT DO NOTHING;

-- Data migration: Move existing assets to default folders (only if user_id exists)
UPDATE assets 
SET folder_id = f.id
FROM folders f
WHERE f.name = 'Imports' 
  AND f.parent_id IS NULL 
  AND f.user_id = assets.user_id
  AND assets.folder_id IS NULL
  AND assets.user_id IS NOT NULL;

-- Create default system tags
INSERT INTO tags (name, color, user_id, is_system, description)
SELECT 'Image', '#10B981', id, TRUE, 'Image files'
FROM users
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = users.id)
UNION ALL
SELECT 'Video', '#3B82F6', id, TRUE, 'Video files'
FROM users
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = users.id)
UNION ALL  
SELECT 'Audio', '#8B5CF6', id, TRUE, 'Audio files'
FROM users
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = users.id)
UNION ALL
SELECT 'Document', '#F59E0B', id, TRUE, 'Document files'
FROM users
WHERE EXISTS (SELECT 1 FROM users WHERE users.id = users.id)
ON CONFLICT DO NOTHING;

-- Apply system tags based on mime types (only if user_id exists)
INSERT INTO asset_tags (asset_id, tag_id)
SELECT a.id, t.id
FROM assets a
JOIN tags t ON t.user_id = a.user_id AND t.is_system = TRUE
WHERE a.user_id IS NOT NULL
  AND a.mime_type IS NOT NULL
  AND (
    (a.mime_type LIKE 'image/%' AND t.name = 'Image') OR
    (a.mime_type LIKE 'video/%' AND t.name = 'Video') OR
    (a.mime_type LIKE 'audio/%' AND t.name = 'Audio') OR
    (a.mime_type LIKE 'application/%' AND t.name = 'Document')
)
ON CONFLICT DO NOTHING;

-- Update search vectors for existing assets (only those with user_id)
UPDATE assets SET updated_at = updated_at WHERE user_id IS NOT NULL;

-- Create additional performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_folder_type_date 
ON assets(folder_id, mime_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assets_user_folder_updated
ON assets(user_id, folder_id, updated_at DESC);

-- Verify migration
DO $$
DECLARE
    folder_count INTEGER;
    tag_count INTEGER;
    collection_count INTEGER;
    custom_field_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO folder_count FROM folders;
    SELECT COUNT(*) INTO tag_count FROM tags WHERE is_system = TRUE;
    SELECT COUNT(*) INTO collection_count FROM collections;
    SELECT COUNT(*) INTO custom_field_count FROM custom_fields;
    
    RAISE NOTICE 'Advanced Asset Management migration completed successfully:';
    RAISE NOTICE '  - Created % folders', folder_count;
    RAISE NOTICE '  - Created % system tags', tag_count;
    RAISE NOTICE '  - Collections table ready (% existing)', collection_count;
    RAISE NOTICE '  - Custom fields table ready (% existing)', custom_field_count;
    RAISE NOTICE '  - All eligible assets have search vectors updated';
END
$$;

COMMIT;
  `;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

