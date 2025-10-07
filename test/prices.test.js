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
      getCashAmount: vi.fn(),
      getPortfolioHoldings: vi.fn(),
      getVisiblePortfolioHoldings: vi.fn(),
      getClosedPositions: vi.fn().mockResolvedValue([]),
      getTransactionsByCode: vi.fn().mockResolvedValue([]),
      getAllTransactionsGroupedByCode: vi.fn().mockResolvedValue({})
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
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('No active holdings');
      expect(html).toContain('Add some holdings');
      expect(html).toContain('/stonks/config');
    });
  });

  describe('Portfolio with holdings', () => {
    beforeEach(() => {
      const mockHoldings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00, target_weight: null },
        { id: 2, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 145.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      
      // Mock transactions for cost basis calculation (grouped by code)
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'BATS:VOO': [
          { type: 'buy', quantity: 10, value: 3800, fee: 10, date: '2024-01-01' }
        ],
        'NASDAQ:AAPL': [
          { type: 'buy', quantity: 5, value: 725, fee: 5, date: '2024-01-01' }
        ]
      });

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

      // Total gain (calculated from transactions: VOO $42 + AAPL $22.50 = $64.50)
      expect(html).toContain('Total Gain/Loss');
      expect(html).toContain('$64.50');
    });

    it('should display holdings table with correct data', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // VOO holding
      expect(html).toContain('Vanguard S&P 500');
      expect(html).toContain('VOO'); // Stock code without exchange
      expect(html).toContain('$385.20');
      expect(html).toContain('$3852.00');
      expect(html).toContain('$42.00'); // Gain calculated from transactions: 3852 - 3810

      // AAPL holding
      expect(html).toContain('Apple Inc');
      expect(html).toContain('AAPL'); // Stock code without exchange
      expect(html).toContain('$150.50');
      expect(html).toContain('$752.50');
      expect(html).toContain('$22.50'); // Gain calculated from transactions: 752.50 - 730
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
      expect(html).toContain('⚙️ Config'); // Changed from Settings - now in top nav
      expect(html).toContain('/stonks/ticker');
      expect(html).toContain('/stonks/charts');
      expect(html).toContain('/stonks/charts/large');
      expect(html).toContain('/stonks/config');
      expect(html).toContain('📊 Live Prices'); // Top navigation
      expect(html).toContain('📈 Ticker View'); // Top navigation
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
        { id: 1, code: 'INVALID:SYMBOL', name: 'Invalid Stock', quantity: 10, averageCost: 100.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({});

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
      expect(html).toContain('SYMBOL'); // Stock code without exchange prefix
      expect(html).toContain('Error:');
      expect(html).toContain('404 Not Found');
      expect(html).toContain('text-danger');
    });
  });

  describe('Portfolio with losses', () => {
    it('should display negative gains with danger styling', async () => {
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 160.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'NASDAQ:AAPL': [
          { type: 'buy', quantity: 5, value: 800, fee: 10, date: '2024-01-01' }
        ]
      });

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
          costBasis: 810.00, // 800 + 10 fee
          gain: -60.00,
          gainPercent: -7.41,
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

      // Negative day change (uses Math.abs with arrow, so shows ▼ $1.00)
      expect(html).toContain('text-danger');
      expect(html).toContain('▼');
      expect(html).toContain('$1.00');
      expect(html).toContain('-0.66%');

      // Negative total gain (calculated from transactions: 750 - 810 = -60)
      expect(html).toContain('$-60.00');
      expect(html).toContain('-7.41%');
    });

    it('should show danger background for negative total gain card', async () => {
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 5, averageCost: 160.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'NASDAQ:AAPL': [
          { type: 'buy', quantity: 5, value: 800, fee: 10, date: '2024-01-01' }
        ]
      });

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
          costBasis: 810.00,
          gain: -60.00,
          gainPercent: -7.41,
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
      mockDatabaseService.getVisiblePortfolioHoldings.mockRejectedValue(new Error('Database connection failed'));

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Error Loading Prices');
      expect(html).toContain('Database connection failed');
      expect(html).toContain('/stonks/config');
    });

    it('should handle Finnhub service errors gracefully', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00, target_weight: null }
      ]);

      mockFinnhubService.getPortfolioQuotes.mockRejectedValue(new Error('API rate limit exceeded'));

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('Error Loading Prices');
      expect(html).toContain('API rate limit exceeded');
    });

    it('should handle getCashAmount errors', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00, target_weight: null }
      ]);

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          id: 1,
          code: 'AAPL',
          name: 'Apple Inc',
          quantity: 5,
          averageCost: 150.00,
          target_weight: null,
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
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
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

  describe('Rebalance mode', () => {
    it('should show rebalancing UI when rebalanceMode is true', async () => {
      const mockHoldings = [
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 10, averageCost: 150.00, target_weight: 50 },
        { id: 2, code: 'GOOGL', name: 'Alphabet Inc', quantity: 5, averageCost: 100.00, target_weight: 30 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(500);

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          id: 1,
          code: 'AAPL',
          name: 'Apple Inc',
          quantity: 10,
          averageCost: 150.00,
          target_weight: 50,
          quote: { symbol: 'AAPL', current: 150.00, previousClose: 149.00, change: 1.00, changePercent: 0.67 },
          marketValue: 1500.00,
          costBasis: 1500.00,
          gain: 0,
          gainPercent: 0,
          error: null
        },
        {
          id: 2,
          code: 'GOOGL',
          name: 'Alphabet Inc',
          quantity: 5,
          averageCost: 100.00,
          target_weight: 30,
          quote: { symbol: 'GOOGL', current: 100.00, previousClose: 99.00, change: 1.00, changePercent: 1.01 },
          marketValue: 500.00,
          costBasis: 500.00,
          gain: 0,
          gainPercent: 0,
          error: null
        }
      ]);

      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({ size: 2, symbols: ['AAPL', 'GOOGL'], cacheDurationMs: 60000 });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService, null, true);
      const html = await response.text();

      expect(html).toContain('Portfolio Rebalancing');
      expect(html).toContain('Rebalancing Recommendations');
      expect(html).toContain('Back to Prices');
      // In rebalance mode, Day Change and Total Gain/Loss metrics should be hidden
      expect(html).not.toContain('<h6 class="card-subtitle mb-2">Day Change</h6>');
      expect(html).not.toContain('<h6 class="card-subtitle mb-2">Total Gain/Loss</h6>');
      expect(html).not.toContain('closedPositionsAccordion');
    });

    it('should include holdings with target weight even if quantity is 0', async () => {
      const mockHoldings = [
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 10, averageCost: 150.00, target_weight: 40 },
        { id: 2, code: 'TSLA', name: 'Tesla Inc', quantity: 0, averageCost: 0, target_weight: 20 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'AAPL': [
          { type: 'buy', value: 1500, fee: 0 }
        ]
      });

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          id: 1,
          code: 'AAPL',
          name: 'Apple Inc',
          quantity: 10,
          averageCost: 150.00,
          target_weight: 40,
          quote: { symbol: 'AAPL', current: 150.00, previousClose: 149.00, change: 1.00, changePercent: 0.67 },
          marketValue: 1500.00,
          costBasis: 1500.00,
          gain: 0,
          gainPercent: 0,
          error: null
        },
        {
          id: 2,
          code: 'TSLA',
          name: 'Tesla Inc',
          quantity: 0,
          averageCost: 0,
          target_weight: 20,
          quote: { symbol: 'TSLA', current: 200.00, previousClose: 199.00, change: 1.00, changePercent: 0.50 },
          marketValue: 0,
          costBasis: 0,
          gain: 0,
          gainPercent: 0,
          error: null
        }
      ]);

      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({ size: 2, symbols: ['AAPL', 'TSLA'], cacheDurationMs: 60000 });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService, null, true);
      const html = await response.text();

      expect(html).toContain('Tesla Inc');
      expect(html).toContain('TSLA');
    });
  });

  describe('Sticky columns CSS', () => {
    it('should include sticky column styles for Name and Symbol columns', async () => {
      const mockHoldings = [
        { id: 1, code: 'AAPL', name: 'Apple Inc', quantity: 5, averageCost: 150.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'AAPL': [
          { type: 'buy', value: 750, fee: 0 }
        ]
      });

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue([
        {
          id: 1,
          code: 'AAPL',
          name: 'Apple Inc',
          quantity: 5,
          averageCost: 150.00,
          target_weight: null,
          quote: { symbol: 'AAPL', current: 151.00, previousClose: 150.00, change: 1.00, changePercent: 0.67 },
          marketValue: 755.00,
          costBasis: 750.00,
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

      // Check for sticky column CSS for holdings table
      expect(html).toContain('position: sticky');
      expect(html).toContain('#holdingsTable thead th:nth-child(1)');
      expect(html).toContain('#holdingsTable tbody td:nth-child(1)');
      expect(html).toContain('#holdingsTable thead th:nth-child(2)');
      expect(html).toContain('#holdingsTable tbody td:nth-child(2)');
      expect(html).toContain('left: 0');
      expect(html).toContain('left: 100px');
      
      // Check for sticky column CSS for closed positions table
      expect(html).toContain('#closedPositionsTable thead th:nth-child(1)');
      expect(html).toContain('#closedPositionsTable tbody td:nth-child(1)');
      expect(html).toContain('#closedPositionsTable thead th:nth-child(2)');
      expect(html).toContain('#closedPositionsTable tbody td:nth-child(2)');
    });
  });

  describe('Closed Positions', () => {
    it('should display closed positions with profit', async () => {
      const mockHoldings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'BATS:VOO': [
          { type: 'buy', quantity: 10, value: 3800, fee: 10, date: '2024-01-01' }
        ]
      });

      const closedPositions = [
        {
          code: 'NASDAQ:AAPL',
          name: 'Apple Inc',
          totalCost: 1500,
          totalRevenue: 1800,
          profitLoss: 300,
          profitLossPercent: 20,
          transactions: 5
        }
      ];
      mockDatabaseService.getClosedPositions.mockResolvedValue(closedPositions);

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
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['VOO'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Check closed positions section exists
      expect(html).toContain('closedPositionsAccordion');
      expect(html).toContain('Apple Inc');
      expect(html).toContain('AAPL');
      expect(html).toContain('$1500.00'); // Total cost (no comma)
      expect(html).toContain('$1800.00'); // Total revenue (no comma)
      expect(html).toContain('$300.00'); // Profit
      expect(html).toContain('20.00%'); // Profit percentage
      expect(html).toContain('5 txns'); // Number of transactions
      expect(html).toContain('text-success'); // Positive profit
      expect(html).toContain('Total Realized Gains');
    });

    it('should display closed positions with loss', async () => {
      const mockHoldings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'BATS:VOO': [
          { type: 'buy', quantity: 10, value: 3800, fee: 10, date: '2024-01-01' }
        ]
      });

      const closedPositions = [
        {
          code: 'NASDAQ:TSLA',
          name: 'Tesla Inc',
          totalCost: 2000,
          totalRevenue: 1500,
          profitLoss: -500,
          profitLossPercent: -25,
          transactions: 3
        }
      ];
      mockDatabaseService.getClosedPositions.mockResolvedValue(closedPositions);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'VOO',
            current: 385.20,
            previousClose: 384.50,
            change: 0.70,
            changePercent: 0.18,
            timestamp: 1696598400
          },
          marketValue: 3852.00,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['VOO'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Check closed positions with loss
      expect(html).toContain('Tesla Inc');
      expect(html).toContain('TSLA');
      expect(html).toContain('$-500.00'); // Negative profit
      expect(html).toContain('-25.00%'); // Negative percentage
      expect(html).toContain('text-danger'); // Negative styling
    });

    it('should handle closed positions with code format extraction', async () => {
      const mockHoldings = [
        { id: 1, code: 'BATS:VOO', name: 'Vanguard S&P 500', quantity: 10, averageCost: 380.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'BATS:VOO': [
          { type: 'buy', quantity: 10, value: 3800, fee: 10, date: '2024-01-01' }
        ]
      });

      const closedPositions = [
        {
          code: 'SIMPLE', // No colon prefix
          name: 'Simple Stock',
          totalCost: 1000,
          totalRevenue: 1200,
          profitLoss: 200,
          profitLossPercent: 20,
          transactions: 2
        }
      ];
      mockDatabaseService.getClosedPositions.mockResolvedValue(closedPositions);

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'VOO',
            current: 385.20,
            previousClose: 384.50,
            change: 0.70,
            changePercent: 0.18,
            timestamp: 1696598400
          },
          marketValue: 3852.00,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(1696598400000);
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['VOO'],
        cacheDurationMs: 60000
      });

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Should display code without exchange prefix
      expect(html).toContain('SIMPLE');
      expect(html).toContain('Simple Stock');
    });
  });

  describe('Company profile modal', () => {
    beforeEach(() => {
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 10, averageCost: 150.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'NASDAQ:AAPL': [
          { type: 'buy', quantity: 10, value: 1500, fee: 10, date: '2024-01-01' }
        ]
      });

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'AAPL',
            current: 155.00,
            high: 156.00,
            low: 154.00,
            open: 155.00,
            previousClose: 154.50,
            change: 0.50,
            changePercent: 0.32,
            timestamp: 1696598400
          },
          marketValue: 1550.00,
          costBasis: 1510.00,
          gain: 40.00,
          gainPercent: 2.65,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(Date.now());
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['NASDAQ:AAPL'],
        cacheDurationMs: 60000,
        oldestCacheTime: Date.now(),
        newestCacheTime: Date.now()
      });
    });

    it('should include company profile modal in the page', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('id="companyProfileModal"');
      expect(html).toContain('id="companyProfileModalLabel"');
      expect(html).toContain('id="companyProfileWidgetContainer"');
    });

    it('should make holding names clickable with showCompanyProfile function', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('onclick="showCompanyProfile(');
      expect(html).toContain("showCompanyProfile('NASDAQ:AAPL'");
      expect(html).toContain('function showCompanyProfile(symbol, name)');
    });

    it('should include window.showCompanyProfile assignment', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain('window.showCompanyProfile = showCompanyProfile');
    });

    it('should escape single quotes in holding names', async () => {
      const mockHoldingsWithQuote = [
        { id: 1, code: 'NASDAQ:TEST', name: "Test's Company", quantity: 10, averageCost: 150.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldingsWithQuote);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'NASDAQ:TEST': [
          { type: 'buy', quantity: 10, value: 1500, fee: 10, date: '2024-01-01' }
        ]
      });

      const enrichedHoldings = [
        {
          ...mockHoldingsWithQuote[0],
          quote: {
            symbol: 'TEST',
            current: 155.00,
            high: 156.00,
            low: 154.00,
            open: 155.00,
            previousClose: 154.50,
            change: 0.50,
            changePercent: 0.32,
            timestamp: 1696598400
          },
          marketValue: 1550.00,
          costBasis: 1510.00,
          gain: 40.00,
          gainPercent: 2.65,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);

      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      // Should escape the single quote in the name
      expect(html).toContain("Test\\'s Company");
    });
  });

  describe('Closed positions with company profile', () => {
    beforeEach(() => {
      // Need at least one holding for the page to render properly
      const mockHoldings = [
        { id: 1, code: 'NASDAQ:AAPL', name: 'Apple Inc', quantity: 10, averageCost: 150.00, target_weight: null }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.00);
      mockDatabaseService.getAllTransactionsGroupedByCode.mockResolvedValue({
        'NASDAQ:AAPL': [
          { type: 'buy', quantity: 10, value: 1500, fee: 10, date: '2024-01-01' }
        ]
      });

      const enrichedHoldings = [
        {
          ...mockHoldings[0],
          quote: {
            symbol: 'AAPL',
            current: 155.00,
            high: 156.00,
            low: 154.00,
            open: 155.00,
            previousClose: 154.50,
            change: 0.50,
            changePercent: 0.32,
            timestamp: 1696598400
          },
          marketValue: 1550.00,
          costBasis: 1510.00,
          gain: 40.00,
          gainPercent: 2.65,
          error: null
        }
      ];

      mockFinnhubService.getPortfolioQuotes.mockResolvedValue(enrichedHoldings);
      mockFinnhubService.getOldestCacheTimestamp.mockReturnValue(Date.now());
      mockFinnhubService.getCacheStats.mockReturnValue({
        size: 1,
        symbols: ['NASDAQ:AAPL'],
        cacheDurationMs: 60000,
        oldestCacheTime: Date.now(),
        newestCacheTime: Date.now()
      });

      const mockClosedPositions = [
        {
          code: 'NASDAQ:TSLA',
          name: 'Tesla Inc',
          totalCost: 1000.00,
          totalRevenue: 1200.00,
          profitLoss: 200.00,
          profitLossPercent: 20.00,
          transactions: 4
        }
      ];

      mockDatabaseService.getClosedPositions.mockResolvedValue(mockClosedPositions);
    });

    it('should make closed position names clickable', async () => {
      const response = await generatePricesPage(mockDatabaseService, mockFinnhubService);
      const html = await response.text();

      expect(html).toContain("showCompanyProfile('NASDAQ:TSLA'");
      expect(html).toContain('Tesla Inc');
    });
  });
});
