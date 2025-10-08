import { describe, test, expect } from 'vitest';
import { generatePricesPageClient } from '../src/pricesClientWrapper.js';

describe('Prices Client Wrapper', () => {
  describe('generatePricesPageClient', () => {
    test('should return a Response object', () => {
      const response = generatePricesPageClient();
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    test('should have correct content-type header', () => {
      const response = generatePricesPageClient();
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('text/html');
      expect(contentType).toContain('charset=UTF-8');
    });

    test('should include HTML document structure', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    test('should include page title', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('<title>');
      expect(html).toContain('Stonks');
    });

    test('should include loading spinner', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="loading-state"');
      expect(html).toContain('Loading');
    });

    test('should include error container', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="error-state"');
      expect(html).toContain('id="error-message"');
    });

    test('should include main content container', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="main-content"');
    });

    test('should load client-side JavaScript module', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('<script type="module">');
      expect(html).toContain('/stonks/client/prices.js');
    });

    test('should include navigation links', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('/stonks/prices');
      expect(html).toContain('/stonks/ticker');
      expect(html).toContain('/stonks/config');
    });

    test('should include column controls button', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="column-controls-btn"');
      expect(html).toContain('Columns');
    });

    test('should pass rebalance mode to client script', async () => {
      const response = generatePricesPageClient(true);
      const html = await response.text();
      
      expect(html).toContain('initializePricesPage(true,');
    });

    test('should pass currency to client script', async () => {
      const response = generatePricesPageClient(false, 'SGD');
      const html = await response.text();
      
      expect(html).toContain("initializePricesPage(false, 'SGD')");
    });

    test('should default to USD currency', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain("initializePricesPage(false, 'USD')");
    });

    test('should default to normal mode (not rebalance)', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('initializePricesPage(false,');
    });

    test('should include CSS styles', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    test('should include viewport meta tag', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('<meta name="viewport"');
    });

    test('should include charset meta tag', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('charset="UTF-8"');
    });

    test('should include containers for dynamic content', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="holdingsTable"');
      expect(html).toContain('id="holdings-tbody"');
      expect(html).toContain('id="holdings-thead"');
      expect(html).toContain('id="portfolio-summary"');
      expect(html).toContain('id="closed-positions-section"');
    });

    test('should handle both parameters together', async () => {
      const response = generatePricesPageClient(true, 'AUD');
      const html = await response.text();
      
      expect(html).toContain("initializePricesPage(true, 'AUD')");
    });

    test('should include module import', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('import { initializePricesPage }');
      expect(html).toContain("from '/stonks/client/prices.js'");
    });

    test('should call initialization on DOMContentLoaded', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('DOMContentLoaded');
      expect(html).toContain('document.readyState');
    });

    test('should show rebalancing title in rebalance mode', async () => {
      const response = generatePricesPageClient(true);
      const html = await response.text();
      
      expect(html).toContain('Portfolio Rebalancing');
    });

    test('should show prices title in normal mode', async () => {
      const response = generatePricesPageClient(false);
      const html = await response.text();
      
      expect(html).toContain('Live Stock Prices');
    });

    test('should highlight correct currency button', async () => {
      const response = generatePricesPageClient(false, 'SGD');
      const html = await response.text();
      
      // SGD should be primary (active)
      expect(html).toMatch(/SGD.*btn-primary/s);
      // USD should be outline (inactive)
      expect(html).toMatch(/USD.*btn-outline-primary/s);
    });

    test('should include currency selector buttons', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('currency-selector');
      expect(html).toContain('/stonks/prices?currency=USD');
      expect(html).toContain('/stonks/prices?currency=SGD');
      expect(html).toContain('/stonks/prices?currency=AUD');
    });

    test('should include rebalance toggle button', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('rebalance-btn');
      expect(html).toContain('?mode=rebalance');
    });

    test('should include back button in rebalance mode', async () => {
      const response = generatePricesPageClient(true);
      const html = await response.text();
      
      expect(html).toContain('Back to Prices');
    });

    test('should include refresh button', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('location.reload()');
      expect(html).toContain('Refresh');
    });
  });
});
