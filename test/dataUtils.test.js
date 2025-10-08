import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  getStockHoldings,
  parseStockHoldings,
  formatForTickerTape,
  formatStructuredDataForTickerTape,
  formatForChartGrid,
  formatStructuredDataForChartGrid,
  formatForLargeChart,
  formatStructuredDataForLargeChart,
  formatStructuredDataForWatchlist,
  extractSymbol,
  getOptimizedHoldingsData
} from '../src/dataUtils.js';

describe('DataUtils', () => {
  const mockHoldings = [
    { id: 1, name: 'Apple Inc.', symbol: 'NASDAQ:AAPL' },
    { id: 2, name: 'Microsoft Corp.', symbol: 'NASDAQ:MSFT' },
    { id: 3, name: 'My Portfolio', symbol: '10*NASDAQ:AAPL+5*NASDAQ:MSFT+100' }
  ];

  const mockDatabaseService = {
    getHoldings: vi.fn(),
    getCurrentHoldings: vi.fn(),
    getAllHoldings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStockHoldings', () => {
    test('should return holdings from database service', async () => {
      mockDatabaseService.getHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getStockHoldings(mockDatabaseService);
      
      expect(result).toEqual(mockHoldings);
      expect(mockDatabaseService.getHoldings).toHaveBeenCalledOnce();
    });

    test('should throw error when no holdings data found', async () => {
      mockDatabaseService.getHoldings.mockResolvedValue([]);
      
      await expect(getStockHoldings(mockDatabaseService)).rejects.toThrow('No stock holdings data found');
    });

    test('should throw error when database service fails', async () => {
      mockDatabaseService.getHoldings.mockRejectedValue(new Error('Database error'));
      
      await expect(getStockHoldings(mockDatabaseService)).rejects.toThrow('No stock holdings data found');
    });

    test('should throw error when holdings is null', async () => {
      mockDatabaseService.getHoldings.mockResolvedValue(null);
      
      await expect(getStockHoldings(mockDatabaseService)).rejects.toThrow('No stock holdings data found');
    });
  });

  describe('parseStockHoldings', () => {
    test('should convert structured holdings to legacy format', async () => {
      mockDatabaseService.getHoldings.mockResolvedValue(mockHoldings);
      
      const result = await parseStockHoldings(mockDatabaseService);
      
      expect(result).toEqual([
        '"Apple Inc.","NASDAQ:AAPL"',
        '"Microsoft Corp.","NASDAQ:MSFT"',
        '"My Portfolio","10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"'
      ]);
    });

    test('should fallback to getCurrentHoldings when structured method fails', async () => {
      mockDatabaseService.getHoldings.mockRejectedValue(new Error('Structured method failed'));
      mockDatabaseService.getCurrentHoldings.mockResolvedValue('"Apple","NASDAQ:AAPL"|"Microsoft","NASDAQ:MSFT"');
      
      const result = await parseStockHoldings(mockDatabaseService);
      
      expect(result).toEqual(['"Apple","NASDAQ:AAPL"', '"Microsoft","NASDAQ:MSFT"']);
    });

    test('should throw error when both methods fail', async () => {
      mockDatabaseService.getHoldings.mockRejectedValue(new Error('Structured method failed'));
      mockDatabaseService.getCurrentHoldings.mockRejectedValue(new Error('Legacy method failed'));
      
      await expect(parseStockHoldings(mockDatabaseService)).rejects.toThrow('No stock holdings data found');
    });
  });

  describe('formatForTickerTape', () => {
    test('should format stonk pairs for ticker tape widget', () => {
      const stonkPairs = [
        '"Apple Inc.","NASDAQ:AAPL"',
        '"Microsoft Corp.","NASDAQ:MSFT"'
      ];
      
      const result = formatForTickerTape(stonkPairs);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft Corp.", "proName":"NASDAQ:MSFT"}');
    });

    test('should handle quoted strings', () => {
      const stonkPairs = ['"Apple Inc.","NASDAQ:AAPL"'];
      
      const result = formatForTickerTape(stonkPairs);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"}');
    });

    test('should skip entries with missing data', () => {
      const stonkPairs = [
        '"Apple Inc.","NASDAQ:AAPL"',
        '""',
        ',NASDAQ:MSFT',
        'Microsoft,""'
      ];
      
      const result = formatForTickerTape(stonkPairs);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"}');
    });

    test('should handle whitespace and newlines', () => {
      const stonkPairs = [
        '  "Apple Inc."  ,  "NASDAQ:AAPL"  ',
        '\n"Microsoft"\n,\n"NASDAQ:MSFT"\n'
      ];
      
      const result = formatForTickerTape(stonkPairs);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft", "proName":"NASDAQ:MSFT"}');
    });
  });

  describe('formatStructuredDataForTickerTape', () => {
    test('should format structured holdings for ticker tape', () => {
      const result = formatStructuredDataForTickerTape(mockHoldings);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft Corp.", "proName":"NASDAQ:MSFT"},{"description":"My Portfolio", "proName":"10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"}');
    });

    test('should skip holdings with missing name or symbol', () => {
      const holdings = [
        { name: 'Apple Inc.', symbol: 'NASDAQ:AAPL' },
        { name: '', symbol: 'NASDAQ:MSFT' },
        { name: 'Google', symbol: '' },
        { symbol: 'NASDAQ:GOOGL' }
      ];
      
      const result = formatStructuredDataForTickerTape(holdings);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"}');
    });
  });

  describe('formatForChartGrid', () => {
    test('should format stonk pairs for chart grid', () => {
      const stonkPairs = [
        '"Apple Inc.","NASDAQ:AAPL"',
        '"Microsoft Corp.","NASDAQ:MSFT"'
      ];
      
      const result = formatForChartGrid(stonkPairs);
      
      expect(result).toContain('"s": "NASDAQ:AAPL"');
      expect(result).toContain('"d": "Apple Inc."');
      expect(result).toContain('"s": "NASDAQ:MSFT"');
      expect(result).toContain('"d": "Microsoft Corp."');
    });

    test('should handle complex data cleaning', () => {
      const stonkPairs = [
        '\n"Apple Inc."\n,"NASDAQ:AAPL"\n',
        '  "Microsoft"  ,  "NASDAQ:MSFT"  '
      ];
      
      const result = formatForChartGrid(stonkPairs);
      
      expect(result).toContain('"s": "NASDAQ:AAPL"');
      expect(result).toContain('"d": "Apple Inc."');
      expect(result).toContain('"s": "NASDAQ:MSFT"');
      expect(result).toContain('"d": "Microsoft"');
    });

    test('should skip invalid entries', () => {
      const stonkPairs = [
        '"Apple Inc.","NASDAQ:AAPL"',
        'InvalidEntry',
        '',
        '  ',
        'OnlyName,'
      ];
      
      const result = formatForChartGrid(stonkPairs);
      
      expect(result).toContain('"s": "NASDAQ:AAPL"');
      expect(result).toContain('"d": "Apple Inc."');
      expect(result.split(',').length).toBeLessThan(stonkPairs.length * 2);
    });
  });

  describe('formatStructuredDataForChartGrid', () => {
    test('should format structured holdings for chart grid', () => {
      const result = formatStructuredDataForChartGrid(mockHoldings);
      
      expect(result).toContain('"s": "NASDAQ:AAPL"');
      expect(result).toContain('"d": "Apple Inc."');
      expect(result).toContain('"s": "10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"');
      expect(result).toContain('"d": "My Portfolio"');
    });
  });

  describe('formatForLargeChart', () => {
    test('should format stonk pairs for large chart', () => {
      const stonkPairs = [
        '"Apple Inc.","NASDAQ:AAPL"\n',
        '"Microsoft Corp.","NASDAQ:MSFT"'
      ];
      
      const result = formatForLargeChart(stonkPairs);
      
      expect(result).toContain('["Apple Inc.", "NASDAQ:AAPL|3M|USD"]');
      expect(result).toContain('["Microsoft Corp.", "NASDAQ:MSFT|3M|USD"]');
    });
  });

  describe('formatStructuredDataForLargeChart', () => {
    test('should format structured holdings for large chart', () => {
      const result = formatStructuredDataForLargeChart(mockHoldings);
      
      expect(result).toContain('["Apple Inc.", "NASDAQ:AAPL|3M|USD"]');
      expect(result).toContain('["Microsoft Corp.", "NASDAQ:MSFT|3M|USD"]');
      expect(result).toContain('["My Portfolio", "10*NASDAQ:AAPL+5*NASDAQ:MSFT+100|3M|USD"]');
    });

    test('should handle single holding', () => {
      const holdings = [{ name: 'Apple', symbol: 'NASDAQ:AAPL' }];
      
      const result = formatStructuredDataForLargeChart(holdings);
      
      expect(result).toBe('["Apple", "NASDAQ:AAPL|3M|USD"]');
    });
  });

  describe('formatStructuredDataForWatchlist', () => {
    test('should format structured holdings for watchlist', () => {
      const result = formatStructuredDataForWatchlist(mockHoldings);
      
      expect(result).toContain('"NASDAQ:AAPL"');
      expect(result).toContain('"NASDAQ:MSFT"');
      expect(result).toContain('"10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"');
    });

    test('should handle single holding', () => {
      const holdings = [{ name: 'Apple', symbol: 'NASDAQ:AAPL' }];
      
      const result = formatStructuredDataForWatchlist(holdings);
      
      expect(result).toBe('"NASDAQ:AAPL"');
    });

    test('should skip holdings without symbols', () => {
      const holdings = [
        { name: 'Apple', symbol: 'NASDAQ:AAPL' },
        { name: 'Invalid', symbol: '' },
        { name: 'Microsoft', symbol: 'NASDAQ:MSFT' }
      ];
      
      const result = formatStructuredDataForWatchlist(holdings);
      
      expect(result).toContain('"NASDAQ:AAPL"');
      expect(result).toContain('"NASDAQ:MSFT"');
      expect(result).not.toContain('Invalid');
    });
  });

  describe('extractSymbol', () => {
    test('should extract symbol from stonk pair', () => {
      const result = extractSymbol('"Apple Inc.","NASDAQ:AAPL"');
      expect(result).toBe('NASDAQ:AAPL');
    });

    test('should handle quoted symbols', () => {
      const result = extractSymbol('Apple,"NASDAQ:AAPL"');
      expect(result).toBe('NASDAQ:AAPL');
    });

    test('should handle whitespace', () => {
      const result = extractSymbol('Apple,  "NASDAQ:AAPL"  ');
      expect(result).toBe('NASDAQ:AAPL');
    });

    test('should return empty string for invalid pairs', () => {
      expect(extractSymbol('OnlyName')).toBe('');
      expect(extractSymbol('')).toBe('');
      expect(extractSymbol('Name,')).toBe('');
    });
  });

  describe('getOptimizedHoldingsData', () => {
    beforeEach(() => {
      mockDatabaseService.getAllHoldings = vi.fn();
    });

    test('should use structured data when available for ticker format', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'ticker');
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft Corp.", "proName":"NASDAQ:MSFT"},{"description":"My Portfolio", "proName":"10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"}');
    });

    test('should use structured data for chartGrid format', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'chartGrid');
      
      expect(result).toContain('"s": "NASDAQ:AAPL"');
      expect(result).toContain('"d": "Apple Inc."');
    });

    test('should use structured data for largeChart format', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'largeChart');
      
      expect(result).toContain('["Apple Inc.", "NASDAQ:AAPL|3M|USD"]');
    });

    test('should use structured data for watchlist format', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'watchlist');
      
      expect(result).toContain('"NASDAQ:AAPL"');
      expect(result).toContain('"NASDAQ:MSFT"');
    });

    test('should return raw structured data for raw format', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'raw');
      
      expect(result).toEqual(mockHoldings);
    });

    test('should fallback to parsing pipe-separated format', async () => {
      // No getAllHoldings method available
      delete mockDatabaseService.getAllHoldings;
      mockDatabaseService.getHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService, 'ticker');
      
      expect(result).toContain('Apple Inc.');
      expect(result).toContain('NASDAQ:AAPL');
    });

    test('should handle database errors', async () => {
      mockDatabaseService.getAllHoldings.mockRejectedValue(new Error('Database error'));
      mockDatabaseService.getHoldings.mockRejectedValue(new Error('Database error'));
      
      await expect(getOptimizedHoldingsData(mockDatabaseService, 'ticker')).rejects.toThrow();
    });

    test('should use default format when format type not specified', async () => {
      mockDatabaseService.getAllHoldings.mockResolvedValue(mockHoldings);
      
      const result = await getOptimizedHoldingsData(mockDatabaseService);
      
      expect(result).toBe('{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft Corp.", "proName":"NASDAQ:MSFT"},{"description":"My Portfolio", "proName":"10*NASDAQ:AAPL+5*NASDAQ:MSFT+100"}');
    });
  });
});