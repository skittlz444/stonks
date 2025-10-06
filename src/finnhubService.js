/**
 * Finnhub API Service with Caching
 * Documentation: https://finnhub.io/docs/api/quote
 * 
 * Features:
 * - In-memory caching with configurable duration (default: 1 minute)
 * - Automatic cache validation and expiration
 * - Cache management methods (clear, stats)
 * 
 * Note: Using REST API directly instead of npm package because Cloudflare Workers
 * doesn't support Node.js modules (fs, path, etc.) that the Finnhub SDK requires.
 */

export class FinnhubService {
  constructor(apiKey, cacheDurationMs = 60000) { // Default: 1 minute cache
    this.apiKey = apiKey;
    this.baseUrl = 'https://finnhub.io/api/v1';
    this.cacheDurationMs = cacheDurationMs;
    this.cache = new Map(); // Store: { symbol: { data: {...}, timestamp: Date.now() } }
  }

  /**
   * Extract stock symbol from code (e.g., "BATS:VOO" -> "VOO")
   * @param {string} code - Full stock code with exchange prefix
   * @returns {string} Stock symbol
   */
  extractSymbol(code) {
    if (!code) return '';
    const parts = code.split(':');
    return parts.length > 1 ? parts[1] : code;
  }

  /**
   * Check if cached data is still valid
   * @param {string} symbol - Stock symbol
   * @returns {boolean} True if cache is valid
   */
  isCacheValid(symbol) {
    const cached = this.cache.get(symbol);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < this.cacheDurationMs;
  }

  /**
   * Get cached quote if available and valid
   * @param {string} symbol - Stock symbol
   * @returns {Object|null} Cached quote or null
   */
  getCachedQuote(symbol) {
    if (this.isCacheValid(symbol)) {
      return this.cache.get(symbol).data;
    }
    return null;
  }

  /**
   * Store quote in cache
   * @param {string} symbol - Stock symbol
   * @param {Object} data - Quote data
   */
  setCachedQuote(symbol, data) {
    this.cache.set(symbol, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Get real-time quote for a stock symbol (with caching)
   * @param {string} symbol - Stock symbol (e.g., "AAPL", "VOO")
   * @returns {Promise<Object>} Quote data
   */
  async getQuote(symbol) {
    try {
      const cleanSymbol = this.extractSymbol(symbol);
      
      // Check cache first
      const cachedQuote = this.getCachedQuote(cleanSymbol);
      if (cachedQuote) {
        return cachedQuote;
      }
      
      // Fetch from API if not cached
      const url = `${this.baseUrl}/quote?symbol=${cleanSymbol}&token=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Finnhub returns {c: current, h: high, l: low, o: open, pc: previous close, t: timestamp}
      const quote = {
        symbol: cleanSymbol,
        current: data.c,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        timestamp: data.t
      };
      
      // Store in cache
      this.setCachedQuote(cleanSymbol, quote);
      
      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get quotes for multiple symbols
   * @param {Array<string>} symbols - Array of stock symbols or codes
   * @returns {Promise<Array<Object>>} Array of quote data
   */
  async getQuotes(symbols) {
    try {
      const promises = symbols.map(symbol => 
        this.getQuote(symbol).catch(error => ({
          symbol: this.extractSymbol(symbol),
          error: error.message
        }))
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      throw error;
    }
  }

  /**
   * Get quotes for portfolio holdings
   * @param {Array<Object>} holdings - Array of holding objects with code property
   * @returns {Promise<Array<Object>>} Array of holdings with quote data
   */
  async getPortfolioQuotes(holdings) {
    try {
      const quotesPromises = holdings.map(async (holding) => {
        try {
          const quote = await this.getQuote(holding.code);
          return {
            ...holding,
            quote: quote,
            marketValue: holding.quantity * quote.current,
            costBasis: holding.quantity * (holding.averageCost || quote.previousClose),
            gain: holding.quantity * (quote.current - (holding.averageCost || quote.previousClose)),
            gainPercent: ((quote.current - (holding.averageCost || quote.previousClose)) / (holding.averageCost || quote.previousClose)) * 100
          };
        } catch (error) {
          return {
            ...holding,
            quote: null,
            error: error.message
          };
        }
      });
      
      return await Promise.all(quotesPromises);
    } catch (error) {
      console.error('Error fetching portfolio quotes:', error);
      throw error;
    }
  }

  /**
   * Clear all cached quotes
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cached quote for a specific symbol
   * @param {string} symbol - Stock symbol to clear from cache
   */
  clearCachedQuote(symbol) {
    const cleanSymbol = this.extractSymbol(symbol);
    this.cache.delete(cleanSymbol);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats with size, symbols, and timestamps
   */
  getCacheStats() {
    const symbols = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(v => v.timestamp);
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
    
    return {
      size: this.cache.size,
      symbols: symbols,
      cacheDurationMs: this.cacheDurationMs,
      oldestCacheTime: oldestTimestamp,
      newestCacheTime: newestTimestamp
    };
  }

  /**
   * Get the oldest cache timestamp (when data was first cached)
   * @returns {number|null} Timestamp in milliseconds, or null if cache is empty
   */
  getOldestCacheTimestamp() {
    if (this.cache.size === 0) return null;
    const timestamps = Array.from(this.cache.values()).map(v => v.timestamp);
    return Math.min(...timestamps);
  }

  /**
   * Get the newest cache timestamp (most recently cached data)
   * @returns {number|null} Timestamp in milliseconds, or null if cache is empty
   */
  getNewestCacheTimestamp() {
    if (this.cache.size === 0) return null;
    const timestamps = Array.from(this.cache.values()).map(v => v.timestamp);
    return Math.max(...timestamps);
  }

  /**
   * Check if API key is valid
   * @returns {Promise<boolean>} True if API key is valid
   */
  async validateApiKey() {
    try {
      // Test with a known symbol
      await this.getQuote('AAPL');
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
}

/**
 * Create a Finnhub service instance with caching
 * @param {string} apiKey - Finnhub API key
 * @param {number} cacheDurationMs - Cache duration in milliseconds (default: 60000 = 1 minute)
 * @returns {FinnhubService|null} Service instance or null if no API key
 */
export function createFinnhubService(apiKey, cacheDurationMs = 60000) {
  if (!apiKey) {
    console.warn('Finnhub API key not provided. Price data will not be available.');
    return null;
  }
  return new FinnhubService(apiKey, cacheDurationMs);
}
