import { useState, useEffect, useRef } from 'react';
import { PricesData } from '../types';

interface UsePricesDataResult {
  data: PricesData | null;
  loading: boolean;
  error: string | null;
  isRefreshing: boolean; // New: indicates data refresh without full loading state
}

export function usePricesData(rebalanceMode: boolean, currency: string): UsePricesDataResult {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only show full loading on initial mount
        if (isInitialMount.current) {
          setLoading(true);
        } else {
          // Show refreshing state for subsequent fetches (currency/mode changes)
          setIsRefreshing(true);
        }
        setError(null);

        const response = await fetch(
          `/stonks/api/prices-data?mode=${rebalanceMode ? 'rebalance' : 'normal'}&currency=${currency}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const jsonData = await response.json() as PricesData & { error?: string };

        if (jsonData.error) {
          throw new Error(jsonData.error);
        }

        setData(jsonData);
        
        if (isInitialMount.current) {
          isInitialMount.current = false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading prices page:', err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, [rebalanceMode, currency]);

  return { data, loading, error, isRefreshing };
}
