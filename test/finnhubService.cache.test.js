/**
 * Finnhub Service Caching Tests
 * Run with: npm test test/finnhubService.cache.test.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinnhubService, createFinnhubService } from '../src/finnhubService.js';

describe('FinnhubService Caching', () => {
  let service;
  const mockApiKey = 'test_api_key';

  beforeEach(() => {
    // Create service with 1 second cache for faster tests
    service = new FinnhubService(mockApiKey, 1000);
  });

  describe('Cache initialization', () => {
    it('should initialize with empty cache', () => {
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.symbols).toEqual([]);
      expect(stats.cacheDurationMs).toBe(1000);
    });

    it('should accept custom cache duration', () => {
      const customService = new FinnhubService(mockApiKey, 5000);
      const stats = customService.getCacheStats();
      expect(stats.cacheDurationMs).toBe(5000);
    });

    it('should use default cache duration of 60 seconds', () => {
      const defaultService = new FinnhubService(mockApiKey);
      const stats = defaultService.getCacheStats();
      expect(stats.cacheDurationMs).toBe(60000);
    });
  });

  describe('Cache management', () => {
    it('should store and retrieve cached data', () => {
      const mockQuote = { symbol: 'AAPL', current: 150.50 };
      service.setCachedQuote('AAPL', mockQuote);

      const cached = service.getCachedQuote('AAPL');
      expect(cached).toEqual(mockQuote);
    });

    it('should validate cache freshness', () => {
      const mockQuote = { symbol: 'AAPL', current: 150.50 };
      service.setCachedQuote('AAPL', mockQuote);

      expect(service.isCacheValid('AAPL')).toBe(true);
    });

    it('should expire cache after duration', async () => {
      const mockQuote = { symbol: 'AAPL', current: 150.50 };
      service.setCachedQuote('AAPL', mockQuote);

      // Wait for cache to expire (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(service.isCacheValid('AAPL')).toBe(false);
      expect(service.getCachedQuote('AAPL')).toBe(null);
    });

    it('should clear specific cached quote', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150.50 });
      service.setCachedQuote('GOOGL', { symbol: 'GOOGL', current: 2800.00 });

      service.clearCachedQuote('AAPL');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.symbols).toEqual(['GOOGL']);
    });

    it('should clear all cache', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150.50 });
      service.setCachedQuote('GOOGL', { symbol: 'GOOGL', current: 2800.00 });

      service.clearCache();

      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.symbols).toEqual([]);
    });
  });

  describe('Cache statistics', () => {
    it('should report accurate cache stats', () => {
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150.50 });
      service.setCachedQuote('GOOGL', { symbol: 'GOOGL', current: 2800.00 });
      service.setCachedQuote('MSFT', { symbol: 'MSFT', current: 380.00 });

      const stats = service.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.symbols).toContain('AAPL');
      expect(stats.symbols).toContain('GOOGL');
      expect(stats.symbols).toContain('MSFT');
      expect(stats.cacheDurationMs).toBe(1000);
      expect(stats.oldestCacheTime).toBeGreaterThan(0);
      expect(stats.newestCacheTime).toBeGreaterThan(0);
      expect(stats.newestCacheTime).toBeGreaterThanOrEqual(stats.oldestCacheTime);
    });

    it('should return null timestamps for empty cache', () => {
      const oldestTime = service.getOldestCacheTimestamp();
      const newestTime = service.getNewestCacheTimestamp();
      
      expect(oldestTime).toBe(null);
      expect(newestTime).toBe(null);
    });

    it('should track oldest and newest cache timestamps', () => {
      const before = Date.now();
      
      service.setCachedQuote('AAPL', { symbol: 'AAPL', current: 150.50 });
      service.setCachedQuote('GOOGL', { symbol: 'GOOGL', current: 2800.00 });
      
      const after = Date.now();
      
      const oldestTime = service.getOldestCacheTimestamp();
      const newestTime = service.getNewestCacheTimestamp();
      
      expect(oldestTime).toBeGreaterThanOrEqual(before);
      expect(oldestTime).toBeLessThanOrEqual(after);
      expect(newestTime).toBeGreaterThanOrEqual(oldestTime);
      expect(newestTime).toBeLessThanOrEqual(after);
    });
  });

  describe('getQuote with caching', () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = vi.fn();
    });

    it('should use cache on second call within cache duration', async () => {
      const mockData = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: Date.now() };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      // First call - should fetch from API
      const quote1 = await service.getQuote('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(quote1.current).toBe(150.50);

      // Second call - should use cache
      const quote2 = await service.getQuote('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, no new call
      expect(quote2.current).toBe(150.50);

      // Verify cache stats
      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.symbols).toContain('AAPL');
    });

    it('should fetch new data after cache expires', async () => {
      const mockData1 = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: Date.now() };
      const mockData2 = { c: 152.00, h: 153.00, l: 151.00, o: 151.50, pc: 150.50, t: Date.now() };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockData1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockData2 });

      // First call
      const quote1 = await service.getQuote('AAPL');
      expect(quote1.current).toBe(150.50);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Second call - should fetch fresh data
      const quote2 = await service.getQuote('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(quote2.current).toBe(152.00);
    });

    it('should handle exchange:symbol format with caching', async () => {
      const mockData = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: Date.now() };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      // Clear previous mock calls
      global.fetch.mockClear();

      // First call with exchange prefix
      await service.getQuote('NASDAQ:AAPL');
      
      // Second call without exchange prefix should use same cache
      const quote = await service.getQuote('AAPL');
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(quote.symbol).toBe('AAPL');
    });
  });

  describe('createFinnhubService factory', () => {
    it('should create service with default cache duration', () => {
      const newService = createFinnhubService(mockApiKey);
      const stats = newService.getCacheStats();
      expect(stats.cacheDurationMs).toBe(60000);
    });

    it('should create service with custom cache duration', () => {
      const newService = createFinnhubService(mockApiKey, 5000);
      const stats = newService.getCacheStats();
      expect(stats.cacheDurationMs).toBe(5000);
    });

    it('should return null if no API key provided', () => {
      const newService = createFinnhubService(null);
      expect(newService).toBe(null);
    });
  });
});
