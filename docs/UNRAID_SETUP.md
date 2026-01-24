# YAPPMA auf Unraid - Setup Guide

Diese Anleitung beschreibt die Installation und Konfiguration von YAPPMA auf Unraid mit automatischer Datenbank-Erstellung.

## Voraussetzungen

- Unraid Server 6.x oder höher
- PostgreSQL-Container läuft bereits (z.B. via Unraid Apps)
- Docker-Netzwerk konfiguriert

## Automatische Datenbank-Erstellung

YAPPMA erstellt jetzt **automatisch** die PostgreSQL-Datenbank beim ersten Start:

✅ Erkennt externe PostgreSQL-Server (mit Hostname:Port)  
✅ Erstellt Datenbank, falls sie nicht existiert  
✅ Führt alle Migrationen automatisch aus  
✅ Wartezeit auf 10 Sekunden begrenzt  

## Schritt 1: PostgreSQL bereitstellen

### Option A: Eigener PostgreSQL-Container

Wenn du bereits PostgreSQL auf Unraid laufen hast:

1. Notiere dir:
   - **IP-Adresse:** z.B. `192.168.0.161`
   - **Port:** z.B. `5439`
   - **Username:** z.B. `kreator`
   - **Password:** Dein sicheres Passwort

2. **Wichtig:** Die Datenbank muss NICHT vorhanden sein - YAPPMA erstellt sie automatisch!

### Option B: PostgreSQL via Unraid Apps installieren

1. Gehe zu **Apps** → Suche nach "PostgreSQL"
2. Installiere z.B. "PostgreSQL Official" von PostgreSQL
3. Konfiguriere:
   - **Port:** 5432
   - **POSTGRES_USER:** postgres
   - **POSTGRES_PASSWORD:** [sicheres Passwort]
4. Starte den Container

## Schritt 2: YAPPMA-Container konfigurieren

### Environment-Variablen im Unraid GUI

Konfiguriere folgende Variablen (siehe dein Screenshot):

#### Datenbank-Konfiguration

```
DB_USERNAME: kreator
  → Dein PostgreSQL-Benutzername

DB_PASSWORD: [dein_passwort]
  → Dein PostgreSQL-Passwort

DB_DATABASE: yappma
  → Name der Datenbank (wird automatisch erstellt!)

DB_HOSTNAME: 192.168.0.161:5439
  → IP:Port deines PostgreSQL-Servers
  → Format: host:port ODER nur host (dann Port 5432)
```

#### Phoenix/Backend-Konfiguration

```
SECRET_KEY_BASE: q8qq0e8QkYQsLvVBM7ZRVLQVIQvDvZQQkQvQVZQ
  → Phoenix Secret Key (generiere mit: mix phx.gen.secret)

PHOENIX_HOST: 192.168.0.161
  → Hostname/IP deines Unraid-Servers

PHX_SERVER: true
  → Startet Phoenix-Server

DATABASE_URL: ecto://kreator:1ZMnVAHeAcpABFPdEJQp@192.168.0.161:5439/yappma
  → Komplette Datenbank-URL
  → Format: ecto://username:password@host:port/database
```

#### API-Keys (Optional)

```
FMP_API_KEY: zrXwILSBiExXwTA2LBjSadxLtdgu9JFz
  → Financial Modeling Prep API Key
  → Für Security-Enrichment (ISIN → Ticker)
  → Kostenlos: https://site.financialmodelingprep.com/

ALPHA_VANTAGE_API_KEY: 9QY9D16JZBVC24Y4
  → Alpha Vantage API Key (veraltet, FMP bevorzugt)
```

#### Frontend-Konfiguration

```
VITE_LOGOKIT_TOKEN: pk_fr3eaf6b62564040820446
  → LogoKit Token für Firmen-Logos
  → Optional, nur für Logo-Anzeige

VITE_LOGO_DEV_TOKEN: pk_MxkTMUHkT1GN-nvJPuL8PQ
  → Development Token

VITE_API_BASE_URL: /api
  → Backend-API-Pfad
```

#### Netzwerk & Ports

```
WebGUI: 9544
  → Port für Frontend (Container: 8080)

URL_PORT: 9544
  → Externer Port

URL_SCHEME: http
  → Protokoll (http oder https)
```

## Schritt 3: Container starten

### Erster Start

1. **Speichere** die Konfiguration im Unraid GUI
2. **Starte** den Container
3. **Warte** ca. 10-15 Sekunden
4. **Prüfe** die Logs

### Erwartete Log-Ausgabe (Erfolg)

```bash
========================================
YAPPMA Reload - Starting...
========================================
Database Configuration:
  Host: 192.168.0.161
  Port: 5439
  User: kreator
  Database: yappma

Waiting for database...
Waiting for database... (1/10)
Waiting for database... (2/10)
✅ PostgreSQL is ready!
Checking if database exists...
📦 Database 'yappma' does not exist, creating...
✅ Database created!
Running database migrations...
[info] == Running 20190101120000_create_users.change/0 forward
[info] == Migrated in 0.1s
[info] == Running 20260124134700_add_multi_user_admin_fields.change/0 forward
[info] == Migrated in 0.2s
✅ Migrations complete!
========================================
Starting services...
  Backend API: http://localhost:4000
  Frontend UI: http://localhost:8080
========================================
```

### Logs prüfen

In Unraid:
1. Gehe zu **Docker** Tab
2. Klicke auf **YAPPMA** → **Logs**
3. Prüfe auf "✅ Database created!" und "✅ Migrations complete!"

### Zugriff testen

```bash
# Frontend
http://192.168.0.161:9544

# Backend API
http://192.168.0.161:9544/api

# Health Check
curl http://192.168.0.161:9544/api/health
```

## Schritt 4: Erster Login

