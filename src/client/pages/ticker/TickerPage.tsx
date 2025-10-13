import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TickerTapeWidget } from '../../components/charts/TickerTapeWidget';
import { SingleQuoteWidget } from '../../components/charts/SingleQuoteWidget';

export const TickerPage: React.FC = () => {
  const { holdings, loading, error } = useHoldings();

  if (loading) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh' }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Format symbols for ticker tape
  const tickerSymbols = holdings.map(h => ({
    proName: h.code,
    title: h.name
  }));

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh' }}>
      {/* Ticker Tape */}
      <TickerTapeWidget symbols={tickerSymbols} />

      {/* Individual Quote Widgets */}
      <div className="container-fluid">
        <div className="row">
          {holdings.map((holding) => (
            <SingleQuoteWidget key={holding.id} symbol={holding.code} />
          ))}
        </div>
      </div>
    </div>
  );
};
