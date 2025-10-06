/**
 * Shared utilities for generating HTML components
 */

export function generateHTMLHeader() {
  return `<!DOCTYPE html>
    <head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
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
 */
export function createLayout(title, content, bodyStyles = "background-color:#212529;color:#ffffff") {
  return createResponse(`<!DOCTYPE html>
<html lang="en" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-LN+7fdVzj6u52u30Kp6M/trliBMCMKTyK833zpbD+pXdCLuTusPj697FH4R/5mcr" crossorigin="anonymous">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js" integrity="sha384-ndDqU0Gzau9qJ1lfW4pNLlhNTkCfHzAVBReH9diLvGRem5+R9g2FzA8ZGN954O5Q" crossorigin="anonymous"></script>
</head>
<body style="${bodyStyles}">
    ${content}
    ${generateFooter()}
</html>`);
}

export function createResponse(html) {
  return new Response(html, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  });
}