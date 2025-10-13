import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface MiniSymbolWidgetProps {
  symbol: string;
}

export const MiniSymbolWidget: React.FC<MiniSymbolWidgetProps> = ({ symbol }) => {
  const config = {
    symbol: symbol,
    width: '100%',
    height: '100%',
    locale: 'en',
    dateRange: '3M',
    colorTheme: 'dark',
    isTransparent: false,
    autosize: true,
    largeChartUrl: '',
  };

  return (
    <div className="col">
      <TradingViewWidget
        script="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
        config={config}
        style={{ height: '25vh' }}
      />
    </div>
  );
};
