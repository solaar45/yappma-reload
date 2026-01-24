# Docker Deployment Guide

Dieses Dokument beschreibt das automatische Datenbank-Migrations-System für Docker-Deployments von YAPPMA.

## Übersicht

YAPPMA führt jetzt **automatisch Datenbank-Migrationen** beim Start des Backend-Containers aus. Dies stellt sicher, dass:

✅ Die Datenbank immer auf dem neuesten Schema-Stand ist  
✅ Keine manuellen Migrations-Befehle nach dem Deployment nötig sind  
✅ Updates nahtlos funktionieren (Pull → Rebuild → Restart)  
✅ Neue Features (wie Multi-User-Admin) sofort verfügbar sind  

## Wie funktioniert es?

### 1. Release-Modul

**Datei:** `backend/lib/wealth_backend/release.ex`

```elixir
defmodule WealthBackend.Release do
  def migrate do
    # Lädt die Anwendung
    # Führt alle ausstehenden Migrationen aus
  end
end
```

Dieses Modul:
- Funktioniert **ohne Mix** (production releases)
- Verwendet `Ecto.Migrator` direkt
- Führt alle Repos durch (aktuell nur eines)
- Ist idempotent (kann mehrfach ausgeführt werden)

### 2. Entrypoint-Script

**Datei:** `backend/docker-entrypoint.sh`

```bash
#!/bin/bash
# 1. Warte auf PostgreSQL
# 2. Führe Migrationen aus
# 3. Starte Backend
```

**Ablauf beim Container-Start:**

1. **PostgreSQL-Check:**
   ```bash
   while ! pg_isready -h postgres -U postgres; do sleep 1; done
   ```
   - Wartet bis PostgreSQL bereit ist
   - Verhindert "Connection refused"-Fehler
   - Timeout: unbegrenzt (container restart bei Problemen)

2. **Migrations-Ausführung:**
   ```bash
   bin/wealth_backend eval "WealthBackend.Release.migrate()"
   ```
   - Führt alle ausstehenden Migrationen aus
   - Bei Fehlern: Container stoppt (Fehler wird geloggt)
   - Erfolg: Fährt mit Start fort

3. **Application-Start:**
   ```bash
   exec bin/wealth_backend start
   ```
   - Startet Phoenix-Server
   - Nimmt Requests entgegen

### 3. Dockerfile-Integration

**Datei:** `backend/Dockerfile`

**Wichtige Änderungen:**

```dockerfile
# PostgreSQL-Client für pg_isready
RUN apk add --no-cache postgresql-client

# Entrypoint-Script kopieren
COPY --chown=app:app docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Als Entrypoint verwenden
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

## Deployment-Workflows

### Erste Installation

```bash
# 1. Repository clonen
git clone https://github.com/solaar45/yappma-reload.git
cd yappma-reload

# 2. Environment konfigurieren
cp .env.example .env
nano .env  # Secrets eintragen

# 3. Docker Compose starten
docker-compose up -d
```

**Was passiert:**
1. PostgreSQL-Container startet und erstellt Datenbank (`POSTGRES_DB`)
2. Backend-Container wartet auf PostgreSQL
3. Backend führt automatisch alle Migrationen aus:
   - Erstellt `users` Tabelle
   - Erstellt `institutions` Tabelle
   - Erstellt `accounts` Tabelle
   - ...
   - Führt Multi-User-Admin-Migration aus
4. Backend startet und ist bereit
5. Frontend baut und startet

**Logs prüfen:**
```bash
docker-compose logs backend
```

Erwartete Ausgabe:
```
🚀 Starting YAPPMA Backend...
⏳ Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready!
🔄 Running database migrations...
[info] == Running WealthBackend.Repo.Migrations.CreateUsers.change/0 forward
[info] == Migrated in 0.0s
...
✅ Migrations complete!
🎯 Starting application...
```

### Update auf neue Version

```bash
# 1. Neueste Änderungen holen
git pull origin main

# 2. Container neu bauen und starten
docker-compose up -d --build
```

**Was passiert:**
1. Neue Container werden gebaut
2. Backend startet mit Entrypoint-Script
3. Neue Migrationen werden automatisch ausgeführt
4. Backend startet mit neuen Features

**Keine manuellen Schritte nötig!**

### Multi-User-Admin Feature aktivieren

```bash
# 1. Auf feature-branch wechseln
git checkout feature/multi-user-admin

# 2. Container neu bauen
docker-compose up -d --build
```

**Was passiert:**
1. Backend startet
2. Entrypoint führt neue Migration aus:
   - `20260124134700_add_multi_user_admin_fields.exs`
   - Fügt `role`, `is_active`, etc. zu `users` hinzu
   - Erstellt `audit_logs` Tabelle
   - Macht ersten User zum Super-Admin
3. Backend startet mit Admin-API
4. Frontend mit Admin-Panel ist verfügbar

## Fehlerbehandlung

### Problem: "PostgreSQL not ready"

**Symptom:**
```
⏳ Waiting for PostgreSQL to be ready...
(Container hängt)
```

**Ursachen:**
- PostgreSQL-Container läuft nicht
- Netzwerk-Probleme
- Falsche Credentials

**Lösung:**
```bash
# PostgreSQL-Status prüfen
docker-compose ps postgres

