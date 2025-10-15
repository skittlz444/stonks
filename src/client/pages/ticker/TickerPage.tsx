import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TickerTapeWidget } from '../../components/charts/TickerTapeWidget';
import { SingleQuoteWidget } from '../../components/charts/SingleQuoteWidget';

export const TickerPage: React.FC = () => {
  const { holdings, loading, error, cashAmount } = useHoldings();

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

  // Generate combined portfolio symbol: quantity*SYMBOL+quantity*SYMBOL+...+cash
  const portfolioParts = holdings
    .filter(h => h.quantity > 0)
    .map(h => `${h.quantity}*${h.code}`);
  
  // Add cash amount if it exists
  if (cashAmount > 0) {
    portfolioParts.push(cashAmount.toFixed(2));
  }
  
  const portfolioComposition = portfolioParts.join('+');

  // Format symbols for ticker tape - include combined portfolio first, then individual holdings
  const tickerSymbols = [
    // Combined portfolio ticker
    {
      proName: portfolioComposition,
      title: 'My Portfolio'
    },
    // Individual holdings
    ...holdings.map(h => ({
      proName: h.code,
      title: h.name
    }))
  ];

  // Debug: Log the symbols being used
  console.log('Ticker Page Holdings:', holdings);
  console.log('Combined Portfolio Symbol:', portfolioComposition);
  console.log('Ticker Symbols for TradingView:', tickerSymbols);

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh' }}>
      {holdings.length === 0 ? (
        <div className="container-fluid p-4">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">No Holdings Found</h4>
            <p>You don't have any stocks in your portfolio yet. Add some holdings in the <a href="/stonks/config" className="alert-link">Configuration</a> page to see them here.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Ticker Tape */}
          <TickerTapeWidget symbols={tickerSymbols} />

          {/* Quote Widgets */}
          <div className="container-fluid p-3">
            <div className="row g-0">
              {/* Combined Portfolio Quote Widget */}
              <SingleQuoteWidget key="portfolio" symbol={portfolioComposition} />
              
              {/* Individual Holdings Quote Widgets */}
              {holdings.map((holding) => (
                <SingleQuoteWidget key={holding.id} symbol={holding.code} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
