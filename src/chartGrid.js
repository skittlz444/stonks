import { createLayout } from './utils.js';

/**
 * Generate the chart grid page with React
 */
export async function generateChartGridPage(databaseService) {
  const content = `
    <div id="root"></div>
    <script type="module" src="/stonks/dist/chartGrid.js"></script>
  `;

  return createLayout('Chart Grid', content, "background-color:#212529;margin:0px;height:100vh", false);
}