### Registrierung

1. Öffne `http://192.168.0.161:9544`
2. Klicke auf "Registrieren"
3. Erstelle deinen Account:
   - **Email:** deine@email.de
   - **Name:** Dein Name
   - **Passwort:** min. 16 Zeichen
4. Nach Registrierung → Automatisch eingeloggt

### Erster User wird Super-Admin

**Wichtig:** Der erste registrierte User erhält automatisch Super-Admin-Rechte!

✅ Zugriff auf `/admin` Dashboard  
✅ Kann weitere User erstellen  
✅ Volle Kontrolle über System  

## Problembehandlung

### Problem 1: "Database does not exist"

**Symptom:**
```
FATAL 3D000 (invalid_catalog_name) database "yappma" does not exist
```

**Ursache:** Automatische Datenbank-Erstellung hat nicht funktioniert

**Lösung:**

```bash
# Option 1: Datenbank manuell erstellen
docker exec -it [postgres-container] \
  psql -U kreator -c "CREATE DATABASE yappma;"

# Option 2: Container neu starten (versucht erneut)
docker restart [yappma-container]

# Option 3: Permissions prüfen
docker exec -it [postgres-container] \
  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE yappma TO kreator;"
```

### Problem 2: "Waiting for database... (10/10)"

**Symptom:**
```
Waiting for database... (10/10)
⚠ Warning: Could not verify backend connectivity
```

**Ursache:** PostgreSQL nicht erreichbar

**Lösung:**

```bash
# 1. PostgreSQL-Container läuft?
docker ps | grep postgres

# 2. Port richtig? (Unraid GUI prüfen)
# PostgreSQL Container → Edit → Port Mappings

# 3. Firewall?
telnet 192.168.0.161 5439

# 4. DB_HOSTNAME richtig?
# Muss Format sein: IP:PORT oder Hostname:PORT
```

### Problem 3: "Permission denied"

**Symptom:**
```
Postgrex.Error) ERROR 42501 (insufficient_privilege)
```

**Lösung:**

```bash
# User Permissions erteilen
docker exec -it [postgres-container] psql -U postgres

GRANT ALL PRIVILEGES ON DATABASE yappma TO kreator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO kreator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO kreator;
\q
```

### Problem 4: "Migration failed"

**Symptom:**
```
⚠ Warning: Migrations failed or not needed
```

**Lösung:**

```bash
# Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
docker exec -it [postgres-container] \
  psql -U postgres -c "DROP DATABASE yappma;"

docker exec -it [postgres-container] \
  psql -U postgres -c "CREATE DATABASE yappma OWNER kreator;"

# YAPPMA neu starten
docker restart [yappma-container]
```

## Updates

### Container aktualisieren

```bash
# 1. In Unraid GUI
Docker → YAPPMA → "Update Container"

# 2. Container neu starten
# Migrationen laufen automatisch!
```

### Auf Multi-User-Admin Branch wechseln

```bash
# Im Docker Template (Advanced View)
# Repository: ghcr.io/solaar45/yappma:feature-multi-user-admin
# Oder Tag: feature-multi-user-admin

# Dann: Container neu ziehen und starten
```

## Backup

### Datenbank-Backup

```bash
# Backup erstellen
docker exec [postgres-container] \
  pg_dump -U kreator yappma > /mnt/user/backups/yappma-$(date +%Y%m%d).sql

# Backup wiederherstellen
cat /mnt/user/backups/yappma-20260124.sql | \
  docker exec -i [postgres-container] \
  psql -U kreator yappma
```

### Automatisches Backup (CA Backup Plugin)

1. Installiere "CA Backup / Restore Appdata"
2. Füge PostgreSQL-Volume hinzu
3. Zeitplan: täglich, wöchentlich

## Best Practices

### 1. Sichere Passwörter

```bash
# Generiere sichere Passwörter:
openssl rand -base64 32

# Für SECRET_KEY_BASE (Phoenix):
mix phx.gen.secret
```

### 2. HTTPS aktivieren (Optional)

Verwende Unraid Let's Encrypt Plugin oder Nginx Proxy Manager:

```
URL_SCHEME: https
PHOENIX_HOST: yappma.example.com
```

### 3. Netzwerk-Isolation

Erstelle Custom Docker Network:

```bash
docker network create yappma-net

# Dann in Docker Template:
Network Type: Custom: yappma-net
```

### 4. Resource Limits

In Docker Template → Advanced:

```
CPU Pinning: 0-3
Memory Limit: 2G
```

## Monitoring

### Logs überwachen

```bash
# Live Logs
docker logs -f [yappma-container]

# Letzte 100 Zeilen
docker logs --tail 100 [yappma-container]

# Nur Fehler
docker logs [yappma-container] 2>&1 | grep -i error
```

### Health Check

```bash
# Backend
curl http://192.168.0.161:9544/api/health

# PostgreSQL
docker exec [postgres-container] pg_isready -U kreator
```

## Zusammenfassung

✅ **Automatische Datenbank-Erstellung** beim ersten Start  
✅ **10 Sekunden Timeout** für PostgreSQL-Check  
✅ **Externe PostgreSQL-Server** werden unterstützt  
✅ **Hostname:Port Format** wird korrekt geparst  
✅ **Environment-Variablen** aus Unraid GUI werden verwendet  
✅ **Erster User = Super-Admin** automatisch  
✅ **Zero-Configuration** für Standard-Setup  

**Keine manuellen SQL-Befehle mehr nötig!** 🎉

## Support

- **GitHub Issues:** https://github.com/solaar45/yappma-reload/issues
- **Unraid Forum:** https://forums.unraid.net/
- **Dokumentation:** https://github.com/solaar45/yappma-reload/tree/feature/multi-user-admin/docs
