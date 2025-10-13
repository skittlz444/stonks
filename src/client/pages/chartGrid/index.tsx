import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChartGridPage } from './ChartGridPage';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChartGridPage />
  </React.StrictMode>
);
