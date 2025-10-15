import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../../../../src/client/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('should render loading spinner', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  test('should have correct Bootstrap spinner classes', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('spinner-border');
    expect(spinner).toHaveClass('text-primary');
  });

  test('should include screen reader text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should have visually hidden class on screen reader text', () => {
    render(<LoadingSpinner />);
    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('visually-hidden');
  });
});
