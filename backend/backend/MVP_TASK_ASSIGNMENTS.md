# Motion Mavericks MVP - Subagent Task Assignments

## Overview
This document provides specific TaskSpecs for each subagent working on the Motion Mavericks MVP deployment. Each task includes detailed context, constraints, and acceptance criteria.

---

## Phase 1: Critical Path Recovery

### @debugging-specialist - Frontend 500 Error Investigation

**TaskSpec:**
```yaml
title: "Debug and Fix Frontend 500 Internal Server Error"
priority: P0
estimated_hours: 2-4
context_links:
  - /home/maverick/Projects/app/frontend/next.config.ts
  - /home/maverick/Projects/app/frontend/package.json
  - /home/maverick/Projects/app/frontend/.env.example
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Must maintain Sentry integration
  - Cannot break existing build process
  - Must work with DigitalOcean App Platform
  - No breaking changes to API contracts
acceptance_checks:
  - Frontend returns HTTP 200 on GET /
  - No console errors in browser
  - Sentry integration functional
  - Application loads without crashes
priority_tools:
  - Read: Analyze configuration files
  - Bash: Test deployment locally
  - Sentry MCP: Check error reports
docs_to_update:
  - docs/configuration/env.md
  - frontend/.env.example
```

**Root Cause Analysis Required:**
1. Check if Sentry environment variables are missing
2. Verify Next.js build configuration compatibility
3. Analyze environment variable configuration in deployment
4. Check for missing dependencies or build failures

**Expected OutputSpec:**
```yaml
changes_summary: "Detailed analysis of 500 error cause and fix implementation"
apply_patch: "List of files modified with unified diffs"
validations_run: "Local testing results and deployment verification"
docs_updates: "Updated environment configuration documentation"
followups: "Any additional configuration needed for production"
```

---

### @implementation-specialist - Minimal Backend Deployment

**TaskSpec:**
```yaml
title: "Deploy Minimal Backend API with Health Check"
priority: P0
estimated_hours: 3-4
dependencies:
  - Frontend 500 error must be identified
context_links:
  - /home/maverick/Projects/app/backend/src/index.ts
  - /home/maverick/Projects/app/backend/package.json
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Must use source code deployment (not Docker)
  - Must include functional health check endpoint
  - Must configure CORS for frontend domain
  - Should be minimal but extensible
acceptance_checks:
  - GET /api/health returns 200 with status
  - CORS allows frontend domain access
  - Service starts without errors
  - Deployment completes successfully
priority_tools:
  - Read: Review backend configuration
  - Write: Update deployment configuration
  - Bash: Local testing
docs_to_update:
  - docs/configuration/env.md
  - backend/.env.example
```

**Implementation Requirements:**
1. Create simplified DigitalOcean App Platform configuration
2. Configure basic Fastify server with health endpoint
3. Set up CORS for https://motionmavericks-7o53e.ondigitalocean.app
4. Ensure deployment uses GitHub source (not Docker registry)

**Expected OutputSpec:**
```yaml
changes_summary: "Minimal backend deployment configuration and implementation"
apply_patch: "Modified deployment config and backend setup files"
validations_run: "Health check endpoint testing results"
docs_updates: "Backend deployment documentation"
mcp_actions: "DigitalOcean deployment commands executed"
followups: "Database and Redis integration preparation"
```

---

## Phase 2: Core Infrastructure

### @deployment-orchestrator + @mcp-coordinator - Database Setup

**TaskSpec:**
```yaml
title: "Provision and Configure PostgreSQL Database"
priority: P1  
estimated_hours: 2-3
dependencies:
  - Minimal backend deployed
context_links:
  - /home/maverick/Projects/app/backend/src/migrate.ts
  - /home/maverick/Projects/app/backend/src/db.ts
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Use DigitalOcean Managed PostgreSQL
  - Must run migrations successfully
  - Connection string must be secure (secret)
  - Database must be accessible to backend service
acceptance_checks:
  - Database provisioned and accessible
  - Migrations execute without errors
  - Backend can connect to database
  - Connection pooling configured
priority_tools:
  - DigitalOcean MCP: Provision database
  - Bash: Run migrations
  - Read: Review migration scripts
docs_to_update:
  - docs/configuration/env.md
  - docs/deploy/digitalocean.md
```

**Implementation Requirements:**
1. Use DigitalOcean MCP to provision managed PostgreSQL (db-s-1vcpu-1gb)
2. Configure database connection string as App Platform secret
3. Update backend deployment to include POSTGRES_URL
4. Execute migrations via pre-deploy job or manual process

