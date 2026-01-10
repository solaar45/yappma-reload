# Docker Deployment Guide

## Overview

YAPPMA Reload is fully containerized and ready for deployment on Docker, Docker Compose, Unraid, and other container platforms.

## Architecture

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ :8080
       ▼
┌─────────────────────┐
│   Frontend (Nginx)  │
│  React SPA + Proxy  │
└──────┬──────────────┘
       │ /api → :4000
       ▼
┌─────────────────────┐
│  Backend (Phoenix)  │
│    Elixir API       │
└──────┬──────────────┘
       │ :5432
       ▼
┌─────────────────────┐
│  PostgreSQL DB      │
│   Persistent Data   │
└─────────────────────┘
```

## Quick Start

### Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- 2GB RAM minimum
- 5GB disk space

### Deploy with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/solaar45/yappma-reload.git
cd yappma-reload

# 2. Create production environment file
cp .env.example .env.production
nano .env.production

# 3. Generate secret key
docker run --rm hexpm/elixir:1.16.0-erlang-26.2.1-alpine-3.18.4 \
  sh -c "mix local.hex --force && mix phx.gen.secret"
# Copy output to SECRET_KEY_BASE in .env.production

# 4. Build and start services
docker-compose --env-file .env.production up -d

# 5. Run database migrations
docker-compose exec backend bin/wealth_backend eval "WealthBackend.Release.migrate"

# 6. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:4000
```

## Environment Variables

### Required Variables

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password_here
DB_DATABASE=wealth_backend_prod

# Phoenix Secret (Generate with: mix phx.gen.secret)
SECRET_KEY_BASE=your_64_char_secret_key_base_here

# Host
PHOENIX_HOST=your-domain.com
```

### Optional Variables

```bash
# Alpha Vantage API Key (for security enrichment)
ALPHA_VANTAGE_API_KEY=your_api_key

# LogoKit Tokens (for institution logos)
VITE_LOGOKIT_TOKEN=pk_fr3eaf6b62564040820446
VITE_LOGO_DEV_TOKEN=pk_MxkTMUHkT1GN-nvJPuL8PQ
```

## Building Images

### Build All Images

```bash
# Build with docker-compose
docker-compose build

# Or build individually
docker build -t yappma-backend:latest ./backend
docker build -t yappma-frontend:latest ./frontend
```

### Multi-Architecture Build (ARM64 + AMD64)

```bash
# Setup buildx (one time)
docker buildx create --name multiarch --use

# Build and push multi-arch images
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t solaar45/yappma-backend:latest \
  --push \
  ./backend

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t solaar45/yappma-frontend:latest \
  --push \
  ./frontend
```

## Docker Hub Deployment

### 1. Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

### 2. Tag Images

```bash
# Tag backend
docker tag yappma-backend:latest solaar45/yappma-backend:latest
docker tag yappma-backend:latest solaar45/yappma-backend:1.0.0

# Tag frontend
docker tag yappma-frontend:latest solaar45/yappma-frontend:latest
docker tag yappma-frontend:latest solaar45/yappma-frontend:1.0.0
```

### 3. Push to Docker Hub

```bash
# Push backend
docker push solaar45/yappma-backend:latest
docker push solaar45/yappma-backend:1.0.0

# Push frontend
docker push solaar45/yappma-frontend:latest
docker push solaar45/yappma-frontend:1.0.0
```

### 4. All-in-One Script

```bash
#!/bin/bash
# deploy-dockerhub.sh

VERSION="1.0.0"

echo "Building images..."
docker-compose build

echo "Tagging images..."
docker tag yappma-backend:latest solaar45/yappma-backend:latest
docker tag yappma-backend:latest solaar45/yappma-backend:$VERSION
docker tag yappma-frontend:latest solaar45/yappma-frontend:latest
docker tag yappma-frontend:latest solaar45/yappma-frontend:$VERSION

echo "Pushing to Docker Hub..."
docker push solaar45/yappma-backend:latest
docker push solaar45/yappma-backend:$VERSION
docker push solaar45/yappma-frontend:latest
docker push solaar45/yappma-frontend:$VERSION

