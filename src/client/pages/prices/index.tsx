import React from 'react';
import ReactDOM from 'react-dom/client';
import { PricesPage } from './PricesPage';

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const rebalanceMode = urlParams.get('mode') === 'rebalance';
const currency = urlParams.get('currency') || 'USD';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PricesPage rebalanceMode={rebalanceMode} currency={currency} />
  </React.StrictMode>
);
