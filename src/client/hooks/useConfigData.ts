import { useState, useEffect } from 'react';
import { ConfigData } from '../types';

interface UseConfigDataResult {
  data: ConfigData | null;
  loading: boolean;
  error: string | null;
}

export function useConfigData(): UseConfigDataResult {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/stonks/api/config-data');

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
        console.error('Error loading config page:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
