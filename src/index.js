import { generateTickerPage } from './ticker.js';
import { generateChartGridPage } from './chartGrid.js';
import { generateLargeChartPage } from './chartLarge.js';
import { generateAdvancedChartPage } from './chartAdvanced.js';
import { generateConfigPage, handleConfigSubmission } from './config.js';
import { generateConfigPageClient } from './configClientWrapper.js';
import { generatePricesPage } from './prices.js';
import { generatePricesPageClient } from './pricesClientWrapper.js';
import { DatabaseService, MockD1Database } from './databaseService.js';
import { createFinnhubService } from './finnhubService.js';
import { createFxService } from './fxService.js';

// Module-level cache for services to persist across requests
// This allows the in-memory cache to work properly in Cloudflare Workers
let cachedFinnhubService = null;
let cachedFinnhubApiKey = null;
let cachedFxService = null;
let cachedFxApiKey = null;

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
  
  // Initialize Finnhub service if API key is available (reuse cached instance)
  if (env.FINNHUB_API_KEY) {
    if (!cachedFinnhubService || cachedFinnhubApiKey !== env.FINNHUB_API_KEY) {
      cachedFinnhubService = createFinnhubService(env.FINNHUB_API_KEY);
      cachedFinnhubApiKey = env.FINNHUB_API_KEY;
    }
  } else {
    cachedFinnhubService = null;
    cachedFinnhubApiKey = null;
  }
  const finnhubService = cachedFinnhubService;
  
  // Initialize FX service if API key is available (reuse cached instance)
  if (env.OPENEXCHANGERATES_API_KEY) {
    if (!cachedFxService || cachedFxApiKey !== env.OPENEXCHANGERATES_API_KEY) {
      cachedFxService = createFxService(env.OPENEXCHANGERATES_API_KEY);
      cachedFxApiKey = env.OPENEXCHANGERATES_API_KEY;
    }
  } else {
    cachedFxService = null;
    cachedFxApiKey = null;
  }
  const fxService = cachedFxService;
  
  // Route to appropriate page based on URL path
  try {
    // Handle static assets (icons, images, etc.)
    if (pathname.startsWith('/stonks/icons/')) {
      const filename = pathname.replace('/stonks/', '');
      const extension = filename.split('.').pop().toLowerCase();
      const contentTypes = {
        'png': 'image/png',
        'svg': 'image/svg+xml',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'ico': 'image/x-icon'
      };
      const contentType = contentTypes[extension] || 'application/octet-stream';
      return await serveStaticFile(env, filename, contentType);
    }
    
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
      
      // API Endpoints for client-side data fetching
      case '/stonks/api/config-data':
        try {
          // OPTIMIZATION: Parallelize all independent data fetching operations
          const [visibleHoldings, hiddenHoldings, transactions, cashAmount, portfolioNameResult] = await Promise.all([
            databaseService.getVisiblePortfolioHoldings(),
            databaseService.getHiddenPortfolioHoldings(),
            databaseService.getTransactions(),
            databaseService.getCashAmount(),
            databaseService.db.prepare('SELECT value FROM portfolio_settings WHERE key = ?').bind('portfolio_name').first()
          ]);
          
          const portfolioName = portfolioNameResult ? portfolioNameResult.value : 'My Portfolio';
          
          // Calculate total target weight
          const totalTargetWeight = visibleHoldings.reduce((sum, holding) => {
            return sum + (holding.target_weight != null ? holding.target_weight : 0);
          }, 0);
          
          // OPTIMIZATION: Strip unnecessary fields to reduce payload size
          const optimizeHolding = (holding) => ({
            id: holding.id,
            name: holding.name,
            code: holding.code,
            quantity: holding.quantity,
            target_weight: holding.target_weight
            // Removed: hidden (always 0 or 1 based on which list), created_at, updated_at
          });
          
          const optimizeTransaction = (txn) => ({
            id: txn.id,
            code: txn.code,
            type: txn.type,
            date: txn.date,
            quantity: txn.quantity,
            value: txn.value,
            fee: txn.fee
            // Removed: created_at (not displayed)
          });
          
          return new Response(JSON.stringify({
            visibleHoldings: visibleHoldings.map(optimizeHolding),
            hiddenHoldings: hiddenHoldings.map(optimizeHolding),
            transactions: transactions.map(optimizeTransaction),
            cashAmount,
            portfolioName,
            totalTargetWeight
          }), {
            headers: { 
              'content-type': 'application/json',
              'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0',
              'pragma': 'no-cache',
              'expires': '0'
            }
          });
        } catch (error) {
          console.error('Error in /api/config-data:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
              'content-type': 'application/json',
              'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0',
              'pragma': 'no-cache',
              'expires': '0'
            }
          });
        }
      
      case '/stonks/api/prices-data':
        try {
          if (!finnhubService) {
            return new Response(JSON.stringify({ error: 'Finnhub API key not configured' }), {
              status: 503,
              headers: { 
                'content-type': 'application/json',
                'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0',
                'pragma': 'no-cache',
                'expires': '0'
              }
            });
          }
          
          const rebalanceMode = url.searchParams.get('mode') === 'rebalance';
          const currency = url.searchParams.get('currency') || 'USD';
          
          // OPTIMIZATION: Parallelize all independent data fetching operations
          const dataPromises = [
            databaseService.getVisiblePortfolioHoldings(),
            databaseService.getAllTransactionsGroupedByCode(),
            databaseService.getCashAmount(),
          ];
          
          // Only fetch FX rates if needed
          if (fxService && currency !== 'USD') {
            dataPromises.push(fxService.getLatestRates(['SGD', 'AUD']));
          }
          
          // Only fetch closed positions in normal mode (not used in rebalance mode)
          if (!rebalanceMode) {
            dataPromises.push(databaseService.getClosedPositions());
          }
          
          // Execute all promises in parallel
          const results = await Promise.all(dataPromises);
          
          // Extract results
          const holdings = results[0];
          const allTransactions = results[1];
          const cashAmount = results[2];
          let fxRates = {};
          let closedPositions = [];
          
          // Parse optional results based on what was fetched
          let resultIndex = 3;
          if (fxService && currency !== 'USD') {
            fxRates = results[resultIndex++];
          }
          if (!rebalanceMode) {
            closedPositions = results[resultIndex++];
          }
          
          // Filter active holdings
          const activeHoldings = rebalanceMode 
            ? holdings.filter(h => h.quantity > 0 || h.target_weight != null)
            : holdings.filter(h => h.quantity > 0);
          
          // Fetch quotes (this is the slowest operation, unavoidable)
          const holdingsWithQuotes = await finnhubService.getPortfolioQuotes(activeHoldings);
          
          // Calculate cost basis and gains - optimized loop
          // Also strip unnecessary fields to reduce payload size
          const optimizedHoldings = holdingsWithQuotes.map(holding => {
            if (!holding.error && holding.quote) {
              const transactions = allTransactions[holding.code] || [];
              
              // Calculate cost basis in a single pass
              const costBasis = transactions.reduce((sum, txn) => {
                return txn.type === 'buy' ? sum + parseFloat(txn.value) + parseFloat(txn.fee) : sum;
              }, 0);
              
              const marketValue = holding.quote.current * holding.quantity;
              const gain = marketValue - costBasis;
              const gainPercent = costBasis > 0 ? (gain / costBasis) * 100 : 0;
              
              // Return only necessary fields, including minimized quote object
              return {
                name: holding.name,
                code: holding.code,
                quantity: holding.quantity,
                target_weight: holding.target_weight,
                quote: {
                  current: holding.quote.current,
                  change: holding.quote.change,
                  changePercent: holding.quote.changePercent
                },
                costBasis,
                marketValue,
                gain,
                gainPercent
              };
            } else {
              // For error cases, only include minimal fields
              return {
                name: holding.name,
                code: holding.code,
                quantity: holding.quantity,
                error: holding.error
              };
            }
          });
          
          // Get cache stats (synchronous, no await needed)
          const cacheStats = finnhubService.getCacheStats();
          const oldestCacheTime = finnhubService.getOldestCacheTimestamp();
          
          return new Response(JSON.stringify({
            holdings: optimizedHoldings,
            cashAmount,
            closedPositions,
            fxRates,
            fxAvailable: !!fxService,
            cacheStats: {
              size: cacheStats.size,
              oldestTimestamp: oldestCacheTime
            },
            rebalanceMode,
            currency
          }), {
            headers: { 
              'content-type': 'application/json',
              'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0',
              'pragma': 'no-cache',
              'expires': '0'
            }
          });
        } catch (error) {
          console.error('Error in /api/prices-data:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 
              'content-type': 'application/json',
              'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate, s-maxage=0',
              'pragma': 'no-cache',
              'expires': '0'
            }
          });
        }
      
      // Serve client-side JavaScript files
      case '/stonks/client/prices.js':
      case '/stonks/client/config.js':
        const clientFile = pathname.replace('/stonks/', '');
        if (env.ASSETS) {
          try {
            const response = await env.ASSETS.fetch(new Request(`https://placeholder/${clientFile}`));
            if (response.status === 200) {
              return new Response(response.body, {
                headers: {
                  'content-type': 'application/javascript',
                  'cache-control': 'public, max-age=3600',
                },
              });
            }
          } catch (error) {
            console.error(`Failed to fetch ${clientFile} from ASSETS:`, error);
          }
        }
        return new Response('Client script not found', { status: 404 });
      
      case '/stonks/ticker':
        return await generateTickerPage(databaseService);
      
      case '/stonks/charts':
        return await generateChartGridPage(databaseService);
      
      case '/stonks/charts/large':
        return await generateLargeChartPage(databaseService);
      
      case '/stonks/charts/advanced':
        return await generateAdvancedChartPage(databaseService);
      
      case '/stonks/prices':
        const rebalanceMode = url.searchParams.get('mode') === 'rebalance';
        const currency = url.searchParams.get('currency') || 'USD';
        return generatePricesPageClient(rebalanceMode, currency);
      
      case '/stonks/config':
        if (request.method === 'POST') {
          return await handleConfigSubmission(request, databaseService);
        } else {
          return generateConfigPageClient();
        }
      
      default:
        return new Response('404 Not Found - Available routes: /stonks/ticker, /stonks/charts, /stonks/charts/large, /stonks/charts/advanced, /stonks/prices, /stonks/config', {
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