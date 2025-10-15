import React from 'react';

interface NavigationProps {
  rebalanceMode: boolean;
  currency: string;
  fxAvailable: boolean;
  portfolioName: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  rebalanceMode,
  currency,
  fxAvailable,
  portfolioName,
}) => {
  const handleCurrencyChange = (newCurrency: string) => {
    const mode = rebalanceMode ? 'rebalance' : 'normal';
    window.location.href = `/stonks/prices?mode=${mode}&currency=${newCurrency}`;
  };

  const toggleRebalanceMode = () => {
    const newMode = !rebalanceMode;
    window.location.href = `/stonks/prices?mode=${newMode ? 'rebalance' : 'normal'}&currency=${currency}`;
  };

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">{portfolioName || 'Stock Portfolio'}</span>
        <div className="d-flex align-items-center">
          {/* Currency Selector */}
          {!rebalanceMode && (
            <div id="currency-selector" className="btn-group me-3" role="group">
              <button
                type="button"
                className={`btn btn-sm ${currency === 'USD' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleCurrencyChange('USD')}
              >
                USD
              </button>
              <button
                type="button"
                id="sgd-btn"
                className={`btn btn-sm ${currency === 'SGD' ? 'btn-primary' : 'btn-outline-primary'} ${!fxAvailable ? 'disabled' : ''}`}
                onClick={() => fxAvailable && handleCurrencyChange('SGD')}
                title={!fxAvailable ? 'Requires OpenExchangeRates API key' : ''}
              >
                SGD
              </button>
              <button
                type="button"
                id="aud-btn"
                className={`btn btn-sm ${currency === 'AUD' ? 'btn-primary' : 'btn-outline-primary'} ${!fxAvailable ? 'disabled' : ''}`}
                onClick={() => fxAvailable && handleCurrencyChange('AUD')}
                title={!fxAvailable ? 'Requires OpenExchangeRates API key' : ''}
              >
                AUD
              </button>
            </div>
          )}

          {/* Rebalance Toggle */}
          <button
            id="rebalance-btn"
            className={`btn btn-sm ${rebalanceMode ? 'btn-warning' : 'btn-outline-warning'} me-3 ${currency !== 'USD' && !rebalanceMode ? 'disabled' : ''}`}
            onClick={toggleRebalanceMode}
            disabled={currency !== 'USD' && !rebalanceMode}
          >
            {rebalanceMode ? 'Exit Rebalance Mode' : 'Rebalance Portfolio'}
          </button>

          {/* Navigation Links */}
          <a href="/stonks/ticker" className="btn btn-sm btn-outline-light me-2">Ticker</a>
          <a href="/stonks/charts" className="btn btn-sm btn-outline-light me-2">Grid</a>
          <a href="/stonks/charts/large" className="btn btn-sm btn-outline-light me-2">Large</a>
          <a href="/stonks/charts/advanced" className="btn btn-sm btn-outline-light me-2">Advanced</a>
          <a href="/stonks/config" className="btn btn-sm btn-outline-light">Config</a>
        </div>
      </div>
    </nav>
  );
};
