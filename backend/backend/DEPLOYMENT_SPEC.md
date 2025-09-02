# Motion Mavericks MVP Deployment Specification

## Executive Summary

The Motion Mavericks application is currently partially deployed with the frontend service showing a 500 Internal Server Error. This specification provides a comprehensive plan to debug the frontend error and deploy a fully functional MVP with all services operational.

## Current State Analysis

### Problem Analysis
1. **Frontend 500 Error**: The deployed frontend at https://motionmavericks-7o53e.ondigitalocean.app/ returns HTTP 500
2. **Missing Services**: Backend, edge, and worker services are not deployed
3. **Missing Infrastructure**: PostgreSQL database and Redis are not configured
4. **Missing Secrets**: Environment variables and secrets are not set up
5. **Configuration Issues**: Deployment configuration uses Docker registry images that may not exist

### Root Causes Identified
1. **Sentry Configuration**: Frontend is configured with Sentry but missing required environment variables
2. **API Dependencies**: Frontend expects backend API but it's not deployed
3. **Environment Variables**: Missing `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_EDGE_BASE` in deployment
4. **Docker Images**: Deployment spec references DOCR images that may not be built/pushed

## Solution Architecture

### MVP Requirements
For a functional MVP, we need:
1. **Frontend**: Accessible without errors, basic UI functional
2. **Backend API**: Health check endpoint, presigned upload URLs
3. **Database**: PostgreSQL for asset metadata
4. **Redis**: Message queue for worker communication
5. **Worker**: Basic preview generation (CPU-based)
6. **Edge Service**: Signed URL validation and preview delivery

### Deployment Strategy
We'll use a phased approach:
1. **Phase 1**: Fix frontend 500 error with minimal backend
2. **Phase 2**: Deploy full backend with database
3. **Phase 3**: Deploy worker and edge services
4. **Phase 4**: Configure secrets and test end-to-end

## Detailed Task Breakdown

### Phase 1: Frontend Recovery (Critical Path)
**Priority: P0 - Immediate**

#### Task 1.1: Debug Frontend 500 Error
- **Assigned to**: @debugging-specialist
- **Dependencies**: None
- **Acceptance Criteria**:
  - Identify exact cause of 500 error
  - Fix configuration issues
  - Frontend loads without errors
- **Implementation**:
  - Check Sentry configuration and missing environment variables
  - Review Next.js build configuration
  - Create minimal environment configuration
  - Test locally and deploy fix

#### Task 1.2: Minimal Backend Deployment
- **Assigned to**: @implementation-specialist
- **Dependencies**: Task 1.1
- **Acceptance Criteria**:
  - Backend health check endpoint responds 200
  - Basic CORS configuration allows frontend access
  - Deployment uses source code build (not Docker images)
- **Implementation**:
  - Create simplified backend deployment configuration
  - Deploy basic Fastify server with health check
  - Configure CORS for frontend domain

### Phase 2: Core Infrastructure (Essential)
**Priority: P1 - Same Day**

#### Task 2.1: Database Configuration
- **Assigned to**: @deployment-orchestrator with @mcp-coordinator
- **Dependencies**: Task 1.2
- **Acceptance Criteria**:
  - PostgreSQL database provisioned and accessible
  - Database migrations executed successfully
  - Connection string configured in backend
- **Implementation**:
  - Use DigitalOcean MCP to provision managed PostgreSQL
  - Configure connection strings as secrets
  - Run database migrations via deployment job

#### Task 2.2: Redis Configuration  
- **Assigned to**: @deployment-orchestrator with @mcp-coordinator
- **Dependencies**: Task 2.1
- **Acceptance Criteria**:
  - Redis/Valkey instance provisioned
  - Connection string configured in backend and worker
  - Basic connectivity verified
- **Implementation**:
  - Provision managed Redis through DigitalOcean
  - Configure connection strings as secrets
  - Test connectivity from services

#### Task 2.3: Secrets Management
- **Assigned to**: @security-auditor with @mcp-coordinator
- **Dependencies**: Task 2.1, 2.2
- **Acceptance Criteria**:
  - All required secrets configured in DigitalOcean App Platform
  - Wasabi S3 credentials configured
  - Signing keys generated and configured
- **Implementation**:
  - Generate secure signing keys
  - Configure Wasabi S3 credentials
  - Set up all environment variables per deployment spec

### Phase 3: Worker and Edge Services (Functional)
**Priority: P2 - Next Day**

#### Task 3.1: Worker Service Deployment
- **Assigned to**: @implementation-specialist
- **Dependencies**: Task 2.2
- **Acceptance Criteria**:
  - Worker service deployed and processing jobs
  - Basic video processing functional (CPU-based)
  - Redis stream integration working
- **Implementation**:
  - Deploy worker as background service
  - Configure video processing pipeline
  - Test job processing with sample video

#### Task 3.2: Edge Service Deployment  
- **Assigned to**: @implementation-specialist
- **Dependencies**: Task 2.3
- **Acceptance Criteria**:
  - Edge service deployed with signed URL validation
  - CORS configured for frontend access
  - Preview delivery functional
- **Implementation**:
  - Deploy edge service with HMAC validation
  - Configure preview bucket access
  - Test signed URL generation and validation

### Phase 4: End-to-End Testing (Validation)
**Priority: P3 - Integration**

