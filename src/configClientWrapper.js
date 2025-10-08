import { createLayout, generateCompanyProfileModal, generateCompanyProfileScript, generateTopNavigation } from './utils.js';

/**
 * Generate the client-side config page wrapper with skeleton loading
 * This page loads data via API calls instead of server-side rendering
 */
export function generateConfigPageClient() {
  const content = `
    ${generateTopNavigation()}

    <div class="container mt-4">
      <h1 class="mb-4">Portfolio Configuration</h1>
      
      <!-- Loading State -->
      <div id="loading-state">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading configuration data...</p>
        </div>
      </div>

      <!-- Error State (hidden by default) -->
      <div id="error-state" style="display: none;">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">⚠️ Error Loading Data</h4>
          <p id="error-message"></p>
          <hr>
          <button class="btn btn-danger" onclick="location.reload()">Retry</button>
        </div>
      </div>

      <!-- Success/Error Messages (from form submission) -->
      <div id="form-messages"></div>

      <!-- Main Content (hidden until loaded) -->
      <div id="main-content" style="display: none;">
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
                  <input type="text" class="form-control" id="portfolio_name" name="portfolio_name" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="cash_amount" class="form-label">Cash Amount</label>
                  <input type="number" step="0.01" class="form-control" id="cash_amount" name="cash_amount" required>
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
          <div class="card-body" id="visible-holdings-body">
            <!-- Will be populated by JavaScript -->
          </div>
          <div class="card-footer" id="visible-holdings-footer" style="display: none;">
            <!-- Will be populated by JavaScript -->
          </div>
        </div>

        <!-- Hidden Holdings (Collapsed by default) -->
        <div class="card mb-4" id="hidden-holdings-card" style="display: none;">
          <div class="card-header">
            <h3 class="mb-0">
              <button class="btn btn-link text-decoration-none text-white w-100 text-start" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#hiddenHoldingsCollapse" 
                      aria-expanded="false" 
                      aria-controls="hiddenHoldingsCollapse">
                <i class="bi bi-eye-slash"></i> <span id="hidden-holdings-title"></span>
                <small class="text-muted ms-2">- Not shown on ticker/charts</small>
              </button>
            </h3>
          </div>
          <div class="collapse" id="hiddenHoldingsCollapse">
            <div class="card-body" id="hidden-holdings-body">
              <!-- Will be populated by JavaScript -->
            </div>
          </div>
        </div>

        <!-- Transactions -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3>Transactions</h3>
            <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
              Add Transaction
            </button>
          </div>
          <div class="card-body" id="transactions-body">
            <!-- Will be populated by JavaScript -->
          </div>
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
                  <!-- Will be populated by JavaScript -->
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

    <!-- Load the client-side JavaScript -->
    <script type="module">
      import { initializeConfigPage } from '/stonks/client/config.js';
      
      // Initialize the page when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeConfigPage();
        });
      } else {
        initializeConfigPage();
      }
    </script>

    ${generateCompanyProfileScript()}
    ${generateCompanyProfileModal()}
  `;

  return createLayout('Portfolio Configuration', content, "background-color:#212529;color:#ffffff", false);
}