**Expected OutputSpec:**
```yaml
changes_summary: "PostgreSQL database provisioned and configured"
apply_patch: "Updated deployment configuration with database settings"
validations_run: "Database connectivity and migration testing"
mcp_actions: "DigitalOcean database provisioning and configuration"
docs_updates: "Database setup and migration documentation"
followups: "Redis setup and secrets configuration"
```

---

### @deployment-orchestrator + @mcp-coordinator - Redis Configuration

**TaskSpec:**
```yaml
title: "Provision and Configure Redis Message Queue"
priority: P1
estimated_hours: 1-2  
dependencies:
  - Database setup completed
context_links:
  - /home/maverick/Projects/app/worker/src/worker.ts
  - /home/maverick/Projects/app/backend/src/queue.ts
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Use DigitalOcean Managed Redis/Valkey
  - Must support Redis Streams
  - Connection string must be secure (secret)
  - Accessible to both backend and worker
acceptance_checks:
  - Redis instance provisioned and accessible
  - Redis Streams functionality verified
  - Backend and worker can connect
  - Basic pub/sub testing successful
priority_tools:
  - DigitalOcean MCP: Provision Redis
  - Bash: Test Redis connectivity
docs_to_update:
  - docs/configuration/env.md
  - docs/deploy/digitalocean.md
```

**Expected OutputSpec:**
```yaml
changes_summary: "Redis instance provisioned and configured for message queuing"
apply_patch: "Updated deployment with Redis configuration"
validations_run: "Redis connectivity and streams testing"
mcp_actions: "DigitalOcean Redis provisioning commands"
docs_updates: "Redis setup and usage documentation"
followups: "Worker service deployment preparation"
```

---

### @security-auditor + @mcp-coordinator - Secrets Management

**TaskSpec:**
```yaml
title: "Configure All Required Secrets and Environment Variables"
priority: P1
estimated_hours: 2-3
dependencies:
  - Database and Redis provisioned
context_links:
  - /home/maverick/Projects/app/deploy/do-app.yaml
  - /home/maverick/Projects/app/backend/.env.example
  - /home/maverick/Projects/app/worker/.env.example
  - /home/maverick/Projects/app/edge/.env.example
constraints:
  - All secrets must use App Platform secret storage
  - Signing keys must be cryptographically secure
  - Wasabi S3 credentials must be validated
  - No secrets in source code or logs
acceptance_checks:
  - All required secrets configured in App Platform
  - Signing keys generated with sufficient entropy
  - Wasabi S3 connectivity verified
  - No plaintext secrets in deployment config
priority_tools:
  - DigitalOcean MCP: Configure App Platform secrets
  - Bash: Generate secure keys
  - Read: Review secret requirements
docs_to_update:
  - docs/configuration/env.md
  - docs/security/secrets.md
```

**Secrets Required:**
- POSTGRES_URL (from database provisioning)
- REDIS_URL (from Redis provisioning)  
- WASABI_STAGING_ACCESS_KEY & WASABI_STAGING_SECRET
- WASABI_MASTERS_ACCESS_KEY & WASABI_MASTERS_SECRET
- WASABI_PREVIEWS_ACCESS_KEY & WASABI_PREVIEWS_SECRET
- EDGE_SIGNING_KEY (generated)

**Expected OutputSpec:**
```yaml
changes_summary: "All secrets configured securely in App Platform"
validations_run: "Secret accessibility and S3 connectivity testing"
mcp_actions: "App Platform secret configuration commands"
docs_updates: "Security configuration and secret management docs"
followups: "Service deployment with secrets integration"
```

---

## Phase 3: Worker and Edge Services

### @implementation-specialist - Worker Service

**TaskSpec:**
```yaml
title: "Deploy Worker Service with Video Processing"
priority: P2
estimated_hours: 4-6
dependencies:
  - Redis configured and accessible
  - Secrets management completed
context_links:
  - /home/maverick/Projects/app/worker/src/worker.ts
  - /home/maverick/Projects/app/worker/package.json
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Must use CPU-based video processing (no GPU initially)
  - Must integrate with Redis Streams
  - Must handle job failures gracefully
  - Should process basic video formats (MP4, MOV)
acceptance_checks:
  - Worker service deployed as background process
  - Redis stream integration functional
  - Basic video processing (HLS + thumbnails) works
  - Job failure handling implemented
priority_tools:
  - Read: Review worker implementation
  - Write: Update deployment configuration
  - Bash: Test video processing locally
docs_to_update:
  - docs/architecture/services-plan.md
  - worker/README.md
```

