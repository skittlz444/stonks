import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChartGridPage } from '../src/chartGrid.js';

// Mock the dependencies
vi.mock('../src/utils.js', () => ({
  generatePageLayout: vi.fn((content, styles) => `<html><head><style>${styles || ''}</style></head><body>${content}</body></html>`),
  generateChartGridLayout: vi.fn((content) => `<div class="chart-grid">${content}</div>`),
  createResponse: vi.fn((html) => ({ 
    body: html, 
    status: 200, 
    headers: { 'Content-Type': 'text/html' } 
  }))
}));

vi.mock('../src/chartWidgets.js', () => ({
  generateMiniSymbolWidget: vi.fn((symbol) => `<div class="mini-widget" data-symbol=${symbol}></div>`),
  generateMarketOverviewWidget: vi.fn((symbols) => `<div class="market-overview" data-symbols="${symbols}"></div>`)
}));

vi.mock('../src/dataUtils.js', () => ({
  getStockHoldings: vi.fn(),
  formatStructuredDataForChartGrid: vi.fn()
}));

// Import mocked modules for assertions
import { generatePageLayout, createResponse } from '../src/utils.js';
import { generateMiniSymbolWidget, generateMarketOverviewWidget } from '../src/chartWidgets.js';
import { getStockHoldings, formatStructuredDataForChartGrid } from '../src/dataUtils.js';

describe('ChartGrid', () => {
  let mockDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDatabaseService = {
      getHoldings: vi.fn(),
      getCurrentHoldings: vi.fn()
    };
  });

  describe('generateChartGridPage', () => {
    it('should generate chart grid page with holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 }
      ];
      const mockMarketSymbols = '"NASDAQ:AAPL","BATS:VOO"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue(mockMarketSymbols);
      generateMiniSymbolWidget.mockImplementation((symbol) => `<div class="mini-widget" data-symbol=${symbol}></div>`);
      generateMarketOverviewWidget.mockImplementation((symbols) => `<div class="market-overview" data-symbols="${symbols}"></div>`);

      const result = await generateChartGridPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForChartGrid).toHaveBeenCalledWith(mockHoldings);
      expect(generateMiniSymbolWidget).toHaveBeenCalledTimes(2);
      expect(generateMiniSymbolWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateMiniSymbolWidget).toHaveBeenCalledWith('"BATS:VOO"');
      expect(generateMarketOverviewWidget).toHaveBeenCalledWith(mockMarketSymbols);
      expect(generatePageLayout).toHaveBeenCalledWith(
        expect.stringContaining('<div class="container-fluid">'),
        'background-color:#212529;margin:0px;height:100vh'
      );
      expect(createResponse).toHaveBeenCalled();
    });

    it('should handle empty holdings', async () => {
      const mockHoldings = [];
      const mockMarketSymbols = '';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue(mockMarketSymbols);

      const result = await generateChartGridPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForChartGrid).toHaveBeenCalledWith(mockHoldings);
      expect(generateMiniSymbolWidget).not.toHaveBeenCalled();
      expect(generateMarketOverviewWidget).toHaveBeenCalledWith(mockMarketSymbols);
      expect(generatePageLayout).toHaveBeenCalled();
      expect(createResponse).toHaveBeenCalled();
    });

    it('should generate correct Bootstrap grid structure', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 }
      ];
      const mockMarketSymbols = '"NASDAQ:AAPL"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue(mockMarketSymbols);

      await generateChartGridPage(mockDatabaseService);

      const layoutCall = generatePageLayout.mock.calls[0];
      const content = layoutCall[0];

      expect(content).toContain('<div class="container-fluid">');
      expect(content).toContain('<div class="row g-0 row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3">');
      expect(content).toContain('<div class="row justify-content-center row-cols-md-12 row-cols-xl-2">');
      expect(content).toContain('</div>');
    });

    it('should handle single holding', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.', quantity: 3 }
      ];
      const mockMarketSymbols = '"NASDAQ:TSLA"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue(mockMarketSymbols);

      const result = await generateChartGridPage(mockDatabaseService);

      expect(generateMiniSymbolWidget).toHaveBeenCalledTimes(1);
      expect(generateMiniSymbolWidget).toHaveBeenCalledWith('"NASDAQ:TSLA"');
      expect(generateMarketOverviewWidget).toHaveBeenCalledWith(mockMarketSymbols);
    });

    it('should handle multiple holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 },
        { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc.', quantity: 2 },
        { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', quantity: 8 }
      ];
      const mockMarketSymbols = '"NASDAQ:AAPL","BATS:VOO","NASDAQ:GOOGL","NASDAQ:MSFT"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue(mockMarketSymbols);

      const result = await generateChartGridPage(mockDatabaseService);

      expect(generateMiniSymbolWidget).toHaveBeenCalledTimes(4);
      expect(generateMarketOverviewWidget).toHaveBeenCalledWith(mockMarketSymbols);
    });

    it('should apply correct page styles', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 }
      ];

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue('"NASDAQ:AAPL"');

      await generateChartGridPage(mockDatabaseService);

      expect(generatePageLayout).toHaveBeenCalledWith(
        expect.any(String),
        'background-color:#212529;margin:0px;height:100vh'
      );
    });

    it('should handle database service errors', async () => {
      getStockHoldings.mockRejectedValue(new Error('Database connection failed'));

      await expect(generateChartGridPage(mockDatabaseService))
        .rejects.toThrow('Database connection failed');

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
    });

    it('should handle formatting errors', async () => {
      const mockHoldings = [{ symbol: 'INVALID', name: 'Invalid', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockImplementation(() => {
        throw new Error('Formatting failed');
      });

      await expect(generateChartGridPage(mockDatabaseService))
        .rejects.toThrow('Formatting failed');
    });

    it('should properly quote symbols for widgets', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 }
      ];

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue('"NASDAQ:AAPL","BATS:VOO"');

      await generateChartGridPage(mockDatabaseService);

      // Verify symbols are properly quoted when passed to widget generators
      expect(generateMiniSymbolWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateMiniSymbolWidget).toHaveBeenCalledWith('"BATS:VOO"');
    });

    it('should return proper response object', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      const expectedResponse = {
        body: '<html><head><style>background-color:#212529;margin:0px;height:100vh</style></head><body>test content</body></html>',
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      };

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForChartGrid.mockReturnValue('"NASDAQ:AAPL"');
      createResponse.mockReturnValue(expectedResponse);

      const result = await generateChartGridPage(mockDatabaseService);

      expect(result).toEqual(expectedResponse);
      expect(createResponse).toHaveBeenCalledWith(
        expect.stringContaining('<html>')
      );
    });
  });
});