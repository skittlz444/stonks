import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TickerPage from './components/pages/TickerPage';
import ChartGridPage from './components/pages/ChartGridPage';
import ChartLargePage from './components/pages/ChartLargePage';
import ChartAdvancedPage from './components/pages/ChartAdvancedPage';
import PricesPage from './components/pages/PricesPage';
import ConfigPage from './components/pages/ConfigPage';

const App: React.FC = () => {
  return (
    <Router basename="/stonks">
      <Routes>
        <Route path="/ticker" element={<TickerPage />} />
        <Route path="/charts" element={<ChartGridPage />} />
        <Route path="/charts/large" element={<ChartLargePage />} />
        <Route path="/charts/advanced" element={<ChartAdvancedPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/" element={<Navigate to="/ticker" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
