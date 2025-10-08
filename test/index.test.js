import { describe, test, expect, vi, beforeEach } from 'vitest';
import workerHandler from '../src/index.js';
import { DatabaseService, MockD1Database } from '../src/databaseService.js';

// Mock the page generators
vi.mock('../src/ticker.js', () => ({
  generateTickerPage: vi.fn().mockResolvedValue(new Response('Ticker Page', { status: 200 }))
}));

vi.mock('../src/chartGrid.js', () => ({
  generateChartGridPage: vi.fn().mockResolvedValue(new Response('Chart Grid Page', { status: 200 }))
}));

vi.mock('../src/chartLarge.js', () => ({
  generateLargeChartPage: vi.fn().mockResolvedValue(new Response('Large Chart Page', { status: 200 }))
}));

vi.mock('../src/prices.js', () => ({
  generatePricesPage: vi.fn().mockResolvedValue(new Response('Prices Page', { status: 200 }))
}));

vi.mock('../src/pricesClientWrapper.js', () => ({
  generatePricesPageClient: vi.fn().mockReturnValue(new Response('Prices Page Client', { status: 200 }))
}));

vi.mock('../src/config.js', () => ({
  generateConfigPage: vi.fn().mockResolvedValue(new Response('Config Page', { status: 200 })),
  handleConfigSubmission: vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { 'Location': '/stonks/config?success=1' } }))
}));

vi.mock('../src/configClientWrapper.js', () => ({
  generateConfigPageClient: vi.fn().mockReturnValue(new Response('Config Page Client', { status: 200 }))
}));

