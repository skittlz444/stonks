/**
 * Mock KV store for local development
 */
export class MockKV {
  constructor() {
    this.data = {
      "currentHoldings": "\"My Portfolio\", \"2*BATS:VOO+27*BATS:AAAU+13*BATS:VXUS+3*BATS:VOOV+2*BATS:VO+8*BATS:GOP+101.8\"\n|\n\"Vgrd S&P 500\",\n\"AMEX:VOO\"\n|\n\"GS Gold\",\n\"CBOE:AAAU\"\n|\n\"Vgrd Ex US\",\n\"NASDAQ:VXUS\"\n|\n\"Vgrd S&P 500 Value\",\n\"AMEX:VOOV\"\n|\n\"Vgrd Mid Cap\",\n\"AMEX:VO\"\n|\n\"GOP\",\n\"CBOE:GOP\""
    };
  }
  
  async get(key) {
    return this.data[key] || null;
  }
  
  async put(key, value) {
    this.data[key] = value;
  }
}