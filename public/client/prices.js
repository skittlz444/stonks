/**
 * Client-side JavaScript for the prices page
 * Fetches data from API and dynamically renders the holdings table
 */

// Global state
let currentData = null;
let currentSort = { column: -1, direction: 'asc' };
let currentClosedSort = { column: -1, direction: 'asc' };

/**
 * Calculate rebalancing recommendations for holdings
 */
function calculateRebalancing(holdings, cashAmount, portfolioTotal) {
  const recommendations = [];
  
  for (const holding of holdings) {
    if (!holding.quote || holding.error) {
      continue;
    }
    
    const currentPrice = holding.quote.current;
    const currentQuantity = holding.quantity;
    const currentValue = currentPrice * currentQuantity;
    const currentWeight = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;
    const targetWeight = holding.target_weight || 0;
    
    recommendations.push({
      ...holding,
      currentQuantity,
      currentValue,
      currentWeight,
      targetWeight,
      targetQuantity: currentQuantity,
      targetValue: currentValue,
      quantityChange: 0,
      valueChange: 0,
      newWeight: currentWeight,
      action: 'HOLD'
    });
  }
  
  const totalTargetWeight = recommendations.reduce((sum, r) => sum + r.targetWeight, 0);
  
  if (totalTargetWeight === 0) {
    return {
      recommendations,
      newCash: cashAmount,
      cashChange: 0
    };
  }
  
  let totalCashNeeded = 0;
  
  for (const rec of recommendations) {
    const currentPrice = rec.quote.current;
    const idealTargetValue = (rec.targetWeight / 100) * portfolioTotal;
    const targetQuantity = Math.round(idealTargetValue / currentPrice);
    const targetValue = targetQuantity * currentPrice;
    const quantityChange = targetQuantity - rec.currentQuantity;
    const valueChange = targetValue - rec.currentValue;
    
    let action = 'HOLD';
    if (quantityChange > 0) {
      action = 'BUY';
      totalCashNeeded += valueChange;
    } else if (quantityChange < 0) {
      action = 'SELL';
      totalCashNeeded += valueChange;
    }
    
    const newWeight = portfolioTotal > 0 ? (targetValue / portfolioTotal) * 100 : 0;
    
    rec.targetQuantity = targetQuantity;
    rec.targetValue = targetValue;
    rec.quantityChange = quantityChange;
    rec.valueChange = valueChange;
    rec.newWeight = newWeight;
    rec.action = action;
  }
  
  const newCash = cashAmount - totalCashNeeded;
  
  return {
    recommendations,
    newCash: newCash,
    cashChange: -totalCashNeeded
  };
}

/**
 * Initialize the prices page
 */
