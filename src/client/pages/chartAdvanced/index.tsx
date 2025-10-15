import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChartAdvancedPage } from './ChartAdvancedPage';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChartAdvancedPage />
  </React.StrictMode>
);
