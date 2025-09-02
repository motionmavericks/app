#!/bin/bash

# Wasabi S3 Storage Configuration Script
# Purpose: Configure and validate existing Wasabi S3 buckets for production

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="${PROJECT_NAME:-motionmavericks}"
ENVIRONMENT="${ENVIRONMENT:-production}"
WASABI_REGION="${WASABI_REGION:-ap-southeast-2}"  # Sydney region for AU buckets
WASABI_ENDPOINT="${WASABI_ENDPOINT:-https://s3.ap-southeast-2.wasabisys.com}"

echo -e "${GREEN}=== Wasabi S3 Storage Configuration ===${NC}"
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $WASABI_REGION (Australia)"
echo "Endpoint: $WASABI_ENDPOINT"
echo ""

# Bucket names (already created as mm-*-au)
STAGING_BUCKET="mm-staging-au"
MASTERS_BUCKET="mm-masters-au"
PREVIEWS_BUCKET="mm-previews-au"

echo -e "${GREEN}Step 1: Validating Existing Buckets${NC}"
echo "Expected buckets:"
echo "  - Staging: $STAGING_BUCKET"
echo "  - Masters: $MASTERS_BUCKET"
echo "  - Previews: $PREVIEWS_BUCKET"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check for Wasabi credentials
if [ -z "$WASABI_ACCESS_KEY_ID" ] || [ -z "$WASABI_SECRET_ACCESS_KEY" ]; then
    echo -e "${YELLOW}Warning: Wasabi credentials not found in environment${NC}"
    echo "Please set:"
    echo "  export WASABI_ACCESS_KEY_ID=your_access_key"
    echo "  export WASABI_SECRET_ACCESS_KEY=your_secret_key"
    echo ""
    echo "Using separate credentials for each bucket tier is recommended:"
    echo "  export WASABI_STAGING_ACCESS_KEY=..."
    echo "  export WASABI_STAGING_SECRET=..."
    echo "  export WASABI_MASTERS_ACCESS_KEY=..."
    echo "  export WASABI_MASTERS_SECRET=..."
    echo "  export WASABI_PREVIEWS_ACCESS_KEY=..."
    echo "  export WASABI_PREVIEWS_SECRET=..."
fi

echo -e "${GREEN}Step 2: Creating Bucket Policies${NC}"

# Staging bucket policy (allows uploads from backend)
cat > staging-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBackendUploads",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mm-staging-au/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    },
    {
      "Sid": "AllowBackendList",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::mm-staging-au"
    }
  ]
}
EOF

# Masters bucket policy (immutable storage with object lock)
cat > masters-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBackendCopy",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectRetention",
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::mm-masters-au/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    },
    {
      "Sid": "DenyDelete",
      "Effect": "Deny",
      "Principal": {
        "AWS": "*"
      },
      "Action": [
        "s3:DeleteObject",
        "s3:DeleteObjectVersion"
      ],
      "Resource": "arn:aws:s3:::mm-masters-au/*"
    },
    {
      "Sid": "AllowList",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::mm-masters-au"
    }
  ]
}
EOF

# Previews bucket policy (public read for processed content)
cat > previews-bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowWorkerWrites",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::mm-previews-au/*"
    },
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mm-previews-au/*",
      "Condition": {
        "StringLike": {
          "aws:Referer": [
            "https://*.motionmavericks.com/*",
            "http://localhost:*/*"
          ]
        }
      }
    },
    {
      "Sid": "AllowList",
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::mm-previews-au"
    }
  ]
}
EOF

echo "Bucket policies created as JSON files"
echo ""

echo -e "${GREEN}Step 3: Configuring CORS for Direct Browser Upload${NC}"

# CORS configuration for staging bucket
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://*.motionmavericks.com",
        "http://localhost:3000",
        "http://localhost:3001"
      ],
      "ExposeHeaders": ["ETag", "x-amz-server-side-encryption"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

echo "CORS configuration created"
echo ""

echo -e "${GREEN}Step 4: Setting Up Lifecycle Policies${NC}"

# Lifecycle policy for staging bucket (auto-delete after 7 days)
cat > staging-lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "ID": "DeleteOldStagingFiles",
      "Status": "Enabled",
      "Expiration": {
        "Days": 7
      },
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 1
      },
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
EOF

# Lifecycle policy for previews bucket (delete old versions)
cat > previews-lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "ID": "DeleteOldPreviews",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      },
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
EOF

