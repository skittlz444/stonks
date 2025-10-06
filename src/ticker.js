import { generatePageLayout, generateGridContainer, createResponse } from './utils.js';
import { generateTickerTapeWidget, generateSingleQuoteWidget } from './chartWidgets.js';
import { getVisibleStockHoldings, formatStructuredDataForTickerTape } from './dataUtils.js';

/**
 * Generate the ticker tape page (originally ticker.js)
 */
export async function generateTickerPage(databaseService) {
  const holdings = await getVisibleStockHoldings(databaseService);
  const tickerSymbols = formatStructuredDataForTickerTape(holdings);

  // Generate ticker tape widget
  const tickerTape = generateTickerTapeWidget(tickerSymbols);
  
  // Generate individual quote widgets
  let quoteWidgets = "";
  for (const holding of holdings) {
    quoteWidgets += generateSingleQuoteWidget(`"${holding.symbol}"`);
  }
  
  // Combine all content
  const content = tickerTape + generateGridContainer(quoteWidgets);
  
  return createResponse(generatePageLayout(content));
}