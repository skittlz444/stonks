import React, { useState, useMemo } from 'react';
import { HoldingWithQuote, RebalanceData, SortDirection } from '../../types';
import { formatCurrencyWithCode } from '../../utils/formatting';

interface HoldingsTableProps {
  holdings: HoldingWithQuote[];
  cashAmount: number;
  portfolioTotal: number;
  rebalanceMode: boolean;
  rebalancingData?: RebalanceData | null;
  convert: (amount: number) => number;
  currency: string;
  hiddenColumns: Set<number>;
  isRefreshing?: boolean;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({
  holdings,
  cashAmount,
  portfolioTotal,
  rebalanceMode,
  rebalancingData,
  convert,
  currency,
  hiddenColumns,
  isRefreshing = false,
}) => {
  const [sortColumn, setSortColumn] = useState<number>(-1);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Helper function to format currency - only show USD code when NOT viewing USD prices
  const formatCurrency = (amount: number, decimals: number = 2) => {
    return formatCurrencyWithCode(amount, decimals, currency, currency !== 'USD');
  };

  // Style for blurring values during refresh
  const valueBlurClass = isRefreshing ? 'value-blur' : '';

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
    if (typeof window !== 'undefined' && typeof (window as any).showCompanyProfile === 'function') {
      (window as any).showCompanyProfile(code, name);
    }
  };

