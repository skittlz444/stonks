import { createLayout } from './utils.js';

/**
 * Calculate rebalancing recommendations for holdings
 * @param {Array} holdings - Array of holdings with current quantities and target weights
 * @param {Number} cashAmount - Available cash
 * @param {Number} portfolioTotal - Total portfolio value (market value + cash)
 * @returns {Object} - Rebalancing recommendations with new quantities, cash usage, etc.
 */
function calculateRebalancing(holdings, cashAmount, portfolioTotal) {
  const recommendations = [];
  let remainingCash = cashAmount;
  
  // Calculate current state for each holding
  for (const holding of holdings) {
    if (!holding.quote || holding.error) {
      continue;
    }
    
    const currentPrice = holding.quote.current;
    const currentQuantity = holding.quantity;
    const currentValue = currentPrice * currentQuantity;
    const currentWeight = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
    const targetWeight = holding.target_weight || 0;
    
    // Calculate target value and quantity
    const targetValue = (targetWeight / 100) * portfolioTotal;
    const targetQuantity = Math.floor(targetValue / currentPrice);
    const actualTargetValue = targetQuantity * currentPrice;
    
    // Calculate changes
    const quantityChange = targetQuantity - currentQuantity;
    const valueChange = actualTargetValue - currentValue;
    const newWeight = portfolioTotal > 0 ? (actualTargetValue / portfolioTotal) * 100 : 0;
    
    recommendations.push({
      ...holding,
      currentQuantity,
      currentValue,
      currentWeight,
      targetWeight,
      targetQuantity,
      targetValue: actualTargetValue,
      quantityChange,
      valueChange,
      newWeight,
      action: quantityChange > 0 ? 'BUY' : (quantityChange < 0 ? 'SELL' : 'HOLD')
    });
    
    // Update remaining cash
    remainingCash -= valueChange;
  }
  
  // If cash would go negative, we need to optimize
  if (remainingCash < 0) {
    // Reduce buy recommendations to keep cash non-negative
    remainingCash = cashAmount;
    const sortedByDeviation = [...recommendations]
      .filter(r => r.quantityChange > 0)
      .sort((a, b) => Math.abs(b.currentWeight - b.targetWeight) - Math.abs(a.currentWeight - a.targetWeight));
    
    for (const rec of recommendations) {
      if (rec.quantityChange > 0) {
        const currentPrice = rec.quote.current;
        // Calculate max quantity we can buy with remaining cash
        const maxBuyQuantity = Math.floor(remainingCash / currentPrice);
        const actualBuyQuantity = Math.min(rec.quantityChange, maxBuyQuantity);
        
        rec.targetQuantity = rec.currentQuantity + actualBuyQuantity;
        rec.quantityChange = actualBuyQuantity;
        rec.targetValue = rec.targetQuantity * currentPrice;
        rec.valueChange = rec.targetValue - rec.currentValue;
        rec.newWeight = portfolioTotal > 0 ? (rec.targetValue / portfolioTotal) * 100 : 0;
        rec.action = actualBuyQuantity > 0 ? 'BUY' : 'HOLD';
        
        remainingCash -= rec.valueChange;
      }
    }
  }
  
  return {
    recommendations,
    newCash: remainingCash,
    cashChange: remainingCash - cashAmount
  };
}

/**
 * Generate the stock prices page with live quotes
 */
