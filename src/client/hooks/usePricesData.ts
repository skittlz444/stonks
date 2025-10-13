import { useState, useEffect } from 'react';
import { PricesData } from '../types';

interface UsePricesDataResult {
  data: PricesData | null;
  loading: boolean;
  error: string | null;
}

export function usePricesData(rebalanceMode: boolean, currency: string): UsePricesDataResult {
  const [data, setData] = useState<PricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/stonks/api/prices-data?mode=${rebalanceMode ? 'rebalance' : 'normal'}&currency=${currency}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const jsonData = await response.json();

        if (jsonData.error) {
          throw new Error(jsonData.error);
        }

        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading prices page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rebalanceMode, currency]);

  return { data, loading, error };
}
