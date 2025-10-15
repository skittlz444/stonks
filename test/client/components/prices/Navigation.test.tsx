import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../../../../src/client/components/prices/Navigation';

describe('Navigation', () => {
  const defaultProps = {
    rebalanceMode: false,
    currency: 'USD' as const,
    fxAvailable: false,
    portfolioName: 'My Portfolio'
  };

  test('should render navigation bar with portfolio name', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
  });

  test('should display default portfolio name when not provided', () => {
    render(<Navigation {...defaultProps} portfolioName="" />);
    expect(screen.getByText('Stock Portfolio')).toBeInTheDocument();
  });

  test('should show Exit Rebalance Mode button when in rebalance mode', () => {
    render(<Navigation {...defaultProps} rebalanceMode={true} />);
    expect(screen.getByText('Exit Rebalance Mode')).toBeInTheDocument();
  });

  test('should show Rebalance Portfolio button when not in rebalance mode', () => {
    render(<Navigation {...defaultProps} rebalanceMode={false} />);
    expect(screen.getByText('Rebalance Portfolio')).toBeInTheDocument();
  });

  test('should show currency selector in normal mode', () => {
    render(<Navigation {...defaultProps} rebalanceMode={false} />);
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByText('SGD')).toBeInTheDocument();
    expect(screen.getByText('AUD')).toBeInTheDocument();
  });

  test('should hide currency selector in rebalance mode', () => {
    render(<Navigation {...defaultProps} rebalanceMode={true} />);
    expect(screen.queryByText('SGD')).not.toBeInTheDocument();
    expect(screen.queryByText('AUD')).not.toBeInTheDocument();
  });

  test('should render navigation links', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getByText('Ticker')).toBeInTheDocument();
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  test('should disable SGD and AUD when FX not available', () => {
    render(<Navigation {...defaultProps} fxAvailable={false} />);
    const sgdButton = screen.getByText('SGD').closest('button');
    const audButton = screen.getByText('AUD').closest('button');
    expect(sgdButton).toHaveClass('disabled');
    expect(audButton).toHaveClass('disabled');
  });

  test('should enable SGD and AUD when FX available', () => {
    render(<Navigation {...defaultProps} fxAvailable={true} />);
    const sgdButton = screen.getByText('SGD').closest('button');
    const audButton = screen.getByText('AUD').closest('button');
    expect(sgdButton).not.toHaveClass('disabled');
    expect(audButton).not.toHaveClass('disabled');
  });

  test('should highlight selected currency', () => {
    render(<Navigation {...defaultProps} currency="USD" />);
    const usdButton = screen.getByText('USD').closest('button');
    expect(usdButton).toHaveClass('btn-primary');
  });
});
