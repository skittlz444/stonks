import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigPage } from './ConfigPage';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ConfigPage />
  </React.StrictMode>
);
