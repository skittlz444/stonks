# Live Stock Prices Feature

This feature integrates real-time stock price data using the Finnhub API.

## Setup Instructions

### 1. Get a Free Finnhub API Key

1. Visit [https://finnhub.io/](https://finnhub.io/)
2. Sign up for a free account
3. Copy your API key from the dashboard

### 2. Configure Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace `your_api_key_here` with your actual Finnhub API key:
   ```
   FINNHUB_API_KEY=your_actual_api_key
   ```

3. Restart your development server:
   ```bash
   npm run dev
   ```

### 3. Configure Production Deployment

For production (Cloudflare Workers), set the API key as a secret:

```bash
wrangler secret put FINNHUB_API_KEY
```

When prompted, paste your Finnhub API key.

## Features

### Finnhub Service (`src/finnhubService.js`)

The Finnhub service provides several methods with built-in caching:

- **`getQuote(symbol)`** - Get real-time quote for a single stock (cached)
- **`getQuotes(symbols)`** - Get quotes for multiple stocks (cached)
- **`getPortfolioQuotes(holdings)`** - Get quotes enriched with portfolio data (cached)
- **`extractSymbol(code)`** - Extract symbol from exchange:symbol format (e.g., "BATS:VOO" → "VOO")
- **`clearCache()`** - Clear all cached quotes
- **`clearCachedQuote(symbol)`** - Clear cache for a specific symbol
- **`getCacheStats()`** - Get cache statistics (size, symbols, duration)

#### Caching

To reduce API calls and avoid rate limits, quotes are automatically cached for **1 minute**. This means:
- Multiple requests for the same symbol within 1 minute return cached data
- No API calls are made during the cache period
- Cache is automatically invalidated after 1 minute
- You can manually clear the cache if needed

### React Prices Page (`/stonks/prices`)

Built with **React and TypeScript**, the prices page displays:

- **Portfolio Summary Cards** (`SummaryCards.tsx`):
  - Total Portfolio Value (stocks + cash)
  - Market Value (stocks only)
  - Cash Amount
  - Total Gain/Loss with percentage
  - Cache timestamp

- **Holdings Table** (`HoldingsTable.tsx`):
  - Stock name and symbol (clickable for company profile)
  - Quantity held
  - Current price with day change (▲/▼ indicators)
  - Market value and cost basis
  - Total gain/loss with percentage
  - Target weight allocation
  - Sortable columns
  - Column visibility controls

- **Additional Features:**
  - Currency selector (USD, SGD, AUD)
  - Rebalancing mode with buy/sell recommendations
  - Closed positions table with profit/loss
  - Real-time loading states
  - Error handling with retry
  - Responsive design

## How It Works

### Architecture Flow

1. **React Component** requests data via `usePricesData` hook
2. **API Endpoint** (`/api/prices-data`) processes the request
3. **FinnhubService** fetches or returns cached quotes
4. **Database** provides holdings and transaction data
5. **API Response** returns enriched data with quotes
6. **React Components** render the data with full interactivity

### Symbol Extraction

The system automatically extracts stock symbols from your portfolio holdings:

- **Input:** `BATS:VOO` (format used in portfolio)
- **Extracted:** `VOO` (symbol for Finnhub API)
- **Works with:** `NASDAQ:AAPL`, `NYSE:JPM`, etc.

### API Response Structure

Finnhub returns quote data that is transformed to:
- `current` - Current price
- `change` - Price change from previous close
- `changePercent` - Percentage change
- `previous_close` - Previous closing price
- `high`, `low`, `open` - Daily price range
- `timestamp` - When the quote was fetched

### Calculated Metrics

The server-side service calculates:
- **Change:** Current price - Previous close
- **Change %:** (Change / Previous close) × 100
- **Market Value:** Quantity × Current price
- **Cost Basis:** Calculated from transaction history
- **Gain/Loss:** Market Value - Cost Basis
- **Gain/Loss %:** (Gain/Loss / Cost Basis) × 100

## Usage Examples

### Getting a Single Quote

```javascript
// Default cache duration: 1 minute (60000ms)
const finnhubService = createFinnhubService(apiKey);
const quote = await finnhubService.getQuote('AAPL');
console.log(`AAPL: $${quote.current}`);

// Custom cache duration: 5 minutes
const finnhubService = createFinnhubService(apiKey, 300000);
```

### Getting Portfolio Quotes (Server-Side)

```javascript
// In Cloudflare Worker API endpoint
const holdings = await databaseService.getHoldings();
const enrichedHoldings = await finnhubService.getPortfolioQuotes(holdings);

// Enriched with real-time quotes
enrichedHoldings.forEach(holding => {
  console.log(`${holding.name}: $${holding.quote.current}`);
});
```

### React Component Usage

```typescript
// In React component
import { usePricesData } from '@/hooks/usePricesData';

function PricesPage() {
  const { data, loading, error } = usePricesData('USD', 'normal');
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <HoldingsTable holdings={data.holdings} />;
}
```

### Cache Management

```javascript
// Get cache statistics
const stats = finnhubService.getCacheStats();
console.log(`Cached symbols: ${stats.size}`);
console.log(`Cache duration: ${stats.cacheDurationMs}ms`);

// Clear cache for a specific symbol
finnhubService.clearCachedQuote('AAPL');

// Clear all cached quotes
finnhubService.clearCache();
```

## API Rate Limits

**Free Tier:**
- 60 API calls/minute
- 30 API calls/second

**With Caching:**
- The API endpoint makes one Finnhub call per holding on first request
- React components fetch from the API endpoint (not directly from Finnhub)
- Subsequent requests within 1 minute use server-side cached data (0 Finnhub calls)
- After 1 minute, the cache expires and new Finnhub calls are made
- Example: 10 stock portfolio = 10 Finnhub calls initially, then 0 for the next minute
- Multiple users benefit from shared server-side cache

## Error Handling

The React application gracefully handles errors at multiple levels:

**Server-Side (FinnhubService):**
- Missing API key → Returns 503 Service Unavailable
- API failures → Catches errors and returns error objects per stock
- Network issues → Logged and returned in response
- Invalid symbols → Error message included in holding data

**Client-Side (React Components):**
- Loading states → `<LoadingSpinner />` during data fetch
- Error states → `<ErrorMessage />` with retry option
- Per-holding errors → Displayed inline in table
- Network failures → User-friendly error messages

## Testing

### Development
Access the React prices page at:
- **Local Dev Server:** `http://localhost:8787/stonks/prices`
- **React Dev Server:** `http://localhost:5173/stonks/prices` (with hot reload)
- **Production:** `https://your-domain.com/stonks/prices`

### API Endpoints
Test the API directly:
- **Prices Data:** `http://localhost:8787/stonks/api/prices-data`
- **With Currency:** `http://localhost:8787/stonks/api/prices-data?currency=SGD`
- **Rebalance Mode:** `http://localhost:8787/stonks/api/prices-data?mode=rebalance`

### Test Coverage
The Finnhub integration has comprehensive test coverage:
- **finnhubService.test.js:** 19 tests (97.76% coverage)
- **finnhubService.cache.test.js:** 17 tests (cache functionality)
- **React Component Tests:** 62 tests for HoldingsTable, 12 for SummaryCards

Run tests with:
```bash
npm test
npm run test:coverage
```

## Navigation

The prices page is accessible from:
- **Navigation Bar:** Available on all pages
- **Config Page:** Portfolio management interface
- **Direct URL:** `/stonks/prices`

The page includes navigation to:
- Ticker View (`/stonks/ticker`)
- Grid Charts (`/stonks/charts`)
- Large Charts (`/stonks/charts/large`)
- Advanced Charts (`/stonks/charts/advanced`)
- Configuration (`/stonks/config`)

## Security Notes

- ✅ `.env` file is in `.gitignore` (never committed)
- ✅ API key stored as Cloudflare secret in production
- ✅ No client-side exposure of API key
- ✅ All Finnhub API calls made server-side (Cloudflare Worker)
- ✅ React components receive only processed data (no API key)
- ✅ API endpoints are public but don't expose sensitive data

## Troubleshooting

### "Finnhub API Key Required" message

**Solution:** Create a `.env` file with your API key and restart the dev server.

### "Error: 401 Unauthorized"

**Solution:** Your API key is invalid. Check the key in your `.env` file.

### Prices not updating

**Solution:** Prices are cached server-side for 1 minute to reduce API calls. The React component will show the cached timestamp. Wait 1 minute for the cache to expire naturally, or refresh the page after the cache period.

### Slow loading on first request

**Solution:** This is normal for larger portfolios due to sequential Finnhub API calls. The React component displays a loading spinner during this time. Subsequent requests within 1 minute will be instant (served from cache).

## Future Enhancements

Potential improvements:
- [x] Price caching to reduce API calls ✅ **Implemented (1-minute cache)**
- [ ] Persistent caching (Redis/KV for multi-worker environments)
- [ ] Historical price charts
- [ ] Price alerts
- [ ] Configurable auto-refresh intervals
- [ ] Performance metrics (52-week high/low)
- [ ] Dividend data
