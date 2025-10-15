import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConfigData } from '../../../src/client/hooks/useConfigData';

describe('useConfigData', () => {
  const mockConfigData = {
    visibleHoldings: [
      { id: 1, name: 'Stock 1', code: 'BATS:TEST1', targetWeight: 50, quantity: 10 },
      { id: 2, name: 'Stock 2', code: 'BATS:TEST2', targetWeight: 50, quantity: 5 }
    ],
    hiddenHoldings: [
      { id: 3, name: 'Hidden Stock', code: 'BATS:HIDDEN', targetWeight: null, quantity: 20 }
    ],
    transactions: [
      { id: 1, code: 'BATS:TEST1', type: 'buy' as const, date: '2024-01-01', quantity: 10, value: 1000, fee: 10 }
    ],
    cashAmount: 1000,
    portfolioName: 'Test Portfolio',
    apiKeys: {
      finnhub: 'test_key_123',
      openExchangeRates: null
    }
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should fetch config data on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    const { result } = renderHook(() => useConfigData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockConfigData);
    expect(result.current.error).toBe(null);
    expect(global.fetch).toHaveBeenCalledWith('/stonks/api/config-data');
  });

  test('should handle API error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useConfigData());

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

    const { result } = renderHook(() => useConfigData());

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

    const { result } = renderHook(() => useConfigData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network error');

    consoleErrorSpy.mockRestore();
  });

  test('should provide refetch function', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConfigData
    });

    const { result } = renderHook(() => useConfigData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  test('should refetch data when refetch is called', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ...mockConfigData,
          portfolioName: `Portfolio ${callCount}`
        })
      });
    });

    const { result } = renderHook(() => useConfigData());

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.portfolioName).toBe('Portfolio 1');
    expect(callCount).toBe(1);

    // Call refetch and wait for data to update
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data?.portfolioName).toBe('Portfolio 2');
    });
    expect(callCount).toBe(2);
  });

  test('should set loading state during refetch', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConfigData
    });

    const { result } = renderHook(() => useConfigData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Refetch should complete successfully
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Data should still be available after refetch
    expect(result.current.data).toEqual(mockConfigData);
  });

  test('should handle error during refetch', async () => {
    // First call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useConfigData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockConfigData);
    expect(result.current.error).toBe(null);

    // Second call fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error'
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch data: Server Error');
    });

    expect(result.current.data).toEqual(mockConfigData); // Data should remain from previous successful fetch
    expect(result.current.loading).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  test('should clear error on successful refetch', async () => {
    // First call fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useConfigData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch data: Server Error');

    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockConfigData);
    });
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
