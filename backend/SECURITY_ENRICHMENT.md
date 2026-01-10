# Security Metadata Enrichment

## Overview

The security metadata enrichment feature automatically fetches additional information about securities (stocks, ETFs, bonds, etc.) from external data sources.

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
    "expense_ratio": "0.15",
    "distribution_type": "distributing",
    "benchmark_index": "Technology"
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

**503 Service Unavailable** - External API error
```json
{
  "error": "External API error. Please try again later."
}
```

**503 Service Unavailable** - Network error
```json
{
  "error": "Network error. Please check your connection."
}
```

**500 Internal Server Error** - Other errors
```json
{
  "error": "Failed to enrich security data"
}
```

## Data Source

Currently uses **Yahoo Finance API** for fetching security data.

### Supported Fields

- `ticker`: Stock ticker symbol
- `name`: Full company/fund name
- `security_type`: Type of security (stock, etf, mutual_fund, index_fund, bond)
- `exchange`: Exchange where security is traded
- `currency`: Trading currency
- `sector`: Business sector (for stocks)
- `country_of_domicile`: Country of incorporation/domicile
- `expense_ratio`: Total expense ratio (for funds/ETFs)
- `distribution_type`: Dividend distribution type (accumulating/distributing)
- `benchmark_index`: Benchmark index (for funds)

## Identifier Detection

### ISIN Format
- 12 characters
- Pattern: `[A-Z]{2}[A-Z0-9]{9}[0-9]`
- Example: `US0378331005` (Apple Inc.)

### WKN Format
- 6 characters
- Pattern: `[A-Z0-9]{6}`
- Example: `865985` (Apple Inc.)

### Ticker Format
- Variable length
- Alphanumeric
- Example: `AAPL`, `MSFT`, `VOO`

## Current Limitations

1. **ISIN/WKN Conversion**: Direct conversion from ISIN or WKN to ticker is not yet implemented. Users must provide ticker symbols directly.

2. **Data Source**: Only Yahoo Finance is currently supported. Future versions may add:
   - Alpha Vantage
   - IEX Cloud
   - OpenFIGI for ISIN/WKN lookup
   - Bundesanzeiger for German securities

3. **Rate Limiting**: No rate limiting is currently implemented. Yahoo Finance may throttle requests.

4. **Caching**: Results are not cached. Each request fetches fresh data.

## Future Enhancements

### Planned Features

1. **ISIN/WKN Mapping Service**
   - Integrate OpenFIGI API for identifier conversion
   - Support direct ISIN/WKN lookups

2. **Multiple Data Sources**
   - Add fallback providers
   - Allow configuration of preferred data source

3. **Caching**
   - Cache enriched data in database
   - Configurable TTL for cached data
   - Background refresh jobs

4. **Rate Limiting**
   - Implement per-user rate limits
   - Queue system for batch enrichment

5. **Additional Fields**
   - Historical performance metrics
   - Risk ratings
   - ESG scores
   - Dividend history

## Examples

### Using Ticker Symbol

```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "AAPL", "type": "ticker"}'
```

### Auto-Detection

```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "AAPL"}'
```

### Using ISIN (Currently Returns Error)

```bash
curl -X POST http://localhost:4000/api/securities/enrich \
  -H "Content-Type: application/json" \
  -d '{"identifier": "US0378331005", "type": "isin"}'
```

**Response:**
```json
{
  "error": "ISIN/WKN to ticker conversion not yet supported. Please use ticker symbol directly."
}
```

## Troubleshooting

### Common Issues

1. **422 Error - Invalid Type**
   - Ensure `type` parameter is one of: "ticker", "isin", "wkn", "auto"
   - Parameter is case-insensitive

2. **404 Error - Not Found**
   - Verify ticker symbol is correct
   - Some securities may not be available on Yahoo Finance
   - Try alternative ticker format (e.g., add exchange suffix)

3. **503 Error - Service Unavailable**
   - Yahoo Finance API may be temporarily down
   - Check network connectivity
   - Wait a moment and retry

4. **Timeout Errors**
   - Default timeout is 10 seconds
   - Network issues or slow API response
   - Retry the request

### Logging

The enrichment service logs detailed information at various levels:

- **Info**: Successful operations, identifier types detected
- **Warning**: API errors, missing data, unsuccessful lookups
- **Error**: Network failures, parsing errors, exceptions

Check Phoenix logs for detailed error messages:

```bash
tail -f backend/_build/dev/logs/dev.log
```

## Configuration

No configuration is currently required. The service uses:

- Yahoo Finance API (no API key needed)
- 10-second timeout for HTTP requests
- Standard HTTP headers to avoid rate limiting

## Testing

Run tests with:

```bash
cd backend
mix test test/wealth_backend/portfolio/metadata_enricher_test.exs
```

## Dependencies

- `HTTPoison` ~> 2.2 - HTTP client
- `Jason` ~> 1.2 - JSON parsing

Both dependencies are already included in `mix.exs`.
