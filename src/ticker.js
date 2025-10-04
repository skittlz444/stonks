import { generatePageLayout, generateGridContainer, createResponse } from './utils.js';
import { generateTickerTapeWidget, generateSingleQuoteWidget } from './chartWidgets.js';
import { parseStockHoldings, formatForTickerTape, extractSymbol } from './dataUtils.js';

/**
 * Generate the ticker tape page (originally ticker.js)
 */
export async function generateTickerPage(stonksKV) {
  const stonkPairs = await parseStockHoldings(stonksKV);
  const tickerSymbols = formatForTickerTape(stonkPairs);

  // Generate ticker tape widget
  const tickerTape = generateTickerTapeWidget(tickerSymbols);
  
  // Generate individual quote widgets
  let quoteWidgets = "";
  for (const stonkPair of stonkPairs) {
    const symbol = extractSymbol(stonkPair);
    quoteWidgets += generateSingleQuoteWidget(symbol);
  }
  
  // Combine all content
  const content = tickerTape + generateGridContainer(quoteWidgets);
  
  return createResponse(generatePageLayout(content));
}