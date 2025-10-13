import { createLayout, generateCompanyProfileModal, generateCompanyProfileScript, generateTopNavigation } from './utils.js';

/**
 * Generate the client-side prices page wrapper with skeleton loading
 * This page loads data via API calls instead of server-side rendering
 */
export function generatePricesPageClient(rebalanceMode = false, currency = 'USD') {
  const content = `
    <div id="root"></div>
    ${generateCompanyProfileScript()}
    ${generateCompanyProfileModal()}
    <script type="module" src="/stonks/dist/prices.js"></script>
  `;

  return createLayout('Live Stock Prices', content, "background-color:#212529;color:#ffffff", false);
}
