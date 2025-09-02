# Media Asset Management System - Deployment Guide

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Preview       │
│   Next.js 15    │────│   Fastify       │────│   Worker        │
│   Port 3001     │    │   Port 3000     │    │   GPU/CPU       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Edge Service  │    │   PostgreSQL    │    │   Redis         │
│   Port 8080     │    │   Database      │    │   Streams       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Wasabi S3 Storage                        │
│   Staging → Masters → Previews                             │
└─────────────────────────────────────────────────────────────┘
```

## Infrastructure Requirements

### Compute Resources
- **Frontend**: 512MB RAM, 1 CPU core
- **Backend API**: 1GB RAM, 1 CPU core
- **Worker**: 2GB RAM, 2 CPU cores (GPU optional for acceleration)
- **Edge Service**: 512MB RAM, 1 CPU core

### Storage & Databases
- **PostgreSQL**: 20GB storage, 2GB RAM
- **Redis**: 1GB RAM, 512MB storage
- **Wasabi S3**: Unlimited storage (pay per use)

### Network
- **Frontend**: HTTPS on port 443
- **Backend**: HTTP on port 3000 (internal)
- **Edge**: HTTP on port 8080 (internal)
- **Worker**: Redis connection only

## Step-by-Step Deployment Guide

### Phase 1: Infrastructure Setup

1. **Database Setup**
   ```bash
   # Initialize PostgreSQL database
   ./init-db.sh
   
   # Run migrations
   make backend-migrate
   ```

2. **Redis Setup**
   ```bash
   # Start Redis server
   redis-server --appendonly yes
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp worker/.env.example worker/.env
   cp edge/.env.example edge/.env
   
   # Generate secure secrets
   ./generate-secrets.sh
   ```

### Phase 2: Service Deployment

1. **Backend API**
   ```bash
   make backend-install
   make backend-build
   make backend-migrate
   make backend-dev  # or production start
   ```

2. **Preview Worker**
   ```bash
   make worker-install
   make worker-build
   make worker-dev  # or production start
   ```

3. **Edge Service**
   ```bash
   make edge-install
   make edge-build
   make edge-dev  # or production start
   ```

4. **Frontend**
   ```bash
   make install
   make build
   make dev  # or production start
   ```

### Phase 3: Validation

1. **Health Checks**
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:8080/health
   curl http://localhost:3001/api/health
   ```

2. **Database Connectivity**
   ```bash
   # Check database tables
   psql -d mam -c "\dt"
   ```

3. **S3 Connectivity**
   ```bash
   # Test bucket access
   aws s3 ls s3://your-staging-bucket/
   ```

## Post-Deployment Checklist

### Security
- [ ] JWT secrets are randomly generated and secure
- [ ] HTTPS is enabled for all external endpoints
- [ ] Database credentials are secure
- [ ] S3 bucket policies are restrictive
- [ ] Rate limiting is configured
- [ ] CORS is properly configured

### Functionality
- [ ] User registration/login works
- [ ] File upload generates presigned URLs
- [ ] Asset promotion copies to masters
- [ ] Preview generation creates HLS streams
- [ ] Edge service serves signed URLs
- [ ] Role-based access control works

### Performance
- [ ] Database queries are optimized
- [ ] Redis caching is working
- [ ] CDN is configured (if applicable)
- [ ] GPU acceleration is enabled (worker)
- [ ] Compression is enabled

### Monitoring
- [ ] Health endpoints are accessible
- [ ] Logs are being collected
- [ ] Error tracking is configured
- [ ] Performance metrics are available
- [ ] Backup procedures are in place

## Monitoring Setup

### Health Endpoints
- **Backend**: `GET /api/health`
- **Edge**: `GET /health`
- **Frontend**: `GET /api/health`

### Key Metrics to Monitor
- API response times
- Database connection pool usage
- Redis memory usage
- S3 upload/download rates
- Preview generation queue length
- User authentication success/failure rates

### Log Aggregation
```bash
# Centralized logging recommended
# Use tools like ELK stack, Grafana, or cloud logging
```

### Alerting
- Database connection failures
- S3 access errors
- High memory usage
- Long preview generation times
- Authentication failures

## Rollback Procedures

### Database Rollback
```bash
./rollback-db.sh
```

### Service Rollback
1. Stop all services
2. Restore previous code version
3. Rebuild services
4. Restart in reverse order (worker → edge → backend → frontend)

## Production Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<secure-random-secret>
COOKIE_SECRET=<secure-random-secret>
DATABASE_URL=postgresql://user:password@host:5432/mam
REDIS_URL=redis://host:6379
WASABI_ENDPOINT=https://s3.wasabisys.com
WASABI_REGION=us-east-1
STAGING_BUCKET=mam-staging-prod
MASTERS_BUCKET=mam-masters-prod
PREVIEWS_BUCKET=mam-previews-prod
```

### Frontend (.env)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Worker (.env)
```env
NODE_ENV=production
REDIS_URL=redis://host:6379
ENABLE_GPU=true
```

### Edge (.env)
```env
NODE_ENV=production
PORT=8080
EDGE_SIGNING_KEY=<secure-random-key>
PREVIEWS_BUCKET=mam-previews-prod
```

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check DATABASE_URL and network connectivity
2. **Redis connection errors**: Verify Redis server is running and accessible
3. **S3 access errors**: Validate AWS credentials and bucket permissions
4. **Preview generation failures**: Check worker logs and GPU/CPU resources
5. **Authentication issues**: Verify JWT secrets match across services

### Debug Commands
```bash
# Check service status
docker ps
systemctl status <service>

# View logs
tail -f /var/log/mam-backend.log
tail -f /var/log/mam-worker.log

# Test database connectivity
psql -d $DATABASE_URL -c "SELECT 1"

# Test Redis connectivity
redis-cli ping
```

## Scaling Considerations

### Horizontal Scaling
- Backend API: Multiple instances behind load balancer
- Worker: Multiple workers for parallel processing
- Edge Service: Geographic distribution recommended

### Database Scaling
- Read replicas for analytics queries
- Connection pooling optimization
- Query optimization and indexing

### Storage Scaling
- S3 is inherently scalable
- Consider CDN for preview delivery
- Implement lifecycle policies for cost optimization

---

**Deployment Status**: Ready for Production
**Last Updated**: September 2, 2025
**Version**: 1.0.0
