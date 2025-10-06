import { generatePageLayout, generateFullHeightContainer, createResponse } from './utils.js';
import { generateSymbolOverviewWidget } from './chartWidgets.js';
import { getStockHoldings, formatStructuredDataForLargeChart } from './dataUtils.js';

/**
 * Generate the large chart page (originally chart-large.js)
 */
export async function generateLargeChartPage(databaseService) {
  const holdings = await getStockHoldings(databaseService);
  const chartSymbols = formatStructuredDataForLargeChart(holdings);

  // Generate symbol overview widget
  const symbolOverview = generateSymbolOverviewWidget(chartSymbols);
  
  // Wrap in full height container
  const content = generateFullHeightContainer(symbolOverview);
  
  return createResponse(generatePageLayout(content, "background-color:#212529;height:100vh"));
}