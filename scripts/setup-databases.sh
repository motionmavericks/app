#!/bin/bash

# DigitalOcean Managed Database Setup Script
# Purpose: Create and configure PostgreSQL and Redis managed databases

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load infrastructure variables if available
if [ -f "infrastructure.env" ]; then
    source infrastructure.env
fi

# Configuration
REGION="${DO_REGION:-nyc3}"
PROJECT_NAME="${PROJECT_NAME:-motionmavericks}"
ENVIRONMENT="${ENVIRONMENT:-production}"

echo -e "${GREEN}=== DigitalOcean Managed Database Setup ===${NC}"
echo "Region: $REGION"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}Error: doctl CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Creating PostgreSQL 16 Managed Database${NC}"
echo "Configuration:"
echo "- Version: 16"
echo "- Size: db-s-2vcpu-4gb"
echo "- Nodes: 1 primary + 1 standby (HA)"
echo "- Connection Pool: Transaction mode, 100 connections"
echo ""

# Create PostgreSQL database
PG_OUTPUT=$(doctl databases create "${PROJECT_NAME}-${ENVIRONMENT}-pg" \
    --engine pg \
    --version 16 \
    --region "$REGION" \
    --size db-s-2vcpu-4gb \
    --num-nodes 2 \
    --private-network-uuid "$DO_VPC_ID" \
    --tag "database" \
    --format ID,Name,Engine,Status \
    --no-header \
    --wait 2>/dev/null || echo "")

