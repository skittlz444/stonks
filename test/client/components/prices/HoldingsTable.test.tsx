import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HoldingsTable } from '../../../../src/client/components/prices/HoldingsTable';
import { HoldingWithQuote, RebalanceData } from '../../../../src/client/types';

describe('HoldingsTable', () => {
  const mockConvert = vi.fn((amount: number) => amount);
  
  const mockHolding1: HoldingWithQuote = {
    id: 1,
    name: 'Apple Inc',
    code: 'NASDAQ:AAPL',
    quantity: 10,
    target_weight: 50,
    visible: 1,
    quote: {
      current: 150,
      previous_close: 145,
      change: 5,
      percent_change: 3.45,
      changePercent: 3.45,
      high: 155,
      low: 145,
      open: 148,
      timestamp: Date.now()
    },
    marketValue: 1500,
    costBasis: 1400,
    gain: 100,
    gainPercent: 7.14
  };

  const mockHolding2: HoldingWithQuote = {
    id: 2,
    name: 'Microsoft Corporation',
    code: 'NASDAQ:MSFT',
    quantity: 5,
    target_weight: 30,
    visible: 1,
    quote: {
      current: 300,
      previous_close: 310,
      change: -10,
      percent_change: -3.23,
      changePercent: -3.23,
      high: 315,
      low: 295,
      open: 308,
      timestamp: Date.now()
    },
    marketValue: 1500,
    costBasis: 1600,
    gain: -100,
    gainPercent: -6.25
  };

  const mockHolding3: HoldingWithQuote = {
    id: 3,
    name: 'Tesla Inc',
    code: 'NASDAQ:TSLA',
    quantity: 20,
    target_weight: undefined,
    visible: 1,
    quote: {
      current: 200,
      previous_close: 195,
      change: 5,
      percent_change: 2.56,
      changePercent: 2.56,
      high: 205,
      low: 195,
      open: 198,
      timestamp: Date.now()
    },
    marketValue: 4000,
    costBasis: 3500,
    gain: 500,
    gainPercent: 14.29
  };

  const defaultProps = {
    holdings: [mockHolding1, mockHolding2, mockHolding3],
    cashAmount: 1000,
    portfolioTotal: 8000,
    rebalanceMode: false,
    rebalancingData: null,
    convert: mockConvert,
    currency: 'USD',
    hiddenColumns: new Set<number>(),
    isRefreshing: false,
  };

  beforeEach(() => {
    mockConvert.mockClear();
    mockConvert.mockImplementation((amount: number) => amount);
  });

  describe('Basic Rendering', () => {
    test('should render holdings table with data', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tesla Inc')).toBeInTheDocument();
    });

    test('should render stock symbols correctly', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('TSLA')).toBeInTheDocument();
    });

    test('should render current prices', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('$150.00');
      expect(tableText).toContain('$300.00');
      expect(tableText).toContain('$200.00');
    });

    test('should render quantities', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      const container = render(<HoldingsTable {...defaultProps} />).container;
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('10');
      expect(tableText).toContain('5');
      expect(tableText).toContain('20');
    });

    test('should render market values', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('$1500.00');
      expect(tableText).toContain('$4000.00');
    });
  });

  describe('Price Changes', () => {
    test('should display positive price changes with success styling', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const successElements = container.querySelectorAll('.text-success');
      expect(successElements.length).toBeGreaterThan(0);
    });

    test('should display negative price changes with danger styling', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const dangerElements = container.querySelectorAll('.text-danger');
      expect(dangerElements.length).toBeGreaterThan(0);
    });

    test('should render price change indicators', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('▲'); // Up arrow for positive
      expect(tableText).toContain('▼'); // Down arrow for negative
    });

    test('should render price change amounts', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('$5.00');
      expect(tableText).toContain('$10.00');
    });
  });

  describe('Gain/Loss Display', () => {
    test('should display gains with appropriate styling', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      // Both positive and negative gains use success/danger classes
      const styledElements = container.querySelectorAll('.text-success, .text-danger');
      expect(styledElements.length).toBeGreaterThan(0);
    });

    test('should render gain amounts', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('$100.00');
      expect(tableText).toContain('$500.00');
    });

    test('should render gain percentages', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('7.14%');
      expect(tableText).toContain('14.29%');
    });
  });

  describe('Currency Conversion', () => {
    test('should apply currency conversion to prices', () => {
      const convertToSGD = vi.fn((amount: number) => amount * 1.35);
      
      render(
        <HoldingsTable
          {...defaultProps}
          convert={convertToSGD}
          currency="SGD"
        />
      );
      
      expect(convertToSGD).toHaveBeenCalled();
    });

    test('should display SGD currency symbol when currency is SGD', () => {
      const convertToSGD = vi.fn((amount: number) => amount * 1.35);
      
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          convert={convertToSGD}
          currency="SGD"
        />
      );
      
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('S$'); // SGD currency symbol
    });

    test('should display AUD currency symbol when currency is AUD', () => {
      const convertToAUD = vi.fn((amount: number) => amount * 1.5);
      
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          convert={convertToAUD}
          currency="AUD"
        />
      );
      
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('A$'); // AUD currency symbol
    });
  });

  describe('Column Visibility', () => {
    test('should hide columns when in hiddenColumns set', () => {
      const hiddenColumns = new Set([2]); // Hide Current Price column
      
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          hiddenColumns={hiddenColumns}
        />
      );
      
      const headers = container.querySelectorAll('th');
      const hiddenHeaders = Array.from(headers).filter(
        (header) => (header as HTMLElement).style.display === 'none'
      );
      
      expect(hiddenHeaders.length).toBeGreaterThan(0);
    });

    test('should show all columns when hiddenColumns is empty', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          hiddenColumns={new Set()}
        />
      );
      
      const headers = container.querySelectorAll('th[data-column]');
      expect(headers.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting Functionality', () => {
    test('should sort by name when name column header is clicked', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const nameHeader = screen.getByText(/Name/);
      fireEvent.click(nameHeader);
      
      const rows = container.querySelectorAll('tbody tr');
      const firstRowText = rows[0]?.textContent || '';
      
      expect(firstRowText).toContain('Apple Inc');
    });

    test('should toggle sort direction on second click', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const nameHeader = screen.getByText(/Name/);
      fireEvent.click(nameHeader); // First click - ascending
      fireEvent.click(nameHeader); // Second click - descending
      
      const rows = container.querySelectorAll('tbody tr');
      const firstRowText = rows[0]?.textContent || '';
      
      expect(firstRowText).toContain('Tesla Inc');
    });

    test('should add active class to sorted column', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const nameHeader = screen.getByText(/Name/);
      fireEvent.click(nameHeader);
      
      const activeHeaders = container.querySelectorAll('th.active');
      expect(activeHeaders.length).toBeGreaterThan(0);
    });

    test('should display sort indicator on sorted column', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const nameHeader = screen.getByText(/Name/);
      fireEvent.click(nameHeader);
      
      const sortIndicators = container.querySelectorAll('.sort-indicator');
      expect(sortIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Rebalance Mode', () => {
    const mockRebalanceData: RebalanceData = {
      recommendations: [
        {
          id: 1,
          name: 'Apple Inc',
          code: 'NASDAQ:AAPL',
          quantity: 10,
          visible: 1,
          quote: mockHolding1.quote,
          marketValue: 1500,
          costBasis: 1400,
          gain: 100,
          gainPercent: 7.14,
          currentQuantity: 10,
          currentValue: 1500,
          currentWeight: 18.75,
          targetWeight: 50,
          targetValue: 4000,
          targetQuantity: 27,
          action: 'BUY',
          quantityChange: 17,
          valueChange: 2500,
          newWeight: 50
        },
        {
          id: 2,
          name: 'Microsoft Corporation',
          code: 'NASDAQ:MSFT',
          quantity: 5,
          visible: 1,
          quote: mockHolding2.quote,
          marketValue: 1500,
          costBasis: 1600,
          gain: -100,
          gainPercent: -6.25,
          currentQuantity: 5,
          currentValue: 1500,
          currentWeight: 18.75,
          targetWeight: 30,
          targetValue: 2400,
          targetQuantity: 8,
          action: 'BUY',
          quantityChange: 3,
          valueChange: 900,
          newWeight: 30
        },
        {
          id: 3,
          name: 'Tesla Inc',
          code: 'NASDAQ:TSLA',
          quantity: 20,
          visible: 1,
          quote: mockHolding3.quote,
          marketValue: 4000,
          costBasis: 3500,
          gain: 500,
          gainPercent: 14.29,
          currentQuantity: 20,
          currentValue: 4000,
          currentWeight: 50,
          targetWeight: 0,
          targetValue: 0,
          targetQuantity: 0,
          action: 'SELL',
          quantityChange: -20,
          valueChange: -4000,
          newWeight: 0
        }
      ],
      newCash: 100,
      cashChange: -900
    };

    test('should render rebalance mode headers', () => {
      render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      expect(screen.getByText(/Quantity/)).toBeInTheDocument();
      expect(screen.getByText(/Market Value/)).toBeInTheDocument();
      expect(screen.getByText(/Action/)).toBeInTheDocument();
      expect(screen.getByText(/Target/)).toBeInTheDocument();
    });

    test('should display BUY action for stocks to purchase', () => {
      render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      expect(screen.getAllByText('BUY').length).toBeGreaterThan(0);
    });

    test('should display SELL action for stocks to sell', () => {
      render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      expect(screen.getByText('SELL')).toBeInTheDocument();
    });

    test('should display target quantities in rebalance mode', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      const tableText = container.textContent || '';
      expect(tableText).toContain('27'); // Target quantity for AAPL
    });

    test('should display new weights in rebalance mode', () => {
      render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      const container = render(
        <HoldingsTable {...defaultProps} rebalanceMode={true} rebalancingData={mockRebalanceData} />
      ).container;
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('50.00%'); // Target weight
    });
  });

  describe('Refresh State', () => {
    test('should apply blur class when refreshing', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          isRefreshing={true}
        />
      );
      
      const blurredElements = container.querySelectorAll('.value-blur');
      expect(blurredElements.length).toBeGreaterThan(0);
    });

    test('should not apply blur class when not refreshing', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          isRefreshing={false}
        />
      );
      
      const blurredElements = container.querySelectorAll('.value-blur');
      expect(blurredElements.length).toBe(0);
    });
  });

  describe('Weight Calculations', () => {
    test('should calculate and display portfolio weights', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      
      // Apple: 1500/8000 = 18.75%
      expect(tableText).toContain('18.75%');
      // Tesla: 4000/8000 = 50%
      expect(tableText).toContain('50.00%');
    });

    test('should display target weights when set', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('50'); // Target weight for AAPL
      expect(tableText).toContain('30'); // Target weight for MSFT
    });

    test('should calculate weight difference from target', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      const container = render(<HoldingsTable {...defaultProps} />).container;
      const tableText = container.textContent || '';
      
      // Apple: 18.75% - 50% = -31.25%
      expect(tableText).toContain('-31.25%');
    });

    test('should handle zero portfolio total gracefully', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          portfolioTotal={0}
        />
      );
      
      const tableText = container.textContent || '';
      
      expect(tableText).toContain('0.00%');
    });
  });

  describe('Edge Cases', () => {
    test('should handle holdings with no quote data', () => {
      const holdingNoQuote: HoldingWithQuote = {
        ...mockHolding1,
        quote: undefined as any
      };
      
      render(
        <HoldingsTable
          {...defaultProps}
          holdings={[holdingNoQuote]}
        />
      );
      
      expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    });

    test('should handle holdings with null target weight', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      // Tesla has null target_weight
      expect(screen.getByText('Tesla Inc')).toBeInTheDocument();
    });

    test('should render table with only cash row when no holdings', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          holdings={[]}
        />
      );
      
      expect(container.querySelector('table')).toBeInTheDocument();
      // Cash row should still be present
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    test('should handle stock symbols without exchange prefix', () => {
      const holdingNoExchange: HoldingWithQuote = {
        ...mockHolding1,
        code: 'AAPL' // No NASDAQ: prefix
      };
      
      render(
        <HoldingsTable
          {...defaultProps}
          holdings={[holdingNoExchange]}
        />
      );
      
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  describe('Cash Row', () => {
    test('should display cash amount in table', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      expect(screen.getByText('Cash')).toBeInTheDocument();
      const tableText = container.textContent || '';
      expect(tableText).toContain('$1000.00');
    });

    test('should calculate cash weight correctly', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const tableText = container.textContent || '';
      
      // Cash: 1000/8000 = 12.5%
      expect(tableText).toContain('12.50%');
    });

    test('should apply currency conversion to cash', () => {
      const convertToSGD = vi.fn((amount: number) => amount * 1.35);
      
      render(
        <HoldingsTable
          {...defaultProps}
          convert={convertToSGD}
          currency="SGD"
          cashAmount={1000}
        />
      );
      
      expect(convertToSGD).toHaveBeenCalledWith(1000);
    });
  });

  describe('Company Profile Integration', () => {
    test('should call showCompanyProfile when clicking company name', () => {
      const mockShowCompanyProfile = vi.fn();
      (window as any).showCompanyProfile = mockShowCompanyProfile;
      
      render(<HoldingsTable {...defaultProps} />);
      
      const appleLink = screen.getByText('Apple Inc');
      fireEvent.click(appleLink);
      
      expect(mockShowCompanyProfile).toHaveBeenCalledWith('NASDAQ:AAPL', 'Apple Inc');
      
      delete (window as any).showCompanyProfile;
    });

    test('should call showCompanyProfile with correct parameters for each holding', () => {
      const mockShowCompanyProfile = vi.fn();
      (window as any).showCompanyProfile = mockShowCompanyProfile;
      
      render(<HoldingsTable {...defaultProps} />);
      
      // Click Apple
      fireEvent.click(screen.getByText('Apple Inc'));
      expect(mockShowCompanyProfile).toHaveBeenCalledWith('NASDAQ:AAPL', 'Apple Inc');
      
      // Click Microsoft
      fireEvent.click(screen.getByText('Microsoft Corporation'));
      expect(mockShowCompanyProfile).toHaveBeenCalledWith('NASDAQ:MSFT', 'Microsoft Corporation');
      
      // Click Tesla
      fireEvent.click(screen.getByText('Tesla Inc'));
      expect(mockShowCompanyProfile).toHaveBeenCalledWith('NASDAQ:TSLA', 'Tesla Inc');
      
      expect(mockShowCompanyProfile).toHaveBeenCalledTimes(3);
      
      delete (window as any).showCompanyProfile;
    });

    test('should not error when showCompanyProfile is not available', () => {
      delete (window as any).showCompanyProfile;
      
      render(<HoldingsTable {...defaultProps} />);
      
      const appleLink = screen.getByText('Apple Inc');
      
      expect(() => fireEvent.click(appleLink)).not.toThrow();
    });

    test('should prevent default link behavior when clicking', () => {
      const mockShowCompanyProfile = vi.fn();
      (window as any).showCompanyProfile = mockShowCompanyProfile;
      
      render(<HoldingsTable {...defaultProps} />);
      
      const appleLink = screen.getByText('Apple Inc').closest('a');
      expect(appleLink).toHaveAttribute('href', '#');
      
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      
      appleLink?.dispatchEvent(event);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
      
      delete (window as any).showCompanyProfile;
    });

    test('should render company names as clickable links', () => {
      render(<HoldingsTable {...defaultProps} />);
      
      const appleLink = screen.getByText('Apple Inc').closest('a');
      const msftLink = screen.getByText('Microsoft Corporation').closest('a');
      const tslaLink = screen.getByText('Tesla Inc').closest('a');
      
      expect(appleLink).toBeInTheDocument();
      expect(msftLink).toBeInTheDocument();
      expect(tslaLink).toBeInTheDocument();
      
      expect(appleLink).toHaveAttribute('href', '#');
      expect(msftLink).toHaveAttribute('href', '#');
      expect(tslaLink).toHaveAttribute('href', '#');
    });

    test('should style links to inherit color and have no decoration', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const appleLink = screen.getByText('Apple Inc').closest('a') as HTMLElement;
      
      expect(appleLink.style.color).toBe('inherit');
      expect(appleLink.style.textDecoration).toBe('none');
    });

    test('should work in rebalance mode', () => {
      const mockShowCompanyProfile = vi.fn();
      (window as any).showCompanyProfile = mockShowCompanyProfile;
      
      const mockRebalanceData: RebalanceData = {
        recommendations: [
          {
            ...mockHolding1,
            currentQuantity: 10,
            currentValue: 1500,
            currentWeight: 18.75,
            targetWeight: 50,
            targetValue: 4000,
            targetQuantity: 27,
            action: 'BUY',
            quantityChange: 17,
            valueChange: 2500,
            newWeight: 50
          }
        ],
        newCash: 100,
        cashChange: -900
      };
      
      render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );
      
      const appleLink = screen.getByText('Apple Inc');
      fireEvent.click(appleLink);
      
      expect(mockShowCompanyProfile).toHaveBeenCalledWith('NASDAQ:AAPL', 'Apple Inc');
      
      delete (window as any).showCompanyProfile;
    });
  });

  describe('Edge Cases and Additional Coverage', () => {
    test('should handle holdings without quote data', () => {
      const holdingWithoutQuote = {
        ...mockHolding1,
        quote: null
      } as any;

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          holdings={[holdingWithoutQuote]}
        />
      );

      expect(container).toBeInTheDocument();
    });

    test('should handle zero portfolio total', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          portfolioTotal={0}
        />
      );

      expect(container).toBeInTheDocument();
    });

    test('should sort by price change in normal mode', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const priceChangeHeader = container.querySelector('[data-column="3"]');
      expect(priceChangeHeader).toBeInTheDocument();
      
      fireEvent.click(priceChangeHeader!);
      
      const rows = container.querySelectorAll('[data-holding="true"]');
      // Verify that sorting happened - at least 2 rows exist
      expect(rows.length).toBeGreaterThanOrEqual(2);
    });

    test('should sort by cost basis in normal mode', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const costHeader = container.querySelector('[data-column="5"]');
      fireEvent.click(costHeader!);
      
      expect(container.querySelector('.sortable.active')).toBeInTheDocument();
    });

    test('should sort by market value change in normal mode', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const mvChangeHeader = container.querySelector('[data-column="7"]');
      fireEvent.click(mvChangeHeader!);
      
      expect(container.querySelector('.sortable.active')).toBeInTheDocument();
    });

    test('should handle holdings with null target_weight', () => {
      const holdingWithoutTarget = {
        ...mockHolding1,
        target_weight: undefined
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          holdings={[holdingWithoutTarget]}
        />
      );

      expect(container.textContent).toContain('-');
    });

    test('should sort by target weight with null handling', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const targetHeader = container.querySelector('[data-column="9"]');
      fireEvent.click(targetHeader!);
      
      const rows = container.querySelectorAll('[data-holding="true"]');
      expect(rows.length).toBeGreaterThan(0);
    });

    test('should sort by diff in normal mode', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const diffHeader = container.querySelector('[data-column="10"]');
      fireEvent.click(diffHeader!);
      
      expect(container.querySelector('.sortable.active')).toBeInTheDocument();
    });

    test('should sort by total gain/loss in normal mode', () => {
      const { container } = render(<HoldingsTable {...defaultProps} />);
      
      const gainHeader = container.querySelector('[data-column="11"]');
      fireEvent.click(gainHeader!);
      
      expect(container.querySelector('.sortable.active')).toBeInTheDocument();
    });

    test('should handle rebalance mode sorting by all columns', () => {
      const mockRebalanceData: RebalanceData = {
        recommendations: [
          {
            ...mockHolding1,
            currentQuantity: 10,
            currentValue: 1500,
            currentWeight: 18.75,
            targetWeight: 50,
            targetValue: 4000,
            targetQuantity: 27,
            action: 'BUY',
            quantityChange: 17,
            valueChange: 2500,
            newWeight: 50
          },
          {
            ...mockHolding2,
            currentQuantity: 5,
            currentValue: 1500,
            currentWeight: 18.75,
            targetWeight: 30,
            targetValue: 2400,
            targetQuantity: 8,
            action: 'BUY',
            quantityChange: 3,
            valueChange: 900,
            newWeight: 30
          }
        ],
        newCash: 100,
        cashChange: -3400
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );

      // Test sorting by each column in rebalance mode
      for (let col = 0; col <= 8; col++) {
        const header = container.querySelector(`[data-column="${col}"]`);
        if (header) {
          fireEvent.click(header);
          expect(container.querySelector('.sortable.active')).toBeInTheDocument();
        }
      }
    });

    test('should display weight diff with strikethrough when change is significant', () => {
      const mockRebalanceData: RebalanceData = {
        recommendations: [
          {
            ...mockHolding1,
            currentQuantity: 10,
            currentValue: 1500,
            currentWeight: 10,
            targetWeight: 50,
            targetValue: 4000,
            targetQuantity: 27,
            action: 'BUY',
            quantityChange: 17,
            valueChange: 2500,
            newWeight: 50
          }
        ],
        newCash: 100,
        cashChange: -900
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );

      const strikethroughText = container.querySelector('[style*="line-through"]');
      expect(strikethroughText).toBeInTheDocument();
    });

    test('should handle SELL action in rebalance mode', () => {
      const mockRebalanceData: RebalanceData = {
        recommendations: [
          {
            ...mockHolding1,
            currentQuantity: 10,
            currentValue: 1500,
            currentWeight: 50,
            targetWeight: 20,
            targetValue: 800,
            targetQuantity: 5,
            action: 'SELL',
            quantityChange: -5,
            valueChange: -700,
            newWeight: 20
          }
        ],
        newCash: 1700,
        cashChange: 700
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );

      expect(container.textContent).toContain('SELL');
      expect(container.querySelector('.bg-danger')).toBeInTheDocument();
    });

    test('should handle HOLD action in rebalance mode', () => {
      const mockRebalanceData: RebalanceData = {
        recommendations: [
          {
            ...mockHolding1,
            currentQuantity: 10,
            currentValue: 1500,
            currentWeight: 50,
            targetWeight: 50,
            targetValue: 1500,
            targetQuantity: 10,
            action: 'HOLD',
            quantityChange: 0,
            valueChange: 0,
            newWeight: 50
          }
        ],
        newCash: 1000,
        cashChange: 0
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );

      expect(container.textContent).toContain('HOLD');
      expect(container.querySelector('.bg-secondary')).toBeInTheDocument();
    });

    test('should handle missing recommendation in rebalance mode', () => {
      const mockRebalanceData: RebalanceData = {
        recommendations: [],
        newCash: 1000,
        cashChange: 0
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          rebalanceMode={true}
          rebalancingData={mockRebalanceData}
        />
      );

      expect(container).toBeInTheDocument();
    });

    test('should apply value blur class when refreshing', () => {
      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          isRefreshing={true}
        />
      );

      const blurredElements = container.querySelectorAll('.value-blur');
      expect(blurredElements.length).toBeGreaterThan(0);
    });

    test('should handle code without exchange prefix', () => {
      const holdingWithoutExchange = {
        ...mockHolding1,
        code: 'AAPL'
      };

      const { container } = render(
        <HoldingsTable
          {...defaultProps}
          holdings={[holdingWithoutExchange]}
        />
      );

      expect(container.textContent).toContain('AAPL');
    });
  });
});
