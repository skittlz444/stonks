/**
 * Formatting utilities for currency and numbers
 */

export function formatCurrency(amount: number, decimals: number = 2, currency: string = 'USD'): string {
  const value = amount.toFixed(decimals);
  
  if (currency === 'SGD') {
    return `S$${value}`;
  } else if (currency === 'USD') {
    return `$${value}`;
  } else if (currency === 'AUD') {
    return `A$${value}`;
  }
  
  return `$${value}`;
}

export function formatCurrencyWithCode(amount: number, decimals: number = 2, currency: string = 'USD', showCode: boolean = true): string {
  const value = amount.toFixed(decimals);
  
  if (currency === 'SGD') {
    return `S$${value}`;
  } else if (currency === 'USD') {
    if (showCode) {
      return `USD $${value}`;
    }
    return `$${value}`;
  } else if (currency === 'AUD') {
    return `A$${value}`;
  }
  
  return `$${value}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'SGD': 'S$',
    'AUD': 'A$',
  };
  return symbols[currency] || '$';
}
