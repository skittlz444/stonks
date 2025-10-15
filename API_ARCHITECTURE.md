# API Architecture Documentation

## Overview

The Stonks Portfolio application uses a **modern React/TypeScript architecture** with client-side rendering for all pages, backed by JSON API endpoints served from a Cloudflare Worker.

## Architecture Pattern

All six pages use **React with TypeScript** for client-side rendering:
- `/stonks/ticker` - React + TradingView ticker tape
- `/stonks/charts` - React + TradingView chart grid
- `/stonks/charts/large` - React + TradingView large charts
- `/stonks/charts/advanced` - React + TradingView advanced charts
- `/stonks/prices` - React + API data (holdings, quotes, transactions)
- `/stonks/config` - React + API data (portfolio management)

## React Application Flow

```
User Request → Cloudflare Worker
              ↓
         Minimal HTML Shell (<div id="root">)
              ↓
         Client Browser
              ↓
         Load React Bundle (Vite build)
              ↓
         React App Initializes
              ↓
         Fetch Data from API Endpoints
              ↓
         React Components Render with Data
              ↓
         User Interactions Update State
```

## API Endpoints

### 1. Prices Data API

**Endpoint**: `GET /stonks/api/prices-data`

**Query Parameters**:
- `mode` - Optional: `rebalance` for rebalancing mode
- `currency` - Optional: `USD`, `SGD`, or `AUD` (default: USD)

**Response Structure**:
```json
{
  "holdings": [
    {
      "name": "Vanguard S&P 500 ETF",
      "code": "BATS:VOO",
      "quantity": 10,
      "target_weight": 50,
      "quote": {
        "current": 385.20,
        "change": 2.15,
        "changePercent": 0.56
      },
      "costBasis": 3500.00,
      "marketValue": 3852.00,
      "gain": 352.00,
      "gainPercent": 10.06
    }
  ],
  "cashAmount": 1000.00,
  "closedPositions": [...],
  "fxRates": { "SGD": 1.35, "AUD": 1.52 },
  "fxAvailable": true,
  "cacheStats": {
    "size": 10,
    "oldestTimestamp": 1696598400000
  },
  "rebalanceMode": false,
  "currency": "USD"
}
```

**Optimizations**:
- Parallel database queries using `Promise.all()`
- Minimal payload with only required fields
- Closed positions fetched separately (not in rebalance mode)
- FX rates cached for 1 hour
- Stock quotes cached for 1 minute

### 2. Config Data API

**Endpoint**: `GET /stonks/api/config-data`

**Response Structure**:
```json
{
  "visibleHoldings": [
    {
      "id": 1,
      "name": "Vanguard S&P 500 ETF",
      "code": "BATS:VOO",
      "quantity": 10,
      "target_weight": 50
    }
  ],
  "hiddenHoldings": [...],
  "transactions": [...],
  "cashAmount": 1000.00,
  "portfolioName": "My Portfolio",
  "totalTargetWeight": 100
}
```

**Optimizations**:
- Parallel database queries using `Promise.all()`
- Minimal payload with only required fields
- All data in single response
- Transaction calculations server-side

## React Application Structure

### Component Architecture

**Pages** (`src/client/pages/`):
- `PricesPage.tsx` - Portfolio prices and rebalancing
- `ConfigPage.tsx` - Portfolio configuration
- `TickerPage.tsx` - Ticker tape view
- `ChartGridPage.tsx` - Chart grid view
- `ChartLargePage.tsx` - Large charts view
- `ChartAdvancedPage.tsx` - Advanced charts view

**Components** (`src/client/components/`):
- **Common**: Navigation, LoadingSpinner, ErrorMessage, CompanyProfileModal
- **Prices**: HoldingsTable, ClosedPositionsTable, PricesControls, SummaryCards, ColumnControls

**Hooks** (`src/client/hooks/`):
- `usePricesData.ts` - Fetches data from `/api/prices-data`
- `useConfigData.ts` - Fetches data from `/api/config-data`
- `useHoldings.ts` - Manages holdings state

**Utilities** (`src/client/utils/`):
- `formatting.ts` - Currency, number, percentage formatting
- `rebalancing.ts` - Portfolio rebalancing calculations

**Types** (`src/client/types/`):
- `index.ts` - TypeScript interfaces (Holding, Quote, Transaction, etc.)

## Performance Benefits

### 1. Parallel Database Queries

**Before** (Sequential):
```javascript
const holdings = await db.getHoldings();
const transactions = await db.getTransactions();
const cash = await db.getCashAmount();
// Total time: ~300ms
```

**After** (Parallel):
```javascript
const [holdings, transactions, cash] = await Promise.all([
  db.getHoldings(),
  db.getTransactions(),
  db.getCashAmount()
]);
// Total time: ~100ms (3x faster)
```

### 2. Optimized Payloads