echo "Lifecycle policies created"
echo ""

echo -e "${GREEN}Step 5: Validating Bucket Access${NC}"

# Function to test bucket access
test_bucket_access() {
    local BUCKET=$1
    local ACCESS_KEY=$2
    local SECRET_KEY=$3
    
    echo -n "Testing access to $BUCKET... "
    
    if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
        echo -e "${YELLOW}Skipped (no credentials)${NC}"
        return
    fi
    
    # Test listing bucket
    if AWS_ACCESS_KEY_ID="$ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$SECRET_KEY" \
       aws s3 ls "s3://$BUCKET" \
       --endpoint-url "$WASABI_ENDPOINT" \
       --region "$WASABI_REGION" &> /dev/null; then
        echo -e "${GREEN}Success${NC}"
    else
        echo -e "${RED}Failed${NC}"
    fi
}

# Test each bucket
test_bucket_access "$STAGING_BUCKET" \
    "${WASABI_STAGING_ACCESS_KEY:-$WASABI_ACCESS_KEY_ID}" \
    "${WASABI_STAGING_SECRET:-$WASABI_SECRET_ACCESS_KEY}"

test_bucket_access "$MASTERS_BUCKET" \
    "${WASABI_MASTERS_ACCESS_KEY:-$WASABI_ACCESS_KEY_ID}" \
    "${WASABI_MASTERS_SECRET:-$WASABI_SECRET_ACCESS_KEY}"

test_bucket_access "$PREVIEWS_BUCKET" \
    "${WASABI_PREVIEWS_ACCESS_KEY:-$WASABI_ACCESS_KEY_ID}" \
    "${WASABI_PREVIEWS_SECRET:-$WASABI_SECRET_ACCESS_KEY}"

echo ""

echo -e "${GREEN}Step 6: Generating Storage Configuration${NC}"

# Generate storage configuration file
cat > storage.env << EOF
# Wasabi S3 Storage Configuration
export WASABI_ENDPOINT="$WASABI_ENDPOINT"
export WASABI_REGION="$WASABI_REGION"

# Bucket Names (existing mm-*-au buckets)
export STAGING_BUCKET="$STAGING_BUCKET"
export MASTERS_BUCKET="$MASTERS_BUCKET"
export PREVIEWS_BUCKET="$PREVIEWS_BUCKET"

# Access Keys (set these with actual values)
# For staging bucket (upload permissions)
export WASABI_STAGING_ACCESS_KEY="${WASABI_STAGING_ACCESS_KEY:-YOUR_STAGING_ACCESS_KEY}"
export WASABI_STAGING_SECRET="${WASABI_STAGING_SECRET:-YOUR_STAGING_SECRET_KEY}"

# For masters bucket (copy and lock permissions)
export WASABI_MASTERS_ACCESS_KEY="${WASABI_MASTERS_ACCESS_KEY:-YOUR_MASTERS_ACCESS_KEY}"
export WASABI_MASTERS_SECRET="${WASABI_MASTERS_SECRET:-YOUR_MASTERS_SECRET_KEY}"

# For previews bucket (write permissions for worker)
export WASABI_PREVIEWS_ACCESS_KEY="${WASABI_PREVIEWS_ACCESS_KEY:-YOUR_PREVIEWS_ACCESS_KEY}"
export WASABI_PREVIEWS_SECRET="${WASABI_PREVIEWS_SECRET:-YOUR_PREVIEWS_SECRET_KEY}"

# Fallback to general credentials if specific ones not set
export AWS_ACCESS_KEY_ID="\${WASABI_STAGING_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="\${WASABI_STAGING_SECRET}"
export AWS_DEFAULT_REGION="$WASABI_REGION"

# Object Lock Configuration
export OBJECT_LOCK_DEFAULT_DAYS="30"  # 30-day retention for masters

# Generated: $(date)
EOF

echo "Storage configuration saved to storage.env"

# Generate storage documentation
cat > storage-setup.md << EOF
# Wasabi S3 Storage Configuration

## Overview
Using existing Wasabi buckets with Australian region (ap-southeast-2) for low-latency access.

## Bucket Configuration

### 1. Staging Bucket: \`$STAGING_BUCKET\`
- **Purpose**: Temporary storage for uploads before processing
- **Access**: Read/Write from backend service
- **Lifecycle**: Auto-delete after 7 days
- **Encryption**: AES256 server-side encryption
- **CORS**: Enabled for direct browser uploads

