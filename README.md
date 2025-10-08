# Stonks Portfolio Worker

A unified Cloudflare Worker that serves multiple stock portfolio visualization and management pages with transaction tracking and real-time pricing.

## Project Structure

```
├── src/
│   ├── index.js                # Main worker with routing logic and API endpoints
│   ├── ticker.js               # Ticker tape page handler
│   ├── chartGrid.js            # Chart grid page handler
│   ├── chartLarge.js           # Large chart page handler
│   ├── prices.js               # Live prices page (legacy server-side rendering)
│   ├── pricesClientWrapper.js  # Client-side prices page wrapper
│   ├── config.js               # Portfolio configuration page
│   ├── configClientWrapper.js  # Client-side config page wrapper
│   ├── databaseService.js      # D1 database abstraction layer
│   ├── finnhubService.js       # Finnhub API integration with caching
│   ├── fxService.js            # Currency conversion service (OpenExchangeRates)
│   ├── utils.js                # Shared HTML utilities and layout functions
│   ├── chartWidgets.js         # TradingView widget generation functions
│   └── dataUtils.js            # Data processing and formatting utilities
├── public/
│   ├── client/
│   │   ├── prices.js           # Client-side prices page JavaScript
│   │   └── config.js           # Client-side config page JavaScript
│   ├── icons/                  # PWA icons
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker for PWA
├── migrations/                 # D1 database migrations
├── test/                       # Comprehensive test suite (437 tests)
├── scripts/                    # Build scripts for cache versioning
├── package.json                # Node.js dependencies
└── wrangler.toml               # Cloudflare Worker configuration
```

## Routes

The worker serves the following routes:

### Page Routes
- `/stonks/ticker` - Ticker tape view with individual stock quotes
- `/stonks/charts` - Grid of mini chart widgets with market overview
- `/stonks/charts/large` - Large interactive charts with advanced features
- `/stonks/prices` - Live prices with sortable/filterable columns, gain/loss tracking, and closed positions
- `/stonks/prices?mode=rebalance` - Portfolio rebalancing mode with buy/sell recommendations
- `/stonks/prices?currency=SGD` - View prices in different currencies (USD, SGD, AUD)
- `/stonks/config` - Portfolio configuration interface for managing holdings, transactions, and settings

### API Routes (Client-Side Data)
- `/stonks/api/prices-data` - JSON endpoint for prices page data
- `/stonks/api/config-data` - JSON endpoint for config page data
- `/stonks/client/prices.js` - Client-side prices page JavaScript module
- `/stonks/client/config.js` - Client-side config page JavaScript module

### Architecture
The prices and config pages now use a **client-side rendering architecture**:
1. Server generates skeleton HTML with loading states
2. Client JavaScript fetches data from API endpoints
3. Dynamic rendering happens in the browser
4. Optimized for performance with parallel database queries and reduced payload sizes

## Setup and Deployment

### Prerequisites

1. Install Node.js and npm
2. Install Wrangler CLI: `npm install -g wrangler`
3. Authenticate with Cloudflare: `wrangler login`

### Configuration

1. **D1 Database Setup**: Create and configure the D1 database (see [D1_SETUP.md](D1_SETUP.md) for detailed instructions):
   ```bash
   wrangler d1 create stonks-portfolio
   wrangler d1 migrations apply stonks-portfolio --local
   wrangler d1 migrations apply stonks-portfolio --remote
   ```

2. **Finnhub API Setup**: Configure the Finnhub API for real-time stock prices (see [FINNHUB_SETUP.md](FINNHUB_SETUP.md)):
   - Sign up at https://finnhub.io
   - Add your API key to `.env` file or Cloudflare environment variables
   - Free tier provides sufficient requests for personal portfolio tracking

3. **Update wrangler.toml**: Configure your database ID and bindings in `wrangler.toml`

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## Features

### Modern Architecture ⚡
- **Client-Side Rendering**: Prices and config pages use API-based architecture
- **Optimized Performance**: Parallel database queries with Promise.all()
- **Reduced Payloads**: 20-30% smaller responses by removing unnecessary fields
- **Fast Loading**: Skeleton screens with smooth transitions
- **Real-time Updates**: 1-minute cache for stock quotes

### Transaction-Based Portfolio Management
- Track buy/sell transactions with cost basis and fees
- Automatic quantity calculation from transaction history
- Closed position tracking with realized gains/losses
- Target weight allocation with deviation monitoring

### Live Price Integration
- Real-time stock prices via Finnhub API
- Intelligent caching (1-minute cache for rapid updates)
- Price change tracking and market value calculations
- Support for multiple exchanges (NYSE, NASDAQ, AMEX, etc.)
- Multi-currency support with OpenExchangeRates (USD, SGD, AUD)
- Currency conversion with fallback rates