echo "✅ Deployment complete!"
echo "Backend: solaar45/yappma-backend:$VERSION"
echo "Frontend: solaar45/yappma-frontend:$VERSION"
```

## Unraid Deployment

### Option 1: Docker Compose User Scripts Plugin

1. **Install Plugins:**
   - User Scripts
   - Docker Compose Manager

2. **Upload Files:**
   ```bash
   # Copy to Unraid
   scp docker-compose.yml root@unraid-server:/mnt/user/appdata/yappma/
   scp .env.production root@unraid-server:/mnt/user/appdata/yappma/.env
   ```

3. **Create User Script:**
   - Settings → User Scripts → Add New Script
   - Name: `yappma-start`
   - Script:
     ```bash
     #!/bin/bash
     cd /mnt/user/appdata/yappma
     docker-compose --env-file .env up -d
     ```

4. **Set to Run at Array Start**

### Option 2: Community Applications Template

Create Unraid template at `/boot/config/plugins/dockerMan/templates-user/yappma.xml`:

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>YAPPMA-Frontend</Name>
  <Repository>solaar45/yappma-frontend:latest</Repository>
  <Registry>https://hub.docker.com/r/solaar45/yappma-frontend</Registry>
  <Network>bridge</Network>
  <Privileged>false</Privileged>
  <Support>https://github.com/solaar45/yappma-reload/issues</Support>
  <Project>https://github.com/solaar45/yappma-reload</Project>
  <Overview>YAPPMA Reload - Portfolio Management Frontend</Overview>
  <Category>Tools:</Category>
  <WebUI>http://[IP]:[PORT:8080]</WebUI>
  <Icon>https://raw.githubusercontent.com/solaar45/yappma-reload/main/frontend/public/icon.png</Icon>
  <ExtraParams>--link yappma-backend:backend</ExtraParams>
  <Config Name="WebUI Port" Target="8080" Default="8080" Mode="tcp" Description="Frontend Port" Type="Port" Display="always" Required="true" Mask="false">8080</Config>
</Container>
```

### Option 3: Manual Docker Run

```bash
# 1. Create network
docker network create yappma-network

# 2. Start PostgreSQL
docker run -d \
  --name yappma-postgres \
  --network yappma-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=wealth_backend_prod \
  -v /mnt/user/appdata/yappma/postgres:/var/lib/postgresql/data \
  postgres:16-alpine

# 3. Start Backend
docker run -d \
  --name yappma-backend \
  --network yappma-network \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_HOSTNAME=yappma-postgres \
  -e DB_DATABASE=wealth_backend_prod \
  -e SECRET_KEY_BASE=your_secret_key \
  -e PHOENIX_HOST=your-domain.com \
  -p 4000:4000 \
  solaar45/yappma-backend:latest

# 4. Start Frontend
docker run -d \
  --name yappma-frontend \
  --network yappma-network \
  -p 8080:8080 \
  solaar45/yappma-frontend:latest
```

## Production Recommendations

### Reverse Proxy (Traefik/Nginx)

```yaml
# docker-compose.yml with Traefik
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.yappma.rule=Host(`yappma.yourdomain.com`)"
      - "traefik.http.routers.yappma.entrypoints=websecure"
      - "traefik.http.routers.yappma.tls.certresolver=letsencrypt"
```

### Backup Strategy

```bash
# Backup database
docker exec yappma-postgres pg_dump -U postgres wealth_backend_prod > backup.sql

# Backup volumes
docker run --rm \
  -v yappma_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data

# Automated backup script
#!/bin/bash
BACKUP_DIR="/mnt/user/backups/yappma"
mkdir -p $BACKUP_DIR

docker exec yappma-postgres pg_dump -U postgres wealth_backend_prod \
  | gzip > $BACKUP_DIR/yappma-$(date +%Y%m%d-%H%M%S).sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "yappma-*.sql.gz" -mtime +7 -delete
```

### Resource Limits

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Health Monitoring

```bash
# Check service health
docker-compose ps

# View logs
docker-compose logs -f

# Restart unhealthy service
docker-compose restart backend

# Health check script
#!/bin/bash
if ! docker exec yappma-backend bin/wealth_backend rpc "1 + 1" &>/dev/null; then
  echo "Backend unhealthy, restarting..."
  docker-compose restart backend
fi
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready
docker-compose logs postgres

# 2. Missing SECRET_KEY_BASE
echo $SECRET_KEY_BASE

# 3. Database migration needed
docker-compose exec backend bin/wealth_backend eval "WealthBackend.Release.migrate"
```

### Frontend 502 Bad Gateway

```bash
# Check if backend is accessible
docker-compose exec frontend wget -O- http://backend:4000

# Restart frontend
docker-compose restart frontend
```

### Database Connection Issues

```bash
# Test database connection
docker-compose exec backend \
  psql -h postgres -U postgres -d wealth_backend_prod -c "SELECT 1;"
```

## Updates

### Update Images

```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d

# Run migrations
docker-compose exec backend bin/wealth_backend eval "WealthBackend.Release.migrate"
```

## Development

For local development with hot reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Backend: http://localhost:4000
# Frontend: http://localhost:5173
```

## Support

- Documentation: [README.md](./README.md)
- Issues: [GitHub Issues](https://github.com/solaar45/yappma-reload/issues)
- Environment Setup: [ENV_SETUP.md](./ENV_SETUP.md)
