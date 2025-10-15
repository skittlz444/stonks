import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SymbolOverviewWidget } from '../../components/charts/SymbolOverviewWidget';

export const ChartLargePage: React.FC = () => {
  const { holdings, loading, error, cashAmount } = useHoldings();

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

  // Generate combined portfolio symbol: quantity*SYMBOL+quantity*SYMBOL+...+cash
  const portfolioParts = holdings
    .filter(h => h.quantity > 0)
    .map(h => `${h.quantity}*${h.code}`);
  
  if (cashAmount > 0) {
    portfolioParts.push(cashAmount.toFixed(2));
  }
  
  const portfolioComposition = portfolioParts.join('+');

  // Format symbols for symbol overview widget - include combined portfolio first
  const chartSymbols = [
    {
      name: 'My Portfolio',
      symbol: portfolioComposition
    },
    ...holdings.map(h => ({
      name: h.name,
      symbol: h.code
    }))
  ];

  // Debug: Log the symbols being used
  console.log('Chart Large Holdings:', holdings);
  console.log('Combined Portfolio Symbol:', portfolioComposition);
  console.log('Chart Symbols for TradingView:', chartSymbols);

  return (
    <div style={{ backgroundColor: '#212529', height: '100vh', margin: 0 }}>
      {holdings.length === 0 ? (
        <div className="container-fluid p-4">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">No Holdings Found</h4>
            <p>You don't have any stocks in your portfolio yet. Add some holdings in the <a href="/stonks/config" className="alert-link">Configuration</a> page to see charts.</p>
          </div>
        </div>
      ) : (
        <div className="container-fluid" style={{ height: 'calc(100vh - 56px)' }}>
          <div style={{ height: '100%', width: '100%' }}>
            <SymbolOverviewWidget symbols={chartSymbols} />
          </div>
        </div>
      )}
    </div>
  );
};