**Implementation Focus:**
1. Deploy worker as DigitalOcean App Platform worker (not service)
2. Configure Redis stream consumption
3. Implement basic FFmpeg processing pipeline
4. Test with sample video files

**Expected OutputSpec:**
```yaml
changes_summary: "Worker service deployed with basic video processing"
apply_patch: "Worker deployment configuration and processing updates"
validations_run: "Video processing pipeline testing results"
docs_updates: "Worker service documentation and troubleshooting"
followups: "Edge service deployment and end-to-end testing"
```

---

### @implementation-specialist - Edge Service

**TaskSpec:**
```yaml
title: "Deploy Edge Service with Signed URL Validation"
priority: P2
estimated_hours: 3-4
dependencies:
  - Secrets management completed
  - Worker service processing videos
context_links:
  - /home/maverick/Projects/app/edge/src/index.ts
  - /home/maverick/Projects/app/edge/package.json
  - /home/maverick/Projects/app/deploy/do-app.yaml
constraints:
  - Must validate HMAC signed URLs
  - Must serve from Wasabi preview bucket
  - Must configure CORS for frontend access
  - Must handle various video formats
acceptance_checks:
  - Edge service deployed and accessible
  - HMAC signature validation working
  - Preview video delivery functional
  - CORS configured for frontend domain
priority_tools:
  - Read: Review edge service implementation
  - Write: Update deployment configuration  
  - Bash: Test signed URL generation/validation
docs_to_update:
  - docs/architecture/services-plan.md
  - edge/README.md
```

**Expected OutputSpec:**
```yaml
changes_summary: "Edge service deployed with signed URL validation"
apply_patch: "Edge deployment configuration and HMAC validation"
validations_run: "Signed URL generation and validation testing"
docs_updates: "Edge service configuration and usage documentation"
followups: "End-to-end integration testing"
```

---

## Phase 4: Integration Testing

### @test-orchestrator - End-to-End Validation

**TaskSpec:**
```yaml
title: "Execute Comprehensive End-to-End Testing"
priority: P3
estimated_hours: 4-6
dependencies:
  - All services deployed
  - Worker and edge services functional
context_links:
  - /home/maverick/Projects/app/frontend/src/components/upload
  - /home/maverick/Projects/app/backend/src/routes
  - All service implementation files
constraints:
  - Must test complete upload-to-playback flow
  - Must validate error handling
  - Must verify performance benchmarks
  - Must document any issues found
acceptance_checks:
  - Upload flow completes successfully
  - Video processing generates previews
  - Playback works with HLS streaming
  - Error handling graceful throughout
priority_tools:
  - Read: Review all service implementations
  - Bash: Execute test scripts
  - Write: Document test results
docs_to_update:
  - docs/testing/e2e-testing.md
  - docs/troubleshooting/common-issues.md
```

**Test Scenarios:**
1. User uploads video via frontend
2. Video stored in staging bucket
3. Video promoted to masters bucket
4. Worker processes video into HLS + thumbnails
5. Preview files stored in preview bucket
6. Signed URLs generated for playback
7. Video playback works in frontend player

**Expected OutputSpec:**
```yaml
changes_summary: "Complete end-to-end testing results and issue resolution"
validations_run: "All test scenarios with pass/fail status"
docs_updates: "Testing procedures and troubleshooting guides"
followups: "Performance optimization recommendations"
```

---

## Coordination Requirements

### Cross-Team Dependencies
1. **Frontend Fix → Backend Deployment**: Frontend must be accessible before backend testing
2. **Database → Secrets**: Database connection string needed for secrets configuration  
3. **Secrets → Services**: All secrets must be configured before worker/edge deployment
4. **Worker → Edge**: Video processing must work before testing playback

### Daily Standups
- **Morning**: Review previous day progress, address blockers
- **Evening**: Validate completion criteria, plan next day priorities

### Communication Channels
- **Immediate Issues**: Direct coordination between specialists
- **Status Updates**: Update todo list after each major milestone
- **Documentation**: All specialists must update relevant docs

### Success Validation
Each phase must be validated before proceeding:
- **Phase 1**: Frontend loads, backend health check passes
- **Phase 2**: Database and Redis connectivity confirmed
- **Phase 3**: Video processing and delivery functional
- **Phase 4**: End-to-end user workflow successful

---

This task assignment document ensures each subagent has clear objectives, constraints, and success criteria for their portion of the MVP deployment.