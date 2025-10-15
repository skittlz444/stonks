import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface SymbolData {
  name: string;
  symbol: string;
}

interface SymbolOverviewWidgetProps {
  symbols: SymbolData[];
}

export const SymbolOverviewWidget: React.FC<SymbolOverviewWidgetProps> = ({ symbols }) => {
  // Format symbols as [["Name", "SYMBOL|3M|USD"], ...] for TradingView Symbol Overview
  const formattedSymbols = symbols.map(s => [s.name, `${s.symbol}|3M|USD`]);

  const config = {
    symbols: formattedSymbols,
    chartOnly: false,
    width: '100%',
    height: '100%',
    locale: 'en',
    colorTheme: 'dark',
    autosize: true,
    showVolume: false,
    showMA: false,
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: 'right',
    scaleMode: 'Normal',
    fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
    fontSize: '10',
    noTimeScale: false,
    valuesTracking: '1',
    changeMode: 'price-and-percent',
    chartType: 'area',
    lineWidth: 2,
    lineType: 0,
    dateRanges: ['1m|1D', '3m|1D', '6m|1D', '12m|1D', '60m|1W', 'ytd|1D', 'all|1M'],
    dateFormat: "MMM 'yy",
    upColor: '#22ab94',
    downColor: '#f7525f',
    borderUpColor: '#22ab94',
    borderDownColor: '#f7525f',
    wickUpColor: '#22ab94',
    wickDownColor: '#f7525f'
  };

  return (
    <TradingViewWidget
      script="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
      config={config}
      style={{ height: '100%' }}
    />
  );
};
