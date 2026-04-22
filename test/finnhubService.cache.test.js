/**
 * Yahoo Finance quote caching tests.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YFinanceService, createYFinanceService } from '../src/yfinanceService.js';

describe('YFinanceService Caching', () => {
  let service;

  beforeEach(() => {
    service = new YFinanceService(1000);
    global.fetch = vi.fn();
  });

  describe('cache management', () => {
    it('should initialize with an empty cache', () => {
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.symbols).toEqual([]);
      expect(stats.cacheDurationMs).toBe(1000);
    });

    it('should store and retrieve cached quotes', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150 });
      expect(service.getCachedQuote('AAPL')).toEqual({ symbol: 'AAPL', current: 150 });
    });

    it('should expire cache entries after the configured duration', async () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150 });
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(service.isCacheValid('AAPL')).toBe(false);
      expect(service.getCachedQuote('AAPL')).toBe(null);
    });

    it('should clear a specific cached quote by mapped Yahoo symbol', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150 });
      service.setCachedQuote('0700.HK', { symbol: '0700.HK', current: 400 });
      service.clearCachedQuote('HKEX:0700');
      expect(service.getCacheStats().symbols).toEqual(['AAPL']);
    });

    it('should clear the full cache', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150 });
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('getQuote with caching', () => {
    it('should reuse the cache on repeat lookups', async () => {
      global.fetch.mockResolvedValueOnce({
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

      await service.getQuote('AAPL');
      await service.getQuote('AAPL');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(service.getCacheStats().size).toBe(1);
    });

    it('should fetch fresh data after cache expiry', async () => {
      global.fetch
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            quoteResponse: {
              result: [{
                symbol: 'AAPL',
                currency: 'USD',
                regularMarketPrice: 152,
                regularMarketPreviousClose: 150,
              }],
            },
          }),
        });

      const firstQuote = await service.getQuote('AAPL');
      await new Promise(resolve => setTimeout(resolve, 1100));
      const secondQuote = await service.getQuote('AAPL');

      expect(firstQuote.current).toBe(150);
      expect(secondQuote.current).toBe(152);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should share cache entries across equivalent mapped symbols', async () => {
      global.fetch.mockResolvedValueOnce({
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

      await service.getQuote('NASDAQ:AAPL');
      await service.getQuote('AAPL');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('factory', () => {
    it('should create a service with a custom cache duration', () => {
      const newService = createYFinanceService(5000);
      expect(newService.getCacheStats().cacheDurationMs).toBe(5000);
    });
  });
});
