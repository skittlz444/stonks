import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DatabaseService, MockD1Database } from '../src/databaseService.js';

describe('MockD1Database', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = new MockD1Database();
  });

  describe('constructor', () => {
    test('should initialize with default portfolio holdings', () => {
      expect(mockDb.portfolioHoldings).toBeDefined();
      expect(mockDb.portfolioHoldings.length).toBeGreaterThan(0);
      expect(mockDb.portfolioHoldings[0]).toHaveProperty('id');
      expect(mockDb.portfolioHoldings[0]).toHaveProperty('name');
      expect(mockDb.portfolioHoldings[0]).toHaveProperty('code');
      expect(mockDb.portfolioHoldings[0]).toHaveProperty('quantity');
    });

    test('should initialize with portfolio settings', () => {
      expect(mockDb.portfolioSettings).toBeDefined();
      expect(mockDb.portfolioSettings.cash_amount).toBe(101.8);
      expect(mockDb.portfolioSettings.portfolio_name).toBe('My Portfolio');
    });

    test('should initialize with legacy holdings', () => {
      expect(mockDb.holdings).toBeDefined();
      expect(mockDb.holdings.length).toBeGreaterThan(0);
      expect(mockDb.holdings[0]).toHaveProperty('name');
      expect(mockDb.holdings[0]).toHaveProperty('symbol');
    });
  });

  describe('prepared statements', () => {
    test('should return portfolio holdings on SELECT query', async () => {
      const stmt = mockDb.prepare('SELECT * FROM portfolio_holdings');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockDb.portfolioHoldings);
    });

    test('should return portfolio settings on key query', async () => {
      const stmt = mockDb.prepare('SELECT value FROM portfolio_settings WHERE key = ?');
      const result = await stmt.bind('cash_amount').first();
      
      expect(result).toEqual({ value: '101.8' });
    });

    test('should handle INSERT operations for portfolio holdings', async () => {
      const initialCount = mockDb.portfolioHoldings.length;
      const stmt = mockDb.prepare('INSERT INTO portfolio_holdings');
      const result = await stmt.bind('Test Stock', 'NASDAQ:TEST', 10).run();
      
      expect(result.success).toBe(true);
      expect(mockDb.portfolioHoldings.length).toBe(initialCount + 1);
      
      const newHolding = mockDb.portfolioHoldings[mockDb.portfolioHoldings.length - 1];
      expect(newHolding.name).toBe('Test Stock');
      expect(newHolding.code).toBe('NASDAQ:TEST');
      expect(newHolding.quantity).toBe(10);
    });

    test('should handle UPDATE operations for portfolio holdings', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const stmt = mockDb.prepare('UPDATE portfolio_holdings SET');
      const result = await stmt.bind('Updated Name', 'NASDAQ:UPDATED', 20, holdingId).run();
      
      expect(result.success).toBe(true);
      
      const updatedHolding = mockDb.portfolioHoldings.find(h => h.id === holdingId);
      expect(updatedHolding.name).toBe('Updated Name');
      expect(updatedHolding.code).toBe('NASDAQ:UPDATED');
      expect(updatedHolding.quantity).toBe(20);
    });

    test('should handle DELETE operations for portfolio holdings', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const initialCount = mockDb.portfolioHoldings.length;
      
      const stmt = mockDb.prepare('DELETE FROM portfolio_holdings WHERE id = ?');
      const result = await stmt.bind(holdingId).run();
      
      expect(result.success).toBe(true);
      expect(mockDb.portfolioHoldings.length).toBe(initialCount - 1);
      expect(mockDb.portfolioHoldings.find(h => h.id === holdingId)).toBeUndefined();
    });

    test('should handle portfolio settings updates', async () => {
      const stmt = mockDb.prepare('INSERT OR REPLACE INTO portfolio_settings');
      const result = await stmt.bind('cash_amount', '150.5').run();
      
      expect(result.success).toBe(true);
      expect(mockDb.portfolioSettings.cash_amount).toBe('150.5');
    });
  });
});

