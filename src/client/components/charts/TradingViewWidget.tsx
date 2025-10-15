import React from 'react';
import { useTradingViewWidget } from '../../hooks/useTradingViewWidget';

interface TradingViewWidgetProps {
  script: string;
  config: Record<string, any>;
  className?: string;
  style?: React.CSSProperties;
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  script,
  config,
  className = 'tradingview-widget-container',
  style,
}) => {
  const containerRef = useTradingViewWidget({ script, config });

  return (
    <div className={className} style={style}>
      <div className="tradingview-widget-container__widget" style={{ height: '100%' }} ref={containerRef}></div>
    </div>
  );
};
