import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCards } from '../../../../src/client/components/prices/SummaryCards';

describe('SummaryCards', () => {
  const defaultProps = {
    portfolioTotal: 100000,
    totalMarketValue: 90000,
    cashAmount: 10000,
    totalChangeValue: 500,
    totalChangePercent: 0.56,
    totalGain: 5000,
    totalGainPercent: 5.88,
    totalWeightDeviation: 2.5,
    rebalanceMode: false,
    convert: (amount: number) => amount,
    currency: 'USD',
  };

  test('should render portfolio value card', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Portfolio Value')).toBeInTheDocument();
    expect(screen.getByText('100000.00')).toBeInTheDocument();
  });

  test('should render market value card', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Market Value')).toBeInTheDocument();
    expect(screen.getByText('90000.00')).toBeInTheDocument();
  });

  test('should render cash card', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('10000.00')).toBeInTheDocument();
  });

  test('should render day change card in normal mode', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Day Change')).toBeInTheDocument();
    expect(screen.getByText('500.00')).toBeInTheDocument();
    expect(screen.getByText('0.56%')).toBeInTheDocument();
  });

  test('should render total gain/loss card in normal mode', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument();
    expect(screen.getByText('5000.00')).toBeInTheDocument();
    expect(screen.getByText('5.88%')).toBeInTheDocument();
  });

  test('should render weight deviation card in normal mode', () => {
    render(<SummaryCards {...defaultProps} />);
    expect(screen.getByText('Weight Deviation')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
  });

  test('should not render day change, gain, or weight deviation in rebalance mode', () => {
    render(<SummaryCards {...defaultProps} rebalanceMode={true} />);
    expect(screen.queryByText('Day Change')).not.toBeInTheDocument();
    expect(screen.queryByText('Total Gain/Loss')).not.toBeInTheDocument();
    expect(screen.queryByText('Weight Deviation')).not.toBeInTheDocument();
  });

  test('should apply positive change styling', () => {
    const { container } = render(<SummaryCards {...defaultProps} />);
    const dayChangeCard = screen.getByText('Day Change').closest('.card');
    expect(dayChangeCard).toHaveClass('bg-success');
  });

  test('should apply negative change styling', () => {
    const { container } = render(<SummaryCards {...defaultProps} totalChangeValue={-500} />);
    const dayChangeCard = screen.getByText('Day Change').closest('.card');
    expect(dayChangeCard).toHaveClass('bg-danger');
  });

  test('should show multi-currency disabled message when FX not available', () => {
    render(<SummaryCards {...defaultProps} fxAvailable={false} />);
    const messages = screen.getAllByText('Multi-currency disabled');
    expect(messages.length).toBeGreaterThan(0);
  });

  test('should show alternate currency when available', () => {
    const convertToAlt = (amount: number) => amount * 1.35;
    render(<SummaryCards {...defaultProps} fxAvailable={true} altCurrency="SGD" convertToAlt={convertToAlt} />);
    const altCurrencyTexts = screen.getAllByText(/S\$/);
    expect(altCurrencyTexts.length).toBeGreaterThan(0);
  });

  test('should show rebalancing changes in rebalance mode', () => {
    const rebalancingData = {
      recommendations: [
        {
          id: 1,
          name: 'Test',
          code: 'TEST',
          quantity: 10,
          currentQuantity: 10,
          currentValue: 1000,
          currentWeight: 50,
          targetWeight: 50,
          targetQuantity: 12,
          targetValue: 1200,
          quantityChange: 2,
          valueChange: 200,
          newWeight: 60,
          action: 'BUY' as const,
          quote: { current: 100, previous_close: 95, change: 5, percent_change: 5.26, high: 105, low: 95, open: 96, timestamp: Date.now() }
        }
      ],
      newCash: 9800,
      cashChange: -200
    };

    render(<SummaryCards {...defaultProps} rebalanceMode={true} rebalancingData={rebalancingData} />);
    expect(screen.getByText('New Weight Deviation')).toBeInTheDocument();
  });
});
