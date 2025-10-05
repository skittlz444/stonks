import { describe, test, expect } from 'vitest';
import { 
  generateHTMLHeader,
  generatePageLayout,
  generateGridContainer,
  generateChartGridLayout,
  generateFullHeightContainer,
  generateFooter,
  createLayout,
  createResponse
} from '../src/utils.js';

describe('Utils', () => {
  describe('generateHTMLHeader', () => {
    test('should generate valid HTML header with Bootstrap CSS and JS', () => {
      const header = generateHTMLHeader();
      
      expect(header).toContain('<!DOCTYPE html>');
      expect(header).toContain('<head>');
      expect(header).toContain('bootstrap@5.3.7');
      expect(header).toContain('css');
      expect(header).toContain('js');
      expect(header).toContain('integrity=');
      expect(header).toContain('crossorigin="anonymous"');
    });

    test('should include Bootstrap CSS link', () => {
      const header = generateHTMLHeader();
      expect(header).toContain('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css"');
    });

    test('should include Bootstrap JS script', () => {
      const header = generateHTMLHeader();
      expect(header).toContain('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"');
    });
  });

  describe('generatePageLayout', () => {
    test('should generate complete page layout with default styles', () => {
      const content = '<div>Test content</div>';
      const layout = generatePageLayout(content);
      
      expect(layout).toContain('<!DOCTYPE html>');
      expect(layout).toContain('<body style="background-color:black;margin:0px">');
      expect(layout).toContain('<div>Test content</div>');
      expect(layout).toContain('</body>');
      expect(layout).toContain('<footer>');
    });

    test('should use custom body styles when provided', () => {
      const content = '<div>Test content</div>';
      const customStyles = 'background-color: white; padding: 20px;';
      const layout = generatePageLayout(content, customStyles);
      
      expect(layout).toContain(`<body style="${customStyles}">`);
    });

    test('should include footer with navigation links', () => {
      const layout = generatePageLayout('<div>content</div>');
      
      expect(layout).toContain('<footer>');
      expect(layout).toContain('href="/stonks/ticker"');
      expect(layout).toContain('href="/stonks/charts"');
      expect(layout).toContain('href="/stonks/charts/large"');
      expect(layout).toContain('href="/stonks/config"');
    });
  });

  describe('generateGridContainer', () => {
    test('should generate grid container with default classes', () => {
      const content = '<div>Grid item</div>';
      const container = generateGridContainer(content);
      
      expect(container).toContain('<div class="container-fluid"');
      expect(container).toContain('padding-top:40px');
      expect(container).toContain('<div class="row g-0');
      expect(container).toContain('row-cols-1 row-cols-xs-2');
      expect(container).toContain('<div>Grid item</div>');
    });

    test('should use custom grid classes when provided', () => {
      const content = '<div>Grid item</div>';
      const customClasses = 'row-cols-1 row-cols-md-2';
      const container = generateGridContainer(content, customClasses);
      
      expect(container).toContain(`<div class="row g-0 ${customClasses}">`);
    });

    test('should wrap content in proper Bootstrap grid structure', () => {
      const content = '<div class="col">Item 1</div><div class="col">Item 2</div>';
      const container = generateGridContainer(content);
      
      expect(container).toContain('container-fluid');
      expect(container).toContain('row g-0');
      expect(container).toContain('Item 1');
      expect(container).toContain('Item 2');
    });
  });

  describe('generateChartGridLayout', () => {
    test('should generate chart-specific grid layout', () => {
      const content = '<div class="col">Chart</div>';
      const layout = generateChartGridLayout(content);
      
      expect(layout).toContain('<div class="container-fluid">');
      expect(layout).toContain('row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3');
      expect(layout).toContain('<div class="col">Chart</div>');
    });

    test('should use responsive breakpoints for charts', () => {
      const layout = generateChartGridLayout('');
      
      expect(layout).toContain('row-cols-1'); // mobile
      expect(layout).toContain('row-cols-sm-1'); // small
      expect(layout).toContain('row-cols-md-2'); // medium
      expect(layout).toContain('row-cols-xl-3'); // extra large
    });
  });

  describe('generateFullHeightContainer', () => {
    test('should generate full-height container', () => {
      const content = '<div>Full height content</div>';
      const container = generateFullHeightContainer(content);
      
      expect(container).toContain('<div class="container-fluid"');
      expect(container).toContain('height:100vh');
      expect(container).toContain('<div>Full height content</div>');
    });

    test('should use viewport height for full screen layout', () => {
      const container = generateFullHeightContainer('');
      expect(container).toContain('style="height:100vh"');
    });
  });

  describe('generateFooter', () => {
    test('should generate footer with all navigation links', () => {
      const footer = generateFooter();
      
      expect(footer).toContain('</body>');
      expect(footer).toContain('<footer>');
      expect(footer).toContain('href="/stonks/ticker">Ticker</a>');
      expect(footer).toContain('href="/stonks/charts">Chart Grid</a>');
      expect(footer).toContain('href="/stonks/charts/large">Large Chart</a>');
      expect(footer).toContain('href="/stonks/config">Config</a>');
    });

    test('should include proper styling for links', () => {
      const footer = generateFooter();
      
      expect(footer).toContain('style="padding-left:1.5rem"');
    });

    test('should close body tag', () => {
      const footer = generateFooter();
      expect(footer).toContain('</body>');
      expect(footer).toContain('</footer>');
    });
  });

  describe('createLayout', () => {
    test('should create complete HTML layout with title', () => {
      const title = 'Test Page';
      const content = '<div>Page content</div>';
      const response = createLayout(title, content);
      
      // Should return a Response object
      expect(response).toBeInstanceOf(Response);
    });

    test('should use dark theme by default', async () => {
      const response = createLayout('Test', '<div>content</div>');
      const html = await response.text();
      
      expect(html).toContain('data-bs-theme="dark"');
      expect(html).toContain('background-color:#212529');
      expect(html).toContain('color:#ffffff');
    });

    test('should include proper HTML5 structure', async () => {
      const response = createLayout('Test Page', '<div>content</div>');
      const html = await response.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en"');
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
      expect(html).toContain('<title>Test Page</title>');
      expect(html).toContain('</html>');
    });

    test('should allow custom body styles', async () => {
      const customStyles = 'background: red; color: blue;';
      const response = createLayout('Test', '<div>content</div>', customStyles);
      const html = await response.text();
      
      expect(html).toContain(`style="${customStyles}"`);
    });

    test('should include Bootstrap CSS and JS', async () => {
      const response = createLayout('Test', '<div>content</div>');
      const html = await response.text();
      
      expect(html).toContain('bootstrap@5.3.7/dist/css/bootstrap.min.css');
      expect(html).toContain('bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js');
    });

    test('should include footer navigation', async () => {
      const response = createLayout('Test', '<div>content</div>');
      const html = await response.text();
      
      expect(html).toContain('<footer>');
      expect(html).toContain('/stonks/ticker');
      expect(html).toContain('/stonks/config');
    });
  });

  describe('createResponse', () => {
    test('should create Response with HTML content type', () => {
      const html = '<html><body>Test</body></html>';
      const response = createResponse(html);
      
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('content-type')).toBe('text/html;charset=UTF-8');
    });

    test('should preserve HTML content', async () => {
      const html = '<div>Test content with <strong>bold</strong></div>';
      const response = createResponse(html);
      const content = await response.text();
      
      expect(content).toBe(html);
    });

    test('should have 200 status by default', () => {
      const response = createResponse('<html></html>');
      expect(response.status).toBe(200);
    });
  });

  describe('integration tests', () => {
    test('should work together for complete page generation', async () => {
      const header = generateHTMLHeader();
      const content = generateGridContainer('<div class="col">Chart</div>');
      const footer = generateFooter();
      const fullPage = `${header}<body>${content}${footer}`;
      const response = createResponse(fullPage);
      
      const html = await response.text();
      
      expect(html).toContain('bootstrap');
      expect(html).toContain('container-fluid');
      expect(html).toContain('Chart');
      expect(html).toContain('/stonks/ticker');
    });

    test('createLayout should be self-contained alternative', async () => {
      const response = createLayout('Portfolio', '<h1>My Portfolio</h1>');
      const html = await response.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Portfolio</title>');
      expect(html).toContain('<h1>My Portfolio</h1>');
      expect(html).toContain('bootstrap');
      expect(html).toContain('<footer>');
      expect(html).toContain('</html>');
    });
  });
});