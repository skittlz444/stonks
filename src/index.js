import { generateTickerPage } from './ticker.js';
import { generateChartGridPage } from './chartGrid.js';
import { generateLargeChartPage } from './chartLarge.js';
import { generateConfigPage, handleConfigSubmission } from './config.js';
import { generatePricesPage } from './prices.js';
import { DatabaseService, MockD1Database } from './databaseService.js';
import { createFinnhubService } from './finnhubService.js';

/**
 * Serve static files from ASSETS binding
 */
async function serveStaticFile(env, filename, contentType) {
  try {
    // Always try to serve from ASSETS first (production and local)
    if (env.ASSETS) {
      try {
        const response = await env.ASSETS.fetch(new Request(`https://placeholder/${filename}`));
        if (response.status === 200) {
          return new Response(response.body, {
            headers: {
              'content-type': contentType,
              'cache-control': filename === 'sw.js' ? 'no-cache' : 'public, max-age=3600',
            },
          });
        }
      } catch (error) {
        console.error(`Failed to fetch ${filename} from ASSETS:`, error);
      }
    }
    
    // Development fallback ONLY for service worker (manifest.json should always come from file)
    if (filename === 'sw.js') {
      console.warn('Service worker not found in ASSETS, using development placeholder');
      return new Response(
        'console.log("Service worker placeholder - run npm run build to generate versioned cache");',
        {
          headers: {
            'content-type': contentType,
            'cache-control': 'no-cache',
          },
        }
      );
    }
    
    // For all other files (including manifest.json), return 404 if not found
    console.error(`File not found in ASSETS: ${filename}`);
    return new Response(`File not found: ${filename}. Make sure wrangler.toml [assets] configuration is correct.`, { 
      status: 404,
      headers: { 'content-type': 'text/plain' }
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Main Cloudflare Worker that handles routing for all three stock portfolio pages
 */
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Use MockD1Database for development if STONKS_DB is not available
  let databaseService;
  
  try {
    if (env.STONKS_DB) {
      databaseService = new DatabaseService(env.STONKS_DB);
      // Test database connection
      await databaseService.getCurrentHoldings();
    } else {
      console.log('No D1 database found, using mock database');
      databaseService = new DatabaseService(new MockD1Database());
    }
  } catch (error) {
    console.log('Database error, falling back to mock database:', error);
    databaseService = new DatabaseService(new MockD1Database());
  }
  
  // Initialize Finnhub service if API key is available
  const finnhubService = createFinnhubService(env.FINNHUB_API_KEY);
  
  // Route to appropriate page based on URL path
  try {
    switch (pathname) {
      case '/stonks/':
      case '/stonks':
        // Redirect to prices page as default
        return Response.redirect(url.origin + '/stonks/prices', 302);
      
      case '/stonks/sw.js':
        // Serve service worker
        return await serveStaticFile(env, 'sw.js', 'application/javascript');
      
      case '/stonks/manifest.json':
        // Serve PWA manifest
        return await serveStaticFile(env, 'manifest.json', 'application/json');
      
      case '/stonks/ticker':
        return await generateTickerPage(databaseService);
      
      case '/stonks/charts':
        return await generateChartGridPage(databaseService);
      
      case '/stonks/charts/large':
        return await generateLargeChartPage(databaseService);
      
      case '/stonks/prices':
        const rebalanceMode = url.searchParams.get('mode') === 'rebalance';
        return await generatePricesPage(databaseService, finnhubService, rebalanceMode);
      
      case '/stonks/config':
        if (request.method === 'POST') {
          return await handleConfigSubmission(request, databaseService);
        } else {
          return await generateConfigPage(databaseService);
        }
      
      default:
        return new Response('404 Not Found - Available routes: /stonks/ticker, /stonks/charts, /stonks/charts/large, /stonks/prices, /stonks/config', {
          status: 404,
          headers: {
            'content-type': 'text/plain',
          },
        });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'content-type': 'text/plain',
      },
    });
  }
}

// For backwards compatibility with addEventListener style
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, { STONKS_DB: typeof STONKS_DB !== 'undefined' ? STONKS_DB : null }));
});