import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnControls } from '../../../../src/client/components/prices/ColumnControls';

describe('ColumnControls', () => {
  const mockOnToggleColumn = vi.fn();

  const renderColumnControls = (hiddenColumns: Set<number> = new Set()) => {
    return render(
      <ColumnControls 
        hiddenColumns={hiddenColumns} 
        onToggleColumn={mockOnToggleColumn}
      />
    );
  };

  beforeEach(() => {
    mockOnToggleColumn.mockClear();
  });

  test('should render all column checkboxes', () => {
    renderColumnControls();
    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Symbol')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Price')).toBeInTheDocument();
    expect(screen.getByLabelText('Price Change')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Cost')).toBeInTheDocument();
    expect(screen.getByLabelText('Market Value')).toBeInTheDocument();
    expect(screen.getByLabelText('MV Change')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight')).toBeInTheDocument();
    expect(screen.getByLabelText('Target')).toBeInTheDocument();
    expect(screen.getByLabelText('Diff')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Gain/Loss')).toBeInTheDocument();
  });

  test('should check all columns by default when none are hidden', () => {
    renderColumnControls();
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  test('should uncheck hidden columns', () => {
    const hiddenColumns = new Set([2, 5, 8]); // Hide Current Price, Cost, Weight
    renderColumnControls(hiddenColumns);
    
    const currentPriceCheckbox = screen.getByLabelText('Current Price');
    const costCheckbox = screen.getByLabelText('Cost');
    const weightCheckbox = screen.getByLabelText('Weight');
    const nameCheckbox = screen.getByLabelText('Name');
    
    expect(currentPriceCheckbox).not.toBeChecked();
    expect(costCheckbox).not.toBeChecked();
    expect(weightCheckbox).not.toBeChecked();
    expect(nameCheckbox).toBeChecked(); // Should still be checked
  });

  test('should call onToggleColumn when checkbox is clicked', () => {
    renderColumnControls();
    
    const nameCheckbox = screen.getByLabelText('Name');
    fireEvent.click(nameCheckbox);
    
    expect(mockOnToggleColumn).toHaveBeenCalledTimes(1);
    expect(mockOnToggleColumn).toHaveBeenCalledWith(0);
  });

  test('should call onToggleColumn with correct column id for each checkbox', () => {
    renderColumnControls();
    
    fireEvent.click(screen.getByLabelText('Symbol'));
    expect(mockOnToggleColumn).toHaveBeenCalledWith(1);
    
    fireEvent.click(screen.getByLabelText('Price Change'));
    expect(mockOnToggleColumn).toHaveBeenCalledWith(3);
    
    fireEvent.click(screen.getByLabelText('Target'));
    expect(mockOnToggleColumn).toHaveBeenCalledWith(9);
  });

  test('should have unique id for each checkbox', () => {
    renderColumnControls();
    
    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'col-0');
    expect(screen.getByLabelText('Symbol')).toHaveAttribute('id', 'col-1');
    expect(screen.getByLabelText('Total Gain/Loss')).toHaveAttribute('id', 'col-11');
  });

  test('should apply column-toggle class to all checkboxes', () => {
    renderColumnControls();
    
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveClass('column-toggle');
    });
  });

  test('should allow toggling multiple columns', () => {
    renderColumnControls();
    
    fireEvent.click(screen.getByLabelText('Name'));
    fireEvent.click(screen.getByLabelText('Symbol'));
    fireEvent.click(screen.getByLabelText('Current Price'));
    
    expect(mockOnToggleColumn).toHaveBeenCalledTimes(3);
    expect(mockOnToggleColumn).toHaveBeenNthCalledWith(1, 0);
    expect(mockOnToggleColumn).toHaveBeenNthCalledWith(2, 1);
    expect(mockOnToggleColumn).toHaveBeenNthCalledWith(3, 2);
  });

  test('should reflect changes when hiddenColumns prop is updated', () => {
    const { rerender } = renderColumnControls(new Set());
    
    let nameCheckbox = screen.getByLabelText('Name');
    expect(nameCheckbox).toBeChecked();
    
    // Update with Name column hidden
    rerender(
      <ColumnControls 
        hiddenColumns={new Set([0])} 
        onToggleColumn={mockOnToggleColumn}
      />
    );
    
    nameCheckbox = screen.getByLabelText('Name');
    expect(nameCheckbox).not.toBeChecked();
  });
});