export async function initializePricesPage(rebalanceMode, currency) {
  try {
    // Fetch data from API
    const response = await fetch(`/stonks/api/prices-data?mode=${rebalanceMode ? 'rebalance' : 'normal'}&currency=${currency}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      showError(data.error);
      return;
    }
    
    currentData = data;
    
    // Update currency buttons if FX not available
    if (!data.fxAvailable) {
      document.getElementById('sgd-btn').classList.add('disabled');
      document.getElementById('sgd-btn').title = 'Requires OpenExchangeRates API key';
      document.getElementById('aud-btn').classList.add('disabled');
      document.getElementById('aud-btn').title = 'Requires OpenExchangeRates API key';
    }
    
    // Update rebalance button
    if (currency !== 'USD' && !rebalanceMode) {
      document.getElementById('rebalance-btn').classList.add('disabled');
    }
    
    // Render the page
    renderPricesPage(data, rebalanceMode, currency);
    
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading prices page:', error);
    showError(error.message);
  }
}

/**
 * Show error state
 */
function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'block';
  document.getElementById('error-message').textContent = message;
}

/**
 * Render the complete prices page
 */
function renderPricesPage(data, rebalanceMode, currency) {
  const { holdings, cashAmount, closedPositions, fxRates, fxAvailable, cacheStats } = data;
  
  // Currency conversion helpers
  const currencySymbols = { USD: '$', SGD: 'S$', AUD: 'A$' };
  const currencySymbol = currencySymbols[currency] || '$';
  const altCurrency = currency === 'USD' ? 'SGD' : 'USD';
  const altCurrencySymbol = currency === 'USD' ? 'S$' : 'USD $';
  
  const convert = (amountUSD) => {
    if (!fxAvailable || currency === 'USD') return amountUSD;
    const rate = fxRates[currency];
    return rate ? amountUSD * rate : amountUSD;
  };
  
  const convertToAlt = (amountUSD) => {
    if (!fxAvailable || !altCurrency) return 0;
    if (currency === 'USD') {
      const rate = fxRates['SGD'];
      return rate ? amountUSD * rate : 0;
    }
    return amountUSD;
  };
  
  const formatCurrency = (value) => `${currencySymbol}${value.toFixed(2)}`;
  
  // Calculate totals
  let totalMarketValue = 0;
  let totalCostBasis = 0;
  let totalChangeValue = 0;
  let totalWeightDeviation = 0;
  
  for (const holding of holdings) {
    if (!holding.error && holding.quote) {
      totalMarketValue += holding.marketValue;
      totalCostBasis += holding.costBasis;
      totalChangeValue += holding.quote.change * holding.quantity;
      
      const weight = (cashAmount + totalMarketValue) > 0 ? (holding.marketValue / (cashAmount + totalMarketValue)) * 100 : 0;
      if (holding.target_weight != null) {
        totalWeightDeviation += Math.abs(weight - holding.target_weight);
      }
    }
  }
  
  const portfolioTotal = totalMarketValue + cashAmount;
  const previousValue = totalMarketValue - totalChangeValue;
  const totalChangePercent = previousValue > 0 ? (totalChangeValue / previousValue) * 100 : 0;
  
  // Calculate closed positions total gain
  const closedPositionsGain = closedPositions.reduce((sum, pos) => sum + pos.profitLoss, 0);
  const openPositionsGain = totalMarketValue - totalCostBasis;
  const totalGain = openPositionsGain + closedPositionsGain;
  const totalGainPercent = (totalCostBasis + Math.abs(closedPositionsGain)) > 0 
    ? (totalGain / (totalCostBasis + Math.abs(closedPositionsGain))) * 100 
    : 0;
  
  // Calculate rebalancing if needed
  let rebalancingData = null;
  let newTotalMarketValue = totalMarketValue;
  let newTotalWeightDeviation = 0;
  
  if (rebalanceMode) {
    rebalancingData = calculateRebalancing(holdings, cashAmount, portfolioTotal);
    newTotalMarketValue = rebalancingData.recommendations.reduce((sum, rec) => sum + rec.targetValue, 0);
    newTotalWeightDeviation = rebalancingData.recommendations.reduce((sum, rec) => {
      if (rec.targetWeight != null) {
        return sum + Math.abs(rec.newWeight - rec.targetWeight);
      }
      return sum;
    }, 0);
  }
  
  // Render summary cards
  renderSummaryCards({
    portfolioTotal,
    totalMarketValue,
    newTotalMarketValue,
    cashAmount,
    totalChangeValue,
    totalChangePercent,
    totalGain,
    totalGainPercent,
    totalWeightDeviation,
    newTotalWeightDeviation,
    rebalancingData,
    rebalanceMode,
    fxAvailable,
    altCurrency,
    altCurrencySymbol,
    convert,
    convertToAlt,
    formatCurrency
  });
  
  // Render holdings table
  renderHoldingsTable({
    holdings,
    cashAmount,
    portfolioTotal,
    rebalanceMode,
    rebalancingData,
    convert,
    formatCurrency
  });
  
  // Render closed positions
  if (!rebalanceMode && closedPositions.length > 0) {
    renderClosedPositions(closedPositions, convert, formatCurrency);
  }
  
  // Update cache stats
  if (cacheStats.oldestTimestamp) {
    const lastUpdateTime = new Date(cacheStats.oldestTimestamp);
    document.getElementById('last-updated').textContent = `Last updated: ${lastUpdateTime.toLocaleString()}`;
    document.getElementById('cache-badge').innerHTML = '<span class="badge bg-success ms-2">Cached</span>';
  }
  document.getElementById('cache-stats').textContent = `${cacheStats.size} symbol${cacheStats.size !== 1 ? 's' : ''} in cache`;
  
  // Update page title
  document.getElementById('page-title').textContent = rebalanceMode ? 'Portfolio Rebalancing' : 'Live Stock Prices';
  document.getElementById('table-title').textContent = rebalanceMode ? 'Rebalancing Recommendations' : 'Portfolio Holdings';
  
  // Hide/show column controls in rebalance mode
  if (rebalanceMode) {
    document.getElementById('column-controls-btn').style.display = 'none';
    document.getElementById('currency-selector').style.display = 'none';
  }
  
  // Setup event listeners
  setupEventListeners(rebalanceMode);
}

/**
 * Render summary cards
 */
function renderSummaryCards(params) {
  const {
    portfolioTotal, totalMarketValue, newTotalMarketValue, cashAmount,
    totalChangeValue, totalChangePercent, totalGain, totalGainPercent,
    totalWeightDeviation, newTotalWeightDeviation, rebalancingData, rebalanceMode,
    fxAvailable, altCurrency, altCurrencySymbol, convert, convertToAlt, formatCurrency
  } = params;
  
  let html = `
    <div class="col-6 col-md-2">
      <div class="card bg-primary text-white h-100">
        <div class="card-body" style="min-height: 100px;">
          <h6 class="card-subtitle mb-2">Portfolio Value</h6>
          <h3 class="card-title mb-0">${formatCurrency(convert(portfolioTotal))}</h3>
          ${fxAvailable && altCurrency ? `<small class="opacity-75">${altCurrencySymbol}${convertToAlt(portfolioTotal).toFixed(2)}</small>` : ''}
          ${!fxAvailable ? `<small class="opacity-50" style="font-size: 0.7rem;">Multi-currency disabled</small>` : ''}
        </div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="card h-100">
        <div class="card-body" style="min-height: 100px;">
          <h6 class="card-subtitle mb-2 text-muted">Market Value</h6>
          ${rebalanceMode && Math.abs(newTotalMarketValue - totalMarketValue) > 0.01 ? `
            <div style="text-decoration: line-through; font-size: 0.9rem; opacity: 0.6;">${formatCurrency(convert(totalMarketValue))}</div>
            <h3 class="card-title mb-0">${formatCurrency(convert(newTotalMarketValue))}</h3>
            <small class="text-muted">(${(newTotalMarketValue - totalMarketValue >= 0 ? '+' : '-')}${formatCurrency(Math.abs(convert(newTotalMarketValue - totalMarketValue)))})</small>
          ` : `
            <h3 class="card-title mb-0">${formatCurrency(convert(rebalanceMode ? newTotalMarketValue : totalMarketValue))}</h3>
            ${fxAvailable && altCurrency ? `<small class="text-muted">${altCurrencySymbol}${convertToAlt(rebalanceMode ? newTotalMarketValue : totalMarketValue).toFixed(2)}</small>` : ''}
            ${!fxAvailable ? `<small class="text-muted" style="font-size: 0.7rem;">Multi-currency disabled</small>` : ''}
          `}
        </div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="card h-100">
        <div class="card-body" style="min-height: 100px;">
          <h6 class="card-subtitle mb-2 text-muted">Cash</h6>
          ${rebalanceMode && rebalancingData && Math.abs(rebalancingData.cashChange) > 0.01 ? `
            <div style="text-decoration: line-through; font-size: 0.9rem; opacity: 0.6;">${formatCurrency(convert(cashAmount))}</div>
            <h3 class="card-title mb-0">${formatCurrency(convert(rebalancingData.newCash))}</h3>
            <small class="text-muted">(${(rebalancingData.cashChange >= 0 ? '+' : '-')}${formatCurrency(Math.abs(convert(rebalancingData.cashChange)))})</small>
          ` : `
            <h3 class="card-title mb-0">${formatCurrency(convert(rebalanceMode && rebalancingData ? rebalancingData.newCash : cashAmount))}</h3>
          `}
        </div>
      </div>
    </div>
  `;
  
  if (!rebalanceMode) {
    html += `
      <div class="col-6 col-md-2">
        <div class="card ${totalChangeValue >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100">
          <div class="card-body" style="min-height: 100px;">
            <h6 class="card-subtitle mb-2">Day Change</h6>
            <h3 class="card-title mb-0">${formatCurrency(convert(totalChangeValue))}</h3>
            <small>${totalChangePercent.toFixed(2)}%</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-2">
        <div class="card ${totalGain >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100">
          <div class="card-body" style="min-height: 100px;">
            <h6 class="card-subtitle mb-2">Total Gain/Loss</h6>
            <h3 class="card-title mb-0">${formatCurrency(convert(totalGain))}</h3>
            <small>${totalGainPercent.toFixed(2)}%</small>
          </div>
        </div>
      </div>
    `;
  }
  
  html += `
    <div class="col-6 col-md-2">
      <div class="card ${(rebalanceMode ? newTotalWeightDeviation : totalWeightDeviation) > 10 ? 'bg-warning' : 'bg-info'} text-white h-100">
        <div class="card-body" style="min-height: 100px;">
          <h6 class="card-subtitle mb-2">Weight Dev.</h6>
          ${rebalanceMode && Math.abs(newTotalWeightDeviation - totalWeightDeviation) > 0.01 ? `
            <div style="text-decoration: line-through; font-size: 0.9rem; opacity: 0.6;">${totalWeightDeviation.toFixed(2)}%</div>
            <h3 class="card-title mb-0">${newTotalWeightDeviation.toFixed(2)}%</h3>
            <small>(${(newTotalWeightDeviation - totalWeightDeviation >= 0 ? '+' : '')}${(newTotalWeightDeviation - totalWeightDeviation).toFixed(2)}%)</small>
          ` : `
            <h3 class="card-title mb-0">${(rebalanceMode ? newTotalWeightDeviation : totalWeightDeviation).toFixed(2)}%</h3>
            <small>Abs. differences</small>
          `}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('portfolio-summary').innerHTML = html;
}

/**
 * Render holdings table
 */
function renderHoldingsTable(params) {
  const { holdings, cashAmount, portfolioTotal, rebalanceMode, rebalancingData, convert, formatCurrency } = params;
  
  // Generate table headers
  let theadHtml = '<tr>';
  if (rebalanceMode) {
    theadHtml += `
      <th class="sortable" data-column="0" data-type="text">Name <span class="sort-indicator"></span></th>
      <th class="sortable" data-column="1" data-type="text">Symbol <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="2" data-type="number">Current Price <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="3" data-type="number">Quantity <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="4" data-type="number">Market Value <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="5" data-type="number">Weight <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="6" data-type="number">Target <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="7" data-type="number">Diff <span class="sort-indicator"></span></th>
      <th class="text-center" data-column="8">Action</th>
    `;
  } else {
    theadHtml += `
      <th class="sortable" data-column="0" data-type="text">Name <span class="sort-indicator"></span></th>
      <th class="sortable" data-column="1" data-type="text">Symbol <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="2" data-type="number">Current Price <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="3" data-type="number">Price Change <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="4" data-type="number">Quantity <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="5" data-type="number" style="display: none;">Cost <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="6" data-type="number">Market Value <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="7" data-type="number">MV Change <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="8" data-type="number">Weight <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="9" data-type="number">Target <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="10" data-type="number">Diff <span class="sort-indicator"></span></th>
      <th class="sortable text-end" data-column="11" data-type="number">Total Gain/Loss <span class="sort-indicator"></span></th>
    `;
  }
  theadHtml += '</tr>';
  document.getElementById('holdings-thead').innerHTML = theadHtml;
  
  // Generate table rows
  let tbodyHtml = '';
  
  holdings.forEach((holding, idx) => {
    if (holding.error) {
      tbodyHtml += `
        <tr>
          <td>${holding.name}</td>
          <td><code>${holding.code}</code></td>
          <td class="text-end">${holding.quantity}</td>
          <td colspan="10" class="text-danger">
            <small>Error: ${holding.error}</small>
          </td>
        </tr>
      `;
      return;
    }
    
    const quote = holding.quote;
    const changeClass = quote.change >= 0 ? 'text-success' : 'text-danger';
    const changeIcon = quote.change >= 0 ? '▲' : '▼';
    const gainClass = holding.gain >= 0 ? 'text-success' : 'text-danger';
    const weight = portfolioTotal > 0 ? (holding.marketValue / portfolioTotal) * 100 : 0;
    const changeValue = quote.change * holding.quantity;
    const stockCode = holding.code.includes(':') ? holding.code.split(':')[1] : holding.code;
    
    const rebalanceRec = rebalanceMode && rebalancingData ? rebalancingData.recommendations[idx] : null;
    const targetWeight = holding.target_weight;
    const oldWeightDiff = targetWeight != null ? weight - targetWeight : null;
    const newWeightDiff = (rebalanceMode && rebalanceRec && targetWeight != null) ? rebalanceRec.newWeight - targetWeight : null;
    const weightDiffChange = (oldWeightDiff != null && newWeightDiff != null) ? Math.abs(newWeightDiff) - Math.abs(oldWeightDiff) : null;
    const weightDiff = (rebalanceMode && rebalanceRec) ? newWeightDiff : oldWeightDiff;
    const weightDiffClass = weightDiff != null ? (weightDiff >= 0 ? 'text-success' : 'text-danger') : '';
    
    if (rebalanceMode && rebalanceRec) {
      const qtyChangeClass = rebalanceRec.quantityChange > 0 ? 'text-success' : (rebalanceRec.quantityChange < 0 ? 'text-danger' : 'text-muted');
      const valueChangeClass = rebalanceRec.valueChange > 0 ? 'text-danger' : (rebalanceRec.valueChange < 0 ? 'text-success' : 'text-muted');
      const actionBadgeClass = rebalanceRec.action === 'BUY' ? 'bg-success' : (rebalanceRec.action === 'SELL' ? 'bg-danger' : 'bg-secondary');
      
      tbodyHtml += `
        <tr data-holding="true">
          <td data-value="${holding.name}"><strong><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></strong></td>
          <td data-value="${stockCode}"><code>${stockCode}</code></td>
          <td class="text-end" data-value="${quote.current}">${formatCurrency(convert(quote.current))}</td>
          <td class="text-end" data-value="${holding.quantity}">
            ${rebalanceRec.quantityChange !== 0 ? `
              <span class="text-muted" style="text-decoration: line-through;">${holding.quantity.toFixed(0)}</span>
              <strong>${rebalanceRec.targetQuantity.toFixed(0)}</strong>
              <span class="${qtyChangeClass}"> (${rebalanceRec.quantityChange >= 0 ? '+' : ''}${rebalanceRec.quantityChange.toFixed(0)})</span>
            ` : `<strong>${rebalanceRec.targetQuantity.toFixed(0)}</strong>`}
          </td>
          <td class="text-end" data-value="${holding.marketValue}">
            ${Math.abs(rebalanceRec.valueChange) > 0.01 ? `
              <span class="text-muted" style="text-decoration: line-through;">${formatCurrency(convert(holding.marketValue))}</span>
              <strong>${formatCurrency(convert(rebalanceRec.targetValue))}</strong>
              <span class="${valueChangeClass}"> (${rebalanceRec.valueChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(convert(rebalanceRec.valueChange)))})</span>
            ` : `<strong>${formatCurrency(convert(rebalanceRec.targetValue))}</strong>`}
          </td>
          <td class="text-end" data-value="${weight}">
            ${Math.abs(rebalanceRec.newWeight - weight) > 0.01 ? `
              <span class="text-muted" style="text-decoration: line-through;">${weight.toFixed(2)}%</span>
              <strong>${rebalanceRec.newWeight.toFixed(2)}%</strong>
            ` : `<strong>${rebalanceRec.newWeight.toFixed(2)}%</strong>`}
          </td>
          <td class="text-end" data-value="${targetWeight != null ? targetWeight : -999}">${targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}</td>
          <td class="text-end" data-value="${oldWeightDiff != null ? oldWeightDiff : -999}">
            ${oldWeightDiff != null ? (
              Math.abs(weightDiffChange) > 0.01 ? `
                <span class="text-muted" style="text-decoration: line-through;">${(oldWeightDiff >= 0 ? '+' : '')}${oldWeightDiff.toFixed(2)}%</span>
                <strong class="${weightDiffClass}">${(newWeightDiff >= 0 ? '+' : '')}${newWeightDiff.toFixed(2)}%</strong>
                <span class="text-muted"> (${(weightDiffChange >= 0 ? '+' : '')}${weightDiffChange.toFixed(2)}%)</span>
              ` : `<strong class="${weightDiffClass}">${(newWeightDiff >= 0 ? '+' : '')}${newWeightDiff.toFixed(2)}%</strong>`
            ) : '-'}
          </td>
          <td class="text-center" data-value="${rebalanceRec.action}">
            <span class="badge ${actionBadgeClass}">${rebalanceRec.action}</span>
          </td>
        </tr>
      `;
    } else {
      tbodyHtml += `
        <tr data-holding="true">
          <td data-value="${holding.name}"><strong><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></strong></td>
          <td data-value="${stockCode}"><code>${stockCode}</code></td>
          <td class="text-end" data-value="${quote.current}">${formatCurrency(convert(quote.current))}</td>
          <td class="text-end ${changeClass}" data-value="${quote.change}">
            ${changeIcon} ${formatCurrency(Math.abs(convert(quote.change)))} (${quote.changePercent.toFixed(2)}%)
          </td>
          <td class="text-end" data-value="${holding.quantity}">${holding.quantity.toFixed(0)}</td>
          <td class="text-end" data-value="${holding.costBasis}" style="display: none;">${formatCurrency(convert(holding.costBasis))}</td>
          <td class="text-end" data-value="${holding.marketValue}">${formatCurrency(convert(holding.marketValue))}</td>
          <td class="text-end ${changeClass}" data-value="${changeValue}">
            ${changeIcon} ${formatCurrency(Math.abs(convert(changeValue)))}
          </td>
          <td class="text-end" data-value="${weight}">${weight.toFixed(2)}%</td>
          <td class="text-end" data-value="${targetWeight != null ? targetWeight : -999}">${targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}</td>
          <td class="text-end ${weightDiffClass}" data-value="${weightDiff != null ? weightDiff : -999}">
            ${weightDiff != null ? (weightDiff >= 0 ? '+' : '') + weightDiff.toFixed(2) + '%' : '-'}
          </td>
          <td class="text-end ${gainClass}" data-value="${holding.gain}">
            ${formatCurrency(convert(holding.gain))} (${holding.gainPercent.toFixed(2)}%)
          </td>
        </tr>
      `;
    }
  });
  
  // Add cash row
  const cashWeight = portfolioTotal > 0 ? (cashAmount / portfolioTotal) * 100 : 0;
  if (rebalanceMode && rebalancingData) {
    const newCash = rebalancingData.newCash;
    const cashChange = rebalancingData.cashChange;
    const cashChangeClass = cashChange > 0 ? 'text-success' : (cashChange < 0 ? 'text-danger' : 'text-muted');
    const newCashWeight = portfolioTotal > 0 ? (newCash / portfolioTotal) * 100 : 0;
    
    tbodyHtml += `
      <tr>
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td class="text-end">-</td>
        <td class="text-end">
          <span class="text-muted" style="text-decoration: line-through;">-</span>
          <strong>-</strong>
        </td>
        <td class="text-end">
          ${Math.abs(cashChange) > 0.01 ? `
            <span class="text-muted" style="text-decoration: line-through;">${formatCurrency(convert(cashAmount))}</span>
            <strong>${formatCurrency(convert(newCash))}</strong>
            <span class="${cashChangeClass}"> (${cashChange >= 0 ? '+' : '-'}${formatCurrency(Math.abs(convert(cashChange)))})</span>
          ` : `<strong>${formatCurrency(convert(newCash))}</strong>`}
        </td>
        <td class="text-end">
          ${Math.abs(newCashWeight - cashWeight) > 0.01 ? `
            <span class="text-muted" style="text-decoration: line-through;">${cashWeight.toFixed(2)}%</span>
            <strong>${newCashWeight.toFixed(2)}%</strong>
            <span class="text-muted"> (${(newCashWeight - cashWeight >= 0 ? '+' : '')}${(newCashWeight - cashWeight).toFixed(2)}%)</span>
          ` : `<strong>${newCashWeight.toFixed(2)}%</strong>`}
        </td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-center">-</td>
      </tr>
    `;
  } else {
    tbodyHtml += `
      <tr>
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end" style="display: none;">-</td>
        <td class="text-end">${formatCurrency(convert(cashAmount))}</td>
        <td class="text-end">-</td>
        <td class="text-end">${cashWeight.toFixed(2)}%</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
        <td class="text-end">-</td>
      </tr>
    `;
  }
  
  document.getElementById('holdings-tbody').innerHTML = tbodyHtml;
}

/**
 * Render closed positions
 */
function renderClosedPositions(closedPositions, convert, formatCurrency) {
  let html = `
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
  `;
  
  closedPositions.forEach(position => {
    const profitClass = position.profitLoss >= 0 ? 'text-success' : 'text-danger';
    const stockCode = position.code.includes(':') ? position.code.split(':')[1] : position.code;
    
    html += `
      <tr data-closed="true">
        <td data-value="${position.name}"><strong><a href="#" onclick="showCompanyProfile('${position.code}', '${position.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${position.name}</a></strong></td>
        <td data-value="${stockCode}"><code>${stockCode}</code></td>
        <td class="text-end" data-value="${position.totalCost}">${formatCurrency(convert(position.totalCost))}</td>
        <td class="text-end" data-value="${position.totalRevenue}">${formatCurrency(convert(position.totalRevenue))}</td>
        <td class="text-end ${profitClass}" data-value="${position.profitLoss}">
          ${formatCurrency(convert(position.profitLoss))}
        </td>
        <td class="text-end ${profitClass}" data-value="${position.profitLossPercent}">
          ${position.profitLossPercent.toFixed(2)}%
        </td>
        <td class="text-end" data-value="${position.transactions}"><small class="text-muted">${position.transactions} txns</small></td>
      </tr>
    `;
  });
  
  // Calculate totals
  const totalClosedCost = closedPositions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalClosedRevenue = closedPositions.reduce((sum, pos) => sum + pos.totalRevenue, 0);
  const totalClosedProfit = totalClosedRevenue - totalClosedCost;
  const totalClosedPercent = totalClosedCost > 0 ? (totalClosedProfit / totalClosedCost) * 100 : 0;
  const totalProfitClass = totalClosedProfit >= 0 ? 'text-success' : 'text-danger';
  
  html += `
                  <tr class="fw-bold">
                    <td colspan="2"><strong>Total Realized Gains</strong></td>
                    <td class="text-end">${formatCurrency(convert(totalClosedCost))}</td>
                    <td class="text-end">${formatCurrency(convert(totalClosedRevenue))}</td>
                    <td class="text-end ${totalProfitClass}">
                      ${formatCurrency(convert(totalClosedProfit))}
                    </td>
                    <td class="text-end ${totalProfitClass}">
                      ${totalClosedPercent.toFixed(2)}%
                    </td>
                    <td class="text-end">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('closed-positions-section').innerHTML = html;
}

/**
 * Setup event listeners for sorting and column controls
 */
function setupEventListeners(rebalanceMode) {
  // Table sorting for holdings table
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const columnIndex = parseInt(this.dataset.column);
      const dataType = this.dataset.type;
      const table = document.getElementById('holdingsTable');
      const tbody = table.querySelector('tbody');
      
      const rows = Array.from(tbody.querySelectorAll('tr[data-holding="true"]'));
      const cashRow = tbody.querySelector('tr:not([data-holding])');
      
      if (currentSort.column === columnIndex) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = columnIndex;
        currentSort.direction = 'asc';
      }
      
      rows.sort((a, b) => {
        const aCell = a.querySelectorAll('td')[columnIndex];
        const bCell = b.querySelectorAll('td')[columnIndex];
        
        let aValue = aCell.dataset.value;
        let bValue = bCell.dataset.value;
        
        if (dataType === 'number') {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
          
          if (aValue === -999) return 1;
          if (bValue === -999) return -1;
        }
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return currentSort.direction === 'asc' ? comparison : -comparison;
      });
      
      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));
      if (cashRow) tbody.appendChild(cashRow);
      
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
  
  // Table sorting for closed positions
  document.querySelectorAll('.sortable-closed').forEach(header => {
    header.addEventListener('click', function() {
      const columnIndex = parseInt(this.dataset.column);
      const dataType = this.dataset.type;
      const table = document.getElementById('closedPositionsTable');
      const tbody = table.querySelector('tbody');
      
      const rows = Array.from(tbody.querySelectorAll('tr[data-closed="true"]'));
      const totalRow = tbody.querySelector('tr:not([data-closed])');
      
      if (currentClosedSort.column === columnIndex) {
        currentClosedSort.direction = currentClosedSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentClosedSort.column = columnIndex;
        currentClosedSort.direction = 'asc';
      }
      
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
      
      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));
      if (totalRow) tbody.appendChild(totalRow);
      
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
  
  // Column visibility toggle (only in normal mode)
  if (!rebalanceMode) {
    // Generate column controls
    const columnNames = [
      'Name', 'Symbol', 'Current Price', 'Price Change', 'Quantity',
      'Cost', 'Market Value', 'MV Change', 'Weight', 'Target', 'Diff', 'Total Gain/Loss'
    ];
    const defaultVisible = [true, true, true, true, true, false, true, true, true, true, true, true];
    
    let controlsHtml = '';
    columnNames.forEach((name, idx) => {
      const id = `col-${name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}`;
      const checked = defaultVisible[idx] ? 'checked' : '';
      controlsHtml += `
        <div class="col-auto">
          <div class="form-check form-check-inline">
            <input class="form-check-input column-toggle" type="checkbox" id="${id}" data-column="${idx}" ${checked}>
            <label class="form-check-label" for="${id}">${name}</label>
          </div>
        </div>
      `;
    });
    
    document.getElementById('column-controls-content').innerHTML = controlsHtml;
    
    // Add event listeners for column toggles
    document.querySelectorAll('.column-toggle').forEach(toggle => {
      toggle.addEventListener('change', function() {
        const columnIndex = parseInt(this.dataset.column);
        const table = document.getElementById('holdingsTable');
        const isChecked = this.checked;
        
        const headers = table.querySelectorAll('thead th');
        if (headers[columnIndex]) {
          headers[columnIndex].style.display = isChecked ? '' : 'none';
        }
        
        table.querySelectorAll('tbody tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells[columnIndex]) {
            cells[columnIndex].style.display = isChecked ? '' : 'none';
          }
        });
      });
    });
  }
}
