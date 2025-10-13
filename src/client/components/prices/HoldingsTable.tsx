import React, { useState, useMemo } from 'react';
import { HoldingWithQuote, RebalanceData, SortDirection } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface HoldingsTableProps {
  holdings: HoldingWithQuote[];
  cashAmount: number;
  portfolioTotal: number;
  rebalanceMode: boolean;
  rebalancingData?: RebalanceData | null;
  convert: (amount: number) => number;
  currency: string;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  cashAmount,
  portfolioTotal,
  rebalanceMode,
  rebalancingData,
  convert,
  currency,
}) => {
  const [sortColumn, setSortColumn] = useState<number>(-1);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: number) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedHoldings = useMemo(() => {
    if (sortColumn === -1) return holdings;

    return [...holdings].sort((a, b) => {
      let aVal: any, bVal: any;

      if (rebalanceMode && rebalancingData) {
        const aRec = rebalancingData.recommendations.find(r => r.id === a.id);
        const bRec = rebalancingData.recommendations.find(r => r.id === b.id);

        switch (sortColumn) {
          case 0: // Name
            aVal = a.name;
            bVal = b.name;
            break;
          case 1: // Symbol
            aVal = a.code.includes(':') ? a.code.split(':')[1] : a.code;
            bVal = b.code.includes(':') ? b.code.split(':')[1] : b.code;
            break;
          case 2: // Current Price
            aVal = a.quote?.current || 0;
            bVal = b.quote?.current || 0;
            break;
          case 3: // Quantity
            aVal = aRec?.targetQuantity || a.quantity;
            bVal = bRec?.targetQuantity || b.quantity;
            break;
          case 4: // Market Value
            aVal = aRec?.targetValue || a.marketValue;
            bVal = bRec?.targetValue || b.marketValue;
            break;
          case 5: // Weight
            aVal = aRec ? aRec.newWeight : (portfolioTotal > 0 ? (a.marketValue / portfolioTotal) * 100 : 0);
            bVal = bRec ? bRec.newWeight : (portfolioTotal > 0 ? (b.marketValue / portfolioTotal) * 100 : 0);
            break;
          case 6: // Target
            aVal = a.target_weight ?? -999;
            bVal = b.target_weight ?? -999;
            break;
          case 7: // Diff
            const aWeight = aRec ? aRec.newWeight : (portfolioTotal > 0 ? (a.marketValue / portfolioTotal) * 100 : 0);
            const bWeight = bRec ? bRec.newWeight : (portfolioTotal > 0 ? (b.marketValue / portfolioTotal) * 100 : 0);
            aVal = a.target_weight != null ? aWeight - a.target_weight : -999;
            bVal = b.target_weight != null ? bWeight - b.target_weight : -999;
            break;
          case 8: // Action
            aVal = aRec?.action || 'HOLD';
            bVal = bRec?.action || 'HOLD';
            break;
          default:
            return 0;
        }
      } else {
        // Normal mode
        switch (sortColumn) {
          case 0: // Name
            aVal = a.name;
            bVal = b.name;
            break;
          case 1: // Symbol
            aVal = a.code.includes(':') ? a.code.split(':')[1] : a.code;
            bVal = b.code.includes(':') ? b.code.split(':')[1] : b.code;
            break;
          case 2: // Current Price
            aVal = a.quote?.current || 0;
            bVal = b.quote?.current || 0;
            break;
          case 3: // Price Change
            aVal = a.quote?.change || 0;
            bVal = b.quote?.change || 0;
            break;
          case 4: // Quantity
            aVal = a.quantity;
            bVal = b.quantity;
            break;
          case 5: // Cost
            aVal = a.costBasis;
            bVal = b.costBasis;
            break;
          case 6: // Market Value
            aVal = a.marketValue;
            bVal = b.marketValue;
            break;
          case 7: // MV Change
            aVal = a.quote ? a.quote.change * a.quantity : 0;
            bVal = b.quote ? b.quote.change * b.quantity : 0;
            break;
          case 8: // Weight
            aVal = portfolioTotal > 0 ? (a.marketValue / portfolioTotal) * 100 : 0;
            bVal = portfolioTotal > 0 ? (b.marketValue / portfolioTotal) * 100 : 0;
            break;
          case 9: // Target
            aVal = a.target_weight ?? -999;
            bVal = b.target_weight ?? -999;
            break;
          case 10: // Diff
            const aWeight = portfolioTotal > 0 ? (a.marketValue / portfolioTotal) * 100 : 0;
            const bWeight = portfolioTotal > 0 ? (b.marketValue / portfolioTotal) * 100 : 0;
            aVal = a.target_weight != null ? aWeight - a.target_weight : -999;
            bVal = b.target_weight != null ? bWeight - b.target_weight : -999;
            break;
          case 11: // Total Gain/Loss
            aVal = a.gain;
            bVal = b.gain;
            break;
          default:
            return 0;
        }
      }

      // Perform comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
      }
    });
  }, [holdings, sortColumn, sortDirection, rebalanceMode, rebalancingData, portfolioTotal]);

  const showCompanyProfile = (code: string, name: string) => {
    // This will be handled by a global function or modal component
    if (typeof (window as any).showCompanyProfile === 'function') {
      (window as any).showCompanyProfile(code, name);
    }
  };

  const renderHeader = () => {
    const renderSortableHeader = (label: string, column: number, className = '') => (
      <th
        className={`sortable ${className} ${sortColumn === column ? 'active' : ''}`}
        onClick={() => handleSort(column)}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        {label}{' '}
        <span className={`sort-indicator ${sortColumn === column ? sortDirection : ''}`}></span>
      </th>
    );

    if (rebalanceMode) {
      return (
        <tr>
          {renderSortableHeader('Name', 0)}
          {renderSortableHeader('Symbol', 1)}
          {renderSortableHeader('Current Price', 2, 'text-end')}
          {renderSortableHeader('Quantity', 3, 'text-end')}
          {renderSortableHeader('Market Value', 4, 'text-end')}
          {renderSortableHeader('Weight', 5, 'text-end')}
          {renderSortableHeader('Target', 6, 'text-end')}
          {renderSortableHeader('Diff', 7, 'text-end')}
          <th className="text-center">Action</th>
        </tr>
      );
    }

    return (
      <tr>
        {renderSortableHeader('Name', 0)}
        {renderSortableHeader('Symbol', 1)}
        {renderSortableHeader('Current Price', 2, 'text-end')}
        {renderSortableHeader('Price Change', 3, 'text-end')}
        {renderSortableHeader('Quantity', 4, 'text-end')}
        {renderSortableHeader('Cost', 5, 'text-end')}
        {renderSortableHeader('Market Value', 6, 'text-end')}
        {renderSortableHeader('MV Change', 7, 'text-end')}
        {renderSortableHeader('Weight', 8, 'text-end')}
        {renderSortableHeader('Target', 9, 'text-end')}
        {renderSortableHeader('Diff', 10, 'text-end')}
        {renderSortableHeader('Total Gain/Loss', 11, 'text-end')}
      </tr>
    );
  };

  const renderRow = (holding: HoldingWithQuote, idx: number) => {
    if (holding.error) {
      return (
        <tr key={holding.id}>
          <td>{holding.name}</td>
          <td><code>{holding.code}</code></td>
          <td className="text-end">{holding.quantity}</td>
          <td colSpan={rebalanceMode ? 6 : 9} className="text-danger">
            <small>Error: {holding.error}</small>
          </td>
        </tr>
      );
    }

    const quote = holding.quote!;
    const changeClass = quote.change >= 0 ? 'text-success' : 'text-danger';
    const changeIcon = quote.change >= 0 ? '▲' : '▼';
    const gainClass = holding.gain >= 0 ? 'text-success' : 'text-danger';
    const weight = portfolioTotal > 0 ? (holding.marketValue / portfolioTotal) * 100 : 0;
    const changeValue = quote.change * holding.quantity;
    const stockCode = holding.code.includes(':') ? holding.code.split(':')[1] : holding.code;

    const rebalanceRec = rebalanceMode && rebalancingData 
      ? rebalancingData.recommendations.find(r => r.id === holding.id)
      : null;
    
    const targetWeight = holding.target_weight;
    const oldWeightDiff = targetWeight != null ? weight - targetWeight : null;
    const newWeightDiff = (rebalanceMode && rebalanceRec && targetWeight != null) 
      ? rebalanceRec.newWeight - targetWeight 
      : null;
    const weightDiffChange = (oldWeightDiff != null && newWeightDiff != null) 
      ? Math.abs(newWeightDiff) - Math.abs(oldWeightDiff) 
      : null;
    const weightDiff = (rebalanceMode && rebalanceRec) ? newWeightDiff : oldWeightDiff;
    const weightDiffClass = weightDiff != null ? (weightDiff >= 0 ? 'text-success' : 'text-danger') : '';

    if (rebalanceMode && rebalanceRec) {
      const qtyChangeClass = rebalanceRec.quantityChange > 0 
        ? 'text-success' 
        : (rebalanceRec.quantityChange < 0 ? 'text-danger' : 'text-muted');
      const valueChangeClass = rebalanceRec.valueChange > 0 
        ? 'text-danger' 
        : (rebalanceRec.valueChange < 0 ? 'text-success' : 'text-muted');
      const actionBadgeClass = rebalanceRec.action === 'BUY' 
        ? 'bg-success' 
        : (rebalanceRec.action === 'SELL' ? 'bg-danger' : 'bg-secondary');

      return (
        <tr key={holding.id} data-holding="true">
          <td>
            <strong>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); showCompanyProfile(holding.code, holding.name); }}
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {holding.name}
              </a>
            </strong>
          </td>
          <td><code>{stockCode}</code></td>
          <td className="text-end">{formatCurrency(convert(quote.current))}</td>
          <td className="text-end">
            {rebalanceRec.quantityChange !== 0 ? (
              <>
                <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                  {holding.quantity.toFixed(0)}
                </span>
                <strong> {rebalanceRec.targetQuantity.toFixed(0)}</strong>
                <span className={qtyChangeClass}>
                  {' '}({rebalanceRec.quantityChange >= 0 ? '+' : ''}{rebalanceRec.quantityChange.toFixed(0)})
                </span>
              </>
            ) : (
              <strong>{rebalanceRec.targetQuantity.toFixed(0)}</strong>
            )}
          </td>
          <td className="text-end">
            {Math.abs(rebalanceRec.valueChange) > 0.01 ? (
              <>
                <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                  {formatCurrency(convert(holding.marketValue))}
                </span>
                <strong> {formatCurrency(convert(rebalanceRec.targetValue))}</strong>
                <span className={valueChangeClass}>
                  {' '}({rebalanceRec.valueChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(convert(rebalanceRec.valueChange)))})
                </span>
              </>
            ) : (
              <strong>{formatCurrency(convert(rebalanceRec.targetValue))}</strong>
            )}
          </td>
          <td className="text-end">
            {Math.abs(rebalanceRec.newWeight - weight) > 0.01 ? (
              <>
                <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                  {weight.toFixed(2)}%
                </span>
                <strong> {rebalanceRec.newWeight.toFixed(2)}%</strong>
              </>
            ) : (
              <strong>{rebalanceRec.newWeight.toFixed(2)}%</strong>
            )}
          </td>
          <td className="text-end">
            {targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}
          </td>
          <td className="text-end">
            {oldWeightDiff != null ? (
              Math.abs(weightDiffChange || 0) > 0.01 ? (
                <>
                  <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                    {(oldWeightDiff >= 0 ? '+' : '')}{oldWeightDiff.toFixed(2)}%
                  </span>
                  <strong className={weightDiffClass}>
                    {' '}{(newWeightDiff! >= 0 ? '+' : '')}{newWeightDiff!.toFixed(2)}%
                  </strong>
                  <span className="text-muted">
                    {' '}({(weightDiffChange! >= 0 ? '+' : '')}{weightDiffChange!.toFixed(2)}%)
                  </span>
                </>
              ) : (
                <strong className={weightDiffClass}>
                  {(newWeightDiff! >= 0 ? '+' : '')}{newWeightDiff!.toFixed(2)}%
                </strong>
              )
            ) : '-'}
          </td>
          <td className="text-center">
            <span className={`badge ${actionBadgeClass}`}>{rebalanceRec.action}</span>
          </td>
        </tr>
      );
    }

    // Normal mode
    return (
      <tr key={holding.id} data-holding="true">
        <td>
          <strong>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); showCompanyProfile(holding.code, holding.name); }}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {holding.name}
            </a>
          </strong>
        </td>
        <td><code>{stockCode}</code></td>
        <td className="text-end">{formatCurrency(convert(quote.current))}</td>
        <td className={`text-end ${changeClass}`}>
          {changeIcon} {formatCurrency(Math.abs(convert(quote.change)))} ({quote.changePercent.toFixed(2)}%)
        </td>
        <td className="text-end">{holding.quantity.toFixed(0)}</td>
        <td className="text-end" style={{ display: 'none' }}>{formatCurrency(convert(holding.costBasis))}</td>
        <td className="text-end">{formatCurrency(convert(holding.marketValue))}</td>
        <td className={`text-end ${changeClass}`}>
          {changeIcon} {formatCurrency(Math.abs(convert(changeValue)))}
        </td>
        <td className="text-end">{weight.toFixed(2)}%</td>
        <td className="text-end">
          {targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}
        </td>
        <td className={`text-end ${weightDiffClass}`}>
          {weightDiff != null ? (weightDiff >= 0 ? '+' : '') + weightDiff.toFixed(2) + '%' : '-'}
        </td>
        <td className={`text-end ${gainClass}`}>
          {formatCurrency(convert(holding.gain))} ({holding.gainPercent.toFixed(2)}%)
        </td>
      </tr>
    );
  };

  const renderCashRow = () => {
    const cashWeight = portfolioTotal > 0 ? (cashAmount / portfolioTotal) * 100 : 0;

    if (rebalanceMode && rebalancingData) {
      const newCash = rebalancingData.newCash;
      const cashChange = rebalancingData.cashChange;
      const cashChangeClass = cashChange > 0 
        ? 'text-success' 
        : (cashChange < 0 ? 'text-danger' : 'text-muted');
      const newCashWeight = portfolioTotal > 0 ? (newCash / portfolioTotal) * 100 : 0;

      return (
        <tr>
          <td><strong>Cash</strong></td>
          <td>-</td>
          <td className="text-end">-</td>
          <td className="text-end">
            <span className="text-muted" style={{ textDecoration: 'line-through' }}>-</span>
            <strong> -</strong>
          </td>
          <td className="text-end">
            {Math.abs(cashChange) > 0.01 ? (
              <>
                <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                  {formatCurrency(convert(cashAmount))}
                </span>
                <strong> {formatCurrency(convert(newCash))}</strong>
                <span className={cashChangeClass}>
                  {' '}({cashChange >= 0 ? '+' : '-'}{formatCurrency(Math.abs(convert(cashChange)))})
                </span>
              </>
            ) : (
              <strong>{formatCurrency(convert(newCash))}</strong>
            )}
          </td>
          <td className="text-end">
            {Math.abs(newCashWeight - cashWeight) > 0.01 ? (
              <>
                <span className="text-muted" style={{ textDecoration: 'line-through' }}>
                  {cashWeight.toFixed(2)}%
                </span>
                <strong> {newCashWeight.toFixed(2)}%</strong>
                <span className="text-muted">
                  {' '}({(newCashWeight - cashWeight >= 0 ? '+' : '')}{(newCashWeight - cashWeight).toFixed(2)}%)
                </span>
              </>
            ) : (
              <strong>{newCashWeight.toFixed(2)}%</strong>
            )}
          </td>
          <td className="text-end">-</td>
          <td className="text-end">-</td>
          <td className="text-center">-</td>
        </tr>
      );
    }

    // Normal mode
    return (
      <tr>
        <td><strong>Cash</strong></td>
        <td>-</td>
        <td className="text-end">-</td>
        <td className="text-end">-</td>
        <td className="text-end">-</td>
        <td className="text-end" style={{ display: 'none' }}>-</td>
        <td className="text-end">{formatCurrency(convert(cashAmount))}</td>
        <td className="text-end">-</td>
        <td className="text-end">{cashWeight.toFixed(2)}%</td>
        <td className="text-end">-</td>
        <td className="text-end">-</td>
        <td className="text-end">-</td>
      </tr>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-dark table-hover" id="holdingsTable">
        <thead id="holdings-thead">
          {renderHeader()}
        </thead>
        <tbody id="holdings-tbody">
          {sortedHoldings.map((holding, idx) => renderRow(holding, idx))}
          {renderCashRow()}
        </tbody>
      </table>
    </div>
  );
};
