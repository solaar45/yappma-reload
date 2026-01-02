# Styx PSD2 Integration

This document describes the integration of Styx PSD2 XS2A client into YAPPMA.

## Overview

YAPPMA uses [Styx](https://github.com/petafuel/styx) as an open-source PSD2 XS2A client to connect to European banks via the Berlin Group NextGenPSD2 standard.

**Why Styx?**
- ✅ Completely free and open source (Apache 2.0)
- ✅ Implements Berlin Group XS2A standard
- ✅ Supports multiple German banks including DKB
- ✅ Handles SCA (Strong Customer Authentication)
- ✅ No dependency on third-party services
- ✅ Self-hosted solution

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     YAPPMA Frontend                     │
│            (React - User initiates sync)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  YAPPMA Backend (Elixir)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │          BankConnections Context                 │  │
│  │  - ConsentManager                                │  │
│  │  - AccountSync                                   │  │
│  │  - TransactionMapper                             │  │
│  └──────────┬───────────────────────────────────────┘  │
│             │                                           │
│             ▼                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │             StyxClient                           │  │
│  │     (HTTP REST API communication)                │  │
│  └──────────┬───────────────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────┘
              │
              ▼ HTTP REST (localhost:8093)
┌─────────────────────────────────────────────────────────┐
│              Styx Server (Java/Docker)                  │
│         (PSD2 XS2A Protocol Handler)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ HTTPS XS2A API
┌─────────────────────────────────────────────────────────┐
│                Bank APIs (DKB, etc.)                    │
│            (Berlin Group XS2A Standard)                 │
└─────────────────────────────────────────────────────────┘
```

## Setup

### 1. Start Styx Server

```bash
cd backend
docker-compose -f docker-compose.styx.yml up -d
```

This starts:
- Styx server on `http://localhost:8093`
- PostgreSQL database for Styx

### 2. Configure ASPSP (Banks)

Edit `backend/styx-config/aspsp-config.json` to add/modify bank configurations:

```json
{
  "aspsps": [
    {
      "name": "DKB Bank",
      "bic": "BYLADEM1001",
      "aspsp_id": "dkb-bank-de",
      "xs2a_base_url": "https://xs2a.dkb.de"
    }
  ]
}
```

### 3. Environment Configuration

Add to `backend/config/config.exs`:

```elixir
config :yappma,
  styx_base_url: System.get_env("STYX_URL") || "http://localhost:8093"
```

## Usage Flow

### 1. Bank Connection Initiation

```elixir
# User selects a bank in the frontend
{:ok, consent_data} = BankConnections.initiate_consent(
  user_id,
  "dkb-bank-de",
  redirect_url: "https://yappma.local/bank/callback"
)

# Returns:
# %{
#   consent_id: "abc123",
#   authorization_url: "https://dkb.de/consent?id=xyz..."
# }
```

### 2. User Authorization (Redirect Flow)

1. Frontend redirects user to `authorization_url`
2. User logs into their bank and approves access
3. Bank redirects back to YAPPMA callback URL
4. Backend completes consent

```elixir
{:ok, result} = BankConnections.complete_consent(
  consent_id,
  authorization_code  # From callback params
)
```

### 3. Account Sync

```elixir
# Sync all accounts and transactions
{:ok, stats} = BankConnections.sync_accounts(user_id, consent_id)

# Returns:
# %{
#   accounts_synced: 2,
#   transactions_imported: 145
# }
```

### 4. Periodic Sync

Schedule regular syncs (e.g., via Oban):

```elixir
defmodule Yappma.Workers.BankSyncWorker do
  use Oban.Worker

  @impl Oban.Worker
  def perform(%{args: %{"user_id" => user_id, "consent_id" => consent_id}}) do
    BankConnections.sync_accounts(user_id, consent_id)
  end
end
```

## API Reference

### BankConnections Context

```elixir
# List available banks
BankConnections.list_banks()
#=> {:ok, [%{name: "DKB", bic: "BYLADEM1001", ...}]}

# Initiate consent
BankConnections.initiate_consent(user_id, aspsp_id, opts)

# Complete consent
BankConnections.complete_consent(consent_id, auth_code)

# List accounts
BankConnections.list_accounts(consent_id)

# Get transactions
BankConnections.get_transactions(consent_id, account_id, opts)

# Sync accounts
BankConnections.sync_accounts(user_id, consent_id)

# Check consent status
BankConnections.get_consent_status(consent_id)

# Revoke consent
BankConnections.revoke_consent(consent_id)
```

## Database Schema (TODO)

You'll need to create these schemas:

### BankConsent

```elixir
schema "bank_consents" do
  field :user_id, :id
  field :aspsp_id, :string
  field :consent_id, :string
  field :status, :string  # "pending", "valid", "expired", "revoked"
  field :authorization_url, :string
  field :valid_until, :utc_datetime
  field :last_used_at, :utc_datetime
  
  timestamps()
end
```

### Updates to Account Schema

```elixir
schema "accounts" do
  # ... existing fields
  
  field :external_id, :string  # From PSD2
  field :iban, :string
  field :bank_name, :string
  field :last_synced_at, :utc_datetime
  field :consent_id, :string
  
  # ... existing fields
end
```

### Updates to Transaction Schema

```elixir
schema "transactions" do
  # ... existing fields
  
  field :external_id, :string  # From PSD2
  field :merchant_category_code, :string
  field :bank_transaction_code, :string
  field :raw_data, :map  # Store original PSD2 data
  
  # ... existing fields
end
```

## Troubleshooting

### Styx Connection Errors

```bash
# Check if Styx is running
curl http://localhost:8093/health

# View Styx logs
docker logs yappma-styx
```

### Bank API Errors

- **9075 - Strong Authentication Required**: Bank requires SCA, use redirect flow
- **401 - Unauthorized**: Consent expired or invalid
- **429 - Too Many Requests**: Rate limit exceeded (max 4 calls/day per PSD2)

### Testing Without Real Bank

Use mock mode during development:

```elixir
# In config/dev.exs
config :yappma, :use_mock_banking, true
```

## Rate Limits

**PSD2 Standard Limits:**
- Maximum 4 API calls per account per day
- Consent valid for 90 days
- After 90 days, user must re-authorize

**Best Practice:**
- Sync once in the morning
- Sync once in the evening
- Use webhooks if bank supports them (future enhancement)

## Security

- ✅ All communication with Styx is local (Docker network)
- ✅ Styx handles secure communication with banks (HTTPS + certificates)
- ✅ No banking credentials stored in YAPPMA database
- ✅ Only OAuth2-like tokens (consent IDs) are stored
- ⚠️ **Production**: Use proper SSL certificates for Styx
- ⚠️ **Production**: Restrict Styx port to localhost only

## Future Enhancements

- [ ] Add webhook support for real-time transaction updates
- [ ] Implement Payment Initiation Service (PIS) for transfers
- [ ] Add multi-bank support UI
- [ ] Consent renewal reminders (before 90 days)
- [ ] Advanced categorization with ML
- [ ] Support for more ASPSP/banks

## Resources

- [Styx GitHub](https://github.com/petafuel/styx)
- [Styx Documentation](https://petafuel.github.io/styx/)
- [Berlin Group XS2A Standard](https://www.berlin-group.org/)
- [PSD2 Overview](https://ec.europa.eu/info/law/payment-services-psd-2-directive-eu-2015-2366_en)
