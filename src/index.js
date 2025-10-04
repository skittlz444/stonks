import { generateTickerPage } from './ticker.js';
import { generateChartGridPage } from './chartGrid.js';
import { generateLargeChartPage } from './chartLarge.js';
import { MockKV } from './mockKV.js';

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
  
  // Use MockKV for development if STONKS KV is not available
  let stonksKV;
  
  try {
    // Test if the real KV works by trying to get a key
    if (env.STONKS) {
      const testValue = await env.STONKS.get("currentHoldings");
      if (testValue === null) {
        stonksKV = new MockKV();
      } else {
        stonksKV = env.STONKS;
      }
    } else {
      stonksKV = new MockKV();
    }
  } catch (error) {
    stonksKV = new MockKV();
  }
  // Route to appropriate page based on URL path
  try {
    switch (pathname) {
      case '/stonks/ticker':
        return await generateTickerPage(stonksKV);
      
      case '/stonks/charts':
        return await generateChartGridPage(stonksKV);
      
      case '/stonks/charts/large':
        return await generateLargeChartPage(stonksKV);
      
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
  event.respondWith(handleRequest(event.request, { STONKS: typeof STONKS !== 'undefined' ? STONKS : null }));
});