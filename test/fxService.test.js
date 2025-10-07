import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFxService } from '../src/fxService.js';

describe('FxService', () => {
  let fxService;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    fxService = createFxService(mockApiKey);
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getLatestRates', () => {
    it('should fetch rates from API on first call', async () => {
      const mockResponse = {
        rates: {
          SGD: 1.35,
          AUD: 1.52
        }
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });
      
      const rates = await fxService.getLatestRates(['SGD', 'AUD']);
      
      expect(rates).toEqual({ SGD: 1.35, AUD: 1.52 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('openexchangerates.org')
      );
    });
    
    it('should use cached rates within cache duration', async () => {
      const mockResponse = {
        rates: {
          SGD: 1.35,
          AUD: 1.52
        }
      };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });
      
      // First call
      await fxService.getLatestRates(['SGD', 'AUD']);
      
      // Advance time by 30 minutes (less than 1 hour cache duration)
      vi.advanceTimersByTime(30 * 60 * 1000);
      
      // Second call should use cache
      const rates = await fxService.getLatestRates(['SGD', 'AUD']);
      
      expect(rates).toEqual({ SGD: 1.35, AUD: 1.52 });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    it('should refresh cache after cache expires', async () => {
      const mockResponse1 = {
        rates: {
          SGD: 1.35,
          AUD: 1.52
        }
      };
      
      const mockResponse2 = {
        rates: {
          SGD: 1.40,
          AUD: 1.55
        }
      };
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2
        });
      
      // First call
      const rates1 = await fxService.getLatestRates(['SGD', 'AUD']);
      
      // Advance time by 2 hours (more than 1 hour cache duration)
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      
      // Second call should fetch new data
      const rates2 = await fxService.getLatestRates(['SGD', 'AUD']);
      
      expect(rates1).toEqual({ SGD: 1.35, AUD: 1.52 });
      expect(rates2).toEqual({ SGD: 1.40, AUD: 1.55 });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    it('should return fallback rates on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const rates = await fxService.getLatestRates(['SGD', 'AUD']);
      
      expect(rates).toEqual({ SGD: 1.35, AUD: 1.52 });
    });
    
    it('should return fallback rates on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const rates = await fxService.getLatestRates(['SGD', 'AUD']);
      
      expect(rates).toEqual({ SGD: 1.35, AUD: 1.52 });
    });
  });

  describe('convertFromUSD', () => {
    it('should convert USD to target currency', () => {
      const rates = { SGD: 1.35, AUD: 1.52 };
      
      const sgdAmount = fxService.convertFromUSD(100, 'SGD', rates);
      const audAmount = fxService.convertFromUSD(100, 'AUD', rates);
      
      expect(sgdAmount).toBe(135);
      expect(audAmount).toBe(152);
    });
    
    it('should return original amount for USD', () => {
      const rates = { SGD: 1.35, AUD: 1.52 };
      
      const usdAmount = fxService.convertFromUSD(100, 'USD', rates);
      
      expect(usdAmount).toBe(100);
    });
    
    it('should return original amount if rate not found', () => {
      const rates = { SGD: 1.35 };
      
      const amount = fxService.convertFromUSD(100, 'EUR', rates);
      
      expect(amount).toBe(100);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct currency symbols', () => {
      expect(fxService.getCurrencySymbol('USD')).toBe('$');
      expect(fxService.getCurrencySymbol('SGD')).toBe('S$');
      expect(fxService.getCurrencySymbol('AUD')).toBe('A$');
    });
    
    it('should return default $ for unknown currency', () => {
      expect(fxService.getCurrencySymbol('EUR')).toBe('$');
    });
  });

  describe('getFallbackRates', () => {
    it('should return fallback rates for requested currencies', () => {
      const rates = fxService.getFallbackRates(['SGD', 'AUD']);
      
      expect(rates).toEqual({ SGD: 1.35, AUD: 1.52 });
    });
    
    it('should only return rates for requested currencies', () => {
      const rates = fxService.getFallbackRates(['SGD']);
      
      expect(rates).toEqual({ SGD: 1.35 });
      expect(rates).not.toHaveProperty('AUD');
    });
  });
});
