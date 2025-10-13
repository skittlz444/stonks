import React from 'react';
import { TradingViewWidget } from './TradingViewWidget';

interface SymbolOverviewWidgetProps {
  symbols: string[];
}

export const SymbolOverviewWidget: React.FC<SymbolOverviewWidgetProps> = ({ symbols }) => {
  const config = {
    symbols: symbols,
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
    maLineColor: '#2962FF',
    maLineWidth: 1,
    maLength: 9,
    lineWidth: 2,
    lineType: 0,
    dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
  };

  return (
    <TradingViewWidget
      script="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
      config={config}
      style={{ height: '100%' }}
    />
  );
};
