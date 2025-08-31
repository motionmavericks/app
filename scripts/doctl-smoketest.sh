#!/usr/bin/env bash
set -euo pipefail

if ! command -v doctl >/dev/null 2>&1; then
  echo "ERROR: doctl is not installed. See https://docs.digitalocean.com/reference/doctl/how-to/install/" >&2
  exit 127
fi

if [[ -z "${DIGITALOCEAN_ACCESS_TOKEN:-}" ]]; then
  echo "ERROR: DIGITALOCEAN_ACCESS_TOKEN is not set in the environment." >&2
  echo "Export it temporarily before running this script." >&2
  exit 2
fi

echo "# doctl version"
doctl version || true

echo
echo "# Account"
doctl account get --no-header --format UUID,Email,Status || true

echo
echo "# App Platform (first 5)"
doctl apps list --no-header --format ID,Spec.Name,DefaultIngress,Created | head -n 5 || true

echo
echo "# Databases (first 5)"
doctl databases list --no-header --format ID,Name,Engine,Version,Region,Status | head -n 5 || true

echo
echo "# Droplets (first 5)"
doctl compute droplet list --no-header --format ID,Name,Region,Status,Size --no-trunc | head -n 5 || true

echo
echo "# VPCs (first 5)"
doctl vpcs list --no-header --format ID,Name,Region,IPRange,Default | head -n 5 || true

echo
echo "# Success"
exit 0

