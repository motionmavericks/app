#!/usr/bin/env bash
set -euo pipefail

# Safely inject Wasabi secrets into the DO App spec and update the App.
# Reads secrets from environment variables to avoid hardcoding in repo.
# Usage:
#   set -a; source scripts/.env.wasabi; set +a   # loads AWS_ACCESS_KEY_ID/SECRET and bucket vars
#   DO_ACCESS_TOKEN=... bash scripts/do_app_set_secrets.sh

if ! command -v doctl >/dev/null 2>&1; then
  echo "doctl is required. Install and run 'doctl auth init'." >&2
  exit 1
fi

require() { for v in "$@"; do [ -n "${!v:-}" ] || { echo "Missing env: $v" >&2; exit 1; }; done; }

# Expect these from scripts/.env.wasabi or your env
require AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY

STAGING_BUCKET=${STAGING_BUCKET:-mm-staging-au}
MASTERS_BUCKET=${MASTERS_BUCKET:-mm-masters-au}
PREVIEWS_BUCKET=${PREVIEWS_BUCKET:-mm-previews-au}

APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1 || true)
if [ -z "$APP_ID" ]; then
  echo "App 'motionmavericks' not found. Create it first or run the deploy workflow." >&2
  exit 1
fi

TMP=$(mktemp)
cp deploy/do-app.yaml "$TMP"

# Optionally inject DB/Redis if provided
if [ -n "${POSTGRES_URL:-}" ]; then
  sed -i "s/\(key: POSTGRES_URL\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${POSTGRES_URL//\//\/}\"/" "$TMP" || true
fi
if [ -n "${REDIS_URL:-}" ]; then
  sed -i "s/\(key: REDIS_URL\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${REDIS_URL//\//\/}\"/" "$TMP" || true
fi

# Inject the same Wasabi key pair for all roles (staging/masters/previews)
# Avoid echoing secrets. Use sed in-place on the temp file.
sed -i "s/\(key: WASABI_STAGING_ACCESS_KEY\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_ACCESS_KEY_ID//\//\/}\"/" "$TMP"
sed -i "s/\(key: WASABI_STAGING_SECRET\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_SECRET_ACCESS_KEY//\//\/}\"/" "$TMP"

sed -i "s/\(key: WASABI_MASTERS_ACCESS_KEY\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_ACCESS_KEY_ID//\//\/}\"/" "$TMP"
sed -i "s/\(key: WASABI_MASTERS_SECRET\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_SECRET_ACCESS_KEY//\//\/}\"/" "$TMP"

sed -i "s/\(key: WASABI_PREVIEWS_ACCESS_KEY\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_ACCESS_KEY_ID//\//\/}\"/" "$TMP"
sed -i "s/\(key: WASABI_PREVIEWS_SECRET\n\s*type: SECRET\n\s*value: \)\"\"/\1\"${AWS_SECRET_ACCESS_KEY//\//\/}\"/" "$TMP"

# Buckets (non-secret)
sed -i "s/\(key: STAGING_BUCKET\n\s*value: \).*/\1${STAGING_BUCKET}/" "$TMP"
sed -i "s/\(key: MASTERS_BUCKET\n\s*value: \).*/\1${MASTERS_BUCKET}/" "$TMP"
sed -i "s/\(key: PREVIEWS_BUCKET\n\s*value: \).*/\1${PREVIEWS_BUCKET}/" "$TMP"

echo "Updating App $APP_ID with injected Wasabi secrets (no secrets printed)…" >&2
doctl apps update "$APP_ID" --spec "$TMP" --wait

rm -f "$TMP"
echo "Done. Set DB/Redis secrets and EDGE_SIGNING_KEY in DO UI next." >&2