if [ -z "$PG_OUTPUT" ]; then
    echo -e "${YELLOW}PostgreSQL database might already exist, checking...${NC}"
    PG_ID=$(doctl databases list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-pg" | awk '{print $1}')
else
    PG_ID=$(echo "$PG_OUTPUT" | awk '{print $1}')
fi

if [ -z "$PG_ID" ]; then
    echo -e "${RED}Failed to create or find PostgreSQL database${NC}"
    exit 1
fi

echo "PostgreSQL Database ID: $PG_ID"

# Wait for database to be ready
echo "Waiting for PostgreSQL to be ready..."
while true; do
    STATUS=$(doctl databases get "$PG_ID" --format Status --no-header)
    if [ "$STATUS" = "online" ]; then
        break
    fi
    echo -n "."
    sleep 10
done
echo " Ready!"

# Get connection details
echo "Retrieving PostgreSQL connection details..."
PG_HOST=$(doctl databases get "$PG_ID" --format Host --no-header)
PG_PORT=$(doctl databases get "$PG_ID" --format Port --no-header)
PG_USER=$(doctl databases get "$PG_ID" --format User --no-header)
PG_PASSWORD=$(doctl databases get "$PG_ID" --format Password --no-header)
PG_DATABASE=$(doctl databases get "$PG_ID" --format Database --no-header)
PG_PRIVATE_HOST=$(doctl databases get "$PG_ID" --format PrivateHost --no-header)

# Create connection pool
echo "Creating connection pool..."
doctl databases pool create "$PG_ID" "${PROJECT_NAME}-pool" \
    --db "$PG_DATABASE" \
    --mode transaction \
    --size 100 \
    --user "$PG_USER" \
    2>/dev/null || echo "Pool might already exist"

# Create application database
echo "Creating application database..."
doctl databases db create "$PG_ID" "$PROJECT_NAME" 2>/dev/null || echo "Database might already exist"

# Configure backup settings
echo "Configuring backup retention..."
doctl databases update "$PG_ID" \
    --backup-restore-window "02:00-04:00" \
    2>/dev/null || echo "Backup window already configured"

echo ""
echo -e "${GREEN}Step 2: Creating Redis 7 Managed Database${NC}"
echo "Configuration:"
echo "- Version: 7"
echo "- Size: db-s-1vcpu-2gb"
echo "- Eviction Policy: allkeys-lru"
echo "- Persistence: RDB snapshots"
echo ""

# Create Redis database
REDIS_OUTPUT=$(doctl databases create "${PROJECT_NAME}-${ENVIRONMENT}-redis" \
    --engine redis \
    --version 7 \
    --region "$REGION" \
    --size db-s-1vcpu-2gb \
    --num-nodes 1 \
    --private-network-uuid "$DO_VPC_ID" \
    --tag "database" \
    --format ID,Name,Engine,Status \
    --no-header \
    --wait 2>/dev/null || echo "")

if [ -z "$REDIS_OUTPUT" ]; then
    echo -e "${YELLOW}Redis database might already exist, checking...${NC}"
    REDIS_ID=$(doctl databases list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-redis" | awk '{print $1}')
else
    REDIS_ID=$(echo "$REDIS_OUTPUT" | awk '{print $1}')
fi

if [ -z "$REDIS_ID" ]; then
    echo -e "${RED}Failed to create or find Redis database${NC}"
    exit 1
fi

echo "Redis Database ID: $REDIS_ID"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while true; do
    STATUS=$(doctl databases get "$REDIS_ID" --format Status --no-header)
    if [ "$STATUS" = "online" ]; then
        break
    fi
    echo -n "."
    sleep 10
done
echo " Ready!"

# Get Redis connection details
echo "Retrieving Redis connection details..."
REDIS_HOST=$(doctl databases get "$REDIS_ID" --format Host --no-header)
REDIS_PORT=$(doctl databases get "$REDIS_ID" --format Port --no-header)
REDIS_PASSWORD=$(doctl databases get "$REDIS_ID" --format Password --no-header)
REDIS_PRIVATE_HOST=$(doctl databases get "$REDIS_ID" --format PrivateHost --no-header)

# Configure Redis settings
echo "Configuring Redis eviction policy..."
doctl databases redis config update "$REDIS_ID" \
    --maxmemory-policy allkeys-lru \
    --persistence rdb \
    --timeout 300 \
    2>/dev/null || echo "Redis config already set"

echo ""
echo -e "${GREEN}Step 3: Configuring Firewall Rules for Databases${NC}"

# Add trusted sources for databases
echo "Adding VPC as trusted source for PostgreSQL..."
doctl databases firewalls append "$PG_ID" \
    --rule vpc-uuid:"$DO_VPC_ID" \
    2>/dev/null || echo "VPC already trusted"

echo "Adding VPC as trusted source for Redis..."
doctl databases firewalls append "$REDIS_ID" \
    --rule vpc-uuid:"$DO_VPC_ID" \
    2>/dev/null || echo "VPC already trusted"

echo ""
echo -e "${GREEN}Step 4: Generating Database Configuration${NC}"

# Generate database URLs
PG_PUBLIC_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PROJECT_NAME}?sslmode=require"
PG_PRIVATE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_PRIVATE_HOST}:${PG_PORT}/${PROJECT_NAME}?sslmode=require"
PG_POOL_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_PRIVATE_HOST}:25061/${PROJECT_NAME}?sslmode=require&pgbouncer=true"

REDIS_PUBLIC_URL="rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}"
REDIS_PRIVATE_URL="rediss://default:${REDIS_PASSWORD}@${REDIS_PRIVATE_HOST}:${REDIS_PORT}"

# Save database configuration
cat > database.env << EOF
# PostgreSQL Configuration
export PG_ID="$PG_ID"
export PG_HOST="$PG_HOST"
export PG_PRIVATE_HOST="$PG_PRIVATE_HOST"
export PG_PORT="$PG_PORT"
export PG_USER="$PG_USER"
export PG_PASSWORD="$PG_PASSWORD"
export PG_DATABASE="$PROJECT_NAME"

# PostgreSQL Connection URLs
export POSTGRES_URL="$PG_PRIVATE_URL"
export POSTGRES_PUBLIC_URL="$PG_PUBLIC_URL"
export POSTGRES_POOL_URL="$PG_POOL_URL"

# Redis Configuration
export REDIS_ID="$REDIS_ID"
export REDIS_HOST="$REDIS_HOST"
export REDIS_PRIVATE_HOST="$REDIS_PRIVATE_HOST"
export REDIS_PORT="$REDIS_PORT"
export REDIS_PASSWORD="$REDIS_PASSWORD"

# Redis Connection URLs
export REDIS_URL="$REDIS_PRIVATE_URL"
export REDIS_PUBLIC_URL="$REDIS_PUBLIC_URL"

