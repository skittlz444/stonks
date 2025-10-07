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
      expect(mockDb.portfolioHoldings[0]).toHaveProperty('target_weight');
    });
    
    test('should initialize with default transactions', () => {
      expect(mockDb.transactions).toBeDefined();
      expect(mockDb.transactions.length).toBeGreaterThan(0);
      expect(mockDb.transactions[0]).toHaveProperty('id');
      expect(mockDb.transactions[0]).toHaveProperty('code');
      expect(mockDb.transactions[0]).toHaveProperty('type');
      expect(mockDb.transactions[0]).toHaveProperty('quantity');
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
      const result = await stmt.bind('Test Stock', 'NASDAQ:TEST', null).run();
      
      expect(result.success).toBe(true);
      expect(mockDb.portfolioHoldings.length).toBe(initialCount + 1);
      
      const newHolding = mockDb.portfolioHoldings[mockDb.portfolioHoldings.length - 1];
      expect(newHolding.name).toBe('Test Stock');
      expect(newHolding.code).toBe('NASDAQ:TEST');
      expect(newHolding.target_weight).toBe(null);
    });

    test('should handle UPDATE operations for portfolio holdings', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const stmt = mockDb.prepare('UPDATE portfolio_holdings SET');
      const result = await stmt.bind('Updated Name', 'NASDAQ:UPDATED', 25.5, holdingId).run();
      
      expect(result.success).toBe(true);
      
      const updatedHolding = mockDb.portfolioHoldings.find(h => h.id === holdingId);
      expect(updatedHolding.name).toBe('Updated Name');
      expect(updatedHolding.code).toBe('NASDAQ:UPDATED');
      expect(updatedHolding.target_weight).toBe(25.5);
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

    test('should return visible holdings with WHERE hidden = 0', async () => {
      // Set one holding as hidden
      mockDb.portfolioHoldings[0].hidden = 1;
      
      const stmt = mockDb.prepare('SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings WHERE hidden = 0');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results.every(h => h.hidden === 0)).toBe(true);
      expect(result.results.length).toBe(mockDb.portfolioHoldings.filter(h => h.hidden === 0).length);
    });

    test('should return hidden holdings with WHERE hidden = 1', async () => {
      // Set one holding as hidden
      mockDb.portfolioHoldings[0].hidden = 1;
      
      const stmt = mockDb.prepare('SELECT id, name, code, target_weight, hidden, created_at, updated_at FROM portfolio_holdings WHERE hidden = 1');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results.every(h => h.hidden === 1)).toBe(true);
      expect(result.results.length).toBe(mockDb.portfolioHoldings.filter(h => h.hidden === 1).length);
    });

    test('should handle INSERT operations for transactions', async () => {
      const initialCount = mockDb.transactions.length;
      const stmt = mockDb.prepare('INSERT INTO transactions (code, type, date, quantity, value, fee) VALUES (?, ?, ?, ?, ?, ?)');
      await stmt.bind('BATS:VOO', 'buy', '2024-01-15', 5, 1000, 10).run();
      
      expect(mockDb.transactions.length).toBe(initialCount + 1);
      const newTransaction = mockDb.transactions[mockDb.transactions.length - 1];
      expect(newTransaction.code).toBe('BATS:VOO');
      expect(newTransaction.type).toBe('buy');
      expect(newTransaction.quantity).toBe(5);
      expect(newTransaction.value).toBe(1000);
      expect(newTransaction.fee).toBe(10);
    });

    test('should handle DELETE operations for transactions', async () => {
      const initialCount = mockDb.transactions.length;
      const transactionId = mockDb.transactions[0].id;
      const stmt = mockDb.prepare('DELETE FROM transactions WHERE id = ?');
      await stmt.bind(transactionId).run();
      
      expect(mockDb.transactions.length).toBe(initialCount - 1);
      expect(mockDb.transactions.find(t => t.id === transactionId)).toBeUndefined();
    });

    test('should filter transactions by code', async () => {
      const targetCode = 'BATS:VOO';
      const stmt = mockDb.prepare('SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions WHERE code = ?');
      const result = await stmt.bind(targetCode).all();
      
      expect(result.success).toBe(true);
      expect(result.results.every(t => t.code === targetCode)).toBe(true);
    });

    test('should return all transactions without filter', async () => {
      const stmt = mockDb.prepare('SELECT id, code, type, date, quantity, value, fee, created_at FROM transactions');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results.length).toBe(mockDb.transactions.length);
    });

    test('should return distinct codes from transactions', async () => {
      const stmt = mockDb.prepare('SELECT DISTINCT code FROM transactions');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      const uniqueCodes = [...new Set(mockDb.transactions.map(t => t.code))];
      expect(result.results.length).toBe(uniqueCodes.length);
      expect(result.results.every(r => uniqueCodes.includes(r.code))).toBe(true);
    });

    test('should return all portfolio settings', async () => {
      const stmt = mockDb.prepare('SELECT key, value FROM portfolio_settings');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual([
        { key: 'cash_amount', value: mockDb.portfolioSettings.cash_amount.toString() },
        { key: 'portfolio_name', value: mockDb.portfolioSettings.portfolio_name }
      ]);
    });

    test('should return portfolio_name setting', async () => {
      const stmt = mockDb.prepare('SELECT value FROM portfolio_settings WHERE key = ?');
      const result = await stmt.bind('portfolio_name').first();
      expect(result).toEqual({ value: 'My Portfolio' });
    });

    test('should return null for non-existent settings', async () => {
      const stmt = mockDb.prepare('SELECT value FROM portfolio_settings WHERE key = ?');
      const result = await stmt.bind('non_existent_key').first();
      expect(result).toBeNull();
    });

    test('should return holding name by code', async () => {
      const targetCode = mockDb.portfolioHoldings[0].code;
      const stmt = mockDb.prepare('SELECT name FROM portfolio_holdings WHERE code = ?');
      const result = await stmt.bind(targetCode).first();
      
      expect(result).not.toBeNull();
      expect(result.name).toBe(mockDb.portfolioHoldings[0].name);
    });

    test('should return null for non-existent holding code', async () => {
      const stmt = mockDb.prepare('SELECT name FROM portfolio_holdings WHERE code = ?');
      const result = await stmt.bind('NASDAQ:NONEXISTENT').first();
      
      expect(result).toBeNull();
    });

    test('should return legacy holdings', async () => {
      const stmt = mockDb.prepare('SELECT id, name, symbol, created_at, updated_at FROM holdings');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockDb.holdings);
    });

    test('should return legacy holdings with just name and symbol', async () => {
      const stmt = mockDb.prepare('SELECT name, symbol FROM holdings');
      const result = await stmt.all();
      
      expect(result.success).toBe(true);
      expect(result.results).toEqual(mockDb.holdings);
    });

    test('should toggle hidden column via UPDATE', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      const originalHidden = mockDb.portfolioHoldings[0].hidden;
      
      const stmt = mockDb.prepare('UPDATE portfolio_holdings SET hidden = ? WHERE id = ?');
      await stmt.bind(originalHidden === 0 ? 1 : 0, holdingId).run();
      
      const updatedHolding = mockDb.portfolioHoldings.find(h => h.id === holdingId);
      expect(updatedHolding.hidden).toBe(originalHidden === 0 ? 1 : 0);
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

  describe('hidden holdings management', () => {
    test('should get visible portfolio holdings only', async () => {
      // Set one holding as hidden
      mockDb.portfolioHoldings[0].hidden = 1;
      
      const visibleHoldings = await databaseService.getVisiblePortfolioHoldings();
      
      expect(visibleHoldings).toBeDefined();
      expect(visibleHoldings.every(h => h.hidden === 0)).toBe(true);
      expect(visibleHoldings.length).toBe(mockDb.portfolioHoldings.filter(h => h.hidden === 0).length);
    });

    test('should get hidden portfolio holdings only', async () => {
      // Set one holding as hidden
      mockDb.portfolioHoldings[0].hidden = 1;
      mockDb.portfolioHoldings[1].hidden = 1;
      
      const hiddenHoldings = await databaseService.getHiddenPortfolioHoldings();
      
      expect(hiddenHoldings).toBeDefined();
      expect(hiddenHoldings.every(h => h.hidden === 1)).toBe(true);
      expect(hiddenHoldings.length).toBe(2);
    });

    test('should toggle holding visibility from visible to hidden', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      expect(mockDb.portfolioHoldings[0].hidden).toBe(0);
      
      const result = await databaseService.toggleHoldingVisibility(holdingId);
      
      expect(result).toBe(true);
      expect(mockDb.portfolioHoldings[0].hidden).toBe(1);
    });

    test('should toggle holding visibility from hidden to visible', async () => {
      const holdingId = mockDb.portfolioHoldings[0].id;
      mockDb.portfolioHoldings[0].hidden = 1;
      
      const result = await databaseService.toggleHoldingVisibility(holdingId);
      
      expect(result).toBe(true);
      expect(mockDb.portfolioHoldings[0].hidden).toBe(0);
    });

    test('should get visible holdings with portfolio symbol', async () => {
      // Set one holding as hidden
      mockDb.portfolioHoldings[0].hidden = 1;
      
      const holdings = await databaseService.getVisibleHoldings();
      
      expect(holdings).toBeDefined();
      expect(Array.isArray(holdings)).toBe(true);
      
      // Should have "My Portfolio" as first entry
      if (holdings.length > 0) {
        expect(holdings[0].name).toContain('Portfolio');
      }
    });
  });

  describe('transactions and closed positions', () => {
    test('should add transaction', async () => {
      const result = await databaseService.addTransaction('BATS:VOO', 'buy', '2024-01-15', 5, 1000, 10);
      expect(result).toBe(true);
    });

    test('should delete transaction', async () => {
      const transactionId = mockDb.transactions[0].id;
      const result = await databaseService.deleteTransaction(transactionId);
      expect(result).toBe(true);
      expect(mockDb.transactions.find(t => t.id === transactionId)).toBeUndefined();
    });

    test('should get transactions for a holding', async () => {
      const code = 'BATS:VOO';
      const transactions = await databaseService.getTransactionsByCode(code);
      
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.every(t => t.code === code)).toBe(true);
    });

    test('should get all transactions', async () => {
      const transactions = await databaseService.getTransactions();
      
      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);
    });

    test('should calculate closed positions from transactions', async () => {
      // Add some sell transactions to create closed positions
      await databaseService.addTransaction('BATS:VOO', 'sell', '2024-01-20', 1, 500, 5);
      
      const closedPositions = await databaseService.getClosedPositions();
      
      expect(closedPositions).toBeDefined();
      expect(Array.isArray(closedPositions)).toBe(true);
      
      // Find VOO in closed positions
      const vooPosition = closedPositions.find(p => p.code === 'BATS:VOO');
      if (vooPosition) {
        expect(vooPosition).toHaveProperty('totalCost');
        expect(vooPosition).toHaveProperty('totalRevenue');
        expect(vooPosition).toHaveProperty('profitLoss');
        expect(vooPosition).toHaveProperty('profitLossPercent');
        expect(vooPosition).toHaveProperty('transactions');
      }
    });

    test('should calculate profit/loss correctly for closed positions', async () => {
      // Clear existing transactions and add controlled test data
      mockDb.transactions = [];
      
      // Buy 10 shares at $100 each with $10 fee
      await databaseService.addTransaction('NASDAQ:TEST', 'buy', '2024-01-01', 10, 1000, 10);
      
      // Sell 10 shares at $120 each with $5 fee
      await databaseService.addTransaction('NASDAQ:TEST', 'sell', '2024-01-15', 10, 1200, 5);
      
      const closedPositions = await databaseService.getClosedPositions();
      const testPosition = closedPositions.find(p => p.code === 'NASDAQ:TEST');
      
      expect(testPosition).toBeDefined();
      expect(testPosition.totalCost).toBe(1010); // 1000 + 10
      expect(testPosition.totalRevenue).toBe(1195); // 1200 - 5
      expect(testPosition.profitLoss).toBe(185); // 1195 - 1010
      expect(testPosition.profitLossPercent).toBeCloseTo(18.32, 1); // (185 / 1010) * 100
    });

    test('should handle no closed positions', async () => {
      // Clear all transactions
      mockDb.transactions = [];
      
      const closedPositions = await databaseService.getClosedPositions();
      
      expect(closedPositions).toBeDefined();
      expect(Array.isArray(closedPositions)).toBe(true);
      expect(closedPositions.length).toBe(0);
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

    test('should handle errors in getVisibleHoldings', async () => {
      const errorDb = {
        prepare: vi.fn(() => {
          throw new Error('Database error');
        })
      };
      
      const errorService = new DatabaseService(errorDb);
      const holdings = await errorService.getVisibleHoldings();
      
      expect(holdings).toEqual([]);
    });

    test('should handle errors in getClosedPositions', async () => {
      const errorDb = {
        prepare: vi.fn(() => {
          throw new Error('Database error');
        })
      };
      
      const errorService = new DatabaseService(errorDb);
      const positions = await errorService.getClosedPositions();
      
      expect(positions).toEqual([]);
    });

    test('should handle errors in toggleHoldingVisibility', async () => {
      const errorDb = {
        prepare: vi.fn(() => ({
          bind: vi.fn(() => ({
            run: vi.fn(() => {
              throw new Error('Database error');
            }),
            first: vi.fn(() => {
              throw new Error('Database error');
            })
          }))
        }))
      };
      
      const errorService = new DatabaseService(errorDb);
      const result = await errorService.toggleHoldingVisibility(1);
      
      expect(result).toBe(false);
    });
  });

  describe('getAllTransactionsGroupedByCode', () => {
    test('should group transactions by stock code', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          all: vi.fn().mockResolvedValue({
            results: [
              { id: 1, code: 'AAPL', type: 'buy', date: '2024-01-01', quantity: 10, value: 1500, fee: 10, created_at: '2024-01-01' },
              { id: 2, code: 'AAPL', type: 'buy', date: '2024-02-01', quantity: 5, value: 750, fee: 5, created_at: '2024-02-01' },
              { id: 3, code: 'TSLA', type: 'buy', date: '2024-01-15', quantity: 3, value: 600, fee: 5, created_at: '2024-01-15' }
            ]
          })
        }))
      };

      const service = new DatabaseService(mockDb);
      const grouped = await service.getAllTransactionsGroupedByCode();

      expect(grouped).toHaveProperty('AAPL');
      expect(grouped).toHaveProperty('TSLA');
      expect(grouped.AAPL).toHaveLength(2);
      expect(grouped.TSLA).toHaveLength(1);
      expect(grouped.AAPL[0].quantity).toBe(10);
      expect(grouped.AAPL[1].quantity).toBe(5);
    });

    test('should return empty object when no transactions exist', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          all: vi.fn().mockResolvedValue({ results: [] })
        }))
      };

      const service = new DatabaseService(mockDb);
      const grouped = await service.getAllTransactionsGroupedByCode();

      expect(grouped).toEqual({});
    });

    test('should handle database errors', async () => {
      const errorDb = {
        prepare: vi.fn(() => {
          throw new Error('Database error');
        })
      };

      const service = new DatabaseService(errorDb);
      const grouped = await service.getAllTransactionsGroupedByCode();

      expect(grouped).toEqual({});
    });

    test('should handle null results from database', async () => {
      const mockDb = {
        prepare: vi.fn(() => ({
          all: vi.fn().mockResolvedValue({ results: null })
        }))
      };

      const service = new DatabaseService(mockDb);
      const grouped = await service.getAllTransactionsGroupedByCode();

      expect(grouped).toEqual({});
    });
  });
});