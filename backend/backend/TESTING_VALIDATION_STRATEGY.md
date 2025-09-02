# Motion Mavericks MVP - Testing & Validation Strategy

## Overview

This document outlines comprehensive testing and validation procedures for the Motion Mavericks MVP deployment, including automated tests, manual validation procedures, performance benchmarks, and rollback criteria.

## Testing Philosophy

### Test Pyramid Structure
1. **Unit Tests**: Service-level functionality (existing)
2. **Integration Tests**: Service-to-service communication
3. **End-to-End Tests**: Complete user workflows
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Authentication and authorization

### Validation Gates
Each deployment phase must pass validation before proceeding to the next phase.

---

## Phase 1 Validation: Frontend Recovery

### Frontend Functional Testing

#### Test Case 1.1: Basic Application Load
```bash
# Test URL: https://motionmavericks-7o53e.ondigitalocean.app/

# Success Criteria:
- HTTP 200 status code
- HTML page renders without errors
- No JavaScript console errors
- Sentry integration initializes correctly

# Validation Commands:
curl -I https://motionmavericks-7o53e.ondigitalocean.app/
# Expected: HTTP/2 200

# Browser testing checklist:
□ Page loads completely
□ No console errors in browser dev tools
□ Sentry errors not increasing
□ Basic UI components render
```

#### Test Case 1.2: Environment Configuration
```bash
# Validate environment variables are properly set

# In browser console:
console.log(process.env.NEXT_PUBLIC_API_BASE)
console.log(process.env.NEXT_PUBLIC_EDGE_BASE)

# Expected outputs:
- NEXT_PUBLIC_API_BASE: https://api.motionmavericks.com.au (or backend service URL)
- NEXT_PUBLIC_EDGE_BASE: https://edge.motionmavericks.com.au (or edge service URL)
```

### Backend Health Testing

#### Test Case 1.3: Backend Health Endpoint
```bash
# Test backend health check

curl -X GET https://api.motionmavericks.com.au/api/health \
  -H "Content-Type: application/json"

# Expected Response:
{
  "status": "ok",
  "timestamp": "2025-09-02T16:10:14.000Z",
  "version": "1.0.0"
}

# Status: 200 OK
```

#### Test Case 1.4: CORS Configuration
```bash
# Test CORS headers from frontend domain

curl -H "Origin: https://motionmavericks-7o53e.ondigitalocean.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.motionmavericks.com.au/api/health

# Expected Headers:
- Access-Control-Allow-Origin: https://motionmavericks-7o53e.ondigitalocean.app
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

---

## Phase 2 Validation: Core Infrastructure

### Database Connectivity Testing

#### Test Case 2.1: Database Connection
```bash
# Test database connectivity from backend service

# Backend logs should show:
grep "Database connected" /var/log/backend.log

# Or test via backend health endpoint with DB check:
curl https://api.motionmavericks.com.au/api/health?check=db

# Expected Response:
{
  "status": "ok",
  "database": {
    "connected": true,
    "pool_active": 2,
    "pool_idle": 8
  }
}
```

#### Test Case 2.2: Database Migration Verification
```bash
# Verify all migrations have been applied

# Check migration status
curl https://api.motionmavericks.com.au/api/health?check=migrations

# Expected Response:
{
  "migrations": {
    "applied": 5,
    "pending": 0,
    "latest": "20250901_create_assets_table"
  }
}

# Verify core tables exist
psql $POSTGRES_URL -c "\dt"
# Expected tables: users, assets, upload_sessions, preview_jobs
```

### Redis Connectivity Testing

#### Test Case 2.3: Redis Connection
```bash
# Test Redis connectivity and streams

curl https://api.motionmavericks.com.au/api/health?check=redis

# Expected Response:
{
  "redis": {
    "connected": true,
    "streams": {
      "previews:build": "exists"
    }
  }
}
```

#### Test Case 2.4: Redis Stream Operations
```bash
# Test basic stream operations

# Add test job to queue (via backend API)
curl -X POST https://api.motionmavericks.com.au/api/test/queue \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'

# Verify job appears in stream
redis-cli -u $REDIS_URL XLEN previews:build
# Expected: > 0
```

---

## Phase 3 Validation: Worker & Edge Services

### Worker Service Testing

#### Test Case 3.1: Worker Service Health
```bash
# Worker should be processing jobs from Redis stream

# Check worker is consuming from stream
redis-cli -u $REDIS_URL XINFO CONSUMERS previews:build previewers

# Expected: At least one active consumer

# Check worker logs for activity
grep "Processing job" /var/log/worker.log
```

#### Test Case 3.2: Basic Video Processing
```bash
# Upload test video and verify processing

# 1. Upload small test video (30 seconds, 720p)
TEST_VIDEO="https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4"

