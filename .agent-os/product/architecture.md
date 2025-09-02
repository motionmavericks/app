# System Architecture

## Overview

The Media Asset Management platform uses a modern microservices architecture with four distinct services that work together to provide a complete media processing and delivery solution. The architecture prioritizes scalability, security, and performance while maintaining clear separation of concerns.

## Service Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│   Frontend  │    │   Backend    │    │   Worker    │    │     Edge     │
│   (Next.js) │    │  (Fastify)   │    │  (FFmpeg)   │    │  (Fastify)   │
│   Port 3001 │◄──►│  Port 3000   │◄──►│   Redis     │    │  Port 8080   │
│             │    │              │    │   Streams   │    │              │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
       │                    │                   │                  │
       │                    │                   │                  │
       ▼                    ▼                   ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Shared Infrastructure                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐   │
│  │ PostgreSQL  │  │    Redis    │  │         Wasabi S3               │   │
│  │ Database    │  │   Cache     │  │  ┌─────────┐ ┌─────────┐ ┌────┐ │   │
│  │             │  │   & Queue   │  │  │Staging  │ │Masters  │ │Prev│ │   │
│  └─────────────┘  └─────────────┘  │  │Bucket   │ │ Bucket  │ │iew │ │   │
│                                    │  └─────────┘ └─────────┘ └────┘ │   │
│                                    └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

### Frontend Service (Port 3001)
**Technology**: Next.js 15.5.2, React 19.1.0, Tailwind CSS 4
**Status**: ✅ FULLY IMPLEMENTED

**Responsibilities**:
- User interface and experience
- Asset upload and management dashboards  
- Video playback with HLS.js integration
- User authentication flows
- Time-coded comment interface
- Responsive design for desktop and mobile

**Implemented Features**:
- Server-side rendering with App Router
- Modern component architecture with Radix UI
- Dark/light theme support
- MAM-specific components (AssetGrid, MediaPlayer, UserManagement)
- Progressive web app capabilities

### Backend API Service (Port 3000)
**Technology**: Fastify 4.28.1, PostgreSQL, Redis, JWT
**Status**: ✅ FULLY IMPLEMENTED

**Responsibilities**:
- Core business logic and data management
- User authentication and authorization
- Asset metadata management and CRUD operations
- Presigned URL generation for direct uploads
- Asset promotion workflow orchestration
- HMAC signature generation for secure content access
- Job queue management for worker coordination

**Implemented Endpoints**:
- `POST /auth/register` - User registration with Argon2 hashing
- `POST /auth/login` - JWT authentication with refresh tokens
- `POST /auth/refresh` - Token refresh and rotation
- `POST /auth/logout` - Session termination
- `GET /auth/me` - Current user information
- `POST /api/presign` - Generate upload URLs
- `POST /api/promote` - Move assets from staging to masters
- `POST /api/sign-preview` - Generate signed playback URLs
- `GET /api/assets` - Asset listing and search
- `GET /api/assets/:id` - Single asset with versions
- `POST /api/assets` - Create new asset records
- `POST /api/preview` - Enqueue preview processing
- `GET /api/preview/status` - Check preview readiness
- `GET /api/preview/events` - Server-sent events for status
- `POST /api/preview/callback` - Worker completion callback
- `GET /api/health` - Service health check

### Worker Service (Background Processing)
**Technology**: Node.js 20+, FFmpeg (GPU-accelerated), Redis Streams
**Status**: ✅ FULLY IMPLEMENTED

**Responsibilities**:
- GPU-accelerated media processing with NVENC
- HLS stream generation for adaptive playback
- Multiple quality variant generation (360p, 480p, 720p, 1080p)
- Video transcoding and optimization
- Queue-based job processing with retry logic
- Asset metadata extraction (duration, resolution, codec)

**Implemented Processing Pipeline**:
1. Receive job from Redis stream with consumer groups
2. Download source from Masters bucket via presigned URL
3. Process with FFmpeg (GPU preferred, CPU fallback)
4. Generate HLS variants with adaptive bitrates
5. Upload results to Previews bucket with AES256 encryption
6. Update asset status via backend callback
7. Handle errors and retry failed jobs with exponential backoff

### Edge Service (Port 8080)
**Technology**: Fastify 4.28.1, HMAC validation, S3 streaming
**Status**: ✅ FULLY IMPLEMENTED

