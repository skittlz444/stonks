import React from 'react';
import ReactDOM from 'react-dom/client';
import { TickerPage } from './TickerPage';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TickerPage />
  </React.StrictMode>
);
