import { createLayout, generateCompanyProfileModal, generateCompanyProfileScript, generateTopNavigation } from './utils.js';

/**
 * Generate the client-side prices page wrapper with skeleton loading
 * This page loads data via API calls instead of server-side rendering
 */
export function generatePricesPageClient(rebalanceMode = false, currency = 'USD') {
  // Build prices URL with currency parameter if needed
  const pricesUrl = `/stonks/prices${currency !== 'USD' ? '?currency=' + currency : ''}`;
  
  const content = `
    ${generateTopNavigation(pricesUrl)}

    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1>📊 <span id="page-title">${rebalanceMode ? 'Portfolio Rebalancing' : 'Live Stock Prices'}</span></h1>
        <div class="d-flex flex-wrap gap-2">
          <div class="btn-group" role="group" aria-label="Currency selector" id="currency-selector">
            <a href="/stonks/prices?currency=USD" class="btn btn-sm ${currency === 'USD' ? 'btn-primary' : 'btn-outline-primary'}">USD</a>
            <a href="/stonks/prices?currency=SGD" class="btn btn-sm ${currency === 'SGD' ? 'btn-primary' : 'btn-outline-primary'}" id="sgd-btn">SGD</a>
            <a href="/stonks/prices?currency=AUD" class="btn btn-sm ${currency === 'AUD' ? 'btn-primary' : 'btn-outline-primary'}" id="aud-btn">AUD</a>
          </div>
          <button class="btn btn-primary btn-sm" onclick="location.reload()">🔄 Refresh</button>
          <a href="/stonks/prices${rebalanceMode ? '' : '?mode=rebalance'}" class="btn btn-warning btn-sm" id="rebalance-btn">
            ${rebalanceMode ? '← Back to Prices' : '⚖️ Rebalance'}
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div id="loading-state">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3 text-muted">Loading portfolio data...</p>
        </div>
      </div>

      <!-- Error State (hidden by default) -->
      <div id="error-state" style="display: none;">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">⚠️ Error Loading Data</h4>
          <p id="error-message"></p>
          <hr>
          <button class="btn btn-danger" onclick="location.reload()">Retry</button>
          <a href="/stonks/config" class="btn btn-outline-danger">Go to Configuration</a>
        </div>
      </div>

      <!-- Main Content (hidden until loaded) -->
      <div id="main-content" style="display: none;">
        <!-- Portfolio Summary -->
        <div class="row g-3 mb-4" id="portfolio-summary">
          <!-- Summary cards will be inserted here by JavaScript -->
        </div>

        <!-- Holdings Table -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3 class="mb-0" id="table-title">Portfolio Holdings</h3>
            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#columnControls" id="column-controls-btn">
              ⚙️ Columns
            </button>
          </div>
          <div class="collapse" id="columnControls">
            <div class="card-body border-bottom">
              <div class="row g-2" id="column-controls-content">
                <!-- Column controls will be inserted here by JavaScript -->
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table id="holdingsTable" class="table table-hover mb-0">
                <thead id="holdings-thead">
                  <!-- Table headers will be inserted here by JavaScript -->
                </thead>
                <tbody id="holdings-tbody">
                  <!-- Table rows will be inserted here by JavaScript -->
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-muted d-flex justify-content-between align-items-center">
            <small>
              <span id="last-updated">Last updated: Loading...</span>
              <span id="cache-badge"></span>
            </small>
            <small class="text-muted" id="cache-stats">
              Loading...
            </small>
          </div>
        </div>

        <!-- Closed Positions (Accordion) -->
        <div id="closed-positions-section">
          <!-- Closed positions will be inserted here by JavaScript -->
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
      
      /* Sticky columns for Name and Symbol - Holdings Table */
      /* Name column (first column) */
      #holdingsTable thead th:nth-child(1),
      #holdingsTable tbody td:nth-child(1) {
        position: sticky;
        left: 0;
        z-index: 10;
      }
      
      /* Symbol column (second column) - offset by approximate width of Name column */
      #holdingsTable thead th:nth-child(2),
      #holdingsTable tbody td:nth-child(2) {
        position: sticky;
        left: 100px; /* Approximate width of Name column */
        z-index: 10;
      }
      
      /* Ensure header cells have higher z-index */
      #holdingsTable thead th:nth-child(1),
      #holdingsTable thead th:nth-child(2) {
        z-index: 11;
      }
      
      /* Ensure cash row (secondary) has proper background */
      #holdingsTable tbody tr.table-secondary td:nth-child(1),
      #holdingsTable tbody tr.table-secondary td:nth-child(2) {
        background-color: #e2e3e5;
      }
      
      /* Add a subtle shadow to the Symbol column to indicate sticky boundary */
      #holdingsTable th:nth-child(2),
      #holdingsTable td:nth-child(2) {
        box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      }
      
      /* Ensure proper width for Name column to match the sticky offset */
      #holdingsTable th:nth-child(1),
      #holdingsTable td:nth-child(1) {
        min-width: 100px;
      }
      
      /* Sticky columns for Name and Symbol - Closed Positions Table */
      /* Name column (first column) */
      #closedPositionsTable thead th:nth-child(1),
      #closedPositionsTable tbody td:nth-child(1) {
        position: sticky;
        left: 0;
        z-index: 10;
      }
      
      /* Symbol column (second column) - offset by approximate width of Name column */
      #closedPositionsTable thead th:nth-child(2),
      #closedPositionsTable tbody td:nth-child(2) {
        position: sticky;
        left: 100px; /* Approximate width of Name column */
        z-index: 10;
      }
      
      /* Ensure header cells have higher z-index */
      #closedPositionsTable thead th:nth-child(1),
      #closedPositionsTable thead th:nth-child(2) {
        z-index: 11;
      }
      
      /* Ensure total row has proper background */
      #closedPositionsTable tbody tr.table-secondary td:nth-child(1),
      #closedPositionsTable tbody tr.table-secondary td:nth-child(2) {
        background-color: #e2e3e5;
      }
      
      /* Handle striped rows in closed positions table */
      #closedPositionsTable tbody tr:nth-of-type(odd) td:nth-child(1),
      #closedPositionsTable tbody tr:nth-of-type(odd) td:nth-child(2) {
      }
      
      /* Add a subtle shadow to the Symbol column to indicate sticky boundary */
      #closedPositionsTable th:nth-child(2),
      #closedPositionsTable td:nth-child(2) {
        box-shadow: 2px 0 5px rgba(0,0,0,0.1);
      }
      
      /* Ensure proper width for Name column to match the sticky offset */
      #closedPositionsTable th:nth-child(1),
      #closedPositionsTable td:nth-child(1) {
        min-width: 100px;
      }
    </style>

    <!-- Load the client-side JavaScript -->
    <script type="module">
      import { initializePricesPage } from '/stonks/client/prices.js';
      
      // Initialize the page when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializePricesPage(${rebalanceMode}, '${currency}');
        });
      } else {
        initializePricesPage(${rebalanceMode}, '${currency}');
      }
    </script>

    ${generateCompanyProfileScript()}
    ${generateCompanyProfileModal()}
  `;

  return createLayout('Live Stock Prices', content, "background-color:#212529;color:#ffffff", false);
}