**Responsibilities**:
- Secure content delivery with signature validation
- High-performance streaming from Previews bucket
- HMAC signature verification with configurable expiration
- Rate limiting and abuse protection
- Caching headers for optimal CDN integration
- Bandwidth optimization and compression

**Implemented Security Features**:
- Time-based signature expiration
- Path sanitization for security
- Request rate limiting
- Comprehensive access logging
- Proxy streaming with range request support

## Data Architecture

### Database Schema (PostgreSQL) - ✅ IMPLEMENTED
```sql
-- Core tables (fully implemented)
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  display_name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  authz_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR,
  staging_key VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

versions (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  master_key VARCHAR NOT NULL,
  preview_prefix VARCHAR,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

comments (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id),
  user_id UUID REFERENCES users(id),
  timestamp_sec DECIMAL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  jti VARCHAR NOT NULL,
  refresh_token_hash VARCHAR NOT NULL,
  parent_jti VARCHAR,
  replaced_by_jti VARCHAR,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  permissions JSONB
);

user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- Performance indexes
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_created_at ON assets(created_at);
CREATE INDEX idx_versions_asset_id ON versions(asset_id);
CREATE INDEX idx_comments_asset_id ON comments(asset_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_jti ON sessions(jti);
```

### Redis Usage Patterns - ✅ IMPLEMENTED
```javascript
// Job Queue (Redis Streams)
XADD previews:build * id job_123 asset_id asset_456 master_bucket masters master_key masters/video.mp4

// Session Cache
SET session:jwt_token user_data EX 3600

// Rate Limiting
INCR rate_limit:user_123 EX 60
```

### Storage Strategy (Wasabi S3) - ✅ IMPLEMENTED
```
Staging Bucket (temporary, 7-day lifecycle)
├── uploads/{user_id}/{asset_id}/original.mp4
├── temp/{upload_id}/chunks/
└── metadata/{asset_id}.json

Masters Bucket (immutable, object lock enabled)
├── masters/{asset_id}/original.mp4
├── masters/{asset_id}/metadata.json
└── versions/{asset_id}/v{timestamp}/

Previews Bucket (processed content)
├── previews/{asset_id}/index.m3u8
├── previews/{asset_id}/720p/index.m3u8
├── previews/{asset_id}/720p/segment_000.ts
├── previews/{asset_id}/480p/index.m3u8
└── previews/{asset_id}/480p/segment_000.ts
```

## Communication Patterns - ✅ IMPLEMENTED

### Synchronous Communication
- **Frontend ↔ Backend**: HTTP REST API calls with JWT auth
- **Backend ↔ Database**: Direct PostgreSQL connections with pooling
- **Edge ↔ Storage**: S3 API for content streaming with HMAC validation

### Asynchronous Communication
- **Backend → Worker**: Redis Streams job queue with consumer groups
- **Worker → Backend**: Database status updates and callback API
- **Worker ↔ Storage**: S3 uploads/downloads with presigned URLs

### Event-Driven Workflows - ✅ IMPLEMENTED
```javascript
// Asset Upload Flow (IMPLEMENTED)
1. Frontend → Backend: Request presigned URL (/api/presign)
2. Frontend → S3: Direct upload to Staging bucket
3. Frontend → Backend: Create asset record (/api/assets)
4. Frontend → Backend: Promote to Masters (/api/promote)
5. Backend → Worker: Queue processing job via Redis Streams
6. Worker: Process asset and upload to Previews bucket
7. Worker → Backend: Completion callback (/api/preview/callback)

// Secure Playback Flow (IMPLEMENTED)
1. Frontend → Backend: Request signed URL (/api/sign-preview)
2. Backend: Generate HMAC signature with expiration
3. Frontend → Edge: Request content with signature (/s/...)
4. Edge: Validate signature and stream content from Previews bucket
```

## Security Architecture - ✅ IMPLEMENTED

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration (15 min)
- **Refresh Tokens**: Secure rotation with 30-day expiration
- **Password Security**: Argon2 hashing with salt and strength validation
- **Session Management**: Database-based session storage with revocation
- **Role-Based Access**: User permissions and asset ownership

### Content Security
- **HMAC Signatures**: Cryptographically signed URLs with SHA-256
- **Time-Based Expiration**: Configurable URL validity periods (60-3600 sec)
- **IP Restrictions**: Optional IP-based access control
- **Rate Limiting**: Per-user and per-IP request throttling

