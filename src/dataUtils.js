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
    // Skip empty entries
    if (!stonkPairs[stonkPairIndex] || !stonkPairs[stonkPairIndex].trim()) {
      continue;
    }
    
    const stonkSplit = stonkPairs[stonkPairIndex].split(",");
    
    // Skip if we don't have both description and symbol
    if (stonkSplit.length < 2) {
      continue;
    }
    
    let description = stonkSplit[0];
    let symbol = stonkSplit[1];
    
    // Clean up description - remove leading/trailing whitespace and newlines
    description = description.trim();
    if (description.startsWith('\n')) {
      description = description.slice(1);
    }
    description = description.trim();
    
    // Clean up symbol - remove leading/trailing whitespace and newlines
    symbol = symbol.trim();
    if (symbol.startsWith('\n')) {
      symbol = symbol.slice(1);
    }
    symbol = symbol.trim();
    
    // Remove quotes from both description and symbol if present
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1);
    }
    if (symbol.startsWith('"') && symbol.endsWith('"')) {
      symbol = symbol.slice(1, -1);
    }
    
    // Skip if either is empty after cleaning
    if (!description || !symbol) {
      continue;
    }
    
    symbols.push(`{
          "s": "${symbol}",
          "d": "${description}"
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