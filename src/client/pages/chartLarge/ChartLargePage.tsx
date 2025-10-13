import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SymbolOverviewWidget } from '../../components/charts/SymbolOverviewWidget';

export const ChartLargePage: React.FC = () => {
  const { holdings, loading, error } = useHoldings();

  if (loading) {
    return (
      <div style={{ backgroundColor: '#212529', height: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#212529', height: '100vh' }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Format symbols for symbol overview widget
  const chartSymbols = holdings.map(h => h.code);

  return (
    <div style={{ backgroundColor: '#212529', height: '100vh', margin: 0 }}>
      <div style={{ height: '100vh', width: '100%' }}>
        <SymbolOverviewWidget symbols={chartSymbols} />
      </div>
    </div>
  );
};
