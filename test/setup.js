// Global test setup

// Suppress console.error during tests to reduce noise from intentional error testing
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    // Suppress specific error messages from intentional error tests
    const message = args[0]?.toString() || '';
    if (
      message.includes('Error getting stock holdings:') ||
      message.includes('Error parsing stock holdings:') ||
      message.includes('Error getting optimized holdings data:') ||
      message.includes('Error fetching holdings:') ||
      message.includes('Error adding portfolio holding:') ||
      message.includes('Error handling request:') ||
      message.includes('Config submission error:')
    ) {
      return; // Suppress these expected error logs
    }
    originalConsoleError.apply(console, args);
  };
  
  console.log = (...args) => {
    // Suppress specific log messages
    const message = args[0]?.toString() || '';
    if (message.includes('No D1 database found')) {
      return; // Suppress mock database messages
    }
    originalConsoleLog.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

global.Response = Response || class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
};

// Mock TradingView widget for tests
global.TradingView = {
  widget: class MockWidget {
    constructor(config) {
      this.config = config;
    }
  }
};