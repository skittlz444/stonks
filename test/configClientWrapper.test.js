import { describe, test, expect } from 'vitest';
import { generateConfigPageClient } from '../src/configClientWrapper.js';

describe('Config Client Wrapper', () => {
  describe('generateConfigPageClient', () => {
    test('should return a Response object', () => {
      const response = generateConfigPageClient();
      
      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    test('should have correct content-type header', () => {
      const response = generateConfigPageClient();
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('text/html');
      expect(contentType).toContain('charset=UTF-8');
    });

    test('should include HTML document structure', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    test('should include page title', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('<title>');
      expect(html).toContain('Config');
    });

    test('should include loading spinner', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="loading-state"');
      expect(html).toContain('Loading');
    });

    test('should include error container', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="error-state"');
      expect(html).toContain('id="error-message"');
    });

    test('should include main content container', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="main-content"');
    });

    test('should load client-side JavaScript module', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('<script type="module">');
      expect(html).toContain('/stonks/client/config.js');
    });

    test('should include navigation links', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('/stonks/prices');
      expect(html).toContain('/stonks/ticker');
      expect(html).toContain('/stonks/config');
    });

    test('should include CSS styles', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    test('should include viewport meta tag', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('<meta name="viewport"');
    });

    test('should include charset meta tag', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('charset="UTF-8"');
    });

    test('should include containers for dynamic content', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="portfolio_name"');
      expect(html).toContain('id="visible-holdings-body"');
      expect(html).toContain('id="transactions-body"');
    });

    test('should include modal forms', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="addHoldingModal"');
      expect(html).toContain('id="editHoldingModal"');
      expect(html).toContain('id="addTransactionModal"');
    });

    test('should include form inputs', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="cash_amount"');
      expect(html).toContain('id="add_name"');
      expect(html).toContain('id="add_code"');
    });
  });
});