describe('DatabaseService', () => {
  let databaseService;
  let mockDb;

  beforeEach(() => {
    mockDb = new MockD1Database();
    databaseService = new DatabaseService(mockDb);
  });

  describe('getHoldings', () => {
    test('should return holdings with My Portfolio dynamically built', async () => {
      const holdings = await databaseService.getHoldings();
      
      expect(holdings).toBeDefined();
      expect(holdings.length).toBeGreaterThan(0);
      
      // First holding should be "My Portfolio"
      const myPortfolio = holdings[0];
      expect(myPortfolio.name).toBe('My Portfolio');
      expect(myPortfolio.symbol).toContain('*BATS:');
      expect(myPortfolio.symbol).toContain('+101.8');
    });

    test('should include individual holdings after My Portfolio', async () => {
      const holdings = await databaseService.getHoldings();
      
      // Should have My Portfolio + individual holdings
      expect(holdings.length).toBeGreaterThan(mockDb.portfolioHoldings.length);
      
      // Check that individual holdings are present
      const individualHoldings = holdings.slice(1);
      expect(individualHoldings.length).toBe(mockDb.portfolioHoldings.length);
      
      individualHoldings.forEach((holding, index) => {
        expect(holding.name).toBe(mockDb.portfolioHoldings[index].name);
        expect(holding.symbol).toBe(mockDb.portfolioHoldings[index].code);
      });
    });
  });

  describe('buildPortfolioSymbol', () => {
    test('should build portfolio symbol from holdings and cash', () => {
      const holdings = [
        { quantity: 10, code: 'BATS:VOO' },
        { quantity: 5, code: 'BATS:AAPL' }
      ];
      
      const symbol = databaseService.buildPortfolioSymbol(holdings, 100.50);
      
      expect(symbol).toBe('10*BATS:VOO+5*BATS:AAPL+100.5');
    });

    test('should handle empty holdings with just cash', () => {
      const symbol = databaseService.buildPortfolioSymbol([], 50);
      expect(symbol).toBe('50');
    });

    test('should handle zero cash', () => {
      const holdings = [{ quantity: 1, code: 'BATS:TEST' }];
      const symbol = databaseService.buildPortfolioSymbol(holdings, 0);
      expect(symbol).toBe('1*BATS:TEST');
    });
  });

  describe('CRUD operations', () => {
    test('should add portfolio holding', async () => {
      const result = await databaseService.addPortfolioHolding('New Stock', 'NASDAQ:NEW', 15);
      expect(result).toBe(true);
    });

    test('should update portfolio holding', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const result = await databaseService.updatePortfolioHolding(holdingId, 'Updated', 'NASDAQ:UPD', 25);
      expect(result).toBe(true);
    });

    test('should delete portfolio holding', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const result = await databaseService.deletePortfolioHolding(holdingId);
      expect(result).toBe(true);
    });

    test('should update cash amount', async () => {
      const result = await databaseService.updateCashAmount(200.75);
      expect(result).toBe(true);
    });

    test('should get cash amount', async () => {
      const amount = await databaseService.getCashAmount();
      expect(amount).toBe(101.8);
    });
  });

  describe('error handling', () => {
    test('should handle database errors gracefully in getHoldings', async () => {
      // Mock a database that throws errors
      const errorDb = {
        prepare: vi.fn(() => {
          throw new Error('Database error');
        })
      };
      
      const errorService = new DatabaseService(errorDb);
      const holdings = await errorService.getHoldings();
      
      expect(holdings).toEqual([]);
    });

    test('should handle database errors in CRUD operations', async () => {
      const errorDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn(() => ({
            run: vi.fn(() => {
              throw new Error('Database error');
            })
          }))
        }))
      };
      
      const errorService = new DatabaseService(errorDb);
      const result = await errorService.addPortfolioHolding('Test', 'TEST', 1);
      
      expect(result).toBe(false);
    });
  });
});