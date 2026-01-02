# YAPPMA PSD2 Integration - Setup Guide

## 🎉 Overview

YAPPMA now supports automatic bank synchronization via **PSD2 (Payment Services Directive 2)** using the open-source [Styx](https://github.com/petafuel/styx) XS2A client.

**What you get:**
- ✅ Automatic account balance sync
- ✅ Automatic transaction import
- ✅ Intelligent transaction categorization
- ✅ Support for major German banks (DKB, Sparkasse, etc.)
- ✅ 100% self-hosted, no third-party services
- ✅ Secure OAuth2-like flow

## 🚀 Quick Start

### 1. Start Styx Server

```bash
cd backend
docker-compose -f docker-compose.styx.yml up -d
```

This starts:
- **Styx Server** on `http://localhost:8093`
- **PostgreSQL** database for Styx

**Verify Styx is running:**
```bash
curl http://localhost:8093/health
```

### 2. Run Database Migrations

```bash
cd backend
mix ecto.migrate
```

This creates:
- `bank_consents` table
- PSD2 fields in `accounts` table

### 3. Install Dependencies

```bash
# Backend
cd backend
mix deps.get

# Frontend
cd frontend
npm install
```

### 4. Start Application

```bash
# Backend
cd backend
mix phx.server

# Frontend
cd frontend
npm run dev
```

### 5. Connect Your Bank

1. Open YAPPMA in browser: `http://localhost:5173`
2. Navigate to **Accounts** page
3. Click **"Bank verbinden"** button
4. Select your bank (e.g., DKB)
5. You'll be redirected to your bank's login
6. Authorize access (read-only)
7. Return to YAPPMA - accounts & transactions are synced!

## 🏛️ Architecture

```
YAPPMA Frontend (React)
    ↓
    ↓ HTTP REST
    ↓
YAPPMA Backend (Elixir)
    ↓
    ↓ HTTP REST (localhost:8093)
    ↓
Styx Server (Docker)
    ↓
    ↓ HTTPS XS2A API
    ↓
Bank APIs (DKB, Sparkasse, etc.)
```

## 🛠️ Configuration

### Adding More Banks

Edit `backend/styx-config/aspsp-config.json`:

```json
{
  "aspsps": [
    {
      "name": "Your Bank",
      "bic": "BANKDEFFXXX",
      "aspsp_id": "your-bank-id",
      "xs2a_base_url": "https://xs2a.yourbank.com"
    }
  ]
}
```

Restart Styx:
```bash
docker-compose -f docker-compose.styx.yml restart styx
```

### Environment Variables

**Backend (`config/config.exs`):**
```elixir
config :yappma,
  styx_base_url: System.get_env("STYX_URL") || "http://localhost:8093"
```

**Frontend (`.env`):**
```bash
VITE_API_URL=http://localhost:4000
```

## 🔒 Security

### What YAPPMA Does NOT Store:
- ❌ Bank login credentials
- ❌ Bank passwords
- ❌ PINs or TANs

### What YAPPMA DOES Store:
- ✅ Consent tokens (like OAuth tokens)
- ✅ Account metadata (IBAN, name, balance)
- ✅ Transaction history

### Security Features:
- 🔐 All bank communication via HTTPS
- 🔐 OAuth2-like consent flow
- 🔐 Read-only access (no payment initiation by default)
- 🔐 Consent expires after 90 days (PSD2 requirement)
- 🔐 User can revoke consent anytime

## 📄 API Documentation

### Backend Endpoints

**List Banks:**
```bash
GET /api/bank_connections/banks
```

**Initiate Consent:**
```bash
POST /api/bank_connections/consents
{
  "aspsp_id": "dkb-bank-de",
  "redirect_url": "http://localhost:5173/bank-callback"
}
```

**Complete Consent:**
```bash
POST /api/bank_connections/consents/:id/complete
{
  "authorization_code": "abc123"
}
```

**Sync Accounts:**
```bash
POST /api/bank_connections/consents/:id/sync
```

**List Accounts:**
```bash
GET /api/bank_connections/consents/:id/accounts
```

**Revoke Consent:**
```bash
DELETE /api/bank_connections/consents/:id
```

See `backend/STYX_INTEGRATION.md` for full API reference.

## ⚡ Automatic Sync

### Setup with Oban (Recommended)

1. Add Oban to `mix.exs`:
```elixir
{:oban, "~> 2.17"}
```

2. Create worker:
```elixir
# lib/yappma/workers/bank_sync_worker.ex
defmodule Yappma.Workers.BankSyncWorker do
  use Oban.Worker, queue: :default, max_attempts: 3

  @impl Oban.Worker
  def perform(%{args: %{"user_id" => user_id, "consent_id" => consent_id}}) do
    Yappma.BankConnections.sync_accounts(user_id, consent_id)
  end
end
```

3. Schedule daily sync:
```elixir
# Schedule sync every morning at 6 AM
%{
  user_id: user.id,
  consent_id: consent.consent_id
}
|> Yappma.Workers.BankSyncWorker.new(schedule_in: calculate_next_6am())
|> Oban.insert()
```

## 🐞 Troubleshooting

### Styx Not Starting

**Check logs:**
```bash
docker logs yappma-styx
```

**Check if port is already in use:**
```bash
lsof -i :8093
```

**Solution:** Change port in `docker-compose.styx.yml`

### Bank Connection Fails

**Symptom:** Authorization fails or times out

**Possible causes:**
1. Bank is in maintenance
2. Wrong ASPSP configuration
3. Bank requires additional authentication

**Debug:**
```bash
# Check Styx logs
docker logs yappma-styx -f

# Test bank connection directly
curl http://localhost:8093/aspsps/dkb-bank-de
```

### Transactions Not Importing

**Check consent status:**
```elixir
iex> Yappma.BankConnections.get_consent_status("consent_id")
```

**Refresh consent if expired:**
User needs to re-authorize after 90 days.

### "Rate Limit Exceeded" Error

**Cause:** PSD2 allows maximum 4 API calls per day per account

**Solution:**
- Reduce sync frequency
- Sync only once or twice per day
- Use manual sync when needed

## 🚀 Production Deployment

### Checklist

- [ ] Use production-ready PostgreSQL (not Docker)
- [ ] Set strong database passwords
- [ ] Use HTTPS for all connections
- [ ] Restrict Styx port (only localhost)
- [ ] Set proper CORS configuration
- [ ] Add rate limiting
- [ ] Set up monitoring (Styx health checks)
- [ ] Configure log rotation
- [ ] Set up backup for `bank_consents` table
- [ ] Add PSD2 certificates for production banks
- [ ] Test consent renewal flow
- [ ] Add error alerting (e.g., when sync fails)

### Docker Compose Production

```yaml
services:
  styx:
    image: ghcr.io/petafuel/styx:latest
    environment:
      - STYX_MODE=production
      - DB_PASSWORD=${STYX_DB_PASSWORD}
    networks:
      - internal  # No external access
    restart: always
    
  yappma-backend:
    environment:
      - STYX_URL=http://styx:8093
    depends_on:
      - styx
```

### Environment Variables (Production)

```bash
STYX_URL=http://styx:8093
STYX_MODE=production
DATABASE_URL=postgresql://...
SECRET_KEY_BASE=...
```

## 📚 Resources

- [Styx Documentation](https://petafuel.github.io/styx/)
- [Styx GitHub](https://github.com/petafuel/styx)
- [Berlin Group XS2A Standard](https://www.berlin-group.org/)
- [PSD2 Overview](https://ec.europa.eu/info/law/payment-services-psd-2-directive-eu-2015-2366_en)
- [Backend Integration Docs](backend/STYX_INTEGRATION.md)

## ❓ FAQ

**Q: Do I need to register as a TPP (Third Party Provider)?**
A: For personal use (self-hosted), no. For commercial deployment, yes.

**Q: Which banks are supported?**
A: Any bank that implements Berlin Group XS2A standard. This includes most German banks.

**Q: Can I initiate payments?**
A: Currently only AIS (Account Information Service) is implemented. PIS (Payment Initiation) can be added.

**Q: How long is data stored?**
A: Transactions are stored indefinitely. Consent expires after 90 days and requires renewal.

**Q: Is this GDPR compliant?**
A: Yes, as long as you host it yourself. For multi-user deployments, add proper data protection measures.

**Q: Can I use this with non-German banks?**
A: Yes! Any bank supporting PSD2 XS2A can be configured in Styx.

## 👥 Support

For issues:
1. Check [backend/STYX_INTEGRATION.md](backend/STYX_INTEGRATION.md)
2. Check Styx logs: `docker logs yappma-styx`
3. Check YAPPMA logs
4. Open issue on GitHub

## 🎉 Success!

You now have a fully functional, self-hosted PSD2 bank integration! 🚀

**Next Steps:**
- Add more banks to configuration
- Set up automatic sync with Oban
- Customize transaction categorization
- Add spending analytics

Enjoy automatic bank syncing! 🍾
