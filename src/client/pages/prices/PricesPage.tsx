import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePricesData } from '../../hooks/usePricesData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { PricesControls } from '../../components/prices/PricesControls';
import { SummaryCards } from '../../components/prices/SummaryCards';
import { HoldingsTable } from '../../components/prices/HoldingsTable';
import { ClosedPositionsTable } from '../../components/prices/ClosedPositionsTable';
import { ColumnControls } from '../../components/prices/ColumnControls';
import { CompanyProfileModal } from '../../components/common/CompanyProfileModal';
import { calculateRebalancing } from '../../utils/rebalancing';

export const PricesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const rebalanceMode = searchParams.get('mode') === 'rebalance';
  const currency = searchParams.get('currency') || 'USD';

  // Rebalancing is only available in USD - redirect if necessary
  useEffect(() => {
    if (rebalanceMode && currency !== 'USD') {
      navigate('/prices?mode=rebalance&currency=USD', { replace: true });
    }
  }, [rebalanceMode, currency, navigate]);

  const { data, loading, error, isRefreshing } = usePricesData(rebalanceMode, currency);
  const [fxAvailable, setFxAvailable] = useState(false);
  // Column visibility state - Cost column (index 5) is hidden by default
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set([5]));
  
  // Company profile modal state
  const [modalState, setModalState] = useState({ show: false, symbol: '', name: '' });

  useEffect(() => {
    if (data) {
      setFxAvailable(!!data.fxAvailable);
    }
  }, [data]);

  // Set up global showCompanyProfile function
  useEffect(() => {
    (window as any).showCompanyProfile = (symbol: string, name: string) => {
      setModalState({ show: true, symbol, name });
    };

    return () => {
      delete (window as any).showCompanyProfile;
    };
  }, []);

  const handleToggleColumn = (column: number) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  };

  // Show error only if there's no data to display
  if (error && !data) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Create placeholder data for initial loading state with unique IDs
  const createPlaceholderHolding = (id: number) => ({
    id: -id, // Use negative IDs to avoid conflicts with real data
    name: 'Loading...',
    code: '---',
    quantity: 0,
    target_weight: undefined,
    hidden: false,
    marketValue: 0,
    cost: 0,
    costBasis: 0,
    gain: 0,
    gainPercent: 0,
    quote: undefined,
  });

  // Use placeholder data if loading and no real data yet
  const displayData = data || {
    portfolioName: 'Portfolio',
    holdings: [
      createPlaceholderHolding(1),
      createPlaceholderHolding(2),
      createPlaceholderHolding(3),
    ],
    closedPositions: [],
    cashAmount: 0,
    portfolioTotal: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    fxAvailable: false,
    fxRate: 1,
    sgdRate: 1,
    cacheStats: null,
  };

  // Determine if we should show blur (initial loading or refreshing)
  const shouldBlur = loading || isRefreshing;

  // Calculate currency conversion functions
  const fxRate = displayData.fxRate || 1;
  const sgdRate = displayData.sgdRate || 1;
  const convert = (amount: number) => amount * fxRate;
  
  // Alt currency logic:
  // - When viewing SGD/AUD: show USD as alt currency (no conversion, show original USD values)
  // - When viewing USD: show SGD as alt currency (convert USD to SGD)
  const altCurrency = currency !== 'USD' ? 'USD' : 'SGD';
  const convertToAlt = fxAvailable 
    ? (amount: number) => currency === 'USD' ? amount * sgdRate : amount // If viewing USD, convert to SGD using sgdRate. If viewing SGD/AUD, return USD as-is
    : undefined;

  // Calculate rebalancing data if in rebalance mode
  const rebalancingData = rebalanceMode && data
    ? calculateRebalancing(displayData.holdings, displayData.cashAmount, displayData.portfolioTotal)
    : null;

  // Calculate portfolio metrics
  const totalMarketValue = displayData.holdings.reduce((sum, h) => 
    h.quote?.current ? sum + (h.quote.current * h.quantity) : sum, 0
  );
  
  const totalChangeValue = displayData.holdings.reduce((sum, h) =>
    h.quote?.change != null ? sum + (h.quote.change * h.quantity) : sum, 0
  );
  
  const totalChangePercent = totalMarketValue > 0 
    ? (totalChangeValue / (totalMarketValue - totalChangeValue)) * 100 
    : 0;

  const totalWeightDeviation = displayData.holdings.reduce((sum, h) => {
    if (h.target_weight != null && h.quote?.current) {
      const marketValue = h.quote.current * h.quantity;
      const weight = displayData.portfolioTotal > 0 ? (marketValue / displayData.portfolioTotal) * 100 : 0;
      return sum + Math.abs(weight - h.target_weight);
    }
    return sum;
  }, 0);

  const handleCurrencyChange = (newCurrency: string) => {
    const params = new URLSearchParams();
    if (rebalanceMode) params.set('mode', 'rebalance');
    params.set('currency', newCurrency);
    navigate(`/prices?${params.toString()}`);
  };

  const handleRebalanceToggle = () => {
    const params = new URLSearchParams();
    if (!rebalanceMode) params.set('mode', 'rebalance');
    params.set('currency', currency);
    navigate(`/prices?${params.toString()}`);
  };

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
      <div className="container mt-4">
        <h1 id="page-title" className="mb-4">
          {rebalanceMode ? 'Portfolio Rebalancing' : 'Live Stock Prices'}
        </h1>

        <PricesControls
          rebalanceMode={rebalanceMode}
          currency={currency}
          fxAvailable={fxAvailable}
          onCurrencyChange={handleCurrencyChange}
          onRebalanceToggle={handleRebalanceToggle}
        />

        <SummaryCards
          portfolioTotal={displayData.portfolioTotal}
          totalMarketValue={totalMarketValue}
          cashAmount={displayData.cashAmount}
          totalChangeValue={totalChangeValue}
          totalChangePercent={totalChangePercent}
          totalGain={displayData.totalGainLoss}
          totalGainPercent={displayData.totalGainLossPercent}
          totalWeightDeviation={totalWeightDeviation}
          rebalanceMode={rebalanceMode}
          rebalancingData={rebalancingData}
          fxAvailable={fxAvailable}
          altCurrency={altCurrency || undefined}
          convert={convert}
          convertToAlt={convertToAlt}
          currency={currency}
          isRefreshing={shouldBlur}
        />

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 id="table-title" className="mb-0">
              {rebalanceMode ? 'Rebalancing Recommendations' : 'Portfolio Holdings'}
            </h3>
            {!rebalanceMode && (
              <button 
                className="btn btn-sm btn-outline-secondary" 
                data-bs-toggle="collapse" 
                data-bs-target="#columnControls"
                aria-expanded="false"
              >
                ⚙️ Columns
              </button>
            )}
          </div>
          {!rebalanceMode && (
            <div className="collapse" id="columnControls">
              <ColumnControls 
                hiddenColumns={hiddenColumns}
                onToggleColumn={handleToggleColumn}
              />
            </div>
          )}
          <div className="card-body">
            <HoldingsTable
              holdings={displayData.holdings}
              cashAmount={displayData.cashAmount}
              portfolioTotal={displayData.portfolioTotal}
              rebalanceMode={rebalanceMode}
              rebalancingData={rebalancingData}
              convert={convert}
              currency={currency}
              hiddenColumns={hiddenColumns}
              isRefreshing={shouldBlur}
            />
          </div>
          <div className="card-footer text-muted d-flex justify-content-between align-items-center">
            <small id="last-updated">
              Last updated: {displayData.cacheStats?.oldestTimestamp 
                ? new Date(displayData.cacheStats.oldestTimestamp).toLocaleString() 
                : 'N/A'}
              {displayData.cacheStats?.oldestTimestamp && (
                <span id="cache-badge" className="badge bg-success ms-2">Cached</span>
              )}
            </small>
            <small className="text-muted" id="cache-stats">
              {displayData.cacheStats?.size || 0} symbol{displayData.cacheStats?.size !== 1 ? 's' : ''} in cache
            </small>
          </div>
        </div>

        {!rebalanceMode && displayData.closedPositions && displayData.closedPositions.length > 0 && (
          <ClosedPositionsTable
            closedPositions={displayData.closedPositions}
            convert={convert}
            currency={currency}
            isRefreshing={shouldBlur}
          />
        )}
      </div>
      
      {/* Company Profile Modal */}
      <CompanyProfileModal
        symbol={modalState.symbol}
        name={modalState.name}
        show={modalState.show}
        onHide={() => setModalState({ show: false, symbol: '', name: '' })}
      />
    </div>
  );
};