export async function generatePricesPage(databaseService, finnhubService, rebalanceMode = false) {
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
    
    // In rebalance mode, include holdings with target weight even if quantity is 0
    // In normal mode, filter out holdings with zero quantity (closed positions handled separately)
    const activeHoldings = rebalanceMode 
      ? holdings.filter(h => h.quantity > 0 || h.target_weight != null)
      : holdings.filter(h => h.quantity > 0);

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
    
    // Calculate rebalancing if in rebalance mode
    let rebalancingData = null;
    if (rebalanceMode) {
      rebalancingData = calculateRebalancing(holdingsWithQuotes, cashAmount, portfolioTotal);
    }
    
    // Generate holdings table rows
    const holdingsRows = holdingsWithQuotes.map((holding, idx) => {
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
      
      // Get rebalancing recommendation if in rebalance mode
      const rebalanceRec = rebalanceMode && rebalancingData ? rebalancingData.recommendations[idx] : null;
      
      // Calculate weight difference if target is set
      const targetWeight = holding.target_weight;
      const weightDiff = targetWeight != null ? weight - targetWeight : null;
      const weightDiffClass = weightDiff != null ? (weightDiff >= 0 ? 'text-success' : 'text-danger') : '';
      
      // Add to total deviation if target is set
      if (weightDiff != null) {
        totalWeightDeviation += Math.abs(weightDiff);
      }

      // Extract stock code (part after ':')
      const stockCode = holding.code.includes(':') ? holding.code.split(':')[1] : holding.code;
      
      // In rebalance mode, show different columns
      if (rebalanceMode && rebalanceRec) {
        const qtyChangeClass = rebalanceRec.quantityChange > 0 ? 'text-success' : (rebalanceRec.quantityChange < 0 ? 'text-danger' : 'text-muted');
        const valueChangeClass = rebalanceRec.valueChange > 0 ? 'text-danger' : (rebalanceRec.valueChange < 0 ? 'text-success' : 'text-muted');
        const actionBadgeClass = rebalanceRec.action === 'BUY' ? 'bg-success' : (rebalanceRec.action === 'SELL' ? 'bg-danger' : 'bg-secondary');
        
        return `
          <tr data-holding="true">
            <td data-value="${holding.name}"><strong>${holding.name}</strong></td>
            <td data-value="${stockCode}"><code>${stockCode}</code></td>
            <td class="text-end" data-value="${quote.current}">$${quote.current.toFixed(2)}</td>
            <td class="text-end" data-value="${holding.quantity}">
              <span class="text-muted" style="text-decoration: line-through;">${holding.quantity.toFixed(2)}</span>
              <strong>${rebalanceRec.targetQuantity.toFixed(2)}</strong>
              <span class="${qtyChangeClass}"> (${rebalanceRec.quantityChange >= 0 ? '+' : ''}${rebalanceRec.quantityChange.toFixed(2)})</span>
            </td>
            <td class="text-end" data-value="${holding.marketValue}">
              <span class="text-muted" style="text-decoration: line-through;">$${holding.marketValue.toFixed(2)}</span>
              <strong>$${rebalanceRec.targetValue.toFixed(2)}</strong>
              <span class="${valueChangeClass}"> (${rebalanceRec.valueChange >= 0 ? '+$' : '-$'}${Math.abs(rebalanceRec.valueChange).toFixed(2)})</span>
            </td>
            <td class="text-end" data-value="${weight}">
              <span class="text-muted" style="text-decoration: line-through;">${weight.toFixed(2)}%</span>
              <strong>${rebalanceRec.newWeight.toFixed(2)}%</strong>
            </td>
            <td class="text-end" data-value="${targetWeight != null ? targetWeight : -999}">${targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}</td>
            <td class="text-end ${weightDiffClass}" data-value="${weightDiff != null ? weightDiff : -999}">
              ${weightDiff != null ? (weightDiff >= 0 ? '+' : '') + weightDiff.toFixed(2) + '%' : '-'}
            </td>
            <td class="text-center" data-value="${rebalanceRec.action}">
              <span class="badge ${actionBadgeClass}">${rebalanceRec.action}</span>
            </td>
          </tr>
        `;
      } else {
        return `
          <tr data-holding="true">
            <td data-value="${holding.name}"><strong>${holding.name}</strong></td>
            <td data-value="${stockCode}"><code>${stockCode}</code></td>
            <td class="text-end" data-value="${quote.current}">$${quote.current.toFixed(2)}</td>
            <td class="text-end ${changeClass}" data-value="${quote.change}">
              ${changeIcon} $${Math.abs(quote.change).toFixed(2)} (${quote.changePercent.toFixed(2)}%)
            </td>
            <td class="text-end" data-value="${holding.quantity}">${holding.quantity.toFixed(2)}</td>
            <td class="text-end" data-value="${holding.costBasis}" style="display: none;">$${holding.costBasis.toFixed(2)}</td>
            <td class="text-end" data-value="${holding.marketValue}">$${holding.marketValue.toFixed(2)}</td>
            <td class="text-end ${changeClass}" data-value="${changeValue}">
              ${changeIcon} $${Math.abs(changeValue).toFixed(2)}
            </td>
            <td class="text-end" data-value="${weight}">${weight.toFixed(2)}%</td>
            <td class="text-end" data-value="${targetWeight != null ? targetWeight : -999}">${targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}</td>
            <td class="text-end ${weightDiffClass}" data-value="${weightDiff != null ? weightDiff : -999}">
              ${weightDiff != null ? (weightDiff >= 0 ? '+' : '') + weightDiff.toFixed(2) + '%' : '-'}
            </td>
            <td class="text-end ${gainClass}" data-value="${holding.gain}">
              $${holding.gain.toFixed(2)} (${holding.gainPercent.toFixed(2)}%)
            </td>
          </tr>
        `;
      }
    }).join('');
    
    // Calculate total change percentage
    const previousValue = totalMarketValue - totalChangeValue;
    totalChangePercent = previousValue > 0 ? (totalChangeValue / previousValue) * 100 : 0;
    
    // Add cash row
    const cashWeight = portfolioTotal > 0 ? (cashAmount / portfolioTotal) * 100 : 0;
    let cashRow = '';
    
    if (rebalanceMode && rebalancingData) {
      const newCash = rebalancingData.newCash;
      const cashChange = rebalancingData.cashChange;
      const cashChangeClass = cashChange > 0 ? 'text-success' : (cashChange < 0 ? 'text-danger' : 'text-muted');
      const newCashWeight = portfolioTotal > 0 ? (newCash / portfolioTotal) * 100 : 0;
      
      cashRow = `
        <tr class="table-secondary">
          <td><strong>Cash</strong></td>
          <td>-</td>
          <td class="text-end">-</td>
          <td class="text-end">
            <span class="text-muted" style="text-decoration: line-through;">-</span>
            <strong>-</strong>
          </td>
          <td class="text-end">
            <span class="text-muted" style="text-decoration: line-through;">$${cashAmount.toFixed(2)}</span>
            <strong>$${newCash.toFixed(2)}</strong>
            <span class="${cashChangeClass}"> (${cashChange >= 0 ? '+$' : '-$'}${Math.abs(cashChange).toFixed(2)})</span>
          </td>
          <td class="text-end">
            <span class="text-muted" style="text-decoration: line-through;">${cashWeight.toFixed(2)}%</span>
            <strong>${newCashWeight.toFixed(2)}%</strong>
          </td>
          <td class="text-end">-</td>
          <td class="text-end">-</td>
          <td class="text-center">-</td>
        </tr>
      `;
    } else {
      cashRow = `
        <tr class="table-secondary">
          <td><strong>Cash</strong></td>
          <td>-</td>
          <td class="text-end">-</td>
          <td class="text-end">-</td>
          <td class="text-end">-</td>
          <td class="text-end" style="display: none;">-</td>
          <td class="text-end">$${cashAmount.toFixed(2)}</td>
          <td class="text-end">-</td>
          <td class="text-end">${cashWeight.toFixed(2)}%</td>
          <td class="text-end">-</td>
          <td class="text-end">-</td>
          <td class="text-end">-</td>
        </tr>
      `;
    }

    const content = `
      <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>📊 ${rebalanceMode ? 'Portfolio Rebalancing' : 'Live Stock Prices'}</h1>
          <div>
            <button class="btn btn-primary me-2" onclick="location.reload()">🔄 Refresh</button>
            ${rebalanceMode 
              ? '<a href="/stonks/prices" class="btn btn-warning me-2">← Back to Prices</a>'
              : '<a href="/stonks/prices?mode=rebalance" class="btn btn-warning me-2">⚖️ Rebalance</a>'
            }
            <a href="/stonks/config" class="btn btn-outline-secondary">⚙️ Settings</a>
          </div>
        </div>

        <!-- Portfolio Summary -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-2">
            <div class="card bg-primary text-white h-100">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Portfolio Value</h6>
                <h3 class="card-title mb-0">$${portfolioTotal.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-2">
            <div class="card h-100">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2 text-muted">Market Value</h6>
                <h3 class="card-title mb-0">$${totalMarketValue.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-2">
            <div class="card h-100">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2 text-muted">Cash</h6>
                <h3 class="card-title mb-0">$${cashAmount.toFixed(2)}</h3>
              </div>
            </div>
          </div>
          ${!rebalanceMode ? `
          <div class="col-6 col-md-2">
            <div class="card ${totalChangeValue >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Day Change</h6>
                <h3 class="card-title mb-0">$${totalChangeValue.toFixed(2)}</h3>
                <small>${totalChangePercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
          <div class="col-6 col-md-2">
            <div class="card ${totalGain >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100">
              <div class="card-body" style="min-height: 100px;">
                <h6 class="card-subtitle mb-2">Total Gain/Loss</h6>
                <h3 class="card-title mb-0">$${totalGain.toFixed(2)}</h3>
                <small>${totalGainPercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>` : ''}
          <div class="col-6 col-md-2">
            <div class="card ${totalWeightDeviation > 10 ? 'bg-warning' : 'bg-info'} text-white h-100">
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
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0">${rebalanceMode ? 'Rebalancing Recommendations' : 'Portfolio Holdings'}</h3>
            ${!rebalanceMode ? `
            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#columnControls">
              ⚙️ Columns
            </button>
            ` : ''}
          </div>
          ${!rebalanceMode ? `<div class="collapse" id="columnControls">` : '<div style="display: none;" id="columnControls">'}
            <div class="card-body border-bottom">
              <div class="row g-2">
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-name" data-column="0" checked>
                    <label class="form-check-label" for="col-name">Name</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-symbol" data-column="1" checked>
                    <label class="form-check-label" for="col-symbol">Symbol</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-price" data-column="2" checked>
                    <label class="form-check-label" for="col-price">Current Price</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-pricechange" data-column="3" checked>
                    <label class="form-check-label" for="col-pricechange">Price Change</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-quantity" data-column="4" checked>
                    <label class="form-check-label" for="col-quantity">Quantity</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-cost" data-column="5">
                    <label class="form-check-label" for="col-cost">Cost</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-marketvalue" data-column="6" checked>
                    <label class="form-check-label" for="col-marketvalue">Market Value</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-mvchange" data-column="7" checked>
                    <label class="form-check-label" for="col-mvchange">MV Change</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-weight" data-column="8" checked>
                    <label class="form-check-label" for="col-weight">Weight</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-target" data-column="9" checked>
                    <label class="form-check-label" for="col-target">Target</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-diff" data-column="10" checked>
                    <label class="form-check-label" for="col-diff">Diff</label>
                  </div>
                </div>
                <div class="col-auto">
                  <div class="form-check form-check-inline">
                    <input class="form-check-input column-toggle" type="checkbox" id="col-gain" data-column="11" checked>
                    <label class="form-check-label" for="col-gain">Total Gain/Loss</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table id="holdingsTable" class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th class="sortable" data-column="0" data-type="text">Name <span class="sort-indicator"></span></th>
                    <th class="sortable" data-column="1" data-type="text">Symbol <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="2" data-type="number">Current Price <span class="sort-indicator"></span></th>
                    ${rebalanceMode ? `
                    <th class="sortable text-end" data-column="3" data-type="number">Quantity <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="4" data-type="number">Market Value <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="5" data-type="number">Weight <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="6" data-type="number">Target <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="7" data-type="number">Diff <span class="sort-indicator"></span></th>
                    <th class="text-center" data-column="8">Action</th>
                    ` : `
                    <th class="sortable text-end" data-column="3" data-type="number">Price Change <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="4" data-type="number">Quantity <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="5" data-type="number" style="display: none;">Cost <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="6" data-type="number">Market Value <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="7" data-type="number">MV Change <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="8" data-type="number">Weight <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="9" data-type="number">Target <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="10" data-type="number">Diff <span class="sort-indicator"></span></th>
                    <th class="sortable text-end" data-column="11" data-type="number">Total Gain/Loss <span class="sort-indicator"></span></th>
                    `}
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
        ${!rebalanceMode ? await generateClosedPositionsSection(databaseService) : ''}
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
        .sortable {
          cursor: pointer;
          user-select: none;
        }
        .sortable:hover {
          background-color: rgba(255,255,255,0.05);
        }
        .sort-indicator {
          opacity: 0.3;
          margin-left: 5px;
        }
        .sort-indicator:after {
          content: '⇅';
        }
        .sort-indicator.asc:after {
          content: '↑';
          opacity: 1;
        }
        .sort-indicator.desc:after {
          content: '↓';
          opacity: 1;
        }
        .sortable.active .sort-indicator {
          opacity: 1;
        }
      </style>

      <script>
        // Column visibility toggle
        document.querySelectorAll('.column-toggle').forEach(toggle => {
          toggle.addEventListener('change', function() {
            const columnIndex = parseInt(this.dataset.column);
            const table = document.getElementById('holdingsTable');
            const isChecked = this.checked;
            
            // Toggle header
            const headers = table.querySelectorAll('thead th');
            if (headers[columnIndex]) {
              headers[columnIndex].style.display = isChecked ? '' : 'none';
            }
            
            // Toggle all cells in that column
            table.querySelectorAll('tbody tr').forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells[columnIndex]) {
                cells[columnIndex].style.display = isChecked ? '' : 'none';
              }
            });
          });
        });

        // Table sorting
        let currentSort = { column: -1, direction: 'asc' };
        
        document.querySelectorAll('.sortable').forEach(header => {
          header.addEventListener('click', function() {
            const columnIndex = parseInt(this.dataset.column);
            const dataType = this.dataset.type;
            const table = document.getElementById('holdingsTable');
            const tbody = table.querySelector('tbody');
            
            // Get all data rows (excluding cash row)
            const rows = Array.from(tbody.querySelectorAll('tr[data-holding="true"]'));
            const cashRow = tbody.querySelector('tr:not([data-holding])');
            
            // Determine sort direction
            if (currentSort.column === columnIndex) {
              currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
              currentSort.column = columnIndex;
              currentSort.direction = 'asc';
            }
            
            // Sort rows
            rows.sort((a, b) => {
              const aCell = a.querySelectorAll('td')[columnIndex];
              const bCell = b.querySelectorAll('td')[columnIndex];
              
              let aValue = aCell.dataset.value;
              let bValue = bCell.dataset.value;
              
              if (dataType === 'number') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
                
                // Handle null values (represented as -999)
                if (aValue === -999) return 1;
                if (bValue === -999) return -1;
              }
              
              let comparison = 0;
              if (aValue < bValue) comparison = -1;
              if (aValue > bValue) comparison = 1;
              
              return currentSort.direction === 'asc' ? comparison : -comparison;
            });
            
            // Clear tbody and re-append sorted rows
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
            if (cashRow) tbody.appendChild(cashRow);
            
            // Update sort indicators
            document.querySelectorAll('.sortable').forEach(h => {
              h.classList.remove('active');
              const indicator = h.querySelector('.sort-indicator');
              indicator.className = 'sort-indicator';
            });
            
            this.classList.add('active');
            const indicator = this.querySelector('.sort-indicator');
            indicator.classList.add(currentSort.direction);
          });
        });

        // Closed positions table sorting
        let currentClosedSort = { column: -1, direction: 'asc' };
        
        document.querySelectorAll('.sortable-closed').forEach(header => {
          header.addEventListener('click', function() {
            const columnIndex = parseInt(this.dataset.column);
            const dataType = this.dataset.type;
            const table = document.getElementById('closedPositionsTable');
            const tbody = table.querySelector('tbody');
            
            // Get all data rows (excluding total row)
            const rows = Array.from(tbody.querySelectorAll('tr[data-closed="true"]'));
            const totalRow = tbody.querySelector('tr:not([data-closed])');
            
            // Determine sort direction
            if (currentClosedSort.column === columnIndex) {
              currentClosedSort.direction = currentClosedSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
              currentClosedSort.column = columnIndex;
              currentClosedSort.direction = 'asc';
            }
            
            // Sort rows
            rows.sort((a, b) => {
              const aCell = a.querySelectorAll('td')[columnIndex];
              const bCell = b.querySelectorAll('td')[columnIndex];
              
              let aValue = aCell.dataset.value;
              let bValue = bCell.dataset.value;
              
              if (dataType === 'number') {
                aValue = parseFloat(aValue);
                bValue = parseFloat(bValue);
              }
              
              let comparison = 0;
              if (aValue < bValue) comparison = -1;
              if (aValue > bValue) comparison = 1;
              
              return currentClosedSort.direction === 'asc' ? comparison : -comparison;
            });
            
            // Clear tbody and re-append sorted rows
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
            if (totalRow) tbody.appendChild(totalRow);
            
            // Update sort indicators
            document.querySelectorAll('.sortable-closed').forEach(h => {
              h.classList.remove('active');
              const indicator = h.querySelector('.sort-indicator');
              indicator.className = 'sort-indicator';
            });
            
            this.classList.add('active');
            const indicator = this.querySelector('.sort-indicator');
            indicator.classList.add(currentClosedSort.direction);
          });
        });
      </script>
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
    const stockCode = position.code.includes(':') ? position.code.split(':')[1] : position.code;
    
    return `
      <tr data-closed="true">
        <td data-value="${position.name}"><strong>${position.name}</strong></td>
        <td data-value="${stockCode}"><code>${stockCode}</code></td>
        <td class="text-end" data-value="${position.totalCost}">$${position.totalCost.toFixed(2)}</td>
        <td class="text-end" data-value="${position.totalRevenue}">$${position.totalRevenue.toFixed(2)}</td>
        <td class="text-end ${profitClass}" data-value="${position.profitLoss}">
          $${position.profitLoss.toFixed(2)}
        </td>
        <td class="text-end ${profitClass}" data-value="${position.profitLossPercent}">
          ${position.profitLossPercent.toFixed(2)}%
        </td>
        <td class="text-end" data-value="${position.transactions}"><small class="text-muted">${position.transactions} txns</small></td>
      </tr>
    `;
  }).join('');
  
  // Calculate totals for closed positions
  const totalClosedCost = closedPositions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalClosedRevenue = closedPositions.reduce((sum, pos) => sum + pos.totalRevenue, 0);
  const totalClosedProfit = totalClosedRevenue - totalClosedCost;
  const totalClosedPercent = totalClosedCost > 0 ? (totalClosedProfit / totalClosedCost) * 100 : 0;
  const totalProfitClass = totalClosedProfit >= 0 ? 'text-success' : 'text-danger';
  
  const totalRow = `
    <tr class="table-secondary fw-bold">
      <td colspan="2"><strong>Total Realized Gains</strong></td>
      <td class="text-end">$${totalClosedCost.toFixed(2)}</td>
      <td class="text-end">$${totalClosedRevenue.toFixed(2)}</td>
      <td class="text-end ${totalProfitClass}">
        $${totalClosedProfit.toFixed(2)}
      </td>
      <td class="text-end ${totalProfitClass}">
        ${totalClosedPercent.toFixed(2)}%
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
              <table id="closedPositionsTable" class="table table-striped mb-0">
                <thead>
                  <tr>
                    <th class="sortable-closed" data-column="0" data-type="text">Name <span class="sort-indicator"></span></th>
                    <th class="sortable-closed" data-column="1" data-type="text">Symbol <span class="sort-indicator"></span></th>
                    <th class="sortable-closed text-end" data-column="2" data-type="number">Total Cost <span class="sort-indicator"></span></th>
                    <th class="sortable-closed text-end" data-column="3" data-type="number">Total Revenue <span class="sort-indicator"></span></th>
                    <th class="sortable-closed text-end" data-column="4" data-type="number">Profit/Loss $ <span class="sort-indicator"></span></th>
                    <th class="sortable-closed text-end" data-column="5" data-type="number">Profit/Loss % <span class="sort-indicator"></span></th>
                    <th class="sortable-closed text-end" data-column="6" data-type="number">Transactions <span class="sort-indicator"></span></th>
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
