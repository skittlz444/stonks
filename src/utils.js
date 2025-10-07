/**
 * Shared utilities for generating HTML components
 */

/**
 * Generate complete HTML header with PWA features
 * @param {string} title - Page title (default: "Stonks Portfolio Tracker")
 * @param {string} theme - Bootstrap theme attribute (default: "dark")
 */
export function generateHTMLHeader(title = "Stonks Portfolio Tracker", theme = "dark") {
  return `<!DOCTYPE html>
<html lang="en" data-bs-theme="${theme}">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Track your portfolio holdings, prices, and rebalancing recommendations">
    <meta name="theme-color" content="#1E4A73">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Stonks">
    <title>${title}</title>
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/stonks/manifest.json">
    
    <!-- Icons -->
    <link rel="icon" type="image/svg+xml" href="/stonks/icons/favicon.svg">
    <link rel="icon" type="image/png" sizes="192x192" href="/stonks/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/stonks/icons/icon-512x512.png">
    <link rel="apple-touch-icon" sizes="192x192" href="/stonks/icons/icon-192x192.png">
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    
    <!-- Service Worker Registration -->
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/stonks/sw.js')
            .then(registration => {
              console.log('Service Worker registered:', registration.scope);
            })
            .catch(error => {
              console.error('Service Worker registration failed:', error);
            });
        });
      }
    </script>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q" crossorigin="anonymous"></script>
    </head>`;
}

/**
 * Generate standard page layout with dark theme
 */
export function generatePageLayout(content, bodyStyles = "background-color:#212529;margin:0px") {
  return `${generateHTMLHeader()}
    <body style="${bodyStyles}">
    ${content}
    ${generateFooter()}
    </html>`;
}

/**
 * Generate grid container for charts
 */
export function generateGridContainer(content, gridClasses = "row-cols-1 row-cols-xs-2 row-cols-sm-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6") {
  return `
    <div class="container-fluid" style="padding-top:40px">
      <div class="row g-0 ${gridClasses}">
        ${content}
      </div>
    </div>`;
}

/**
 * Generate chart grid layout for mini charts
 */
export function generateChartGridLayout(content) {
  return `
    <div class="container-fluid">
      <div class="row g-0 row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3">
        ${content}
      </div>
    </div>`;
}

/**
 * Generate full-height container for large charts
 */
export function generateFullHeightContainer(content) {
  return `
    <div class="container-fluid" style="height:100vh">
      ${content}
    </div>`;
}

/**
 * Generate standardized button-based navigation footer
 */
export function generateNavigation() {
  return `
    <div class="container mt-4 mb-4">
      <div class="card bg-dark border-secondary">
        <div class="card-body text-center">
          <a href="/stonks/prices" class="btn btn-outline-success me-2 mb-2">📊 Live Prices</a>
          <a href="/stonks/ticker" class="btn btn-outline-info me-2 mb-2">📈 Ticker View</a>
          <a href="/stonks/charts" class="btn btn-outline-info me-2 mb-2">📉 Grid Charts</a>
          <a href="/stonks/charts/large" class="btn btn-outline-info mb-2">📊 Large Charts</a>
          <a href="/stonks/config" class="btn btn-outline-light me-2 mb-2">⚙️ Config</a>
        </div>
      </div>
    </div>`;
}

export function generateFooter() {
  return `${generateNavigation()}</body>`;
}

/**
 * Create a complete HTML layout with Bootstrap and proper structure
 * @param {string} title - Page title
 * @param {string} content - HTML content for the page body
 * @param {string} bodyStyles - CSS styles for the body tag
 * @param {boolean} includeFooter - Whether to include footer navigation (default: true)
 */
export function createLayout(title, content, bodyStyles = "background-color:#212529;color:#ffffff", includeFooter = true) {
  return createResponse(`${generateHTMLHeader(title, "dark")}
<body style="${bodyStyles}">
    ${content}
    ${includeFooter ? generateFooter() : '</body>'}
</html>`);
}

export function createResponse(html) {
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
}

/**
 * Generate company profile modal HTML
 * Bootstrap modal for displaying TradingView company profile widget
 */
export function generateCompanyProfileModal() {
  return `
    <!-- Company Profile Modal -->
    <div class="modal fade" id="companyProfileModal" tabindex="-1" aria-labelledby="companyProfileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-scrollable" style="max-height: 95vh;">
        <div class="modal-content" style="height: 95vh;">
          <div class="modal-header">
            <h5 class="modal-title" id="companyProfileModalLabel">Company Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="flex: 1; overflow: hidden;">
            <div id="companyProfileWidgetContainer" style="height: 100%;"></div>
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * Generate company profile script
 * JavaScript function to show modal and load TradingView company profile widget
 */
export function generateCompanyProfileScript() {
  return `
    <script>
      // Function to show company profile modal
      function showCompanyProfile(symbol, name) {
        document.getElementById('companyProfileModalLabel').textContent = name + ' - Company Profile';
        const widgetContainer = document.getElementById('companyProfileWidgetContainer');
        
        // Clear existing widget
        widgetContainer.innerHTML = '';
        
        // Create new widget container
        const container = document.createElement('div');
        container.className = 'tradingview-widget-container';
        container.style.height = '100%';
        
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetDiv);
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
          width: '100%',
          height: '100%',
          isTransparent: false,
          colorTheme: 'dark',
          symbol: symbol,
          locale: 'en'
        });
        
        container.appendChild(script);
        widgetContainer.appendChild(container);
        
        const modal = new bootstrap.Modal(document.getElementById('companyProfileModal'));
        modal.show();
      }
      
      // Make function globally available
      window.showCompanyProfile = showCompanyProfile;
    </script>`;
}