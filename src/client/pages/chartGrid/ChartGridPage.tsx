import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { MiniSymbolWidget } from '../../components/charts/MiniSymbolWidget';
import { TradingViewWidget } from '../../components/charts/TradingViewWidget';

export const ChartGridPage: React.FC = () => {
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
  
  if (cashAmount > 0) {
    portfolioParts.push(cashAmount.toFixed(2));
  }
  
  const portfolioComposition = portfolioParts.join('+');

  // Format symbols for market overview - include combined portfolio first
  const marketSymbols = [
    {
      s: portfolioComposition,
      d: 'My Portfolio'
    },
    ...holdings.map(h => ({
      s: h.code,
      d: h.name
    }))
  ];

  // Debug: Log the symbols being used
  console.log('Chart Grid Holdings:', holdings);
  console.log('Combined Portfolio Symbol:', portfolioComposition);
  console.log('Market Symbols for TradingView:', marketSymbols);

  const marketOverviewConfig = {
    colorTheme: 'dark',
    dateRange: '3M',
    showChart: true,
    locale: 'en',
    largeChartUrl: '',
    isTransparent: false,
    showSymbolLogo: true,
    showFloatingTooltip: false,
    width: '100%',
    height: '400',
    tabs: [
      {
        title: 'Portfolio',
        symbols: marketSymbols,
        originalTitle: 'Portfolio'
      }
    ]
  };

  return (
    <div style={{ backgroundColor: '#212529', margin: 0, height: '100vh' }}>
      {holdings.length === 0 ? (
        <div className="container-fluid p-4">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">No Holdings Found</h4>
            <p>You don't have any stocks in your portfolio yet. Add some holdings in the <a href="/stonks/config" className="alert-link">Configuration</a> page to see charts.</p>
          </div>
        </div>
      ) : (
        <div className="container-fluid">
          {/* Mini Symbol Widgets Grid */}
          <div className="row g-0 row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3">
            {/* Combined Portfolio Mini Widget */}
            <MiniSymbolWidget key="portfolio" symbol={portfolioComposition} />
            
            {/* Individual Holdings Mini Widgets */}
            {holdings.map((holding) => (
              <MiniSymbolWidget key={holding.id} symbol={holding.code} />
            ))}
          </div>

          {/* Market Overview Widget */}
          <div className="row justify-content-center row-cols-md-12 row-cols-xl-2">
            <div className="col">
              <TradingViewWidget
                script="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
                config={marketOverviewConfig}
                style={{ marginTop: '20px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
