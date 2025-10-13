import React from 'react';
import { formatCurrency, getCurrencySymbol } from '../../utils/formatting';
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
}) => {
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

  const altCurrencySymbol = altCurrency ? getCurrencySymbol(altCurrency) : '';

  return (
    <div className="row g-3 mb-4" id="summary-cards">
      {/* Portfolio Value Card */}
      <div className="col-6 col-md-2">
        <div className="card bg-primary text-white h-100">
          <div className="card-body" style={{ minHeight: '100px' }}>
            <h6 className="card-subtitle mb-2">Portfolio Value</h6>
            <h3 className="card-title mb-0">{formatCurrency(convert(portfolioTotal))}</h3>
            {fxAvailable && altCurrency && convertToAlt && (
              <small className="opacity-75">
                {altCurrencySymbol}{formatCurrency(convertToAlt(portfolioTotal))}
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
              <>
                <div style={{ textDecoration: 'line-through', fontSize: '0.9rem', opacity: 0.6 }}>
                  {formatCurrency(convert(totalMarketValue))}
                </div>
                <h3 className="card-title mb-0">{formatCurrency(convert(newTotalMarketValue))}</h3>
                <small className="text-muted">
                  ({newTotalMarketValue - totalMarketValue >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(convert(newTotalMarketValue - totalMarketValue)))})
                </small>
              </>
            ) : (
              <>
                <h3 className="card-title mb-0">
                  {formatCurrency(convert(rebalanceMode ? newTotalMarketValue : totalMarketValue))}
                </h3>
                {fxAvailable && altCurrency && convertToAlt && (
                  <small className="text-muted">
                    {altCurrencySymbol}
                    {formatCurrency(convertToAlt(rebalanceMode ? newTotalMarketValue : totalMarketValue))}
                  </small>
                )}
                {!fxAvailable && (
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                    Multi-currency disabled
                  </small>
                )}
              </>
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
              <>
                <div style={{ textDecoration: 'line-through', fontSize: '0.9rem', opacity: 0.6 }}>
                  {formatCurrency(convert(cashAmount))}
                </div>
                <h3 className="card-title mb-0">{formatCurrency(convert(rebalancingData.newCash))}</h3>
                <small className="text-muted">
                  ({rebalancingData.cashChange >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(convert(rebalancingData.cashChange)))})
                </small>
              </>
            ) : (
              <h3 className="card-title mb-0">
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
              <h3 className="card-title mb-0">{formatCurrency(convert(totalChangeValue))}</h3>
              <small>{totalChangePercent.toFixed(2)}%</small>
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
              <h3 className="card-title mb-0">{formatCurrency(convert(totalGain))}</h3>
              <small>{totalGainPercent.toFixed(2)}%</small>
            </div>
          </div>
        </div>
      )}

      {/* Weight Deviation Card (only in normal mode) */}
      {!rebalanceMode && (
        <div className="col-6 col-md-2">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body" style={{ minHeight: '100px' }}>
              <h6 className="card-subtitle mb-2">Weight Deviation</h6>
              <h3 className="card-title mb-0">{totalWeightDeviation.toFixed(1)}%</h3>
              <small>From targets</small>
            </div>
          </div>
        </div>
      )}

      {/* Rebalance Weight Deviation Card (only in rebalance mode) */}
      {rebalanceMode && rebalancingData && (
        <div className="col-6 col-md-2">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body" style={{ minHeight: '100px' }}>
              <h6 className="card-subtitle mb-2">New Weight Deviation</h6>
              <h3 className="card-title mb-0">{newTotalWeightDeviation.toFixed(1)}%</h3>
              <small>After rebalancing</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
