# Security Metadata Enrichment

## Overview

The security metadata enrichment feature automatically fetches additional information about securities (stocks, ETFs, bonds, etc.) from external data sources.

⚠️ **Important:** Due to Yahoo Finance API restrictions, this feature now uses **Alpha Vantage**. See [Alpha Vantage Setup Guide](./ALPHA_VANTAGE_SETUP.md) for API key configuration.

## Quick Start

1. **Get a free API key** from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. **Set environment variable:**
   ```bash
   export ALPHA_VANTAGE_API_KEY="your_key_here"
   ```
3. **Restart backend:**
   ```bash
   cd backend
   mix phx.server
   ```

**Without API key?** Demo mode provides data for: `AAPL`, `MSFT`, `VWCE`, `VOO`

## API Endpoint

**POST** `/api/securities/enrich`

### Request

```json
{
  "identifier": "AAPL",
  "type": "auto"  // optional: "ticker", "isin", "wkn", "auto"
}
```

### Parameters

- `identifier` (required): The security identifier (ticker symbol, ISIN, or WKN)
- `type` (optional): The type of identifier. Defaults to "auto" which auto-detects the type
  - `ticker`: Ticker symbol (e.g., "AAPL", "MSFT")
  - `isin`: International Securities Identification Number (e.g., "US0378331005")
  - `wkn`: Wertpapierkennnummer - German Securities Code (e.g., "865985")
  - `auto`: Auto-detect based on format

### Response

#### Success (200 OK)

```json
{
  "data": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "security_type": "stock",
    "exchange": "NASDAQ",
    "currency": "USD",
    "sector": "Technology",
    "country_of_domicile": "US",
    "market_cap": "2500000000000",
    "dividend_yield": "0.0052",
    "description": "Apple Inc. designs, manufactures..."
  }
}
```

#### Error Responses

**404 Not Found** - Security not found
```json
{
  "error": "Security not found"
}
```

**422 Unprocessable Entity** - ISIN/WKN conversion not supported
```json
{
  "error": "ISIN/WKN to ticker conversion not yet supported. Please use ticker symbol directly."
}
```

**503 Service Unavailable** - API error or rate limit
```json
{
  "error": "External API error. Please try again later."
}
```

## Data Sources

Multiple providers with automatic fallback:

1. **Alpha Vantage** (Primary)
   - Requires free API key
   - 25 requests/day (free tier)
   - Best coverage for US stocks and ETFs

2. **Demo Data** (Fallback)
   - No API key needed
   - Limited to popular tickers: AAPL, MSFT, VWCE, VOO
   - Useful for testing

### Supported Fields

| Field | Description | Provider |
|-------|-------------|----------|
| ticker | Stock ticker symbol | All |
| name | Full company/fund name | All |
| security_type | Type (stock, etf, mutual_fund) | All |
| exchange | Trading exchange | All |
| currency | Trading currency | All |
| sector | Business sector | Alpha Vantage |
| country_of_domicile | Country of incorporation | All |
| market_cap | Market capitalization | Alpha Vantage |
| dividend_yield | Annual dividend percentage | Alpha Vantage |
| description | Company/fund description | Alpha Vantage |

## Identifier Detection

### ISIN Format
- 12 characters
- Pattern: `[A-Z]{2}[A-Z0-9]{9}[0-9]`
- Example: `US0378331005` (Apple Inc.)
- **Status:** ❌ Not yet supported (conversion needed)

### WKN Format
- 6 characters  
- Pattern: `[A-Z0-9]{6}`
- Example: `865985` (Apple Inc.)
- **Status:** ❌ Not yet supported (conversion needed)

### Ticker Format
- Variable length
- Alphanumeric with optional dots/dashes
- Example: `AAPL`, `MSFT`, `VOO`, `VWCE.DE`
- **Status:** ✅ Fully supported

## Current Limitations

1. **ISIN/WKN Conversion**
   - Direct conversion not yet implemented
   - Users must provide ticker symbols
   - Future: OpenFIGI integration planned

2. **Rate Limiting**
   - Free tier: 25 requests/day, 5/minute
   - No caching yet (each request hits API)
   - Premium tier available for unlimited access

3. **International Coverage**
   - Best for US markets
   - European stocks may need exchange suffix (e.g., `SAP.DE`)
   - Some international ETFs may not be available

4. **Response Time**
   - First request: ~1-2 seconds (API call)
   - Future: Database caching will improve speed

## Usage Examples

### cURL Examples

**With Authentication:**
```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -H "Cookie: _wealth_backend_key=<your-session-cookie>" \
  -d '{"identifier": "AAPL"}'
```

**US Stock:**
```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "MSFT", "type": "ticker"}'
```

**European ETF (with exchange):**
```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "VWCE.DE", "type": "ticker"}'
```

**ISIN (returns error for now):**
```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "IE00BFY0GT14", "type": "isin"}'
```

### Frontend Integration

The Auto-Fill button in the asset modal automatically calls this endpoint:

