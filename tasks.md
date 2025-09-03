# MotionMavericks MVP Deployment Tasks

**Current Status**: DigitalOcean App Platform deployment in progress  
**Deployment ID**: 5d9b9bbb-7c9e-4ded-ae90-526b2126edab  
**Goal**: Complete functional MVP deployment with upload, processing, and playback

## Phase 1: Fix Current Deployment Issues

### 1. Frontend Health Check Resolution ✅
- [x] **Root Cause**: Frontend redirects from `/` to `/dashboard` causing health check timeouts
- [x] **Solution**: Created dedicated `/health` page for health checks
- [x] **Configuration**: Updated App Platform spec with improved health check settings
  - Health check path: `/health` (instead of `/`)
  - Increased timeouts and delays for better reliability
- [x] **Files Modified**:
  - `/frontend/src/app/health/page.tsx` (created)
  - `/deploy/do-app.yaml` (updated health check configuration)

### 2. Wasabi S3 Credentials Configuration
- [ ] **Verify Credentials**: Confirm Wasabi credentials in `scripts/.env.wasabi` are valid and active
- [ ] **Set App Secrets**: Use `scripts/do_app_set_secrets.sh` to inject credentials into DO App Platform
- [ ] **Validate Bucket Access**: Test bucket connectivity with provided credentials
- [ ] **Commands to run**:
  ```bash
  # Load credentials and set secrets
  set -a; source scripts/.env.wasabi; set +a
  DO_ACCESS_TOKEN=your_token bash scripts/do_app_set_secrets.sh
  ```

### 3. Database and Redis Connection Setup
- [ ] **PostgreSQL URL**: Extract from DigitalOcean Managed Database and set as `POSTGRES_URL` secret
- [ ] **Redis/Valkey URL**: Extract from DigitalOcean Managed Redis and set as `REDIS_URL` secret  
- [ ] **Edge Signing Key**: Generate and set `EDGE_SIGNING_KEY` secret for signed URLs
- [ ] **Use Scripts**: Run `scripts/do_app_set_redis.sh` for Redis URL injection
- [ ] **Commands to run**:
  ```bash
  # Generate signing key
  openssl rand -hex 32
  # Use DO UI to set POSTGRES_URL, REDIS_URL, and EDGE_SIGNING_KEY secrets
  ```

### 4. Backend Service Validation
- [ ] **Health Check**: Verify `/api/health` endpoint responds correctly
- [ ] **Database Connection**: Ensure backend connects to PostgreSQL without errors
- [ ] **Redis Connection**: Verify Redis connectivity for job queuing
- [ ] **API Documentation**: Confirm `/api/docs` is accessible and shows correct endpoints

## Phase 2: Core Functionality Testing

### 5. File Upload Flow (Presign)
- [ ] **Endpoint Test**: Verify `POST /api/presign` returns valid signed URLs
- [ ] **Wasabi Upload**: Test actual file upload to staging bucket using presigned URL
- [ ] **Validation Checks**:
  - Content-type validation works
  - File size limits are enforced
  - Key naming prevents path traversal
- [ ] **Test Command**:
  ```bash
  # Test presign endpoint
  curl -X POST https://api.motionmavericks.com.au/api/presign \
    -H "Content-Type: application/json" \
    -d '{"key":"test/video.mp4","contentType":"video/mp4"}'
  ```

### 6. Asset Promotion Flow
- [ ] **Endpoint Test**: Verify `POST /api/promote` copies files from staging to masters
- [ ] **Object Lock**: Confirm masters bucket applies compliance lock (1 year retention)
- [ ] **Job Queuing**: Ensure preview generation job is queued to Redis streams
- [ ] **Test Command**:
  ```bash
  # Test promote endpoint
  curl -X POST https://api.motionmavericks.com.au/api/promote \
    -H "Content-Type: application/json" \
    -d '{"stagingKey":"test/video.mp4"}'
  ```

