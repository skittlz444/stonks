/**
 * Formatting utilities for currency and numbers
 */

export function formatCurrency(amount: number, decimals: number = 2): string {
  return amount.toFixed(decimals);
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
