#!/usr/bin/env bash
set -euo pipefail

# Simple Redis-stream-based scaler for GPU workers (preview use).
# Scales up when stream length > SCALE_UP_THRESHOLD; scales down when idle for IDLE_MINUTES.
# Requirements: doctl auth, redis-cli available, reserved IP optional.

STREAM=${PREVIEW_STREAM:-previews:build}
REDIS_URL=${REDIS_URL:-}
REGION=${REGION:-tor1}
SIZE=${SIZE:-gpu-l40sx1-48gb}
NAME_PREFIX=${NAME_PREFIX:-mm-gpu-worker}
IMAGE_ID=${IMAGE_ID:-191457505}
RESERVED_IP=${RESERVED_IP:-}
SCALE_UP_THRESHOLD=${SCALE_UP_THRESHOLD:-5}
IDLE_MINUTES=${IDLE_MINUTES:-10}

if [[ -z "$REDIS_URL" ]]; then
  echo "REDIS_URL required" >&2; exit 1
fi

get_stream_len() {
  redis-cli -u "$REDIS_URL" XINFO STREAM "$STREAM" 2>/dev/null | awk '/length/{print $2}' || echo 0
}

active_gpu_droplet() {
  doctl compute droplet list --tag-name gpu --tag-name preview --tag-name worker --no-header --format ID,Name,Status | awk '$3=="active"{print $1}' | head -n1
}

provision() {
  local n="${NAME_PREFIX}-$(date +%s)"
  REGION="$REGION" SIZE="$SIZE" NAME="$n" IMAGE_ID="$IMAGE_ID" RESERVED_IP="$RESERVED_IP" bash scripts/provision_gpu_worker.sh
}

destroy() {
  local id="$1"; [ -z "$id" ] && return 0
  echo "Destroying droplet $id" >&2
  doctl compute droplet delete -f "$id" || true
}

main() {
  local len; len=$(get_stream_len)
  local active; active=$(active_gpu_droplet)
  if [[ "$len" -ge "$SCALE_UP_THRESHOLD" && -z "$active" ]]; then
    echo "Scale up criteria met: len=$len, no active GPU worker. Provisioning..." >&2
    provision
    exit 0
  fi
  if [[ -n "$active" ]]; then
    # If idle beyond threshold, scale down
    local last_ms
    last_ms=$(redis-cli -u "$REDIS_URL" XINFO STREAM "$STREAM" 2>/dev/null | awk '/last-generated-id/{print $2}' | cut -d- -f1)
    if [[ -n "$last_ms" ]]; then
      local now_ms=$(( $(date +%s) * 1000 ))
      local diff_ms=$(( now_ms - last_ms ))
      local idle_ms=$(( IDLE_MINUTES * 60 * 1000 ))
      if (( diff_ms > idle_ms )); then
        echo "Idle beyond threshold ($IDLE_MINUTES m). Scaling down droplet $active" >&2
        destroy "$active"
      fi
    fi
  fi
}

main "$@"

