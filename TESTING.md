# Stonks Portfolio - Testing Documentation

This project includes comprehensive unit tests with coverage reporting for all core modules.

## Testing Framework

- **Test Runner**: Vitest 2.1.9
- **Coverage Provider**: @vitest/coverage-v8
- **Environment**: jsdom (for DOM testing)
- **Mocking**: Built-in Vitest mocking with vi

## Test Coverage

The test suite covers the following modules:

### ✅ Core Modules Tested

1. **src/databaseService.js** - Database abstraction layer (93.38% coverage)
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

5. **src/index.js** - Main routing and integration
   - Route handling for all endpoints (/ticker, /charts, /prices, /config)
   - Database service initialization
   - Finnhub service integration
   - Error handling and fallback
   - Request/response processing

6. **src/prices.js** - Live prices page (95.23% coverage)
   - Real-time price fetching with Finnhub
   - Portfolio metrics calculation
   - Sortable column generation
   - Column visibility controls
   - Closed positions display
   - Error handling

7. **src/config.js** - Configuration page (74.9% coverage)
   - Holdings management interface
   - Transaction form handling
   - Visibility toggle functionality
   - Settings updates

8. **src/finnhubService.js** - API integration (97.66% coverage)
   - Quote fetching with caching
   - Rate limit handling
   - Cache expiration logic
   - Error handling

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

- **Total Tests**: 270 tests across 12 test files
- **Passing**: 270 tests ✅ (100%)
- **Overall Coverage**: 91.66% statements, 84.9% branches, 98.68% functions
- **Coverage**: Comprehensive coverage of all major functionality

### Test Files

1. `test/databaseService.test.js` - 52 tests
2. `test/utils.test.js` - 27 tests  
3. `test/dataUtils.test.js` - 31 tests
4. `test/chartWidgets.test.js` - 26 tests
5. `test/index.test.js` - 23 tests
6. `test/prices.test.js` - 16 tests
7. `test/config.test.js` - 20 tests
8. `test/ticker.test.js` - 18 tests
9. `test/chartGrid.test.js` - 10 tests
10. `test/chartLarge.test.js` - 10 tests
11. `test/finnhubService.test.js` - 19 tests
12. `test/finnhubService.cache.test.js` - 17 tests

## Coverage Areas

### ✅ Fully Covered (100% coverage)

- **Chart Generation**: chartGrid.js, chartLarge.js, ticker.js
- **Widget Generation**: chartWidgets.js - All TradingView widget types
- **Utilities**: utils.js - HTML generation, Bootstrap integration

### ✅ High Coverage (90%+)

- **Database Operations**: All CRUD operations, transactions, visibility controls
- **Data Processing**: Stock data formatting, TradingView integration, visible holdings filtering
- **Finnhub Integration**: Quote fetching, caching, rate limiting
- **Prices Page**: Real-time pricing, sorting, column controls
- **Routing**: All route handling, service initialization, error responses

### ✅ Edge Cases Covered

- Error handling for database failures
- Finnhub API rate limiting and errors
- Malformed data processing
- Missing configuration handling
- Transaction validation
- Closed position calculations
- Cache expiration scenarios
- URL parsing edge cases
- Response format validation

### ✅ Integration Testing

- End-to-end route testing
- Database service integration
- Finnhub service integration
- Page generation workflow
- Configuration management
- Transaction tracking
- Visibility toggle functionality

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
# Database service tests (52 tests)
npx vitest test/databaseService.test.js

# Utilities tests (27 tests)
npx vitest test/utils.test.js

# Data processing tests (31 tests)
npx vitest test/dataUtils.test.js

# Widget generation tests (26 tests)
npx vitest test/chartWidgets.test.js

# Integration tests (23 tests)
npx vitest test/index.test.js

# Prices page tests (16 tests)
npx vitest test/prices.test.js

# Config page tests (20 tests)
npx vitest test/config.test.js

# Finnhub service tests (19 tests)
npx vitest test/finnhubService.test.js

# Finnhub caching tests (17 tests - includes wait times)
npx vitest test/finnhubService.cache.test.js

# Chart page tests
npx vitest test/ticker.test.js
npx vitest test/chartGrid.test.js
npx vitest test/chartLarge.test.js
```

## Key Test Features

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

The test suite provides confidence in the reliability and maintainability of the Stonks Portfolio application, with comprehensive coverage of all new features including transaction tracking, visibility controls, and real-time pricing.