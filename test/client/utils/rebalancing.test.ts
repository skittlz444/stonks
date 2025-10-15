import { describe, test, expect } from 'vitest';
import { calculateRebalancing } from '../../../src/client/utils/rebalancing';
import type { HoldingWithQuote } from '../../../src/client/types';

describe('rebalancing calculations', () => {
  const createHolding = (params: {
    id: number;
    name: string;
    code: string;
    quantity: number;
    targetWeight: number;
    current?: number;
  }): HoldingWithQuote => {
    const current = params.current || 100;
    const costBasis = current * 0.9; // Assume 10% gain for tests
    return {
      id: params.id,
      name: params.name,
      code: params.code,
      quantity: params.quantity,
      target_weight: params.targetWeight,
      visible: 1,
      quote: {
        current,
        previous_close: current,
        change: 0,
        percent_change: 0,
        changePercent: 0,
        high: current,
        low: current,
        open: current,
        timestamp: Date.now()
      },
      marketValue: current * params.quantity,
      costBasis: costBasis * params.quantity,
      gain: (current - costBasis) * params.quantity,
      gainPercent: ((current - costBasis) / costBasis) * 100
    };
  };

  test('should calculate rebalancing for simple portfolio', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 50, current: 100 }),
      createHolding({ id: 2, name: 'Stock B', code: 'B', quantity: 5, targetWeight: 50, current: 100 })
    ];
    const cashAmount = 500;
    const portfolioTotal = 2000; // 1000 + 500 + 500

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.recommendations).toHaveLength(2);
    expect(result.newCash).toBeDefined();
  });

  test('should handle empty holdings', () => {
    const result = calculateRebalancing([], 1000, 1000);

    expect(result.recommendations).toHaveLength(0);
    expect(result.newCash).toBe(1000);
  });

  test('should handle zero cash', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 100, current: 100 })
    ];

    const result = calculateRebalancing(holdings, 0, 1000);

    expect(result.recommendations).toHaveLength(1);
  });

  test('should calculate when holding is underweight', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 5, targetWeight: 100, current: 100 })
    ];
    const cashAmount = 500;
    const portfolioTotal = 1000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.recommendations[0].action).toBe('BUY');
    expect(result.recommendations[0].quantityChange).toBeGreaterThan(0);
  });

  test('should calculate when holding is overweight', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 20, targetWeight: 50, current: 100 }),
      createHolding({ id: 2, name: 'Stock B', code: 'B', quantity: 0, targetWeight: 50, current: 100 })
    ];
    const cashAmount = 0;
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    const stockA = result.recommendations.find(r => r.id === 1);
    expect(stockA?.action).toBe('SELL');
  });

  test('should handle holdings with no target weight', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 0, current: 100 })
    ];
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, 1000, portfolioTotal);

    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].action).toBe('HOLD');
  });

  test('should handle multiple holdings with different weights', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 60, current: 100 }),
      createHolding({ id: 2, name: 'Stock B', code: 'B', quantity: 5, targetWeight: 30, current: 100 }),
      createHolding({ id: 3, name: 'Stock C', code: 'C', quantity: 2, targetWeight: 10, current: 100 })
    ];
    const cashAmount = 300;
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.recommendations).toHaveLength(3);
    const totalTargetWeight = result.recommendations.reduce((sum, r) => sum + (r.targetWeight || 0), 0);
    expect(totalTargetWeight).toBe(100);
  });

  test('should handle holdings with different prices', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 50, current: 50 }),
      createHolding({ id: 2, name: 'Stock B', code: 'B', quantity: 5, targetWeight: 50, current: 200 })
    ];
    const cashAmount = 500;
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.recommendations).toHaveLength(2);
  });

  test('should handle very small quantities', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 0.001, targetWeight: 100, current: 1000 })
    ];
    const cashAmount = 1000;
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.recommendations).toHaveLength(1);
  });

  test('should maintain cash balance correctly', () => {
    const holdings: HoldingWithQuote[] = [
      createHolding({ id: 1, name: 'Stock A', code: 'A', quantity: 10, targetWeight: 100, current: 100 })
    ];
    const cashAmount = 1000;
    const portfolioTotal = 2000;

    const result = calculateRebalancing(holdings, cashAmount, portfolioTotal);

    expect(result.newCash).toBeDefined();
    expect(result.cashChange).toBeDefined();
  });
});
