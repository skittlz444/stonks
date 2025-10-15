import { useConfig } from '../context/ConfigContext';
import { Holding } from '../types';

interface UseHoldingsResult {
  holdings: Holding[];
  loading: boolean;
  error: string | null;
  cashAmount: number;
}

export function useHoldings(): UseHoldingsResult {
  const { configData, loading, error } = useConfig();

  return {
    holdings: configData?.visibleHoldings || [],
    loading,
    error,
    cashAmount: configData?.cashAmount || 0,
  };
}
