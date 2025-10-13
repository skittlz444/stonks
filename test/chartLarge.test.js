import { describe, it, expect } from 'vitest';
import { generateLargeChartPage } from '../src/chartLarge.js';

describe('ChartLarge (React)', () => {
  it('should return a Response object', async () => {
    const mockDb = {};
    const response = await generateLargeChartPage(mockDb);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it('should have correct content-type header', async () => {
    const mockDb = {};
    const response = await generateLargeChartPage(mockDb);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/html');
  });

  it('should include React root element', async () => {
    const mockDb = {};
    const response = await generateLargeChartPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('id="root"');
  });

  it('should load React chart large bundle', async () => {
    const mockDb = {};
    const response = await generateLargeChartPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('src="/stonks/dist/chartLarge.js"');
  });
});
