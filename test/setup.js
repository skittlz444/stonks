// Global test setup
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