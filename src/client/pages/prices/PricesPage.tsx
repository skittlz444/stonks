import React, { useState, useEffect } from 'react';
import { usePricesData } from '../../hooks/usePricesData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SummaryCards } from '../../components/prices/SummaryCards';
import { HoldingsTable } from '../../components/prices/HoldingsTable';
import { ClosedPositionsTable } from '../../components/prices/ClosedPositionsTable';
import { Navigation } from '../../components/prices/Navigation';
import { calculateRebalancing } from '../../utils/rebalancing';

interface PricesPageProps {
  rebalanceMode: boolean;
  currency: string;
}

export const PricesPage: React.FC<PricesPageProps> = ({ rebalanceMode, currency }) => {
  const { data, loading, error } = usePricesData(rebalanceMode, currency);
  const [fxAvailable, setFxAvailable] = useState(false);

  useEffect(() => {
    if (data) {
      setFxAvailable(!!data.fxAvailable);
    }
  }, [data]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate currency conversion functions
  const fxRate = data.fxRate || 1;
  const convert = (amount: number) => amount * fxRate;
  const altCurrency = currency !== 'USD' ? currency : null;
  const convertToAlt = altCurrency && fxAvailable ? (amount: number) => amount : undefined;

  // Calculate rebalancing data if in rebalance mode
  const rebalancingData = rebalanceMode 
    ? calculateRebalancing(data.holdings, data.cashAmount, data.portfolioTotal)
    : null;

  // Calculate portfolio metrics
  const totalMarketValue = data.holdings.reduce((sum, h) => 
    h.quote ? sum + (h.quote.current * h.quantity) : sum, 0
  );
  
  const totalChangeValue = data.holdings.reduce((sum, h) =>
    h.quote ? sum + (h.quote.change * h.quantity) : sum, 0
  );
  
  const totalChangePercent = totalMarketValue > 0 
    ? (totalChangeValue / (totalMarketValue - totalChangeValue)) * 100 
    : 0;

  const totalWeightDeviation = data.holdings.reduce((sum, h) => {
    if (h.target_weight != null && h.quote) {
      const marketValue = h.quote.current * h.quantity;
      const weight = data.portfolioTotal > 0 ? (marketValue / data.portfolioTotal) * 100 : 0;
      return sum + Math.abs(weight - h.target_weight);
    }
    return sum;
  }, 0);

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
      <Navigation 
        rebalanceMode={rebalanceMode}
        currency={currency}
        fxAvailable={fxAvailable}
        portfolioName={data.portfolioName}
      />
      
      <div className="container-fluid p-4">
        <h1 id="page-title" className="mb-4">
          {rebalanceMode ? 'Portfolio Rebalancing' : 'Live Stock Prices'}
        </h1>

        <SummaryCards
          portfolioTotal={data.portfolioTotal}
          totalMarketValue={totalMarketValue}
          cashAmount={data.cashAmount}
          totalChangeValue={totalChangeValue}
          totalChangePercent={totalChangePercent}
          totalGain={data.totalGainLoss}
          totalGainPercent={data.totalGainLossPercent}
          totalWeightDeviation={totalWeightDeviation}
          rebalanceMode={rebalanceMode}
          rebalancingData={rebalancingData}
          fxAvailable={fxAvailable}
          altCurrency={altCurrency || undefined}
          convert={convert}
          convertToAlt={convertToAlt}
          currency={currency}
        />

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 id="table-title">
              {rebalanceMode ? 'Rebalancing Recommendations' : 'Portfolio Holdings'}
            </h3>
            {data.cacheStats && data.cacheStats.oldestTimestamp && (
              <div>
                <span id="last-updated" className="text-muted me-2">
                  Last updated: {new Date(data.cacheStats.oldestTimestamp).toLocaleString()}
                </span>
                <span id="cache-badge">
                  <span className="badge bg-success ms-2">Cached</span>
                </span>
                <small className="text-muted ms-2" id="cache-stats">
                  {data.cacheStats.size} symbol{data.cacheStats.size !== 1 ? 's' : ''} in cache
                </small>
              </div>
            )}
          </div>
          <div className="card-body">
            <HoldingsTable
              holdings={data.holdings}
              cashAmount={data.cashAmount}
              portfolioTotal={data.portfolioTotal}
              rebalanceMode={rebalanceMode}
              rebalancingData={rebalancingData}
              convert={convert}
              currency={currency}
            />
          </div>
        </div>

        {!rebalanceMode && data.closedPositions && data.closedPositions.length > 0 && (
          <ClosedPositionsTable
            closedPositions={data.closedPositions}
            convert={convert}
            currency={currency}
          />
        )}
      </div>
    </div>
  );
};
