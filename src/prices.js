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
    // Get visible portfolio holdings with calculated quantities from transactions
    const holdings = await databaseService.getVisiblePortfolioHoldings();
    
    // Filter out holdings with zero quantity (closed positions handled separately)
    const activeHoldings = holdings.filter(h => h.quantity > 0);

    if (activeHoldings.length === 0) {
      return createLayout('Stock Prices', `
        <div class="container mt-4">
          <h1 class="mb-4">📊 Live Stock Prices</h1>
          <div class="alert alert-info" role="alert">
            <p class="mb-0">No active holdings. <a href="/stonks/config" class="alert-link">Add some holdings and transactions</a> to see live prices.</p>
          </div>
        </div>
      `);
    }

    // Fetch quotes for all active holdings
    const holdingsWithQuotes = await finnhubService.getPortfolioQuotes(activeHoldings);

    // Get cache timestamp for "last updated" display
    const oldestCacheTime = finnhubService.getOldestCacheTimestamp();
    const lastUpdateTime = oldestCacheTime ? new Date(oldestCacheTime) : new Date();
    const cacheStats = finnhubService.getCacheStats();
    const isCached = cacheStats.size > 0;

    // Calculate actual cost basis and gains for each holding from transactions
    let totalMarketValue = 0;
    let totalCostBasis = 0;
    
    for (const holding of holdingsWithQuotes) {
      if (!holding.error && holding.quote) {
        const transactions = await databaseService.getTransactionsByCode(holding.code);
        let costBasis = 0;
        
        for (const txn of transactions) {
          if (txn.type === 'buy') {
            costBasis += parseFloat(txn.value) + parseFloat(txn.fee);
          } else if (txn.type === 'sell') {
            // For partial sells, reduce cost basis proportionally
            const sellRevenue = parseFloat(txn.value) - parseFloat(txn.fee);
            // Note: We don't reduce costBasis here because we want total invested
          }
        }
        
        holding.costBasis = costBasis;
        holding.marketValue = holding.quote.current * holding.quantity;
        holding.gain = holding.marketValue - costBasis;
        holding.gainPercent = costBasis > 0 ? (holding.gain / costBasis) * 100 : 0;
        
        totalMarketValue += holding.marketValue;
        totalCostBasis += costBasis;
      }
    }
    
    // Get closed positions to include their realized gains
    const closedPositions = await databaseService.getClosedPositions();
    const closedPositionsGain = closedPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);
    
    // Calculate total gain including closed positions
    const openPositionsGain = totalMarketValue - totalCostBasis;
    const totalGain = openPositionsGain + closedPositionsGain;
    const totalGainPercent = (totalCostBasis + Math.abs(closedPositionsGain)) > 0 
      ? (totalGain / (totalCostBasis + Math.abs(closedPositionsGain))) * 100 
      : 0;

    // Get cash amount
    const cashAmount = await databaseService.getCashAmount();
    const portfolioTotal = totalMarketValue + cashAmount;

    // Calculate weight deviations
    let totalWeightDeviation = 0;
    
    // Calculate total change value and percentage for metrics
    let totalChangeValue = 0;
    let totalChangePercent = 0;
    
    // Generate holdings table rows
    const holdingsRows = holdingsWithQuotes.map(holding => {
      if (holding.error) {
        return `
          <tr>
            <td>${holding.name}</td>
            <td><code>${holding.code}</code></td>
            <td class="text-end">${holding.quantity}</td>
            <td colspan="10" class="text-danger">
              <small>Error: ${holding.error}</small>
            </td>
          </tr>
        `;
      }

      const quote = holding.quote;
      const changeClass = quote.change >= 0 ? 'text-success' : 'text-danger';
      const changeIcon = quote.change >= 0 ? '▲' : '▼';
      const gainClass = holding.gain >= 0 ? 'text-success' : 'text-danger';
      const weight = portfolioTotal > 0 ? (holding.marketValue / portfolioTotal) * 100 : 0;
      
      // Calculate change in value: day change * quantity
      const changeValue = quote.change * holding.quantity;
      totalChangeValue += changeValue;
      
      // Calculate weight difference if target is set
      const targetWeight = holding.target_weight;
      const weightDiff = targetWeight != null ? weight - targetWeight : null;
      const weightDiffClass = weightDiff != null ? (weightDiff >= 0 ? 'text-success' : 'text-danger') : '';
      const weightDiffIcon = weightDiff != null ? (weightDiff >= 0 ? '▲' : '▼') : '';
      
      // Add to total deviation if target is set
      if (weightDiff != null) {
        totalWeightDeviation += Math.abs(weightDiff);
      }

      // Extract stock code (part after ':')
      const stockCode = holding.code.includes(':') ? holding.code.split(':')[1] : holding.code;
      
      return `
        <tr>
          <td><strong>${holding.name}</strong></td>
          <td><code>${stockCode}</code></td>
          <td class="text-end">${holding.quantity}</td>
          <td class="text-end">$${quote.current.toFixed(2)}</td>
          <td class="text-end ${changeClass}">
            ${changeIcon} $${Math.abs(quote.change).toFixed(2)} (${quote.changePercent.toFixed(2)}%)
          </td>
          <td class="text-end ${changeClass}">
            ${changeIcon} $${Math.abs(changeValue).toFixed(2)}
          </td>
          <td class="text-end">$${holding.marketValue.toFixed(2)}</td>
          <td class="text-end">${weight.toFixed(2)}%</td>
          <td class="text-end">${targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}</td>
          <td class="text-end ${weightDiffClass}">
            ${weightDiff != null ? weightDiffIcon + ' ' + Math.abs(weightDiff).toFixed(2) + '%' : '-'}
          </td>
          <td class="text-end ${gainClass}">
            $${holding.gain.toFixed(2)} (${holding.gainPercent.toFixed(2)}%)
          </td>
        </tr>
      `;
    }).join('');
    
    // Calculate total change percentage
    const previousValue = totalMarketValue - totalChangeValue;
    totalChangePercent = previousValue > 0 ? (totalChangeValue / previousValue) * 100 : 0;
    
    // Add cash row
    const cashWeight = portfolioTotal > 0 ? (cashAmount / portfolioTotal) * 100 : 0;
    const cashRow = `
      <tr class="table-secondary">
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">$${cashAmount.toFixed(2)}</td>
        <td class="text-end">${cashWeight.toFixed(2)}%</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
      </tr>
    `;

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
          <div class="col-md-2">
            <div class="card bg-primary text-white">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Portfolio Value</h6>
                <h3 class="card-title mb-0">$${portfolioTotal.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="card">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2 text-muted">Market Value</h6>
                <h3 class="card-title mb-0">$${totalMarketValue.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="card">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2 text-muted">Cash</h6>
                <h3 class="card-title mb-0">$${cashAmount.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="card ${totalChangeValue >= 0 ? 'bg-success' : 'bg-danger'} text-white">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Day Change</h6>
                <h3 class="card-title mb-0">$${totalChangeValue.toFixed(2)}</h3>
                <small>${totalChangePercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="card ${totalGain >= 0 ? 'bg-success' : 'bg-danger'} text-white">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Total Gain/Loss</h6>
                <h3 class="card-title mb-0">$${totalGain.toFixed(2)}</h3>
                <small>${totalGainPercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
          <div class="col-md-2">
            <div class="card ${totalWeightDeviation > 10 ? 'bg-warning' : 'bg-info'} text-white">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Weight Dev.</h6>
                <h3 class="card-title mb-0">${totalWeightDeviation.toFixed(2)}%</h3>
                <small>Abs. differences</small>
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
                    <th class="text-end">Price Change</th>
                    <th class="text-end">Change $</th>
                    <th class="text-end">Market Value</th>
                    <th class="text-end">Weight</th>
                    <th class="text-end">Target</th>
                    <th class="text-end">Diff</th>
                    <th class="text-end">Total Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  ${holdingsRows}
                  ${cashRow}
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

        <!-- Closed Positions (Collapsed by default) -->
        ${await generateClosedPositionsSection(databaseService)}
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

/**
 * Generate closed positions section (collapsed by default)
 */
async function generateClosedPositionsSection(databaseService) {
  const closedPositions = await databaseService.getClosedPositions();
  
  if (closedPositions.length === 0) {
    return '';
  }
  
  const closedRows = closedPositions.map(position => {
    const profitClass = position.profitLoss >= 0 ? 'text-success' : 'text-danger';
    const profitIcon = position.profitLoss >= 0 ? '▲' : '▼';
    const stockCode = position.code.includes(':') ? position.code.split(':')[1] : position.code;
    
    return `
      <tr>
        <td><strong>${position.name}</strong></td>
        <td><code>${stockCode}</code></td>
        <td class="text-end">$${position.totalCost.toFixed(2)}</td>
        <td class="text-end">$${position.totalRevenue.toFixed(2)}</td>
        <td class="text-end ${profitClass}">
          ${profitIcon} $${Math.abs(position.profitLoss).toFixed(2)}
        </td>
        <td class="text-end ${profitClass}">
          ${profitIcon} ${Math.abs(position.profitLossPercent).toFixed(2)}%
        </td>
        <td class="text-end"><small class="text-muted">${position.transactions} txns</small></td>
      </tr>
    `;
  }).join('');
  
  // Calculate totals for closed positions
  const totalClosedCost = closedPositions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalClosedRevenue = closedPositions.reduce((sum, pos) => sum + pos.totalRevenue, 0);
  const totalClosedProfit = totalClosedRevenue - totalClosedCost;
  const totalClosedPercent = totalClosedCost > 0 ? (totalClosedProfit / totalClosedCost) * 100 : 0;
  const totalProfitClass = totalClosedProfit >= 0 ? 'text-success' : 'text-danger';
  const totalProfitIcon = totalClosedProfit >= 0 ? '▲' : '▼';
  
  const totalRow = `
    <tr class="table-secondary fw-bold">
      <td colspan="2"><strong>Total Realized Gains</strong></td>
      <td class="text-end">$${totalClosedCost.toFixed(2)}</td>
      <td class="text-end">$${totalClosedRevenue.toFixed(2)}</td>
      <td class="text-end ${totalProfitClass}">
        ${totalProfitIcon} $${Math.abs(totalClosedProfit).toFixed(2)}
      </td>
      <td class="text-end ${totalProfitClass}">
        ${totalProfitIcon} ${Math.abs(totalClosedPercent).toFixed(2)}%
      </td>
      <td class="text-end">-</td>
    </tr>
  `;
  
  return `
    <!-- Closed Positions (Accordion) -->
    <div class="accordion mt-4" id="closedPositionsAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header" id="closedPositionsHeading">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#closedPositionsCollapse" aria-expanded="false" aria-controls="closedPositionsCollapse">
            <strong>📈 Closed Positions (${closedPositions.length})</strong>
          </button>
        </h2>
        <div id="closedPositionsCollapse" class="accordion-collapse collapse" aria-labelledby="closedPositionsHeading" data-bs-parent="#closedPositionsAccordion">
          <div class="accordion-body p-0">
            <div class="table-responsive">
              <table class="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th class="text-end">Total Cost</th>
                    <th class="text-end">Total Revenue</th>
                    <th class="text-end">Profit/Loss $</th>
                    <th class="text-end">Profit/Loss %</th>
                    <th class="text-end">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  ${closedRows}
                  ${totalRow}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