# 2. Submit for processing via backend API
curl -X POST https://api.motionmavericks.com.au/api/assets \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-video.mp4",
    "size": 1048576,
    "type": "video/mp4"
  }'

# 3. Promote to trigger processing
curl -X POST https://api.motionmavericks.com.au/api/assets/{asset_id}/promote

# 4. Wait for processing completion (check via polling)
curl https://api.motionmavericks.com.au/api/assets/{asset_id}/status

# Expected final status:
{
  "status": "ready",
  "previews": {
    "hls": "available",
    "thumbnail": "available"
  }
}
```

### Edge Service Testing

#### Test Case 3.3: Edge Service Health
```bash
# Test edge service availability

curl -I https://edge.motionmavericks.com.au/health

# Expected: HTTP 200 OK
```

#### Test Case 3.4: Signed URL Validation
```bash
# Test signed URL generation and validation

# 1. Generate signed URL via backend
curl -X POST https://api.motionmavericks.com.au/api/sign-preview \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": "{test_asset_id}",
    "type": "hls"
  }'

# Expected Response:
{
  "signed_url": "https://edge.motionmavericks.com.au/s/{signature}/hls/{asset_id}/playlist.m3u8",
  "expires_at": "2025-09-02T17:10:14.000Z"
}

# 2. Validate signed URL works
curl -I "{signed_url}"
# Expected: HTTP 200 OK

# 3. Test invalid signature fails
curl -I "https://edge.motionmavericks.com.au/s/invalid/hls/{asset_id}/playlist.m3u8"
# Expected: HTTP 403 Forbidden
```

---

## Phase 4 Validation: End-to-End Testing

### Complete Workflow Testing

#### Test Case 4.1: Upload Flow
```javascript
// Frontend JavaScript test (run in browser console)

// Test file upload flow
const testUpload = async () => {
  // 1. Request presigned URL
  const response = await fetch('/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'test-video.mp4',
      size: 1048576,
      type: 'video/mp4'
    })
  });
  
  const { upload_url, asset_id } = await response.json();
  console.log('Presigned URL received:', upload_url);
  
  // 2. Upload file to presigned URL
  const file = new File(['test content'], 'test-video.mp4', { type: 'video/mp4' });
  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    body: file
  });
  
  console.log('Upload status:', uploadResponse.status);
  return asset_id;
};

testUpload().then(asset_id => {
  console.log('Upload test completed for asset:', asset_id);
});
```

#### Test Case 4.2: Processing Flow
```bash
# Test complete processing pipeline

ASSET_ID="test-asset-id"

# 1. Promote asset from staging to masters
curl -X POST https://api.motionmavericks.com.au/api/assets/$ASSET_ID/promote

# 2. Monitor processing status
watch -n 5 "curl -s https://api.motionmavericks.com.au/api/assets/$ASSET_ID/status | jq '.status'"

# Expected status progression:
# "uploaded" -> "promoted" -> "processing" -> "ready"

# 3. Verify preview files exist
curl -s https://api.motionmavericks.com.au/api/assets/$ASSET_ID | jq '.previews'