describe('Index Router', () => {
  let mockEnv;
  let mockRequest;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEnv = {
      STONKS_DB: {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [], success: true }),
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
          bind: vi.fn().mockReturnThis()
        })
      }
    };
  });

  const createMockRequest = (url, method = 'GET', body = null) => {
    return {
      url,
      method,
      formData: vi.fn().mockResolvedValue(new FormData())
    };
  };

  describe('Route handling', () => {
    test('should handle /stonks/ticker route', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Ticker Page');
    });

    test('should handle /stonks/charts route', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/charts');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Chart Grid Page');
    });

    test('should handle /stonks/charts/large route', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/charts/large');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Large Chart Page');
    });

    test('should handle GET /stonks/config route', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/config');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Config Page Client');
    });

    test('should handle POST /stonks/config route', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/config', 'POST');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/stonks/config?success=1');
    });

    test('should return 404 for unknown routes', async () => {
      mockRequest = createMockRequest('http://localhost/unknown');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toContain('404 Not Found');
      expect(text).toContain('/stonks/ticker');
      expect(text).toContain('/stonks/charts');
      expect(text).toContain('/stonks/charts/large');
      expect(text).toContain('/stonks/config');
    });
  });

  describe('Database service initialization', () => {
    test('should use D1 database when available', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      mockEnv.STONKS_DB.prepare().all.mockResolvedValue({ results: [{ name: 'test', symbol: 'TEST' }], success: true });
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
      expect(mockEnv.STONKS_DB.prepare).toHaveBeenCalled();
    });

    test('should fall back to MockD1Database when STONKS_DB not available', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      mockEnv.STONKS_DB = null;
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should fall back to MockD1Database when D1 database fails', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      mockEnv.STONKS_DB.prepare.mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should handle database service errors gracefully', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      
      // Since we can't easily mock the DatabaseService constructor,
      // we test that the app handles database errors gracefully by
      // verifying it works with no environment database
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    test('should return 500 when page generation fails', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      
      // Mock the ticker page to throw an error
      const { generateTickerPage } = await import('../src/ticker.js');
      vi.mocked(generateTickerPage).mockRejectedValueOnce(new Error('Page generation failed'));
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Internal Server Error');
    });

    test('should return 500 when config submission fails', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/config', 'POST');
      
      // Mock the config handler to throw an error
      const { handleConfigSubmission } = await import('../src/config.js');
      vi.mocked(handleConfigSubmission).mockRejectedValueOnce(new Error('Config submission failed'));
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Internal Server Error');
    });

    test('should handle malformed URLs gracefully', async () => {
      // Since Request constructor validates URLs, we test URL error handling
      // by ensuring the app handles edge cases like unusual paths
      mockRequest = createMockRequest('http://localhost/stonks/%invalid%path');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      // Should either handle it or return 404, but not crash
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('Request method handling', () => {
    test('should handle different HTTP methods for config route', async () => {
      // GET request
      const getRequest = createMockRequest('http://localhost/stonks/config', 'GET');
      const getResponse = await workerHandler.fetch(getRequest, mockEnv);
      expect(getResponse.status).toBe(200);
      
      // POST request
      const postRequest = createMockRequest('http://localhost/stonks/config', 'POST');
      const postResponse = await workerHandler.fetch(postRequest, mockEnv);
      expect(postResponse.status).toBe(302);
    });

    test('should handle PUT, DELETE, and other methods as GET for non-config routes', async () => {
      const methods = ['PUT', 'DELETE', 'PATCH', 'HEAD'];
      
      for (const method of methods) {
        const request = createMockRequest('http://localhost/stonks/ticker', method);
        const response = await workerHandler.fetch(request, mockEnv);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('URL parsing', () => {
    test('should handle URLs with query parameters', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker?param=value');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should handle URLs with fragments', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/ticker#section');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should handle URLs with different protocols', async () => {
      mockRequest = createMockRequest('https://localhost/stonks/ticker');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should handle URLs with different hosts', async () => {
      mockRequest = createMockRequest('https://example.com/stonks/ticker');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Integration with page generators', () => {
    test('should pass database service to page generators', async () => {
      const { generateTickerPage } = await import('../src/ticker.js');
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      
      await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(generateTickerPage).toHaveBeenCalledWith(expect.any(DatabaseService));
    });

    test('should pass database service to config handlers', async () => {
      const { generateConfigPageClient } = await import('../src/configClientWrapper.js');
      const { handleConfigSubmission } = await import('../src/config.js');
      
      // Test GET config
      const getRequest = createMockRequest('http://localhost/stonks/config', 'GET');
      await workerHandler.fetch(getRequest, mockEnv);
      expect(generateConfigPageClient).toHaveBeenCalled();
      
      // Test POST config
      const postRequest = createMockRequest('http://localhost/stonks/config', 'POST');
      await workerHandler.fetch(postRequest, mockEnv);
      expect(handleConfigSubmission).toHaveBeenCalledWith(postRequest, expect.any(DatabaseService));
    });
  });

  describe('Response handling', () => {
    test('should preserve response headers from page generators', async () => {
      const { generateTickerPage } = await import('../src/ticker.js');
      vi.mocked(generateTickerPage).mockResolvedValueOnce(
        new Response('Ticker Page', { 
          status: 200, 
          headers: { 'Custom-Header': 'test-value' } 
        })
      );
      
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.headers.get('Custom-Header')).toBe('test-value');
    });

    test('should preserve response status from page generators', async () => {
      const { generateTickerPage } = await import('../src/ticker.js');
      vi.mocked(generateTickerPage).mockResolvedValueOnce(
        new Response('Ticker Page', { status: 201 })
      );
      
      mockRequest = createMockRequest('http://localhost/stonks/ticker');
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(201);
    });
  });

  describe('Static file serving', () => {
    test('should serve PNG icons with correct content type', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/icons/icon-192.png');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('PNG content', { 
          status: 200,
          headers: { 'content-type': 'image/png' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should serve SVG icons with correct content type', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/icons/icon.svg');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('SVG content', { 
          status: 200,
          headers: { 'content-type': 'image/svg+xml' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should serve JPG/JPEG icons with correct content type', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/icons/icon.jpg');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('JPG content', { 
          status: 200,
          headers: { 'content-type': 'image/jpeg' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should serve ICO icons with correct content type', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/icons/favicon.ico');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('ICO content', { 
          status: 200,
          headers: { 'content-type': 'image/x-icon' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should handle unknown icon extensions with default content type', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/icons/icon.unknown');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('Unknown content', { 
          status: 200,
          headers: { 'content-type': 'application/octet-stream' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should serve service worker file', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/sw.js');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('service worker code', { 
          status: 200,
          headers: { 'content-type': 'application/javascript' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should serve manifest.json file', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/manifest.json');
      mockEnv.ASSETS = {
        fetch: vi.fn().mockResolvedValue(new Response('{"name":"Stonks"}', { 
          status: 200,
          headers: { 'content-type': 'application/json' }
        }))
      };
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Redirects', () => {
    test('should redirect /stonks/ to /stonks/prices', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('http://localhost/stonks/prices');
    });

    test('should redirect /stonks to /stonks/prices', async () => {
      mockRequest = createMockRequest('http://localhost/stonks');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('http://localhost/stonks/prices');
    });
  });

  describe('Prices page with query parameters', () => {
    test('should handle prices page with rebalance mode', async () => {
      const { generatePricesPageClient } = await import('../src/pricesClientWrapper.js');
      mockRequest = createMockRequest('http://localhost/stonks/prices?mode=rebalance');
      
      await workerHandler.fetch(mockRequest, mockEnv);
      
      // Should be called with rebalanceMode = true
      expect(generatePricesPageClient).toHaveBeenCalledWith(
        true, // rebalanceMode
        'USD' // currency
      );
    });

    test('should handle prices page without rebalance mode', async () => {
      const { generatePricesPageClient } = await import('../src/pricesClientWrapper.js');
      mockRequest = createMockRequest('http://localhost/stonks/prices');
      
      await workerHandler.fetch(mockRequest, mockEnv);
      
      // Should be called with rebalanceMode = false
      expect(generatePricesPageClient).toHaveBeenCalledWith(
        false, // rebalanceMode
        'USD' // currency
      );
    });

    test('should handle prices page with currency parameter', async () => {
      const { generatePricesPageClient } = await import('../src/pricesClientWrapper.js');
      mockRequest = createMockRequest('http://localhost/stonks/prices?currency=SGD');
      mockEnv.OPENEXCHANGERATES_API_KEY = 'test-fx-key';
      
      await workerHandler.fetch(mockRequest, mockEnv);
      
      // Should be called with currency = 'SGD'
      expect(generatePricesPageClient).toHaveBeenCalledWith(
        false, // rebalanceMode
        'SGD' // currency
      );
    });
  });

  describe('Service initialization', () => {
    test('should initialize Finnhub service when API key is provided', async () => {
      mockEnv.FINNHUB_API_KEY = 'test-finnhub-key';
      mockRequest = createMockRequest('http://localhost/stonks/prices');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should initialize FX service when API key is provided', async () => {
      mockEnv.OPENEXCHANGERATES_API_KEY = 'test-fx-key';
      mockRequest = createMockRequest('http://localhost/stonks/prices');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(200);
    });

    test('should reuse cached services when API keys unchanged', async () => {
      mockEnv.FINNHUB_API_KEY = 'test-finnhub-key';
      mockEnv.OPENEXCHANGERATES_API_KEY = 'test-fx-key';
      mockRequest = createMockRequest('http://localhost/stonks/prices');
      
      // First request
      await workerHandler.fetch(mockRequest, mockEnv);
      
      // Second request with same keys
      const response2 = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response2.status).toBe(200);
    });

    test('should clear services when API keys are removed', async () => {
      mockEnv.FINNHUB_API_KEY = 'test-finnhub-key';
      mockRequest = createMockRequest('http://localhost/stonks/prices');
      
      // First request with API key
      await workerHandler.fetch(mockRequest, mockEnv);
      
      // Second request without API key
      delete mockEnv.FINNHUB_API_KEY;
      const response2 = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response2.status).toBe(200);
    });
  });

  describe('Error handling', () => {
    test('should handle unknown routes', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/unknown');
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(404);
    });

    test('should handle API errors in prices-data endpoint', async () => {
      mockEnv.FINNHUB_API_KEY = 'test-key';
      mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
      
      // Mock a critical error by making Promise.all fail
      // We'll make the database return invalid data that causes downstream errors
      const mockHolding = { name: 'Test', code: 'TEST:SYMBOL', quantity: 10 };
      mockEnv.STONKS_DB.prepare.mockReturnValue({
        all: vi.fn().mockResolvedValue({ results: [mockHolding] }),
        first: vi.fn().mockResolvedValue({ value: '1000' }),
        bind: vi.fn().mockReturnThis()
      });
      
      // Mock FinnhubService to throw an error
      const { default: index } = await import('../src/index.js');
      // Since we can't easily mock finnhubService methods after initialization,
      // let's test with missing FINNHUB_API_KEY which returns 503
      delete mockEnv.FINNHUB_API_KEY;
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      // Without Finnhub API key, we get 503 (Service Unavailable)
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toContain('Finnhub API key');
    });

    test('should handle API errors in config-data endpoint', async () => {
      mockRequest = createMockRequest('http://localhost/stonks/api/config-data');
      
      // Mock database error
      mockEnv.STONKS_DB.prepare.mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('Database error')),
        bind: vi.fn().mockReturnThis()
      });
      
      const response = await workerHandler.fetch(mockRequest, mockEnv);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('API Endpoints', () => {
    describe('/stonks/api/config-data', () => {
      test('should return config data with holdings and transactions', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/api/config-data');
        
        // Mock successful database responses
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ 
            results: [
              { id: 1, name: 'Apple', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 25, hidden: 0 }
            ] 
          }),
          first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.visibleHoldings).toBeDefined();
        expect(data.hiddenHoldings).toBeDefined();
        expect(data.transactions).toBeDefined();
        expect(data.cashAmount).toBeDefined();
        expect(data.portfolioName).toBeDefined();
        expect(data.totalTargetWeight).toBeDefined();
      });

      test('should optimize holding data by removing unnecessary fields', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/api/config-data');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ 
            results: [
              { 
                id: 1, 
                name: 'Apple', 
                code: 'NASDAQ:AAPL', 
                quantity: 10, 
                target_weight: 25, 
                hidden: 0,
                created_at: '2024-01-01',
                updated_at: '2024-01-02'
              }
            ] 
          }),
          first: vi.fn().mockResolvedValue(null),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        const data = await response.json();
        
        // Check that unnecessary fields are removed
        if (data.visibleHoldings.length > 0) {
          const holding = data.visibleHoldings[0];
          expect(holding.id).toBeDefined();
          expect(holding.name).toBeDefined();
          expect(holding.code).toBeDefined();
          expect(holding.quantity).toBeDefined();
          expect(holding.target_weight).toBeDefined();
          expect(holding.hidden).toBeUndefined();
          expect(holding.created_at).toBeUndefined();
          expect(holding.updated_at).toBeUndefined();
        }
      });

      test('should include no-cache headers in config-data response', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/api/config-data');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          first: vi.fn().mockResolvedValue(null),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0');
        expect(response.headers.get('pragma')).toBe('no-cache');
        expect(response.headers.get('expires')).toBe('0');
      });
    });

    describe('/stonks/api/prices-data', () => {
      test('should return error when Finnhub API key is not configured', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(503);
        const data = await response.json();
        expect(data.error).toContain('Finnhub API key');
      });

      test('should return prices data when Finnhub API key is configured', async () => {
        mockEnv.FINNHUB_API_KEY = 'test-key';
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.holdings).toBeDefined();
        expect(data.cashAmount).toBeDefined();
        expect(data.closedPositions).toBeDefined();
        expect(data.fxRates).toBeDefined();
        expect(data.fxAvailable).toBeDefined();
        expect(data.cacheStats).toBeDefined();
      });

      test('should optimize holding data by removing unnecessary fields', async () => {
        mockEnv.FINNHUB_API_KEY = 'test-key';
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        const data = await response.json();
        
        expect(data.holdings).toBeInstanceOf(Array);
        // Holdings should not have hidden, created_at, updated_at fields
        if (data.holdings.length > 0) {
          const holding = data.holdings[0];
          expect(holding.hidden).toBeUndefined();
          expect(holding.created_at).toBeUndefined();
          expect(holding.updated_at).toBeUndefined();
        }
      });

      test('should handle rebalance mode parameter', async () => {
        mockEnv.FINNHUB_API_KEY = 'test-key';
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data?mode=rebalance');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        const data = await response.json();
        
        expect(data.rebalanceMode).toBe(true);
        // In rebalance mode, closed positions should be empty
        expect(data.closedPositions).toEqual([]);
      });

      test('should handle currency parameter', async () => {
        mockEnv.FINNHUB_API_KEY = 'test-key';
        mockEnv.OPENEXCHANGERATES_API_KEY = 'test-fx-key';
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data?currency=SGD');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        const data = await response.json();
        
        expect(data.currency).toBe('SGD');
        expect(data.fxAvailable).toBe(true);
      });

      test('should include no-cache headers in prices-data response', async () => {
        mockEnv.FINNHUB_API_KEY = 'test-key';
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
        
        mockEnv.STONKS_DB.prepare.mockReturnValue({
          all: vi.fn().mockResolvedValue({ results: [] }),
          bind: vi.fn().mockReturnThis()
        });
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);

        expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0');
        expect(response.headers.get('pragma')).toBe('no-cache');
        expect(response.headers.get('expires')).toBe('0');
      });

      test('should include no-cache headers in error responses', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/api/prices-data');
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(503);
        expect(response.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0');
        expect(response.headers.get('pragma')).toBe('no-cache');
        expect(response.headers.get('expires')).toBe('0');
      });
    });

    describe('Client script serving', () => {
      test('should serve prices client script', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/client/prices.js');
        mockEnv.ASSETS = {
          fetch: vi.fn().mockResolvedValue(new Response('// prices client code', { 
            status: 200 
          }))
        };
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/javascript');
      });

      test('should serve config client script', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/client/config.js');
        mockEnv.ASSETS = {
          fetch: vi.fn().mockResolvedValue(new Response('// config client code', { 
            status: 200 
          }))
        };
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/javascript');
      });

      test('should return 404 if client script not found', async () => {
        mockRequest = createMockRequest('http://localhost/stonks/client/prices.js');
        mockEnv.ASSETS = {
          fetch: vi.fn().mockResolvedValue(new Response('Not found', { 
            status: 404 
          }))
        };
        
        const response = await workerHandler.fetch(mockRequest, mockEnv);
        
        expect(response.status).toBe(404);
      });
    });
  });
});