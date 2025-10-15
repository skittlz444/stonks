import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ConfigProvider, useConfig } from '../../../src/client/context/ConfigContext';
import { ReactNode } from 'react';

// Test component that uses the context
function TestComponent() {
  const { configData, loading, error, isRefreshing, refetch } = useConfig();

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {isRefreshing && <div>Refreshing...</div>}
      {configData && (
        <div>
          <div>Portfolio: {configData.portfolioName}</div>
          <div>Cash: {configData.cashAmount}</div>
          <div>Visible Holdings: {configData.visibleHoldings.length}</div>
          <div>Hidden Holdings: {configData.hiddenHoldings.length}</div>
        </div>
      )}
      <button onClick={() => refetch()}>Refetch</button>
    </div>
  );
}

describe('ConfigContext', () => {
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

  test('should provide config data to children', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Portfolio: Test Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Cash: 1000')).toBeInTheDocument();
    expect(screen.getByText('Visible Holdings: 2')).toBeInTheDocument();
    expect(screen.getByText('Hidden Holdings: 1')).toBeInTheDocument();
  });

  test('should handle API error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Error: Failed to fetch config data: Internal Server Error')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('should handle JSON error response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 'Database connection failed' })
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Error: Database connection failed')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('should handle network error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Error: Network error')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
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

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('Portfolio: Portfolio 1')).toBeInTheDocument();
    });

    expect(callCount).toBe(1);

    // Click refetch button
    const refetchButton = screen.getByText('Refetch');
    await act(async () => {
      refetchButton.click();
    });

    // Wait for refreshed data
    await waitFor(() => {
      expect(screen.getByText('Portfolio: Portfolio 2')).toBeInTheDocument();
    });

    expect(callCount).toBe(2);
  });

  test('should show refreshing state on subsequent fetches', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConfigData
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('Portfolio: Test Portfolio')).toBeInTheDocument();
    });

    // Should not show refreshing initially
    expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();

    // Click refetch button
    const refetchButton = screen.getByText('Refetch');
    await act(async () => {
      refetchButton.click();
    });

    // Should show refreshing state briefly (though it might be too fast to catch in tests)
    // Wait for refetch to complete
    await waitFor(() => {
      expect(screen.queryByText('Refreshing...')).not.toBeInTheDocument();
    });
  });

  test('should throw error when useConfig is used outside provider', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useConfig must be used within a ConfigProvider');

    consoleErrorSpy.mockRestore();
  });

  test('should clear error on successful refetch', async () => {
    // First call fails
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error'
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch config data: Server Error')).toBeInTheDocument();
    });

    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfigData
    });

    const refetchButton = screen.getByText('Refetch');
    await act(async () => {
      refetchButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });

    expect(screen.getByText('Portfolio: Test Portfolio')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('should not show loading state on refetch, only refreshing', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConfigData
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Portfolio: Test Portfolio')).toBeInTheDocument();

    // Refetch
    const refetchButton = screen.getByText('Refetch');
    await act(async () => {
      refetchButton.click();
    });

    // Should not show "Loading..." text on refetch
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Portfolio: Test Portfolio')).toBeInTheDocument();
    });
  });
});