# Expected:
{
  "hls": {
    "playlist": "available",
    "segments": 8
  },
  "thumbnail": {
    "image": "available",
    "url": "signed_url_here"
  }
}
```

#### Test Case 4.3: Playback Flow
```javascript
// Test video playback in frontend
const testPlayback = async (assetId) => {
  // 1. Get signed playback URL
  const response = await fetch(`/api/assets/${assetId}/sign-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'hls' })
  });
  
  const { signed_url } = await response.json();
  console.log('Signed playback URL:', signed_url);
  
  // 2. Test HLS.js can load the stream
  if (Hls.isSupported()) {
    const hls = new Hls();
    const video = document.createElement('video');
    
    hls.loadSource(signed_url);
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('HLS manifest loaded successfully');
      video.play();
    });
    
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data);
    });
    
    return new Promise((resolve) => {
      video.onloadeddata = () => {
        console.log('Video data loaded, duration:', video.duration);
        resolve(true);
      };
    });
  }
};
```

---

## Performance Benchmarks

### Response Time Requirements
- Frontend page load: < 3 seconds
- Backend API responses: < 500ms
- Video upload presign: < 200ms
- Playback URL signing: < 100ms
- Health checks: < 50ms

### Throughput Requirements
- Concurrent uploads: 10 simultaneous
- Processing queue: Handle 50 jobs/hour
- Preview generation: Complete within 2x video duration
- Playback requests: 100 concurrent streams

### Performance Test Scripts

#### Load Testing Script
```bash
#!/bin/bash
# load-test.sh - Basic load testing

echo "Testing frontend load times..."
for i in {1..10}; do
  curl -w "@curl-format.txt" -o /dev/null -s "https://motionmavericks-7o53e.ondigitalocean.app/"
done

echo "Testing API response times..."
for i in {1..20}; do
  curl -w "@curl-format.txt" -o /dev/null -s "https://api.motionmavericks.com.au/api/health"
done
```

#### Concurrent Upload Testing
```javascript
// concurrent-upload-test.js
const testConcurrentUploads = async (numUploads = 5) => {
  const uploads = Array(numUploads).fill().map(async (_, i) => {
    const start = Date.now();
    
    // Request presigned URL
    const response = await fetch('/api/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `test-video-${i}.mp4`,
        size: 1048576,
        type: 'video/mp4'
      })
    });
    
    const duration = Date.now() - start;
    console.log(`Upload ${i}: ${duration}ms`);
    
    return { upload: i, duration };
  });
  
  const results = await Promise.all(uploads);
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`Average presign request time: ${avgDuration}ms`);
  return avgDuration < 500; // Pass if under 500ms average
};
```

---

## Security Testing

### Authentication Testing
```bash
# Test that protected endpoints require authentication
curl -X POST https://api.motionmavericks.com.au/api/assets
# Expected: 401 Unauthorized

# Test with invalid token
curl -X POST https://api.motionmavericks.com.au/api/assets \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized
```

### CORS Security Testing
```bash
# Test CORS doesn't allow arbitrary origins
curl -H "Origin: https://malicious-site.com" \
     -X OPTIONS \
     https://api.motionmavericks.com.au/api/health
# Expected: No CORS headers returned
```

### Signed URL Security Testing
```bash
# Test expired signed URLs are rejected
# (Generate URL, wait for expiration, test access)

# Test tampered signatures are rejected
curl -I "https://edge.motionmavericks.com.au/s/tampered-signature/hls/asset123/playlist.m3u8"
# Expected: 403 Forbidden
```

---

## Monitoring and Alerting Validation

### Sentry Integration Testing
```javascript
// Test error reporting to Sentry
try {
  throw new Error('Test error for Sentry validation');
} catch (error) {
  console.error('This error should appear in Sentry:', error);
  // Check Sentry dashboard for this error
}
```

### Health Check Monitoring
```bash
# Verify health checks are being monitored
curl https://api.motionmavericks.com.au/api/health
# Check DigitalOcean monitoring dashboard for this request
```

---

## Rollback Testing

### Rollback Criteria
Immediate rollback if:
- Frontend 500 error rate > 5%
- Backend API error rate > 10%
- Database connection failures
- Critical security vulnerabilities
- Service cascade failures

### Rollback Procedures Testing
```bash
# Test rollback procedures (in staging first)

# 1. Scale down problematic service
doctl apps update $APP_ID --spec rollback-config.yaml

# 2. Verify other services continue functioning
curl https://api.motionmavericks.com.au/api/health

# 3. Restore from backup if needed
# (Database restoration procedures)

# 4. Verify rollback successful
# (Run subset of validation tests)
```

---

## Automated Testing Pipeline

### Pre-deployment Tests
```bash
#!/bin/bash
# pre-deploy-tests.sh

set -e

echo "Running pre-deployment validation..."

# 1. Unit tests
cd backend && npm run test
cd ../frontend && npm run test:unit
cd ../worker && npm run test
cd ../edge && npm run test

# 2. Build verification
cd ../frontend && npm run build
cd ../backend && npm run build
cd ../worker && npm run build
cd ../edge && npm run build

# 3. Lint checks
cd ../frontend && npm run lint
cd ../backend && npm run lint

echo "All pre-deployment tests passed!"
```

### Post-deployment Validation
```bash
#!/bin/bash
# post-deploy-validation.sh

set -e

echo "Running post-deployment validation..."

# Wait for services to be ready
sleep 30

# Run health checks
./scripts/health-check.sh

# Run smoke tests
./scripts/smoke-tests.sh

# Verify monitoring
./scripts/verify-monitoring.sh

echo "Post-deployment validation completed successfully!"
```

---

## Test Data Management

### Test Assets
- Small video files (< 10MB) for quick processing tests
- Various formats: MP4, MOV, AVI
- Different resolutions: 480p, 720p, 1080p
- Edge cases: very short videos (< 5 seconds), audio-only files

### Test User Data
- Valid user accounts for authentication testing
- Test upload sessions
- Sample asset metadata

### Cleanup Procedures
```bash
# Clean up test data after validation
curl -X DELETE https://api.motionmavericks.com.au/api/test/cleanup
```

---

This comprehensive testing and validation strategy ensures the Motion Mavericks MVP is thoroughly tested at each deployment phase, with clear success criteria and rollback procedures.