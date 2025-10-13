import { describe, it, expect, vi } from 'vitest';
import { generateTickerPage } from '../src/ticker.js';

describe('Ticker (React)', () => {
  it('should return a Response object', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it('should have correct content-type header', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/html');
  });

  it('should include HTML document structure', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('should include React root element', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('id="root"');
  });

  it('should load React ticker bundle', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('src="/stonks/dist/ticker.js"');
    expect(html).toContain('<script type="module"');
  });

  it('should have dark theme styling', async () => {
    const mockDb = {};
    const response = await generateTickerPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('background-color:#212529');
  });
});
