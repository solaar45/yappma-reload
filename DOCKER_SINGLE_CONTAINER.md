# Single Container Deployment Guide

## Overview

YAPPMA Reload kann als **Single Container** deployed werden, bei dem Backend (Phoenix) und Frontend (React/Nginx) in einem Container laufen. Dies vereinfacht das Deployment erheblich.

## Vorteile des Single-Container-Setups

✅ **Einfacheres Deployment** - Nur 2 Container statt 3 (App + PostgreSQL)
✅ **Weniger Netzwerk-Overhead** - Backend und Frontend im selben Container
✅ **Einfachere Konfiguration** - Weniger Container zu managen
✅ **Ideal für Unraid** - Einfaches Setup mit nur 2 Containern
✅ **Automatische Migrations** - Werden beim Start ausgeführt
✅ **Supervisor-managed** - Beide Services werden überwacht und neu gestartet

## Architektur

```
┌────────────────────────────────────┐
│          YAPPMA Container              │
│  ┌──────────────────────────────┐  │
│  │  Supervisor (Process Mgmt)  │  │
│  └───────────┬──────────────────┘  │
│            │                        │
│  ┌─────────┴─────────┐            │
│  │   Nginx :8080    │            │
│  │  (Frontend SPA)  │            │
│  │                  │            │
│  │  Proxies /api →  │            │
│  └────────┬─────────┘            │
│           │                       │
│           ▼                       │
│  ┌───────────────────┐            │
│  │ Phoenix :4000    │            │
│  │ (Backend API)    │            │
│  └───────────────────┘            │
└───────────┬────────────────────────┘
            │ :5432
            ▼
  ┌────────────────────────┐
  │   PostgreSQL DB      │
  │  (Separate Container)│
  └────────────────────────┘
```

## Quick Start

### 1. Mit Docker Compose

```bash
# Clone repository
git clone https://github.com/solaar45/yappma-reload.git
cd yappma-reload

# Environment konfigurieren
cp .env.example .env
nano .env

# Secret Key generieren
docker run --rm hexpm/elixir:1.16.0-erlang-26.2.1-alpine-3.18.4 \
  sh -c "mix local.hex --force && mix phx.gen.secret"
# Kopiere den Output nach SECRET_KEY_BASE in .env

# Starten
docker-compose -f docker-compose.single.yml up -d

# App öffnen
open http://localhost:8080
```

### 2. Manuell (nur Container)

```bash
# Build Image
docker build -t yappma-app:latest .

# PostgreSQL starten
docker run -d \
  --name yappma-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=wealth_backend_prod \
  -v yappma_postgres:/var/lib/postgresql/data \
  postgres:16-alpine

# App starten
docker run -d \
  --name yappma-app \
  --link yappma-postgres:postgres \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e DB_HOSTNAME=postgres \
  -e DB_DATABASE=wealth_backend_prod \
  -e SECRET_KEY_BASE=your_secret_key \
  -e PHOENIX_HOST=localhost \
  -e ALPHA_VANTAGE_API_KEY=your_api_key \
  -p 8080:8080 \
  -p 4000:4000 \
  yappma-app:latest
```

## Environment Variablen

### Erforderlich

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_HOSTNAME=postgres
DB_DATABASE=wealth_backend_prod

# Phoenix Secret (64+ Zeichen)
SECRET_KEY_BASE=your_64_char_secret_key

# Host
PHOENIX_HOST=your-domain.com
```

### Optional

```bash
# Alpha Vantage für Security Enrichment
ALPHA_VANTAGE_API_KEY=your_api_key

# LogoKit für Institution Logos
VITE_LOGOKIT_TOKEN=pk_...
VITE_LOGO_DEV_TOKEN=pk_...
```

## Unraid Deployment

### Option 1: Docker Compose User Scripts

1. **Docker Compose Manager Plugin installieren**
2. **Files kopieren:**
   ```bash
   scp docker-compose.single.yml root@unraid:/mnt/user/appdata/yappma/
   scp .env root@unraid:/mnt/user/appdata/yappma/
   ```
3. **User Script erstellen:**
   ```bash
   #!/bin/bash
   cd /mnt/user/appdata/yappma
   docker-compose -f docker-compose.single.yml up -d
   ```

### Option 2: Unraid Template (Einfachste Methode)

**PostgreSQL Container:**
```bash
Repository: postgres:16-alpine
Network: Custom: yappma
Port: 5432

Variables:
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=wealth_backend_prod

Paths:
/var/lib/postgresql/data → /mnt/user/appdata/yappma/postgres
```

**YAPPMA App Container:**
```bash
Repository: solaar45/yappma-app:latest
Network: Custom: yappma
Extra Parameters: --link yappma-postgres:postgres
Ports:
8080 → 8080 (WebUI)
4000 → 4000 (API - optional)

