import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLargeChartPage } from '../src/chartLarge.js';

// Mock the dependencies
vi.mock('../src/utils.js', () => ({
  generatePageLayout: vi.fn((content, styles) => `<html><head><style>${styles || ''}</style></head><body>${content}</body></html>`),
  generateFullHeightContainer: vi.fn((content) => `<div class="full-height-container">${content}</div>`),
  createResponse: vi.fn((html) => ({ 
    body: html, 
    status: 200, 
    headers: { 'Content-Type': 'text/html' } 
  }))
}));

vi.mock('../src/chartWidgets.js', () => ({
  generateSymbolOverviewWidget: vi.fn((symbols) => `<div class="symbol-overview" data-symbols="${symbols}"></div>`)
}));

vi.mock('../src/dataUtils.js', () => ({
  getStockHoldings: vi.fn(),
  formatStructuredDataForLargeChart: vi.fn()
}));

// Import mocked modules for assertions
import { generatePageLayout, generateFullHeightContainer, createResponse } from '../src/utils.js';
import { generateSymbolOverviewWidget } from '../src/chartWidgets.js';
import { getStockHoldings, formatStructuredDataForLargeChart } from '../src/dataUtils.js';

describe('ChartLarge', () => {
  let mockDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to their default implementations
    generateSymbolOverviewWidget.mockImplementation((symbols) => `<div class="symbol-overview" data-symbols="${symbols}"></div>`);
    
    mockDatabaseService = {
      getHoldings: vi.fn(),
      getCurrentHoldings: vi.fn()
    };
  });

  describe('generateLargeChartPage', () => {
    it('should generate large chart page with holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 }
      ];
      const mockChartSymbols = '"NASDAQ:AAPL","BATS:VOO"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);
      generateSymbolOverviewWidget.mockImplementation((symbols) => `<div class="symbol-overview" data-symbols="${symbols}"></div>`);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
      expect(generateFullHeightContainer).toHaveBeenCalledWith(
        expect.stringContaining('symbol-overview')
      );
      expect(generatePageLayout).toHaveBeenCalledWith(
        expect.stringContaining('full-height-container'),
        'background-color:#212529;height:100vh'
      );
      expect(createResponse).toHaveBeenCalled();
    });

    it('should handle empty holdings', async () => {
      const mockHoldings = [];
      const mockChartSymbols = '';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
      expect(generateFullHeightContainer).toHaveBeenCalled();
      expect(generatePageLayout).toHaveBeenCalled();
      expect(createResponse).toHaveBeenCalled();
    });

    it('should handle single holding', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.', quantity: 3 }
      ];
      const mockChartSymbols = '"NASDAQ:TSLA"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
    });

    it('should handle multiple holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 },
        { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc.', quantity: 2 },
        { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', quantity: 8 }
      ];
      const mockChartSymbols = '"NASDAQ:AAPL","BATS:VOO","NASDAQ:GOOGL","NASDAQ:MSFT"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
    });

    it('should apply correct page styles', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 }
      ];

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue('"NASDAQ:AAPL"');

      await generateLargeChartPage(mockDatabaseService);

      expect(generatePageLayout).toHaveBeenCalledWith(
        expect.any(String),
        'background-color:#212529;height:100vh'
      );
    });

    it('should wrap content in full height container', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 }
      ];
      const mockSymbolOverview = '<div class="symbol-overview">test</div>';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue('"NASDAQ:AAPL"');
      generateSymbolOverviewWidget.mockReturnValue(mockSymbolOverview);

      await generateLargeChartPage(mockDatabaseService);

      expect(generateFullHeightContainer).toHaveBeenCalledWith(mockSymbolOverview);
    });

    it('should handle database service errors', async () => {
      getStockHoldings.mockRejectedValue(new Error('Database connection failed'));

      await expect(generateLargeChartPage(mockDatabaseService))
        .rejects.toThrow('Database connection failed');

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
    });

    it('should handle formatting errors', async () => {
      const mockHoldings = [{ symbol: 'INVALID', name: 'Invalid', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockImplementation(() => {
        throw new Error('Formatting failed');
      });

      await expect(generateLargeChartPage(mockDatabaseService))
        .rejects.toThrow('Formatting failed');
    });

    it('should handle widget generation errors', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue('"NASDAQ:AAPL"');
      generateSymbolOverviewWidget.mockImplementation(() => {
        throw new Error('Widget generation failed');
      });

      await expect(generateLargeChartPage(mockDatabaseService))
        .rejects.toThrow('Widget generation failed');
    });

    it('should return proper response object', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      const expectedResponse = {
        body: '<html><head><style>background-color:#212529;height:100vh</style></head><body>test content</body></html>',
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      };

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue('"NASDAQ:AAPL"');
      createResponse.mockReturnValue(expectedResponse);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(result).toEqual(expectedResponse);
      expect(createResponse).toHaveBeenCalledWith(
        expect.stringContaining('<html>')
      );
    });

    it('should generate content with correct structure', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      const mockSymbolOverview = '<div class="symbol-overview">content</div>';
      const mockContainer = '<div class="full-height-container">wrapped content</div>';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue('"NASDAQ:AAPL"');
      generateSymbolOverviewWidget.mockReturnValue(mockSymbolOverview);
      generateFullHeightContainer.mockReturnValue(mockContainer);

      await generateLargeChartPage(mockDatabaseService);

      // Verify the flow: holdings -> symbols -> widget -> container -> layout -> response
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateFullHeightContainer).toHaveBeenCalledWith(mockSymbolOverview);
      expect(generatePageLayout).toHaveBeenCalledWith(mockContainer, 'background-color:#212529;height:100vh');
    });

    it('should handle edge case with fractional quantities', async () => {
      const mockHoldings = [
        { symbol: 'BATS:VOO', name: 'Vanguard ETF', quantity: 10.5 },
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 0.1 }
      ];
      const mockChartSymbols = '"BATS:VOO","NASDAQ:AAPL"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
    });

    it('should process holdings with different exchange prefixes', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard ETF', quantity: 5 },
        { symbol: 'NYSE:JPM', name: 'JPMorgan Chase', quantity: 3 }
      ];
      const mockChartSymbols = '"NASDAQ:AAPL","BATS:VOO","NYSE:JPM"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForLargeChart.mockReturnValue(mockChartSymbols);

      const result = await generateLargeChartPage(mockDatabaseService);

      expect(formatStructuredDataForLargeChart).toHaveBeenCalledWith(mockHoldings);
      expect(generateSymbolOverviewWidget).toHaveBeenCalledWith(mockChartSymbols);
    });
  });
});