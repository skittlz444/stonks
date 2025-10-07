import { createLayout, generateCompanyProfileModal, generateCompanyProfileScript } from './utils.js';

/**
 * Generate the configuration page HTML
 */
export async function generateConfigPage(databaseService) {
  // Get visible and hidden portfolio holdings separately
  const visibleHoldings = await databaseService.getVisiblePortfolioHoldings();
  const hiddenHoldings = await databaseService.getHiddenPortfolioHoldings();
  const portfolioHoldings = [...visibleHoldings, ...hiddenHoldings]; // For backward compatibility
  
  // Get all transactions
  const transactions = await databaseService.getTransactions();
  
  // Get current cash amount and portfolio name
  const cashAmount = await databaseService.getCashAmount();
  const portfolioNameResult = await databaseService.db.prepare(
    'SELECT value FROM portfolio_settings WHERE key = ?'
  ).bind('portfolio_name').first();
  
  const portfolioName = portfolioNameResult ? portfolioNameResult.value : 'My Portfolio';
  
  // Calculate total target weight for visible holdings
  const totalTargetWeight = visibleHoldings.reduce((sum, holding) => {
    return sum + (holding.target_weight != null ? holding.target_weight : 0);
  }, 0);

  const content = `
    <!-- Top Navigation -->
    <div class="container-fluid bg-dark border-bottom border-secondary">
      <div class="container py-2">
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <a href="/stonks/prices" class="btn btn-outline-success btn-sm">📊 Live Prices</a>
          <a href="/stonks/ticker" class="btn btn-outline-info btn-sm">📈 Ticker View</a>
          <a href="/stonks/charts" class="btn btn-outline-info btn-sm">📉 Grid Charts</a>
          <a href="/stonks/charts/large" class="btn btn-outline-info btn-sm">📊 Large Charts</a>
          <a href="/stonks/charts/advanced" class="btn btn-outline-info btn-sm">📈 Advanced Chart</a>
          <a href="/stonks/config" class="btn btn-outline-light btn-sm">⚙️ Config</a>
        </div>
      </div>
    </div>

    <div class="container mt-4">
      <h1 class="mb-4">Portfolio Configuration</h1>
      
      <!-- Portfolio Settings -->
      <div class="card mb-4">
        <div class="card-header">
          <h3>Portfolio Settings</h3>
        </div>
        <div class="card-body">
          <form method="POST" action="/stonks/config">
            <input type="hidden" name="action" value="update_settings">
            
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="portfolio_name" class="form-label">Portfolio Name</label>
                <input type="text" class="form-control" id="portfolio_name" name="portfolio_name" 
                       value="${portfolioName}" required>
              </div>
              <div class="col-md-6 mb-3">
                <label for="cash_amount" class="form-label">Cash Amount</label>
                <input type="number" step="0.01" class="form-control" id="cash_amount" name="cash_amount" 
                       value="${cashAmount}" required>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary">Update Settings</button>
          </form>
        </div>
      </div>

      <!-- Portfolio Holdings (Visible) -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3>Portfolio Holdings</h3>
          <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addHoldingModal">
            Add Holding
          </button>
        </div>
        <div class="card-body">
          ${visibleHoldings.length === 0 ? 
            '<p class="text-muted">No visible holdings. Add some holdings or unhide existing ones.</p>' :
            `
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Quantity</th>
                    <th>Target Weight</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${visibleHoldings.map(holding => `
                    <tr>
                      <td><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></td>
                      <td><code>${holding.code}</code></td>
                      <td>${holding.quantity.toFixed(2)} <small class="text-muted">(from txns)</small></td>
                      <td>${holding.target_weight != null ? holding.target_weight + '%' : '-'}</td>
                      <td>
                        <form method="POST" action="/stonks/config" style="display: inline;">
                          <input type="hidden" name="action" value="toggle_visibility">
                          <input type="hidden" name="holding_id" value="${holding.id}">
                          <button type="submit" class="btn btn-sm btn-outline-success" 
                                  title="Visible on ticker/charts">
                            👁️ Visible
                          </button>
                        </form>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="editHolding(${holding.id}, '${holding.name}', '${holding.code}', ${holding.target_weight})">
                          Edit
                        </button>
                        <form method="POST" action="/stonks/config" style="display: inline;">
                          <input type="hidden" name="action" value="delete_holding">
                          <input type="hidden" name="holding_id" value="${holding.id}">
                          <button type="submit" class="btn btn-sm btn-outline-danger" 
                                  onclick="return confirm('Are you sure you want to delete this holding?')">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            `
          }
        </div>
        ${visibleHoldings.length > 0 ? `
        <div class="card-footer">
          <div class="d-flex justify-content-between align-items-center">
            <span><strong>Total Target Weight:</strong></span>
            <span class="badge ${
              Math.abs(totalTargetWeight - 100) < 0.01 ? 'bg-success' : 
              Math.abs(totalTargetWeight - 100) <= 5 ? 'bg-warning' : 
              'bg-danger'
            } fs-6">
              ${totalTargetWeight.toFixed(2)}%
            </span>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Hidden Holdings (Collapsed by default) -->
      ${hiddenHoldings.length > 0 ? `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="mb-0">
            <button class="btn btn-link text-decoration-none text-white w-100 text-start" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#hiddenHoldingsCollapse" 
                    aria-expanded="false" 
                    aria-controls="hiddenHoldingsCollapse">
              <i class="bi bi-eye-slash"></i> Hidden Holdings (${hiddenHoldings.length})
              <small class="text-muted ms-2">- Not shown on ticker/charts</small>
            </button>
          </h3>
        </div>
        <div class="collapse" id="hiddenHoldingsCollapse">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Quantity</th>
                    <th>Target Weight</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${hiddenHoldings.map(holding => `
                    <tr class="table-secondary">
                      <td><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></td>
                      <td><code>${holding.code}</code></td>
                      <td>${holding.quantity.toFixed(2)} <small class="text-muted">(from txns)</small></td>
                      <td>${holding.target_weight != null ? holding.target_weight + '%' : '-'}</td>
                      <td>
                        <form method="POST" action="/stonks/config" style="display: inline;">
                          <input type="hidden" name="action" value="toggle_visibility">
                          <input type="hidden" name="holding_id" value="${holding.id}">
                          <button type="submit" class="btn btn-sm btn-outline-secondary" 
                                  title="Hidden from ticker/charts">
                            👁️‍🗨️ Hidden
                          </button>
                        </form>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="editHolding(${holding.id}, '${holding.name}', '${holding.code}', ${holding.target_weight})">
                          Edit
                        </button>
                        <form method="POST" action="/stonks/config" style="display: inline;">
                          <input type="hidden" name="action" value="delete_holding">
                          <input type="hidden" name="holding_id" value="${holding.id}">
                          <button type="submit" class="btn btn-sm btn-outline-danger" 
                                  onclick="return confirm('Are you sure you want to delete this holding?')">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      ` : ''}


      <!-- Transactions -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3>Transactions</h3>
          <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
            Add Transaction
          </button>
        </div>
        <div class="card-body">
          ${transactions.length === 0 ? 
            '<p class="text-muted">No transactions recorded. Add transactions to track your portfolio activity.</p>' :
            `
            <div class="table-responsive">
              <table class="table table-striped table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Code</th>
                    <th class="text-end">Quantity</th>
                    <th class="text-end">Value</th>
                    <th class="text-end">Fee</th>
                    <th class="text-end">Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(txn => {
                    const total = txn.type === 'buy' 
                      ? parseFloat(txn.value) + parseFloat(txn.fee)
                      : parseFloat(txn.value) - parseFloat(txn.fee);
                    return `
                    <tr>
                      <td>${txn.date}</td>
                      <td><span class="badge ${txn.type === 'buy' ? 'bg-success' : 'bg-danger'}">${txn.type.toUpperCase()}</span></td>
                      <td><code>${txn.code}</code></td>
                      <td class="text-end">${parseFloat(txn.quantity).toFixed(2)}</td>
                      <td class="text-end">$${parseFloat(txn.value).toFixed(2)}</td>
                      <td class="text-end">$${parseFloat(txn.fee).toFixed(2)}</td>
                      <td class="text-end">$${total.toFixed(2)}</td>
                      <td>
                        <form method="POST" action="/stonks/config" style="display: inline;">
                          <input type="hidden" name="action" value="delete_transaction">
                          <input type="hidden" name="transaction_id" value="${txn.id}">
                          <button type="submit" class="btn btn-sm btn-outline-danger" 
                                  onclick="return confirm('Are you sure you want to delete this transaction?')">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  `;}).join('')}
                </tbody>
              </table>
            </div>
            `
          }
        </div>
      </div>
    </div>

    <!-- Add Holding Modal -->
    <div class="modal fade" id="addHoldingModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Holding</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form method="POST" action="/stonks/config">
            <div class="modal-body">
              <input type="hidden" name="action" value="add_holding">
              
              <div class="mb-3">
                <label for="add_name" class="form-label">Name</label>
                <input type="text" class="form-control" id="add_name" name="name" 
                       placeholder="e.g., Apple Inc." required>
              </div>
              
              <div class="mb-3">
                <label for="add_code" class="form-label">Stock Code</label>
                <input type="text" class="form-control" id="add_code" name="code" 
                       placeholder="e.g., NASDAQ:AAPL or BATS:AAPL" required>
                <div class="form-text">Use format: EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL, BATS:VOO)</div>
              </div>
              
              <div class="mb-3">
                <label for="add_target_weight" class="form-label">Target Weight (%)</label>
                <input type="number" step="0.01" min="0" max="100" class="form-control" id="add_target_weight" name="target_weight" 
                       placeholder="e.g., 25.00 (optional)">
                <div class="form-text">Target portfolio allocation percentage (0-100). Leave empty for no target. Add transactions to set quantity.</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Holding</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Holding Modal -->
    <div class="modal fade" id="editHoldingModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Holding</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form method="POST" action="/stonks/config">
            <div class="modal-body">
              <input type="hidden" name="action" value="update_holding">
              <input type="hidden" name="holding_id" id="edit_holding_id">
              
              <div class="mb-3">
                <label for="edit_name" class="form-label">Name</label>
                <input type="text" class="form-control" id="edit_name" name="name" required>
              </div>
              
              <div class="mb-3">
                <label for="edit_code" class="form-label">Stock Code</label>
                <input type="text" class="form-control" id="edit_code" name="code" required>
                <div class="form-text">Use format: EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL, BATS:VOO)</div>
              </div>
              
              <div class="mb-3">
                <label for="edit_target_weight" class="form-label">Target Weight (%)</label>
                <input type="number" step="0.01" min="0" max="100" class="form-control" id="edit_target_weight" name="target_weight" 
                       placeholder="e.g., 25.00 (optional)">
                <div class="form-text">Target portfolio allocation percentage (0-100). Leave empty for no target. Quantity is derived from transactions.</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Holding</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Add Transaction Modal -->
    <div class="modal fade" id="addTransactionModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add Transaction</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <form method="POST" action="/stonks/config">
            <div class="modal-body">
              <input type="hidden" name="action" value="add_transaction">
              
              <div class="mb-3">
                <label for="txn_type" class="form-label">Transaction Type</label>
                <select class="form-control" id="txn_type" name="type" required>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              
              <div class="mb-3">
                <label for="txn_code" class="form-label">Stock Code</label>
                <select class="form-control" id="txn_code" name="code" required>
                  <option value="">Select a stock...</option>
                  ${portfolioHoldings.map(h => `<option value="${h.code}">${h.name} (${h.code})</option>`).join('')}
                </select>
                <div class="form-text">Select from existing holdings or add a new holding first.</div>
              </div>
              
              <div class="mb-3">
                <label for="txn_date" class="form-label">Transaction Date</label>
                <input type="date" class="form-control" id="txn_date" name="date" required>
              </div>
              
              <div class="mb-3">
                <label for="txn_quantity" class="form-label">Quantity</label>
                <input type="number" step="0.01" min="0.01" class="form-control" id="txn_quantity" name="quantity" 
                       placeholder="e.g., 10.5" required>
              </div>
              
              <div class="mb-3">
                <label for="txn_value" class="form-label">Transaction Value ($)</label>
                <input type="number" step="0.01" min="0" class="form-control" id="txn_value" name="value" 
                       placeholder="e.g., 1250.00" required>
                <div class="form-text">Total value before fees</div>
              </div>
              
              <div class="mb-3">
                <label for="txn_fee" class="form-label">Fee ($)</label>
                <input type="number" step="0.01" min="0" class="form-control" id="txn_fee" name="fee" 
                       placeholder="e.g., 10.00" value="0">
                <div class="form-text">Trading fee or commission</div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Add Transaction</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      function editHolding(id, name, code, targetWeight) {
        document.getElementById('edit_holding_id').value = id;
        document.getElementById('edit_name').value = name;
        document.getElementById('edit_code').value = code;
        document.getElementById('edit_target_weight').value = targetWeight || '';
        
        const modal = new bootstrap.Modal(document.getElementById('editHoldingModal'));
        modal.show();
      }
      
      // Set default date to today
      document.addEventListener('DOMContentLoaded', function() {
        const dateInput = document.getElementById('txn_date');
        if (dateInput) {
          dateInput.valueAsDate = new Date();
        }
      });
    </script>

    ${generateCompanyProfileScript()}
    ${generateCompanyProfileModal()}
  `;

  return createLayout('Portfolio Configuration', content, "background-color:#212529;color:#ffffff", false);
}

/**
 * Handle configuration form submissions
 */
export async function handleConfigSubmission(request, databaseService) {
  let redirectUrl = '/stonks/config';
  
  try {
    const formData = await request.formData();
    const action = formData.get('action');
    switch (action) {
      case 'update_settings':
        const portfolioName = formData.get('portfolio_name');
        const cashAmount = parseFloat(formData.get('cash_amount'));
        
        await databaseService.updateCashAmount(cashAmount);
        
        // Update portfolio name
        await databaseService.db.prepare(
          'INSERT OR REPLACE INTO portfolio_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        ).bind('portfolio_name', portfolioName).run();
        
        break;
        
      case 'add_holding':
        const addName = formData.get('name');
        const addCode = formData.get('code');
        const addTargetWeight = formData.get('target_weight');
        const addTargetWeightValue = addTargetWeight && addTargetWeight.trim() !== '' ? parseFloat(addTargetWeight) : null;
        
        await databaseService.addPortfolioHolding(addName, addCode, addTargetWeightValue);
        break;
        
      case 'update_holding':
        const updateId = parseInt(formData.get('holding_id'));
        const updateName = formData.get('name');
        const updateCode = formData.get('code');
        const updateTargetWeight = formData.get('target_weight');
        const updateTargetWeightValue = updateTargetWeight && updateTargetWeight.trim() !== '' ? parseFloat(updateTargetWeight) : null;
        
        await databaseService.updatePortfolioHolding(updateId, updateName, updateCode, updateTargetWeightValue);
        break;
        
      case 'delete_holding':
        const deleteId = parseInt(formData.get('holding_id'));
        await databaseService.deletePortfolioHolding(deleteId);
        break;
        
      case 'toggle_visibility':
        const toggleId = parseInt(formData.get('holding_id'));
        await databaseService.toggleHoldingVisibility(toggleId);
        break;
        
      case 'add_transaction':
        const txnCode = formData.get('code');
        const txnType = formData.get('type');
        const txnDate = formData.get('date');
        const txnQuantity = parseFloat(formData.get('quantity'));
        const txnValue = parseFloat(formData.get('value'));
        const txnFee = parseFloat(formData.get('fee') || 0);
        
        await databaseService.addTransaction(txnCode, txnType, txnDate, txnQuantity, txnValue, txnFee);
        break;
        
      case 'delete_transaction':
        const deleteTxnId = parseInt(formData.get('transaction_id'));
        await databaseService.deleteTransaction(deleteTxnId);
        break;
        
      default:
        throw new Error('Invalid action');
    }
    
    // Add success message to redirect URL
    redirectUrl += '?success=1';
    
  } catch (error) {
    console.error('Config submission error:', error);
    redirectUrl += '?error=1';
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl
    }
  });
}