# PostgreSQL-Logs prüfen
docker-compose logs postgres

# Neustart
docker-compose restart postgres
```

### Problem: "Migration failed"

**Symptom:**
```
🔄 Running database migrations...
** (Ecto.MigrationError) ...
```

**Ursachen:**
- Schema-Konflikt
- Fehlende Permissions
- Inkonsistenter Datenbank-Zustand

**Lösung:**
```bash
# Option 1: Datenbank zurücksetzen (VERLIERT ALLE DATEN!)
docker-compose down -v  # Löscht Volumes
docker-compose up -d

# Option 2: Manuelle Migration rückgängig machen
docker exec -it yappma-backend bin/wealth_backend eval \
  "WealthBackend.Release.rollback(WealthBackend.Repo, VERSION)"

# Option 3: Direkt in PostgreSQL eingreifen
docker exec -it yappma-postgres psql -U postgres -d wealth_backend_prod
```

### Problem: "Container startet nicht"

**Symptom:**
```bash
docker-compose ps
# backend: Exit 1
```

**Lösung:**
```bash
# Logs prüfen
docker-compose logs backend

# Interaktiv debuggen
docker-compose run --rm backend bash
# Dann manuell:
/app/docker-entrypoint.sh
```

## Manuelle Migrations-Ausführung

### In laufendem Container

```bash
# Migrationen ausführen
docker exec yappma-backend bin/wealth_backend eval \
  "WealthBackend.Release.migrate()"

# Letzte Migration rückgängig machen
docker exec yappma-backend bin/wealth_backend eval \
  "WealthBackend.Release.rollback(WealthBackend.Repo, 20260124134700)"
```

### Lokale Entwicklung (ohne Docker)

```bash
cd backend

# Normale Mix-Befehle
mix ecto.migrate
mix ecto.rollback
mix ecto.reset
```

## Best Practices

### 1. Vor Production-Deployment

```bash
# Test-Deployment in Staging
docker-compose -f docker-compose.staging.yml up -d --build

# Logs überwachen
docker-compose -f docker-compose.staging.yml logs -f backend

# Funktionalität testen
curl http://staging-server:4000/api/health

# Bei Erfolg: Production-Deployment
```

### 2. Backup vor großen Updates

```bash
# Datenbank-Backup
docker exec yappma-postgres pg_dump -U postgres wealth_backend_prod > backup.sql

# Bei Problemen: Restore
cat backup.sql | docker exec -i yappma-postgres psql -U postgres wealth_backend_prod
```

### 3. Zero-Downtime Deployments

```bash
# 1. Neuer Container neben altem starten
docker-compose up -d --no-deps --scale backend=2 --no-recreate backend

# 2. Health-Check abwarten
# 3. Alten Container stoppen
docker-compose up -d --no-deps --scale backend=1 backend
```

### 4. Rollback-Plan

```bash
# 1. Alte Version taggen vor Update
docker tag yappma-backend:latest yappma-backend:backup

# 2. Bei Problemen: Zurück zur alten Version
docker-compose down
docker tag yappma-backend:backup yappma-backend:latest
docker-compose up -d

# 3. Migrationen zurückrollen (falls nötig)
docker exec yappma-backend bin/wealth_backend eval \
  "WealthBackend.Release.rollback(WealthBackend.Repo, LAST_GOOD_VERSION)"
```

## CI/CD Integration

### GitHub Actions Beispiel

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        run: |
          docker build -t registry.example.com/yappma-backend:${{ github.sha }} backend/
          docker push registry.example.com/yappma-backend:${{ github.sha }}
      
      - name: Deploy
        run: |
          ssh deploy@production "cd /opt/yappma && \
            docker-compose pull && \
            docker-compose up -d --build"
      
      - name: Check migrations
        run: |
          ssh deploy@production "docker logs yappma-backend 2>&1 | grep 'Migrations complete'"
```

## Monitoring

### Wichtige Metriken

```bash
# Migration-Dauer überwachen
docker logs yappma-backend 2>&1 | grep "Migrated in"

# Fehler-Rate
docker logs yappma-backend 2>&1 | grep "ERROR"

# Health-Status
curl http://localhost:4000/api/health
```

### Prometheus-Metrics (Optional)

```elixir
# In lib/wealth_backend_web/telemetry.ex
defp metrics do
  [
    # Migrations
    last_value("db.migration.duration.milliseconds"),
    counter("db.migration.count"),
    last_value("db.migration.status")
  ]
end
```

## Zusammenfassung

✅ **Automatische Migrationen** beim Container-Start  
✅ **PostgreSQL-Check** vor Migrationen  
✅ **Idempotente Ausführung** (mehrfach ausführbar)  
✅ **Fehlerbehandlung** mit Container-Restart  
✅ **Zero-Configuration** für Standard-Setup  
✅ **Production-Ready** mit Logging und Health-Checks  

**Keine manuellen Migrations-Befehle mehr nötig!** 🎉
