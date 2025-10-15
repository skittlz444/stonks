# Stonks Portfolio Worker

A unified Cloudflare Worker that serves multiple stock portfolio visualization and management pages with transaction tracking and real-time pricing.

## Project Structure

```
├── src/
│   ├── index.js                # Cloudflare Worker entry point with routing
│   ├── databaseService.js      # D1 database abstraction layer
│   ├── finnhubService.js       # Finnhub API integration with caching
│   ├── fxService.js            # Currency conversion service (OpenExchangeRates)
│   ├── dataUtils.js            # Data processing and formatting utilities
│   └── client/                 # React/TypeScript client-side code
│       ├── components/         # React components (common, prices, charts)
│       ├── hooks/              # Custom React hooks for data fetching
│       ├── pages/              # Page components (6 pages)
│       ├── utils/              # Utilities (formatting, rebalancing)
│       └── types/              # TypeScript type definitions
├── public/
│   ├── dist/                   # Built React bundles (6 pages)
│   ├── icons/                  # PWA icons
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker for PWA
├── migrations/                 # D1 database migrations
├── test/                       # Comprehensive test suite (456 tests)
│   ├── client/                 # React component tests (TypeScript)
│   └── *.test.js               # Server-side tests
├── scripts/                    # Build scripts for cache versioning
├── tsconfig.json               # TypeScript configuration
├── vite.config.mjs             # Vite build configuration
├── vitest.config.ts            # Test configuration
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
- `/stonks/dist/prices.js` - Prices page React bundle
- `/stonks/dist/config.js` - Config page React bundle
- `/stonks/dist/ticker.js` - Ticker page React bundle
- `/stonks/dist/chartGrid.js` - Chart grid page React bundle
- `/stonks/dist/chartLarge.js` - Large chart page React bundle
- `/stonks/dist/chartAdvanced.js` - Advanced chart page React bundle

### Architecture
The application uses a **modern React/TypeScript architecture**:
1. **Cloudflare Worker**: Serves minimal HTML shell and handles API endpoints
2. **React Bundles**: Built with Vite and loaded on-demand (code splitting)
3. **Client-Side Rendering**: React components fetch data from API endpoints
4. **TypeScript**: Full type safety across client and test code
5. **Performance**: Optimized with parallel database queries and intelligent caching

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

# Build React components
npm run build:client

# Start development server (Cloudflare Worker)
npm run dev

# Or run React dev server (hot reload)
npm run dev:client

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## Features

### Modern Architecture ⚡
- **React/TypeScript Stack**: All 6 pages built with React 19 and TypeScript 5.9
- **Type Safety**: Full TypeScript coverage catching errors at compile time
- **Component-Based**: Reusable React components with clear boundaries
- **Client-Side Rendering**: Pages use React + API-based architecture
- **Optimized Performance**: Parallel database queries with Promise.all()
- **Code Splitting**: Automatic shared chunk extraction for optimal loading
- **Small Bundles**: ~71 kB gzipped total for all 6 pages
- **Fast Builds**: ~1 second builds with Vite
- **Fast Loading**: React with loading states and error handling
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

Comprehensive test suite with **456 tests** achieving **88.49% code coverage**:

**Test Coverage**:
- **Server-Side** (88.64%): Database, API endpoints, routing, external services
- **React Components** (91.89-100%): All UI components with user interactions
- **Utilities** (98.13%): Formatting and rebalancing algorithms
- **Hooks & Context** (100%): Custom React hooks and state management

**Key Test Suites**:
- 62 tests for HoldingsTable (sorting, filtering, rebalancing)
- 56 tests for database operations (CRUD, transactions)
- 35 tests for Cloudflare Worker (routing, API endpoints)
- 32 tests for formatting utilities (currency, percentages)
- 26 tests for CompanyProfileModal (TradingView integration)
- 18 tests for ClosedPositionsTable (profit/loss calculations)

**Technology**:
- Vitest with React Testing Library
- jsdom for browser simulation
- v8 for coverage analysis

See [TESTING.md](TESTING.md) for detailed documentation.

## Progressive Web App (PWA)

This application is a fully functional Progressive Web App that can be installed on mobile and desktop devices.

### Features
- **Offline Support**: Works without internet connection using cached content
- **Install to Home Screen**: Add to mobile home screen or desktop
- **Automatic Updates**: Cache versioning ensures users get latest version
- **Native Experience**: Runs in standalone mode without browser chrome

### Development & Deployment

```bash
# Start dev server (resets service worker cache)
npm run dev

# Deploy with versioned cache
npm run deploy
```

### Installing the PWA

**Desktop (Chrome/Edge)**:
1. Open the app in browser
2. Look for install button in address bar (⊕)
3. Click "Install Stonks"
4. App opens in standalone window

**Mobile**:
1. Open app in mobile browser
2. Tap menu (⋮) or share button
3. Select "Add to Home Screen"
4. Tap the new home screen icon

### Testing Offline Mode
1. Install the app
2. Open DevTools > Application > Service Workers
3. Check "Offline" checkbox
4. Navigate around - app still works!

**Documentation:**
- [PWA README](PWA_README.md) - Complete PWA architecture and implementation details
- [public/icons/README.md](public/icons/README.md) - PWA icon specifications

## Additional Documentation

- **[API_ARCHITECTURE.md](API_ARCHITECTURE.md)** - Client-side rendering architecture and API endpoints
- **[D1_SETUP.md](D1_SETUP.md)** - Database setup and migration instructions
- **[FINNHUB_SETUP.md](FINNHUB_SETUP.md)** - API key configuration for live price data
- **[TESTING.md](TESTING.md)** - Testing strategy and coverage reports (456 tests, 88.49% coverage)
- **[CACHING.md](CACHING.md)** - Caching architecture and strategy (Finnhub + FX)
- **[PWA_README.md](PWA_README.md)** - Progressive Web App architecture and implementation
- **[public/icons/README.md](public/icons/README.md)** - PWA icon specifications