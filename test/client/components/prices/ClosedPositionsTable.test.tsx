import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClosedPositionsTable } from '../../../../src/client/components/prices/ClosedPositionsTable';
import { ClosedPosition } from '../../../../src/client/types';

describe('ClosedPositionsTable', () => {
  const mockConvert = vi.fn((amount: number) => amount);

  const mockClosedPositions: ClosedPosition[] = [
    {
      name: 'Apple Inc',
      code: 'NASDAQ:AAPL',
      totalCost: 10000,
      totalRevenue: 12000,
      profitLoss: 2000,
      profitLossPercent: 20,
      transactions: 5,
    },
    {
      name: 'Microsoft Corp',
      code: 'NASDAQ:MSFT',
      totalCost: 15000,
      totalRevenue: 14000,
      profitLoss: -1000,
      profitLossPercent: -6.67,
      transactions: 3,
    },
  ];

  const defaultProps = {
    closedPositions: mockClosedPositions,
    convert: mockConvert,
    currency: 'USD',
    isRefreshing: false,
  };

  beforeEach(() => {
    mockConvert.mockClear();
    mockConvert.mockImplementation((amount: number) => amount);
  });

  test('should render closed positions table with data', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(screen.getByText('Microsoft Corp')).toBeInTheDocument();
  });

  test('should display symbols without exchange prefix', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
  });

  test('should display total cost values', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    // Values are converted and formatted
    expect(screen.getByText('$10000.00')).toBeInTheDocument();
    expect(screen.getByText('$15000.00')).toBeInTheDocument();
  });

  test('should display profit/loss values with positive styling', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    const profitCell = screen.getByText('$2000.00').closest('td');
    expect(profitCell).toHaveClass('text-success');
  });

  test('should display profit/loss values with negative styling', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    const lossCell = screen.getByText('$-1000.00').closest('td');
    expect(lossCell).toHaveClass('text-danger');
  });

  test('should display profit/loss percentages', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(screen.getByText('20.00%')).toBeInTheDocument();
    expect(screen.getByText('-6.67%')).toBeInTheDocument();
  });

  test('should display transaction counts', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(screen.getByText('5 txns')).toBeInTheDocument();
    expect(screen.getByText('3 txns')).toBeInTheDocument();
  });

  test('should render empty table when no closed positions', () => {
    render(<ClosedPositionsTable {...defaultProps} closedPositions={[]} />);
    
    // Check that the table still renders but with 0 count
    expect(screen.getByText(/Closed Positions \(0\)/)).toBeInTheDocument();
    // Should still show the totals row
    expect(screen.getByText('Total Realized Gains')).toBeInTheDocument();
  });

  test('should apply blur class when refreshing', () => {
    const { container } = render(<ClosedPositionsTable {...defaultProps} isRefreshing={true} />);
    
    const blurElements = container.querySelectorAll('.value-blur');
    expect(blurElements.length).toBeGreaterThan(0);
  });

  test('should not apply blur class when not refreshing', () => {
    const { container } = render(<ClosedPositionsTable {...defaultProps} isRefreshing={false} />);
    
    const blurElements = container.querySelectorAll('.value-blur');
    expect(blurElements.length).toBe(0);
  });

  test('should sort by name when name header is clicked', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    const nameHeader = screen.getByText('Name').closest('th');
    fireEvent.click(nameHeader!);
    
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple Inc');
  });

  test('should toggle sort direction when same column is clicked twice', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    const nameHeader = screen.getByText('Name').closest('th');
    
    // First click - ascending
    fireEvent.click(nameHeader!);
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Apple Inc');
    
    // Second click - descending
    fireEvent.click(nameHeader!);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Microsoft Corp');
  });

  test('should use convert function for currency conversion', () => {
    mockConvert.mockImplementation((amount: number) => amount * 1.5);
    
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(mockConvert).toHaveBeenCalled();
    // Converted values should be displayed
    expect(screen.getByText('$15000.00')).toBeInTheDocument(); // 10000 * 1.5
  });

  test('should format currency with SGD symbol', () => {
    render(<ClosedPositionsTable {...defaultProps} currency="SGD" />);
    
    expect(screen.getByText('S$10000.00')).toBeInTheDocument();
  });

  test('should format currency with AUD symbol', () => {
    render(<ClosedPositionsTable {...defaultProps} currency="AUD" />);
    
    expect(screen.getByText('A$10000.00')).toBeInTheDocument();
  });

  test('should render all column headers', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Symbol')).toBeInTheDocument();
    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Profit/Loss $')).toBeInTheDocument();
    expect(screen.getByText('Profit/Loss %')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  test('should display sort indicator on sorted column', () => {
    render(<ClosedPositionsTable {...defaultProps} />);
    
    const nameHeader = screen.getByText('Name').closest('th');
    fireEvent.click(nameHeader!);
    
    // Check that sort indicator span exists
    const sortIndicator = nameHeader?.querySelector('.sort-indicator');
    expect(sortIndicator).toBeInTheDocument();
  });

  test('should handle symbols without exchange prefix', () => {
    const positionsWithoutExchange: ClosedPosition[] = [
      {
        ...mockClosedPositions[0],
        code: 'AAPL',
      },
    ];
    
    render(<ClosedPositionsTable {...defaultProps} closedPositions={positionsWithoutExchange} />);
    
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });
});
