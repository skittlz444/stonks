import { useEffect, useRef } from 'react';

interface TradingViewWidgetConfig {
  script: string;
  config: Record<string, any>;
}

export function useTradingViewWidget({ script, config }: TradingViewWidgetConfig) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scriptElement = document.createElement('script');
    scriptElement.src = script;
    scriptElement.async = true;
    scriptElement.innerHTML = JSON.stringify(config);

    containerRef.current.appendChild(scriptElement);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [script, config]);

  return containerRef;
}