**API Response** (minimal fields only):
```json
{
  "name": "Apple Inc",
  "code": "AAPL",
  "quantity": 10,
  "target_weight": 25,
  "quote": {
    "current": 150.50,
    "change": 2.15,
    "changePercent": 1.45
  },
  "costBasis": 1400.00,
  "marketValue": 1505.00,
  "gain": 105.00,
  "gainPercent": 7.5
}
```

**Benefits**:
- Smaller payload size (20-30% reduction)
- Faster network transfer
- Reduced parsing time
- Only essential data for UI

### 3. Code Splitting & Lazy Loading

- **Vite Build**: Automatic code splitting for shared dependencies
- **Bundle Sizes**: ~71 kB gzipped total for all 6 pages
- **Shared Chunks**: React, common components extracted automatically
- **On-Demand Loading**: TradingView widgets loaded when visible
- **Conditional Fetching**: Closed positions only in normal mode (not rebalance)

## Error Handling

### API Endpoints

**Missing API Keys**:
```json
{
  "error": "Finnhub API key not configured"
}
```
Status: `503 Service Unavailable`

**Database Errors**:
```json
{
  "error": "Database query failed"
}
```
Status: `500 Internal Server Error`

### Client-Side

**Network Errors**:
- Display error message in error state container
- Provide retry button
- Link to configuration page

**Loading States**:
- Show spinner during data fetch
- Hide spinner on success or error
- Smooth transition to content

## Testing

### API Endpoint Tests (35 tests)
- JSON response structure validation
- Query parameter handling (currency, mode)
- Error scenarios (missing API keys, database failures)
- Parallel query validation
- Response format consistency

### React Component Tests (239 tests)
- **HoldingsTable**: 62 tests (sorting, filtering, rebalancing)
- **ClosedPositionsTable**: 18 tests (profit/loss calculations)
- **PricesControls**: 15 tests (currency, mode switching)
- **Common Components**: 49 tests (navigation, modals, loading states)
- **Utility Functions**: 42 tests (formatting, rebalancing algorithms)
- **Custom Hooks**: 23 tests (data fetching, state management)

**Test Coverage**:
- Server-side: 88.64% (Cloudflare Worker, APIs, services)
- React Components: 91.89-100% (UI components, hooks, utilities)
- Overall: 88.49% (456 tests passing)

## Implementation Pattern

### React/TypeScript Architecture

**Cloudflare Worker** (index.js):
```javascript
// Serve minimal HTML shell
case '/stonks/prices':
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>...</head>
      <body>
        <div id="root"></div>
        <script type="module" src="/stonks/dist/prices.js"></script>
      </body>
    </html>
  `);

// Serve API data
case '/stonks/api/prices-data':
  const [holdings, transactions, cash] = await Promise.all([
    db.getHoldings(),
    db.getTransactions(),
    db.getCashAmount()
  ]);
  const quotes = await finnhub.getQuotes(holdings);
  return Response.json({ holdings, quotes, cash, ... });
```

**React Page Component** (PricesPage.tsx):
```typescript
export function PricesPage() {
  const { data, loading, error } = usePricesData(currency, mode);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <>
      <Navigation />
      <PricesControls {...} />
      <HoldingsTable holdings={data.holdings} {...} />
      {!rebalanceMode && <ClosedPositionsTable {...} />}
    </>
  );
}
```

**Custom Hook** (usePricesData.ts):
```typescript
export function usePricesData(currency: string, mode: string) {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`/stonks/api/prices-data?currency=${currency}&mode=${mode}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [currency, mode]);
  
  return { data, loading, error };
}
```

## Best Practices

1. **Type Safety** - Use TypeScript interfaces for all data structures
2. **Optimize API Payloads** - Return only required fields in API responses
3. **Parallel Queries** - Use Promise.all() for independent database operations
4. **Error Handling** - Show user-friendly error messages with recovery options
5. **Loading States** - Display loading spinners during data fetching
6. **Caching Strategy** - 1-minute cache for quotes, 1-hour for FX rates
7. **Component Reusability** - Extract common UI patterns into shared components
8. **Custom Hooks** - Encapsulate data fetching logic in reusable hooks
9. **Code Splitting** - Let Vite automatically split bundles for optimal loading
10. **Test Coverage** - Maintain high test coverage (>85%) for reliability

## Technology Stack

- **Frontend**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 6.0 (fast builds, code splitting)
- **Testing**: Vitest 2.1 with React Testing Library
- **Backend**: Cloudflare Workers (edge computing)
- **Database**: Cloudflare D1 (serverless SQLite)
- **APIs**: Finnhub (stock prices), OpenExchangeRates (currency)
- **Charts**: TradingView widgets

## Future Enhancements

Potential improvements:
- **Real-time Updates**: WebSocket or Server-Sent Events for live prices
- **Offline Support**: Enhanced PWA with IndexedDB caching
- **Mobile App**: React Native version with shared code
- **Advanced Analytics**: Portfolio performance charts and metrics
- **Multi-Portfolio**: Support for multiple portfolio views
- **Watchlists**: Track stocks without ownership
- **Notifications**: Price alerts and rebalancing reminders

---

*Last updated: October 15, 2025*
