import React from 'react';

interface ColumnControlsProps {
  hiddenColumns: Set<number>;
  onToggleColumn: (column: number) => void;
}

export const ColumnControls: React.FC<ColumnControlsProps> = ({ hiddenColumns, onToggleColumn }) => {
  const columns = [
    { id: 0, label: 'Name' },
    { id: 1, label: 'Symbol' },
    { id: 2, label: 'Current Price' },
    { id: 3, label: 'Price Change' },
    { id: 4, label: 'Quantity' },
    { id: 5, label: 'Cost' },
    { id: 6, label: 'Market Value' },
    { id: 7, label: 'MV Change' },
    { id: 8, label: 'Weight' },
    { id: 9, label: 'Target' },
    { id: 10, label: 'Diff' },
    { id: 11, label: 'Total Gain/Loss' },
  ];

  return (
    <div className="card-body border-bottom">
      <div className="row g-2">
        {columns.map(col => (
          <div key={col.id} className="col-auto">
            <div className="form-check form-check-inline">
              <input
                className="form-check-input column-toggle"
                type="checkbox"
                id={`col-${col.id}`}
                checked={!hiddenColumns.has(col.id)}
                onChange={() => onToggleColumn(col.id)}
              />
              <label className="form-check-label" htmlFor={`col-${col.id}`}>
                {col.label}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
