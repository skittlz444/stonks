import { createLayout, generateCompanyProfileModal, generateCompanyProfileScript } from './utils.js';

/**
 * Generate the client-side config page wrapper with React
 * This page loads the React config application
 */
export function generateConfigPageClient() {
  const content = `
    <div id="root"></div>
    ${generateCompanyProfileScript()}
    ${generateCompanyProfileModal()}
    <script type="module" src="/stonks/dist/config.js"></script>
  `;

  return createLayout('Portfolio Configuration', content, "background-color:#212529;color:#ffffff", false);
}
