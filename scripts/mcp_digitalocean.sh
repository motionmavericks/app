#!/usr/bin/env bash
set -euo pipefail

# Wrapper to launch the DigitalOcean MCP server with a token from env or doctl config.

TOKEN="${DIGITALOCEAN_ACCESS_TOKEN:-${DO_ACCESS_TOKEN:-}}"

if [[ -z "${TOKEN}" ]]; then
  # Try to read from doctl config if present
  CFG="$HOME/.config/doctl/config.yaml"
  if [[ -f "$CFG" ]]; then
    # naive parse: grab the first access-token value
    TOKEN=$(sed -n 's/^\s*access-token:\s*"\?\([^"\n]*\)\"\?\s*$/\1/p' "$CFG" | head -n1 || true)
  fi
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo "DigitalOcean API token not found. Set DIGITALOCEAN_ACCESS_TOKEN or run 'doctl auth init'." >&2
  exit 1
fi

exec npx -y @digitalocean/mcp -digitalocean-api-token "$TOKEN" "$@"