### Portfolio Visualization
- **Ticker Tape**: Scrolling stock quotes with live prices
- **Chart Grid**: Multiple TradingView chart widgets
- **Large Charts**: Interactive full-screen chart analysis
- **Prices Table**: Sortable/filterable table with:
  - Current price and daily change
  - Cost basis and market value (optional Cost column)
  - Portfolio weight and target allocation
  - Total gain/loss with percentage
  - Column visibility controls
  - Closed positions section
  - Multi-currency view (USD, SGD, AUD)
  - **Rebalance Mode**: Calculate optimal buy/sell recommendations to reach target weights

### Portfolio Configuration
- Add/edit/delete holdings
- Manage buy/sell transactions
- Set target portfolio weights
- Hide/show holdings (e.g., for closed positions)
- Configure cash amount and portfolio name
- View transaction history per holding

### Portfolio Rebalancing
Access rebalancing mode via `/stonks/prices?mode=rebalance` or click the "⚖️ Rebalance" button on the prices page.

**Features:**
- Shows all holdings with target weights, even if they have no current position
- Calculates optimal buy/sell recommendations to minimize weight deviation
- Displays current vs. target quantities and values with visual strikethrough
- Color-coded changes (green for buys, red for sells)
- Ensures cash never goes negative
- Prioritizes holdings with largest deviations from target
- Recommends whole stock purchases/sales only

**UI in Rebalance Mode:**
- Hides: Daily change metric, total gain/loss metric, price change column, MV change column, closed positions
- Shows: Current quantity (strikethrough) → New quantity (change in brackets)
- Cash row shows new cash balance after rebalancing
- Action badges (BUY/SELL/HOLD) for each position

## Database Schema

### portfolio_holdings
- `id` - Primary key
- `name` - Display name
- `code` - Trading symbol (e.g., "BATS:VOO")
- `target_weight` - Optional target allocation percentage
- `hidden` - Visibility flag (0=visible, 1=hidden)
- `created_at`, `updated_at` - Timestamps

### transactions
- `id` - Primary key
- `code` - Trading symbol
- `type` - 'buy' or 'sell'
- `date` - Transaction date
- `quantity` - Number of shares
- `value` - Total transaction value
- `fee` - Transaction fee
- `created_at` - Timestamp

### portfolio_settings
- Key-value store for:
  - `cash_amount` - Cash balance
  - `portfolio_name` - Portfolio display name

## Testing

Comprehensive test suite with 437 tests and 75.84% overall coverage (95.04% for server-side code):
- 56 tests for database operations
- 52 tests for routing and API endpoints
- 40 tests for config page
- 35 tests for data utilities
- 28 tests for prices client wrapper
- 27 tests for prices page
- Plus integration, caching, and error handling tests

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Progressive Web App (PWA)

This application is a fully functional Progressive Web App that can be installed on mobile and desktop devices. Features include:
- **Offline Support**: Works without internet connection using cached content
- **Install to Home Screen**: Add to mobile home screen or desktop
- **Automatic Updates**: Cache versioning ensures users get latest version
- **Native Experience**: Runs in standalone mode without browser chrome

**Documentation:**
- [PWA Quick Start Guide](PWA_QUICKSTART.md) - Get started with PWA features
- [PWA README](PWA_README.md) - Complete PWA architecture and implementation details
- [PWA Implementation Summary](PWA_IMPLEMENTATION_SUMMARY.md) - Overview of PWA features

## Additional Documentation

- **[API_ARCHITECTURE.md](API_ARCHITECTURE.md)** - Client-side rendering architecture and API endpoints
- **[D1_SETUP.md](D1_SETUP.md)** - Database setup and migration instructions
- **[FINNHUB_SETUP.md](FINNHUB_SETUP.md)** - API key configuration for live price data
- **[TESTING.md](TESTING.md)** - Testing strategy and coverage reports (437 tests)
- **[CACHING.md](CACHING.md)** - Caching architecture and strategy (Finnhub + FX)
- **[TEST_COVERAGE_SUMMARY.md](TEST_COVERAGE_SUMMARY.md)** - Detailed test coverage report
- **[public/icons/README.md](public/icons/README.md)** - PWA icon specifications

## Migration from Separate Workers

This project consolidates three separate Cloudflare Workers:
- `ticker.js` → `/stonks/ticker`
- `chart-grid.js` → `/stonks/charts`  
- `chart-large.js` → `/stonks/charts/large`

All original functionality is preserved, with significant enhancements including transaction tracking, real-time pricing, and portfolio management features.