### Data Protection
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Encryption at Rest**: S3 server-side encryption (AES-256)
- **Immutable Masters**: Object lock prevents accidental deletion
- **Audit Logging**: Comprehensive access and change tracking

## Scalability Considerations - ✅ IMPLEMENTED

### Horizontal Scaling
- **Stateless Services**: All services can run multiple instances
- **Load Balancing**: DigitalOcean App Platform load distribution
- **Queue-Based Processing**: Worker instances can scale independently
- **Database Connection Pooling**: Efficient connection management

### Performance Optimization
- **Redis Caching**: Frequently accessed data cached in memory
- **CDN-Ready**: Edge service optimized for CDN deployment
- **Connection Pooling**: Efficient database connection management
- **Streaming**: Zero-copy content delivery

### Monitoring & Observability
- **Health Endpoints**: Service availability monitoring (/api/health, /health)
- **Metrics Collection**: Performance and usage statistics
- **Error Tracking**: Comprehensive error logging with Pino
- **Resource Monitoring**: Built into DigitalOcean App Platform

## Deployment Architecture - ✅ IMPLEMENTED

### Container Strategy
```dockerfile
# All services containerized (IMPLEMENTED)
frontend/Dockerfile    - Next.js production build
backend/Dockerfile     - Node.js API server  
worker/Dockerfile      - FFmpeg processing container
edge/Dockerfile        - Content delivery service
```

### Infrastructure as Code - ✅ IMPLEMENTED
```yaml
# DigitalOcean App Platform configuration (do-app-production.yaml)
services:
  - name: frontend (Next.js, port 3001, 2 instances)
  - name: backend (Fastify, port 3000, 2 instances) 
  - name: worker (Node.js processing, 2 instances)
  - name: edge (Content delivery, port 8080, 3 instances)

databases:
  - name: mam-db (PostgreSQL 14, production tier)
  - name: mam-redis (Redis 7, production tier)

domains:
  - Primary domain with managed certificates
  - API subdomain routing
  - Edge subdomain for content delivery

alerts:
  - CPU utilization monitoring (>80%)
  - Memory utilization alerts (>85%)
  - Restart count tracking
```

### Environment Management - ✅ IMPLEMENTED
- **Development**: Local setup with .env.example files for each service
- **Production**: DigitalOcean App Platform with secure environment variables
- **Configuration**: Centralized env management with validation

## Implementation Status Summary

### ✅ Fully Implemented and Production-Ready

**All 4 Services Operational**:
- Frontend (Next.js 15.5.2) with complete MAM UI
- Backend (Fastify 4.28.1) with full API and auth system  
- Worker (Node.js) with GPU-accelerated media processing
- Edge (Fastify) with HMAC-secured content delivery

**Complete Data Layer**:
- PostgreSQL database with full schema and migrations
- Redis caching and job queue with streams
- Wasabi S3 three-bucket architecture (Staging/Masters/Previews)

**Production Infrastructure**:
- DigitalOcean App Platform deployment configuration
- Health monitoring and auto-scaling
- Comprehensive security implementation
- Complete testing coverage

**Authentication & Security**:
- JWT-based authentication with refresh token rotation
- Argon2 password hashing with strength validation
- HMAC-signed URLs for secure content delivery
- Rate limiting and abuse protection

**Media Processing Pipeline**:
- GPU-accelerated FFmpeg with NVENC
- HLS generation with multiple quality variants
- Redis Streams job queue with consumer groups
- Error handling and retry logic

### Current Development Focus
- **Phase 1**: Local development environment setup and verification
- **Next Phase**: User experience enhancements and performance optimization

## Future Architecture Enhancements

### Planned Improvements
- **Message Broker**: Apache Kafka for high-volume event streaming
- **Search Engine**: Elasticsearch for advanced metadata search
- **CDN Integration**: CloudFlare or AWS CloudFront for global delivery
- **Microservice Mesh**: Service mesh for enhanced inter-service communication

### Scalability Roadmap
- **Multi-Region Deployment**: Geographic distribution for global users
- **Auto-Scaling**: Dynamic resource allocation based on load
- **Database Sharding**: Horizontal database partitioning
- **Caching Layer**: Advanced caching strategies with invalidation

This architecture provides a solid foundation for a professional media asset management platform with clear upgrade paths for future growth and enhanced capabilities. All Phase 0 components are fully implemented and production-ready.