### 7. Preview Worker Processing
- [ ] **Worker Startup**: Verify preview-worker service starts and connects to Redis
- [ ] **Job Processing**: Confirm worker consumes preview generation jobs
- [ ] **HLS Generation**: Test video processing produces valid HLS output
- [ ] **Output Storage**: Verify processed files are stored in previews bucket
- [ ] **Error Handling**: Ensure failed jobs are properly handled and retried

## Phase 3: Edge Service and Playback

### 8. Edge Service Deployment
> **Note**: Edge service not currently in App Platform spec - needs manual setup

- [ ] **Droplet Provisioning**: Create edge service droplet with NVMe storage
- [ ] **Docker Deployment**: Build and deploy edge service container
- [ ] **Cache Configuration**: Set up disk caching for preview files
- [ ] **Network Security**: Configure firewall rules (only HTTPS to Wasabi previews)
- [ ] **DNS Setup**: Point `edge.motionmavericks.com.au` to edge service
- [ ] **Alternative**: For MVP, skip edge service - backend can return direct Wasabi URLs

### 9. Signed Playback URLs
- [ ] **Endpoint Test**: Verify `POST /api/sign-preview` generates valid signed URLs
- [ ] **URL Structure**: Confirm URLs follow expected format for HLS playbook
- [ ] **Signature Validation**: Test edge service validates HMAC signatures
- [ ] **Expiration Handling**: Verify URLs expire after configured time (1 hour)

## Phase 4: End-to-End MVP Validation

### 10. Complete Upload-to-Playback Flow
- [ ] **File Upload**: Upload test video via frontend upload interface
- [ ] **Asset Promotion**: Promote uploaded asset to masters bucket
- [ ] **Preview Generation**: Wait for preview worker to process video
- [ ] **Playback Test**: Generate signed URL and test video playback
- [ ] **Frontend Integration**: Verify frontend can display processed videos

### 11. Frontend Application Testing
- [ ] **Authentication Flow**: Test user login/logout functionality
- [ ] **Asset Browser**: Verify asset listing and filtering works
- [ ] **Upload Interface**: Test file selection and upload progress
- [ ] **Player Integration**: Confirm video player works with HLS streams
- [ ] **Error Handling**: Test graceful degradation when backend is unavailable

### 12. Performance and Monitoring
- [ ] **Health Checks**: All services pass health checks consistently
- [ ] **Response Times**: API endpoints respond within acceptable limits (<2s)
- [ ] **Resource Usage**: Services operate within allocated instance limits
- [ ] **Log Analysis**: Review application logs for errors or warnings
- [ ] **Scaling Test**: Verify services can handle multiple concurrent requests

## Phase 5: Production Readiness

### 13. Security Configuration
- [ ] **Secrets Management**: All sensitive data stored as DO App Platform secrets
- [ ] **CORS Policy**: Configure appropriate CORS origins for production
- [ ] **Rate Limiting**: Verify rate limits are configured and working
- [ ] **HTTPS Enforcement**: All external communication uses HTTPS

### 14. Backup and Recovery
- [ ] **Database Backups**: Verify automated PostgreSQL backups are configured
- [ ] **Bucket Versioning**: Confirm object versioning on critical buckets
- [ ] **Recovery Testing**: Test restore procedures for database and assets

### 15. Documentation and Handoff
- [ ] **Environment Variables**: Document all required environment variables
- [ ] **Deployment Process**: Update deployment documentation with lessons learned
- [ ] **Troubleshooting Guide**: Create guide for common deployment issues
- [ ] **API Documentation**: Ensure API docs are complete and accurate

## Current Priority Actions

1. **Immediate** (next 1-2 hours):
   - Configure Wasabi credentials in App Platform
   - Set database and Redis connection strings
   - Generate and configure edge signing key

2. **Short-term** (next 4-6 hours):
   - Test all API endpoints with real credentials
   - Validate preview worker functionality
   - Test complete upload flow

3. **Medium-term** (next 1-2 days):
   - Set up edge service or implement fallback strategy
   - Complete end-to-end testing
   - Performance optimization

## Success Criteria

MVP deployment is considered successful when:

