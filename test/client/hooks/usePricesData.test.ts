import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePricesData } from '../../../src/client/hooks/usePricesData';

describe('usePricesData', () => {
  const mockPricesData = {
    holdings: [
      {
        id: 1,
        name: 'Test Stock',
        code: 'BATS:TEST',
        quantity: 10,
        quote: {
          current: 100,
          previousClose: 95,
          previous_close: 95,
          change: 5,
          changePercent: 5.26,
          percent_change: 5.26,
          high: 105,
          low: 95,
          open: 96,
          timestamp: Date.now()
        },
        marketValue: 1000,
        costBasis: 900,
        gain: 100,
        gainPercent: 11.11,
        currentWeight: 50,
        targetWeight: 50
      }
    ],
    closedPositions: [],
    portfolioTotal: 2000,
    totalMarketValue: 1000,
    cashAmount: 1000,
    totalChangeValue: 50,
    totalChangePercent: 5,
    totalGain: 100,
    totalGainPercent: 10,
    totalWeightDeviation: 0,
    fxRates: null,
    currency: 'USD'
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should fetch prices data on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPricesData
    });

    const { result } = renderHook(() => usePricesData(false, 'USD'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockPricesData);
    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith('/api/prices-data?mode=normal&currency=USD');
  });

  test('should fetch rebalance mode data when rebalanceMode is true', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPricesData
    });

    const { result } = renderHook(() => usePricesData(true, 'USD'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/prices-data?mode=rebalance&currency=USD');
  });

  test('should fetch data with different currency', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPricesData
    });

    const { result } = renderHook(() => usePricesData(false, 'SGD'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/prices-data?mode=normal&currency=SGD');
  });

  test('should handle API error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => usePricesData(false, 'USD'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Failed to fetch data: Internal Server Error');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  test('should handle JSON error response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Database connection failed' })
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => usePricesData(false, 'USD'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Database connection failed');

    consoleErrorSpy.mockRestore();
  });

  test('should handle network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => usePricesData(false, 'USD'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');

    consoleErrorSpy.mockRestore();
  });

  test('should show refreshing state on subsequent fetches', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPricesData
    });

    const { result, rerender } = renderHook(
      ({ mode, currency }) => usePricesData(mode, currency),
      { initialProps: { mode: false, currency: 'USD' } }
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isRefreshing).toBe(false);

    // Change currency to trigger refetch
    rerender({ mode: false, currency: 'SGD' });

    // Should show refreshing state
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.loading).toBe(false); // loading should remain false
  });

  test('should refetch when rebalance mode changes', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockPricesData
    });

    const { result, rerender } = renderHook(
      ({ mode, currency }) => usePricesData(mode, currency),
      { initialProps: { mode: false, currency: 'USD' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/prices-data?mode=normal&currency=USD');

    // Change to rebalance mode
    rerender({ mode: true, currency: 'USD' });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/prices-data?mode=rebalance&currency=USD');
    });
  });
});
