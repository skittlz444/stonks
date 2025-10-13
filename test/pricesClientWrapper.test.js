import { describe, test, expect } from 'vitest';
import { generatePricesPageClient } from '../src/pricesClientWrapper.js';

describe('Prices Client Wrapper (React)', () => {
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
      expect(html).toContain('Live Stock Prices');
    });

    test('should include React root element', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="root"');
    });

    test('should load React prices bundle', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('src="/stonks/dist/prices.js"');
      expect(html).toContain('<script type="module"');
    });

    test('should include company profile modal', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('showCompanyProfile');
      expect(html).toContain('companyProfileModal');
    });

    test('should include Bootstrap CSS and JS', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('bootstrap');
    });

    test('should have dark theme styling', async () => {
      const response = generatePricesPageClient();
      const html = await response.text();
      
      expect(html).toContain('background-color:#212529');
      expect(html).toContain('color:#ffffff');
    });

    test('should work with any parameters (handled by React)', async () => {
      // Parameters are now handled by React reading from URL
      const response1 = generatePricesPageClient(false, 'USD');
      const response2 = generatePricesPageClient(true, 'SGD');
      
      const html1 = await response1.text();
      const html2 = await response2.text();
      
      // Both should load the same React app
      expect(html1).toContain('src="/stonks/dist/prices.js"');
      expect(html2).toContain('src="/stonks/dist/prices.js"');
    });
  });
});
