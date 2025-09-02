# Local Development Setup Guide

## Prerequisites

This application requires PostgreSQL and Redis to be installed and running locally. 

### Required Services

1. **PostgreSQL 16+**
   - Port: 5432
   - Database: motionmavericks
   - User: postgres
   - Password: postgres

2. **Redis 7+**
   - Port: 6379
   - No authentication required for local development

## Installation Options

### Option 1: System Package Manager (Recommended)

#### Ubuntu/Debian
```bash
# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Start services
sudo systemctl start postgresql
sudo systemctl start redis-server

# Enable auto-start
sudo systemctl enable postgresql
sudo systemctl enable redis-server
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@16
brew install redis

# Start services
brew services start postgresql@16
brew services start redis
```

### Option 2: Docker (Alternative)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: motionmavericks
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Then run:
```bash
docker-compose up -d
```

### Option 3: Cloud Services (Development)

You can also use cloud-managed databases for development:

1. **DigitalOcean Managed Databases**
   - Create PostgreSQL and Redis instances via DigitalOcean
   - Update `.env` files with connection strings

2. **Supabase (PostgreSQL)**
   - Free tier available at https://supabase.com
   - Update `POSTGRES_URL` in backend/.env

3. **Upstash (Redis)**
   - Free tier available at https://upstash.com
   - Update `REDIS_URL` in backend/.env and worker/.env

## Post-Installation Setup

Once PostgreSQL and Redis are installed and running:

### 1. Verify Services

```bash
# Check PostgreSQL
pg_isready -h localhost -p 5432

# Check Redis
redis-cli ping
# Should return: PONG
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE motionmavericks;
\q
```

### 3. Initialize Database Schema

```bash
# Run migrations
make backend-migrate

# Or manually
cd backend
npm run migrate
```

### 4. Verify Environment Files

Ensure these files exist with correct settings:
- `backend/.env` - Database and Redis URLs
- `worker/.env` - Redis URL for queue processing
- `edge/.env` - Edge service configuration
- `frontend/.env` - API endpoints

### 5. Start All Services

```bash
# Terminal 1: Backend API
make backend-dev

# Terminal 2: Worker
make worker-dev

# Terminal 3: Edge Service
make edge-dev

# Terminal 4: Frontend
make dev
```

### 6. Verify Health

```bash
# Check backend health
curl http://localhost:3000/api/health

# Check edge service
curl http://localhost:8080/health

# Access frontend
open http://localhost:3001
```

## Troubleshooting

### PostgreSQL Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check PostgreSQL logs: `sudo journalctl -u postgresql`
- Verify authentication: Check `/etc/postgresql/*/main/pg_hba.conf`

### Redis Connection Issues
- Ensure Redis is running: `sudo systemctl status redis`
- Check Redis logs: `sudo journalctl -u redis`
- Test connection: `redis-cli ping`

### Port Conflicts
- PostgreSQL default: 5432
- Redis default: 6379
- Backend API: 3000
- Edge service: 8080
- Frontend: 3001

If ports are in use, update the `.env` files accordingly.

## Next Steps

After services are running:
1. Run the full test suite: `make test`
2. Run linting: `make lint`
3. Check type safety: `make typecheck`
4. Review the application at http://localhost:3001