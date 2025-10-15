import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '../../../../src/client/components/common/ErrorMessage';

describe('ErrorMessage', () => {
  test('should render error message', () => {
    render(<ErrorMessage message="Test error message" />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('should have danger alert classes', () => {
    render(<ErrorMessage message="Error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert');
    expect(alert).toHaveClass('alert-danger');
  });

  test('should render with role alert', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('should display different error messages', () => {
    const { rerender } = render(<ErrorMessage message="First error" />);
    expect(screen.getByText('First error')).toBeInTheDocument();
    
    rerender(<ErrorMessage message="Second error" />);
    expect(screen.getByText('Second error')).toBeInTheDocument();
  });

  test('should handle long error messages', () => {
    const longMessage = 'This is a very long error message that should still be displayed correctly without truncation or issues';
    render(<ErrorMessage message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});
