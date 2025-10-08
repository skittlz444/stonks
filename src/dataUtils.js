/**
 * Data processing utilities for stock data
 */

/**
 * Get stock holdings as structured objects from database service
 */
export async function getStockHoldings(databaseService) {
  try {
    const holdings = await databaseService.getHoldings();
    if (!holdings || holdings.length === 0) {
      throw new Error("No stock holdings data found");
    }
    return holdings;
  } catch (error) {
    console.error("Error getting stock holdings:", error);
    throw new Error("No stock holdings data found");
  }
}

/**
 * Get only visible stock holdings (for ticker and charts)
 */
export async function getVisibleStockHoldings(databaseService) {
  try {
    const holdings = await databaseService.getVisibleHoldings();
    if (!holdings || holdings.length === 0) {
      throw new Error("No visible stock holdings data found");
    }
    return holdings;
  } catch (error) {
    console.error("Error getting visible stock holdings:", error);
    throw new Error("No visible stock holdings data found");
  }
}

/**
 * @deprecated Use getStockHoldings() instead - this is for backward compatibility
 * Parse stock holdings from database service into legacy string format
 */
export async function parseStockHoldings(databaseService) {
  try {
    // Get structured data and convert to legacy format
    const holdings = await getStockHoldings(databaseService);
    return holdings.map(holding => `"${holding.name}","${holding.symbol}"`);
  } catch (error) {
    // Fallback to compatibility format if structured method fails
    try {
      const holdingsData = await databaseService.getCurrentHoldings();
      if (!holdingsData) {
        throw new Error("No stock holdings data found");
      }
      return holdingsData.split("|");
    } catch (fallbackError) {
      console.error("Error parsing stock holdings:", error);
      throw new Error("No stock holdings data found");
    }
  }
}

/**
 * Format stock data for ticker tape widget
 */
export function formatForTickerTape(stonkPairs) {
  const symbols = [];
  for (const stonkPairIndex in stonkPairs) {
    const stonkSplit = stonkPairs[stonkPairIndex].split(",");
    
    // Clean up the data
    let description = stonkSplit[0] ? stonkSplit[0].trim() : "";
    let symbol = stonkSplit[1] ? stonkSplit[1].trim() : "";
    
    // Remove quotes if present
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1);
    }
    if (symbol.startsWith('"') && symbol.endsWith('"')) {
      symbol = symbol.slice(1, -1);
    }
    
    if (description && symbol) {
      symbols.push(`{"description":"${description}", "proName":"${symbol}"}`);
    }
  }
  return symbols.join(",");
}

/**
 * Format structured holdings data for ticker tape widget (optimized)
 */
export function formatStructuredDataForTickerTape(holdings) {
  const symbols = [];
  for (const holding of holdings) {
    if (holding.name && holding.symbol) {
      symbols.push(`{"description":"${holding.name}", "proName":"${holding.symbol}"}`);
    }
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
 * Format structured holdings data for chart grid (optimized)
 */
export function formatStructuredDataForChartGrid(holdings) {
  const symbols = [];
  for (const holding of holdings) {
    if (holding.name && holding.symbol) {
      symbols.push(`{
          "s": "${holding.symbol}",
          "d": "${holding.name}"
        }`);
    }
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
 * Format structured holdings data for large charts (optimized)
 */
export function formatStructuredDataForLargeChart(holdings) {
  const symbols = [];
  for (let i = 0; i < holdings.length; i++) {
    const holding = holdings[i];
    if (holding.name && holding.symbol) {
      if (i !== holdings.length - 1) {
        symbols.push(`["${holding.name}", "${holding.symbol}|3M|USD"]`);
      } else {
        symbols.push(`["${holding.name}", "${holding.symbol}|3M|USD"]`);
      }
    }
  }
  return symbols.join(",\n");
}

/**
 * Extract symbol from stock pair
 */
export function extractSymbol(stonkPair) {
  const symbol = stonkPair.split(",")[1];
  if (!symbol) return "";
  
  // Clean up symbol
  let cleanSymbol = symbol.trim();
  if (cleanSymbol.startsWith('"') && cleanSymbol.endsWith('"')) {
    cleanSymbol = cleanSymbol.slice(1, -1);
  }
  return cleanSymbol;
}

/**
 * Format structured holdings data for advanced chart watchlist
 */
export function formatStructuredDataForWatchlist(holdings) {
  const symbols = [];
  for (const holding of holdings) {
    if (holding.symbol) {
      symbols.push(`"${holding.symbol}"`);
    }
  }
  return symbols.join(",\n        ");
}

/**
 * Smart formatter that detects data type and uses appropriate formatting
 */
export async function getOptimizedHoldingsData(databaseService, formatType = 'ticker') {
  try {
    // Try to get structured data first (more efficient)
    if (typeof databaseService.getAllHoldings === 'function') {
      const holdings = await databaseService.getAllHoldings();
      if (holdings && holdings.length > 0) {
        switch (formatType) {
          case 'ticker':
            return formatStructuredDataForTickerTape(holdings);
          case 'chartGrid':
            return formatStructuredDataForChartGrid(holdings);
          case 'largeChart':
            return formatStructuredDataForLargeChart(holdings);
          case 'watchlist':
            return formatStructuredDataForWatchlist(holdings);
          case 'raw':
            return holdings;
          default:
            return holdings.map(holding => `"${holding.name}","${holding.symbol}"`);
        }
      }
    }
    
    // Fallback to parsing pipe-separated format
    const stonkPairs = await parseStockHoldings(databaseService);
    switch (formatType) {
      case 'ticker':
        return formatForTickerTape(stonkPairs);
      case 'chartGrid':
        return formatForChartGrid(stonkPairs);
      case 'largeChart':
        return formatForLargeChart(stonkPairs);
      default:
        return stonkPairs;
    }
  } catch (error) {
    console.error("Error getting optimized holdings data:", error);
    throw error;
  }
}