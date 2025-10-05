import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTickerPage } from '../src/ticker.js';

// Mock the dependencies
vi.mock('../src/utils.js', () => ({
  generatePageLayout: vi.fn((content, styles) => `<html><head><style>${styles || ''}</style></head><body>${content}</body></html>`),
  generateGridContainer: vi.fn((content) => `<div class="grid-container">${content}</div>`),
  createResponse: vi.fn((html) => ({ 
    body: html, 
    status: 200, 
    headers: { 'Content-Type': 'text/html' } 
  }))
}));

vi.mock('../src/chartWidgets.js', () => ({
  generateTickerTapeWidget: vi.fn((symbols) => `<div class="ticker-tape" data-symbols="${symbols}"></div>`),
  generateSingleQuoteWidget: vi.fn((symbol) => `<div class="single-quote" data-symbol=${symbol}></div>`)
}));

vi.mock('../src/dataUtils.js', () => ({
  getStockHoldings: vi.fn(),
  formatStructuredDataForTickerTape: vi.fn()
}));

// Import mocked modules for assertions
import { generatePageLayout, generateGridContainer, createResponse } from '../src/utils.js';
import { generateTickerTapeWidget, generateSingleQuoteWidget } from '../src/chartWidgets.js';
import { getStockHoldings, formatStructuredDataForTickerTape } from '../src/dataUtils.js';

