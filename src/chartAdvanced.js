import { createLayout } from './utils.js';

/**
 * Generate the advanced chart page with React
 */
export async function generateAdvancedChartPage(databaseService) {
  const content = `
    <div id="root"></div>
    <script type="module" src="/stonks/dist/chartAdvanced.js"></script>
  `;

  return createLayout('Advanced Chart', content, "background-color:#212529;margin:0px;height:100vh", false);
}
