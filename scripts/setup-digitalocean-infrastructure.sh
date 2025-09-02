#!/bin/bash

# DigitalOcean Infrastructure Setup Script
# Purpose: Create VPC, networking, and managed services for production deployment

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="${DO_REGION:-nyc3}"
PROJECT_NAME="motionmavericks"
ENVIRONMENT="production"

echo -e "${GREEN}=== DigitalOcean Infrastructure Setup ===${NC}"
echo "Region: $REGION"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if doctl is installed and authenticated
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}Error: doctl CLI is not installed${NC}"
    echo "Please install: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Verify authentication
if ! doctl auth list &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with DigitalOcean${NC}"
    echo "Please run: doctl auth init"
    exit 1
fi

echo -e "${GREEN}Step 1: Creating VPC${NC}"
# Create VPC with private IP range
VPC_OUTPUT=$(doctl vpcs create \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-vpc" \
    --region "$REGION" \
    --ip-range "10.10.0.0/20" \
    --description "Production VPC for Motion Mavericks" \
    --format ID,Name,IPRange \
    --no-header 2>/dev/null || echo "")

if [ -z "$VPC_OUTPUT" ]; then
    echo -e "${YELLOW}VPC might already exist, checking...${NC}"
    VPC_ID=$(doctl vpcs list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-vpc" | awk '{print $1}')
else
    VPC_ID=$(echo "$VPC_OUTPUT" | awk '{print $1}')
fi

if [ -z "$VPC_ID" ]; then
    echo -e "${RED}Failed to create or find VPC${NC}"
    exit 1
fi

echo "VPC ID: $VPC_ID"
echo ""

echo -e "${GREEN}Step 2: Creating Firewall Rules${NC}"
# Create firewall for database access
FIREWALL_OUTPUT=$(doctl compute firewall create \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-db-firewall" \
    --inbound-rules "protocol:tcp,ports:5432,sources:tag:backend" \
    --inbound-rules "protocol:tcp,ports:6379,sources:tag:backend" \
    --inbound-rules "protocol:tcp,ports:6379,sources:tag:worker" \
    --outbound-rules "protocol:tcp,ports:all,destinations:0.0.0.0/0" \
    --outbound-rules "protocol:udp,ports:all,destinations:0.0.0.0/0" \
    --tag-names "database" \
    --format ID,Name \
    --no-header 2>/dev/null || echo "")

if [ -z "$FIREWALL_OUTPUT" ]; then
    echo -e "${YELLOW}Firewall might already exist, checking...${NC}"
    FIREWALL_ID=$(doctl compute firewall list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-db-firewall" | awk '{print $1}')
else
    FIREWALL_ID=$(echo "$FIREWALL_OUTPUT" | awk '{print $1}')
fi

echo "Database Firewall ID: $FIREWALL_ID"

# Create firewall for application services
APP_FIREWALL_OUTPUT=$(doctl compute firewall create \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-app-firewall" \
    --inbound-rules "protocol:tcp,ports:80,sources:0.0.0.0/0" \
    --inbound-rules "protocol:tcp,ports:443,sources:0.0.0.0/0" \
    --inbound-rules "protocol:tcp,ports:3000,sources:tag:frontend" \
    --inbound-rules "protocol:tcp,ports:8080,sources:tag:frontend" \
    --outbound-rules "protocol:tcp,ports:all,destinations:0.0.0.0/0" \
    --outbound-rules "protocol:udp,ports:all,destinations:0.0.0.0/0" \
    --tag-names "backend,edge,frontend" \
    --format ID,Name \
    --no-header 2>/dev/null || echo "")

if [ -z "$APP_FIREWALL_OUTPUT" ]; then
    echo -e "${YELLOW}App firewall might already exist, checking...${NC}"
    APP_FIREWALL_ID=$(doctl compute firewall list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-app-firewall" | awk '{print $1}')
else
    APP_FIREWALL_ID=$(echo "$APP_FIREWALL_OUTPUT" | awk '{print $1}')
fi

echo "Application Firewall ID: $APP_FIREWALL_ID"
echo ""

echo -e "${GREEN}Step 3: Creating Load Balancer${NC}"
# Create load balancer for application
LB_OUTPUT=$(doctl compute load-balancer create \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-lb" \
    --region "$REGION" \
    --size "lb-small" \
    --vpc-uuid "$VPC_ID" \
    --forwarding-rules "entry_protocol:https,entry_port:443,target_protocol:http,target_port:3001,certificate_id:,tls_passthrough:false" \
    --forwarding-rules "entry_protocol:http,entry_port:80,target_protocol:http,target_port:3001" \
    --health-check "protocol:http,port:3001,path:/api/health,check_interval_seconds:10,response_timeout_seconds:5,healthy_threshold:3,unhealthy_threshold:3" \
    --tag-name "frontend" \
    --format ID,Name,IP,Status \
    --no-header \
    --wait 2>/dev/null || echo "")

if [ -z "$LB_OUTPUT" ]; then
    echo -e "${YELLOW}Load balancer might already exist, checking...${NC}"
    LB_ID=$(doctl compute load-balancer list --format ID,Name --no-header | grep "${PROJECT_NAME}-${ENVIRONMENT}-lb" | awk '{print $1}')
    LB_IP=$(doctl compute load-balancer get "$LB_ID" --format IP --no-header)
else
    LB_ID=$(echo "$LB_OUTPUT" | awk '{print $1}')
    LB_IP=$(echo "$LB_OUTPUT" | awk '{print $3}')
fi

echo "Load Balancer ID: $LB_ID"
echo "Load Balancer IP: $LB_IP"
echo ""

echo -e "${GREEN}Step 4: Network Topology Documentation${NC}"
# Generate network topology documentation
cat > network-topology.md << EOF
# DigitalOcean Network Topology

## Production Infrastructure - Motion Mavericks

### VPC Configuration
- **VPC ID**: $VPC_ID
- **VPC Name**: ${PROJECT_NAME}-${ENVIRONMENT}-vpc
- **IP Range**: 10.10.0.0/20
- **Region**: $REGION

### Firewall Rules

#### Database Firewall
- **ID**: $FIREWALL_ID
- **Name**: ${PROJECT_NAME}-${ENVIRONMENT}-db-firewall
- **Inbound Rules**:
  - PostgreSQL (5432): From backend services only
  - Redis (6379): From backend and worker services
- **Applied To**: Database instances

#### Application Firewall
- **ID**: $APP_FIREWALL_ID
- **Name**: ${PROJECT_NAME}-${ENVIRONMENT}-app-firewall
- **Inbound Rules**:
  - HTTP (80): Public access
  - HTTPS (443): Public access
  - Backend API (3000): From frontend only
  - Edge Service (8080): From frontend only
- **Applied To**: backend, edge, frontend services

### Load Balancer
- **ID**: $LB_ID
- **Name**: ${PROJECT_NAME}-${ENVIRONMENT}-lb
- **Public IP**: $LB_IP
- **Size**: lb-small
- **Forwarding Rules**:
  - HTTPS:443 → HTTP:3001 (Frontend)
  - HTTP:80 → HTTP:3001 (Frontend redirect)
- **Health Check**: HTTP GET /api/health on port 3001
- **Target**: Frontend service instances

### Service Architecture

\`\`\`
Internet
    ↓
Load Balancer ($LB_IP)
    ↓
┌─────────────── VPC (10.10.0.0/20) ───────────────┐
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Frontend Service (port 3001)             │   │
│  │ - Next.js application                    │   │
│  │ - Tags: frontend                         │   │
│  └──────────────────────────────────────────┘   │
│            ↓                    ↓                │
│  ┌─────────────────┐  ┌─────────────────┐      │
│  │ Backend API     │  │ Edge Service    │      │
│  │ (port 3000)     │  │ (port 8080)     │      │
│  │ - Fastify       │  │ - HMAC verify   │      │
│  │ - Tags: backend │  │ - Tags: edge    │      │
│  └─────────────────┘  └─────────────────┘      │
│            ↓                    ↓                │
│  ┌─────────────────────────────────────────┐   │
│  │ Managed Databases                       │   │
│  │ - PostgreSQL 16 (port 5432)            │   │
│  │ - Redis 7 (port 6379)                  │   │
│  │ - Tags: database                        │   │
│  └─────────────────────────────────────────┘   │
│            ↑                                     │
│  ┌─────────────────┐                           │
│  │ Worker Service  │                           │
│  │ - GPU processing│                           │
│  │ - Tags: worker  │                           │
│  └─────────────────┘                           │
└──────────────────────────────────────────────────┘
\`\`\`

### Security Groups Summary

| Service | Ingress Ports | Egress | Tags |
|---------|--------------|--------|------|
| Frontend | 80, 443 (public) | All | frontend |
| Backend | 3000 (from frontend) | All | backend |
| Edge | 8080 (from frontend) | All | edge |
| Worker | None | All | worker |
| PostgreSQL | 5432 (from backend) | N/A | database |
| Redis | 6379 (from backend, worker) | N/A | database |

### DNS Configuration (Pending)
- Production Domain: TBD
- SSL Certificate: Managed by DigitalOcean (Let's Encrypt)

### Next Steps
1. Create managed PostgreSQL database
2. Create managed Redis database
3. Configure App Platform deployment
4. Set up domain and SSL certificate
5. Configure monitoring and alerts

Generated: $(date)
EOF

echo "Network topology documented in network-topology.md"
echo ""

echo -e "${GREEN}Step 5: Generating Environment Variables${NC}"
# Generate environment variables for next steps
cat > infrastructure.env << EOF
# DigitalOcean Infrastructure IDs
export DO_VPC_ID="$VPC_ID"
export DO_FIREWALL_ID="$FIREWALL_ID"
export DO_APP_FIREWALL_ID="$APP_FIREWALL_ID"
export DO_LB_ID="$LB_ID"
export DO_LB_IP="$LB_IP"
export DO_REGION="$REGION"
export PROJECT_NAME="$PROJECT_NAME"
export ENVIRONMENT="$ENVIRONMENT"

# Service URLs (to be updated after deployment)
export FRONTEND_URL="https://$LB_IP"
export BACKEND_URL="http://backend.${PROJECT_NAME}.internal:3000"
export EDGE_URL="http://edge.${PROJECT_NAME}.internal:8080"
export PRIVATE_BACKEND_URL="http://10.10.0.10:3000"  # Update after deployment

# Generated: $(date)
EOF

echo "Environment variables saved to infrastructure.env"
echo ""

echo -e "${GREEN}=== Infrastructure Setup Complete ===${NC}"
echo ""
echo "Summary:"
echo "- VPC created with ID: $VPC_ID"
echo "- Firewall rules configured"
echo "- Load balancer provisioned at: $LB_IP"
echo "- Network topology documented"
echo ""
echo "Next steps:"
echo "1. Source the infrastructure.env file: source infrastructure.env"
echo "2. Run database setup script: ./setup-databases.sh"
echo "3. Configure Wasabi S3 buckets: ./setup-storage.sh"
echo "4. Deploy applications: ./deploy-apps.sh"