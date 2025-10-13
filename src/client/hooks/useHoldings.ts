import { useState, useEffect } from 'react';
import { Holding } from '../types';

interface UseHoldingsResult {
  holdings: Holding[];
  loading: boolean;
  error: string | null;
}

export function useHoldings(): UseHoldingsResult {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/stonks/api/config-data');

        if (!response.ok) {
          throw new Error(`Failed to fetch holdings: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Use visible holdings for chart pages
        setHoldings(data.visibleHoldings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading holdings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []);

  return { holdings, loading, error };
}