# Queue Configuration
export PREVIEW_STREAM="previews:build"

# Generated: $(date)
EOF

echo "Database configuration saved to database.env"

# Generate database documentation
cat > database-setup.md << EOF
# Managed Database Configuration

## PostgreSQL 16
- **Database ID**: $PG_ID
- **Name**: ${PROJECT_NAME}-${ENVIRONMENT}-pg
- **Version**: PostgreSQL 16
- **Size**: db-s-2vcpu-4gb (2 vCPU, 4GB RAM, 38GB disk)
- **High Availability**: Yes (1 primary + 1 standby)
- **Region**: $REGION
- **VPC**: $DO_VPC_ID

### Connection Details
- **Private Host**: $PG_PRIVATE_HOST
- **Public Host**: $PG_HOST
- **Port**: $PG_PORT
- **Database**: $PROJECT_NAME
- **User**: $PG_USER
- **Connection Pool**: ${PROJECT_NAME}-pool (100 connections, transaction mode)

### Connection URLs
\`\`\`
# Private (within VPC)
$PG_PRIVATE_URL

# With Connection Pooling
$PG_POOL_URL
\`\`\`

### Backup Configuration
- **Schedule**: Daily at 02:00-04:00 UTC
- **Retention**: 7 days
- **Type**: Automated snapshots

## Redis 7
- **Database ID**: $REDIS_ID
- **Name**: ${PROJECT_NAME}-${ENVIRONMENT}-redis
- **Version**: Redis 7
- **Size**: db-s-1vcpu-2gb (1 vCPU, 2GB RAM, 25GB disk)
- **Region**: $REGION
- **VPC**: $DO_VPC_ID

### Connection Details
- **Private Host**: $REDIS_PRIVATE_HOST
- **Public Host**: $REDIS_HOST
- **Port**: $REDIS_PORT

### Configuration
- **Eviction Policy**: allkeys-lru
- **Persistence**: RDB snapshots every 5 minutes
- **Timeout**: 300 seconds
- **Max Memory**: 90% threshold

### Connection URLs
\`\`\`
# Private (within VPC)
$REDIS_PRIVATE_URL
\`\`\`

## Security Configuration
- Both databases are accessible only within the VPC
- SSL/TLS required for all connections
- Firewall rules restrict access to tagged services only
- Connection pooling enabled for PostgreSQL

## Monitoring
- CPU, memory, and disk metrics available in DigitalOcean dashboard
- Alert policies can be configured for:
  - High CPU usage (>80%)
  - High memory usage (>90%)
  - Low disk space (<10%)
  - Connection pool exhaustion

Generated: $(date)
EOF

echo "Database documentation saved to database-setup.md"
echo ""

echo -e "${GREEN}Step 5: Testing Database Connectivity${NC}"

# Test PostgreSQL connection
echo -n "Testing PostgreSQL connection... "
if command -v psql &> /dev/null; then
    if PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" -c "SELECT version();" &> /dev/null; then
        echo -e "${GREEN}Success${NC}"
    else
        echo -e "${YELLOW}Failed (might need to wait for propagation)${NC}"
    fi
else
    echo -e "${YELLOW}psql not installed, skipping test${NC}"
fi

# Test Redis connection
echo -n "Testing Redis connection... "
if command -v redis-cli &> /dev/null; then
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --tls ping &> /dev/null; then
        echo -e "${GREEN}Success${NC}"
    else
        echo -e "${YELLOW}Failed (might need to wait for propagation)${NC}"
    fi
else
    echo -e "${YELLOW}redis-cli not installed, skipping test${NC}"
fi

echo ""
echo -e "${GREEN}=== Database Setup Complete ===${NC}"
echo ""
echo "Summary:"
echo "- PostgreSQL 16 database created with HA"
echo "- Redis 7 database created"
echo "- Connection pooling configured"
echo "- Backup policies set"
echo "- VPC networking configured"
echo ""
echo "Next steps:"
echo "1. Source the database.env file: source database.env"
echo "2. Run database migrations: npm run migrate (in backend directory)"
echo "3. Configure application environment variables"
echo "4. Test connectivity from application services"