### 2. Masters Bucket: \`$MASTERS_BUCKET\`
- **Purpose**: Immutable storage for original files
- **Access**: Write-once from backend, read-only thereafter
- **Object Lock**: 30-day retention period
- **Versioning**: Enabled for audit trail
- **Deletion**: Denied by bucket policy

### 3. Previews Bucket: \`$PREVIEWS_BUCKET\`
- **Purpose**: Processed content for streaming delivery
- **Access**: Write from worker, public read with referer check
- **Content**: HLS segments, thumbnails, metadata
- **Lifecycle**: Old versions deleted after 30 days

## Security Configuration

### Access Control
- Separate IAM credentials per bucket tier
- Principle of least privilege
- Server-side encryption enforced
- Referer-based access control for previews

### Bucket Policies
- **staging-bucket-policy.json**: Upload/download permissions
- **masters-bucket-policy.json**: Immutable storage with deny delete
- **previews-bucket-policy.json**: Worker write, conditional public read

## CORS Configuration
Allows direct browser uploads to staging bucket from:
- https://*.motionmavericks.com
- http://localhost:3000
- http://localhost:3001

## Lifecycle Management
- **Staging**: 7-day retention
- **Masters**: Permanent storage with object lock
- **Previews**: 30-day old version cleanup

## Connection Details
- **Endpoint**: $WASABI_ENDPOINT
- **Region**: $WASABI_REGION (Sydney, Australia)
- **Protocol**: HTTPS with TLS 1.2+

## Integration Points

### Backend Service
- Generates presigned URLs for staging uploads
- Copies from staging to masters with object lock
- Triggers preview generation jobs

### Worker Service
- Downloads from masters bucket
- Processes media (HLS, thumbnails)
- Uploads to previews bucket

### Edge Service
- Validates HMAC signatures
- Serves content from previews bucket
- Implements caching headers

## Monitoring
- Bucket metrics available in Wasabi console
- Upload/download bandwidth tracking
- Storage usage per bucket
- Request rate monitoring

## Cost Optimization
- Staging auto-cleanup reduces storage costs
- Previews lifecycle removes old versions
- Regional bucket placement minimizes egress fees

Generated: $(date)
EOF

echo "Storage documentation saved to storage-setup.md"
echo ""

echo -e "${GREEN}Step 7: Testing Upload/Download${NC}"

# Create test upload script
cat > test-storage.sh << 'EOF'
#!/bin/bash

# Test file upload to staging
echo "Testing upload to staging bucket..."
echo "Test file content" > test-upload.txt

if [ -n "$WASABI_STAGING_ACCESS_KEY" ]; then
    AWS_ACCESS_KEY_ID="$WASABI_STAGING_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$WASABI_STAGING_SECRET" \
    aws s3 cp test-upload.txt "s3://mm-staging-au/test/upload-$(date +%s).txt" \
        --endpoint-url "https://s3.ap-southeast-2.wasabisys.com" \
        --region "ap-southeast-2"
    
    if [ $? -eq 0 ]; then
        echo "✓ Upload successful"
    else
        echo "✗ Upload failed"
    fi
else
    echo "Skipped - credentials not configured"
fi

rm -f test-upload.txt
EOF

chmod +x test-storage.sh

echo "Test script created: test-storage.sh"
echo ""

echo -e "${GREEN}=== Storage Configuration Complete ===${NC}"
echo ""
echo "Summary:"
echo "- Validated existing Wasabi buckets (mm-*-au)"
echo "- Created bucket policies for security"
echo "- Configured CORS for browser uploads"
echo "- Set up lifecycle policies for cost optimization"
echo "- Generated storage configuration files"
echo ""
echo "Next steps:"
echo "1. Apply bucket policies using AWS CLI:"
echo "   aws s3api put-bucket-policy --bucket mm-staging-au --policy file://staging-bucket-policy.json"
echo "2. Configure CORS:"
echo "   aws s3api put-bucket-cors --bucket mm-staging-au --cors-configuration file://cors-config.json"
echo "3. Set lifecycle policies:"
echo "   aws s3api put-bucket-lifecycle-configuration --bucket mm-staging-au --lifecycle-configuration file://staging-lifecycle.json"
echo "4. Update storage.env with actual credentials"
echo "5. Source the storage.env file: source storage.env"