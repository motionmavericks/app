#!/usr/bin/env bash
set -euo pipefail

# Simple autoscaler for GPU worker Droplets based on Redis stream length.
# Requires: doctl authenticated; redis-cli available; env: REDIS_URL, DO_REGION, DO_VPC, IMAGE_SLUG

REDIS_URL=${REDIS_URL:-redis://localhost:6379}
STREAM=${PREVIEW_STREAM:-previews:build}
SCALE_UP_AT=${SCALE_UP_AT:-10}
SCALE_DOWN_AT=${SCALE_DOWN_AT:-0}
MIN_NODES=${MIN_NODES:-0}
MAX_NODES=${MAX_NODES:-3}
SIZE=${SIZE:-g-2vcpu-24gb}
REGION=${DO_REGION:-nyc3}
VPC=${DO_VPC:-}
IMAGE=${IMAGE_SLUG:-ubuntu-22-04-x64}

LEN=$(redis-cli -u "$REDIS_URL" XLEN "$STREAM")
CURRENT=$(doctl compute droplet list --format Name | grep -c '^gpu-worker') || CURRENT=0
DESIRED=$CURRENT
if [ "$LEN" -gt "$SCALE_UP_AT" ] && [ "$CURRENT" -lt "$MAX_NODES" ]; then
  DESIRED=$((CURRENT+1))
elif [ "$LEN" -le "$SCALE_DOWN_AT" ] && [ "$CURRENT" -gt "$MIN_NODES" ]; then
  DESIRED=$((CURRENT-1))
fi

echo "queue_len=$LEN current=$CURRENT desired=$DESIRED"
if [ "$DESIRED" -gt "$CURRENT" ]; then
  doctl compute droplet create gpu-worker-$(date +%s) --region "$REGION" --image "$IMAGE" --size "$SIZE" ${VPC:+--vpc-uuid $VPC}
elif [ "$DESIRED" -lt "$CURRENT" ]; then
  ID=$(doctl compute droplet list --format ID,Name | awk '/gpu-worker/{print $1}' | head -n1)
  [ -n "$ID" ] && doctl compute droplet delete -f "$ID"
fi

