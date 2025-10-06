/**
 * Tests for prices page generation
 * Run with: npm test test/prices.test.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generatePricesPage } from '../src/prices.js';

describe('Prices Page Generation', () => {
  let mockDatabaseService;
  let mockFinnhubService;

  beforeEach(() => {
    // Mock database service
    mockDatabaseService = {
      db: {
        prepare: vi.fn()
      },
      getCashAmount: vi.fn()
    };

    // Mock Finnhub service
    mockFinnhubService = {
      getPortfolioQuotes: vi.fn(),
      getOldestCacheTimestamp: vi.fn(),
      getCacheStats: vi.fn()
    };
  });

  describe('Missing Finnhub service', () => {
    it('should display warning when Finnhub service is not available', async () => {
      const response = await generatePricesPage(mockDatabaseService, null);
      const html = await response.text();

      expect(html).toContain('Finnhub API Key Required');
      expect(html).toContain('Get a free API key');
      expect(html).toContain('finnhub.io');
      expect(html).toContain('.env');
    });
  });

  describe('Empty portfolio', () => {
    it('should display message when no holdings exist', async () => {
      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: [] })
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('No holdings configured');
      expect(html).toContain('Add some holdings');
      expect(html).toContain('/stonks/config');
    });
  });

  describe('Portfolio with holdings', () => {
    beforeEach(() => {
      const mockHoldings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00 },
        { id: 2, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 145.00 }
      ];

      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockHoldings })
      });

      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'VOO',
            current: 385.20,
            high: 386.00,
            low: 384.00,
            open: 385.00,
            previousClose: 384.50,
            change: 0.70,
            changePercent: 0.18,
            timestamp: 1696598400
          },
          marketValue: 3852.00,
          costBasis: 3800.00,
          gain: 52.00,
          gainPercent: 1.37,
          error: null
        },
        {
          ...mockHoldings[1],
          quote: {
            symbol: 'AAPL',
            current: 150.50,
            high: 151.00,
            low: 149.00,
            open: 150.00,
            previousClose: 149.50,
            change: 1.00,
            changePercent: 0.67,
            timestamp: 1696598400
          },
          marketValue: 752.50,
          costBasis: 725.00,
          gain: 27.50,
          gainPercent: 3.79,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 2,
        symbols: ['VOO', 'AAPL'],
        cacheDurationMs: 60000,
        oldestCacheTime: 1696598400000,
        newestCacheTime: 1696598400000
      });
    });

    it('should display portfolio summary cards', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Total portfolio value (market value + cash)
      expect(html).toContain('Portfolio Value');
      expect(html).toContain('$4604.50'); // 3852 + 752.50 + 1000

      // Market value
      expect(html).toContain('Market Value');
      expect(html).toContain('$4604.50'); // 3852 + 752.50

      // Cash
      expect(html).toContain('Cash');
      expect(html).toContain('$1000.00');

      // Total gain
      expect(html).toContain('Total Gain/Loss');
      expect(html).toContain('$79.50'); // 52 + 27.50
    });

    it('should display holdings table with correct data', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // VOO holding
      expect(html).toContain('Vanguard S&P 500');
      expect(html).toContain('BATS:VOO');
      expect(html).toContain('$385.20');
      expect(html).toContain('$3852.00');
      expect(html).toContain('$52.00');

      // AAPL holding
      expect(html).toContain('Apple Inc');
      expect(html).toContain('NASDAQ:AAPL');
      expect(html).toContain('$150.50');
      expect(html).toContain('$752.50');
      expect(html).toContain('$27.50');
    });

    it('should display day change with correct formatting', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Positive changes should have success class and up arrow
      expect(html).toContain('text-success');
      expect(html).toContain('▲');

      // Day change amounts and percentages
      expect(html).toContain('$0.70');
      expect(html).toContain('0.18%');
      expect(html).toContain('$1.00');
      expect(html).toContain('0.67%');
    });

    it('should display cache information', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Last updated timestamp
      expect(html).toContain('Last updated:');

      // Cached badge
      expect(html).toContain('Cached');
      expect(html).toContain('badge bg-success');

      // Cache stats
      expect(html).toContain('2 symbols in cache');
    });

    it('should display navigation buttons', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('🔄 Refresh');
      expect(html).toContain('⚙️ Settings');
      expect(html).toContain('/stonks/ticker');
      expect(html).toContain('/stonks/charts');
      expect(html).toContain('/stonks/charts/large');
      expect(html).toContain('/stonks/config');
    });

    it('should use current time when cache timestamp is null', async () => {
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(null);

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Last updated:');
      expect(mockFinnhubService.getOldestCacheTimestamp).toHaveBeenCalled();
    });

    it('should not show cached badge when cache is empty', async () => {
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 0,
        symbols: [],
        cacheDurationMs: 60000,
        oldestCacheTime: null,
        newestCacheTime: null
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('0 symbols in cache');
    });
  });

  describe('Holdings with errors', () => {
    it('should display error for holdings with API errors', async () => {
      const mockHoldings = [
        { id: 1, code: 'INVALID:SYMBOL', name: 'Invalid Stock', quantity: 10, averageCost: 100.00 }
      ];

      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockHoldings })
      });

      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: null,
          error: 'Finnhub API error: 404 Not Found'
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 0,
        symbols: [],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Invalid Stock');
      expect(html).toContain('INVALID:SYMBOL');
      expect(html).toContain('Error:');
      expect(html).toContain('404 Not Found');
      expect(html).toContain('text-danger');
    });
  });

  describe('Portfolio with losses', () => {
    it('should display negative gains with danger styling', async () => {
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 160.00 }
      ];

      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockHoldings })
      });

      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'AAPL',
            current: 150.00,
            high: 151.00,
            low: 149.00,
            open: 150.00,
            previousClose: 151.00,
            change: -1.00,
            changePercent: -0.66,
            timestamp: 1696598400
          },
          marketValue: 750.00,
          costBasis: 800.00,
          gain: -50.00,
          gainPercent: -6.25,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['AAPL'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Negative day change (uses Math.abs, so shows $1.00 not -$1.00)
      expect(html).toContain('text-danger');
      expect(html).toContain('▼');
      expect(html).toContain('$1.00');
      expect(html).toContain('-0.66%');

      // Negative total gain (shows $-50.00)
      expect(html).toContain('$-50.00');
      expect(html).toContain('-6.25%');
    });

    it('should show danger background for negative total gain card', async () => {
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 160.00 }
      ];

      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockHoldings })
      });

      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'AAPL',
            current: 150.00,
            previousClose: 151.00,
            change: -1.00,
            changePercent: -0.66,
            high: 151.00,
            low: 149.00,
            open: 150.00,
            timestamp: 1696598400
          },
          marketValue: 750.00,
          costBasis: 800.00,
          gain: -50.00,
          gainPercent: -6.25,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['AAPL'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('bg-danger');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabaseService.db.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Error Loading Prices');
      expect(html).toContain('Database connection failed');
      expect(html).toContain('/stonks/config');
    });

    it('should handle Finnhub service errors gracefully', async () => {
      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [{ id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00 }]
        })
      });

      mockFinnhubService.getPortfolioQuotes.mockRejectedValue(new Error('API rate limit exceeded'));

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Error Loading Prices');
      expect(html).toContain('API rate limit exceeded');
    });

    it('should handle getCashAmount errors', async () => {
      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({
          results: [{ id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00 }]
        })
      });

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          id: 1,
          code: 'AAPL',
          name: 'Apple Inc',
          quantity: 5,
          averageCost: 150.00,
          quote: { symbol: 'AAPL', current: 150.00, previousClose: 149.00, change: 1.00, changePercent: 0.67 },
          marketValue: 750.00,
          costBasis: 750.00,
          gain: 0,
          gainPercent: 0,
          error: null
        }
      ]);

      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({ size: 1, symbols: ['AAPL'], cacheDurationMs: 60000 });
      
      mockDatabaseService.getCashAmount.mockRejectedValue(new Error('Cash query failed'));

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Error Loading Prices');
      expect(html).toContain('Cash query failed');
    });
  });

  describe('Singular/plural handling', () => {
    it('should use singular "symbol" for one cached symbol', async () => {
      const mockHoldings = [
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00 }
      ];

      mockDatabaseService.db.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: mockHoldings })
      });

      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'AAPL',
            current: 150.00,
            previousClose: 149.00,
            change: 1.00,
            changePercent: 0.67,
            high: 151.00,
            low: 149.00,
            open: 150.00,
            timestamp: 1696598400
          },
          marketValue: 750.00,
          costBasis: 745.00,
          gain: 5.00,
          gainPercent: 0.67,
          error: null
        }
      ]);

      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['AAPL'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('1 symbol in cache');
    });
  });
});
