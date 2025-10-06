import { createLayout } from './utils.js';

/**
 * Generate the stock prices page with live quotes
 */
export async function generatePricesPage(databaseService, finnhubService) {
  if (!finnhubService) {
    return createLayout('Stock Prices', `
      <div class="container mt-4">
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">⚠️ Finnhub API Key Required</h4>
          <p>Stock price data is not available because the Finnhub API key is not configured.</p>
          <hr>
          <p class="mb-0">
            To enable live stock prices:
            <ol>
              <li>Get a free API key from <a href="https://finnhub.io/" target="_blank" class="alert-link">Finnhub.io</a></li>
              <li>Create a <code>.env</code> file in the project root</li>
              <li>Add your API key: <code>FINNHUB_API_KEY=your_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
          </p>
        </div>
        <a href="/stonks/config" class="btn btn-primary">Go to Configuration</a>
      </div>
    `);
  }

  try {
    // Get portfolio holdings from database
    const portfolioHoldings = await databaseService.db.prepare(
      'SELECT * FROM portfolio_holdings ORDER BY id'
    ).all();
    
    const holdings = portfolioHoldings.results || [];

    if (holdings.length === 0) {
      return createLayout('Stock Prices', `
        <div class="container mt-4">
          <h1 class="mb-4">📊 Live Stock Prices</h1>
          <div class="alert alert-info" role="alert">
            <p class="mb-0">No holdings configured. <a href="/stonks/config" class="alert-link">Add some holdings</a> to see live prices.</p>
          </div>
        </div>
      `);
    }

    // Fetch quotes for all holdings
    const holdingsWithQuotes = await finnhubService.getPortfolioQuotes(holdings);

    // Get cache timestamp for "last updated" display
    const oldestCacheTime = finnhubService.getOldestCacheTimestamp();
    const lastUpdateTime = oldestCacheTime ? new Date(oldestCacheTime) : new Date();
    const cacheStats = finnhubService.getCacheStats();
    const isCached = cacheStats.size > 0;

    // Calculate portfolio totals
    const totalMarketValue = holdingsWithQuotes.reduce((sum, h) => sum + (h.marketValue || 0), 0);
    const totalGain = holdingsWithQuotes.reduce((sum, h) => sum + (h.gain || 0), 0);
    const totalGainPercent = totalMarketValue > 0 ? (totalGain / (totalMarketValue - totalGain)) * 100 : 0;

    // Get cash amount
    const cashAmount = await databaseService.getCashAmount();
    const portfolioTotal = totalMarketValue + cashAmount;

    // Generate holdings table rows
    const holdingsRows = holdingsWithQuotes.map(holding => {
      if (holding.error) {
        return `
          <tr>
            <td>${holding.name}</td>
            <td><code>${holding.code}</code></td>
            <td class="text-end">${holding.quantity}</td>
            <td colspan="5" class="text-danger">
              <small>Error: ${holding.error}</small>
            </td>
          </tr>
        `;
      }

      const quote = holding.quote;
      const changeClass = quote.change >= 0 ? 'text-success' : 'text-danger';
      const changeIcon = quote.change >= 0 ? '▲' : '▼';
      const gainClass = holding.gain >= 0 ? 'text-success' : 'text-danger';

      return `
        <tr>
          <td><strong>${holding.name}</strong></td>
          <td><code>${holding.code}</code></td>
          <td class="text-end">${holding.quantity}</td>
          <td class="text-end">$${quote.current.toFixed(2)}</td>
          <td class="text-end ${changeClass}">
            ${changeIcon} $${Math.abs(quote.change).toFixed(2)} (${quote.changePercent.toFixed(2)}%)
          </td>
          <td class="text-end">$${holding.marketValue.toFixed(2)}</td>
          <td class="text-end ${gainClass}">
            $${holding.gain.toFixed(2)} (${holding.gainPercent.toFixed(2)}%)
          </td>
        </tr>
      `;
    }).join('');

    const content = `
      <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>📊 Live Stock Prices</h1>
          <div>
            <button class="btn btn-primary me-2" onclick="location.reload()">🔄 Refresh</button>
            <a href="/stonks/config" class="btn btn-outline-secondary">⚙️ Settings</a>
          </div>
        </div>

        <!-- Portfolio Summary -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card bg-primary text-white">
              <div class="card-body">
                <h6 class="card-subtitle mb-2">Portfolio Value</h6>
                <h3 class="card-title mb-0">$${portfolioTotal.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Market Value</h6>
                <h3 class="card-title mb-0">$${totalMarketValue.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card">
              <div class="card-body">
                <h6 class="card-subtitle mb-2 text-muted">Cash</h6>
                <h3 class="card-title mb-0">$${cashAmount.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card ${totalGain >= 0 ? 'bg-success' : 'bg-danger'} text-white">
              <div class="card-body">
                <h6 class="card-subtitle mb-2">Total Gain/Loss</h6>
                <h3 class="card-title mb-0">$${totalGain.toFixed(2)}</h3>
                <small>${totalGainPercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Holdings Table -->
        <div class="card">
          <div class="card-header">
            <h3 class="mb-0">Portfolio Holdings</h3>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th class="text-end">Quantity</th>
                    <th class="text-end">Current Price</th>
                    <th class="text-end">Day Change</th>
                    <th class="text-end">Market Value</th>
                    <th class="text-end">Total Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  ${holdingsRows}
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-muted d-flex justify-content-between align-items-center">
            <small>
              Last updated: ${lastUpdateTime.toLocaleString()}
              ${isCached ? '<span class="badge bg-success ms-2">Cached</span>' : ''}
            </small>
            <small class="text-muted">
              ${cacheStats.size} symbol${cacheStats.size !== 1 ? 's' : ''} in cache
            </small>
          </div>
        </div>
      </div>

      <style>
        .card {
          border-radius: 0.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table th {
          border-top: none;
          font-weight: 600;
        }
        .text-success {
          color: #28a745 !important;
        }
        .text-danger {
          color: #dc3545 !important;
        }
      </style>
    `;

    return createLayout('Live Stock Prices', content);
  } catch (error) {
    console.error('Error generating prices page:', error);
    return createLayout('Stock Prices - Error', `
      <div class="container mt-4">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Error Loading Prices</h4>
          <p>${error.message}</p>
        </div>
        <a href="/stonks/config" class="btn btn-primary">Go to Configuration</a>
      </div>
    `);
  }
}
