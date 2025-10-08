/**
 * Client-side JavaScript for the config page
 * Fetches data from API and dynamically renders the configuration tables
 */

// Global state
let currentData = null;

/**
 * Initialize the config page
 */
export async function initializeConfigPage() {
  try {
    // Check for success/error messages from form submission
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === '1') {
      showFormMessage('success', 'Changes saved successfully!');
    } else if (urlParams.get('error') === '1') {
      showFormMessage('error', 'An error occurred while saving changes.');
    }
    
    // Fetch data from API
    const response = await fetch('/stonks/api/config-data');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      showError(data.error);
      return;
    }
    
    currentData = data;
    
    // Render the page
    renderConfigPage(data);
    
    // Hide loading, show content
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
  } catch (error) {
    console.error('Error loading config page:', error);
    showError(error.message);
  }
}

/**
 * Show form submission message
 */
function showFormMessage(type, message) {
  const messagesDiv = document.getElementById('form-messages');
  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
  messagesDiv.innerHTML = `
    <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
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
 * Render the complete config page
 */
function renderConfigPage(data) {
  const { visibleHoldings, hiddenHoldings, transactions, cashAmount, portfolioName, totalTargetWeight } = data;
  
  // Populate portfolio settings form
  document.getElementById('portfolio_name').value = portfolioName;
  document.getElementById('cash_amount').value = cashAmount;
  
  // Render visible holdings
  renderVisibleHoldings(visibleHoldings, totalTargetWeight);
  
  // Render hidden holdings if any
  if (hiddenHoldings.length > 0) {
    renderHiddenHoldings(hiddenHoldings);
  }
  
  // Render transactions
  renderTransactions(transactions);
  
  // Populate transaction modal stock dropdown
  populateStockDropdown([...visibleHoldings, ...hiddenHoldings]);
  
  // Setup event listeners
  setupEventListeners();
}

/**
 * Render visible holdings table
 */
function renderVisibleHoldings(visibleHoldings, totalTargetWeight) {
  const bodyDiv = document.getElementById('visible-holdings-body');
  
  if (visibleHoldings.length === 0) {
    bodyDiv.innerHTML = '<p class="text-muted">No visible holdings. Add some holdings or unhide existing ones.</p>';
    return;
  }
  
  let html = `
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
  `;
  
  visibleHoldings.forEach(holding => {
    html += `
      <tr>
        <td><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></td>
        <td><code>${holding.code}</code></td>
        <td>${holding.quantity.toFixed(2)} <small class="text-muted">(from txns)</small></td>
        <td>${holding.target_weight != null ? holding.target_weight + '%' : '-'}</td>
        <td>
          <form method="POST" action="/stonks/config" style="display: inline;">
            <input type="hidden" name="action" value="toggle_visibility">
            <input type="hidden" name="holding_id" value="${holding.id}">
            <button type="submit" class="btn btn-sm btn-outline-success" title="Visible on ticker/charts">
              👁️ Visible
            </button>
          </form>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2" 
                  onclick="editHolding(${holding.id}, '${holding.name.replace(/'/g, "\\'")}', '${holding.code}', ${holding.target_weight})">
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
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  bodyDiv.innerHTML = html;
  
  // Show and populate footer with total target weight
  const footerDiv = document.getElementById('visible-holdings-footer');
  footerDiv.style.display = 'block';
  
  let badgeClass = 'bg-success';
  if (Math.abs(totalTargetWeight - 100) > 0.01) {
    badgeClass = Math.abs(totalTargetWeight - 100) <= 5 ? 'bg-warning' : 'bg-danger';
  }
  
  footerDiv.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <span><strong>Total Target Weight:</strong></span>
      <span class="badge ${badgeClass} fs-6">
        ${totalTargetWeight.toFixed(2)}%
      </span>
    </div>
  `;
}

/**
 * Render hidden holdings table
 */
function renderHiddenHoldings(hiddenHoldings) {
  const cardDiv = document.getElementById('hidden-holdings-card');
  const bodyDiv = document.getElementById('hidden-holdings-body');
  const titleSpan = document.getElementById('hidden-holdings-title');
  
  cardDiv.style.display = 'block';
  titleSpan.textContent = `Hidden Holdings (${hiddenHoldings.length})`;
  
  let html = `
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
  `;
  
  hiddenHoldings.forEach(holding => {
    html += `
      <tr class="table-secondary">
        <td><a href="#" onclick="showCompanyProfile('${holding.code}', '${holding.name.replace(/'/g, "\\'")}'); return false;" style="color: inherit; text-decoration: none;">${holding.name}</a></td>
        <td><code>${holding.code}</code></td>
        <td>${holding.quantity.toFixed(2)} <small class="text-muted">(from txns)</small></td>
        <td>${holding.target_weight != null ? holding.target_weight + '%' : '-'}</td>
        <td>
          <form method="POST" action="/stonks/config" style="display: inline;">
            <input type="hidden" name="action" value="toggle_visibility">
            <input type="hidden" name="holding_id" value="${holding.id}">
            <button type="submit" class="btn btn-sm btn-outline-secondary" title="Hidden from ticker/charts">
              👁️‍🗨️ Hidden
            </button>
          </form>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2" 
                  onclick="editHolding(${holding.id}, '${holding.name.replace(/'/g, "\\'")}', '${holding.code}', ${holding.target_weight})">
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
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  bodyDiv.innerHTML = html;
}

/**
 * Render transactions table
 */
function renderTransactions(transactions) {
  const bodyDiv = document.getElementById('transactions-body');
  
  if (transactions.length === 0) {
    bodyDiv.innerHTML = '<p class="text-muted">No transactions recorded. Add transactions to track your portfolio activity.</p>';
    return;
  }
  
  let html = `
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
  `;
  
  transactions.forEach(txn => {
    const total = txn.type === 'buy' 
      ? parseFloat(txn.value) + parseFloat(txn.fee)
      : parseFloat(txn.value) - parseFloat(txn.fee);
    
    html += `
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
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  bodyDiv.innerHTML = html;
}

/**
 * Populate stock dropdown in transaction modal
 */
function populateStockDropdown(holdings) {
  const select = document.getElementById('txn_code');
  
  holdings.forEach(holding => {
    const option = document.createElement('option');
    option.value = holding.code;
    option.textContent = `${holding.name} (${holding.code})`;
    select.appendChild(option);
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Set default date to today for transaction form
  const dateInput = document.getElementById('txn_date');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }
  
  // Make editHolding function globally available
  window.editHolding = function(id, name, code, targetWeight) {
    document.getElementById('edit_holding_id').value = id;
    document.getElementById('edit_name').value = name;
    document.getElementById('edit_code').value = code;
    document.getElementById('edit_target_weight').value = targetWeight || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editHoldingModal'));
    modal.show();
  };
}
