# API Architecture Documentation

## Overview

The Stonks Portfolio application uses a **hybrid rendering architecture** combining server-side and client-side rendering for optimal performance and user experience.

## Architecture Pattern

### Traditional Pages (Server-Side Rendering)
- `/stonks/ticker` - Full server-side rendering
- `/stonks/charts` - Full server-side rendering
- `/stonks/charts/large` - Full server-side rendering

### Modern Pages (Client-Side Rendering)
- `/stonks/prices` - API-based client-side rendering
- `/stonks/config` - API-based client-side rendering

## Client-Side Rendering Flow

```
User Request → Server
              ↓
         Skeleton HTML (with loading state)
              ↓
         Client Browser
              ↓
         Load JavaScript Module
              ↓
         Fetch Data from API
              ↓
         Render Content Dynamically
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
- Removed unnecessary fields: `hidden`, `created_at`, `updated_at` from holdings
- Removed excess quote fields: `symbol`, `high`, `low`, `open`, `previousClose`, `timestamp`
- Lazy loading of closed positions (only when not in rebalance mode)

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
- Removed unnecessary fields from holdings
- Consolidated all data in single response

## Client-Side JavaScript Modules

### 1. Prices Client Module

**File**: `public/client/prices.js`

**Exported Function**: `initializePricesPage(rebalanceMode, currency)`

**Features**:
- Fetches data from `/stonks/api/prices-data`
- Dynamically renders holdings table
- Implements sorting and filtering
- Handles column visibility controls
- Displays closed positions
- Shows loading and error states
- Integrates TradingView widgets

**Key Functions**:
- `initializePricesPage()` - Entry point
- `renderPricesPage()` - Main rendering logic
- `renderHoldingsTable()` - Table generation
- `calculateRebalancing()` - Rebalancing calculations
- `sortTable()` - Client-side sorting

### 2. Config Client Module

**File**: `public/client/config.js`

**Exported Function**: `initializeConfigPage()`

**Features**:
- Fetches data from `/stonks/api/config-data`
- Dynamically renders holdings and transactions
- Handles form submissions
- Manages visibility toggles
- Shows loading and error states

**Key Functions**:
- `initializeConfigPage()` - Entry point
- `renderConfigPage()` - Main rendering logic
- `renderHoldings()` - Holdings table generation
- `renderTransactions()` - Transaction list generation
- `handleFormSubmit()` - Form submission handling

## Wrapper Components

### 1. Prices Client Wrapper

**File**: `src/pricesClientWrapper.js`

**Function**: `generatePricesPageClient(rebalanceMode, currency)`

**Purpose**: Generates skeleton HTML with:
- Loading spinner
- Error state container
- Empty content containers
- Navigation structure
- Currency selector
- Script module loader

### 2. Config Client Wrapper

**File**: `src/configClientWrapper.js`

**Function**: `generateConfigPageClient()`

**Purpose**: Generates skeleton HTML with:
- Loading spinner
- Error state container
- Form containers
- Modal structures
- Script module loader

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

### 2. Payload Reduction

**Before**:
```json
{
  "id": 1,
  "name": "Apple Inc",
  "code": "AAPL",
  "quantity": 10,
  "target_weight": 25,
  "hidden": 0,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z",
  "quote": {
    "symbol": "AAPL",
    "current": 150.50,
    "change": 2.15,
    "changePercent": 1.45,
    "high": 152.00,
    "low": 148.00,
    "open": 149.00,
    "previousClose": 148.35,
    "timestamp": 1696598400000
  }
}
```

**After** (20-30% smaller):
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

### 3. Lazy Loading

- Closed positions only fetched when needed (not in rebalance mode)
- FX rates only fetched when non-USD currency requested
- Charts loaded on-demand via TradingView widgets

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

### API Endpoint Tests
- JSON response structure validation
- Query parameter handling
- Error scenarios (missing keys, database failures)
- Payload optimization verification
- Parallel query validation

### Client Wrapper Tests
- HTML structure generation
- Parameter passing
- Loading state containers
- Error state containers
- Navigation elements
- Module script loading

**Test Coverage**:
- API endpoints: Comprehensive (52 tests in index.test.js)
- Client wrappers: 100% (43 tests total)
- Client JavaScript: 0% (browser environment required)

## Migration Notes

### From Server-Side to Client-Side

**Old Pattern** (prices.js):
```javascript
export async function generatePricesPage(db, finnhub, fx, rebalanceMode, currency) {
  const holdings = await db.getHoldings();
  const quotes = await finnhub.getQuotes(holdings);
  // ... render HTML with data
  return new Response(html);
}
```

**New Pattern**:

**Server** (pricesClientWrapper.js):
```javascript
export function generatePricesPageClient(rebalanceMode, currency) {
  // Return skeleton HTML with loading state
  // Pass parameters to client JavaScript
  return new Response(skeletonHTML);
}
```

**API** (index.js):
```javascript
case '/stonks/api/prices-data':
  const [holdings, transactions, cash] = await Promise.all([...]);
  return new Response(JSON.stringify({ holdings, ... }));
```

**Client** (public/client/prices.js):
```javascript
export async function initializePricesPage(rebalanceMode, currency) {
  const response = await fetch('/stonks/api/prices-data?...');
  const data = await response.json();
  renderPricesPage(data);
}
```

## Best Practices

1. **Keep wrappers minimal** - Only structure, no data processing
2. **Optimize API payloads** - Remove unnecessary fields
3. **Use parallel queries** - Leverage Promise.all() for independent operations
4. **Handle errors gracefully** - Show user-friendly error messages
5. **Implement loading states** - Provide feedback during data fetching
6. **Cache appropriately** - Use 1-minute cache for quotes, 1-hour for FX rates
7. **Test thoroughly** - Ensure API contracts match client expectations

## Future Enhancements

Potential improvements:
- WebSocket support for real-time updates
- Request batching for multiple API calls
- Response compression (gzip)
- Client-side data caching (IndexedDB)
- Incremental rendering for large datasets
- Server-Sent Events (SSE) for live price updates

---

*Last updated: October 8, 2025*
