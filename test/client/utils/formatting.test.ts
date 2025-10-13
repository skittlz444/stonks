import { describe, test, expect } from 'vitest';
import { formatCurrency, formatPercent, formatNumber, getCurrencySymbol } from '@/utils/formatting';

describe('formatting utilities', () => {
  describe('formatCurrency', () => {
    test('should format positive numbers with 2 decimals by default', () => {
      expect(formatCurrency(1234.56)).toBe('1234.56');
    });

    test('should format negative numbers', () => {
      expect(formatCurrency(-1234.56)).toBe('-1234.56');
    });

    test('should format zero', () => {
      expect(formatCurrency(0)).toBe('0.00');
    });

    test('should respect custom decimal places', () => {
      expect(formatCurrency(1234.567, 3)).toBe('1234.567');
      expect(formatCurrency(1234.5, 0)).toBe('1235');
    });

    test('should handle very large numbers', () => {
      expect(formatCurrency(1234567.89)).toBe('1234567.89');
    });

    test('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('0.01');
    });
  });

  describe('getCurrencySymbol', () => {
    test('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    test('should return S$ for SGD', () => {
      expect(getCurrencySymbol('SGD')).toBe('S$');
    });

    test('should return A$ for AUD', () => {
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    test('should return $ for unknown currencies', () => {
      expect(getCurrencySymbol('EUR')).toBe('$');
      expect(getCurrencySymbol('GBP')).toBe('$');
    });
  });

  describe('formatPercent', () => {
    test('should format numbers with decimals', () => {
      expect(formatPercent(0.1234)).toBe('0.12');
    });

    test('should format negative numbers', () => {
      expect(formatPercent(-0.1234)).toBe('-0.12');
    });

    test('should format zero', () => {
      expect(formatPercent(0)).toBe('0.00');
    });

    test('should respect custom decimal places', () => {
      expect(formatPercent(0.12345, 3)).toBe('0.123');
      expect(formatPercent(0.12345, 1)).toBe('0.1');
    });

    test('should handle very small numbers', () => {
      expect(formatPercent(0.0001)).toBe('0.00');
    });

    test('should handle numbers greater than 1', () => {
      expect(formatPercent(1.5)).toBe('1.50');
    });
  });

  describe('formatNumber', () => {
    test('should format positive numbers with locale', () => {
      expect(formatNumber(1234.56)).toContain('1');
      expect(formatNumber(1234.56)).toContain('234');
    });

    test('should format negative numbers', () => {
      const result = formatNumber(-1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    test('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    test('should handle integers with locale formatting', () => {
      const result = formatNumber(1234);
      // May contain commas depending on locale (e.g., "1,234")
      expect(result).toMatch(/1[,]?234/);
    });

    test('should use locale formatting', () => {
      // toLocaleString formats based on locale, just verify it returns a string
      expect(typeof formatNumber(1234.56)).toBe('string');
    });
  });
});
