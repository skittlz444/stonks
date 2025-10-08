import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateConfigPage, handleConfigSubmission } from '../src/config.js';

// Mock the dependencies
vi.mock('../src/utils.js', () => ({
  createLayout: vi.fn((title, content) => `<html><head><title>${title}</title></head><body>${content}</body></html>`),
  generateCompanyProfileModal: vi.fn(() => `
    <!-- Company Profile Modal -->
    <div class="modal fade" id="companyProfileModal" tabindex="-1" aria-labelledby="companyProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable" style="max-height: 95vh;">
        <div class="modal-content" style="height: 95vh;">
          <div class="modal-header">
            <h5 class="modal-title" id="companyProfileModalLabel">Company Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="flex: 1; overflow: hidden;">
            <div id="companyProfileWidgetContainer" style="height: 100%;"></div>
          </div>
        </div>
      </div>
    </div>`),
  generateCompanyProfileScript: vi.fn(() => `
    <script>
      // Function to show company profile modal
      function showCompanyProfile(symbol, name) {
        document.getElementById('companyProfileModalLabel').textContent = name + ' - Company Profile';
        const widgetContainer = document.getElementById('companyProfileWidgetContainer');
        
        // Clear existing widget
        widgetContainer.innerHTML = '';
        
        // Create new widget container
        const container = document.createElement('div');
        container.className = 'tradingview-widget-container';
        container.style.height = '100%';
        
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetDiv);
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
          width: '100%',
          height: '100%',
          isTransparent: false,
          colorTheme: 'dark',
          symbol: symbol,
          locale: 'en'
        });
        
        container.appendChild(script);
        widgetContainer.appendChild(container);
        
        const modal = new bootstrap.Modal(document.getElementById('companyProfileModal'));
        modal.show();
      }
      
      // Make function globally available
      window.showCompanyProfile = showCompanyProfile;
    </script>`)
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
      getPortfolioHoldings: vi.fn(),
      getVisiblePortfolioHoldings: vi.fn(),
      getHiddenPortfolioHoldings: vi.fn(),
      getTransactions: vi.fn().mockResolvedValue([]),
      addPortfolioHolding: vi.fn(),
      updatePortfolioHolding: vi.fn(),
      deletePortfolioHolding: vi.fn(),
      toggleHoldingVisibility: vi.fn(),
      updateCashAmount: vi.fn(),
      addTransaction: vi.fn(),
      deleteTransaction: vi.fn()
    };

    mockRequest = {
      formData: vi.fn()
    };
  });

  describe('generateConfigPage', () => {
    it('should generate config page with portfolio holdings', async () => {
      const mockVisibleHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: null, hidden: 0 },
        { id: 2, name: 'Vanguard S&P 500 ETF', code: 'BATS:VOO', quantity: 5, target_weight: null, hidden: 0 }
      ];
      const mockHiddenHoldings = [];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockVisibleHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue(mockHiddenHoldings);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      // Mock database queries for settings
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'My Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000.50);

      const result = await generateConfigPage(mockDatabaseService);

      expect(mockDatabaseService.getVisiblePortfolioHoldings).toHaveBeenCalled();
      expect(mockDatabaseService.getHiddenPortfolioHoldings).toHaveBeenCalled();
      expect(mockDatabaseService.getTransactions).toHaveBeenCalled();
      expect(mockDatabaseService.getCashAmount).toHaveBeenCalled();
      expect(createLayout).toHaveBeenCalledWith(
        'Portfolio Configuration',
        expect.stringContaining('Portfolio Configuration'),
        expect.any(String),
        false
      );
    });

    it('should handle empty portfolio holdings', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]); 
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      expect(createLayout).toHaveBeenCalledWith(
        'Portfolio Configuration',
        expect.stringContaining('No visible holdings'),
        expect.any(String),
        false
      );
    });

    it('should use default portfolio name when none exists', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]); 
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
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
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]); 
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
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
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: null, hidden: 0 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5, target_weight: null, hidden: 0 }
      ];
      
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

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
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]); 
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      // Navigation is now at the top of the page
      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      const includeFooter = layoutCall[3];
      
      // Check that top navigation is included
      expect(content).toContain('Top Navigation');
      expect(content).toContain('/stonks/ticker');
      expect(content).toContain('/stonks/charts');
      expect(content).toContain('/stonks/charts/large');
      expect(content).toContain('/stonks/config');
      
      // Check that footer is disabled
      expect(includeFooter).toBe(false);
    });

    it('should include add and edit modals', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
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
      mockDatabaseService.getVisiblePortfolioHoldings.mockRejectedValue(new Error('Database connection failed'));
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);

      await expect(generateConfigPage(mockDatabaseService))
        .rejects.toThrow('Database connection failed');
    });

    it('should display target weight total in footer when holdings have target weights', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 40, hidden: 0 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5, target_weight: 60, hidden: 0 }
      ];
      
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('Total Target Weight:');
      expect(content).toContain('100.00%');
      expect(content).toContain('bg-success');
    });

    it('should show warning badge when target weight is close to 100%', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 45, hidden: 0 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5, target_weight: 50, hidden: 0 }
      ];
      
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('Total Target Weight:');
      expect(content).toContain('95.00%');
      expect(content).toContain('bg-warning');
    });

    it('should show danger badge when target weight is far from 100%', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 30, hidden: 0 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5, target_weight: 40, hidden: 0 }
      ];
      
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('Total Target Weight:');
      expect(content).toContain('70.00%');
      expect(content).toContain('bg-danger');
    });

    it('should handle holdings with mixed target weights (some null)', async () => {
      const mockHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 50, hidden: 0 },
        { id: 2, name: 'Tesla Inc.', code: 'NASDAQ:TSLA', quantity: 5, target_weight: null, hidden: 0 }
      ];
      
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).toContain('Total Target Weight:');
      expect(content).toContain('50.00%');
      expect(content).toContain('bg-danger');
    });

    it('should not display target weight footer when no holdings', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
      
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(0);

      const result = await generateConfigPage(mockDatabaseService);

      const layoutCall = createLayout.mock.calls[0];
      const content = layoutCall[1];
      
      expect(content).not.toContain('Total Target Weight:');
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
          ['target_weight', '']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addPortfolioHolding.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.addPortfolioHolding).toHaveBeenCalledWith(
          'Microsoft Corp.',
          'NASDAQ:MSFT',
          null
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
          ['target_weight', '']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updatePortfolioHolding.mockResolvedValue();

        const result = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(
          1,
          'Updated Apple Inc.',
          'NASDAQ:AAPL',
          null
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

      it('should handle fractional target weights', async () => {
        const mockFormData = new Map([
          ['action', 'add_holding'],
          ['name', 'Vanguard ETF'],
          ['code', 'BATS:VOO'],
          ['target_weight', '10.5']
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
          ['target_weight', '']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.updatePortfolioHolding.mockResolvedValue();

        await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(
          123,
          'Test',
          'TEST:TEST',
          null
        );
      });
    });

    describe('toggle_visibility action', () => {
      it('should toggle holding visibility', async () => {
        const mockFormData = new Map([
          ['action', 'toggle_visibility'],
          ['holding_id', '5']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.toggleHoldingVisibility.mockResolvedValue();

        const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.toggleHoldingVisibility).toHaveBeenCalledWith(5);
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });

    describe('transaction actions', () => {
      it('should add a new transaction', async () => {
        const mockFormData = new Map([
          ['action', 'add_transaction'],
          ['code', 'NASDAQ:AAPL'],
          ['type', 'buy'],
          ['date', '2025-10-07'],
          ['quantity', '10.5'],
          ['value', '1500.00'],
          ['fee', '9.99']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addTransaction.mockResolvedValue();

        const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.addTransaction).toHaveBeenCalledWith(
          'NASDAQ:AAPL',
          'buy',
          '2025-10-07',
          10.5,
          1500.00,
          9.99
        );
        expect(response.status).toBe(302);
      });

      it('should add transaction with zero fee when fee is not provided', async () => {
        const mockFormData = new Map([
          ['action', 'add_transaction'],
          ['code', 'NASDAQ:AAPL'],
          ['type', 'sell'],
          ['date', '2025-10-07'],
          ['quantity', '5'],
          ['value', '750.00'],
          ['fee', '']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.addTransaction.mockResolvedValue();

        await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.addTransaction).toHaveBeenCalledWith(
          'NASDAQ:AAPL',
          'sell',
          '2025-10-07',
          5,
          750.00,
          0
        );
      });

      it('should delete a transaction', async () => {
        const mockFormData = new Map([
          ['action', 'delete_transaction'],
          ['transaction_id', '42']
        ]);
        mockRequest.formData.mockResolvedValue(mockFormData);
        mockDatabaseService.deleteTransaction.mockResolvedValue();

        const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

        expect(mockDatabaseService.deleteTransaction).toHaveBeenCalledWith(42);
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/stonks/config?success=1');
      });
    });
  });

  describe('Page rendering with transactions and hidden holdings', () => {
    it('should display transactions table when transactions exist', async () => {
      const mockTransactions = [
        { id: 1, code: 'NASDAQ:AAPL', type: 'buy', date: '2025-01-01', quantity: 10, value: 1500.00, fee: 9.99 },
        { id: 2, code: 'BATS:VOO', type: 'sell', date: '2025-02-01', quantity: 5, value: 750.00, fee: 5.00 }
      ];

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };

      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result; // createLayout mock returns string directly

      expect(html).toContain('NASDAQ:AAPL');
      expect(html).toContain('BATS:VOO');
      expect(html).toContain('BUY');
      expect(html).toContain('SELL');
      expect(html).toContain('$1500.00');
      expect(html).toContain('$750.00');
      expect(html).toContain('$9.99');
      expect(html).toContain('$5.00');
    });

    it('should display hidden holdings section when hidden holdings exist', async () => {
      const mockHiddenHoldings = [
        { id: 1, name: 'Hidden Stock', code: 'NYSE:HIDE', quantity: 5, target_weight: null, is_visible: false }
      ];

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };

      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue(mockHiddenHoldings);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result; // createLayout mock returns string directly

      expect(html).toContain('Hidden Holdings');
      expect(html).toContain('Hidden Stock');
      expect(html).toContain('NYSE:HIDE');
      expect(html).toContain('Hidden from ticker/charts');
    });

    it('should not display hidden holdings section when no hidden holdings', async () => {
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };

      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result; // createLayout mock returns string directly

      // Should not have the actual hidden holdings card div
      expect(html).not.toContain('hiddenHoldingsCollapse');
      expect(html).not.toContain('Not shown on ticker/charts');
    });

    it('should calculate transaction totals correctly for buy transactions', async () => {
      const mockTransactions = [
        { id: 1, code: 'NASDAQ:AAPL', type: 'buy', date: '2025-01-01', quantity: 10, value: 1500.00, fee: 9.99 }
      ];

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };

      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result; // createLayout mock returns string directly

      // Buy transaction: total = value + fee = 1500.00 + 9.99 = 1509.99
      expect(html).toContain('$1509.99');
    });

    it('should calculate transaction totals correctly for sell transactions', async () => {
      const mockTransactions = [
        { id: 1, code: 'NASDAQ:AAPL', type: 'sell', date: '2025-01-01', quantity: 10, value: 1500.00, fee: 9.99 }
      ];

      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' })
      };

      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getTransactions.mockResolvedValue(mockTransactions);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result; // createLayout mock returns string directly

      // Sell transaction: total = value - fee = 1500.00 - 9.99 = 1490.01
      expect(html).toContain('$1490.01');
    });
  });

  describe('Company profile modal in config page', () => {
    beforeEach(() => {
      const mockPrepareChain = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'My Portfolio' })
      };
      
      mockDatabaseService.db.prepare.mockReturnValue(mockPrepareChain);
      mockDatabaseService.getCashAmount.mockResolvedValue(1000);
      mockDatabaseService.getTransactions.mockResolvedValue([]);
    });

    it('should include company profile modal in config page', async () => {
      const mockVisibleHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 50, hidden: 0 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockVisibleHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result;

      expect(html).toContain('id="companyProfileModal"');
      expect(html).toContain('id="companyProfileModalLabel"');
      expect(html).toContain('id="companyProfileWidgetContainer"');
    });

    it('should make visible holding names clickable', async () => {
      const mockVisibleHoldings = [
        { id: 1, name: 'Apple Inc.', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 50, hidden: 0 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockVisibleHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result;

      expect(html).toContain("showCompanyProfile('NASDAQ:AAPL'");
      expect(html).toContain('onclick="showCompanyProfile(');
    });

    it('should make hidden holding names clickable', async () => {
      const mockHiddenHoldings = [
        { id: 2, name: 'Tesla Inc', code: 'NASDAQ:TSLA', quantity: 5, target_weight: null, hidden: 1 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue(mockHiddenHoldings);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result;

      expect(html).toContain("showCompanyProfile('NASDAQ:TSLA'");
    });

    it('should include showCompanyProfile function', async () => {
      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue([]);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result;

      expect(html).toContain('function showCompanyProfile(symbol, name)');
      expect(html).toContain('window.showCompanyProfile = showCompanyProfile');
    });

    it('should escape single quotes in holding names', async () => {
      const mockVisibleHoldings = [
        { id: 1, name: "Test's Company", code: 'NASDAQ:TEST', quantity: 10, target_weight: null, hidden: 0 }
      ];

      mockDatabaseService.getVisiblePortfolioHoldings.mockResolvedValue(mockVisibleHoldings);
      mockDatabaseService.getHiddenPortfolioHoldings.mockResolvedValue([]);

      const result = await generateConfigPage(mockDatabaseService);
      const html = result;

      expect(html).toContain("Test\\'s Company");
    });
  });
});