  const renderHeader = () => {
    const renderSortableHeader = (label: string, column: number, dataType: string, className = '') => (
      <th
        className={`sortable ${className} ${sortColumn === column ? 'active' : ''}`}
        data-column={column}
        data-type={dataType}
        onClick={() => handleSort(column)}
        style={{ 
          cursor: 'pointer', 
          userSelect: 'none',
          display: hiddenColumns.has(column) ? 'none' : undefined
        }}
      >
        {label} <span className={`sort-indicator ${sortColumn === column ? sortDirection : ''}`}></span>
      </th>
    );

    if (rebalanceMode) {
      return (
        <tr>
          {renderSortableHeader('Name', 0, 'text')}
          {renderSortableHeader('Symbol', 1, 'text')}
          {renderSortableHeader('Current Price', 2, 'number', 'text-end')}
          {renderSortableHeader('Quantity', 3, 'number', 'text-end')}
          {renderSortableHeader('Market Value', 4, 'number', 'text-end')}
          {renderSortableHeader('Weight', 5, 'number', 'text-end')}
          {renderSortableHeader('Target', 6, 'number', 'text-end')}
          {renderSortableHeader('Diff', 7, 'number', 'text-end')}
          <th className="text-center">Action</th>
        </tr>
      );
    }

    return (
      <tr>
        {renderSortableHeader('Name', 0, 'text')}
        {renderSortableHeader('Symbol', 1, 'text')}
        {renderSortableHeader('Current Price', 2, 'number', 'text-end')}
        {renderSortableHeader('Price Change', 3, 'number', 'text-end')}
        {renderSortableHeader('Quantity', 4, 'number', 'text-end')}
        {renderSortableHeader('Cost', 5, 'number', 'text-end')}
        {renderSortableHeader('Market Value', 6, 'number', 'text-end')}
        {renderSortableHeader('MV Change', 7, 'number', 'text-end')}
        {renderSortableHeader('Weight', 8, 'number', 'text-end')}
        {renderSortableHeader('Target', 9, 'number', 'text-end')}
        {renderSortableHeader('Diff', 10, 'number', 'text-end')}
        {renderSortableHeader('Total Gain/Loss', 11, 'number', 'text-end')}
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

    // Handle case where quote is not available (e.g., during initial load with placeholder data)
    if (!holding.quote) {
      return (
        <tr key={holding.id}>
          <td>{holding.name}</td>
          <td><code>{holding.code}</code></td>
          <td className="text-end">{holding.quantity}</td>
          <td colSpan={rebalanceMode ? 6 : 9} className="text-muted">
            <small>Loading...</small>
          </td>
        </tr>
      );
    }

    const quote = holding.quote;
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
        <td data-value={holding.name} style={{ display: hiddenColumns.has(0) ? 'none' : undefined }}>
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
        <td data-value={stockCode} style={{ display: hiddenColumns.has(1) ? 'none' : undefined }}><code>{stockCode}</code></td>
        <td className="text-end" data-value={quote.current} style={{ display: hiddenColumns.has(2) ? 'none' : undefined }}>{formatCurrency(convert(quote.current))}</td>
        <td className={`text-end ${changeClass}`} data-value={quote.change} style={{ display: hiddenColumns.has(3) ? 'none' : undefined }}>
          {changeIcon} {formatCurrency(Math.abs(convert(quote.change)))} ({quote.changePercent.toFixed(2)}%)
        </td>
        <td className="text-end" data-value={holding.quantity} style={{ display: hiddenColumns.has(4) ? 'none' : undefined }}>{holding.quantity.toFixed(0)}</td>
        <td className="text-end" data-value={holding.costBasis} style={{ display: hiddenColumns.has(5) ? 'none' : undefined }}>{formatCurrency(convert(holding.costBasis))}</td>
        <td className="text-end" data-value={holding.marketValue} style={{ display: hiddenColumns.has(6) ? 'none' : undefined }}>{formatCurrency(convert(holding.marketValue))}</td>
        <td className={`text-end ${changeClass}`} data-value={changeValue} style={{ display: hiddenColumns.has(7) ? 'none' : undefined }}>
          {changeIcon} {formatCurrency(Math.abs(convert(changeValue)))}
        </td>
        <td className="text-end" data-value={weight} style={{ display: hiddenColumns.has(8) ? 'none' : undefined }}>{weight.toFixed(2)}%</td>
        <td className="text-end" data-value={targetWeight != null ? targetWeight : ''} style={{ display: hiddenColumns.has(9) ? 'none' : undefined }}>
          {targetWeight != null ? targetWeight.toFixed(2) + '%' : '-'}
        </td>
        <td className={`text-end ${weightDiffClass}`} data-value={weightDiff != null ? weightDiff : ''} style={{ display: hiddenColumns.has(10) ? 'none' : undefined }}>
          {weightDiff != null ? (weightDiff >= 0 ? '+' : '') + weightDiff.toFixed(2) + '%' : '-'}
        </td>
        <td className={`text-end ${gainClass}`} data-value={holding.gain != null ? holding.gain : ''} style={{ display: hiddenColumns.has(11) ? 'none' : undefined }}>
          {holding.gain != null ? `${formatCurrency(convert(holding.gain))} (${holding.gainPercent?.toFixed(2) || '0.00'}%)` : '-'}
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
        <td style={{ display: hiddenColumns.has(0) ? 'none' : undefined }}><strong>Cash</strong></td>
        <td style={{ display: hiddenColumns.has(1) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(2) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(3) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(4) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(5) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(6) ? 'none' : undefined }}>{formatCurrency(convert(cashAmount))}</td>
        <td className="text-end" style={{ display: hiddenColumns.has(7) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(8) ? 'none' : undefined }}>{cashWeight.toFixed(2)}%</td>
        <td className="text-end" style={{ display: hiddenColumns.has(9) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(10) ? 'none' : undefined }}>-</td>
        <td className="text-end" style={{ display: hiddenColumns.has(11) ? 'none' : undefined }}>-</td>
      </tr>
    );
  };

  return (
    <div className="table-responsive">
      <table id="holdingsTable" className="table table-hover mb-0">
        <thead id="holdings-thead">
          {renderHeader()}
        </thead>
        <tbody id="holdings-tbody" className={valueBlurClass}>
          {sortedHoldings.map((holding, idx) => renderRow(holding, idx))}
          {renderCashRow()}
        </tbody>
      </table>
    </div>
  );
};