describe('Ticker', () => {
  let mockDatabaseService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to their default implementations
    generateTickerTapeWidget.mockImplementation((symbols) => `<div class="ticker-tape" data-symbols="${symbols}"></div>`);
    generateSingleQuoteWidget.mockImplementation((symbol) => `<div class="single-quote" data-symbol=${symbol}></div>`);
    
    mockDatabaseService = {
      getHoldings: vi.fn(),
      getCurrentHoldings: vi.fn()
    };
  });

  describe('generateTickerPage', () => {
    it('should generate ticker page with holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 }
      ];
      const mockTickerSymbols = '"NASDAQ:AAPL","BATS:VOO"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);
      generateTickerTapeWidget.mockImplementation((symbols) => `<div class="ticker-tape" data-symbols="${symbols}"></div>`);
      generateSingleQuoteWidget.mockImplementation((symbol) => `<div class="single-quote" data-symbol=${symbol}></div>`);

      const result = await generateTickerPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).toHaveBeenCalledTimes(2);
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"BATS:VOO"');
      expect(generateGridContainer).toHaveBeenCalled();
      expect(generatePageLayout).toHaveBeenCalled();
      expect(createResponse).toHaveBeenCalled();
    });

    it('should handle empty holdings', async () => {
      const mockHoldings = [];
      const mockTickerSymbols = '';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);

      const result = await generateTickerPage(mockDatabaseService);

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).not.toHaveBeenCalled();
      expect(generateGridContainer).toHaveBeenCalledWith('');
      expect(generatePageLayout).toHaveBeenCalled();
      expect(createResponse).toHaveBeenCalled();
    });

    it('should handle single holding', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.', quantity: 3 }
      ];
      const mockTickerSymbols = '"NASDAQ:TSLA"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);

      const result = await generateTickerPage(mockDatabaseService);

      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).toHaveBeenCalledTimes(1);
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NASDAQ:TSLA"');
    });

    it('should handle multiple holdings', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 },
        { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc.', quantity: 2 },
        { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', quantity: 8 }
      ];
      const mockTickerSymbols = '"NASDAQ:AAPL","BATS:VOO","NASDAQ:GOOGL","NASDAQ:MSFT"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);

      const result = await generateTickerPage(mockDatabaseService);

      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).toHaveBeenCalledTimes(4);
    });

    it('should combine ticker tape and quote widgets correctly', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 }
      ];
      const mockTickerSymbols = '"NASDAQ:AAPL"';
      const mockTickerTape = '<div class="ticker-tape">ticker</div>';
      const mockGridContainer = '<div class="grid-container">quotes</div>';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);
      generateTickerTapeWidget.mockReturnValue(mockTickerTape);
      generateGridContainer.mockReturnValue(mockGridContainer);

      await generateTickerPage(mockDatabaseService);

      expect(generatePageLayout).toHaveBeenCalledWith(
        mockTickerTape + mockGridContainer
      );
    });

    it('should properly quote symbols for widgets', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard S&P 500 ETF', quantity: 5 }
      ];

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL","BATS:VOO"');

      await generateTickerPage(mockDatabaseService);

      // Verify symbols are properly quoted when passed to widget generators
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"BATS:VOO"');
    });

    it('should handle database service errors', async () => {
      getStockHoldings.mockRejectedValue(new Error('Database connection failed'));

      await expect(generateTickerPage(mockDatabaseService))
        .rejects.toThrow('Database connection failed');

      expect(getStockHoldings).toHaveBeenCalledWith(mockDatabaseService);
    });

    it('should handle formatting errors', async () => {
      const mockHoldings = [{ symbol: 'INVALID', name: 'Invalid', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockImplementation(() => {
        throw new Error('Formatting failed');
      });

      await expect(generateTickerPage(mockDatabaseService))
        .rejects.toThrow('Formatting failed');
    });

    it('should handle ticker tape widget generation errors', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL"');
      generateTickerTapeWidget.mockImplementation(() => {
        throw new Error('Ticker widget generation failed');
      });

      await expect(generateTickerPage(mockDatabaseService))
        .rejects.toThrow('Ticker widget generation failed');
    });

    it('should handle quote widget generation errors', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      
      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL"');
      // Reset ticker tape to work normally, then break quote widget
      generateTickerTapeWidget.mockImplementation((symbols) => `<div class="ticker-tape" data-symbols="${symbols}"></div>`);
      generateSingleQuoteWidget.mockImplementation(() => {
        throw new Error('Quote widget generation failed');
      });

      await expect(generateTickerPage(mockDatabaseService))
        .rejects.toThrow('Quote widget generation failed');
    });

    it('should return proper response object', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      const expectedResponse = {
        body: '<html><head><style></style></head><body>test content</body></html>',
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      };

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL"');
      createResponse.mockReturnValue(expectedResponse);

      const result = await generateTickerPage(mockDatabaseService);

      expect(result).toEqual(expectedResponse);
      expect(createResponse).toHaveBeenCalledWith(
        expect.stringContaining('<html>')
      );
    });

    it('should use default page styles when none specified', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL"');

      await generateTickerPage(mockDatabaseService);

      // Verify generatePageLayout is called with content but no custom styles
      expect(generatePageLayout).toHaveBeenCalledWith(expect.any(String));
    });

    it('should handle edge case with fractional quantities', async () => {
      const mockHoldings = [
        { symbol: 'BATS:VOO', name: 'Vanguard ETF', quantity: 10.5 },
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 0.1 }
      ];
      const mockTickerSymbols = '"BATS:VOO","NASDAQ:AAPL"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);

      const result = await generateTickerPage(mockDatabaseService);

      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).toHaveBeenCalledTimes(2);
    });

    it('should process holdings with different exchange prefixes', async () => {
      const mockHoldings = [
        { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', quantity: 10 },
        { symbol: 'BATS:VOO', name: 'Vanguard ETF', quantity: 5 },
        { symbol: 'NYSE:JPM', name: 'JPMorgan Chase', quantity: 3 }
      ];
      const mockTickerSymbols = '"NASDAQ:AAPL","BATS:VOO","NYSE:JPM"';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue(mockTickerSymbols);

      const result = await generateTickerPage(mockDatabaseService);

      expect(formatStructuredDataForTickerTape).toHaveBeenCalledWith(mockHoldings);
      expect(generateTickerTapeWidget).toHaveBeenCalledWith(mockTickerSymbols);
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"BATS:VOO"');
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NYSE:JPM"');
    });

    it('should generate content with correct structure flow', async () => {
      const mockHoldings = [{ symbol: 'NASDAQ:AAPL', name: 'Apple', quantity: 1 }];
      const mockTickerTape = '<div class="ticker-tape">ticker content</div>';
      const mockQuoteWidget = '<div class="single-quote">quote content</div>';
      const mockGridContainer = '<div class="grid-container">grid content</div>';

      getStockHoldings.mockResolvedValue(mockHoldings);
      formatStructuredDataForTickerTape.mockReturnValue('"NASDAQ:AAPL"');
      generateTickerTapeWidget.mockReturnValue(mockTickerTape);
      generateSingleQuoteWidget.mockReturnValue(mockQuoteWidget);
      generateGridContainer.mockReturnValue(mockGridContainer);

      await generateTickerPage(mockDatabaseService);

      // Verify the flow: holdings -> ticker tape + quote widgets -> grid -> layout -> response
      expect(generateTickerTapeWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateSingleQuoteWidget).toHaveBeenCalledWith('"NASDAQ:AAPL"');
      expect(generateGridContainer).toHaveBeenCalledWith(mockQuoteWidget);
      expect(generatePageLayout).toHaveBeenCalledWith(mockTickerTape + mockGridContainer);
    });
  });
});