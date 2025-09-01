#!/usr/bin/env bash
set -euo pipefail

echo "=== MotionMavericks Complete Deployment Script ==="
echo "This script completes the DigitalOcean deployment process"

# Check prerequisites
if ! command -v doctl >/dev/null 2>&1; then
    echo "Error: doctl not found. Please install DigitalOcean CLI first."
    exit 1
fi

# Verify authentication
echo "Checking DigitalOcean authentication..."
if ! doctl account get >/dev/null 2>&1; then
    echo "Error: Not authenticated with DigitalOcean."
    echo "Please run: doctl auth init"
    exit 1
fi

echo "✓ DigitalOcean CLI authenticated"

# Check if Docker images are built
echo "Checking if Docker images are available in DOCR..."
REPO_BASE="mm-motionmav-reg"

# Get latest commit SHA
COMMIT_SHA=$(git rev-parse HEAD)
SHORT_SHA=$(git rev-parse --short=7 HEAD)
TAG="sha-${COMMIT_SHA}"

echo "Looking for images with tag: $TAG"

# Check for required images
check_image() {
    local service="$1"
    local repo="${REPO_BASE}/${service}"
    echo -n "Checking $repo:$TAG... "
    if doctl registry repository list-tags "$repo" --format Tag | grep -q "^${TAG}$"; then
        echo "✓ Found"
        return 0
    else
        echo "✗ Not found"
        return 1
    fi
}

images_ready=true
check_image "backend" || images_ready=false
check_image "frontend" || images_ready=false
check_image "worker" || images_ready=false

if [ "$images_ready" = false ]; then
    echo ""
    echo "⚠️  Some Docker images are not ready yet."
    echo "Please wait for the GitHub Actions build to complete, then run this script again."
    echo "Check build status: https://github.com/motionmavericks/app/actions"
    exit 1
fi

echo ""
echo "✓ All Docker images are ready"

# Create or update the app
echo ""
echo "Deploying application to DigitalOcean App Platform..."

APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1 || true)

if [ -z "$APP_ID" ]; then
    echo "Creating new app from deploy/do-app.yaml..."
    doctl apps create --spec deploy/do-app.yaml --wait
    APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1)
    echo "✓ App created with ID: $APP_ID"
else
    echo "Updating existing app (ID: $APP_ID)..."
    
    # Get current spec and update image tags
    TMPDIR=$(mktemp -d)
    SPEC_YAML="$TMPDIR/spec.yaml"
    
    doctl apps get "$APP_ID" -o json | jq '.[0].spec' | yq -P > "$SPEC_YAML"
    
    # Update image tags
    yq -i '.services[] |= (select(.name=="backend") | .image.tag = strenv(TAG))' "$SPEC_YAML"
    yq -i '.services[] |= (select(.name=="frontend") | .image.tag = strenv(TAG))' "$SPEC_YAML"
    yq -i '.workers[] |= (select(.name=="preview-worker") | .image.tag = strenv(TAG))' "$SPEC_YAML"
    
    doctl apps update "$APP_ID" --spec "$SPEC_YAML" --wait
    rm -rf "$TMPDIR"
    echo "✓ App updated"
fi

# Get app URL
APP_URL=$(doctl apps get "$APP_ID" --format DefaultIngress --no-header)
echo ""
echo "🎉 Deployment complete!"
echo "App URL: https://$APP_URL"
echo "App ID: $APP_ID"

echo ""
echo "Next steps:"
echo "1. Set up secrets using the provided scripts:"
echo "   - Redis: REDIS_URL=<redis-url> bash scripts/do_app_set_redis.sh"
echo "   - Wasabi: Export AWS credentials and run scripts/do_app_set_secrets.sh"
echo "   - Edge signing key: Set EDGE_SIGNING_KEY in DO console"
echo ""
echo "2. Test the deployment:"
echo "   - Health check: curl https://$APP_URL/api/health"
echo "   - Frontend: curl https://$APP_URL/"
echo ""
echo "3. Monitor logs:"
echo "   - doctl apps logs $APP_ID backend --type run --tail 50"
echo "   - doctl apps logs $APP_ID preview-worker --type run --tail 50"
echo ""
echo "For detailed instructions, see docs/DEPLOYMENT_GUIDE.md"
