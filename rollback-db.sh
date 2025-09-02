#!/bin/bash

# PostgreSQL Database Rollback Script for Media Asset Management System
# This script can be used to rollback database changes or completely reset the database

set -e

# Configuration
DB_NAME="${DB_NAME:-mam_db}"
DB_USER="${DB_USER:-mam_user}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_ADMIN_USER="${POSTGRES_ADMIN_USER:-postgres}"

ROLLBACK_TYPE="${1:-partial}"

echo "🔄 Starting Database Rollback (Type: $ROLLBACK_TYPE)"

case "$ROLLBACK_TYPE" in
  "full")
    echo "⚠️  FULL ROLLBACK: Dropping entire database and user"
    read -p "Are you sure? This will delete ALL data! (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
      echo "Rollback cancelled."
      exit 1
    fi
    
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_ADMIN_USER" -d postgres << SQL
-- Terminate all connections to the database
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();

-- Drop database and user
DROP DATABASE IF EXISTS $DB_NAME;
DROP ROLE IF EXISTS $DB_USER;
SQL
    echo "✅ Full rollback completed - database and user removed"
    ;;
    
  "data")
    echo "🗑️  DATA ROLLBACK: Clearing all data but keeping structure"
    PGPASSWORD="$DB_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
-- Clear data in dependency order
DELETE FROM collection_assets;
DELETE FROM collections;
DELETE FROM audit_logs;
DELETE FROM access_token_denylist;
DELETE FROM sessions;
DELETE FROM user_roles;
DELETE FROM role_permissions;
DELETE FROM versions;
DELETE FROM comments;
DELETE FROM assets;
DELETE FROM users;
DELETE FROM roles;
DELETE FROM permissions;

-- Reset sequences if any
-- (UUIDs don't use sequences, so this is mainly for future-proofing)

-- Verify cleanup
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_name = t1.table_name) as record_count
FROM information_schema.tables t1
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
SQL
    echo "✅ Data rollback completed - all records cleared"
    ;;
    
  "schema")
    echo "🏗️  SCHEMA ROLLBACK: Dropping all tables and functions"
    PGPASSWORD="$DB_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
-- Drop all triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
DROP TRIGGER IF EXISTS bump_authz_on_role_change ON user_roles;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS collection_assets CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS access_token_denylist CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS versions CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS bump_authz_version() CASCADE;

-- Drop extensions (careful with this in shared databases)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
SQL
    echo "✅ Schema rollback completed - all tables and functions removed"
    ;;
    
  "partial"|*)
    echo "🔄 PARTIAL ROLLBACK: Removing seed data only"
    PGPASSWORD="$DB_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$DB_USER" -d "$DB_NAME" << 'SQL'
-- Remove seed data
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'admin@mam.local');
DELETE FROM users WHERE email = 'admin@mam.local';

-- Clear session and audit data
DELETE FROM sessions;
DELETE FROM audit_logs;
DELETE FROM access_token_denylist;

-- Keep roles and permissions for future use
SQL
    echo "✅ Partial rollback completed - seed data removed, schema intact"
    ;;
esac

echo "🏁 Rollback operation completed!"
