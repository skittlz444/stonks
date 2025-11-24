import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { Navigation } from './components/common/Navigation';
import { PricesPage } from './pages/prices/PricesPage';
import { ConfigPage } from './pages/config/ConfigPage';
import { TickerPage } from './pages/ticker/TickerPage';
import { ChartGridPage } from './pages/chartGrid/ChartGridPage';
import { ChartLargePage } from './pages/chartLarge/ChartLargePage';
import { ChartAdvancedPage } from './pages/chartAdvanced/ChartAdvancedPage';
import './styles.css';

const AppRoutes: React.FC = () => {
  const { configData } = useConfig();

  return (
    <BrowserRouter>
      <Navigation portfolioName={configData?.portfolioName || 'My Portfolio'} />
      <Routes>
        <Route path="/" element={<Navigate to="/ticker" replace />} />
        <Route path="/ticker" element={<TickerPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/config" element={<ConfigPage />} />
        
        {/* Chart routes with both old and new paths */}
        <Route path="/charts" element={<ChartGridPage />} />
        <Route path="/chart-grid" element={<ChartGridPage />} />
        
        <Route path="/charts/large" element={<ChartLargePage />} />
        <Route path="/chart-large" element={<ChartLargePage />} />
        
        <Route path="/charts/advanced" element={<ChartAdvancedPage />} />
        <Route path="/chart-advanced" element={<ChartAdvancedPage />} />
        
        <Route path="*" element={<Navigate to="/ticker" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <ConfigProvider>
      <AppRoutes />
    </ConfigProvider>
  );
};
