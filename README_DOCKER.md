# Docker Deployment Guide

This guide explains how to deploy the Hyper AI Agent backend using Docker.

## Quick Start

### 1. Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 2GB of free disk space

### 2. Setup Environment Variables

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

**Required variables**:
- `OPENAI_API_KEY` - Your OpenAI API key
- `SECRET_KEY` - Generate with: `openssl rand -hex 32`

### 3. Build and Run

```bash
# Build and start the backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check status
docker-compose ps
```

The backend will be available at `http://localhost:18000`

### 4. Test the API

```bash
# Health check
curl http://localhost:18000/health

# API documentation
open http://localhost:18000/docs
```

## Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Maintenance

```bash
# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Remove all containers and volumes
docker-compose down -v

# Clean up Docker system
docker system prune -a
```

## Production Deployment

### Option 1: Docker Compose (Simple)

1. **Update environment variables**:
```bash
# Use production values in .env
SECRET_KEY=<generate-secure-key>
CORS_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@postgres:5432/db
```

2. **Enable PostgreSQL** (recommended for production):
```yaml
# Uncomment postgres service in docker-compose.yml
```

3. **Add SSL/TLS**:
```yaml
# Uncomment nginx service in docker-compose.yml
# Add SSL certificates to ./ssl directory
```

4. **Deploy**:
```bash
docker-compose -f docker-compose.yml up -d
```

### Option 2: Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Click "Deploy on Railway"
2. Add environment variables
3. Deploy automatically

### Option 3: Render

1. Create new Web Service
2. Connect your GitHub repository
3. Set build command: `docker build -t backend .`
4. Set start command: `docker run -p 18000:18000 backend`
5. Add environment variables

### Option 4: AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t hyper-ai-agent-backend .
docker tag hyper-ai-agent-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hyper-ai-agent-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hyper-ai-agent-backend:latest

# Create ECS task definition and service
aws ecs create-task-definition --cli-input-json file://ecs-task-definition.json
aws ecs create-service --cluster my-cluster --service-name hyper-ai-agent --task-definition hyper-ai-agent-backend
```

### Option 5: Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/hyper-ai-agent-backend

# Deploy to Cloud Run
gcloud run deploy hyper-ai-agent-backend \
  --image gcr.io/PROJECT-ID/hyper-ai-agent-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "OPENAI_API_KEY=sk-xxx,SECRET_KEY=xxx"
```

## Configuration

### Database Options

#### SQLite (Default)
```yaml
DATABASE_URL=sqlite:///data/hyper_ai_agent.db
```
- ✅ Simple setup
- ✅ No additional services
- ❌ Not suitable for high traffic

#### PostgreSQL (Recommended for Production)
```yaml
DATABASE_URL=postgresql://user:password@postgres:5432/hyper_ai_agent
```
- ✅ Better performance
- ✅ Concurrent connections
- ✅ ACID compliance

### Storage Options

#### Local Storage (Default)
```yaml
STORAGE_TYPE=local
STORAGE_PATH=/app/data/uploads
```

#### S3-Compatible Storage
```yaml
STORAGE_TYPE=s3
S3_BUCKET=your-bucket
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
```

### Caching (Optional)

Add Redis for better performance:

```yaml
# Uncomment redis service in docker-compose.yml
REDIS_URL=redis://redis:6379/0
```

## Monitoring

### Health Checks

```bash
# Docker health check
docker inspect --format='{{.State.Health.Status}}' hyper-ai-agent-backend

# Manual health check
curl http://localhost:18000/health
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100 backend

# Save logs to file
docker-compose logs backend > backend.log
```

### Metrics

Add Prometheus monitoring:

```yaml
# docker-compose.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"
```

## Backup and Restore

### Backup Data

```bash
# Backup SQLite database
docker-compose exec backend cp /app/data/hyper_ai_agent.db /app/data/backup.db
docker cp hyper-ai-agent-backend:/app/data/backup.db ./backup.db

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U hyper_user hyper_ai_agent > backup.sql
```

### Restore Data

```bash
# Restore SQLite
docker cp ./backup.db hyper-ai-agent-backend:/app/data/hyper_ai_agent.db
docker-compose restart backend

# Restore PostgreSQL
docker-compose exec -T postgres psql -U hyper_user hyper_ai_agent < backup.sql
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
lsof -i :18000  # Linux/Mac
netstat -ano | findstr :18000  # Windows

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors

```bash
# Check database container
docker-compose ps postgres

# Test database connection
docker-compose exec backend python -c "from src.core.database import engine; print(engine)"
```

### Permission errors

```bash
# Fix data directory permissions
sudo chown -R 1000:1000 ./data

# Or run with user flag
docker-compose run --user $(id -u):$(id -g) backend
```

### Out of memory

```bash
# Increase Docker memory limit
# Docker Desktop -> Settings -> Resources -> Memory

# Or add to docker-compose.yml
services:
  backend:
    mem_limit: 2g
    memswap_limit: 2g
```

## Security Best Practices

1. **Use strong secrets**:
```bash
# Generate secure SECRET_KEY
openssl rand -hex 32
```

2. **Don't commit .env file**:
```bash
# Add to .gitignore
.env
```

3. **Use HTTPS in production**:
```yaml
# Add nginx with SSL
# Use Let's Encrypt for free certificates
```

4. **Limit CORS origins**:
```yaml
CORS_ORIGINS=https://yourdomain.com
```

5. **Enable rate limiting**:
```yaml
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
```

6. **Regular updates**:
```bash
# Update base image
docker-compose pull
docker-compose up -d
```

## Performance Tuning

### Optimize Docker Image

```dockerfile
# Use multi-stage build (already implemented)
# Minimize layers
# Use .dockerignore
```

### Database Optimization

```yaml
# PostgreSQL tuning
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
POSTGRES_MAX_CONNECTIONS=100
```

### Caching

```yaml
# Enable Redis caching
REDIS_URL=redis://redis:6379/0
CACHE_TTL=3600
```

## Mobile App Configuration

### Android/iOS Setup

Update your mobile app to connect to the Docker backend:

```typescript
// config.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:18000'  // Development
  : 'https://api.yourdomain.com';  // Production

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});
```

### CORS Configuration

Ensure your domain is in CORS_ORIGINS:

```yaml
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## Support

- GitHub Issues: https://github.com/yourusername/hyper-ai-agent/issues
- Documentation: https://docs.yourdomain.com
- Discord: https://discord.gg/yourserver
