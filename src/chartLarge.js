import { createLayout } from './utils.js';

/**
 * Generate the large chart page with React
 */
export async function generateLargeChartPage(databaseService) {
  const content = `
    <div id="root"></div>
    <script type="module" src="/stonks/dist/chartLarge.js"></script>
  `;

  return createLayout('Large Chart', content, "background-color:#212529;height:100vh", false);
}