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

1. **src/databaseService.js** - Database abstraction layer (94.69% coverage)
   - DatabaseService class with D1 integration
   - MockD1Database for local development
   - MockPreparedStatement with full SQL simulation
   - CRUD operations for portfolio holdings
   - Transaction management (add, delete, filter)
   - Closed positions calculation
   - Hidden holdings functionality
   - Portfolio settings management
   - Error handling and fallback mechanisms

2. **src/utils.js** - HTML generation utilities
   - Bootstrap layout generation
   - Page structure utilities
   - Footer navigation
   - Response creation helpers
   - Company profile modal generation
   - Company profile script generation

3. **src/dataUtils.js** - Data processing utilities
   - Stock holdings data processing
   - TradingView widget data formatting
   - Legacy format compatibility
   - Structured data optimization

4. **src/chartWidgets.js** - TradingView widget generators
   - Ticker tape widgets
   - Chart overview widgets
   - Symbol display widgets
   - Market overview components
   - Company profile widgets

5. **src/index.js** - Main routing and API integration (80.89% coverage)
   - Route handling for all page endpoints (/ticker, /charts, /prices, /config)
   - API endpoints (/api/prices-data, /api/config-data)
   - Client script serving (/client/prices.js, /client/config.js)
   - Database service initialization
   - Finnhub service integration
   - FX service integration for currency conversion
   - Parallel database query optimization (Promise.all)
   - Payload optimization (removing unnecessary fields)
   - Error handling and fallback
   - Request/response processing

6. **src/pricesClientWrapper.js** - Client-side prices page wrapper (100% coverage)
   - Skeleton HTML generation with loading states
   - Parameter passing (rebalance mode, currency)
   - Currency selector UI
   - Navigation structure
   - Module script loading
   - Error state handling

7. **src/configClientWrapper.js** - Client-side config page wrapper (100% coverage)
   - Skeleton HTML generation with loading states
   - Form containers (add/edit holdings, transactions)
   - Modal structure
   - Navigation elements
   - Dynamic content containers

8. **src/prices.js** - Live prices page (96.87% coverage - legacy server-side rendering)
   - Real-time price fetching with Finnhub
   - Portfolio metrics calculation
   - Sortable column generation
   - Column visibility controls
   - Closed positions display
   - Company profile modal integration (clickable holding/position names)
   - Error handling

9. **src/config.js** - Configuration page (100% coverage)
   - Holdings management interface
   - Transaction form handling
   - Visibility toggle functionality
   - Company profile modal integration (clickable holding names)
   - Settings updates

10. **src/finnhubService.js** - API integration (97.66% coverage)
    - Quote fetching with caching
    - Rate limit handling
    - Cache expiration logic (1-minute default)
    - Error handling

11. **src/fxService.js** - Currency conversion service (96.66% coverage)
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

- **Total Tests**: 437 tests across 17 test files
- **Passing**: 437 tests ✅ (100%)
- **Overall Coverage**: 75.84% (95.04% for src/ files)
- **Coverage Details**: 
  - Server-side code: 95.04% ✅
  - Client-side browser JavaScript: 0% (requires browser environment)

### Test Files

1. `test/index.test.js` - 52 tests (includes API endpoint tests)
2. `test/databaseService.test.js` - 56 tests
3. `test/utils.test.js` - 41 tests (includes 8 tests for company profile modal/script generators)
4. `test/config.test.js` - 40 tests (includes 5 tests for company profile modal integration)
5. `test/chartWidgets.test.js` - 35 tests (includes 4 tests for company profile widget)
6. `test/dataUtils.test.js` - 35 tests
7. `test/pricesClientWrapper.test.js` - 28 tests (NEW: client wrapper tests)
8. `test/prices.test.js` - 27 tests (includes 6 tests for company profile modal integration)
9. `test/finnhubService.test.js` - 19 tests
10. `test/finnhubService.cache.test.js` - 17 tests
11. `test/fxService.test.js` - 16 tests
12. `test/configClientWrapper.test.js` - 15 tests (NEW: client wrapper tests)
13. `test/ticker.test.js` - 15 tests
14. `test/chartLarge.test.js` - 13 tests
15. `test/chartGrid.test.js` - 10 tests
16. `test/chartAdvanced.test.js` - 10 tests
17. `test/cache-version.test.js` - 8 tests

## Coverage Areas

### ✅ Fully Covered (100% coverage)

- **Client Wrappers**: pricesClientWrapper.js, configClientWrapper.js - Skeleton HTML generation
- **Chart Generation**: chartGrid.js, chartLarge.js, ticker.js, chartAdvanced.js
- **Widget Generation**: chartWidgets.js - All TradingView widget types
- **Utilities**: utils.js - HTML generation, Bootstrap integration
- **Configuration**: config.js - Portfolio settings and transaction management

### ✅ High Coverage (90%+)

