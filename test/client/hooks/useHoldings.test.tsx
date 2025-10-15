import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHoldings } from '../../../src/client/hooks/useHoldings';
import { ConfigProvider } from '../../../src/client/context/ConfigContext';
import { ReactNode } from 'react';

describe('useHoldings', () => {
  const mockConfigData = {
    visibleHoldings: [
      { id: 1, name: 'Stock 1', code: 'BATS:TEST1', targetWeight: 50, quantity: 10 },
      { id: 2, name: 'Stock 2', code: 'BATS:TEST2', targetWeight: 50, quantity: 5 }
    ],
    hiddenHoldings: [],
    transactions: [],
    cashAmount: 1000,
    portfolioName: 'Test Portfolio',
    apiKeys: { finnhub: null, openExchangeRates: null }
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ConfigProvider>{children}</ConfigProvider>
  );

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should return holdings from config context', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    const { result } = renderHook(() => useHoldings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.holdings).toEqual(mockConfigData.visibleHoldings);
    expect(result.current.cashAmount).toBe(1000);
    expect(result.current.error).toBe(null);
  });

  test('should return empty array when config data is loading', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useHoldings(), { wrapper });

    expect(result.current.holdings).toEqual([]);
    expect(result.current.cashAmount).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  test('should return error state from config context', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useHoldings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.holdings).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch config data: Server Error');

    consoleErrorSpy.mockRestore();
  });

  test('should return loading state from config context', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useHoldings(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.holdings).toEqual([]);
  });

  test('should handle empty visible holdings', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockConfigData, visibleHoldings: [] })
    });

    const { result } = renderHook(() => useHoldings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.holdings).toEqual([]);
    expect(result.current.cashAmount).toBe(1000);
  });

  test('should handle zero cash amount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockConfigData, cashAmount: 0 })
    });

    const { result } = renderHook(() => useHoldings(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cashAmount).toBe(0);
  });
});
