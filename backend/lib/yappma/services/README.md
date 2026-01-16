# FMP Services

This directory contains services for Financial Modeling Prep (FMP) API integration.

## FMPClient

Handles all communication with the FMP API:
- Security search (ticker and company name)
- Security validation
- Metadata enrichment

## FMPTypeCache

**Purpose:** Caches security types from FMP API lists in ETS for fast, accurate type detection.

### Cached Lists (100% Accurate)

| Type | Source Endpoint | Count | Accuracy |
|------|----------------|-------|----------|
| `crypto` | `/stable/cryptocurrency-list` | ~5000 | 100% |
| `forex` | `/stable/forex-list` | ~1000 | 100% |
| `commodity` | `/stable/commodities-list` | ~200 | 100% |
| `index` | `/stable/index-list` | ~500 | 100% |

### Heuristic-Based Types (~85-95% Accurate)

For securities not in cached lists, type is detected by name patterns:

| Type | Detection Method | Examples |
|------|------------------|----------|
| `etf` | Name contains "ETF" | "SPDR S&P 500 ETF" |
| `etn` | Name contains "ETN" or "Exchange Traded Note" | "iPath S&P 500 VIX ETN" |
| `etc` | Name contains "ETC" or "Exchange Traded Commodity" | "Xetra Gold ETC" |
| `etp` | Name contains "ETP" or "Exchange Traded Product" | Generic ETPs |
| `bond` | Name contains "Bond" or "Treasury" | "US Treasury Bond" |
| `mutual_fund` | Name contains "Mutual Fund" or "Fonds" | "Vanguard Total Stock Market Fund" |
| `reit` | Name contains "REIT" | "Vanguard Real Estate REIT" |
| `adr` | Name contains "ADR" | "Alibaba ADR" |
| `preferred_stock` | Symbol contains "-P" or name "Preferred" | "BAC-PL" |
| `warrant` | Name contains "Warrant" | "Tesla Warrant" |
| `right` | Name contains "Right" | "Subscription Rights" |
| `certificate` | Name contains "Certificate" or "Zertifikat" | German certificates |
| `stock` | Default fallback | Any other security |

### Type Hierarchy: Product Structure > Asset Class

When a security has multiple classifications, the **product structure** takes priority:

```elixir
# Example: "Vanguard Real Estate ETF"
# Could be: ETF (product) or REIT (asset class)
# Result: "etf" (product structure wins)
```

### Architecture

```
App Start
  ↓
FMPTypeCache GenServer starts
  ↓
Loads 4 lists from FMP API (background task)
  cryptocurrency-list
  forex-list
  commodities-list
  index-list
  ↓
Stores in ETS table :fmp_security_types
  {"BTC-USD" => "crypto"}
  {"EURUSD=X" => "forex"}
  {"GC=F" => "commodity"}
  {"^GSPC" => "index"}
  ↓
FMPTypeCacheScheduler
  ↓
Refreshes cache every 7 days
```

### Usage

**Automatic (in FMPClient):**
```elixir
# Called automatically during search
FMPClient.search_securities("BTC")
# Returns: [{ticker: "BTC-USD", type: "crypto", ...}]
```

**Manual Lookup:**
```elixir
FMPTypeCache.lookup_type("BTC-USD")
# => {:ok, "crypto"}

FMPTypeCache.lookup_type("AAPL")
# => {:error, :not_found}  # Falls back to heuristic
```

**Manual Refresh:**
```elixir
# In IEx console
FMPTypeCache.refresh()

# Check stats
FMPTypeCache.stats()
# => %{
#   total: 6700,
#   crypto: 5000,
#   forex: 1000,
#   commodity: 200,
#   index: 500,
#   last_refresh: ~U[2026-01-11 14:00:00Z]
# }
```

### Performance

- **ETS Lookup:** < 1 microsecond
- **API Calls on Start:** 4 (one-time)
- **API Calls per Search:** 1 (only FMP search)
- **Memory Usage:** ~1-2 MB (6700 symbols in ETS)

### Refresh Schedule

- **Initial Load:** At application startup (background task)
- **Periodic Refresh:** Every 7 days (automatic)
- **Manual Refresh:** `FMPTypeCache.refresh()` (IEx)

### Error Handling

If list loading fails:
- Cache continues with existing data
- Errors logged but don't crash app
- Next scheduled refresh will retry
- Heuristic fallback always available

## FMPTypeCacheScheduler

Simple GenServer-based scheduler for weekly cache refresh.
- No external dependencies (uses `:timer`)
- Runs every 7 days
- Triggers `FMPTypeCache.refresh()`
