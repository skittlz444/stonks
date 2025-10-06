/**
 * Tests for FinnhubService API integration
 * Run with: npm test test/finnhubService.test.js
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FinnhubService, createFinnhubService } from '../src/finnhubService.js';

describe('FinnhubService API Integration', () => {
  let service;
  const mockApiKey = 'test_api_key_12345';

  beforeEach(() => {
    service = new FinnhubService(mockApiKey);
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getQuote', () => {
    it('should fetch quote from API successfully', async () => {
      const mockData = {
        c: 150.50,
        h: 151.00,
        l: 149.00,
        o: 150.00,
        pc: 149.50,
        t: 1696598400
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const quote = await service.getQuote('AAPL');

      expect(quote).toEqual({
        symbol: 'AAPL',
        current: 150.50,
        high: 151.00,
        low: 149.00,
        open: 150.00,
        previousClose: 149.50,
        change: 1.00,
        changePercent: 0.6688963210702341,
        timestamp: 1696598400
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://finnhub.io/api/v1/quote?symbol=AAPL&token=test_api_key_12345')
      );
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(service.getQuote('AAPL')).rejects.toThrow('Finnhub API error: 401 Unauthorized');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(service.getQuote('AAPL')).rejects.toThrow('Network error');
    });

    it('should extract symbol from exchange:symbol format', async () => {
      const mockData = {
        c: 385.20,
        h: 386.00,
        l: 384.00,
        o: 385.00,
        pc: 384.50,
        t: 1696598400
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const quote = await service.getQuote('BATS:VOO');

      expect(quote.symbol).toBe('VOO');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('symbol=VOO')
      );
    });

    it('should handle zero values', async () => {
      const mockData = {
        c: 0,
        h: 0,
        l: 0,
        o: 0,
        pc: 0,
        t: 1696598400
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const quote = await service.getQuote('TEST');

      expect(quote.current).toBe(0);
      expect(quote.change).toBe(0);
      expect(isNaN(quote.changePercent)).toBe(true); // Division by zero
    });
  });

  describe('getQuotes', () => {
    it('should fetch multiple quotes', async () => {
      const mockData1 = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: 1696598400 };
      const mockData2 = { c: 2800.00, h: 2810.00, l: 2790.00, o: 2795.00, pc: 2790.00, t: 1696598400 };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockData1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockData2 });

      const quotes = await service.getQuotes(['AAPL', 'GOOGL']);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('GOOGL');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch', async () => {
      const mockData = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: 1696598400 };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockData })
        .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });

      const quotes = await service.getQuotes(['AAPL', 'INVALID']);

      expect(quotes).toHaveLength(2);
      expect(quotes[0].symbol).toBe('AAPL');
      expect(quotes[1].symbol).toBe('INVALID');
      expect(quotes[1].error).toBe('Finnhub API error: 404 Not Found');
    });

    it('should handle empty symbol array', async () => {
      const quotes = await service.getQuotes([]);
      expect(quotes).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('getPortfolioQuotes', () => {
    it('should enrich holdings with quote data', async () => {
      const holdings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00 },
        { id: 2, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 145.00 }
      ];

      const mockData1 = { c: 385.20, h: 386.00, l: 384.00, o: 385.00, pc: 384.50, t: 1696598400 };
      const mockData2 = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: 1696598400 };

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockData1 })
        .mockResolvedValueOnce({ ok: true, json: async () => mockData2 });

      const enrichedHoldings = await service.getPortfolioQuotes(holdings);

      expect(enrichedHoldings).toHaveLength(2);
      
      // Check VOO
      expect(enrichedHoldings[0].quote.symbol).toBe('VOO');
      expect(enrichedHoldings[0].marketValue).toBe(3852.00); // 10 * 385.20
      expect(enrichedHoldings[0].costBasis).toBe(3800.00); // 10 * 380.00
      expect(enrichedHoldings[0].gain).toBeCloseTo(52.00, 1); // Floating point precision
      expect(enrichedHoldings[0].gainPercent).toBeCloseTo(1.37, 1);

      // Check AAPL
      expect(enrichedHoldings[1].quote.symbol).toBe('AAPL');
      expect(enrichedHoldings[1].marketValue).toBe(752.50); // 5 * 150.50
      expect(enrichedHoldings[1].costBasis).toBe(725.00); // 5 * 145.00
      expect(enrichedHoldings[1].gain).toBe(27.50);
      expect(enrichedHoldings[1].gainPercent).toBeCloseTo(3.79, 1);
    });

    it('should handle holdings with errors', async () => {
      const holdings = [
        { id: 1, code: 'INVALID:SYMBOL', name: 'Invalid Stock', quantity: 10, averageCost: 100.00 }
      ];

      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const enrichedHoldings = await service.getPortfolioQuotes(holdings);

      expect(enrichedHoldings[0].quote).toBe(null);
      expect(enrichedHoldings[0].error).toBe('Finnhub API error: 404 Not Found');
    });

    it('should use previousClose when averageCost is missing', async () => {
      const holdings = [
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5 } // No averageCost
      ];

      const mockData = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: 1696598400 };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const enrichedHoldings = await service.getPortfolioQuotes(holdings);

      expect(enrichedHoldings[0].costBasis).toBe(747.50); // 5 * 149.50 (previousClose)
      expect(enrichedHoldings[0].gain).toBe(5.00); // (150.50 - 149.50) * 5
    });

    it('should handle empty holdings array', async () => {
      const enrichedHoldings = await service.getPortfolioQuotes([]);
      expect(enrichedHoldings).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      const mockData = { c: 150.50, h: 151.00, l: 149.00, o: 150.00, pc: 149.50, t: 1696598400 };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockData
      });

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(false);
    });

    it('should return false on network error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const isValid = await service.validateApiKey();
      expect(isValid).toBe(false);
    });
  });

  describe('extractSymbol', () => {
    it('should extract symbol from exchange:symbol format', () => {
      expect(service.extractSymbol('BATS:VOO')).toBe('VOO');
      expect(service.extractSymbol('NASDAQ:AAPL')).toBe('AAPL');
      expect(service.extractSymbol('NYSE:JPM')).toBe('JPM');
    });

    it('should return symbol as-is if no colon', () => {
      expect(service.extractSymbol('AAPL')).toBe('AAPL');
      expect(service.extractSymbol('VOO')).toBe('VOO');
    });

    it('should handle empty or null input', () => {
      expect(service.extractSymbol('')).toBe('');
      expect(service.extractSymbol(null)).toBe('');
      expect(service.extractSymbol(undefined)).toBe('');
    });

    it('should handle multiple colons', () => {
      // The current implementation only splits once, taking the second part
      expect(service.extractSymbol('EXCHANGE:SUB:SYMBOL')).toBe('SUB');
    });
  });
});
