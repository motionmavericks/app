#!/usr/bin/env bash
set -euo pipefail

# Tail or fetch recent logs for a DigitalOcean App Platform component.
# Usage:
#   scripts/do_app_logs.sh [component] [type] [--follow]
#     component: frontend|backend|preview-worker (default: backend)
#     type: deploy|run|build (default: deploy)

COMPONENT="${1:-backend}"
TYPE="${2:-deploy}"
FOLLOW="${3:-}"

if ! command -v doctl >/dev/null 2>&1; then
  echo "Installing doctl…" >&2
  bash scripts/install_doctl.sh
  export PATH="$(pwd)/bin:$PATH"
fi

echo "Checking doctl auth…" >&2
if ! doctl account get --no-header --format UUID,Email,Status >/dev/null 2>&1; then
  echo "doctl is not authenticated. Run: doctl auth init" >&2
  exit 1
fi

APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}' | head -n1 || true)
if [ -z "$APP_ID" ]; then
  echo "App 'motionmavericks' not found" >&2
  exit 1
fi

echo "Fetching ${TYPE} logs for component=${COMPONENT} (app=${APP_ID})…" >&2
if [ "${FOLLOW}" = "--follow" ]; then
  doctl apps logs "$APP_ID" --type "$TYPE" --component "$COMPONENT" --follow
else
  # last 300 lines
  doctl apps logs "$APP_ID" --type "$TYPE" --component "$COMPONENT" --tail 300
fi

