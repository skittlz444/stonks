import React from 'react';
import { useHoldings } from '../../hooks/useHoldings';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TradingViewWidget } from '../../components/charts/TradingViewWidget';

export const ChartAdvancedPage: React.FC = () => {
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

  // Format symbols for watchlist
  const watchlistSymbols = holdings.map(h => h.code);

  const advancedChartConfig = {
    width: '100%',
    height: '100%',
    symbol: holdings.length > 0 ? holdings[0].code : 'NASDAQ:AAPL',
    watchlist: watchlistSymbols,
    interval: 'D',
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    backgroundColor: 'rgba(33, 37, 41, 1)',
    gridColor: 'rgba(255, 255, 255, 0.06)',
    allow_symbol_change: true,
    details: true,
    hotlist: true,
    calendar: false,
    container_id: 'tradingview_chart'
  };

  return (
    <div style={{ backgroundColor: '#212529', height: '100vh', margin: 0 }}>
      <div style={{ height: 'calc(100vh - 80px)', width: '100%' }}>
        <TradingViewWidget
          script="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={advancedChartConfig}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
      
      {/* Footer Navigation */}
      <div style={{ 
        height: '80px', 
        backgroundColor: '#212529', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '15px'
      }}>
        <a href="/stonks/ticker" className="btn btn-outline-light">Ticker</a>
        <a href="/stonks/charts" className="btn btn-outline-light">Grid</a>
        <a href="/stonks/charts/large" className="btn btn-outline-light">Large</a>
        <a href="/stonks/prices" className="btn btn-outline-light">Prices</a>
        <a href="/stonks/config" className="btn btn-outline-light">Config</a>
      </div>
    </div>
  );
};
