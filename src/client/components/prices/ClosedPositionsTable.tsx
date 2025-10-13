import React, { useState, useMemo } from 'react';
import { ClosedPosition, SortDirection } from '../../types';
import { formatCurrency } from '../../utils/formatting';

interface ClosedPositionsTableProps {
  closedPositions: ClosedPosition[];
  convert: (amount: number) => number;
  currency: string;
}

export const ClosedPositionsTable: React.FC<ClosedPositionsTableProps> = ({
  closedPositions,
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

  const sortedPositions = useMemo(() => {
    if (sortColumn === -1) return closedPositions;

    return [...closedPositions].sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortColumn) {
        case 0: // Name
          aVal = a.name;
          bVal = b.name;
          break;
        case 1: // Symbol
          aVal = a.code.includes(':') ? a.code.split(':')[1] : a.code;
          bVal = b.code.includes(':') ? b.code.split(':')[1] : b.code;
          break;
        case 2: // Total Cost
          aVal = a.totalCost;
          bVal = b.totalCost;
          break;
        case 3: // Total Revenue
          aVal = a.totalRevenue;
          bVal = b.totalRevenue;
          break;
        case 4: // Profit/Loss $
          aVal = a.profitLoss;
          bVal = b.profitLoss;
          break;
        case 5: // Profit/Loss %
          aVal = a.profitLossPercent;
          bVal = b.profitLossPercent;
          break;
        case 6: // Transactions
          aVal = a.transactions;
          bVal = b.transactions;
          break;
        default:
          return 0;
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
  }, [closedPositions, sortColumn, sortDirection]);

  const showCompanyProfile = (code: string, name: string) => {
    if (typeof (window as any).showCompanyProfile === 'function') {
      (window as any).showCompanyProfile(code, name);
    }
  };

  const renderSortableHeader = (label: string, column: number, className = '') => (
    <th
      className={`sortable-closed ${className} ${sortColumn === column ? 'active' : ''}`}
      onClick={() => handleSort(column)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}{' '}
      <span className={`sort-indicator ${sortColumn === column ? sortDirection : ''}`}></span>
    </th>
  );

  // Calculate totals
  const totalClosedCost = closedPositions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const totalClosedRevenue = closedPositions.reduce((sum, pos) => sum + pos.totalRevenue, 0);
  const totalClosedProfit = totalClosedRevenue - totalClosedCost;
  const totalClosedPercent = totalClosedCost > 0 ? (totalClosedProfit / totalClosedCost) * 100 : 0;
  const totalProfitClass = totalClosedProfit >= 0 ? 'text-success' : 'text-danger';

  return (
    <div className="accordion mt-4" id="closedPositionsAccordion">
      <div className="accordion-item">
        <h2 className="accordion-header" id="closedPositionsHeading">
          <button
            className="accordion-button collapsed"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#closedPositionsCollapse"
            aria-expanded="false"
            aria-controls="closedPositionsCollapse"
          >
            <strong>📈 Closed Positions ({closedPositions.length})</strong>
          </button>
        </h2>
        <div
          id="closedPositionsCollapse"
          className="accordion-collapse collapse"
          aria-labelledby="closedPositionsHeading"
          data-bs-parent="#closedPositionsAccordion"
        >
          <div className="accordion-body p-0">
            <div className="table-responsive">
              <table id="closedPositionsTable" className="table table-striped mb-0">
                <thead>
                  <tr>
                    {renderSortableHeader('Name', 0)}
                    {renderSortableHeader('Symbol', 1)}
                    {renderSortableHeader('Total Cost', 2, 'text-end')}
                    {renderSortableHeader('Total Revenue', 3, 'text-end')}
                    {renderSortableHeader('Profit/Loss $', 4, 'text-end')}
                    {renderSortableHeader('Profit/Loss %', 5, 'text-end')}
                    {renderSortableHeader('Transactions', 6, 'text-end')}
                  </tr>
                </thead>
                <tbody>
                  {sortedPositions.map((position, idx) => {
                    const profitClass = position.profitLoss >= 0 ? 'text-success' : 'text-danger';
                    const stockCode = position.code.includes(':') 
                      ? position.code.split(':')[1] 
                      : position.code;

                    return (
                      <tr key={idx} data-closed="true">
                        <td>
                          <strong>
                            <a
                              href="#"
                              onClick={(e) => { 
                                e.preventDefault(); 
                                showCompanyProfile(position.code, position.name); 
                              }}
                              style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                              {position.name}
                            </a>
                          </strong>
                        </td>
                        <td><code>{stockCode}</code></td>
                        <td className="text-end">{formatCurrency(convert(position.totalCost))}</td>
                        <td className="text-end">{formatCurrency(convert(position.totalRevenue))}</td>
                        <td className={`text-end ${profitClass}`}>
                          {formatCurrency(convert(position.profitLoss))}
                        </td>
                        <td className={`text-end ${profitClass}`}>
                          {position.profitLossPercent.toFixed(2)}%
                        </td>
                        <td className="text-end">
                          <small className="text-muted">{position.transactions} txns</small>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="fw-bold">
                    <td colSpan={2}><strong>Total Realized Gains</strong></td>
                    <td className="text-end">{formatCurrency(convert(totalClosedCost))}</td>
                    <td className="text-end">{formatCurrency(convert(totalClosedRevenue))}</td>
                    <td className={`text-end ${totalProfitClass}`}>
                      {formatCurrency(convert(totalClosedProfit))}
                    </td>
                    <td className={`text-end ${totalProfitClass}`}>
                      {totalClosedPercent.toFixed(2)}%
                    </td>
                    <td className="text-end">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
