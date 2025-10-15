import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  portfolioName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  portfolioName = 'Stock Portfolio',
}) => {
  const location = useLocation();
  
  // Determine current page from location
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/ticker') return 'ticker';
    if (path === '/prices') return 'prices';
    if (path === '/config') return 'config';
    if (path === '/charts' || path === '/chart-grid') return 'charts';
    if (path === '/charts/large' || path === '/chart-large') return 'chartLarge';
    if (path === '/charts/advanced' || path === '/chart-advanced') return 'chartAdvanced';
    return null;
  };
  
  const currentPage = getCurrentPage();

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">{portfolioName}</span>
        <div className="d-flex align-items-center gap-2">
          {/* Page Navigation Links */}
          <Link 
            to="/ticker" 
            className={`btn btn-sm ${currentPage === 'ticker' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Ticker
          </Link>
          <Link 
            to="/chart-grid" 
            className={`btn btn-sm ${currentPage === 'charts' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Grid
          </Link>
          <Link 
            to="/chart-large" 
            className={`btn btn-sm ${currentPage === 'chartLarge' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Large
          </Link>
          <Link 
            to="/chart-advanced" 
            className={`btn btn-sm ${currentPage === 'chartAdvanced' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Advanced
          </Link>
          <Link 
            to="/prices" 
            className={`btn btn-sm ${currentPage === 'prices' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Prices
          </Link>
          <Link 
            to="/config" 
            className={`btn btn-sm ${currentPage === 'config' ? 'btn-light' : 'btn-outline-light'}`}
          >
            Config
          </Link>
        </div>
      </div>
    </nav>
  );
};
