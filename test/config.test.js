import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConfigPage, handleConfigSubmission } from '../src/config.js';

// Mock the dependencies
vi.mock('../src/utils.js', () => ({
  createLayout: vi.fn((title, content) => `<html><head><title>${title}</title></head><body>${content}</body></html>`)
}));

// Import mocked modules for assertions
import { createLayout } from '../src/utils.js';

describe('Config', () => {
  let mockDatabaseService;
  let mockRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDatabaseService = {
      db: {
        prepare: vi.fn()
      },
      getCashAmount: vi.fn(),
      addPortfolioHolding: vi.fn(),
      updatePortfolioHolding: vi.fn(),
      deletePortfolioHolding: vi.fn(),
      updateCashAmount: vi.fn()
    };

    mockRequest = {
      formData: vi.fn()
    };
  });

  describe('generateConfigPage', () => {
    it('should generate config page with portfolio holdings', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10 },
        { id: 2, name: 'Vanguard S&P 500 ETF', code: 'BATS:VOO', quantity: 5 }
      ];

      // Mock database queries
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: mockHoldings }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'My Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.50);

      const result = await generateConfigPage(mockDatabaseService);

      expect(mockDatabaseService.db.prepare).toHaveBeenCalledWith(
        'SELECT * FROM portfolio_holdings ORDER BY id'
      );
      expect(mockDatabaseService.getCashAmount).toHaveBeenCalled();
      expect(createLayout).toHaveBeenCalledWith(
        'Portfolio Configuration',
        expect.stringContaining('Portfolio Configuration')
      );
    });

    it('should handle empty portfolio holdings', async () => {
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      expect(createLayout).toHaveBeenCalledWith(
        'Portfolio Configuration',
        expect.stringContaining('No holdings configured')
      );
    });

    it('should use default portfolio name when none exists', async () => {
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('value="My Portfolio"');
    });

    it('should display custom portfolio name when exists', async () => {
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Custom Portfolio Name' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(500);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('value="Custom Portfolio Name"');
      expect(content).toContain('value="500"');
    });

    it('should render holdings table with data', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5 }
      ];

      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: mockHoldings }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('Apple Inc.');
      expect(content).toContain('NASDAQ:AAPL');
      expect(content).toContain('10');
      expect(content).toContain('Tesla Inc.');
      expect(content).toContain('NASDAQ:TSLA');
      expect(content).toContain('5');
    });

    it('should include navigation links', async () => {
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('/stonks/ticker');
      expect(content).toContain('/stonks/charts');
      expect(content).toContain('/stonks/charts/large');
    });

    it('should include add and edit modals', async () => {
      const mockPrepareChain = {
        all: vi.fn().mockResolvedValue({ results: [] }),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('id="addHoldingModal"');
      expect(content).toContain('id="editHoldingModal"');
      expect(content).toContain('function editHolding');
    });

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.db.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(generateConfigPage(mockDatabaseService))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('handleConfigSubmission', () => {
    beforeEach(() => {
      const mockFormData = new Map();
      mockRequest.formData.mockResolvedValue(mockFormData);
    });

    describe('update_settings action', () => {
      it('should update portfolio settings', async () => {
        const mockFormData = new Map([
          ['action', 'update_settings'],
          ['portfolio_name', 'New Portfolio Name'],
          ['cash_amount', '1500.75']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);

        const mockPrepareChain = {
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true })
        };
        mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
        mockDatabaseService.updateCashAmount.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updateCashAmount).toHaveBeenCalledWith(1500.75);
        expect(mockDatabaseService.db.prepare).toHaveBeenCalledWith(
          'INSERT OR REPLACE INTO portfolio_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        );
        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });

    describe('add_holding action', () => {
      it('should add new portfolio holding', async () => {
        const mockFormData = new Map([
          ['action', 'add_holding'],
          ['name', 'Microsoft Corp.'],
          ['code', 'NASDAQ:MSFT'],
          ['quantity', '15']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addPortfolioHolding.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.addPortfolioHolding).toHaveBeenCalledWith(
          'Microsoft Corp.',
          'NASDAQ:MSFT',
          15
        );
        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });

    describe('update_holding action', () => {
      it('should update existing portfolio holding', async () => {
        const mockFormData = new Map([
          ['action', 'update_holding'],
          ['holding_id', '1'],
          ['name', 'Updated Apple Inc.'],
          ['code', 'NASDAQ:AAPL'],
          ['quantity', '20.5']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updatePortfolioHolding.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(
          1,
          'Updated Apple Inc.',
          'NASDAQ:AAPL',
          20.5
        );
        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });

    describe('delete_holding action', () => {
      it('should delete portfolio holding', async () => {
        const mockFormData = new Map([
          ['action', 'delete_holding'],
          ['holding_id', '2']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.deletePortfolioHolding.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.deletePortfolioHolding).toHaveBeenCalledWith(2);
        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });

    describe('invalid action', () => {
      it('should handle invalid action', async () => {
        const mockFormData = new Map([
          ['action', 'invalid_action']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });
    });

    describe('error handling', () => {
      it('should handle database errors during update_settings', async () => {
        const mockFormData = new Map([
          ['action', 'update_settings'],
          ['portfolio_name', 'Test'],
          ['cash_amount', '100']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updateCashAmount.mockRejectedValue(new Error('Database error'));

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });

      it('should handle database errors during add_holding', async () => {
        const mockFormData = new Map([
          ['action', 'add_holding'],
          ['name', 'Test'],
          ['code', 'TEST:TEST'],
          ['quantity', '1']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addPortfolioHolding.mockRejectedValue(new Error('Database error'));

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });

      it('should handle database errors during update_holding', async () => {
        const mockFormData = new Map([
          ['action', 'update_holding'],
          ['holding_id', '1'],
          ['name', 'Test'],
          ['code', 'TEST:TEST'],
          ['quantity', '1']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updatePortfolioHolding.mockRejectedValue(new Error('Database error'));

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });

      it('should handle database errors during delete_holding', async () => {
        const mockFormData = new Map([
          ['action', 'delete_holding'],
          ['holding_id', '1']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.deletePortfolioHolding.mockRejectedValue(new Error('Database error'));

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });

      it('should handle form data parsing errors', async () => {
        mockRequest.formData.mockRejectedValue(new Error('Form parsing failed'));

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(result.status).toBe(302);
        expect(result.headers.get('Location')).toBe('/stonks/config?error=1');
      });
    });

    describe('data type conversion', () => {
      it('should handle fractional cash amounts', async () => {
        const mockFormData = new Map([
          ['action', 'update_settings'],
          ['portfolio_name', 'Test Portfolio'],
          ['cash_amount', '1000.50']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);

        const mockPrepareChain = {
          bind: vi.fn().mockReturnThis(),
          run: vi.fn().mockResolvedValue({ success: true })
        };
        mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
        mockDatabaseService.updateCashAmount.mockResolvedValue();

        await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updateCashAmount).toHaveBeenCalledWith(1000.50);
      });

      it('should handle fractional quantities', async () => {
        const mockFormData = new Map([
          ['action', 'add_holding'],
          ['name', 'Vanguard ETF'],
          ['code', 'BATS:VOO'],
          ['quantity', '10.5']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addPortfolioHolding.mockResolvedValue();

        await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.addPortfolioHolding).toHaveBeenCalledWith(
          'Vanguard ETF',
          'BATS:VOO',
          10.5
        );
      });

      it('should handle integer conversion for holding IDs', async () => {
        const mockFormData = new Map([
          ['action', 'update_holding'],
          ['holding_id', '123'],
          ['name', 'Test'],
          ['code', 'TEST:TEST'],
          ['quantity', '1']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updatePortfolioHolding.mockResolvedValue();

        await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(
          123,
          'Test',
          'TEST:TEST',
          1
        );
      });
    });
  });
});