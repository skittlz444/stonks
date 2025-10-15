import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricesControls } from '../../../../src/client/components/prices/PricesControls';

describe('PricesControls', () => {
  const mockOnCurrencyChange = vi.fn();
  const mockOnRebalanceToggle = vi.fn();

  const defaultProps = {
    rebalanceMode: false,
    currency: 'USD',
    fxAvailable: true,
    onCurrencyChange: mockOnCurrencyChange,
    onRebalanceToggle: mockOnRebalanceToggle,
  };

  beforeEach(() => {
    mockOnCurrencyChange.mockClear();
    mockOnRebalanceToggle.mockClear();
  });

  test('should render currency buttons when not in rebalance mode', () => {
    render(<PricesControls {...defaultProps} />);
    
    expect(screen.getByText('Currency:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'USD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SGD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AUD' })).toBeInTheDocument();
  });

  test('should not render currency buttons when in rebalance mode', () => {
    render(<PricesControls {...defaultProps} rebalanceMode={true} />);
    
    expect(screen.queryByText('Currency:')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'USD' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'SGD' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AUD' })).not.toBeInTheDocument();
  });

  test('should highlight selected currency button', () => {
    const { rerender } = render(<PricesControls {...defaultProps} currency="USD" />);
    
    expect(screen.getByRole('button', { name: 'USD' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'SGD' })).toHaveClass('btn-outline-primary');
    
    rerender(<PricesControls {...defaultProps} currency="SGD" />);
    
    expect(screen.getByRole('button', { name: 'SGD' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'USD' })).toHaveClass('btn-outline-primary');
  });

  test('should call onCurrencyChange when currency button is clicked', () => {
    render(<PricesControls {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'SGD' }));
    
    expect(mockOnCurrencyChange).toHaveBeenCalledTimes(1);
    expect(mockOnCurrencyChange).toHaveBeenCalledWith('SGD');
  });

  test('should disable SGD and AUD when fxAvailable is false', () => {
    render(<PricesControls {...defaultProps} fxAvailable={false} />);
    
    const usdButton = screen.getByRole('button', { name: 'USD' });
    const sgdButton = screen.getByRole('button', { name: 'SGD' });
    const audButton = screen.getByRole('button', { name: 'AUD' });
    
    expect(usdButton).not.toHaveClass('disabled');
    expect(sgdButton).toHaveClass('disabled');
    expect(audButton).toHaveClass('disabled');
  });

  test('should not call onCurrencyChange when clicking disabled currency button', () => {
    render(<PricesControls {...defaultProps} fxAvailable={false} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'SGD' }));
    
    expect(mockOnCurrencyChange).not.toHaveBeenCalled();
  });

  test('should show tooltip for disabled currency buttons', () => {
    render(<PricesControls {...defaultProps} fxAvailable={false} />);
    
    const sgdButton = screen.getByRole('button', { name: 'SGD' });
    const audButton = screen.getByRole('button', { name: 'AUD' });
    
    expect(sgdButton).toHaveAttribute('title', 'Requires OpenExchangeRates API key');
    expect(audButton).toHaveAttribute('title', 'Requires OpenExchangeRates API key');
  });

  test('should render rebalance button with correct text when not in rebalance mode', () => {
    render(<PricesControls {...defaultProps} rebalanceMode={false} />);
    
    expect(screen.getByRole('button', { name: 'Rebalance Portfolio' })).toBeInTheDocument();
  });

  test('should render rebalance button with correct text when in rebalance mode', () => {
    render(<PricesControls {...defaultProps} rebalanceMode={true} />);
    
    expect(screen.getByRole('button', { name: 'Exit Rebalance Mode' })).toBeInTheDocument();
  });

  test('should highlight rebalance button when in rebalance mode', () => {
    const { rerender } = render(<PricesControls {...defaultProps} rebalanceMode={false} />);
    
    expect(screen.getByRole('button', { name: 'Rebalance Portfolio' })).toHaveClass('btn-outline-warning');
    
    rerender(<PricesControls {...defaultProps} rebalanceMode={true} />);
    
    expect(screen.getByRole('button', { name: 'Exit Rebalance Mode' })).toHaveClass('btn-warning');
  });

  test('should call onRebalanceToggle when rebalance button is clicked', () => {
    render(<PricesControls {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Rebalance Portfolio' }));
    
    expect(mockOnRebalanceToggle).toHaveBeenCalledTimes(1);
  });

  test('should disable rebalance button when currency is not USD and not in rebalance mode', () => {
    render(<PricesControls {...defaultProps} currency="SGD" rebalanceMode={false} />);
    
    const rebalanceButton = screen.getByRole('button', { name: 'Rebalance Portfolio' });
    
    expect(rebalanceButton).toHaveClass('disabled');
    expect(rebalanceButton).toBeDisabled();
  });

  test('should enable rebalance button when currency is USD', () => {
    render(<PricesControls {...defaultProps} currency="USD" rebalanceMode={false} />);
    
    const rebalanceButton = screen.getByRole('button', { name: 'Rebalance Portfolio' });
    
    expect(rebalanceButton).not.toHaveClass('disabled');
    expect(rebalanceButton).not.toBeDisabled();
  });

  test('should enable rebalance button when in rebalance mode regardless of currency', () => {
    render(<PricesControls {...defaultProps} currency="SGD" rebalanceMode={true} />);
    
    const rebalanceButton = screen.getByRole('button', { name: 'Exit Rebalance Mode' });
    
    expect(rebalanceButton).not.toBeDisabled();
  });

  test('should call all currency change handlers', () => {
    render(<PricesControls {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'USD' }));
    expect(mockOnCurrencyChange).toHaveBeenCalledWith('USD');
    
    fireEvent.click(screen.getByRole('button', { name: 'SGD' }));
    expect(mockOnCurrencyChange).toHaveBeenCalledWith('SGD');
    
    fireEvent.click(screen.getByRole('button', { name: 'AUD' }));
    expect(mockOnCurrencyChange).toHaveBeenCalledWith('AUD');
    
    expect(mockOnCurrencyChange).toHaveBeenCalledTimes(3);
  });
});
