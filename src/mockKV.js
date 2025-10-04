/**
 * Mock KV store for local development
 */
export class MockKV {
  constructor() {
    this.data = {
      "currentHoldings": "\"Vgrd S&P 500\",\"AMEX:VOO\"|\"GS Gold\",\"CBOE:AAAU\""
    };
  }
  
  async get(key) {
    return this.data[key] || null;
  }
  
  async put(key, value) {
    this.data[key] = value;
  }
}