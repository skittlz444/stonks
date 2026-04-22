/**
 * Tests for Yahoo Finance quote integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { YFinanceService, createYFinanceService } from '../src/yfinanceService.js';

describe('YFinanceService API Integration', () => {
  let service;

  beforeEach(() => {
    service = new YFinanceService();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getQuote', () => {
    it('should fetch quote from Yahoo Finance successfully', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteResponse: {
            result: [{
              symbol: 'AAPL',
              currency: 'USD',
              regularMarketPrice: 150.5,
              regularMarketPreviousClose: 149.5,
              regularMarketChange: 1,
              regularMarketChangePercent: 0.67,
              regularMarketDayHigh: 151,
              regularMarketDayLow: 149,
              regularMarketOpen: 150,
              regularMarketTime: 1696598400,
            }],
          },
        }),
      });

      const quote = await service.getQuote('AAPL');

      expect(quote).toEqual({
        symbol: 'AAPL',
        providerSymbol: 'AAPL',
        currency: 'USD',
        current: 150.5,
        high: 151,
        low: 149,
        open: 150,
        previousClose: 149.5,
        change: 1,
        changePercent: 0.67,
        timestamp: 1696598400,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL')
      );
    });

    it('should map SGX symbols to Yahoo Finance format', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteResponse: {
            result: [{
              symbol: 'D05.SI',
              currency: 'SGD',
              regularMarketPrice: 32,
              regularMarketPreviousClose: 31,
            }],
          },
        }),
      });

      const quote = await service.getQuote('SGX:D05');

      expect(quote.symbol).toBe('D05.SI');
      expect(quote.currency).toBe('SGD');
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      await expect(service.getQuote('AAPL')).rejects.toThrow('Yahoo Finance API error: 500 Server Error');
    });

    it('should handle missing quotes', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quoteResponse: { result: [] } }),
      });

      await expect(service.getQuote('UNKNOWN')).rejects.toThrow('Yahoo Finance quote not found for UNKNOWN');
    });
  });

  describe('getQuotes', () => {
    it('should fetch multiple quotes in one request', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteResponse: {
            result: [
              {
                symbol: 'AAPL',
                currency: 'USD',
                regularMarketPrice: 150,
                regularMarketPreviousClose: 149,
              },
              {
                symbol: '0700.HK',
                currency: 'HKD',
                regularMarketPrice: 400,
                regularMarketPreviousClose: 395,
              },
            ],
          },
        }),
      });

      const quotes = await service.getQuotes(['AAPL', 'HKEX:0700']);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('0700.HK');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should report partial failures in batch requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteResponse: {
            result: [{
              symbol: 'AAPL',
              currency: 'USD',
              regularMarketPrice: 150,
              regularMarketPreviousClose: 149,
            }],
          },
        }),
      });

      const quotes = await service.getQuotes(['AAPL', 'INVALID']);

      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1]).toEqual({
        symbol: 'INVALID',
        error: 'Yahoo Finance quote not found for INVALID',
      });
    });

    it('should return an empty array for no symbols', async () => {
      await expect(service.getQuotes([])).resolves.toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolioQuotes', () => {
    it('should enrich holdings with quote data and currencies', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          quoteResponse: {
            result: [
              {
                symbol: 'AAPL',
                currency: 'USD',
                regularMarketPrice: 150,
                regularMarketPreviousClose: 149,
              },
              {
                symbol: 'D05.SI',
                currency: 'SGD',
                regularMarketPrice: 32,
                regularMarketPreviousClose: 31.5,
              },
            ],
          },
        }),
      });

      const holdings = [
        { id: 1, code: 'AAPL', name: 'Apple', currency: 'USD', quantity: 10 },
        { id: 2, code: 'SGX:D05', name: 'DBS', currency: 'SGD', quantity: 5 },
      ];

      const enriched = await service.getPortfolioQuotes(holdings);

      expect(enriched[0].quote?.currency).toBe('USD');
      expect(enriched[1].quote?.currency).toBe('SGD');
    });

    it('should attach errors when quote lookup fails', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ quoteResponse: { result: [] } }),
      });

      const enriched = await service.getPortfolioQuotes([
        { id: 1, code: 'INVALID', name: 'Invalid', currency: 'USD', quantity: 1 },
      ]);

      expect(enriched[0].quote).toBe(null);
      expect(enriched[0].error).toBe('Yahoo Finance quote not found for INVALID');
    });
  });

  describe('symbol helpers', () => {
    it('should extract raw symbols', () => {
      expect(service.extractSymbol('BATS:VOO')).toBe('VOO');
      expect(service.extractSymbol('AAPL')).toBe('AAPL');
    });

    it('should translate common exchange codes to Yahoo symbols', () => {
      expect(service.toYahooSymbol('BATS:VOO')).toBe('VOO');
      expect(service.toYahooSymbol('SGX:D05')).toBe('D05.SI');
      expect(service.toYahooSymbol('HKEX:0700')).toBe('0700.HK');
      expect(service.toYahooSymbol('ASX:CBA')).toBe('CBA.AX');
    });
  });

  describe('factory', () => {
    it('should create a service with the default cache duration', () => {
      const newService = createYFinanceService();
      expect(newService.getCacheStats().cacheDurationMs).toBe(60000);
    });
  });
});
