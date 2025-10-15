# Stock Price Caching Documentation

## Table of Contents
- [Overview](#overview)
- [Implementation Details](#implementation-details)
- [Cache Management](#cache-management)
- [Configuration](#configuration)
- [Performance Benefits](#performance-benefits)
- [Cache Timestamp Feature](#cache-timestamp-feature)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [API Rate Limits](#api-rate-limits)
- [Troubleshooting](#troubleshooting)

---

## Overview

The FinnhubService implements an in-memory caching system to reduce API calls and avoid hitting rate limits. This documentation covers the complete caching implementation including the cache timestamp display feature.

### Key Features
- ✅ In-memory caching with configurable duration (default: 1 minute for quotes)
- ✅ Automatic cache validation and expiration
- ✅ Cache management methods (clear, stats, timestamps)
- ✅ Cache statistics exposed via API endpoints
- ✅ React components display cache status
- ✅ Multi-service caching (Finnhub quotes + FX rates)
- ✅ 97.76% test coverage for Finnhub, 96.66% for FX service

---

## Implementation Details

### Cache Structure

```javascript
cache = new Map(); 
// Structure: { symbol: { data: {...quoteData}, timestamp: Date.now() } }
```

**Example:**
```javascript
{
  "AAPL": {
    data: { symbol: "AAPL", current: 150.50, ... },
    timestamp: 1696598400000
  },
  "VOO": {
    data: { symbol: "VOO", current: 385.20, ... },
    timestamp: 1696598402000
  }
}
```

### Cache Lifecycle

1. **First Request**: API call is made, result is stored in cache with timestamp
2. **Subsequent Requests** (within cache duration): Return cached data, no API call
3. **After Expiration** (> 1 minute): Cache is invalid, new API call is made

### Data Flow

```
Request → Check Cache → Valid? → Return Cached Data
                          ↓ Invalid
                      Fetch API
                          ↓
                      Store in Cache
                          ↓
                      Return Fresh Data
```

---

## Cache Management

### Core Methods

#### `constructor(apiKey, cacheDurationMs = 60000)`
Creates a new FinnhubService instance with optional cache duration.

```javascript
const service = new FinnhubService(apiKey, 60000); // 1 minute cache
```

#### `isCacheValid(symbol)`
Check if cached data is still valid for a symbol.

```javascript
service.isCacheValid('AAPL'); // returns boolean
```

#### `getCachedQuote(symbol)`
Get cached quote if available and valid, returns null otherwise.

```javascript
const quote = service.getCachedQuote('AAPL');
```

#### `setCachedQuote(symbol, data)`
Manually store quote in cache with current timestamp.

```javascript
service.setCachedQuote('AAPL', quoteData);
```

#### `clearCache()`
Clear all cached quotes.

```javascript
service.clearCache();
```

#### `clearCachedQuote(symbol)`
Clear cache for a specific symbol.

```javascript
service.clearCachedQuote('AAPL');
```

#### `getCacheStats()`
Get comprehensive cache statistics including timestamps.

```javascript
const stats = service.getCacheStats();
// Returns:
// {
//   size: 10,
//   symbols: ['AAPL', 'VOO', 'GOOGL', ...],
//   cacheDurationMs: 60000,
//   oldestCacheTime: 1696598400000,
//   newestCacheTime: 1696598460000
// }
```

### Timestamp Methods

#### `getOldestCacheTimestamp()`
Returns the timestamp of the oldest cached quote (when first data was fetched).

```javascript
const timestamp = service.getOldestCacheTimestamp();
// Returns: 1696598400000 or null if cache is empty
```

#### `getNewestCacheTimestamp()`
Returns the timestamp of the most recently cached quote.

```javascript
const timestamp = service.getNewestCacheTimestamp();
// Returns: 1696598460000 or null if cache is empty
```

---

## Configuration

### Default Configuration

```javascript
// 1 minute cache (60000ms)
const service = createFinnhubService(apiKey);
```

### Custom Duration

```javascript
// 5 minute cache
const service = createFinnhubService(apiKey, 300000);

// 30 second cache (near real-time)
const service = createFinnhubService(apiKey, 30000);

// No caching (0ms)
const service = createFinnhubService(apiKey, 0);
```

### Use Case Recommendations

| Use Case | Cache Duration | Reason |
|----------|----------------|--------|
| Real-time trading dashboard | 30 seconds | Balance freshness with API limits |
| Portfolio overview | 1-5 minutes | Less time-sensitive data |
| Historical analysis | 10+ minutes | Data doesn't change frequently |
| Development/testing | 0 seconds | Always fetch fresh data |

---

## Performance Benefits

### Speed Improvement

- **Cached responses**: < 1ms (memory lookup)
- **API calls**: 200-500ms (network request)
- **Speed improvement**: 200-500x faster for cached data

### API Call Reduction

**Without Caching:**
- 10 stocks × 5 refreshes = 50 API calls

**With Caching (1 minute):**
- 10 stocks × 1 initial load = 10 API calls
- Refreshes within 1 minute = 0 API calls
- **80% reduction in API calls**

### Example Timeline

```
User visits /stonks/prices → 10 API calls (10 stocks)
  ↓
User refreshes 3 times in 30 seconds → 0 API calls (all cached)
  ↓
User waits 1 minute, refreshes → 10 API calls (cache expired)
  ↓
Total: 20 API calls instead of 50 (60% savings)
```

---

## Cache Information in API Responses

### Overview

The API endpoints include cache statistics in their responses, allowing React components to display accurate cache information.

### How It Works

1. Data is fetched from Finnhub API at **2:14:25 PM** → cached
2. User loads page at **2:15:30 PM** (within 1 minute)
3. API response includes `cacheStats` with oldest timestamp
4. React component displays: **"Last updated: 2:14:25 PM"**
5. After 1 minute, cache expires and new data is fetched

### API Response Structure

The `/api/prices-data` endpoint includes cache information:

```json
{
  "holdings": [...],
  "cacheStats": {
    "size": 10,
    "oldestTimestamp": 1696598400000
  }
}
```

### React Component Display

React components (`SummaryCards.tsx`) format and display the cache timestamp:

```typescript
const lastUpdated = new Date(cacheStats.oldestTimestamp).toLocaleString();
// Displays: "Last updated: 10/15/2025, 2:14:25 PM"
```

### Timestamp Selection

The API returns `oldestTimestamp` because:

1. **Represents initial fetch**: Shows when the batch of quotes was first retrieved
2. **Most conservative**: If symbols have different timestamps, oldest is safest
3. **User expectation**: Users expect to see when data became "stale"

---

## Usage Examples

### Basic Usage

```javascript
// Create service with default 1-minute cache
const finnhubService = createFinnhubService(apiKey);

// First call - fetches from API
const quote1 = await finnhubService.getQuote('AAPL');
console.log(`AAPL: $${quote1.current}`);

// Second call within 1 minute - returns cached data
const quote2 = await finnhubService.getQuote('AAPL');
console.log('Cached!');
```

### Portfolio Quotes (Server-Side)

```javascript
const holdings = await databaseService.getHoldings();
const enrichedHoldings = await finnhubService.getPortfolioQuotes(holdings);

// Enriched with cached quotes
enrichedHoldings.forEach(holding => {
  console.log(`${holding.name}: $${holding.quote.current}`);
});
```

### Cache Management

```javascript
// Get cache statistics
const stats = finnhubService.getCacheStats();
console.log(`Cached symbols: ${stats.size}`);
console.log(`Cache duration: ${stats.cacheDurationMs}ms`);
console.log(`Oldest data: ${new Date(stats.oldestCacheTime).toLocaleString()}`);

// Clear cache for specific symbol
finnhubService.clearCachedQuote('AAPL');

// Clear all cached quotes
finnhubService.clearCache();
```

### Force Refresh (Server-Side)

```javascript
// Cloudflare Worker endpoint for force refresh
case '/stonks/api/prices-data':
  if (url.searchParams.get('refresh') === 'true') {
    finnhubService.clearCache();
  }
  const quotes = await finnhubService.getQuotes(symbols);
  return Response.json({ quotes, ... });
```

### Cache Monitoring

```javascript
// Check if data is cached
if (finnhubService.isCacheValid('AAPL')) {
  console.log('Using cached data for AAPL');
} else {
  console.log('Will fetch fresh data for AAPL');
}

// Get cache age
const oldestTime = finnhubService.getOldestCacheTimestamp();
const ageMs = Date.now() - oldestTime;
console.log(`Cache is ${ageMs / 1000} seconds old`);
```

---

## Testing

### Test Coverage

**Total Tests: 456** (17 for Finnhub caching, 19 for API, 16 for FX service)

**Coverage:**
- Overall: 88.49%
- FinnhubService: 97.76%
- FxService: 96.66%
- React Components: 91.89-100%

### Cache Test Categories

1. **Cache Initialization** (3 tests)
   - Empty cache on creation
   - Custom cache duration
   - Default cache duration

2. **Cache Management** (5 tests)
   - Store and retrieve cached data
   - Cache freshness validation
   - Cache expiration after duration
   - Clear specific cached quote
   - Clear all cache

3. **Cache Statistics** (3 tests)
   - Accurate cache stats
   - Null timestamps for empty cache
   - Track oldest and newest timestamps

4. **getQuote with Caching** (3 tests)
   - Use cache on second call
   - Fetch new data after expiration
   - Handle exchange:symbol format

5. **Factory Function** (3 tests)
   - Default cache duration
   - Custom cache duration
   - Null handling

### Running Tests

```bash
# Run all tests
npm test

# Run cache-specific tests
npm test test/finnhubService.cache.test.js

# Run with coverage
npm run test:coverage
```

### Verify Caching Behavior

```javascript
// Test caching manually
console.time('First call');
const quote1 = await service.getQuote('AAPL');
console.timeEnd('First call'); // ~300ms

console.time('Cached call');
const quote2 = await service.getQuote('AAPL');
console.timeEnd('Cached call'); // ~1ms

// Check cache stats
console.log(service.getCacheStats());
// { size: 1, symbols: ['AAPL'], cacheDurationMs: 60000 }
```

---

## API Rate Limits

### Finnhub Free Tier

- **60 API calls/minute**
- **30 API calls/second**

### Cache Strategy Impact

**With 1-minute cache:**
- Max API calls per minute ≈ portfolio size
- Example: 20 stocks = max 20 calls/minute
- Safe buffer: 40 calls remaining for other requests

**Example: 10 Stock Portfolio**

| Action | Without Cache | With Cache |
|--------|---------------|------------|
| Initial load | 10 calls | 10 calls |
| Refresh after 30s | 10 calls | 0 calls |
| Refresh after 45s | 10 calls | 0 calls |
| Refresh after 70s | 10 calls | 10 calls |
| **Total (2 min)** | **40 calls** | **20 calls** |

---

## Troubleshooting

### "Prices not updating"

**Issue**: Prices show old data even after clicking refresh.

**Solution**: This is expected behavior within the cache window. Data is cached for 1 minute to reduce API calls.

**Options:**
1. Wait 1 minute for cache to expire
2. Clear cache programmatically: `finnhubService.clearCache()`
3. Reduce cache duration: `createFinnhubService(apiKey, 30000)` for 30 seconds

### "Slow loading on first request"

**Issue**: First page load takes 2-3 seconds for large portfolios.

**Solution**: This is normal due to sequential API calls. Subsequent requests within 1 minute will be instant (cached).

**Optimization ideas:**
- Reduce portfolio size
- Consider parallel API calls (if rate limits allow)
- Use longer cache duration for less time-sensitive data

### "Cache timestamps not showing"

**Issue**: "Last updated" shows current time instead of cache time.

**Solution**: 
- Check API response includes `cacheStats.oldestTimestamp`
- Ensure `getCacheStats()` is called on server-side before returning API response
- Verify cache is not empty: `getCacheStats().size > 0`
- Check React component is correctly parsing the timestamp

### "Different timestamps for different stocks"

**Issue**: Why does "Last updated" show oldest timestamp?

**Explanation**: The API returns the oldest timestamp to be conservative. This represents when the batch of quotes was first retrieved. If individual symbols are refreshed at different times, the oldest timestamp ensures users see when data became "stale."

### Rate Limit Errors

**Issue**: "Error: 429 Too Many Requests"

**Solution**:
1. Check cache is enabled (not set to 0ms)
2. Increase cache duration: `createFinnhubService(apiKey, 300000)` for 5 minutes
3. Reduce number of stocks in portfolio
4. Ensure `clearCache()` is not being called too frequently

---

## Migration Guide

### From No Caching

No migration needed! The caching feature is:
- ✅ Backward compatible
- ✅ Optional (default 1 minute)
- ✅ Can be disabled (set to 0ms)
- ✅ Transparent to existing code

```javascript
// Old code - still works
const service = createFinnhubService(apiKey);
await service.getQuote('AAPL');

// New code - with custom cache
const service = createFinnhubService(apiKey, 300000);
await service.getQuote('AAPL');
```

### From REST API to npm Package

**Note**: We use the REST API directly instead of the Finnhub npm package because Cloudflare Workers doesn't support Node.js modules (fs, path, etc.) that the Finnhub SDK requires.

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────┐
│      React Prices Page Component        │
│  - Fetches data from API                 │
│  - Displays holdings & cache info        │
│  - HoldingsTable, SummaryCards           │
└──────────────┬──────────────────────────┘
               │ HTTP GET
               ↓
┌─────────────────────────────────────────┐
│     Cloudflare Worker API Endpoint      │
│  - /api/prices-data                      │
│  - Calls FinnhubService                  │
│  - Returns JSON with cacheStats          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│        FinnhubService                    │
│  - Cache management (Map)                │
│  - getQuote() with caching               │
│  - getPortfolioQuotes()                  │
│  - getCacheStats()                       │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴─────────┐
     ↓                   ↓
┌─────────┐         ┌─────────┐
│  Cache  │         │ Finnhub │
│  (Map)  │         │   API   │
└─────────┘         └─────────┘
```

### File Structure

```
src/
  ├── finnhubService.js          # Caching logic and API integration
  ├── fxService.js               # FX rate caching
  ├── index.js                   # Cloudflare Worker with API endpoints
  └── client/
      ├── pages/PricesPage.tsx   # React prices page
      ├── components/
      │   └── prices/
      │       ├── HoldingsTable.tsx      # Displays holdings
      │       └── SummaryCards.tsx       # Shows cache timestamp
      └── hooks/
          └── usePricesData.ts   # Fetches data from API

test/
  ├── finnhubService.test.js              # API integration tests (19 tests)
  ├── finnhubService.cache.test.js        # Cache tests (17 tests)
  ├── fxService.test.js                   # FX caching tests (16 tests)
  └── client/
      ├── components/prices/
      │   ├── HoldingsTable.test.tsx      # 62 tests
      │   └── SummaryCards.test.tsx       # 12 tests
      └── hooks/
          └── usePricesData.test.ts       # 8 tests

docs/
  └── CACHING.md                  # This comprehensive documentation
```

---

## Future Enhancements

Potential improvements:

- [ ] Persistent caching (Redis/KV for distributed caching)
- [ ] Cache warming for popular symbols
- [ ] LRU eviction policy for memory management
- [ ] Conditional caching based on market hours
- [ ] WebSocket integration for real-time updates
- [ ] Per-symbol cache duration configuration
- [ ] Cache statistics logging/monitoring
- [ ] Automatic cache refresh before expiration
- [ ] Cache invalidation based on events
- [ ] Time-since-update indicator (e.g., "Updated 45 seconds ago")
- [ ] Countdown to cache expiration
- [ ] Color-coded data age (green: fresh, yellow: aging, red: stale)

---

## Summary

### Achievements

✅ **Reduces API calls by ~80%**  
✅ **Improves response time by 200-500x for cached data**  
✅ **Prevents rate limit issues**  
✅ **Maintains data freshness (1-minute default for quotes)**  
✅ **Dual-cache strategy (quotes + FX rates)**  
✅ **Comprehensive test coverage (97.76% FinnhubService, 96.66% FxService)**  
✅ **Cache statistics exposed via API**  
✅ **React components display cache info**  
✅ **Fully documented**  

### Key Metrics

- **456 total tests** (covering server-side and React components)
- **88.49% overall coverage**
- **97.76% FinnhubService coverage**
- **96.66% FxService coverage**
- **91.89-100% React component coverage**
- **1-minute default cache for quotes**
- **1-hour default cache for FX rates**
- **< 1ms cached response time**

---

## Quick Reference

### Common Operations

```javascript
// Create service
const service = createFinnhubService(apiKey, 60000);

// Get quote (cached)
const quote = await service.getQuote('AAPL');

// Check cache
const isValid = service.isCacheValid('AAPL');

// Get stats
const stats = service.getCacheStats();

// Clear cache
service.clearCache();

// Get timestamps
const oldest = service.getOldestCacheTimestamp();
const newest = service.getNewestCacheTimestamp();
```

### Cache Durations

| Duration | Milliseconds | Use Case |
|----------|--------------|----------|
| 30 sec | 30000 | Near real-time |
| 1 min | 60000 | Default/balanced |
| 5 min | 300000 | Portfolio overview |
| 15 min | 900000 | Historical analysis |
| No cache | 0 | Development/testing |

---

## FX Service Caching

The application also implements caching for currency exchange rates through the FX Service.

### FX Cache Features
- ✅ Separate cache for exchange rates (OpenExchangeRates API)
- ✅ Longer cache duration (default: 1 hour for exchange rates)
- ✅ Fallback rates when API is unavailable
- ✅ Support for multiple currencies (USD, SGD, AUD)
- ✅ Automatic cache invalidation on expiration

### FX Cache Configuration

```javascript
// Create FX service with custom cache duration
const fxService = createFxService(apiKey, 3600000); // 1 hour

// Get rates (cached)
const rates = await fxService.getLatestRates(['SGD', 'AUD']);

// Convert currency
const sgdAmount = fxService.convertFromUSD(100, 'SGD', rates);

// Clear FX cache
fxService.clearCache();
```

### Cache Strategy

The application uses two separate caching layers:

1. **Stock Quote Cache** (FinnhubService):
   - Duration: 1 minute
   - Purpose: Real-time price updates
   - Scope: Individual stock symbols

2. **Exchange Rate Cache** (FxService):
   - Duration: 1 hour
   - Purpose: Currency conversion rates
   - Scope: Multiple currencies (USD, SGD, AUD)

This dual-cache approach optimizes API usage while maintaining data freshness appropriate to each data type.

---

## React Integration

### Displaying Cache Information

React components receive cache information from the API and display it to users:

**API Endpoint** (`/api/prices-data`):
```javascript
// Cloudflare Worker
const cacheStats = finnhubService.getCacheStats();
return Response.json({
  holdings,
  cacheStats: {
    size: cacheStats.size,
    oldestTimestamp: cacheStats.oldestCacheTime
  }
});
```

**React Component** (`SummaryCards.tsx`):
```typescript
interface CacheStats {
  size: number;
  oldestTimestamp: number | null;
}

function SummaryCards({ cacheStats }: { cacheStats?: CacheStats }) {
  if (!cacheStats?.oldestTimestamp) return null;
  
  const lastUpdated = new Date(cacheStats.oldestTimestamp).toLocaleString();
  
  return (
    <div className="text-muted small">
      Last updated: {lastUpdated}
      <span className="badge bg-success ms-2">Cached</span>
    </div>
  );
}
```

**Custom Hook** (`usePricesData.ts`):
```typescript
export function usePricesData(currency: string, mode: string) {
  const [data, setData] = useState<PricesData | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/prices-data?currency=${currency}&mode=${mode}`);
      const json = await response.json();
      setData(json); // Includes cacheStats
    };
    fetchData();
  }, [currency, mode]);
  
  return data;
}
```

---

*Last updated: October 15, 2025*
