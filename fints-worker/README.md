# YAPPMA FinTS Worker

Python-basierter FinTS Worker für automatisierten Import von Kontodaten.

## Unterstützte Banken

- **DKB (Deutsche Kreditbank)**
  - BLZ: 12030000
  - FinTS URL: `https://banking-dkb.s-fints-pt-dkb.de/fints30`

- **comdirect bank AG**
  - BLZ: 20041155
  - FinTS URL: `https://fints.comdirect.de/fints`

## Setup

### Lokale Entwicklung

```bash
# Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Dependencies installieren
pip install -r requirements.txt

# Umgebungsvariablen setzen
cp .env.example .env
# Edit .env und setze FINTS_API_KEY

# Server starten
python app.py
```

### Docker Deployment

```bash
# Image bauen
docker build -t yappma-fints-worker .

# Container starten
docker-compose up -d

# Logs ansehen
docker-compose logs -f

# Health Check
curl http://localhost:5000/api/fints/health
```

## API Endpoints

### Health Check
```bash
GET /api/fints/health
```

### Test Connection
```bash
POST /api/fints/test-connection
Headers: X-API-Key: your-api-key
Body:
{
  "blz": "12030000",
  "user_id": "your-banking-user-id",
  "pin": "your-pin",
  "fints_url": "https://banking-dkb.s-fints-pt-dkb.de/fints30"
}
```

### Fetch Accounts
```bash
POST /api/fints/fetch-accounts
Headers: X-API-Key: your-api-key
Body: (same as test-connection)
```

### Fetch Balances
```bash
POST /api/fints/fetch-balances
Headers: X-API-Key: your-api-key
Body: (same as test-connection)
```

## Sicherheit

- **API Key Authentication**: Alle Requests benötigen `X-API-Key` Header
- **Keine Credential-Speicherung**: Credentials werden nur für den Request verwendet
- **Docker Isolation**: Läuft in isoliertem Container
- **Non-Root User**: Container läuft mit unprivilegiertem User

## Integration mit Elixir Backend

```elixir
# config/config.exs
config :wealth_backend,
  fints_worker_url: "http://fints-worker:5000"
```

## Troubleshooting

### Connection Failed
- Prüfe BLZ und FinTS URL
- Prüfe Banking-Credentials
- Manche Banken haben Rate Limits (2-3 Requests/Minute)

### TAN Required
- PSD2 erfordert TAN-Bestätigung alle 90 Tage
- User muss TAN in Banking-App bestätigen

## Lizenz

MIT
