#!/bin/bash

# validate_no_mocks.sh - Validates zero mock usage in production and test files
# Enforces anti-mock policy for Redis operations

set -e

echo "🔍 Validating no-mocks policy compliance..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track violations
violations=0

# Function to check for Redis mocks
check_redis_mocks() {
    local file_pattern="$1"
    local description="$2"
    
    echo "Checking $description..."
    
    # Search for Redis-specific mock patterns (excluding comments)
    local redis_mock_patterns=(
        "vi\.mock\(['\"]ioredis['\"]"
        "mockRedis\s*="
        "Redis.*mock\s*="
        "redis.*Mock\s*="
        "vi\.fn\(\).*redis"
        "const.*mock.*redis"
        "let.*mock.*redis"
        "var.*mock.*redis"
        "mock.*\.xread"
        "mock.*\.xack"
        "mock.*\.xgroup"
        "mock.*\.ping.*PONG"
    )
    
    for pattern in "${redis_mock_patterns[@]}"; do
        local matches=$(grep -r -n -i "$pattern" $file_pattern 2>/dev/null | grep -v "^[[:space:]]*//\|^[[:space:]]*\*\|^[[:space:]]*#" || true)
        if [[ -n "$matches" ]]; then
            echo -e "${RED}❌ VIOLATION: Redis mock found${NC}"
            echo "$matches"
            ((violations++))
        fi
    done
}

# Function to check for specific mock imports
check_mock_imports() {
    local file_pattern="$1"
    local description="$2"
    
    echo "Checking $description for mock imports..."
    
    local mock_import_patterns=(
        "import.*vi\.mock"
        "from.*vitest.*mock"
        "jest\.mock"
        "sinon\.mock"
    )
    
    for pattern in "${mock_import_patterns[@]}"; do
        local matches=$(grep -r -n "$pattern" $file_pattern 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            # Allow S3 and other service mocks, but flag Redis
            local redis_specific=$(echo "$matches" | grep -i redis || true)
            if [[ -n "$redis_specific" ]]; then
                echo -e "${RED}❌ VIOLATION: Redis-specific mock import found${NC}"
                echo "$redis_specific"
                ((violations++))
            fi
        fi
    done
}

# Function to verify real Redis usage
verify_real_redis() {
    local file_pattern="$1"
    local description="$2"
    
    echo "Verifying real Redis usage in $description..."
    
    # Look for real Redis test client usage
    local real_redis_patterns=(
        "RedisTestClient"
        "WorkerRedisTestClient" 
        "redis-real\.ts"
        "REDIS_TEST_URL"
        "redis://localhost:6380"
    )
    
    local found_real_redis=false
    for pattern in "${real_redis_patterns[@]}"; do
        local matches=$(grep -r -l "$pattern" $file_pattern 2>/dev/null || true)
        if [[ -n "$matches" ]]; then
            found_real_redis=true
            echo -e "${GREEN}✅ Found real Redis usage: $pattern${NC}"
            break
        fi
    done
    
    if [[ "$found_real_redis" == "false" ]]; then
        echo -e "${YELLOW}⚠️  No real Redis usage detected in $description${NC}"
    fi
}

echo "🔍 Scanning Backend service..."
check_redis_mocks "backend/src backend/tests" "Backend source and tests"
check_mock_imports "backend/tests" "Backend tests"
verify_real_redis "backend/src backend/tests" "Backend service"

echo ""
echo "🔍 Scanning Worker service..."
check_redis_mocks "worker/src worker/tests" "Worker source and tests"
check_mock_imports "worker/tests" "Worker tests"
verify_real_redis "worker/src worker/tests" "Worker service"

echo ""
echo "🔍 Scanning for test setup files..."
check_redis_mocks "*/tests/setup.ts" "Test setup files"

echo ""
echo "🔍 Checking for real Redis test infrastructure..."

# Verify real Redis test files exist
required_files=(
    "backend/src/test/redis-real.ts"
    "worker/src/test/redis-real.ts"
)

for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ Real Redis test infrastructure found: $file${NC}"
    else
        echo -e "${RED}❌ MISSING: Real Redis test infrastructure: $file${NC}"
        ((violations++))
    fi
done

echo ""
echo "🔍 Final validation..."

if [[ $violations -eq 0 ]]; then
    echo -e "${GREEN}✅ SUCCESS: No Redis mock violations found!${NC}"
    echo -e "${GREEN}✅ Anti-mock policy compliance verified${NC}"
    exit 0
else
    echo -e "${RED}❌ FAILED: $violations Redis mock violations found${NC}"
    echo -e "${RED}❌ Anti-mock policy violations detected${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Remove all Redis mocks from test files"
    echo "2. Replace with real Redis test clients"
    echo "3. Use redis://localhost:6380 for test Redis instance"
    echo "4. Ensure database isolation using Redis DB numbers"
    exit 1
fi