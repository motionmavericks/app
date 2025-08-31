#!/usr/bin/env bash
set -euo pipefail

SPEC="deploy/do-app.yaml"

if ! command -v doctl >/dev/null 2>&1; then
  echo "Installing doctl..." >&2
  bash scripts/install_doctl.sh
fi

echo "Checking doctl auth..." >&2
if ! doctl account get --no-header --format UUID,Email,Status >/dev/null 2>&1; then
  echo "doctl is not authenticated. Run: doctl auth init" >&2
  exit 1
fi

APP_ID=""
echo "Finding existing App matching spec name (motionmavericks)..." >&2
APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1 || true)

if [ -z "$APP_ID" ]; then
  echo "Creating new App from $SPEC" >&2
  doctl apps create --spec "$SPEC" --format ID,DefaultIngress,Created --no-header || true
else
  echo "Updating App $APP_ID from $SPEC" >&2
  doctl apps update "$APP_ID" --spec "$SPEC" --format ID,DefaultIngress,UpdatedAt --no-header || true
fi

echo "Apps summary (top 5):" >&2
doctl apps list --no-header --format ID,Spec.Name,DefaultIngress,Created | head -n 5 || true

echo
echo "Next steps:" >&2
echo "1) In the DO Apps UI, set secrets for Wasabi (all three roles) and EDGE_SIGNING_KEY." >&2
echo "2) After deploy turns healthy, run DB migration: npm --prefix backend run migrate (with POSTGRES_URL from Managed DB)." >&2
echo "3) Configure DNS: CNAME api.motionmavericks.com.au to the backend component target; ALIAS/CNAME apex to frontend target." >&2

