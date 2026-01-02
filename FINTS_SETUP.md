# FinTS Integration Setup Guide

## 🎯 Übersicht

Diese Anleitung beschreibt die vollständige Einrichtung der FinTS-Integration für YAPPMA.

## ⚙️ Voraussetzungen

- Docker & Docker Compose
- Elixir 1.15+
- Python 3.11+
- PostgreSQL 16+

## 🚀 Quick Start

### 1. Environment Setup

```bash
# .env Datei im Root erstellen
cp .env.example .env

# Secrets generieren
export SECRET_KEY_BASE=$(mix phx.gen.secret)
export FINTS_API_KEY=$(openssl rand -hex 32)

# In .env eintragen
echo "SECRET_KEY_BASE=$SECRET_KEY_BASE" >> .env
echo "FINTS_API_KEY=$FINTS_API_KEY" >> .env
```

### 2. Docker Network erstellen

```bash
docker network create yappma-network
```

### 3. Services starten

```bash
# Alle Services
docker-compose up -d

# Oder einzeln:
docker-compose up -d postgres
docker-compose up -d fints-worker
docker-compose up -d backend
docker-compose up -d frontend
```

### 4. Database Setup

```bash
# In Backend-Container
docker exec -it yappma-backend bash

# Migrations ausführen
mix ecto.create
mix ecto.migrate

# Seeds ausführen (DKB + comdirect)
mix run priv/repo/seeds/fints_banks.exs
```

### 5. Health Checks

```bash
# Backend
curl http://localhost:4000/api/health

# FinTS Worker
curl http://localhost:5000/api/fints/health

# Frontend
curl http://localhost:5173
```

## 📦 Lokale Entwicklung (ohne Docker)

### Backend

```bash
cd backend

# Dependencies
mix deps.get

# Database
mix ecto.create
mix ecto.migrate
mix run priv/repo/seeds/fints_banks.exs

# Server starten
export FINTS_WORKER_URL=http://localhost:5000
mix phx.server
```

### FinTS Worker

```bash
cd fints-worker

# Virtual Environment
python -m venv venv
source venv/bin/activate

# Dependencies
pip install -r requirements.txt

# Server starten
export FINTS_API_KEY=dev-key-change-in-production
python app.py
```

### Frontend

```bash
cd frontend

# Dependencies
npm install

# Dev Server
export VITE_API_URL=http://localhost:4000
npm run dev
```

## 🏦 Unterstützte Banken

### DKB (Deutsche Kreditbank)

- **BLZ:** 12030000
- **FinTS URL:** `https://banking-dkb.s-fints-pt-dkb.de/fints30`
- **Features:** Kontostand-Import

### comdirect bank AG

- **BLZ:** 20041155
- **FinTS URL:** `https://fints.comdirect.de/fints`
- **Features:** Kontostand-Import

## 📡 API Endpoints

### Bank Connections

```bash
# Liste aller Verbindungen
GET /api/bank_connections

# Neue Verbindung erstellen
POST /api/bank_connections
{
  "bank_connection": {
    "name": "Meine DKB",
    "blz": "12030000",
    "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30",
    "banking_user_id": "your-user-id",
    "banking_pin": "your-pin",
    "institution_id": 1
  }
}

# Verbindung testen
POST /api/bank_connections/test
{
  "bank_connection": {
    "blz": "12030000",
    "banking_user_id": "your-user-id",
    "banking_pin": "your-pin",
    "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30"
  }
}

# Konten abrufen
POST /api/bank_connections/:id/fetch_accounts

# Kontostände synchronisieren
POST /api/bank_connections/:id/sync_balances
```

### Bank Accounts

```bash
# Bank-Konto erstellen
POST /api/bank_accounts
{
  "bank_account": {
    "iban": "DE89370400440532013000",
    "account_number": "532013000",
    "account_name": "Girokonto",
    "bank_connection_id": 1
  }
}

# Mit YAPPMA Account verknüpfen
POST /api/bank_accounts/:id/link
{
  "account_id": 5
}
```

## 🔒 Sicherheit

### Credential Encryption (TODO - Phase 2)

```elixir
# mix.exs
{:cloak_ecto, "~> 1.3"}

# Encryption Key generieren
openssl rand -base64 32

# config/config.exs
config :wealth_backend, WealthBackend.Vault,
  ciphers: [
    default: {Cloak.Ciphers.AES.GCM, 
      tag: "AES.GCM.V1", 
      key: Base.decode64!(System.get_env("ENCRYPTION_KEY"))}
  ]
```

### API Key Configuration

```bash
# Starker API Key generieren
openssl rand -hex 32

# In .env setzen
FINTS_API_KEY=your-generated-key
```

## 🐛 Troubleshooting

### FinTS Worker startet nicht

```bash
# Logs checken
docker-compose logs fints-worker

# Container neu starten
docker-compose restart fints-worker
```

### Connection zu Bank fehlgeschlagen

```bash
# Test-Verbindung prüfen
curl -X POST http://localhost:5000/api/fints/test-connection \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "blz": "12030000",
    "user_id": "test",
    "pin": "test",
    "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30"
  }'
```

### Database Migration Fehler

```bash
# Migrations zurücksetzen
mix ecto.rollback --step 3

# Neu ausführen
mix ecto.migrate
```

## 📊 Monitoring

### Logs ansehen

```bash
# Alle Services
docker-compose logs -f

# Nur FinTS Worker
docker-compose logs -f fints-worker

# Nur Backend
docker-compose logs -f backend
```

### Health Checks

```bash
# Alle Services prüfen
curl http://localhost:4000/api/health
curl http://localhost:5000/api/fints/health
curl http://localhost:5173
```

## 🚀 Deployment (Unraid)

### Docker Compose auf Unraid

1. **Compose Manager Plugin** installieren
2. `docker-compose.yml` hochladen
3. Environment Variables setzen
4. Stack starten

### Backup

```bash
# Database Backup
docker exec yappma-postgres pg_dump -U postgres wealth_backend_dev > backup.sql

# Restore
cat backup.sql | docker exec -i yappma-postgres psql -U postgres wealth_backend_dev
```

## 📝 Dokumentation

- [FinTS Worker README](./fints-worker/README.md)
- [Backend Documentation](./backend/BACKEND_DOCUMENTATION.md)
- [API Documentation](./API.md)

## ❓ Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/solaar45/yappma-reload/issues
- FinTS Spec: https://www.hbci-zka.de/
