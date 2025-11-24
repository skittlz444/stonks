import { handleConfigSubmission } from './api.js';
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
    // Use the correct content type even for 404 to avoid MIME type errors
    return new Response(`/* File not found: ${filename}. Make sure wrangler.toml [assets] configuration is correct. */`, { 
      status: 404,
      headers: { 'content-type': contentType }
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * Serve the main React application HTML
 */
async function serveAppHTML(env) {
  try {
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request(`https://placeholder/dist/index.html`));
      if (response.status === 200) {
        return new Response(response.body, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache',
          },
        });
      }
    }
    
    // Fallback HTML for development
    console.warn('index.html not found in ASSETS, using development placeholder');
    return new Response(`
<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stonks Portfolio</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  </head>
  <body style="background-color: #212529; color: #ffffff;">
    <div id="root"></div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js"></script>
    <div style="padding: 20px; text-align: center;">
      <h1>Development Mode</h1>
      <p>Run <code>npm run build</code> to build the application.</p>
    </div>
  </body>
</html>
    `, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving HTML:', error);
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
      // Cache quotes for 1 minute (60000ms)
      cachedFinnhubService = createFinnhubService(env.FINNHUB_API_KEY, 60000);
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
    if (pathname.startsWith('/icons/')) {
      const filename = pathname.replace('/', '');
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
      case '/':
      case '':
        // Redirect to prices page as default
        return Response.redirect(url.origin + '/prices', 302);
      
      case '/sw.js':
        // Serve service worker
        return await serveStaticFile(env, 'sw.js', 'application/javascript');
      
      case '/manifest.json':
        // Serve PWA manifest
        return await serveStaticFile(env, 'manifest.json', 'application/json');
      
      // API Endpoints for client-side data fetching
      case '/api/config-data':
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
          
          // Map holdings by code for transaction enrichment
          const allHoldings = [...visibleHoldings, ...hiddenHoldings];
          const holdingsByCode = allHoldings.reduce((map, h) => {
            map[h.code] = h;
            return map;
          }, {});
          
          const optimizeTransaction = (txn) => {
            const holding = holdingsByCode[txn.code];
            return {
              id: txn.id,
              holding_id: holding ? holding.id : null,
              holding_name: holding ? holding.name : txn.code,
              holding_code: txn.code,
              type: txn.type,
              date: txn.date,
              quantity: txn.quantity,
              price: txn.quantity > 0 ? txn.value / txn.quantity : 0,
              notes: txn.notes || null
              // Removed: created_at (not displayed), value, fee (combined into price)
            };
          };
          
          return new Response(JSON.stringify({
            visibleHoldings: visibleHoldings.map(optimizeHolding),
            hiddenHoldings: hiddenHoldings.map(optimizeHolding),
            transactions: transactions.map(optimizeTransaction),
            cashAmount,
            portfolioName,
            totalTargetWeight
          }), {
            headers: { 
              'content-type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Error in /api/config-data:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
          });
        }
      
      case '/api/prices-data':
        try {
          if (!finnhubService) {
            return new Response(JSON.stringify({ error: 'Finnhub API key not configured' }), {
              status: 503,
              headers: { 'content-type': 'application/json' }
            });
          }
          
          const rebalanceMode = url.searchParams.get('mode') === 'rebalance';
          const currency = url.searchParams.get('currency') || 'USD';
          
          // OPTIMIZATION: Parallelize all independent data fetching operations
          const dataPromises = [
            databaseService.getVisiblePortfolioHoldings(),
            databaseService.getAllTransactionsGroupedByCode(),
            databaseService.getCashAmount(),
            databaseService.db.prepare('SELECT value FROM portfolio_settings WHERE key = ?').bind('portfolio_name').first()
          ];
          
          // Always fetch FX rates for SGD/AUD for alt currency display
          if (fxService) {
            dataPromises.push(fxService.getLatestRates(['SGD', 'AUD']));
          }
          
          // Always fetch closed positions (needed for total gain/loss calculation)
          if (!rebalanceMode) {
            dataPromises.push(databaseService.getClosedPositions());
          }
          
          // Execute all promises in parallel
          const results = await Promise.all(dataPromises);
          
          // Extract results
          const holdings = results[0];
          const allTransactions = results[1];
          const cashAmount = results[2];
          const portfolioNameResult = results[3];
          const portfolioName = portfolioNameResult ? portfolioNameResult.value : 'My Portfolio';
          let fxRates = {};
          let closedPositions = [];
          
          // Parse optional results based on what was fetched
          let resultIndex = 4;
          if (fxService) {
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
                id: holding.id,
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
                id: holding.id,
                name: holding.name,
                code: holding.code,
                quantity: holding.quantity,
                error: holding.error
              };
            }
          });
          
          // Calculate portfolio totals
          const totalMarketValue = optimizedHoldings.reduce((sum, h) => {
            return h.marketValue ? sum + h.marketValue : sum;
          }, 0);
          
          const totalCostBasis = optimizedHoldings.reduce((sum, h) => {
            return h.costBasis ? sum + h.costBasis : sum;
          }, 0);
          
          const portfolioTotal = totalMarketValue + cashAmount;
          
          // Calculate total gain/loss including closed positions
          const closedPositionsGain = closedPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);
          const openPositionsGain = totalMarketValue - totalCostBasis;
          const totalGainLoss = openPositionsGain + closedPositionsGain;
          const totalGainLossPercent = (totalCostBasis + Math.abs(closedPositionsGain)) > 0 
            ? (totalGainLoss / (totalCostBasis + Math.abs(closedPositionsGain))) * 100 
            : 0;
          
          // Calculate FX rate for currency conversion
          const fxRate = (currency !== 'USD' && fxRates && fxRates[currency]) ? fxRates[currency] : 1;
          
          // Always include SGD rate for alt currency display when viewing USD
          const sgdRate = (fxRates && fxRates['SGD']) ? fxRates['SGD'] : null;
          
          // Get cache stats (synchronous, no await needed)
          const cacheStats = finnhubService.getCacheStats();
          const oldestCacheTime = finnhubService.getOldestCacheTimestamp();
          
          return new Response(JSON.stringify({
            holdings: optimizedHoldings,
            closedPositions,
            cashAmount,
            portfolioTotal,
            totalGainLoss,
            totalGainLossPercent,
            currency,
            portfolioName,
            fxAvailable: !!fxService,
            fxRate,
            sgdRate,
            cacheStats: {
              size: cacheStats.size,
              oldestTimestamp: oldestCacheTime
            }
          }), {
            headers: { 
              'content-type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Error in /api/prices-data:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
          });
        }
      
      // Handle POST to config (form submission)
      case '/config':
        if (request.method === 'POST') {
          return await handleConfigSubmission(request, databaseService);
        }
        // GET requests fall through to serve the SPA
        break;
      
      default:
        // Check for static assets (Vite builds to /dist/assets/ but serves from /assets/)
        if (pathname.startsWith('/assets/')) {
          // Map /assets/ to dist/assets/ in the ASSETS binding
          const assetFile = pathname.replace('/assets/', 'dist/assets/');
          const extension = assetFile.split('.').pop().toLowerCase();
          const contentTypes = {
            'js': 'application/javascript',
            'css': 'text/css',
            'json': 'application/json',
            'svg': 'image/svg+xml',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'eot': 'application/vnd.ms-fontobject'
          };
          const contentType = contentTypes[extension] || 'application/octet-stream';
          return await serveStaticFile(env, assetFile, contentType);
        }
        break;
    }
    
    // For all other routes (SPA routes), serve the main HTML
    // This includes: /, /ticker, /prices, /config, /chart-grid, etc.
    return await serveAppHTML(env);
    
    return new Response('404 Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain',
      },
    });
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