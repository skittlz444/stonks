import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';

interface EditHoldingData {
  id: number;
  name: string;
  code: string;
  target_weight?: number;
}

export const ConfigPage: React.FC = () => {
  const { configData: data, loading, error, isRefreshing, refetch } = useConfig();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editHolding, setEditHolding] = useState<EditHoldingData | null>(null);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('/stonks/config', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
        // Close any open modals
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach((modalElement) => {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        });
        // Reset form
        form.reset();
        // Refetch data to update the UI
        await refetch();
      } else {
        const result = await response.json() as { error?: string };
        setMessage({ type: 'error', text: result.error || 'An error occurred while saving changes.' });
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setMessage({ type: 'error', text: 'An error occurred while saving changes.' });
    }
  };

  const handleDelete = async (action: string, id: number, confirmMessage: string) => {
    if (!confirm(confirmMessage)) {
      return;
    }

    const formData = new FormData();
    formData.append('action', action);
    formData.append(action === 'delete_transaction' ? 'transaction_id' : 'holding_id', id.toString());

    try {
      const response = await fetch('/stonks/config', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Deleted successfully!' });
        await refetch();
      } else {
        const result = await response.json() as { error?: string };
        setMessage({ type: 'error', text: result.error || 'An error occurred while deleting.' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: 'An error occurred while deleting.' });
    }
  };

  const handleToggleVisibility = async (holdingId: number) => {
    const formData = new FormData();
    formData.append('action', 'toggle_visibility');
    formData.append('holding_id', holdingId.toString());

    try {
      const response = await fetch('/stonks/config', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Visibility updated!' });
        await refetch();
      } else {
        const result = await response.json() as { error?: string };
        setMessage({ type: 'error', text: result.error || 'An error occurred while updating visibility.' });
      }
    } catch (err) {
      console.error('Toggle visibility error:', err);
      setMessage({ type: 'error', text: 'An error occurred while updating visibility.' });
    }
  };

  // Only show loading spinner on initial load, not on refetch
  if (loading && !data) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Style for blurring table values during refresh
  const tableBlurClass = isRefreshing ? 'value-blur' : '';

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
      <div className="container mt-4">
        <h1 className="mb-4">Portfolio Configuration</h1>

        {/* Form Messages */}
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Portfolio Settings Card */}
        <div className="card mb-4">
          <div className="card-header">
            <h3>Portfolio Settings</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleFormSubmit}>
              <input type="hidden" name="action" value="update_settings" />
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="portfolio_name" className="form-label">Portfolio Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="portfolio_name"
                    name="portfolio_name"
                    defaultValue={data.portfolioName}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="cash_amount" className="form-label">Cash Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="cash_amount"
                    name="cash_amount"
                    step="0.01"
                    defaultValue={data.cashAmount}
                    required
                  />
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary">Update Settings</button>
            </form>
          </div>
        </div>

        {/* Portfolio Holdings Card */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Portfolio Holdings</h3>
            <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#addHoldingModal">
              Add Holding
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Target Weight</th>
                    <th className="text-center">Visibility</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={tableBlurClass}>
                  {data.visibleHoldings.map((holding) => (
                    <tr key={holding.id}>
                      <td>{holding.name}</td>
                      <td><code style={{ color: '#e83e8c' }}>{holding.code}</code></td>
                      <td className="text-end">{holding.quantity.toFixed(2)} <small className="text-muted">(from txns)</small></td>
                      <td className="text-end">
                        {holding.target_weight != null ? `${holding.target_weight.toFixed(0)}%` : '-'}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleToggleVisibility(holding.id)}
                          style={{ minWidth: '80px' }}
                        >
                          <i className="bi bi-eye"></i> Visible
                        </button>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          onClick={() => {
                            setEditHolding(holding);
                            // Bootstrap 5 modal API
                            const modalElement = document.getElementById('editHoldingModal');
                            if (modalElement) {
                              const modal = new (window as any).bootstrap.Modal(modalElement);
                              modal.show();
                            }
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete('delete_holding', holding.id, `Delete ${holding.name}? This will also delete all associated transactions.`)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Total Target Weight */}
              <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-2">
                <strong>Total Target Weight:</strong>
                <span className={`badge ${data.totalTargetWeight === 100 ? 'bg-success' : 'bg-warning text-dark'} fs-6 px-3 py-2`}>
                  {data.totalTargetWeight.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Holdings Card */}
        {data.hiddenHoldings.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <button
                className="btn btn-link text-white text-decoration-none p-0"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#hiddenHoldingsCollapse"
              >
                <i className="bi bi-eye-slash"></i> Hidden Holdings ({data.hiddenHoldings.length})
                <small className="text-muted ms-2">- Not shown on ticker/charts</small>
              </button>
            </div>
            <div className="collapse" id="hiddenHoldingsCollapse">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Code</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-center">Visibility</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={tableBlurClass}>
                      {data.hiddenHoldings.map((holding) => (
                        <tr key={holding.id}>
                          <td>{holding.name}</td>
                          <td><code style={{ color: '#e83e8c' }}>{holding.code}</code></td>
                          <td className="text-end">{holding.quantity.toFixed(2)} <small className="text-muted">(from txns)</small></td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleToggleVisibility(holding.id)}
                              style={{ minWidth: '80px' }}
                            >
                              <i className="bi bi-eye-slash"></i> Hidden
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete('delete_holding', holding.id, `Delete ${holding.name}? This will also delete all associated transactions.`)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Card */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3>Transactions</h3>
            <button className="btn btn-success" data-bs-toggle="modal" data-bs-target="#addTransactionModal">
              Add Transaction
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Stock</th>
                    <th>Type</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Price</th>
                    <th>Notes</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className={tableBlurClass}>
                  {data.transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>{new Date(txn.date).toLocaleDateString()}</td>
                      <td>{txn.holding_name || 'Unknown'}</td>
                      <td>
                        <span className={`badge ${txn.type === 'buy' ? 'bg-success' : 'bg-danger'}`}>
                          {txn.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end">{txn.quantity.toFixed(2)}</td>
                      <td className="text-end">${txn.price.toFixed(2)}</td>
                      <td>{txn.notes || '-'}</td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete('delete_transaction', txn.id, 'Delete this transaction?')}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Add Holding Modal */}
      <div className="modal fade" id="addHoldingModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Holding</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <input type="hidden" name="action" value="add_holding" />
                
                <div className="mb-3">
                  <label htmlFor="add_name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="add_name"
                    name="name"
                    placeholder="e.g., Apple Inc."
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="add_code" className="form-label">Stock Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="add_code"
                    name="code"
                    placeholder="e.g., NASDAQ:AAPL or BATS:AAPL"
                    required
                  />
                  <div className="form-text">Use format: EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL, BATS:VOO)</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="add_target_weight" className="form-label">Target Weight (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    id="add_target_weight"
                    name="target_weight"
                    placeholder="e.g., 25.00 (optional)"
                  />
                  <div className="form-text">
                    Target portfolio allocation percentage (0-100). Leave empty for no target. Add transactions to set quantity.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Holding</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Holding Modal */}
      <div className="modal fade" id="editHoldingModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Edit Holding</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleFormSubmit} key={editHolding?.id || 'edit-form'}>
              <div className="modal-body">
                <input type="hidden" name="action" value="update_holding" />
                <input type="hidden" name="holding_id" value={editHolding?.id || ''} />
                
                <div className="mb-3">
                  <label htmlFor="edit_name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit_name"
                    name="name"
                    defaultValue={editHolding?.name || ''}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit_code" className="form-label">Stock Code</label>
                  <input
                    type="text"
                    className="form-control"
                    id="edit_code"
                    name="code"
                    defaultValue={editHolding?.code || ''}
                    required
                  />
                  <div className="form-text">Use format: EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL, BATS:VOO)</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="edit_target_weight" className="form-label">Target Weight (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-control"
                    id="edit_target_weight"
                    name="target_weight"
                    defaultValue={editHolding?.target_weight || ''}
                    placeholder="e.g., 25.00 (optional)"
                  />
                  <div className="form-text">
                    Target portfolio allocation percentage (0-100). Leave empty for no target. Quantity is derived from transactions.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Holding</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <div className="modal fade" id="addTransactionModal" tabIndex={-1}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Transaction</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <input type="hidden" name="action" value="add_transaction" />
                
                <div className="mb-3">
                  <label htmlFor="txn_type" className="form-label">Transaction Type</label>
                  <select className="form-control" id="txn_type" name="type" required>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="txn_code" className="form-label">Stock Code</label>
                  <select className="form-control" id="txn_code" name="code" required>
                    <option value="">Select a stock...</option>
                    {data && [...data.visibleHoldings, ...data.hiddenHoldings].map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Select from existing holdings or add a new holding first.</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="txn_date" className="form-label">Transaction Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="txn_date"
                    name="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="txn_quantity" className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    id="txn_quantity"
                    name="quantity"
                    placeholder="e.g., 10.5"
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="txn_value" className="form-label">Transaction Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="txn_value"
                    name="value"
                    placeholder="e.g., 1250.00"
                    required
                  />
                  <div className="form-text">Total value before fees</div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="txn_fee" className="form-label">Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    id="txn_fee"
                    name="fee"
                    placeholder="e.g., 10.00"
                    defaultValue="0"
                  />
                  <div className="form-text">Trading fee or commission</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Transaction</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
