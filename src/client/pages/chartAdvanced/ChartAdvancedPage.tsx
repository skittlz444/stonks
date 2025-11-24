import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TradingViewWidget } from '../../components/charts/TradingViewWidget';

export const ChartAdvancedPage: React.FC = () => {
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

  // Format symbols for watchlist - include combined portfolio first, then individual holdings
  const watchlistSymbols = portfolioComposition ? [portfolioComposition, ...holdings.map(h => h.code)] : holdings.map(h => h.code);

  // Debug: Log the symbols being used
  console.log('Chart Advanced Holdings:', holdings);
  console.log('Combined Portfolio Symbol:', portfolioComposition);
  console.log('Watchlist Symbols for TradingView:', watchlistSymbols);

  const advancedChartConfig = {
    autosize: true,
    symbol: portfolioComposition || (holdings.length > 0 ? holdings[0].code : 'NASDAQ:AAPL'),
    interval: 'D',
    timezone: 'Asia/Singapore',
    theme: 'dark',
    style: '1',
    locale: 'en',
    withdateranges: true,
    hide_side_toolbar: true,
    allow_symbol_change: true,
    details: true,
    hotlist: false,
    calendar: false,
    watchlist: watchlistSymbols,
    compareSymbols: [
      {
        symbol: 'ICMARKETS:US500',
        position: 'SameScale'
      },
      {
        symbol: 'NASDAQ:NDX',
        position: 'SameScale'
      }
    ],
    support_host: 'https://www.tradingview.com'
  };

  return (
    <div style={{ backgroundColor: '#212529', height: '100vh', margin: 0 }}>
      {holdings.length === 0 ? (
        <div className="container-fluid p-4">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading">No Holdings Found</h4>
            <p>You don't have any stocks in your portfolio yet. Add some holdings in the <a href="/config" className="alert-link">Configuration</a> page to see charts.</p>
          </div>
        </div>
      ) : (
        <div style={{ height: 'calc(100vh - 56px)', width: '100%' }}>
          <TradingViewWidget
            script="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            config={advancedChartConfig}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      )}
    </div>
  );
};
