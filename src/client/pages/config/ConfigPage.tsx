import React, { useEffect, useState } from 'react';
import { useConfigData } from '../../hooks/useConfigData';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export const ConfigPage: React.FC = () => {
  const { data, loading, error } = useConfigData();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check for success/error messages from form submission
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === '1') {
      setMessage({ type: 'success', text: 'Changes saved successfully!' });
    } else if (urlParams.get('error') === '1') {
      setMessage({ type: 'error', text: 'An error occurred while saving changes.' });
    }
  }, []);

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

  return (
    <div style={{ backgroundColor: '#212529', minHeight: '100vh', color: '#ffffff' }}>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">{data.portfolioName || 'Stock Portfolio'}</span>
          <div className="d-flex align-items-center">
            <a href="/stonks/prices" className="btn btn-sm btn-outline-light me-2">Prices</a>
            <a href="/stonks/ticker" className="btn btn-sm btn-outline-light me-2">Ticker</a>
            <a href="/stonks/charts" className="btn btn-sm btn-outline-light">Charts</a>
          </div>
        </div>
      </nav>

      <div className="container-fluid p-4">
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
            <form method="POST" action="/stonks/config">
              <input type="hidden" name="action" value="update_settings" />
              <div className="mb-3">
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
              <div className="mb-3">
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
              <button type="submit" className="btn btn-primary">Update Settings</button>
            </form>
          </div>
        </div>

        {/* Visible Holdings Card */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h3>
                <i className="bi bi-eye"></i> Visible Holdings
                {data.totalTargetWeight !== 100 && (
                  <span className="badge bg-warning text-dark ms-2">
                    Target weights: {data.totalTargetWeight.toFixed(1)}% (should be 100%)
                  </span>
                )}
              </h3>
            </div>
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
                    <th>Symbol</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-end">Target Weight</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.visibleHoldings.map((holding) => (
                    <tr key={holding.id}>
                      <td>{holding.name}</td>
                      <td><code>{holding.code}</code></td>
                      <td className="text-end">{holding.quantity.toFixed(2)}</td>
                      <td className="text-end">
                        {holding.target_weight != null ? `${holding.target_weight.toFixed(1)}%` : '-'}
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-info me-1">Edit</button>
                        <button className="btn btn-sm btn-outline-warning me-1">Hide</button>
                        <button className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                        <th>Symbol</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.hiddenHoldings.map((holding) => (
                        <tr key={holding.id}>
                          <td>{holding.name}</td>
                          <td><code>{holding.code}</code></td>
                          <td className="text-end">{holding.quantity.toFixed(2)}</td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-success me-1">Show</button>
                            <button className="btn btn-sm btn-outline-danger">Delete</button>
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
                <tbody>
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
                        <button className="btn btn-sm btn-outline-danger">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Note about forms */}
        <div className="alert alert-info">
          <strong>Note:</strong> Forms submit to server-side handlers. Modal functionality requires full implementation.
        </div>
      </div>
    </div>
  );
};
