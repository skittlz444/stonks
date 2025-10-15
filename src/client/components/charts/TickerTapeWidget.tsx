import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface TickerTapeWidgetProps {
  symbols: Array<{ proName: string; title: string }>;
}

export const TickerTapeWidget: React.FC<TickerTapeWidgetProps> = ({ symbols }) => {
  const config = {
    symbols: symbols,
    showSymbolLogo: false,
    colorTheme: 'dark',
    isTransparent: false,
    displayMode: 'adaptive',
    locale: 'en',
  };

  return (
    <TradingViewWidget
      script="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      config={config}
    />
  );
};
