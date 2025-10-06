import { generatePageLayout, generateChartGridLayout, createResponse } from './utils.js';
import { generateMiniSymbolWidget, generateMarketOverviewWidget } from './chartWidgets.js';
import { getStockHoldings, formatStructuredDataForChartGrid } from './dataUtils.js';

/**
 * Generate the chart grid page (originally chart-grid.js)
 */
export async function generateChartGridPage(databaseService) {
  const holdings = await getStockHoldings(databaseService);
  const marketSymbols = formatStructuredDataForChartGrid(holdings);

  // Generate mini symbol widgets
  let miniWidgets = "";
  for (const holding of holdings) {
    miniWidgets += generateMiniSymbolWidget(`"${holding.symbol}"`);
  }
  
  // Generate market overview widget
  const marketOverview = generateMarketOverviewWidget(marketSymbols);
  
  // Combine all content in a proper Bootstrap layout
  const content = `
    <div class="container-fluid">
      <div class="row g-0 row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3">
        ${miniWidgets}
      </div>
      <div class="row justify-content-center row-cols-md-12 row-cols-xl-2">
          ${marketOverview}
      </div>
    </div>`;
  
  return createResponse(generatePageLayout(content, "background-color:#212529;margin:0px;height:100vh"));
}