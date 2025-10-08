/**
 * Chart generation utilities for TradingView widgets
 */

/**
 * Generate a ticker tape widget
 */
export function generateTickerTapeWidget(symbols) {
  return `
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
      {
      "symbols": [${symbols}],
      "showSymbolLogo": false,
      "colorTheme": "dark",
      "isTransparent": false,
      "displayMode": "adaptive",
      "locale": "en"
      }
      </script>
    </div>
    <!-- TradingView Widget END -->`;
}

/**
 * Generate a single quote widget
 */
export function generateSingleQuoteWidget(symbol) {
  return `
    <!-- TradingView Widget BEGIN -->
    <div class="col">
      <div class="tradingview-widget-container">
        <div class="tradingview-widget-container__widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js" async>
        {
        "symbol": ${symbol},
        "width": "100%",
        "isTransparent": false,
        "colorTheme": "dark",
        "locale": "en"
        }
        </script>
      </div>
    </div>
    <!-- TradingView Widget END -->`;
}

/**
 * Generate a mini symbol overview widget
 */
export function generateMiniSymbolWidget(symbol) {
  return `
    <div class="col">
      <!-- TradingView Widget BEGIN -->
      <div class="tradingview-widget-container" style="height:25vh">
        <div class="tradingview-widget-container__widget" ></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
        {
        "symbol": ${symbol},
        "width": "100%",
        "height": "100%",
        "locale": "en",
        "dateRange": "3M",
        "colorTheme": "dark",
        "isTransparent": false,
        "autosize": true,
        "largeChartUrl": ""
        }
        </script>
      </div>
      <!-- TradingView Widget END -->
    </div>`;
}

/**
 * Generate a market overview widget
 */
export function generateMarketOverviewWidget(symbolsString) {
  return `
    <div class="col">
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container" style="margin-top: 20px;">
        <div class="tradingview-widget-container__widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js" async>
        {
        "colorTheme": "dark",
        "dateRange": "3M",
        "showChart": true,
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "showFloatingTooltip": false,
        "width": "100%",
        "height": "400",
        "tabs": [
            {
            "title": "Portfolio",
            "symbols": [${symbolsString}],
            "originalTitle": "Portfolio"
            }
        ]
        }
        </script>
        </div>
        <!-- TradingView Widget END -->
    </div>`;
}

/**
 * Generate a symbol overview widget (large charts)
 */
export function generateSymbolOverviewWidget(symbolsString) {
  return `
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container" >
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js" async>
      {
      "symbols": [${symbolsString}],
      "chartOnly": false,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "colorTheme": "dark",
      "autosize": true,
      "showVolume": false,
      "showMA": false,
      "hideDateRanges": false,
      "hideMarketStatus": false,
      "hideSymbolLogo": false,
      "scalePosition": "right",
      "scaleMode": "Normal",
      "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      "fontSize": "10",
      "noTimeScale": false,
      "valuesTracking": "1",
      "changeMode": "price-and-percent",
      "chartType": "area",
      "headerFontSize": "medium",
      "lineWidth": 2,
      "lineType": 0,
      "dateRanges": [
        "1m|1D",
        "3m|1D",
        "6m|1D",
        "12m|1D",
        "60m|1W",
        "ytd|1D",
        "all|1M"
      ],
      "dateFormat": "MMM 'yy",
      "upColor": "#22ab94",
      "downColor": "#f7525f",
      "borderUpColor": "#22ab94",
      "borderDownColor": "#f7525f",
      "wickUpColor": "#22ab94",
      "wickDownColor": "#f7525f"
      }
      </script>
    </div>
    <!-- TradingView Widget END -->`;
}

/**
 * Generate a company profile widget
 */
export function generateCompanyProfileWidget(symbol) {
  return `
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container">
      <div class="tradingview-widget-container__widget"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js" async>
      {
      "width": "100%",
      "height": "100%",
      "isTransparent": false,
      "colorTheme": "dark",
      "symbol": "${symbol}",
      "locale": "en"
      }
      </script>
    </div>
    <!-- TradingView Widget END -->`;
}

/**
 * Generate an advanced chart widget (full-featured TradingView chart)
 */
export function generateAdvancedChartWidget(watchlistSymbols) {
  return `
    <!-- TradingView Widget BEGIN -->
    <div class="tradingview-widget-container" style="height:100%;width:100%">
      <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
      <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" async>
      {
      "autosize": true,
      "symbol": "${watchlistSymbols.split(',')[0].replace(/"/g, '')}",
      "interval": "D",
      "timezone": "Asia/Singapore",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "withdateranges": true,
      "hide_side_toolbar": true,
      "allow_symbol_change": true,
      "details": true,
      "hotlist": false,
      "calendar": false,
      "watchlist": [${watchlistSymbols}],
      "compareSymbols": [
        {
          "symbol": "ICMARKETS:US500",
          "position": "SameScale"
        },
        {
          "symbol": "NASDAQ:NDX",
          "position": "SameScale"
        }
      ],
      "support_host": "https://www.tradingview.com"
      }
      </script>
    </div>
    <!-- TradingView Widget END -->`;
}