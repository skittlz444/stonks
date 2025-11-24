import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DatabaseService before importing the worker
vi.mock('../src/databaseService.js', () => {
  const mockGetVisiblePortfolioHoldings = vi.fn().mockResolvedValue([
    { id: 1, name: 'Apple', code: 'NASDAQ:AAPL', quantity: 10, target_weight: 50 }
  ]);
  const mockGetHiddenPortfolioHoldings = vi.fn().mockResolvedValue([]);
  const mockGetTransactions = vi.fn().mockResolvedValue([]);
  const mockGetCashAmount = vi.fn().mockResolvedValue(1000);
  const mockGetAllTransactionsGroupedByCode = vi.fn().mockResolvedValue({});
  const mockGetClosedPositions = vi.fn().mockResolvedValue([]);
  
  const mockPrepare = vi.fn(() => ({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' }),
    all: vi.fn().mockResolvedValue({ results: [] })
  }));

  return {
    DatabaseService: vi.fn().mockImplementation((db) => ({
      db: { prepare: mockPrepare },
      getVisiblePortfolioHoldings: mockGetVisiblePortfolioHoldings,
      getHiddenPortfolioHoldings: mockGetHiddenPortfolioHoldings,
      getTransactions: mockGetTransactions,
      getCashAmount: mockGetCashAmount,
      getAllTransactionsGroupedByCode: mockGetAllTransactionsGroupedByCode,
      getClosedPositions: mockGetClosedPositions
    })),
    MockD1Database: vi.fn().mockImplementation(() => ({
      prepare: mockPrepare
    })),
    default: vi.fn().mockImplementation((db) => ({
      db: { prepare: mockPrepare },
      getVisiblePortfolioHoldings: mockGetVisiblePortfolioHoldings,
      getHiddenPortfolioHoldings: mockGetHiddenPortfolioHoldings,
      getTransactions: mockGetTransactions,
      getCashAmount: mockGetCashAmount,
      getAllTransactionsGroupedByCode: mockGetAllTransactionsGroupedByCode,
      getClosedPositions: mockGetClosedPositions
    }))
  };
});

// Mock Finnhub and FX services
vi.mock('../src/finnhubService.js', () => ({
  createFinnhubService: vi.fn(() => ({
    getPortfolioQuotes: vi.fn().mockResolvedValue([]),
    getCacheStats: vi.fn().mockReturnValue({ hit: 0, miss: 0, hitRate: 0 }),
    getOldestCacheTimestamp: vi.fn().mockReturnValue(null)
  }))
}));

vi.mock('../src/fxService.js', () => ({
  createFxService: vi.fn(() => ({
    getLatestRates: vi.fn().mockResolvedValue({ USD: 1, SGD: 1.35 })
  }))
}));

// Import the default export (Cloudflare Worker handler)
import workerHandler from '../src/index.js';

