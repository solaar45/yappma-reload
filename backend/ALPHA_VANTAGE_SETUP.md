# Alpha Vantage API Setup

## Why Alpha Vantage?

Yahoo Finance has restricted their free API access. Alpha Vantage provides a reliable free alternative for stock and ETF data enrichment.

## Getting Your Free API Key

1. Visit [Alpha Vantage Support](https://www.alphavantage.co/support/#api-key)
2. Fill out the simple form (just email and name)
3. You'll receive your API key immediately via email
4. **Free tier includes:**
   - 25 API calls per day
   - 5 API calls per minute
   - No credit card required

## Setup Instructions

### Option 1: Environment Variable (Recommended)

**Linux/macOS:**
```bash
export ALPHA_VANTAGE_API_KEY="your_api_key_here"
```

Add to your `~/.bashrc`, `~/.zshrc`, or `~/.profile` to make it permanent:
```bash
echo 'export ALPHA_VANTAGE_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
$env:ALPHA_VANTAGE_API_KEY="your_api_key_here"
```

Permanent (System Environment Variables):
```powershell
[System.Environment]::SetEnvironmentVariable('ALPHA_VANTAGE_API_KEY', 'your_api_key_here', 'User')
```

### Option 2: Config File

Edit `backend/config/dev.exs`:
```elixir
config :wealth_backend, :alpha_vantage_api_key, "your_api_key_here"
```

⚠️ **Warning:** Don't commit your API key to version control!

### Option 3: Demo Mode

Without an API key, the system falls back to demo data for common tickers:
- AAPL (Apple Inc.)
- MSFT (Microsoft Corporation)
- VWCE (Vanguard FTSE All-World ETF)
- VOO (Vanguard S&P 500 ETF)

Other tickers will return "not found" errors.

## Verifying Setup

1. **Start the backend:**
   ```bash
   cd backend
   mix phx.server
   ```

2. **Test the API:**
   ```bash
   curl -X POST http://127.0.0.1:4000/api/securities/enrich \
     -H "Content-Type: application/json" \
     -H "Cookie: _wealth_backend_key=$(cat .cookie)" \
     -d '{"identifier": "AAPL"}'
   ```

3. **Expected response:**
   ```json
   {
     "data": {
       "ticker": "AAPL",
       "name": "Apple Inc.",
       "security_type": "stock",
       "exchange": "NASDAQ",
       "currency": "USD",
       "sector": "Technology",
       "country_of_domicile": "US"
     }
   }
   ```

## Rate Limits

**Free Tier Limits:**
- 25 requests per day
- 5 requests per minute

**Handling Rate Limits:**

The system will return a 503 error if rate limits are exceeded. In the logs you'll see:
```
[warning] Alpha Vantage rate limit: Thank you for using Alpha Vantage!
```

**Tips to manage rate limits:**
- Cache results in your database (future feature)
- Batch your enrichment requests
- Upgrade to Premium ($49.99/month) for unlimited requests if needed

## Troubleshooting

### "API key not configured" in logs

**Check environment variable:**
```bash
echo $ALPHA_VANTAGE_API_KEY
```

Should print your API key. If empty:
- Re-export the variable
- Restart your terminal/IDE
- Check for typos in variable name

### "Rate limit" errors

You've exceeded the free tier limits. Options:
- Wait 24 hours for daily limit reset
- Wait 1 minute for per-minute limit reset  
- Use demo mode for common tickers
- Upgrade to premium tier

### "Not found" errors

**Possible causes:**
1. **Invalid ticker symbol** - Verify the correct ticker
2. **Non-US stocks** - Try adding exchange suffix (e.g., `SAP.DE` for German stocks)
3. **Delisted security** - Security may no longer trade
4. **ETF not in database** - Some ETFs may not be covered

**For European ETFs:**
- Use ticker with exchange suffix: `VWCE.DE`, `VUSA.L`
- May require different provider (future feature)

### No data returned

**Check logs for details:**
```bash
tail -f backend/_build/dev/logs/dev.log
```

Look for:
- `[info] Successfully enriched ...` = Success
- `[warning] Alpha Vantage error ...` = API error
- `[error] HTTP error ...` = Network issue

## Alternative Providers (Future)

Planned integrations:
- **Finnhub** - Good for international stocks
- **IEX Cloud** - Real-time US market data
- **OpenFIGI** - ISIN/WKN to ticker conversion
- **Yahoo Finance** - As fallback (limited)

## API Response Fields

Alpha Vantage provides:

| Field | Description | Example |
|-------|-------------|----------|
| ticker | Stock symbol | "AAPL" |
| name | Company name | "Apple Inc." |
| security_type | Type of security | "stock", "etf" |
| exchange | Trading exchange | "NASDAQ" |
| currency | Trading currency | "USD" |
| sector | Business sector | "Technology" |
| country_of_domicile | Country | "US" |
| market_cap | Market capitalization | "2500000000000" |
| dividend_yield | Annual dividend % | "0.0052" |
| description | Company description | "Apple Inc. designs..." |

## Resources

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [API Key Request](https://www.alphavantage.co/support/#api-key)
- [Pricing & Limits](https://www.alphavantage.co/premium/)
- [Status Page](https://status.alphavantage.co/)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs for detailed error messages
3. Verify your API key is valid on Alpha Vantage website
4. Open an issue on GitHub with log excerpts
