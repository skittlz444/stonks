import { describe, test, expect } from 'vitest';
import { generateConfigPageClient } from '../src/configClientWrapper.js';

describe('Config Client Wrapper (React)', () => {
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
      expect(html).toContain('Portfolio Configuration');
    });

    test('should include React root element', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('id="root"');
    });

    test('should load React config bundle', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('src="/stonks/dist/config.js"');
      expect(html).toContain('<script type="module"');
    });

    test('should include company profile modal', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('showCompanyProfile');
      expect(html).toContain('companyProfileModal');
    });

    test('should include Bootstrap CSS and JS', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('bootstrap');
    });

    test('should have dark theme styling', async () => {
      const response = generateConfigPageClient();
      const html = await response.text();
      
      expect(html).toContain('background-color:#212529');
      expect(html).toContain('color:#ffffff');
    });
  });
});