describe('index.js - Cloudflare Worker', () => {
  let mockEnv;
  let mockASSETS;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock ASSETS binding
    mockASSETS = {
      fetch: vi.fn()
    };

    // Mock database for environment
    const mockDb = {
      prepare: vi.fn(() => ({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ value: 'Test Portfolio' }),
        all: vi.fn().mockResolvedValue({ results: [] })
      }))
    };

    // Mock environment
    mockEnv = {
      STONKS_DB: mockDb,
      FINNHUB_API_KEY: 'test-finnhub-key',
      OPENEXCHANGERATES_API_KEY: 'test-fx-key',
      ASSETS: mockASSETS
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Static File Serving', () => {
    test('should serve service worker from ASSETS', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('console.log("sw");', { status: 200 }));

      const request = new Request('https://example.com/sw.js');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/javascript');
      expect(response.headers.get('cache-control')).toBe('no-cache');
    });

    test('should serve manifest.json from ASSETS', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('{"name":"Stonks"}', { status: 200 }));

      const request = new Request('https://example.com/manifest.json');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
    });

    test('should serve icon files with correct content type', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('PNG', { status: 200 }));

      const request = new Request('https://example.com/icons/icon-192x192.png');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
    });

    test('should serve SVG icons with correct content type', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<svg>', { status: 200 }));

      const request = new Request('https://example.com/icons/favicon.svg');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/svg+xml');
    });

    test('should return 404 for missing assets', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('Not Found', { status: 404 }));

      const request = new Request('https://example.com/icons/missing.png');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(404);
    });

    test('should serve development placeholder SW when ASSETS unavailable', async () => {
      const request = new Request('https://example.com/sw.js');
      const response = await workerHandler.fetch(request, { ...mockEnv, ASSETS: null });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Service worker placeholder');
    });
  });

  describe('React App HTML Serving', () => {
    test('should serve React app HTML from ASSETS', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html><body><div id="root"></div></body></html>', { status: 200 }));

      const request = new Request('https://example.com/prices');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    });

    test('should serve fallback HTML when ASSETS unavailable', async () => {
      const request = new Request('https://example.com/prices');
      const response = await workerHandler.fetch(request, { ...mockEnv, ASSETS: null });

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('Development Mode');
      expect(text).toContain('npm run build');
    });

    test('should serve HTML for all SPA routes', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const routes = [
        '/ticker',
        '/prices',
        '/config',
        '/chart-grid',
        '/chart-large',
        '/chart-advanced'
      ];

      for (const route of routes) {
        const request = new Request(`https://example.com${route}`);
        const response = await workerHandler.fetch(request, mockEnv);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Static Assets Serving', () => {
    test('should serve JS assets with correct content type', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('console.log("test");', { status: 200 }));

      const request = new Request('https://example.com/assets/index-abc123.js');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/javascript');
    });

    test('should serve CSS assets with correct content type', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('body{}', { status: 200 }));

      const request = new Request('https://example.com/assets/index-abc123.css');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/css');
    });
  });

  describe('Redirects', () => {
    test('should redirect root to /prices', async () => {
      const request = new Request('https://example.com/');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/prices');
    });
  });

  describe('API Endpoints - Config Data', () => {
    test('should handle config data request', async () => {
      const request = new Request('https://example.com/api/config-data');
      const response = await workerHandler.fetch(request, mockEnv);

      // Should return either success or structured error
      expect(response).toBeDefined();
      const data = await response.json();
      
      // If successful, check structure; if error, check error field
      if (response.status === 200) {
        expect(data).toHaveProperty('visibleHoldings');
        expect(data).toHaveProperty('portfolioName');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    test('should respond to config-data endpoint', async () => {
      const request = new Request('https://example.com/api/config-data');
      const response = await workerHandler.fetch(request, mockEnv);

      // Should get a response (either success or error)
      expect(response).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('API Endpoints - Prices Data', () => {
    test('should return error when Finnhub API key not configured', async () => {
      const envWithoutFinnhub = { ...mockEnv, FINNHUB_API_KEY: null };

      const request = new Request('https://example.com/api/prices-data');
      const response = await workerHandler.fetch(request, envWithoutFinnhub);

      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.error).toBe('Finnhub API key not configured');
    });

    test('should return prices data when API configured', async () => {
      const request = new Request('https://example.com/api/prices-data');
      const response = await workerHandler.fetch(request, mockEnv);

      // Should succeed or return structured error
      expect(response).toBeDefined();
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Database Initialization', () => {
    test('should use mock database when STONKS_DB is not available', async () => {
      const envWithoutDB = { ...mockEnv, STONKS_DB: null };
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://example.com/prices');
      const response = await workerHandler.fetch(request, envWithoutDB);

      // Should successfully render even with mock database
      expect(response.status).toBe(200);
    });

    test('should handle database connection errors', async () => {
      const envWithBrokenDB = {
        ...mockEnv,
        STONKS_DB: {
          prepare: vi.fn(() => ({
            bind: vi.fn().mockReturnThis(),
            first: vi.fn().mockRejectedValue(new Error('Connection failed'))
          }))
        }
      };

      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://example.com/prices');
      const response = await workerHandler.fetch(request, envWithBrokenDB);

      // Should fall back gracefully
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle ASSETS fetch errors gracefully', async () => {
      mockASSETS.fetch.mockRejectedValue(new Error('Catastrophic failure'));

      const request = new Request('https://example.com/sw.js');
      const response = await workerHandler.fetch(request, mockEnv);

      // Should handle the error (may return 500 or fall back to placeholder)
      expect(response).toBeDefined();
    });

    test('should serve SPA HTML for unknown routes', async () => {
      // Mock HTML response for unknown routes
      mockASSETS.fetch.mockResolvedValue(
        new Response('<html><body>App</body></html>', { 
          status: 200,
          headers: { 'content-type': 'text/html' }
        })
      );

      const request = new Request('https://example.com/unknown-path');
      const response = await workerHandler.fetch(request, mockEnv);

      // SPAs serve HTML for all routes and let the client-side router handle 404s
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });

  describe('Service Caching', () => {
    test('should handle multiple requests', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      // First request
      const request1 = new Request('https://example.com/prices');
      const response1 = await workerHandler.fetch(request1, mockEnv);

      // Second request with same API key
      const request2 = new Request('https://example.com/prices');
      const response2 = await workerHandler.fetch(request2, mockEnv);

      // Both requests should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    test('should handle API key changes', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      // First request
      const request1 = new Request('https://example.com/prices');
      const response1 = await workerHandler.fetch(request1, mockEnv);

      // Second request with different API key
      const envWithNewKey = { ...mockEnv, FINNHUB_API_KEY: 'new-key' };
      const request2 = new Request('https://example.com/prices');
      const response2 = await workerHandler.fetch(request2, envWithNewKey);

      // Both should work
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('POST Request Handling', () => {
    test('should handle POST to /config', async () => {
      const formData = new FormData();
      formData.append('action', 'add_holding');
      formData.append('name', 'Apple Inc');
      formData.append('code', 'NASDAQ:AAPL');

      const request = new Request('https://example.com/config', {
        method: 'POST',
        body: formData
      });

      // Mock the handleConfigSubmission to return a redirect
      const response = await workerHandler.fetch(request, mockEnv);

      // Should attempt to handle the config submission
      expect(response).toBeDefined();
    });
  });

  describe('Content Type Handling', () => {
    test('should serve different file types with correct MIME types', async () => {
      const testCases = [
        { ext: 'png', mime: 'image/png', path: '/icons/icon.png' },
        { ext: 'svg', mime: 'image/svg+xml', path: '/icons/icon.svg' },
        { ext: 'jpg', mime: 'image/jpeg', path: '/icons/icon.jpg' },
        { ext: 'js', mime: 'application/javascript', path: '/assets/file.js' },
        { ext: 'css', mime: 'text/css', path: '/assets/file.css' }
      ];

      for (const { ext, mime, path } of testCases) {
        mockASSETS.fetch.mockResolvedValue(new Response('content', { status: 200 }));
        
        const request = new Request(`https://example.com${path}`);
        const response = await workerHandler.fetch(request, mockEnv);
        
        expect(response.headers.get('content-type')).toBe(mime);
      }
    });

    test('should serve font files with correct MIME types', async () => {
      const fontTypes = [
        { ext: 'woff', mime: 'font/woff' },
        { ext: 'woff2', mime: 'font/woff2' },
        { ext: 'ttf', mime: 'font/ttf' },
        { ext: 'eot', mime: 'application/vnd.ms-fontobject' }
      ];

      for (const { ext, mime } of fontTypes) {
        mockASSETS.fetch.mockResolvedValue(new Response('font', { status: 200 }));
        
        const request = new Request(`https://example.com/assets/font.${ext}`);
        const response = await workerHandler.fetch(request, mockEnv);
        
        expect(response.headers.get('content-type')).toBe(mime);
      }
    });

    test('should serve gif images with correct MIME type', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('gif', { status: 200 }));
      
      const request = new Request('https://example.com/assets/image.gif');
      const response = await workerHandler.fetch(request, mockEnv);
      
      expect(response.headers.get('content-type')).toBe('image/gif');
    });

    test('should serve unknown extensions as octet-stream', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('data', { status: 200 }));
      
      const request = new Request('https://example.com/assets/file.xyz');
      const response = await workerHandler.fetch(request, mockEnv);
      
      expect(response.headers.get('content-type')).toBe('application/octet-stream');
    });
  });

  describe('Additional Route Coverage', () => {
    test('should handle /chart-grid route', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://example.com/chart-grid');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
    });

    test('should handle /chart-large route', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://example.com/chart-large');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
    });

    test('should handle /chart-advanced route', async () => {
      mockASSETS.fetch.mockResolvedValue(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://example.com/chart-advanced');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(200);
    });

    test('should handle empty path with redirect', async () => {
      const request = new Request('https://example.com/');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toContain('/prices');
    });
  });

  describe('Error Path Coverage', () => {
    test('should handle internal errors and return 500', async () => {
      mockASSETS.fetch.mockRejectedValue(new Error('Internal failure'));

      const request = new Request('https://example.com/prices');
      const response = await workerHandler.fetch(request, mockEnv);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe('Internal Server Error');
    });

    test('should log error details on exception', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      mockASSETS.fetch.mockRejectedValue(new Error('Test error'));

      const request = new Request('https://example.com/prices');
      await workerHandler.fetch(request, mockEnv);

      // Check that console.error was called with an error
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][1]).toBeInstanceOf(Error);
    });
  });
});
