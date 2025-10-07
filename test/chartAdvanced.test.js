import { describe, test, expect, beforeEach } from 'vitest';
import { generateAdvancedChartPage } from '../src/chartAdvanced.js';
import { DatabaseService, MockD1Database } from '../src/databaseService.js';

describe('Advanced Chart Page', () => {
  let databaseService;

  beforeEach(() => {
    databaseService = new DatabaseService(new MockD1Database());
  });

  describe('generateAdvancedChartPage', () => {
    test('should generate complete HTML page with advanced chart', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      // Check basic HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<body');
      expect(html).toContain('</html>');
      
      // Check for advanced chart widget
      expect(html).toContain('embed-widget-advanced-chart.js');
      expect(html).toContain('tradingview-widget-container');
    });

    test('should include portfolio symbol as default', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"symbol": "2*aaau"');
    });

    test('should include watchlist with portfolio holdings', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"watchlist": [');
      // Mock database has BATS:VOO by default
      expect(html).toContain('BATS:VOO');
    });

    test('should include compare symbols', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"compareSymbols": [');
      expect(html).toContain('"symbol": "SPCFD:SPX"');
      expect(html).toContain('"symbol": "NASDAQ:NDX"');
      expect(html).toContain('"position": "SameScale"');
    });

    test('should configure timezone to Singapore', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"timezone": "Asia/Singapore"');
    });

    test('should enable bottom toolbar and details', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"withdateranges": true');
      expect(html).toContain('"details": true');
    });

    test('should use dark theme', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('"theme": "dark"');
      expect(html).toContain('background-color:#212529');
    });

    test('should include navigation footer', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('Live Prices');
      expect(html).toContain('Ticker View');
      expect(html).toContain('Grid Charts');
      expect(html).toContain('Large Charts');
      expect(html).toContain('Advanced Chart');
      expect(html).toContain('Config');
    });

    test('should use full-screen layout', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      const html = await response.text();

      expect(html).toContain('height:100vh');
      expect(html).toContain('height:calc(100vh - 80px)');
    });

    test('should return proper Response object', async () => {
      const response = await generateAdvancedChartPage(databaseService);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('content-type')).toBe('text/html;charset=UTF-8');
    });
  });
});
