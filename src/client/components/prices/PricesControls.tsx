import React from 'react';

interface PricesControlsProps {
  rebalanceMode: boolean;
  currency: string;
  fxAvailable: boolean;
  onCurrencyChange: (currency: string) => void;
  onRebalanceToggle: () => void;
}

export const PricesControls: React.FC<PricesControlsProps> = ({
  rebalanceMode,
  currency,
  fxAvailable,
  onCurrencyChange,
  onRebalanceToggle,
}) => {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div className="d-flex align-items-center gap-2">
        {/* Currency Selector */}
        {!rebalanceMode && (
          <>
            <span className="me-2">Currency:</span>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${currency === 'USD' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onCurrencyChange('USD')}
              >
                USD
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currency === 'SGD' ? 'btn-primary' : 'btn-outline-primary'} ${!fxAvailable ? 'disabled' : ''}`}
                onClick={() => fxAvailable && onCurrencyChange('SGD')}
                title={!fxAvailable ? 'Requires OpenExchangeRates API key' : ''}
              >
                SGD
              </button>
              <button
                type="button"
                className={`btn btn-sm ${currency === 'AUD' ? 'btn-primary' : 'btn-outline-primary'} ${!fxAvailable ? 'disabled' : ''}`}
                onClick={() => fxAvailable && onCurrencyChange('AUD')}
                title={!fxAvailable ? 'Requires OpenExchangeRates API key' : ''}
              >
                AUD
              </button>
            </div>
          </>
        )}
      </div>

      {/* Rebalance Toggle */}
      <button
        className={`btn btn-sm ${rebalanceMode ? 'btn-warning' : 'btn-outline-warning'} ${currency !== 'USD' && !rebalanceMode ? 'disabled' : ''}`}
        onClick={onRebalanceToggle}
        disabled={currency !== 'USD' && !rebalanceMode}
      >
        {rebalanceMode ? 'Exit Rebalance Mode' : 'Rebalance Portfolio'}
      </button>
    </div>
  );
};
