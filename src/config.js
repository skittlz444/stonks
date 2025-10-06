import { createLayout } from './utils.js';

/**
 * Generate the configuration page HTML
 */
export async function generateConfigPage(databaseService) {
  // Get current portfolio holdings
  const portfolioHoldingsResult = await databaseService.db.prepare(
    'SELECT * FROM portfolio_holdings ORDER BY id'
  ).all();
  
  const portfolioHoldings = portfolioHoldingsResult.results || [];
  
  // Get current cash amount and portfolio name
  const cashAmount = await databaseService.getCashAmount();
  const portfolioNameResult = await databaseService.db.prepare(
    'SELECT value FROM portfolio_settings WHERE key = ?'
  ).bind('portfolio_name').first();
  
  const portfolioName = portfolioNameResult ? portfolioNameResult.value : 'My Portfolio';

  const content = `
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

      <!-- Portfolio Holdings -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3>Portfolio Holdings</h3>
          <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addHoldingModal">
            Add Holding
          </button>
        </div>
        <div class="card-body">
          ${portfolioHoldings.length === 0 ? 
            '<p class="text-muted">No holdings configured. Add some holdings to get started.</p>' :
            `
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Quantity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${portfolioHoldings.map(holding => `
                    <tr>
                      <td>${holding.name}</td>
                      <td><code>${holding.code}</code></td>
                      <td>${holding.quantity}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="editHolding(${holding.id}, '${holding.name}', '${holding.code}', ${holding.quantity})">
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
      </div>

      <!-- Navigation -->
      <div class="card">
        <div class="card-body">
          <h5>Navigation</h5>
          <a href="/stonks/prices" class="btn btn-outline-success me-2">📊 Live Prices</a>
          <a href="/stonks/ticker" class="btn btn-outline-primary me-2">Ticker View</a>
          <a href="/stonks/charts" class="btn btn-outline-primary me-2">Grid Charts</a>
          <a href="/stonks/charts/large" class="btn btn-outline-primary">Large Charts</a>
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
                <label for="add_quantity" class="form-label">Quantity</label>
                <input type="number" step="0.01" class="form-control" id="add_quantity" name="quantity" 
                       placeholder="e.g., 10.5" required>
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
                <label for="edit_quantity" class="form-label">Quantity</label>
                <input type="number" step="0.01" class="form-control" id="edit_quantity" name="quantity" required>
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

    <script>
      function editHolding(id, name, code, quantity) {
        document.getElementById('edit_holding_id').value = id;
        document.getElementById('edit_name').value = name;
        document.getElementById('edit_code').value = code;
        document.getElementById('edit_quantity').value = quantity;
        
        const modal = new bootstrap.Modal(document.getElementById('editHoldingModal'));
        modal.show();
      }
    </script>
  `;

  return createLayout('Portfolio Configuration', content);
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
        const addQuantity = parseFloat(formData.get('quantity'));
        
        await databaseService.addPortfolioHolding(addName, addCode, addQuantity);
        break;
        
      case 'update_holding':
        const updateId = parseInt(formData.get('holding_id'));
        const updateName = formData.get('name');
        const updateCode = formData.get('code');
        const updateQuantity = parseFloat(formData.get('quantity'));
        
        await databaseService.updatePortfolioHolding(updateId, updateName, updateCode, updateQuantity);
        break;
        
      case 'delete_holding':
        const deleteId = parseInt(formData.get('holding_id'));
        await databaseService.deletePortfolioHolding(deleteId);
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