Variables:
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_HOSTNAME=postgres
DB_DATABASE=wealth_backend_prod
SECRET_KEY_BASE=your_secret_key
PHOENIX_HOST=unraid.local
ALPHA_VANTAGE_API_KEY=your_api_key (optional)
```

## Docker Hub Push

```bash
# Build
docker build -t solaar45/yappma-app:latest .

# Tag mit Version
docker tag solaar45/yappma-app:latest solaar45/yappma-app:1.0.0

# Login
docker login

# Push
docker push solaar45/yappma-app:latest
docker push solaar45/yappma-app:1.0.0
```

### Automatisches Script

```bash
#!/bin/bash
VERSION="1.0.0"

# Build
docker build -t solaar45/yappma-app:latest .

# Tag
docker tag solaar45/yappma-app:latest solaar45/yappma-app:$VERSION

# Push
docker push solaar45/yappma-app:latest
docker push solaar45/yappma-app:$VERSION

echo "✅ Deployed: solaar45/yappma-app:$VERSION"
```

## Logs & Debugging

### Logs anzeigen

```bash
# Alle Logs
docker logs -f yappma-app

# Nur Backend
docker exec yappma-app tail -f /var/log/supervisor/backend.log

# Nur Nginx
docker exec yappma-app tail -f /var/log/supervisor/nginx.log

# Supervisor
docker exec yappma-app tail -f /var/log/supervisor/supervisord.log
```

### In Container einsteigen

```bash
# Shell öffnen
docker exec -it yappma-app /bin/bash

# Prozesse prüfen
docker exec yappma-app supervisorctl status

# Backend neu starten
docker exec yappma-app supervisorctl restart backend

# Nginx neu starten
docker exec yappma-app supervisorctl restart nginx
```

### Health Check

```bash
# Container Health
docker inspect yappma-app | grep Health -A 10

# Frontend Health
curl http://localhost:8080/health

# Backend API Health
curl http://localhost:4000/api/health
```

## Troubleshooting

### Backend startet nicht

```bash
# Logs prüfen
docker logs yappma-app

# Database connection testen
docker exec yappma-app /app/backend/bin/wealth_backend rpc "1 + 1"

# Migrations manuell ausführen
docker exec yappma-app /app/backend/bin/wealth_backend eval "WealthBackend.Release.migrate"
```

### Nginx 502 Bad Gateway

```bash
# Prüfen ob Backend läuft
docker exec yappma-app supervisorctl status backend

# Backend neu starten
docker exec yappma-app supervisorctl restart backend

# Logs prüfen
docker exec yappma-app tail -f /var/log/supervisor/backend_error.log
```

### Container startet nicht

```bash
# Detaillierte Logs
docker logs yappma-app --tail 100

# Prüfen ob PostgreSQL läuft
docker ps | grep postgres

# Network prüfen
docker network inspect yappma-network
```

## Updates

### Image aktualisieren

```bash
# Stop container
docker-compose -f docker-compose.single.yml down

# Pull latest
docker pull solaar45/yappma-app:latest

# Start mit neuem Image
docker-compose -f docker-compose.single.yml up -d

# Migrations laufen automatisch beim Start
```

## Backup & Restore

### Database Backup

```bash
# Backup erstellen
docker exec yappma-postgres pg_dump -U postgres wealth_backend_prod \
  | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup-20260110.sql.gz | \
  docker exec -i yappma-postgres psql -U postgres wealth_backend_prod
```

## Performance & Resources

**Empfohlene Ressourcen:**
- CPU: 1-2 Cores
- RAM: 1-2 GB
- Disk: 5 GB

**Resource Limits setzen:**

```yaml
# docker-compose.single.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Vergleich: Single vs. Multi-Container

| Feature | Single Container | Multi-Container |
|---------|------------------|------------------|
| Anzahl Container | 2 (App + DB) | 3 (Frontend + Backend + DB) |
| Setup-Komplexität | Einfach | Mittel |
| Skalierbarkeit | Begrenzt | Hoch |
| Unraid-Freundlich | ✅ Sehr | ⚠️ Mittel |
| Updates | Einfach | Komplex |
| Debugging | Mittel | Einfach |
| Resource Usage | Niedrig | Mittel |

**Empfehlung:**
- **Single Container:** Für Unraid, Home Server, einfache Deployments
- **Multi-Container:** Für Kubernetes, Cloud Deployments, hohe Verfügbarkeit

## Support

- Dokumentation: [README.md](./README.md)
- Docker Multi-Container: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
- Environment Setup: [ENV_SETUP.md](./ENV_SETUP.md)
- Issues: [GitHub Issues](https://github.com/solaar45/yappma-reload/issues)
