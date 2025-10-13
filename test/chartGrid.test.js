import { describe, it, expect } from 'vitest';
import { generateChartGridPage } from '../src/chartGrid.js';

describe('ChartGrid (React)', () => {
  it('should return a Response object', async () => {
    const mockDb = {};
    const response = await generateChartGridPage(mockDb);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it('should have correct content-type header', async () => {
    const mockDb = {};
    const response = await generateChartGridPage(mockDb);
    
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/html');
  });

  it('should include React root element', async () => {
    const mockDb = {};
    const response = await generateChartGridPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('id="root"');
  });

  it('should load React chart grid bundle', async () => {
    const mockDb = {};
    const response = await generateChartGridPage(mockDb);
    const html = await response.text();
    
    expect(html).toContain('src="/stonks/dist/chartGrid.js"');
  });
});
