import { createLayout } from './utils.js';

/**
 * Generate the ticker tape page with React
 */
export async function generateTickerPage(databaseService) {
  const content = `
    <div id="root"></div>
    <script type="module" src="/stonks/dist/ticker.js"></script>
  `;

  return createLayout('Ticker Tape', content, "background-color:#212529", false);
}