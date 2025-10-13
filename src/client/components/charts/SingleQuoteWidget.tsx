import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface SingleQuoteWidgetProps {
  symbol: string;
}

export const SingleQuoteWidget: React.FC<SingleQuoteWidgetProps> = ({ symbol }) => {
  const config = {
    symbol: symbol,
    width: '100%',
    isTransparent: false,
    colorTheme: 'dark',
    locale: 'en',
  };

  return (
    <div className="col">
      <TradingViewWidget
        script="https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js"
        config={config}
      />
    </div>
  );
};
