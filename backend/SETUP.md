# Backend Setup Guide

This guide will help you set up the YAPPMA Reload backend with all required services.

## Prerequisites

- Elixir 1.15+ and Erlang/OTP 26+
- PostgreSQL 15+
- Mix (comes with Elixir)

## Database Setup

```bash
# Create database
mix ecto.create

# Run migrations
mix ecto.migrate

# (Optional) Seed with demo data
mix run priv/repo/seeds.exs
```

## Environment Configuration

### Step 1: Create .env file

```bash
cd backend
cp .env.example .env
```

### Step 2: Configure Database

Update `DATABASE_URL` in `.env`:

```bash
DATABASE_URL=ecto://postgres:postgres@localhost/wealth_backend_dev
```

### Step 3: Configure FMP API (Required for Security Enrichment)

#### Why do I need this?

The FMP (Financial Modeling Prep) API is used for:
- ✅ **Auto-completing security information** when you enter a ticker symbol (e.g., "AAPL" → "Apple Inc.")
- ✅ **Converting ISIN to ticker** (e.g., "US0378331005" → "AAPL")
- ✅ **Validating securities** when creating assets
- ✅ **Enriching with metadata** (sector, currency, exchange, etc.)

#### How to get your FREE API key:

1. **Sign up** at [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs/)
   - Click "Get Started" or "Sign Up"
   - Use email + password or OAuth (GitHub, Google)

2. **Verify your email** (check spam folder if needed)

3. **Navigate to Dashboard**
   - After login, go to [Dashboard](https://site.financialmodelingprep.com/developer/docs/dashboard)
   - Your API key is displayed prominently

4. **Copy API Key**
   - Click "Copy" button next to your key
   - It looks like: `1a2b3c4d5e6f7g8h9i0j`

5. **Add to .env file**
   
   Open `backend/.env` and replace:
   ```bash
   FMP_API_KEY=your_fmp_api_key_here
   ```
   
   With your actual key:
   ```bash
   FMP_API_KEY=1a2b3c4d5e6f7g8h9i0j
   ```

#### Free Tier Limits

- **250 API calls TOTAL** (not per day, total account lifetime)
- **No rate limiting** on calls
- Perfect for personal use with client-side caching
- Upgrade to paid plan if you need more calls

#### What happens without API key?

❌ **Security enrichment will fail** with error:
```
FMP_API_KEY not configured. Please set FMP_API_KEY environment variable.
```

❌ **Asset creation with securities will fail** during validation

✅ **Other features work normally** (accounts, institutions, non-security assets)

## Start the Server

```bash
# Load environment variables from .env
source .env  # Linux/macOS
# OR
set -a; source .env; set +a  # Alternative

# Install dependencies
mix deps.get

# Start Phoenix server
mix phx.server
```

The backend will be available at `http://localhost:4000`

## Testing the FMP Integration

### Test 1: Check API key is loaded

```bash
# In your terminal
echo $FMP_API_KEY
# Should output your actual API key
```

### Test 2: Test enrichment via API

```bash
# Test with ticker symbol
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "AAPL", "type": "ticker"}'

# Expected response:
# {"data": {"ticker": "AAPL", "name": "Apple Inc.", ...}}
```

```bash
# Test with ISIN
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "US0378331005", "type": "isin"}'

# Expected response:
# {"data": {"ticker": "AAPL", "isin": "US0378331005", "name": "Apple Inc.", ...}}
```

### Test 3: Create a security asset

```bash
# First, log in and get your session token
# Then create an asset with a security
curl -X POST http://localhost:4000/api/assets \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{
    "user_id": 1,
    "asset_type_id": 21,
    "name": "Apple Stock",
    "currency": "USD",
    "security_asset": {
      "ticker": "AAPL",
      "security_type": "stock"
    }
  }'

# Should succeed with 200 OK
```

## Troubleshooting

### Error: "FMP_API_KEY not configured"

**Cause:** Environment variable not set or not loaded

**Solution:**
```bash
# 1. Check .env file exists
ls -la backend/.env

# 2. Check .env contains FMP_API_KEY
grep FMP_API_KEY backend/.env

# 3. Reload environment
source backend/.env

# 4. Restart server
mix phx.server
```

### Error: "Security not found" for valid ticker

**Cause:** API key might be invalid or expired

**Solution:**
```bash
# Test API key directly
curl "https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=YOUR_KEY_HERE"

# Should return Apple's profile data
# If error, regenerate API key on FMP dashboard
```

### Error: "Rate limit exceeded"

**Cause:** You've used all 250 free API calls

**Solution:**
- Upgrade to paid plan on FMP website
- OR wait for rate limit reset (if applicable)
- OR use a different API key (create new account)

### Error: "Network error" or "Timeout"

**Cause:** Cannot reach FMP API

**Solution:**
```bash
# Test connectivity
ping financialmodelingprep.com

# Test HTTPS access
curl https://financialmodelingprep.com/

# Check firewall/proxy settings
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `SECRET_KEY_BASE` | ✅ Yes | - | Phoenix secret key for sessions |
| `PORT` | ❌ No | 4000 | HTTP server port |
| `FMP_API_KEY` | ⚠️ For securities | - | Financial Modeling Prep API key |

## API Documentation

Once the server is running, visit:
- **API Docs:** (if configured) `http://localhost:4000/api/docs`
- **LiveDashboard:** (dev only) `http://localhost:4000/dev/dashboard`

## Production Deployment

For production deployment:

1. **Set environment variables** via your hosting provider's dashboard
2. **Never commit** `.env` file to version control
3. **Use secrets management** (e.g., Kubernetes Secrets, AWS Secrets Manager)
4. **Monitor API usage** on FMP dashboard to avoid hitting limits

## Support

- **FMP Support:** https://site.financialmodelingprep.com/contact-support
- **FMP Documentation:** https://site.financialmodelingprep.com/developer/docs/
- **Repository Issues:** https://github.com/solaar45/yappma-reload/issues
