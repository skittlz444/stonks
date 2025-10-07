/**
 * FX Service - Handles currency exchange rates from OpenExchangeRates API
 * Provides caching to minimize API calls (rates are cached for 1 hour)
 */

export class FxService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openexchangerates.org/api';
    this.cache = new Map();
    this.cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Fetch latest exchange rates from OpenExchangeRates
   * @param {string[]} currencies - Array of currency codes to fetch (e.g., ['SGD', 'AUD'])
   * @returns {Promise<Object>} - Object with currency codes as keys and rates as values
   */
  async getLatestRates(currencies = ['SGD', 'AUD']) {
    const cacheKey = 'latest_rates';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log('Using cached FX rates');
      return this.filterRates(cached.data, currencies);
    }

    try {
      const symbols = currencies.join(',');
      const url = `${this.baseUrl}/latest.json?app_id=${this.apiKey}&symbols=${symbols}&base=USD`;
      
      console.log('Fetching FX rates from OpenExchangeRates...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OpenExchangeRates API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.rates) {
        throw new Error('Invalid response from OpenExchangeRates API');
      }

      // Cache the full response
      this.cache.set(cacheKey, {
        data: data.rates,
        timestamp: Date.now()
      });

      return this.filterRates(data.rates, currencies);
    } catch (error) {
      console.error('Error fetching FX rates:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Using expired cache due to API error');
        return this.filterRates(cached.data, currencies);
      }
      
      // Return fallback rates if no cache available
      console.log('Using fallback FX rates');
      return this.getFallbackRates(currencies);
    }
  }

  /**
   * Filter rates to only include requested currencies
   */
  filterRates(allRates, currencies) {
    const filtered = {};
    for (const currency of currencies) {
      if (allRates[currency]) {
        filtered[currency] = allRates[currency];
      }
    }
    return filtered;
  }

  /**
   * Get fallback rates in case API is unavailable
   * These are approximate rates and should be updated periodically
   */
  getFallbackRates(currencies) {
    const fallback = {
      'SGD': 1.35,  // Approximate USD to SGD rate
      'AUD': 1.52   // Approximate USD to AUD rate
    };
    
    const filtered = {};
    for (const currency of currencies) {
      if (fallback[currency]) {
        filtered[currency] = fallback[currency];
      }
    }
    return filtered;
  }

  /**
   * Convert amount from USD to target currency
   * @param {number} amountUSD - Amount in USD
   * @param {string} targetCurrency - Target currency code (e.g., 'SGD', 'AUD')
   * @param {Object} rates - Exchange rates object
   * @returns {number} - Converted amount
   */
  convertFromUSD(amountUSD, targetCurrency, rates) {
    if (targetCurrency === 'USD') {
      return amountUSD;
    }
    
    const rate = rates[targetCurrency];
    if (!rate) {
      console.warn(`No rate available for ${targetCurrency}, returning USD amount`);
      return amountUSD;
    }
    
    return amountUSD * rate;
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(currency) {
    const symbols = {
      'USD': '$',
      'SGD': 'S$',
      'AUD': 'A$'
    };
    return symbols[currency] || '$';
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Factory function to create FxService instance
 * Returns null if no API key is provided
 */
export function createFxService(apiKey) {
  if (!apiKey) {
    console.log('OpenExchangeRates API key not provided. Currency conversion will not be available.');
    return null;
  }
  return new FxService(apiKey);
}
