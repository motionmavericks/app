# MotionMavericks Deployment Guide

This guide provides step-by-step instructions for deploying the MotionMavericks application to DigitalOcean App Platform.

## Prerequisites

1. **DigitalOcean Account**: Active account with billing configured
2. **DigitalOcean CLI (doctl)**: Installed and authenticated
3. **GitHub Secrets**: Configure the following secrets in your GitHub repository:
   - `DO_ACCESS_TOKEN`: DigitalOcean API token

## Deployment Process

### Step 1: Prepare the Environment

1. **Authenticate with DigitalOcean**:
   ```bash
   doctl auth init
   ```

2. **Verify authentication**:
   ```bash
   doctl account get
   ```

### Step 2: Set up External Services

#### Create Managed PostgreSQL Database
```bash
# Create a managed PostgreSQL database
doctl databases create motionmav-db --engine pg --version 16 --size db-s-1vcpu-1gb --region syd1
```

#### Create Managed Redis (Valkey)
```bash
# Create a managed Redis database
doctl databases create motionmav-redis --engine redis --version 6 --size db-s-1vcpu-1gb --region syd1
```

### Step 3: Deploy the Application

1. **Push to main branch to trigger CI/CD**:
   ```bash
   git push origin main
   ```

2. **Monitor the build process**:
   - GitHub Actions will automatically build and push Docker images to DOCR
   - Once build is complete, deployment will trigger automatically

3. **Alternatively, deploy manually**:
   ```bash
   # Create the app from spec
   doctl apps create --spec deploy/do-app.yaml --wait
   
   # Or update existing app
   APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}')
   doctl apps update $APP_ID --spec deploy/do-app.yaml --wait
   ```

### Step 4: Configure Secrets

#### Set Database Connection
The PostgreSQL connection will be automatically injected by DigitalOcean when you add the database to your app.

#### Set Redis Connection
```bash
# Get Redis connection string
REDIS_URL=$(doctl databases connection motionmav-redis --format DSN --no-header)
export REDIS_URL

# Set Redis URL for the app
bash scripts/do_app_set_redis.sh
```

#### Set Wasabi Credentials
```bash
# Set your Wasabi credentials
export AWS_ACCESS_KEY_ID="your-wasabi-access-key"
export AWS_SECRET_ACCESS_KEY="your-wasabi-secret-key"
export STAGING_BUCKET="mm-staging-au"
export MASTERS_BUCKET="mm-masters-au"
export PREVIEWS_BUCKET="mm-previews-au"

# Configure Wasabi secrets
bash scripts/do_app_set_secrets.sh
```

#### Set Edge Signing Key
```bash
# Generate a random signing key
EDGE_SIGNING_KEY=$(openssl rand -hex 32)

# Set via DigitalOcean console or update the app spec manually
```

### Step 5: Verify Deployment

1. **Check app status**:
   ```bash
   doctl apps list
   ```

2. **View logs**:
   ```bash
   APP_ID=$(doctl apps list --no-header --format ID,Spec.Name | awk '$2=="motionmavericks"{print $1}')
   
   # Backend logs
   doctl apps logs $APP_ID backend --type deploy --tail 100
   doctl apps logs $APP_ID backend --type run --tail 100
   
   # Worker logs
   doctl apps logs $APP_ID preview-worker --type run --tail 100
   
   # Frontend logs
   doctl apps logs $APP_ID frontend --type deploy --tail 100
   ```

3. **Test endpoints**:
   ```bash
   # Get app URL
   APP_URL=$(doctl apps get $APP_ID --format DefaultIngress --no-header)
   
   # Test health endpoint
   curl https://$APP_URL/api/health
   
   # Test frontend
   curl https://$APP_URL/
   ```

## Troubleshooting

### Common Issues

1. **Build failures**: Check GitHub Actions logs for build errors
2. **Authentication errors**: Verify doctl is properly authenticated
3. **Secret configuration**: Use the provided scripts to set secrets safely
4. **Database connections**: Ensure managed databases are created and connected

### Monitoring

1. **Application logs**: Use `doctl apps logs` to view service logs
2. **Database logs**: Monitor database performance in DO console
3. **GitHub Actions**: Check workflow status for CI/CD issues

## Maintenance

### Updates

1. Push changes to main branch to trigger automatic deployment
2. Monitor deployment logs for any issues
3. Verify services are healthy after updates

### Scaling

Adjust instance counts and sizes in `deploy/do-app.yaml` as needed:

```yaml
services:
  - name: backend
    instance_count: 2  # Scale horizontally
    instance_size_slug: basic-xs  # Scale vertically
```

### Backup and Recovery

- PostgreSQL: Automated backups are enabled by default
- Redis: Consider data persistence settings
- Application data: Stored in Wasabi buckets

## Security Considerations

1. **Secrets Management**: Never commit secrets to git
2. **Network Security**: Use VPC and firewall rules
3. **Access Control**: Limit API access with proper authentication
4. **SSL/TLS**: Enabled by default on App Platform

## Support

For issues related to:
- **Application code**: Check repository issues
- **Deployment**: Review this guide and logs
- **DigitalOcean services**: Consult DO documentation

