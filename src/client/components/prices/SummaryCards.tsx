import React from 'react';
import { formatCurrencyWithCode, getCurrencySymbol } from '../../utils/formatting';
import { RebalanceData } from '../../types';

interface SummaryCardsProps {
  portfolioTotal: number;
  totalMarketValue: number;
  cashAmount: number;
  totalChangeValue?: number;
  totalChangePercent?: number;
  totalGain?: number;
  totalGainPercent?: number;
  totalWeightDeviation?: number;
  rebalanceMode: boolean;
  rebalancingData?: RebalanceData | null;
  fxAvailable?: boolean;
  altCurrency?: string;
  convert: (amount: number) => number;
  convertToAlt?: (amount: number) => number;
  currency: string;
  isRefreshing?: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  portfolioTotal,
  totalMarketValue,
  cashAmount,
  totalChangeValue = 0,
  totalChangePercent = 0,
  totalGain = 0,
  totalGainPercent = 0,
  totalWeightDeviation = 0,
  rebalanceMode,
  rebalancingData,
  fxAvailable = false,
  altCurrency,
  convert,
  convertToAlt,
  currency,
  isRefreshing = false,
}) => {
  // Blur style for values during refresh
  const valueStyle = {
    filter: isRefreshing ? 'blur(3px)' : 'none',
    transition: 'filter 0.2s ease-in-out',
  };
  // Helper function to format currency - only show USD code when NOT viewing USD prices
  const formatCurrency = (amount: number, decimals: number = 2) => {
    return formatCurrencyWithCode(amount, decimals, currency, currency !== 'USD');
  };
  const newTotalMarketValue = rebalanceMode && rebalancingData
    ? rebalancingData.recommendations.reduce((sum, rec) => sum + rec.targetValue, 0)
    : totalMarketValue;

  const newTotalWeightDeviation = rebalanceMode && rebalancingData
    ? rebalancingData.recommendations.reduce((sum, rec) => {
        if (rec.targetWeight != null) {
          return sum + Math.abs(rec.newWeight - rec.targetWeight);
        }
        return sum;
      }, 0)
    : 0;

  // When viewing non-USD currency, alt shows USD with "USD $" prefix
  // When viewing USD, alt shows SGD with "S$" prefix
  const altCurrencySymbol = altCurrency === 'USD' ? 'USD $' : getCurrencySymbol(altCurrency || '');

  return (
    <div className="row g-3 mb-4" id="summary-cards">
      {/* Portfolio Value Card */}
      <div className="col-6 col-md-2">
        <div className="card bg-primary text-white h-100">
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2">Portfolio Value</h6>
            <h3 className="card-title mb-0" style={valueStyle}>{formatCurrency(convert(portfolioTotal))}</h3>
            {fxAvailable && altCurrency && convertToAlt && (
              <small className="opacity-75" style={valueStyle}>
                {altCurrencySymbol}{convertToAlt(portfolioTotal).toFixed(2)}
              </small>
            )}
            {!fxAvailable && (
              <small className="opacity-50" style={{ fontSize: '0.7rem' }}>
                Multi-currency disabled
              </small>
            )}
          </div>
        </div>
      </div>

      {/* Market Value Card */}
      <div className="col-6 col-md-2">
        <div className="card h-100">
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2 text-muted">Market Value</h6>
            {rebalanceMode && Math.abs(newTotalMarketValue - totalMarketValue) > 0.01 ? (
              <div style={valueStyle}>
                <div style={{ textDecoration: 'line-through', fontSize: '0.9rem', opacity: 0.6 }}>
                  {formatCurrency(convert(totalMarketValue))}
                </div>
                <h3 className="card-title mb-0">{formatCurrency(convert(newTotalMarketValue))}</h3>
                <small className="text-muted">
                  ({newTotalMarketValue - totalMarketValue >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(convert(newTotalMarketValue - totalMarketValue)))})
                </small>
              </div>
            ) : (
              <div style={valueStyle}>
                <h3 className="card-title mb-0">
                  {formatCurrency(convert(rebalanceMode ? newTotalMarketValue : totalMarketValue))}
                </h3>
                {fxAvailable && altCurrency && convertToAlt && (
                  <small className="text-muted">
                    {altCurrencySymbol}
                    {convertToAlt(rebalanceMode ? newTotalMarketValue : totalMarketValue).toFixed(2)}
                  </small>
                )}
                {!fxAvailable && (
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Multi-currency disabled
                  </small>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cash Card */}
      <div className="col-6 col-md-2">
        <div className="card h-100">
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2 text-muted">Cash</h6>
            {rebalanceMode && rebalancingData && Math.abs(rebalancingData.cashChange) > 0.01 ? (
              <div style={valueStyle}>
                <div style={{ textDecoration: 'line-through', fontSize: '0.9rem', opacity: 0.6 }}>
                  {formatCurrency(convert(cashAmount))}
                </div>
                <h3 className="card-title mb-0">{formatCurrency(convert(rebalancingData.newCash))}</h3>
                <small className="text-muted">
                  ({rebalancingData.cashChange >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(convert(rebalancingData.cashChange)))})
                </small>
              </div>
            ) : (
              <h3 className="card-title mb-0" style={valueStyle}>
                {formatCurrency(convert(rebalanceMode && rebalancingData ? rebalancingData.newCash : cashAmount))}
              </h3>
            )}
          </div>
        </div>
      </div>

      {/* Day Change Card (only in normal mode) */}
      {!rebalanceMode && (
        <div className="col-6 col-md-2">
          <div className={`card ${totalChangeValue >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100`}>
            <div className="card-body" style={{ minHeight: '100px' }}>
              <h6 className="card-subtitle mb-2">Day Change</h6>
              <div style={valueStyle}>
                <h3 className="card-title mb-0">{formatCurrency(convert(totalChangeValue))}</h3>
                <small>{totalChangePercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Gain Card (only in normal mode) */}
      {!rebalanceMode && (
        <div className="col-6 col-md-2">
          <div className={`card ${totalGain >= 0 ? 'bg-success' : 'bg-danger'} text-white h-100`}>
            <div className="card-body" style={{ minHeight: '100px' }}>
              <h6 className="card-subtitle mb-2">Total Gain/Loss</h6>
              <div style={valueStyle}>
                <h3 className="card-title mb-0">{formatCurrency(convert(totalGain))}</h3>
                <small>{totalGainPercent.toFixed(2)}%</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Deviation Card */}
      <div className="col-6 col-md-2">
        <div className={`card ${(rebalanceMode ? newTotalWeightDeviation : totalWeightDeviation) > 10 ? 'bg-warning' : 'bg-info'} text-white h-100`}>
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2">Weight Dev.</h6>
            {rebalanceMode && Math.abs(newTotalWeightDeviation - totalWeightDeviation) > 0.01 ? (
              <div style={valueStyle}>
                <div style={{ textDecoration: 'line-through', fontSize: '0.9rem', opacity: 0.6 }}>
                  {totalWeightDeviation.toFixed(2)}%
                </div>
                <h3 className="card-title mb-0">{newTotalWeightDeviation.toFixed(2)}%</h3>
                <small>
                  ({(newTotalWeightDeviation - totalWeightDeviation >= 0 ? '+' : '')}
                  {(newTotalWeightDeviation - totalWeightDeviation).toFixed(2)}%)
                </small>
              </div>
            ) : (
              <div style={valueStyle}>
                <h3 className="card-title mb-0">
                  {rebalanceMode ? newTotalWeightDeviation.toFixed(2) : totalWeightDeviation.toFixed(2)}%
                </h3>
                <small>Abs. differences</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
