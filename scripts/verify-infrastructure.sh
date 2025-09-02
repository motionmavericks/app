#!/bin/bash

# Infrastructure Verification Script
# Purpose: Run comprehensive validation of all infrastructure components

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

echo -e "${GREEN}=== Infrastructure Foundation Verification ===${NC}"
echo "Starting comprehensive infrastructure validation..."
echo "Timestamp: $(date)"
echo ""

# Function to run a test
run_test() {
    local TEST_NAME=$1
    local TEST_COMMAND=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "[$TOTAL_TESTS] $TEST_NAME... "
    
    if eval "$TEST_COMMAND" &> /dev/null; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to skip a test
skip_test() {
    local TEST_NAME=$1
    local REASON=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    echo "[$TOTAL_TESTS] $TEST_NAME... ${YELLOW}⊘ SKIPPED${NC} ($REASON)"
}

# Load environment variables if available
if [ -f "infrastructure.env" ]; then
    source infrastructure.env
fi
if [ -f "database.env" ]; then
    source database.env
fi
if [ -f "storage.env" ]; then
    source storage.env
fi

echo -e "${BLUE}=== 1. Network Infrastructure Tests ===${NC}"

# VPC Tests
if [ -n "$DO_VPC_ID" ]; then
    run_test "VPC exists" "doctl vpcs get $DO_VPC_ID --format ID --no-header"
    run_test "VPC is active" "doctl vpcs get $DO_VPC_ID --format ID,Name --no-header | grep -q $DO_VPC_ID"
else
    skip_test "VPC exists" "DO_VPC_ID not set"
    skip_test "VPC is active" "DO_VPC_ID not set"
fi

# Firewall Tests
if [ -n "$DO_FIREWALL_ID" ]; then
    run_test "Database firewall exists" "doctl compute firewall get $DO_FIREWALL_ID --format ID --no-header"
else
    skip_test "Database firewall exists" "DO_FIREWALL_ID not set"
fi

if [ -n "$DO_APP_FIREWALL_ID" ]; then
    run_test "Application firewall exists" "doctl compute firewall get $DO_APP_FIREWALL_ID --format ID --no-header"
else
    skip_test "Application firewall exists" "DO_APP_FIREWALL_ID not set"
fi

# Load Balancer Tests
if [ -n "$DO_LB_ID" ]; then
    run_test "Load balancer exists" "doctl compute load-balancer get $DO_LB_ID --format ID --no-header"
    run_test "Load balancer is active" "doctl compute load-balancer get $DO_LB_ID --format Status --no-header | grep -q active"
else
    skip_test "Load balancer exists" "DO_LB_ID not set"
    skip_test "Load balancer is active" "DO_LB_ID not set"
fi

echo ""
echo -e "${BLUE}=== 2. Database Infrastructure Tests ===${NC}"

# PostgreSQL Tests
if [ -n "$PG_ID" ]; then
    run_test "PostgreSQL cluster exists" "doctl databases get $PG_ID --format ID --no-header"
    run_test "PostgreSQL is online" "doctl databases get $PG_ID --format Status --no-header | grep -q online"
    
    if [ -n "$PG_HOST" ] && [ -n "$PG_PASSWORD" ]; then
        run_test "PostgreSQL connectivity" "PGPASSWORD=$PG_PASSWORD psql -h $PG_HOST -p ${PG_PORT:-25060} -U ${PG_USER:-doadmin} -d ${PG_DATABASE:-defaultdb} -c 'SELECT 1' -t"
    else
        skip_test "PostgreSQL connectivity" "Connection details not available"
    fi
else
    skip_test "PostgreSQL cluster exists" "PG_ID not set"
    skip_test "PostgreSQL is online" "PG_ID not set"
    skip_test "PostgreSQL connectivity" "PG_ID not set"
fi

# Redis Tests
if [ -n "$REDIS_ID" ]; then
    run_test "Redis cluster exists" "doctl databases get $REDIS_ID --format ID --no-header"
    run_test "Redis is online" "doctl databases get $REDIS_ID --format Status --no-header | grep -q online"
    
    if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PASSWORD" ]; then
        run_test "Redis connectivity" "redis-cli -h $REDIS_HOST -p ${REDIS_PORT:-25061} -a $REDIS_PASSWORD --tls ping"
    else
        skip_test "Redis connectivity" "Connection details not available"
    fi
else
    skip_test "Redis cluster exists" "REDIS_ID not set"
    skip_test "Redis is online" "REDIS_ID not set"
    skip_test "Redis connectivity" "REDIS_ID not set"
fi

echo ""
echo -e "${BLUE}=== 3. Storage Infrastructure Tests ===${NC}"

# Wasabi S3 Tests
WASABI_ENDPOINT="${WASABI_ENDPOINT:-https://s3.ap-southeast-2.wasabisys.com}"
WASABI_REGION="${WASABI_REGION:-ap-southeast-2}"

# Staging bucket tests
if [ -n "$WASABI_STAGING_ACCESS_KEY" ] && [ -n "$WASABI_STAGING_SECRET" ]; then
    run_test "Staging bucket exists (mm-staging-au)" \
        "AWS_ACCESS_KEY_ID=$WASABI_STAGING_ACCESS_KEY AWS_SECRET_ACCESS_KEY=$WASABI_STAGING_SECRET aws s3 ls s3://mm-staging-au --endpoint-url $WASABI_ENDPOINT --region $WASABI_REGION"
    
    # Test upload capability
    echo "test" > /tmp/test-staging.txt
    run_test "Staging bucket upload" \
        "AWS_ACCESS_KEY_ID=$WASABI_STAGING_ACCESS_KEY AWS_SECRET_ACCESS_KEY=$WASABI_STAGING_SECRET aws s3 cp /tmp/test-staging.txt s3://mm-staging-au/test/verify-$(date +%s).txt --endpoint-url $WASABI_ENDPOINT --region $WASABI_REGION"
    rm -f /tmp/test-staging.txt
else
    skip_test "Staging bucket exists" "Credentials not configured"
    skip_test "Staging bucket upload" "Credentials not configured"
fi

# Masters bucket tests
if [ -n "$WASABI_MASTERS_ACCESS_KEY" ] && [ -n "$WASABI_MASTERS_SECRET" ]; then
    run_test "Masters bucket exists (mm-masters-au)" \
        "AWS_ACCESS_KEY_ID=$WASABI_MASTERS_ACCESS_KEY AWS_SECRET_ACCESS_KEY=$WASABI_MASTERS_SECRET aws s3 ls s3://mm-masters-au --endpoint-url $WASABI_ENDPOINT --region $WASABI_REGION"
else
    skip_test "Masters bucket exists" "Credentials not configured"
fi

# Previews bucket tests
if [ -n "$WASABI_PREVIEWS_ACCESS_KEY" ] && [ -n "$WASABI_PREVIEWS_SECRET" ]; then
    run_test "Previews bucket exists (mm-previews-au)" \
        "AWS_ACCESS_KEY_ID=$WASABI_PREVIEWS_ACCESS_KEY AWS_SECRET_ACCESS_KEY=$WASABI_PREVIEWS_SECRET aws s3 ls s3://mm-previews-au --endpoint-url $WASABI_ENDPOINT --region $WASABI_REGION"
else
    skip_test "Previews bucket exists" "Credentials not configured"
fi

echo ""
echo -e "${BLUE}=== 4. Service Health Tests ===${NC}"

# Backend health check
if [ -n "$BACKEND_URL" ]; then
    run_test "Backend API health endpoint" "curl -f -s $BACKEND_URL/api/health"
else
    skip_test "Backend API health endpoint" "BACKEND_URL not set"
fi

# Frontend health check
if [ -n "$FRONTEND_URL" ]; then
    run_test "Frontend health endpoint" "curl -f -s $FRONTEND_URL/api/health"
else
    skip_test "Frontend health endpoint" "FRONTEND_URL not set"
fi

# Edge service health check
if [ -n "$EDGE_URL" ]; then
    run_test "Edge service health endpoint" "curl -f -s $EDGE_URL/health"
else
    skip_test "Edge service health endpoint" "EDGE_URL not set"
fi

echo ""
echo -e "${BLUE}=== 5. Security Configuration Tests ===${NC}"

# HMAC signing key test
if [ -n "$EDGE_SIGNING_KEY" ]; then
    run_test "HMAC signing key configured" "[ ${#EDGE_SIGNING_KEY} -ge 32 ]"
else
    skip_test "HMAC signing key configured" "EDGE_SIGNING_KEY not set"
fi

# JWT secret test
if [ -n "$JWT_SECRET" ]; then
    run_test "JWT secret configured" "[ ${#JWT_SECRET} -ge 32 ]"
else
    skip_test "JWT secret configured" "JWT_SECRET not set"
fi

# SSL/TLS configuration test
if [ -n "$DO_LB_IP" ]; then
    run_test "HTTPS endpoint available" "curl -f -s -o /dev/null -w '%{http_code}' https://$DO_LB_IP --insecure | grep -q '200\|301\|302\|404'"
else
    skip_test "HTTPS endpoint available" "DO_LB_IP not set"
fi

echo ""
echo -e "${BLUE}=== 6. Integration Tests ===${NC}"

# Database connection from app
if [ -n "$BACKEND_URL" ] && [ -n "$POSTGRES_URL" ]; then
    run_test "Backend can connect to PostgreSQL" "curl -s $BACKEND_URL/api/health | grep -q '\"db\":true'"
else
    skip_test "Backend can connect to PostgreSQL" "Service URLs not configured"
fi

if [ -n "$BACKEND_URL" ] && [ -n "$REDIS_URL" ]; then
    run_test "Backend can connect to Redis" "curl -s $BACKEND_URL/api/health | grep -q '\"redis\":true'"
else
    skip_test "Backend can connect to Redis" "Service URLs not configured"
fi

# Presigned URL generation test
if [ -n "$BACKEND_URL" ]; then
    run_test "Backend can generate presigned URLs" \
        "curl -X POST -H 'Content-Type: application/json' -d '{\"key\":\"test/file.txt\"}' $BACKEND_URL/api/presign | grep -q url"
else
    skip_test "Backend can generate presigned URLs" "BACKEND_URL not set"
fi

echo ""
echo -e "${GREEN}=== Verification Summary ===${NC}"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Skipped: ${YELLOW}$SKIPPED_TESTS${NC}"
echo ""

# Calculate success rate
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "${GREEN}✓ Infrastructure foundation is ready for deployment${NC}"
        EXIT_CODE=0
    elif [ $SUCCESS_RATE -ge 60 ]; then
        echo -e "${YELLOW}⚠ Infrastructure partially ready - review failed tests${NC}"
        EXIT_CODE=1
    else
        echo -e "${RED}✗ Infrastructure not ready - critical components missing${NC}"
        EXIT_CODE=2
    fi
else
    echo -e "${RED}No tests were run${NC}"
    EXIT_CODE=3
fi

# Generate verification report
cat > infrastructure-verification-report.md << EOF
# Infrastructure Verification Report

## Test Results
- **Date**: $(date)
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Skipped**: $SKIPPED_TESTS
- **Success Rate**: ${SUCCESS_RATE}%

## Component Status

### Network Infrastructure
- VPC: $([ -n "$DO_VPC_ID" ] && echo "Configured ($DO_VPC_ID)" || echo "Not configured")
- Load Balancer: $([ -n "$DO_LB_ID" ] && echo "Configured ($DO_LB_IP)" || echo "Not configured")
- Firewalls: $([ -n "$DO_FIREWALL_ID" ] && echo "Configured" || echo "Not configured")

### Database Infrastructure
- PostgreSQL: $([ -n "$PG_ID" ] && echo "Configured ($PG_ID)" || echo "Not configured")
- Redis: $([ -n "$REDIS_ID" ] && echo "Configured ($REDIS_ID)" || echo "Not configured")

### Storage Infrastructure
- Staging Bucket: mm-staging-au
- Masters Bucket: mm-masters-au
- Previews Bucket: mm-previews-au
- Region: ap-southeast-2 (Sydney, Australia)

### Security Configuration
- HMAC Signing: $([ -n "$EDGE_SIGNING_KEY" ] && echo "Configured" || echo "Not configured")
- JWT Authentication: $([ -n "$JWT_SECRET" ] && echo "Configured" || echo "Not configured")
- SSL/TLS: $([ -n "$DO_LB_IP" ] && echo "Available" || echo "Not configured")

## Recommendations

$(if [ $FAILED_TESTS -gt 0 ]; then
    echo "### Failed Tests Require Attention"
    echo "- Review and fix failed tests before proceeding with deployment"
    echo "- Ensure all environment variables are properly configured"
    echo "- Verify network connectivity between services"
fi)

$(if [ $SKIPPED_TESTS -gt 0 ]; then
    echo "### Skipped Tests"
    echo "- Configure missing environment variables to enable skipped tests"
    echo "- Source all .env files: infrastructure.env, database.env, storage.env"
fi)

## Next Steps
1. Fix any failed tests
2. Configure missing environment variables
3. Run verification again: ./verify-infrastructure.sh
4. Proceed with application deployment once all critical tests pass

Generated: $(date)
EOF

echo ""
echo "Verification report saved to: infrastructure-verification-report.md"
echo ""

exit $EXIT_CODE