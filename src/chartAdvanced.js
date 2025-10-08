import { generateHTMLHeader, generateFooter, createResponse } from './utils.js';
import { generateAdvancedChartWidget } from './chartWidgets.js';
import { getVisibleStockHoldings, formatStructuredDataForWatchlist } from './dataUtils.js';

/**
 * Generate the advanced chart page with full-screen TradingView chart
 */
export async function generateAdvancedChartPage(databaseService) {
  const holdings = await getVisibleStockHoldings(databaseService);
  const watchlistSymbols = formatStructuredDataForWatchlist(holdings);

  // Generate advanced chart widget
  const advancedChart = generateAdvancedChartWidget(watchlistSymbols);
  
  // Create full-screen layout with navigation at bottom
  const content = `
    <div style="height:calc(100vh - 80px);width:100%">
      ${advancedChart}
    </div>`;
  
  const html = `${generateHTMLHeader()}
    <body style="background-color:#212529;margin:0px;height:100vh">
    ${content}
    ${generateFooter()}
    </html>`;
  
  return createResponse(html);
}