- ✅ Frontend loads without health check failures
- [ ] Users can authenticate and access the dashboard
- [ ] File uploads to staging bucket work reliably
- [ ] Asset promotion to masters bucket functions correctly
- [ ] Preview worker processes videos and generates HLS output
- [ ] Signed playback URLs allow video streaming
- [ ] All services remain stable under normal load

## Emergency Rollback Plan

If deployment fails critically:

1. **Service Issues**: Scale affected services to 0 instances temporarily
2. **Database Problems**: Restore from most recent automated backup
3. **Credential Issues**: Reset secrets via DO UI or scripts
4. **Complete Rollback**: Revert to previous working deployment using CI/CD

---

**Last Updated**: 2025-09-03  
**Next Review**: After Phase 1 completion

## Task 1: Database Schema Implementation for Advanced Asset Management ✅

**Status**: COMPLETED (2025-09-03)  
**Estimated Time**: 3 days  
**Actual Time**: 4 hours  

### Completed Subtasks:

1. ✅ **Create folders table with hierarchy support (ltree)**
   - Implemented hierarchical folder structure using PostgreSQL ltree extension
   - Added materialized path support for efficient tree operations
   - Created triggers for automatic path management
   - Includes parent/child relationship validation

2. ✅ **Create collections and asset_collections tables**
   - Implemented named collections for asset organization
   - Added many-to-many relationship with assets
   - Includes visibility controls (public/private)
   - Added color coding for UI presentation

3. ✅ **Create custom_fields table with enum types**
   - Implemented flexible custom field definitions
   - Added field_type ENUM with 7 types: text, number, date, dropdown, boolean, url, email
   - Includes validation configuration and searchability settings
   - Added display order support

4. ✅ **Create asset_metadata table with JSONB support**
   - Flexible metadata storage using JSONB
   - Strong validation triggers based on field types
   - Performance indexes for different data types
   - Change tracking with metadata hash

5. ✅ **Create tags and asset_tags tables**
   - Tag system with usage count tracking
   - Support for system tags vs user tags
   - Many-to-many relationship with assets
   - Color coding and description support

6. ✅ **Add folder_id and search_vector to assets table**
   - Extended existing assets table with new columns
   - Added full-text search vector with automatic updates
   - Folder relationship with cascade handling
   - Backward compatibility maintained

7. ✅ **Create necessary indexes for performance**
   - GIN indexes for full-text search
   - GIST indexes for ltree operations
   - B-tree indexes for foreign keys and frequent queries
   - Specialized indexes for JSONB metadata queries

8. ✅ **Create database migration scripts**
   - Comprehensive migration in backend/src/migrate.ts
   - Idempotent operations with IF NOT EXISTS checks
   - Data migration for existing assets
   - Default folder and tag creation

9. ✅ **Update search vector trigger for assets**
   - Automatic search vector updates on asset changes
   - Metadata and tag text aggregation
   - Efficient trigger-based maintenance
   - Change detection with metadata hashing

### Technical Implementation Details:

**Database Schema Extensions:**
- ✅ ltree extension enabled for hierarchical paths
- ✅ Custom ENUM type for field validation
- ✅ Comprehensive constraint checks and validations

**Performance Features:**
- ✅ Materialized paths for O(1) ancestor/descendant queries
- ✅ Full-text search with tsvector indexing
- ✅ JSONB indexes for metadata query optimization
- ✅ Usage-based tag sorting and autocompletion support

**Data Migration:**
- ✅ Default "Imports" folder creation for all users
- ✅ System tags (Image, Video, Audio, Document) with automatic assignment
- ✅ Existing assets moved to default folders
- ✅ Search vectors populated for all existing assets

**Validation & Security:**
- ✅ Row-level user isolation on all tables
- ✅ Strong data validation with custom triggers
- ✅ Input sanitization and constraint checks
- ✅ Audit trail with created_at/updated_at timestamps

### Files Modified:
- `/home/maverick/Projects/app/backend/src/migrate.ts` - Complete schema implementation

### Next Steps:
- API endpoint implementation (Task 2)
- Frontend UI components (Task 3)
- Search and filtering functionality (Task 4)