```typescript
// In AssetModal component
const handleEnrich = async () => {
  const result = await api.enrichSecurityMetadata(
    formData.isin,
    'auto'
  );
  
  if (result) {
    // Auto-populate form fields
    setFormData(prev => ({
      ...prev,
      name: result.name,
      currency: result.currency,
      // ... other fields
    }));
  }
};
```

## Troubleshooting

### No API Key Configured

**Symptom:** Only demo data works (AAPL, MSFT, etc.)

**Solution:**
1. Get API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Set environment variable:
   ```bash
   export ALPHA_VANTAGE_API_KEY="your_key"
   ```
3. Restart backend

### Rate Limit Exceeded

**Symptom:** 503 errors after 25 requests

**Log message:**
```
[warning] Alpha Vantage rate limit: Thank you for using Alpha Vantage!
```

**Solutions:**
- Wait 24 hours for daily limit reset
- Use demo mode for common tickers
- Consider premium tier ($49.99/month unlimited)
- Implement caching (future feature)

### Security Not Found

**Symptom:** 404 error for valid ticker

**Common causes:**
1. **Incorrect ticker** - Verify symbol is correct
2. **Missing exchange suffix** - Try adding `.DE`, `.L`, etc.
3. **Delisted security** - Company may no longer trade
4. **Not in Alpha Vantage** - Some securities not covered

**Try:**
```bash
# Without suffix
curl ... -d '{"identifier": "VWCE"}'

# With exchange suffix  
curl ... -d '{"identifier": "VWCE.DE"}'
```

### Network Errors

**Symptom:** 503 errors, timeout messages

**Check:**
1. Internet connectivity
2. Firewall/proxy settings
3. Alpha Vantage status: [status.alphavantage.co](https://status.alphavantage.co/)

### Detailed Logs

Enable detailed logging:

```bash
# Backend logs
tail -f backend/_build/dev/logs/dev.log

# Look for:
[info] Successfully enriched AAPL with Alpha Vantage: 8 fields
[warning] Alpha Vantage returned empty data for: INVALID
[error] HTTP error fetching from Alpha Vantage: timeout
```

## Configuration

### Environment Variables

```bash
# Required for production use
export ALPHA_VANTAGE_API_KEY="your_key_here"

# Optional: Set timeout (milliseconds)
export ENRICHER_TIMEOUT=10000
```

### Config File

Edit `backend/config/dev.exs`:

```elixir
config :wealth_backend,
  alpha_vantage_api_key: System.get_env("ALPHA_VANTAGE_API_KEY"),
  enricher_timeout: 10_000
```

## Future Enhancements

### Planned Features

1. **ISIN/WKN Support** ⏳
   - OpenFIGI API integration
   - Automatic ticker lookup
   - European securities focus

2. **Response Caching** ⏳
   - Store enriched data in database
   - Configurable TTL (e.g., 24 hours)
   - Background refresh jobs

3. **Multiple Providers** ⏳
   - Finnhub (international stocks)
   - IEX Cloud (US real-time)
   - Automatic fallback chain

4. **Batch Enrichment** ⏳
   - Enrich multiple securities at once
   - Optimize API usage
   - Progress tracking

5. **Advanced Fields** ⏳
   - Historical performance
   - Risk metrics
   - ESG scores
   - Dividend history

### Want to Contribute?

See the implementation in:
- `backend/lib/wealth_backend/portfolio/metadata_enricher.ex`
- `backend/lib/wealth_backend_web/controllers/security_controller.ex`

Pull requests welcome!

## Testing

### Unit Tests

```bash
cd backend
mix test test/wealth_backend/portfolio/metadata_enricher_test.exs
```

### Integration Tests

```bash
# Test with real API (uses 1 API call)
mix test test/wealth_backend_web/controllers/security_controller_test.exs
```

### Manual Testing

Test script:

```bash
#!/bin/bash
# test_enrichment.sh

API_URL="http://localhost:4000/api/securities/enrich"
COOKIE="_wealth_backend_key=your_session_cookie"

echo "Testing AAPL..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"identifier": "AAPL"}' | jq

echo "\nTesting MSFT..."
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"identifier": "MSFT"}' | jq
```

## Resources

### Documentation
- [Alpha Vantage Setup Guide](./ALPHA_VANTAGE_SETUP.md) - Detailed setup instructions
- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)
- [Phoenix Framework](https://hexdocs.pm/phoenix/overview.html)

### External Services
- [Get Alpha Vantage API Key](https://www.alphavantage.co/support/#api-key)
- [Alpha Vantage Status](https://status.alphavantage.co/)
- [Premium Pricing](https://www.alphavantage.co/premium/)

### Support

For issues:
1. Check logs for error details
2. Review [Alpha Vantage Setup Guide](./ALPHA_VANTAGE_SETUP.md)
3. Search existing GitHub issues
4. Open new issue with logs and request details

## Dependencies

```elixir
# mix.exs
{:httpoison, "~> 2.2"}  # HTTP client
{:jason, "~> 1.2"}       # JSON parsing
```

Both are already included in `mix.exs`.
