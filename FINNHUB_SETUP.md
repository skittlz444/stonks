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

### Prices Page (`/stonks/prices`)

The prices page displays:

- **Portfolio Summary Cards:**
  - Total Portfolio Value (stocks + cash)
  - Market Value (stocks only)
  - Cash Amount
  - Total Gain/Loss with percentage

- **Holdings Table:**
  - Stock name and symbol
  - Quantity held
  - Current price
  - Day change (with ▲/▼ indicators)
  - Total market value
  - Total gain/loss

- **Features:**
  - Real-time refresh button
  - Color-coded gains (green) and losses (red)
  - Responsive design
  - Auto-refresh on page load

## How It Works

### Symbol Extraction

The system automatically extracts stock symbols from your portfolio holdings:

- **Input:** `BATS:VOO` (format used in portfolio)
- **Extracted:** `VOO` (symbol for Finnhub API)
- **Works with:** `NASDAQ:AAPL`, `NYSE:JPM`, etc.

### API Response

Finnhub returns the following data:
- `c` - Current price
- `h` - High price of the day
- `l` - Low price of the day
- `o` - Open price of the day
- `pc` - Previous close price
- `t` - Timestamp

### Calculated Metrics

The service calculates:
- **Change:** Current price - Previous close
- **Change %:** (Change / Previous close) × 100
- **Market Value:** Quantity × Current price
- **Gain/Loss:** Quantity × (Current price - Average cost)

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

### Getting Portfolio Quotes

```javascript
const holdings = await databaseService.getCurrentHoldings();
const enrichedHoldings = await finnhubService.getPortfolioQuotes(holdings);

enrichedHoldings.forEach(holding => {
  console.log(`${holding.name}: $${holding.marketValue}`);
});
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
- The prices page makes one API call per holding on first load
- Subsequent refreshes within 1 minute use cached data (0 API calls)
- After 1 minute, the cache expires and new API calls are made
- Example: 10 stock portfolio = 10 API calls initially, then 0 for the next minute

## Error Handling

The system gracefully handles:
- Missing API key (shows warning message)
- API failures (displays error per stock)
- Network issues (caught and displayed)
- Invalid symbols (error message in table)

## Testing

Access the prices page at:
- **Local:** `http://localhost:8787/stonks/prices`
- **Production:** `https://your-domain.com/stonks/prices`

## Navigation

The prices page is accessible from:
- Configuration page (📊 Live Prices button)
- Direct URL: `/stonks/prices`

And includes links to:
- Ticker View
- Grid Charts
- Large Charts
- Configuration

## Security Notes

- ✅ `.env` file is in `.gitignore` (never committed)
- ✅ API key stored as Cloudflare secret in production
- ✅ No client-side exposure of API key
- ✅ Server-side API calls only

## Troubleshooting

### "Finnhub API Key Required" message

**Solution:** Create a `.env` file with your API key and restart the dev server.

### "Error: 401 Unauthorized"

**Solution:** Your API key is invalid. Check the key in your `.env` file.

### Prices not updating

**Solution:** Prices are cached for 1 minute. If you need fresh data immediately, wait 1 minute or clear the cache programmatically.

### Slow loading on first request

**Solution:** This is normal for larger portfolios due to sequential API calls. Subsequent requests within 1 minute will be instant (cached).

## Future Enhancements

Potential improvements:
- [x] Price caching to reduce API calls ✅ **Implemented (1-minute cache)**
- [ ] Persistent caching (Redis/KV for multi-worker environments)
- [ ] Historical price charts
- [ ] Price alerts
- [ ] Configurable auto-refresh intervals
- [ ] Performance metrics (52-week high/low)
- [ ] Dividend data
