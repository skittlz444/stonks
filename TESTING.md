# Stonks Portfolio - Testing Documentation

This project includes comprehensive unit tests with coverage reporting for all core modules.

## Testing Framework

- **Test Runner**: Vitest 2.1.9
- **Coverage Provider**: @vitest/coverage-v8
- **Environment**: jsdom (for DOM testing)
- **Mocking**: Built-in Vitest mocking with vi

## Test Coverage

The test suite covers the following modules with comprehensive integration and unit testing:

### ✅ Core Modules Tested

1. **src/databaseService.js** - Database abstraction layer (89.56% coverage)
   - DatabaseService class with D1 integration
   - MockD1Database for local development
   - MockPreparedStatement with full SQL simulation
   - CRUD operations for portfolio holdings
   - Transaction management (add, delete, filter)
   - Closed positions calculation
   - Hidden holdings functionality
   - Portfolio settings management
   - Error handling and fallback mechanisms

2. **src/client/** - React/TypeScript Client Application (91.89-100% coverage)
   - **Components**: Comprehensive UI component testing
     - HoldingsTable with sorting, filtering, rebalancing calculations
     - ClosedPositionsTable with profit/loss display
     - Navigation components for prices and common pages
     - PricesControls for currency and view mode selection
     - ColumnControls for dynamic column visibility
     - SummaryCards for portfolio metrics display
     - Common components (LoadingSpinner, ErrorMessage, CompanyProfileModal)
   - **Utilities**: Formatting functions, rebalancing algorithms
   - **Hooks**: Custom React hooks for data fetching and state management
   - **Context**: ConfigContext for global configuration state

3. **src/dataUtils.js** - Data processing utilities (92.44% coverage)
   - Stock holdings data processing
   - TradingView widget data formatting
   - Structured data optimization

4. **src/index.js** - Cloudflare Worker entry point (75.24% coverage)
   - Route handling for all page endpoints (/ticker, /charts, /prices, /config)
   - API endpoints (/api/prices-data, /api/config-data)
   - Client script serving (React bundles)
   - Database service initialization
   - Finnhub service integration
   - FX service integration for currency conversion
   - Error handling and fallback
   - Request/response processing

5. **src/finnhubService.js** - API integration (97.76% coverage)
    - Quote fetching with caching
    - Rate limit handling
    - Cache expiration logic (1-minute default)
    - Error handling

6. **src/fxService.js** - Currency conversion service (96.66% coverage)
   - OpenExchangeRates API integration
   - Multi-currency support (USD, SGD, AUD)
   - Caching for exchange rates
   - Fallback rates when API unavailable
   - Currency conversion utilities

## Running Tests

### All Tests
```bash
npm run test
# or
npx vitest run
```

### Watch Mode
```bash
npm run test:watch
# or
npx vitest --watch
```

### Coverage Report
```bash
npm run test:coverage
# or
npx vitest --coverage
```

## Test Statistics

- **Total Tests**: 456 tests across 25 test files
- **Passing**: 456 tests ✅ (100%)
- **Overall Coverage**: 88.49% (statements)
- **Coverage Details**: 
  - Server-side code: 88.64% (src/ directory)
  - Client-side React/TypeScript code: 91.89-100% (src/client/ directory)
  - Branch Coverage: 81.65%
  - Function Coverage: 88.52%

### Test Files

#### Server-Side Tests (JavaScript)
1. `test/index.test.js` - 35 tests (Cloudflare Worker entry point)
2. `test/databaseService.test.js` - 56 tests (Database operations)
3. `test/dataUtils.test.js` - 35 tests (Data processing)
4. `test/finnhubService.test.js` - 19 tests (Stock price API)
5. `test/finnhubService.cache.test.js` - 17 tests (Price caching)
6. `test/fxService.test.js` - 16 tests (Currency conversion)
7. `test/api.test.js` - 16 tests (API endpoints)
8. `test/cache-version.test.js` - 8 tests (PWA cache versioning)

#### Client-Side Tests (React/TypeScript)
9. `test/client/main.test.tsx` - 5 tests
10. `test/client/context/ConfigContext.test.tsx` - 9 tests
11. `test/client/utils/formatting.test.ts` - 32 tests
12. `test/client/utils/rebalancing.test.ts` - 10 tests
13. `test/client/hooks/useConfigData.test.ts` - 9 tests
14. `test/client/hooks/useHoldings.test.tsx` - 6 tests
15. `test/client/hooks/usePricesData.test.ts` - 8 tests
16. `test/client/components/common/CompanyProfileModal.test.tsx` - 26 tests
17. `test/client/components/common/ErrorMessage.test.tsx` - 5 tests
18. `test/client/components/common/LoadingSpinner.test.tsx` - 4 tests
19. `test/client/components/common/Navigation.test.tsx` - 14 tests
20. `test/client/components/prices/ClosedPositionsTable.test.tsx` - 18 tests
21. `test/client/components/prices/ColumnControls.test.tsx` - 9 tests
22. `test/client/components/prices/HoldingsTable.test.tsx` - 62 tests
23. `test/client/components/prices/Navigation.test.tsx` - 10 tests
24. `test/client/components/prices/PricesControls.test.tsx` - 15 tests
25. `test/client/components/prices/SummaryCards.test.tsx` - 12 tests

## Coverage Areas

### ✅ High Coverage (90%+)

- **Client Components**: React components with comprehensive UI testing (91.89-100%)
  - HoldingsTable: 91.72% (62 tests covering sorting, filtering, rebalancing, visibility)
  - ClosedPositionsTable: 82.38% (18 tests)
  - Navigation components: 90-100%
  - Common components: 100% (LoadingSpinner, ErrorMessage, CompanyProfileModal)
  - PricesControls: 100% (15 tests)
  - ColumnControls: 100% (9 tests)
  - SummaryCards: 99.36% (12 tests)
- **Client Utilities**: Formatting and rebalancing logic (97-100%)
- **Client Hooks**: Custom React hooks for data fetching (100%)
- **Client Context**: ConfigContext provider (100%)
- **Database Operations**: All CRUD operations, transactions, visibility controls (89.56%)
- **Data Processing**: Stock data formatting, TradingView integration (92.44%)
- **Finnhub Integration**: Quote fetching, caching, rate limiting (97.76%)
- **FX Service**: Currency conversion, rate caching, fallback rates (96.66%)

### ✅ Edge Cases Covered

- Error handling for database failures
- Finnhub API rate limiting and errors
- OpenExchangeRates API errors with fallback
- Malformed data processing
- Missing configuration handling
- Missing API keys (503 Service Unavailable responses)
- Transaction validation
- Closed position calculations
- Cache expiration scenarios (both Finnhub and FX)
- URL parsing edge cases
- Query parameter handling (currency, rebalance mode)
- Response format validation
- Parallel query error handling

### ✅ Integration Testing

- End-to-end route testing (pages and APIs)
- API endpoint data integrity
- React component interactions
- Database service integration
- Finnhub service integration
- FX service integration with multi-currency support
- Configuration management
- Transaction tracking
- Visibility toggle functionality
- Client-side data fetching

## Test Configuration

The test setup includes:

- **vitest.config.js**: Main test configuration
- **test/setup.js**: Global test setup and mocks
- **Global mocks**: Response objects, TradingView widgets
- **Coverage exclusions**: Node modules, migrations, config files

## Mock Strategy

- **MockD1Database**: Full SQLite database simulation with transaction support
- **MockPreparedStatement**: Complete SQL query handling (SELECT, INSERT, UPDATE, DELETE)
- **Finnhub API**: Mocked with configurable responses and error scenarios
- **OpenExchangeRates API**: Mocked with currency conversion scenarios
- **Cache testing**: Time-based expiration tests with wait periods
- **External dependencies**: TradingView widgets mocked
- **Network requests**: No external network calls in tests (all mocked)
- **React Testing Library**: Component rendering with user event simulation

## Error Logging

Tests include comprehensive error logging verification:
- Database error scenarios
- Network failure handling
- Invalid data processing
- Configuration errors

## Future Test Additions

Potential areas for additional testing:
- Performance testing for large datasets
- Browser compatibility testing
- Visual regression testing
- Load testing for concurrent requests

## Running Individual Test Files

### Server-Side Tests
```bash
# Cloudflare Worker entry point (35 tests)
npx vitest test/index.test.js

# Database service tests (56 tests)
npx vitest test/databaseService.test.js

# Data processing tests (35 tests)
npx vitest test/dataUtils.test.js

# Finnhub service tests (19 tests)
npx vitest test/finnhubService.test.js

# Finnhub caching tests (17 tests)
npx vitest test/finnhubService.cache.test.js

# FX service tests (16 tests)
npx vitest test/fxService.test.js

# API endpoint tests (16 tests)
npx vitest test/api.test.js

# Cache version tests (8 tests)
npx vitest test/cache-version.test.js
```

### Client-Side Tests (React/TypeScript)
```bash
# Main entry point (5 tests)
npx vitest test/client/main.test.tsx

# Context tests (9 tests)
npx vitest test/client/context/ConfigContext.test.tsx

# Utility tests
npx vitest test/client/utils/formatting.test.ts    # 32 tests
npx vitest test/client/utils/rebalancing.test.ts   # 10 tests

# Hook tests
npx vitest test/client/hooks/useConfigData.test.ts  # 9 tests
npx vitest test/client/hooks/useHoldings.test.tsx   # 6 tests
npx vitest test/client/hooks/usePricesData.test.ts  # 8 tests

# Common component tests
npx vitest test/client/components/common/CompanyProfileModal.test.tsx  # 26 tests
npx vitest test/client/components/common/ErrorMessage.test.tsx         # 5 tests
npx vitest test/client/components/common/LoadingSpinner.test.tsx       # 4 tests
npx vitest test/client/components/common/Navigation.test.tsx           # 14 tests

# Prices component tests
npx vitest test/client/components/prices/ClosedPositionsTable.test.tsx  # 18 tests
npx vitest test/client/components/prices/ColumnControls.test.tsx        # 9 tests
npx vitest test/client/components/prices/HoldingsTable.test.tsx         # 62 tests (most comprehensive)
npx vitest test/client/components/prices/Navigation.test.tsx            # 10 tests
npx vitest test/client/components/prices/PricesControls.test.tsx        # 15 tests
npx vitest test/client/components/prices/SummaryCards.test.tsx          # 12 tests
```

## Key Test Features

### React Component Testing (NEW)
- **HoldingsTable** (62 tests - most comprehensive):
  - Sorting by all columns (name, code, quantity, current price, market value, etc.)
  - Column visibility toggles
  - Rebalancing calculations and display
  - Target weight editing
  - Visibility toggle with confirmation
  - Action buttons (edit, hide, show, add transaction)
  - Currency-aware display
  - Performance metrics (cost basis, gain/loss)
  - Loading and error states
  
- **PricesControls** (15 tests):
  - Currency selection (USD, SGD, AUD)
  - View mode switching (normal, rebalance)
  - Closed positions toggle
  - Column controls integration
  
- **ClosedPositionsTable** (18 tests):
  - Profit/loss calculations
  - Transaction count display
  - Sorting by multiple columns
  - Percentage formatting
  - Empty state handling
  
- **SummaryCards** (12 tests):
  - Total value calculations
  - Gain/loss metrics
  - Currency-aware formatting
  - Percentage display
  
- **Common Components**:
  - CompanyProfileModal with TradingView widget integration (26 tests)
  - ErrorMessage display (5 tests)
  - LoadingSpinner states (4 tests)
  - Navigation components (14 tests)

### React Hook Testing
- **useHoldings**: Holdings data fetching and state management (6 tests)
- **usePricesData**: Prices page data with currency support (8 tests)
- **useConfigData**: Configuration data fetching (9 tests)
- Custom hook error handling and loading states

### Utility Function Testing
- **Formatting utilities** (32 tests):
  - Currency formatting (USD, SGD, AUD)
  - Number formatting with locale support
  - Percentage formatting
  - Value abbreviation (K, M, B)
  
- **Rebalancing algorithms** (10 tests):
  - Target weight calculations
  - Portfolio rebalancing recommendations
  - Cash allocation suggestions
  - Edge case handling

### API Endpoint Testing
- `/stonks/api/prices-data` endpoint validation
- `/stonks/api/config-data` endpoint validation
- JSON response structure verification
- Query parameter handling (currency, rebalance mode)
- Error responses (503 for missing API keys, 500 for errors)
- Payload optimization verification
- Parallel database query validation

### Transaction Testing
- Buy/sell transaction creation and validation
- Transaction filtering by code
- Closed position profit/loss calculation
- Fee and cost basis tracking

### Visibility Testing
- Hidden holdings filtering (WHERE hidden = 0/1)
- Visibility toggle functionality
- Separate visible/hidden holdings display
- Chart integration with visible-only holdings

### Caching Tests
- 5-minute cache duration validation
- Cache expiration scenarios
- Multiple symbol caching
- Cache hit/miss statistics

### Error Handling
- Database connection failures
- Finnhub API errors and rate limits
- Invalid transaction data
- Missing configuration handling

## Architecture Testing

### React/TypeScript Migration
The application has been migrated from vanilla JavaScript to React with TypeScript:

1. **Server-Side** (Cloudflare Worker - 75-97% coverage):
   - API endpoints returning JSON data
   - Database service layer
   - External API integrations (Finnhub, OpenExchangeRates)
   - Cloudflare Worker routing and middleware

2. **Client-Side React Application** (91.89-100% coverage):
   - **Components**: Full React component suite with comprehensive testing
   - **Hooks**: Custom hooks for data fetching and state management
   - **Context**: Global configuration state management
   - **Utilities**: Type-safe formatting and calculation functions
   - **TypeScript**: Full type coverage with strict mode enabled

### Testing Strategy
- **Unit Tests**: Individual component and utility function testing
- **Integration Tests**: Component interaction and data flow testing
- **Hook Tests**: Custom hook behavior and state management
- **User Interaction Tests**: Click, input, and form submission handling
- **Error Handling**: Loading states, error states, and fallback UI

### Technology Stack Testing

The test suite validates the following technologies:
- **React 18**: Component lifecycle, hooks, context API
- **TypeScript**: Type safety, interfaces, enums
- **Vite**: Build system and module resolution
- **Vitest**: Test runner with React Testing Library
- **Cloudflare Workers**: Edge computing runtime
- **D1 Database**: Serverless SQL database

The test suite provides confidence in the reliability and maintainability of the Stonks Portfolio application, with comprehensive coverage of all features including:
- ✅ React component rendering and interactions
- ✅ TypeScript type safety and interfaces
- ✅ Custom hooks and state management
- ✅ Currency conversion and formatting
- ✅ Rebalancing calculations
- ✅ Transaction tracking and closed positions
- ✅ API endpoints and data fetching
- ✅ Error handling and loading states
- ✅ Multi-currency support (USD, SGD, AUD)