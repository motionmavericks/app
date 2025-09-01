#!/usr/bin/env bash
set -euo pipefail

# Idempotently create/configure Wasabi S3 buckets for Staging, Masters, Previews.
# SAFETY: Requires AWS credentials via env; does NOT modify existing buckets beyond safe config (versioning, encryption, public-block, lifecycle).

ENDPOINT=${WASABI_ENDPOINT:-"https://s3.ap-southeast-2.wasabisys.com"}
REGION=${WASABI_REGION:-"ap-southeast-2"}
STAGING_BUCKET=${STAGING_BUCKET:-"mm-staging-au"}
MASTERS_BUCKET=${MASTERS_BUCKET:-"mm-masters-au"}
PREVIEWS_BUCKET=${PREVIEWS_BUCKET:-"mm-previews-au"}

require() { for v in "$@"; do [ -n "${!v:-}" ] || { echo "Missing env: $v" >&2; exit 1; }; done; }
require AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY

aws_ws() { aws --endpoint-url "$ENDPOINT" "$@"; }

bucket_exists() { aws_ws s3api head-bucket --bucket "$1" >/dev/null 2>&1; }

create_bucket() {
  local b=$1; shift
  local extra=("$@")
  echo "Creating bucket $b (region=$REGION)" >&2
  aws_ws s3api create-bucket --bucket "$b" --create-bucket-configuration LocationConstraint="$REGION" "${extra[@]}" || true
}

enable_versioning() {
  local b=$1
  echo "Enabling versioning on $b" >&2
  aws_ws s3api put-bucket-versioning --bucket "$b" --versioning-configuration Status=Enabled
}

block_public() {
  local b=$1
  echo "Blocking public access on $b" >&2
  aws_ws s3api put-public-access-block --bucket "$b" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true || true
}

enable_encryption() {
  local b=$1
  echo "Enabling SSE-S3 on $b" >&2
  aws_ws s3api put-bucket-encryption --bucket "$b" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' || true
}

set_lifecycle_staging() {
  local b=$1
  echo "Applying lifecycle (staging) on $b" >&2
  aws_ws s3api put-bucket-lifecycle-configuration --bucket "$b" --lifecycle-configuration '{
    "Rules":[
      {"ID":"expire-staging-7d","Status":"Enabled","Filter":{"Prefix":""},"Expiration":{"Days":7}},
      {"ID":"abort-mpu-3d","Status":"Enabled","Filter":{"Prefix":""},"AbortIncompleteMultipartUpload":{"DaysAfterInitiation":3}}
    ]
  }' || true
}

set_lifecycle_previews() {
  local b=$1
  echo "Applying lifecycle (previews) on $b" >&2
  aws_ws s3api put-bucket-lifecycle-configuration --bucket "$b" --lifecycle-configuration '{
    "Rules":[
      {"ID":"expire-previews-365d","Status":"Enabled","Filter":{"Prefix":""},"Expiration":{"Days":365}},
      {"ID":"abort-mpu-3d","Status":"Enabled","Filter":{"Prefix":""},"AbortIncompleteMultipartUpload":{"DaysAfterInitiation":3}}
    ]
  }' || true
}

set_object_lock_default() {
  local b=$1
  echo "Setting Object Lock default on $b (governance 365d)" >&2
  aws_ws s3api put-object-lock-configuration --bucket "$b" \
    --object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"GOVERNANCE","Days":365}}}' || true
}

echo "Endpoint: $ENDPOINT Region: $REGION" >&2

# Staging bucket (mutable, lifecycle cleanup)
if ! bucket_exists "$STAGING_BUCKET"; then
  create_bucket "$STAGING_BUCKET"
fi
enable_versioning "$STAGING_BUCKET"
block_public "$STAGING_BUCKET"
enable_encryption "$STAGING_BUCKET"
set_lifecycle_staging "$STAGING_BUCKET"

# Masters bucket (immutable, Object Lock)
if ! bucket_exists "$MASTERS_BUCKET"; then
  create_bucket "$MASTERS_BUCKET" --object-lock-enabled-for-bucket
  # Object Lock must be enabled at creation; default rule applied below
fi
enable_versioning "$MASTERS_BUCKET"
block_public "$MASTERS_BUCKET"
enable_encryption "$MASTERS_BUCKET"
set_object_lock_default "$MASTERS_BUCKET"

# Previews bucket (mutable, lifecycle long)
if ! bucket_exists "$PREVIEWS_BUCKET"; then
  create_bucket "$PREVIEWS_BUCKET"
fi
enable_versioning "$PREVIEWS_BUCKET"
block_public "$PREVIEWS_BUCKET"
enable_encryption "$PREVIEWS_BUCKET"
set_lifecycle_previews "$PREVIEWS_BUCKET"

echo "Done." >&2
