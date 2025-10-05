import { describe, test, expect } from 'vitest';
import {
  generateTickerTapeWidget,
  generateSingleQuoteWidget,
  generateMiniSymbolWidget,
  generateMarketOverviewWidget,
  generateSymbolOverviewWidget
} from '../src/chartWidgets.js';

describe('ChartWidgets', () => {
  describe('generateTickerTapeWidget', () => {
    test('should generate ticker tape widget with symbols', () => {
      const symbols = '{"description":"Apple Inc.", "proName":"NASDAQ:AAPL"},{"description":"Microsoft Corp.", "proName":"NASDAQ:MSFT"}';
      
      const result = generateTickerTapeWidget(symbols);
      
      expect(result).toContain('tradingview-widget-container');
      expect(result).toContain('embed-widget-ticker-tape.js');
      expect(result).toContain('"symbols": [');
      expect(result).toContain(symbols);
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"showSymbolLogo": false');
      expect(result).toContain('"displayMode": "adaptive"');
      expect(result).toContain('"locale": "en"');
    });

    test('should generate valid TradingView widget structure', () => {
      const symbols = '{"description":"Test", "proName":"TEST"}';
      
      const result = generateTickerTapeWidget(symbols);
      
      expect(result).toMatch(/<!-- TradingView Widget BEGIN -->/);
      expect(result).toMatch(/<!-- TradingView Widget END -->/);
      expect(result).toContain('<div class="tradingview-widget-container">');
      expect(result).toContain('<div class="tradingview-widget-container__widget"></div>');
      expect(result).toContain('<script type="text/javascript"');
      expect(result).toContain('src="https://s3.tradingview.com/external-embedding/');
      expect(result).toContain('async>');
    });

    test('should handle empty symbols', () => {
      const result = generateTickerTapeWidget('');
      
      expect(result).toContain('"symbols": []');
      expect(result).toContain('tradingview-widget-container');
    });

    test('should include all required configuration options', () => {
      const result = generateTickerTapeWidget('test');
      
      expect(result).toContain('"showSymbolLogo": false');
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"isTransparent": false');
      expect(result).toContain('"displayMode": "adaptive"');
      expect(result).toContain('"locale": "en"');
    });
  });

  describe('generateSingleQuoteWidget', () => {
    test('should generate single quote widget with symbol', () => {
      const symbol = '"NASDAQ:AAPL"';
      
      const result = generateSingleQuoteWidget(symbol);
      
      expect(result).toContain('tradingview-widget-container');
      expect(result).toContain('embed-widget-single-quote.js');
      expect(result).toContain(`"symbol": ${symbol}`);
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"width": "100%"');
      expect(result).toContain('<div class="col">');
    });

    test('should include proper Bootstrap column structure', () => {
      const result = generateSingleQuoteWidget('TEST');
      
      expect(result).toMatch(/^[\s]*<!-- TradingView Widget BEGIN -->/m);
      expect(result).toContain('<div class="col">');
      expect(result).toMatch(/<!-- TradingView Widget END -->[\s]*$/m);
    });

    test('should configure widget for dark theme', () => {
      const result = generateSingleQuoteWidget('TEST');
      
      expect(result).toContain('"isTransparent": false');
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"locale": "en"');
    });
  });

  describe('generateMiniSymbolWidget', () => {
    test('should generate mini symbol widget with proper height', () => {
      const symbol = '"NASDAQ:AAPL"';
      
      const result = generateMiniSymbolWidget(symbol);
      
      expect(result).toContain('embed-widget-mini-symbol-overview.js');
      expect(result).toContain(`"symbol": ${symbol}`);
      expect(result).toContain('style="height:25vh"');
      expect(result).toContain('"height": "100%"');
      expect(result).toContain('"width": "100%"');
    });

    test('should include proper configuration for mini overview', () => {
      const result = generateMiniSymbolWidget('TEST');
      
      expect(result).toContain('"dateRange": "3M"');
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"isTransparent": false');
      expect(result).toContain('"autosize": true');
      expect(result).toContain('"largeChartUrl": ""');
    });

    test('should wrap in column and container', () => {
      const result = generateMiniSymbolWidget('TEST');
      
      expect(result).toContain('<div class="col">');
      expect(result).toContain('tradingview-widget-container');
    });
  });

  describe('generateMarketOverviewWidget', () => {
    test('should generate market overview widget with symbols', () => {
      const symbolsString = '{"s": "NASDAQ:AAPL", "d": "Apple Inc."},{"s": "NASDAQ:MSFT", "d": "Microsoft Corp."}';
      
      const result = generateMarketOverviewWidget(symbolsString);
      
      expect(result).toContain('embed-widget-market-overview.js');
      expect(result).toContain('"title": "Portfolio"');
      expect(result).toContain(`"symbols": [${symbolsString}]`);
      expect(result).toContain('"originalTitle": "Portfolio"');
    });

    test('should configure market overview properly', () => {
      const result = generateMarketOverviewWidget('test');
      
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"dateRange": "3M"');
      expect(result).toContain('"showChart": true');
      expect(result).toContain('"showSymbolLogo": true');
      expect(result).toContain('"showFloatingTooltip": false');
      expect(result).toContain('"width": "100%"');
      expect(result).toContain('"height": "400"');
    });

    test('should include portfolio tab structure', () => {
      const result = generateMarketOverviewWidget('test');
      
      expect(result).toContain('"tabs": [');
      expect(result).toContain('"title": "Portfolio"');
      expect(result).toContain('"originalTitle": "Portfolio"');
    });

    test('should wrap in column with proper styling', () => {
      const result = generateMarketOverviewWidget('test');
      
      expect(result).toContain('<div class="col">');
      expect(result).toContain('style="margin-top: 20px;"');
    });
  });

  describe('generateSymbolOverviewWidget', () => {
    test('should generate symbol overview widget for large charts', () => {
      const symbolsString = '["Apple Inc.", "NASDAQ:AAPL|3M|USD"],["Microsoft Corp.", "NASDAQ:MSFT|3M|USD"]';
      
      const result = generateSymbolOverviewWidget(symbolsString);
      
      expect(result).toContain('embed-widget-symbol-overview.js');
      expect(result).toContain(`"symbols": [${symbolsString}]`);
      expect(result).toContain('"chartOnly": false');
    });

    test('should configure for large chart display', () => {
      const result = generateSymbolOverviewWidget('test');
      
      expect(result).toContain('"width": "100%"');
      expect(result).toContain('"height": "100%"');
      expect(result).toContain('"colorTheme": "dark"');
      expect(result).toContain('"autosize": true');
    });

    test('should include advanced chart configuration', () => {
      const result = generateSymbolOverviewWidget('test');
      
      expect(result).toContain('"showVolume": false');
      expect(result).toContain('"showMA": false');
      expect(result).toContain('"hideDateRanges": false');
      expect(result).toContain('"hideMarketStatus": false');
      expect(result).toContain('"hideSymbolLogo": false');
      expect(result).toContain('"scalePosition": "right"');
      expect(result).toContain('"scaleMode": "Normal"');
    });

    test('should include date range configuration', () => {
      const result = generateSymbolOverviewWidget('test');
      
      expect(result).toContain('"dateRanges": [');
      expect(result).toContain('"1m|1D"');
      expect(result).toContain('"3m|1D"');
      expect(result).toContain('"ytd|1D"');
      expect(result).toContain('"all|1M"');
    });

    test('should include color configuration', () => {
      const result = generateSymbolOverviewWidget('test');
      
      expect(result).toContain('"upColor": "#22ab94"');
      expect(result).toContain('"downColor": "#f7525f"');
      expect(result).toContain('"borderUpColor": "#22ab94"');
      expect(result).toContain('"borderDownColor": "#f7525f"');
      expect(result).toContain('"wickUpColor": "#22ab94"');
      expect(result).toContain('"wickDownColor": "#f7525f"');
    });

    test('should include chart styling options', () => {
      const result = generateSymbolOverviewWidget('test');
      
      expect(result).toContain('"chartType": "area"');
      expect(result).toContain('"headerFontSize": "medium"');
      expect(result).toContain('"lineWidth": 2');
      expect(result).toContain('"lineType": 0');
      expect(result).toContain('"changeMode": "price-and-percent"');
    });
  });

  describe('Widget consistency', () => {
    test('all widgets should use dark theme', () => {
      const widgets = [
        generateTickerTapeWidget('test'),
        generateSingleQuoteWidget('test'),
        generateMiniSymbolWidget('test'),
        generateMarketOverviewWidget('test'),
        generateSymbolOverviewWidget('test')
      ];
      
      widgets.forEach(widget => {
        expect(widget).toContain('"colorTheme": "dark"');
      });
    });

    test('all widgets should have proper TradingView structure', () => {
      const widgets = [
        generateTickerTapeWidget('test'),
        generateSingleQuoteWidget('test'),
        generateMiniSymbolWidget('test'),
        generateMarketOverviewWidget('test'),
        generateSymbolOverviewWidget('test')
      ];
      
      widgets.forEach(widget => {
        expect(widget).toContain('<!-- TradingView Widget BEGIN -->');
        expect(widget).toContain('<!-- TradingView Widget END -->');
        expect(widget).toContain('tradingview-widget-container');
        expect(widget).toContain('s3.tradingview.com');
        expect(widget).toContain('async>');
      });
    });

    test('all widgets should use English locale', () => {
      const widgets = [
        generateTickerTapeWidget('test'),
        generateSingleQuoteWidget('test'),
        generateMiniSymbolWidget('test'),
        generateMarketOverviewWidget('test'),
        generateSymbolOverviewWidget('test')
      ];
      
      widgets.forEach(widget => {
        expect(widget).toContain('"locale": "en"');
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle special characters in symbols', () => {
      const symbolWithSpecialChars = '"NASDAQ:AAPL&test=1"';
      
      const result = generateSingleQuoteWidget(symbolWithSpecialChars);
      
      expect(result).toContain(symbolWithSpecialChars);
      expect(result).toContain('tradingview-widget-container');
    });

    test('should handle very long symbol strings', () => {
      const longSymbols = 'a'.repeat(1000);
      
      const result = generateTickerTapeWidget(longSymbols);
      
      expect(result).toContain(longSymbols);
      expect(result).toContain('tradingview-widget-container');
    });

    test('should handle undefined symbols gracefully', () => {
      const result = generateTickerTapeWidget(undefined);
      
      expect(result).toContain('"symbols": [undefined]');
      expect(result).toContain('tradingview-widget-container');
    });
  });
});