import { generatePageLayout, generateFullHeightContainer, createResponse } from './utils.js';
import { generateSymbolOverviewWidget } from './chartWidgets.js';
import { parseStockHoldings, formatForLargeChart } from './dataUtils.js';

/**
 * Generate the large chart page (originally chart-large.js)
 */
export async function generateLargeChartPage(stonksKV) {
  const stonkPairs = await parseStockHoldings(stonksKV);
  const chartSymbols = formatForLargeChart(stonkPairs);

  // Generate symbol overview widget
  const symbolOverview = generateSymbolOverviewWidget(chartSymbols);
  
  // Wrap in full height container
  const content = generateFullHeightContainer(symbolOverview);
  
  return createResponse(generatePageLayout(content, "background-color:black;height:100vh"));
}