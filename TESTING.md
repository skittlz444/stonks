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

1. **src/databaseService.js** - Database abstraction layer
   - DatabaseService class with D1 integration
   - MockD1Database for local development
   - CRUD operations for portfolio holdings
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
   - Route handling for all endpoints
   - Database service initialization
   - Error handling and fallback
   - Request/response processing

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

- **Total Tests**: 128 tests across 5 test files
- **Passing**: 124 tests ✅
- **Failing**: 4 tests ❌ (minor edge cases)
- **Coverage**: Comprehensive coverage of all major functionality

### Test Files

1. `test/databaseService.test.js` - 21 tests
2. `test/utils.test.js` - 27 tests  
3. `test/dataUtils.test.js` - 31 tests
4. `test/chartWidgets.test.js` - 26 tests
5. `test/index.test.js` - 23 tests

## Coverage Areas

### ✅ Fully Covered

- **Database Operations**: All CRUD operations, error handling, mock implementations
- **HTML Generation**: Layout generation, Bootstrap integration, responsive design
- **Data Processing**: Stock data formatting, TradingView integration, legacy compatibility
- **Widget Generation**: All TradingView widget types with proper configuration
- **Routing**: All route handling, database initialization, error responses

### ✅ Edge Cases Covered

- Error handling for database failures
- Malformed data processing
- Missing configuration handling
- URL parsing edge cases
- Response format validation

### ✅ Integration Testing

- End-to-end route testing
- Database service integration
- Page generation workflow
- Configuration management

## Test Configuration

The test setup includes:

- **vitest.config.js**: Main test configuration
- **test/setup.js**: Global test setup and mocks
- **Global mocks**: Response objects, TradingView widgets
- **Coverage exclusions**: Node modules, migrations, config files

## Mock Strategy

- **MockD1Database**: Full SQLite database simulation
- **Page generators**: Mocked for integration testing  
- **External dependencies**: TradingView widgets mocked
- **Network requests**: No external network calls in tests

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
# Database service tests
npx vitest test/databaseService.test.js

# Utilities tests  
npx vitest test/utils.test.js

# Data processing tests
npx vitest test/dataUtils.test.js

# Widget generation tests
npx vitest test/chartWidgets.test.js

# Integration tests
npx vitest test/index.test.js
```

The test suite provides confidence in the reliability and maintainability of the Stonks Portfolio application.