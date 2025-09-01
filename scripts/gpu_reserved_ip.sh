#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage: $0 <command> [args]
Commands:
  reserve <region>           Reserve a new IPv4 in region (e.g., tor1)
  assign <ip> <droplet-id>   Assign reserved IP to droplet
  unassign <ip>              Unassign reserved IP
  list                       List reserved IPs

Requires: doctl authenticated (doctl auth init)
USAGE
}

cmd=${1:-}
case "$cmd" in
  reserve)
    region=${2:-}
    [ -z "$region" ] && { echo "region required"; exit 1; }
    doctl compute reserved-ip create --region "$region"
    ;;
  assign)
    ip=${2:-}
    droplet=${3:-}
    [ -z "$ip" ] || [ -z "$droplet" ] && { echo "ip and droplet-id required"; exit 1; }
    doctl compute reserved-ip-action assign "$ip" "$droplet"
    ;;
  unassign)
    ip=${2:-}
    [ -z "$ip" ] && { echo "ip required"; exit 1; }
    doctl compute reserved-ip-action unassign "$ip"
    ;;
  list)
    doctl compute reserved-ip list
    ;;
  *) usage; exit 1;;
esac