- **Database Operations**: All CRUD operations, transactions, visibility controls (94.69%)
- **Data Processing**: Stock data formatting, TradingView integration, visible holdings filtering (94.6%)
- **Finnhub Integration**: Quote fetching, caching, rate limiting (97.66%)
- **FX Service**: Currency conversion, rate caching, fallback rates (96.66%)
- **Prices Page**: Real-time pricing, sorting, column controls (96.87%)
- **Routing**: All route handling, API endpoints, service initialization (80.89%)

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
- Client-side wrapper generation
- Database service integration
- Finnhub service integration
- FX service integration with multi-currency support
- Page generation workflow (both server-side and client-side)
- Configuration management
- Transaction tracking
- Visibility toggle functionality
- Client script serving

## Test Configuration

The test setup includes:

- **vitest.config.js**: Main test configuration
- **test/setup.js**: Global test setup and mocks
- **Global mocks**: Response objects, TradingView widgets
- **Coverage exclusions**: Node modules, migrations, config files

## Mock Strategy

- **MockD1Database**: Full SQLite database simulation with transaction support
- **MockPreparedStatement**: Complete SQL query handling (SELECT, INSERT, UPDATE, DELETE)
- **Page generators**: Mocked for integration testing  
- **Finnhub API**: Mocked with configurable responses and error scenarios
- **Cache testing**: Time-based expiration tests with wait periods
- **External dependencies**: TradingView widgets mocked
- **Network requests**: No external network calls in tests (all mocked)
- **Company Profile Utilities**: Modal and script generators mocked in config tests to match actual output for verification

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

```bash
# Integration and API tests (52 tests - includes API endpoint tests)
npx vitest test/index.test.js

# Database service tests (56 tests)
npx vitest test/databaseService.test.js

# Utilities tests (41 tests - includes company profile modal/script generators)
npx vitest test/utils.test.js

# Config page tests (40 tests - includes company profile modal integration)
npx vitest test/config.test.js

# Data processing tests (35 tests)
npx vitest test/dataUtils.test.js

# Widget generation tests (35 tests - includes company profile widget)
npx vitest test/chartWidgets.test.js

# Prices client wrapper tests (28 tests - NEW)
npx vitest test/pricesClientWrapper.test.js

# Prices page tests (27 tests - includes company profile modal integration)
npx vitest test/prices.test.js

# Finnhub service tests (19 tests)
npx vitest test/finnhubService.test.js

# Finnhub caching tests (17 tests - includes wait times)
npx vitest test/finnhubService.cache.test.js

# FX service tests (16 tests)
npx vitest test/fxService.test.js

# Config client wrapper tests (15 tests - NEW)
npx vitest test/configClientWrapper.test.js

# Chart page tests
npx vitest test/ticker.test.js        # 15 tests
npx vitest test/chartLarge.test.js    # 13 tests
npx vitest test/chartGrid.test.js     # 10 tests
npx vitest test/chartAdvanced.test.js # 10 tests

# Cache version tests (8 tests)
npx vitest test/cache-version.test.js
```

## Key Test Features

### API Endpoint Testing (NEW)
- `/stonks/api/prices-data` endpoint validation
- `/stonks/api/config-data` endpoint validation
- JSON response structure verification
- Query parameter handling (currency, rebalance mode)
- Error responses (503 for missing API keys, 500 for errors)
- Payload optimization verification (removing unnecessary fields)
- Parallel database query validation
- Client script serving (/client/prices.js, /client/config.js)

### Client-Side Wrapper Testing (NEW)
- Skeleton HTML generation with loading states
- Parameter passing to client scripts
- Currency selector UI generation
- Navigation structure verification
- Module script loading
- Error state containers
- Dynamic content placeholders
- Modal and form containers

### Company Profile Modal Testing
- Modal HTML generation with Bootstrap modal-xl class
- Modal sizing (95vh height for mobile and desktop)
- Script generation for showCompanyProfile function
- TradingView widget loading and configuration
- Clickable holding names in prices page
- Clickable position names in closed positions
- Clickable holding names in config page (visible and hidden)
- Single quote escaping in company names
- Modal structure (header, body, close button)
- Widget container height and styling

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

### Client-Side Rendering
The application now uses a hybrid architecture for the prices and config pages:

1. **Server-Side** (tested at 95%+ coverage):
   - API endpoints that return JSON data
   - Client wrappers that generate skeleton HTML
   - Optimized database queries with Promise.all()
   - Payload reduction by removing unnecessary fields

2. **Client-Side** (0% coverage - browser environment required):
   - `public/client/prices.js` - Dynamic page rendering
   - `public/client/config.js` - Dynamic page rendering
   - These are tested indirectly through API endpoint tests

### Performance Optimizations Validated

1. **Parallel Database Calls**: Tests verify Promise.all() usage
2. **Payload Reduction**: Tests check removed fields:
   - Holdings: removed `hidden`, `created_at`, `updated_at`
   - Quotes: removed `symbol`, `high`, `low`, `open`, `previousClose`, `timestamp`
3. **Lazy Loading**: Tests verify closed positions only fetched when needed
4. **Currency Conversion**: Tests verify FX service integration and fallback

The test suite provides confidence in the reliability and maintainability of the Stonks Portfolio application, with comprehensive coverage of all features including transaction tracking, visibility controls, real-time pricing, API-based architecture, and multi-currency support.