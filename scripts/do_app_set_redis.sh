#!/usr/bin/env bash
set -euo pipefail

# Safely set REDIS_URL (secret) on backend and preview-worker using the current live spec as baseline.
# Usage:
#   export REDIS_URL="rediss://user:pass@host:port"
#   bash scripts/do_app_set_redis.sh

if [[ -z "${REDIS_URL:-}" ]]; then
  echo "Missing REDIS_URL in environment" >&2
  exit 1
fi

if ! command -v doctl >/dev/null 2>&1; then
  echo "Installing doctl…" >&2
  bash scripts/install_doctl.sh
  export PATH="$(pwd)/bin:$PATH"
fi
if ! command -v yq >/dev/null 2>&1; then
  echo "Installing yq…" >&2
  mkdir -p ./bin
  curl -fsSL https://github.com/mikefarah/yq/releases/download/v4.44.3/yq_linux_amd64 -o ./bin/yq
  chmod +x ./bin/yq
  export PATH="$(pwd)/bin:$PATH"
fi

echo "Checking doctl auth…" >&2
doctl account get --no-header --format UUID,Email,Status >/dev/null

APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1)
if [[ -z "$APP_ID" ]]; then
  echo "App 'motionmavericks' not found" >&2
  exit 1
fi

TMPDIR=$(mktemp -d)
JSON="$TMPDIR/app.json"
SPECJSON="$TMPDIR/spec.json"
SPECYAML="$TMPDIR/spec.yaml"

doctl apps get "$APP_ID" -o json > "$JSON"
jq '.[0].spec' "$JSON" > "$SPECJSON"
if command -v yq >/dev/null 2>&1; then
  export PATH="$(pwd)/bin:$PATH"
  yq -P "$SPECJSON" > "$SPECYAML"
else
  python3 - << 'PY' > "$SPECYAML"
import json,sys,yaml
yaml.safe_dump(json.load(sys.stdin), sys.stdout, sort_keys=False)
PY
fi

# Set REDIS_URL secret for backend
REDIS_SAFE="$REDIS_URL"
yq -i '
  (.services[] | select(.name=="backend").envs) |= (
    (. // []) |
    (map(select(.key=="REDIS_URL")) | length) as $has |
    (if $has>0 then
      map(if .key=="REDIS_URL" then .type="SECRET" | .scope="RUN_AND_BUILD_TIME" | .value=strenv(REDIS_SAFE) else . end)
    else
      . + [{"key":"REDIS_URL","type":"SECRET","scope":"RUN_AND_BUILD_TIME","value": strenv(REDIS_SAFE)}]
    end)
  )
' "$SPECYAML"

# Set REDIS_URL secret for preview-worker
yq -i '
  (.workers[] | select(.name=="preview-worker").envs) |= (
    (. // []) |
    (map(select(.key=="REDIS_URL")) | length) as $has |
    (if $has>0 then
      map(if .key=="REDIS_URL" then .type="SECRET" | .scope="RUN_AND_BUILD_TIME" | .value=strenv(REDIS_SAFE) else . end)
    else
      . + [{"key":"REDIS_URL","type":"SECRET","scope":"RUN_AND_BUILD_TIME","value": strenv(REDIS_SAFE)}]
    end)
  )
' "$SPECYAML"

echo "Updating app spec with REDIS_URL (secrets not echoed)…" >&2
doctl apps update "$APP_ID" --spec "$SPECYAML" --wait

rm -rf "$TMPDIR"
echo "Done."
