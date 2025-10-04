import { generateTickerPage } from './ticker.js';
import { generateChartGridPage } from './chartGrid.js';
import { generateLargeChartPage } from './chartLarge.js';
import { DatabaseService, MockD1Database } from './databaseService.js';

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
  // Route to appropriate page based on URL path
  try {
    switch (pathname) {
      case '/stonks/ticker':
        return await generateTickerPage(databaseService);
      
      case '/stonks/charts':
        return await generateChartGridPage(databaseService);
      
      case '/stonks/charts/large':
        return await generateLargeChartPage(databaseService);
      
      default:
        return new Response('404 Not Found - Available routes: /stonks/ticker, /stonks/charts, /stonks/charts/large', {
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