#### Task 4.1: Upload Flow Testing
- **Assigned to**: @test-orchestrator
- **Dependencies**: All previous phases
- **Acceptance Criteria**:
  - User can upload video through frontend
  - Presigned URLs work correctly
  - Video stored in staging bucket
- **Implementation**:
  - Test upload flow with sample videos
  - Verify presigned URL generation
  - Confirm file storage in Wasabi

#### Task 4.2: Processing Flow Testing
- **Assigned to**: @test-orchestrator  
- **Dependencies**: Task 3.1, 3.2
- **Acceptance Criteria**:
  - Uploaded videos trigger preview generation
  - HLS and thumbnail generation works
  - Processed files stored in preview bucket
- **Implementation**:
  - Test video promotion from staging to masters
  - Verify worker processes jobs
  - Confirm preview generation

#### Task 4.3: Playback Flow Testing
- **Assigned to**: @test-orchestrator
- **Dependencies**: Task 4.2
- **Acceptance Criteria**:
  - Generated previews accessible via signed URLs
  - Video playback works in frontend
  - HLS streaming functional
- **Implementation**:
  - Test signed URL generation for previews
  - Verify video playback in frontend
  - Test HLS streaming performance

## Implementation Plan

### Day 1: Critical Path Recovery
**Morning (0-4 hours)**
1. Debug frontend 500 error - identify Sentry/environment issues
2. Create minimal backend deployment configuration  
3. Deploy basic backend with health check
4. Fix frontend configuration and redeploy

**Afternoon (4-8 hours)**
5. Provision PostgreSQL database
6. Configure database connection and run migrations
7. Provision Redis instance
8. Configure basic secrets and environment variables

**Expected Outcome**: Frontend accessible, basic backend operational

### Day 2: Service Integration
**Morning (0-4 hours)**
1. Deploy worker service with basic processing
2. Deploy edge service with signed URL validation
3. Configure remaining secrets and Wasabi credentials
4. Test service-to-service communication

**Afternoon (4-8 hours)**
5. End-to-end testing of upload flow
6. Test video processing pipeline
7. Test preview generation and playback
8. Performance and error monitoring setup

**Expected Outcome**: Full MVP functionality operational

### Rollback Plan

#### Immediate Rollback Triggers
- Frontend 500 errors persist after fixes
- Database connectivity issues
- Critical security misconfigurations
- Service cascade failures

#### Rollback Procedures
1. **Frontend**: Revert to last known working configuration
2. **Backend**: Scale down to 0 instances, investigate offline  
3. **Database**: Restore from backup if data corruption
4. **Secrets**: Rotate compromised keys immediately

### Success Metrics

#### Technical Metrics
- Frontend HTTP 200 response rate > 99%
- Backend API response time < 500ms
- Video upload success rate > 95%
- Preview generation completion rate > 90%

#### Functional Metrics  
- User can access application without errors
- Upload flow completes successfully
- Video processing generates previews
- Playback works for processed videos

### Risk Mitigation

#### High Risks
1. **Database Migration Failures**
   - Mitigation: Test migrations on copy first
   - Rollback: Restore from pre-migration backup

2. **Secrets Misconfiguration**
   - Mitigation: Use secure key generation
   - Rollback: Rotate keys and update immediately

3. **Service Dependencies**
   - Mitigation: Deploy services in dependency order
   - Rollback: Scale down dependent services first

#### Medium Risks
1. **Resource Constraints**: Monitor CPU/memory usage
2. **Network Connectivity**: Test inter-service communication
3. **Third-party Dependencies**: Verify Wasabi and Sentry access

## Monitoring and Validation

### Health Checks
- Frontend: `GET /` returns 200
- Backend: `GET /api/health` returns 200  
- Edge: `GET /health` returns 200
- Worker: Redis stream processing active

### Key Metrics to Monitor
- HTTP error rates
- Response times
- Database connection pool
- Redis queue depth
- Video processing success rates

### Error Alerting
- Configure Sentry for error tracking
- Set up DigitalOcean alerts for service failures
- Monitor disk space and memory usage

## Resource Requirements

### DigitalOcean Services Needed
- App Platform: motionmavericks app (existing)
- Managed PostgreSQL: db-s-1vcpu-1gb
- Managed Redis: db-s-1vcpu-1gb  
- Container Registry: For future Docker deployments

### Estimated Costs
- App Platform services: ~$24/month
- PostgreSQL database: ~$15/month
- Redis instance: ~$15/month  
- **Total: ~$54/month for MVP**

### Scaling Considerations
- Start with basic-xxs instances for all services
- Scale up based on usage patterns
- Consider moving to Docker deployments for better resource utilization

## Security Considerations

### Secrets Management
- All credentials stored as DigitalOcean App Platform secrets
- Signing keys generated with sufficient entropy
- Regular key rotation schedule established

### Access Controls
- CORS properly configured for frontend domain
- S3 bucket policies restrict access appropriately
- Database access limited to application services

### Monitoring
- Sentry configured for error tracking and performance
- Failed authentication attempt monitoring
- Unusual usage pattern detection

## Next Steps After MVP

1. **Performance Optimization**: Implement caching, CDN
2. **Security Hardening**: Security audit, penetration testing  
3. **Feature Enhancement**: Additional video formats, batch processing
4. **Monitoring Enhancement**: Custom dashboards, alerting rules
5. **Documentation**: User guides, API documentation

---

This specification provides a comprehensive plan to recover from the current 500 error and deploy a fully functional MVP. The phased approach ensures critical functionality is restored quickly while building toward full feature parity.