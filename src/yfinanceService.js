/**
 * Yahoo Finance quote service with in-memory caching.
 *
 * Uses Yahoo Finance's quote endpoint to support international exchanges
 * without requiring an API key.
 */
export class YFinanceService {
  constructor(cacheDurationMs = 60000) {
    this.baseUrl = 'https://query1.finance.yahoo.com/v7/finance/quote';
    this.cacheDurationMs = cacheDurationMs;
    this.cache = new Map();
  }

  extractSymbol(code) {
    if (!code) return '';
    const parts = String(code).split(':');
    return parts.length > 1 ? parts[1] : String(code);
  }

  toYahooSymbol(code) {
    if (!code) return '';

    const rawCode = String(code).trim().toUpperCase();
    if (!rawCode.includes(':')) {
      return rawCode;
    }

    const [exchange, ...symbolParts] = rawCode.split(':');
    const symbol = symbolParts.join(':');
    if (!symbol) {
      return rawCode;
    }

    const exchangeSuffixes = {
      ASX: '.AX',
      BSE: '.BO',
      EBR: '.BR',
      ETR: '.DE',
      FRA: '.F',
      HKEX: '.HK',
      HKG: '.HK',
      IDX: '.JK',
      JSE: '.JO',
      KRX: '.KS',
      KOSDAQ: '.KQ',
      LSE: '.L',
      NSE: '.NS',
      NZX: '.NZ',
      OMXCPH: '.CO',
      OMXHEL: '.HE',
      OSL: '.OL',
      PAR: '.PA',
      SGX: '.SI',
      SIX: '.SW',
      SWX: '.SW',
      TSE: '.T',
      TSX: '.TO',
      TSXV: '.V',
      TYO: '.T',
      VIE: '.VI',
      XAMS: '.AS',
      XETRA: '.DE',
    };

    const noSuffixExchanges = new Set([
      'AMEX',
      'ARCA',
      'BATS',
      'CBOE',
      'NASDAQ',
      'NYSE',
      'NYSEARCA',
      'OTC',
    ]);

    if (noSuffixExchanges.has(exchange)) {
      return symbol;
    }

    const suffix = exchangeSuffixes[exchange];
    return suffix ? `${symbol}${suffix}` : symbol;
  }

  isCacheValid(symbol) {
    const cached = this.cache.get(symbol);
    if (!cached) return false;
    return (Date.now() - cached.timestamp) < this.cacheDurationMs;
  }

  getCachedQuote(symbol) {
    if (this.isCacheValid(symbol)) {
      return this.cache.get(symbol).data;
    }
    return null;
  }

  setCachedQuote(symbol, data) {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now(),
    });
  }

  parseQuoteResult(result, requestedSymbol) {
    if (!result || result.regularMarketPrice == null) {
      throw new Error(`Yahoo Finance quote not found for ${requestedSymbol}`);
    }

    const previousClose = result.regularMarketPreviousClose ?? result.chartPreviousClose ?? result.regularMarketPrice ?? 0;
    const current = result.regularMarketPrice ?? previousClose;
    const change = result.regularMarketChange ?? (current - previousClose);
    const changePercent = result.regularMarketChangePercent ?? (previousClose ? ((change / previousClose) * 100) : 0);

    return {
      symbol: requestedSymbol,
      providerSymbol: result.symbol || requestedSymbol,
      currency: result.currency || 'USD',
      current,
      high: result.regularMarketDayHigh ?? current,
      low: result.regularMarketDayLow ?? current,
      open: result.regularMarketOpen ?? previousClose,
      previousClose,
      change,
      changePercent,
      timestamp: result.regularMarketTime ?? Date.now(),
    };
  }

  async fetchQuotesBatch(symbols) {
    if (!symbols.length) {
      return new Map();
    }

    const url = `${this.baseUrl}?symbols=${symbols.map(symbol => encodeURIComponent(symbol)).join(',')}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data?.quoteResponse?.result;

    if (!Array.isArray(results)) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const resultMap = new Map();
    for (const result of results) {
      if (result?.symbol) {
        resultMap.set(String(result.symbol).toUpperCase(), result);
      }
    }

    return resultMap;
  }

  async getQuote(symbol) {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const cachedQuote = this.getCachedQuote(yahooSymbol);
    if (cachedQuote) {
      return cachedQuote;
    }

    try {
      const resultMap = await this.fetchQuotesBatch([yahooSymbol]);
      const quote = this.parseQuoteResult(resultMap.get(yahooSymbol), yahooSymbol);
      this.setCachedQuote(yahooSymbol, quote);
      return quote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      throw error;
    }
  }

  async getQuotes(symbols) {
    if (!symbols.length) {
      return [];
    }

    const requestedSymbols = symbols.map(symbol => ({
      original: symbol,
      yahoo: this.toYahooSymbol(symbol),
    }));

    const missingSymbols = [...new Set(
      requestedSymbols
        .map(({ yahoo }) => yahoo)
        .filter(yahoo => !this.getCachedQuote(yahoo))
    )];

    const fetchErrors = new Map();
    const BATCH_SIZE = 25;

    for (let i = 0; i < missingSymbols.length; i += BATCH_SIZE) {
      const batch = missingSymbols.slice(i, i + BATCH_SIZE);

      try {
        const resultMap = await this.fetchQuotesBatch(batch);

        for (const yahooSymbol of batch) {
          try {
            const quote = this.parseQuoteResult(resultMap.get(yahooSymbol), yahooSymbol);
            this.setCachedQuote(yahooSymbol, quote);
          } catch (error) {
            fetchErrors.set(yahooSymbol, error.message);
          }
        }
      } catch (error) {
        for (const yahooSymbol of batch) {
          fetchErrors.set(yahooSymbol, error.message);
        }
      }
    }

    return requestedSymbols.map(({ yahoo }) => {
      const cachedQuote = this.getCachedQuote(yahoo);
      if (cachedQuote) {
        return cachedQuote;
      }

      return {
        symbol: yahoo,
        error: fetchErrors.get(yahoo) || `Yahoo Finance quote not found for ${yahoo}`,
      };
    });
  }

  async getPortfolioQuotes(holdings) {
    if (!holdings.length) {
      return [];
    }

    const quotes = await this.getQuotes(holdings.map(holding => holding.code));

    return holdings.map((holding, index) => {
      const quote = quotes[index];

      if (quote?.error) {
        return {
          ...holding,
          quote: null,
          error: quote.error,
        };
      }

      return {
        ...holding,
        quote,
      };
    });
  }

  clearCache() {
    this.cache.clear();
  }

  clearCachedQuote(symbol) {
    this.cache.delete(this.toYahooSymbol(symbol));
  }

  getCacheStats() {
    const symbols = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(value => value.timestamp);
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null;
    const newestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;

    return {
      size: this.cache.size,
      symbols,
      cacheDurationMs: this.cacheDurationMs,
      oldestCacheTime: oldestTimestamp,
      newestCacheTime: newestTimestamp,
    };
  }

  getOldestCacheTimestamp() {
    if (this.cache.size === 0) return null;
    return Math.min(...Array.from(this.cache.values()).map(value => value.timestamp));
  }

  getNewestCacheTimestamp() {
    if (this.cache.size === 0) return null;
    return Math.max(...Array.from(this.cache.values()).map(value => value.timestamp));
  }

  async validateApiKey() {
    try {
      await this.getQuote('AAPL');
      return true;
    } catch (error) {
      console.error('Yahoo Finance validation failed:', error);
      return false;
    }
  }
}

export function createYFinanceService(cacheDurationMs = 60000) {
  return new YFinanceService(cacheDurationMs);
}
