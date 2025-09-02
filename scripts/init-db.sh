#!/bin/bash

# Database initialization script for Media Asset Manager
# Usage: ./init-db.sh [postgres_url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Media Asset Manager - Database Initialization${NC}"
echo "================================================"

# Check for PostgreSQL URL
if [ -z "$1" ]; then
    if [ -z "$POSTGRES_URL" ]; then
        echo -e "${RED}Error: No PostgreSQL URL provided${NC}"
        echo "Usage: $0 <postgres_url>"
        echo "   or: export POSTGRES_URL=<url> && $0"
        exit 1
    fi
    DB_URL="$POSTGRES_URL"
else
    DB_URL="$1"
fi

echo -e "${YELLOW}Using database URL:${NC} ${DB_URL:0:30}..."

# Function to run SQL file
run_sql() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Running:${NC} $description"
        psql "$DB_URL" -f "$file" -v ON_ERROR_STOP=1
        echo -e "${GREEN}✓${NC} $description completed"
    else
        echo -e "${RED}✗${NC} File not found: $file"
        return 1
    fi
}

# Change to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo ""
echo "Running database migrations..."
echo "------------------------------"

# Run base schema
run_sql "database/schema.sql" "Base schema creation"

# Run migrations in order
if [ -d "database/migrations" ]; then
    for migration in database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            migration_name=$(basename "$migration")
            run_sql "$migration" "Migration: $migration_name"
        fi
    done
else
    echo -e "${YELLOW}No migrations directory found${NC}"
fi

# Create initial admin user (optional)
echo ""
echo -e "${YELLOW}Creating initial admin user...${NC}"

psql "$DB_URL" <<EOF
-- Check if admin exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mam.local') THEN
        -- Create admin user with default password 'Admin123!@#'
        INSERT INTO users (
            id, 
            email, 
            display_name, 
            password_hash, 
            status, 
            authz_version
        ) VALUES (
            gen_random_uuid(),
            'admin@mam.local',
            'System Administrator',
            -- This is the Argon2 hash for 'Admin123!@#'
            '\$argon2id\$v=19\$m=19456,t=2,p=1\$tFE+TYNMRDqDYVzxNO6haQ\$Bq2Xn9N0SvTdJqxPL8uOzBqP7mfwYrZfVqI6VvDDyWE',
            'active',
            1
        );
        
        -- Assign Admin role
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id 
        FROM users u, roles r 
        WHERE u.email = 'admin@mam.local' AND r.name = 'Admin';
        
        RAISE NOTICE 'Admin user created: admin@mam.local / Admin123!@#';
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END\$\$;
EOF

echo ""
echo -e "${GREEN}Database initialization complete!${NC}"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Base schema created"
echo "✓ Auth tables created"
echo "✓ Roles and permissions configured"
echo "✓ Initial admin user ready"
echo ""
echo -e "${YELLOW}Default admin credentials:${NC}"
echo "  Email: admin@mam.local"
echo "  Password: Admin123!@#"
echo ""
echo -e "${GREEN}You can now start the backend service!${NC}"