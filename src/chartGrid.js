import { generatePageLayout, generateChartGridLayout, createResponse } from './utils.js';
import { generateMiniSymbolWidget, generateMarketOverviewWidget } from './chartWidgets.js';
import { parseStockHoldings, formatForChartGrid, extractSymbol } from './dataUtils.js';

/**
 * Generate the chart grid page (originally chart-grid.js)
 */
export async function generateChartGridPage(stonksKV) {
  const stonkPairs = await parseStockHoldings(stonksKV);
  const marketSymbols = formatForChartGrid(stonkPairs);

  // Generate mini symbol widgets
  let miniWidgets = "";
  for (const stonkPair of stonkPairs) {
    const symbol = extractSymbol(stonkPair);
    miniWidgets += generateMiniSymbolWidget(symbol);
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
  
  return createResponse(generatePageLayout(content, "background-color:black;margin:0px;height:100vh"));
}