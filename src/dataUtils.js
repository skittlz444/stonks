/**
 * Data processing utilities for stock data
 */

/**
 * Parse stock holdings from KV data
 */
export async function parseStockHoldings(stonksKV) {
  const holdingsData = await stonksKV.get("currentHoldings");
  if (!holdingsData) {
    throw new Error("No stock holdings data found");
  }
  return holdingsData.split("|");
}

/**
 * Format stock data for ticker tape widget
 */
export function formatForTickerTape(stonkPairs) {
  const symbols = [];
  for (const stonkPairIndex in stonkPairs) {
    const stonkSplit = stonkPairs[stonkPairIndex].split(",");
    symbols.push(`{"description":${stonkSplit[0]}, "proName":${stonkSplit[1]}}`);
  }
  return symbols.join(",");
}

/**
 * Format stock data for chart grid (market overview)
 */
export function formatForChartGrid(stonkPairs) {
  const symbols = [];
  for (const stonkPairIndex in stonkPairs) {
    const stonkSplit = stonkPairs[stonkPairIndex].split(",");
    let description = stonkSplit[0];
    let symbol = stonkSplit[1];
    
    if (description[0] === "\n") {
      description = description.slice(1, description.length);
    }
    
    // Remove quotes from symbol if present and re-add them properly
    if (symbol.startsWith('"')) {
      symbol = symbol.slice(1);
    }
    if (symbol.endsWith('"')) {
      symbol = symbol.slice(0, -1);
    }
    
    symbols.push(`{
          "s": "${symbol}",
          "d": ${description}
        }`);
  }
  return symbols.join(",\n");
}

/**
 * Format stock data for large charts
 */
export function formatForLargeChart(stonkPairs) {
  const symbols = [];
  for (const stonkPairIndex in stonkPairs) {
    const stonkSplit = stonkPairs[stonkPairIndex].split(",");
    
    if (stonkPairIndex != stonkPairs.length - 1) {
      symbols.push(`[${stonkSplit[0]}, ${stonkSplit[1].slice(0, -2)}|3M|USD"]`);
    } else {
      symbols.push(`[${stonkSplit[0]}, ${stonkSplit[1].slice(0, -1)}|3M|USD"]`);
    }
  }
  return symbols.join(",\n");
}

/**
 * Extract symbol from stock pair
 */
export function extractSymbol(stonkPair) {
  return stonkPair.split(",")[1];
}