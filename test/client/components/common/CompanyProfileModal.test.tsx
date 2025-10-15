import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CompanyProfileModal } from '../../../../src/client/components/common/CompanyProfileModal';

describe('CompanyProfileModal', () => {
  let mockModal: any;
  let mockBootstrap: any;

  beforeEach(() => {
    // Mock Bootstrap modal
    mockModal = {
      show: vi.fn(),
      hide: vi.fn(),
    };

    mockBootstrap = {
      Modal: vi.fn(() => mockModal),
    };

    (window as any).bootstrap = mockBootstrap;
  });

  afterEach(() => {
    delete (window as any).bootstrap;
  });

  describe('Modal Rendering', () => {
    test('should render modal with correct structure', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(container.querySelector('#companyProfileModal')).toBeInTheDocument();
      expect(container.querySelector('.modal')).toBeInTheDocument();
      expect(container.querySelector('.modal-dialog')).toBeInTheDocument();
      expect(container.querySelector('.modal-content')).toBeInTheDocument();
    });

    test('should render modal header with title', () => {
      render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(screen.getByText('Apple Inc - Company Profile')).toBeInTheDocument();
    });

    test('should render close button', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const closeButton = container.querySelector('.btn-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('data-bs-dismiss', 'modal');
    });

    test('should render widget container', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const modalBody = container.querySelector('.modal-body');
      expect(modalBody).toBeInTheDocument();
      expect(modalBody?.querySelector('div')).toBeInTheDocument();
    });

    test('should have correct modal classes', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('fade');

      const modalDialog = container.querySelector('.modal-dialog');
      expect(modalDialog).toHaveClass('modal-xl');
      expect(modalDialog).toHaveClass('modal-dialog-scrollable');

      const modalContent = container.querySelector('.modal-content');
      expect(modalContent).toHaveClass('company-profile-modal-content');
    });
  });

  describe('Modal Show/Hide Behavior', () => {
    test('should call Bootstrap Modal.show when show prop is true', async () => {
      render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        expect(mockBootstrap.Modal).toHaveBeenCalled();
        expect(mockModal.show).toHaveBeenCalled();
      });
    });

    test('should not call Bootstrap Modal.show when show prop is false', () => {
      render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(mockBootstrap.Modal).not.toHaveBeenCalled();
      expect(mockModal.show).not.toHaveBeenCalled();
    });

    test('should call onHide when modal is hidden', async () => {
      const onHide = vi.fn();
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={onHide}
        />
      );

      await waitFor(() => {
        expect(mockModal.show).toHaveBeenCalled();
      });

      // Simulate Bootstrap modal hidden event
      const modal = container.querySelector('#companyProfileModal');
      const event = new Event('hidden.bs.modal');
      modal?.dispatchEvent(event);

      await waitFor(() => {
        expect(onHide).toHaveBeenCalled();
      });
    });

    test('should call modal.hide on unmount when shown', async () => {
      const { unmount } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        expect(mockModal.show).toHaveBeenCalled();
      });

      unmount();

      expect(mockModal.hide).toHaveBeenCalled();
    });
  });

  describe('TradingView Widget Integration', () => {
    test('should load TradingView widget when modal is shown', async () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const widgetContainer = container.querySelector('.modal-body > div');
        expect(widgetContainer).toBeInTheDocument();
      });

      await waitFor(() => {
        const tradingViewContainer = container.querySelector('.tradingview-widget-container');
        expect(tradingViewContainer).toBeInTheDocument();
      });
    });

    test('should create widget script with correct symbol', async () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:MSFT"
          name="Microsoft"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const script = container.querySelector('script[src*="tradingview"]');
        expect(script).toBeInTheDocument();
      });

      await waitFor(() => {
        const script = container.querySelector('script[src*="tradingview"]');
        const scriptContent = script?.innerHTML || '';
        expect(scriptContent).toContain('NASDAQ:MSFT');
      });
    });

    test('should configure widget with dark theme', async () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const script = container.querySelector('script[src*="tradingview"]');
        const scriptContent = script?.innerHTML || '';
        expect(scriptContent).toContain('dark');
        expect(scriptContent).toContain('isTransparent');
      });
    });

    test('should set widget dimensions to 100%', async () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const script = container.querySelector('script[src*="tradingview"]');
        const scriptContent = script?.innerHTML || '';
        expect(scriptContent).toContain('100%');
      });
    });

    test('should use correct TradingView widget URL', async () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const script = container.querySelector('script[src*="tradingview"]');
        expect(script).toHaveAttribute('src', 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js');
      });
    });

    test('should clear existing widget before loading new one', async () => {
      const { container, rerender } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        const widget = container.querySelector('.tradingview-widget-container');
        expect(widget).toBeInTheDocument();
      });

      // Re-render with different symbol
      rerender(
        <CompanyProfileModal
          symbol="NASDAQ:MSFT"
          name="Microsoft"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        // Widget should still be present (cleared and reloaded)
        const widgets = container.querySelectorAll('.tradingview-widget-container');
        expect(widgets.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Modal Title Behavior', () => {
    test('should display company name in title', () => {
      render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(screen.getByText('Apple Inc - Company Profile')).toBeInTheDocument();
    });

    test('should display default title when no name provided', () => {
      render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name=""
          show={false}
          onHide={() => {}}
        />
      );

      expect(screen.getByText('Company Profile')).toBeInTheDocument();
    });

    test('should update title when name changes', () => {
      const { rerender } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(screen.getByText('Apple Inc - Company Profile')).toBeInTheDocument();

      rerender(
        <CompanyProfileModal
          symbol="NASDAQ:MSFT"
          name="Microsoft Corporation"
          show={false}
          onHide={() => {}}
        />
      );

      expect(screen.getByText('Microsoft Corporation - Company Profile')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const modal = container.querySelector('#companyProfileModal');
      expect(modal).toHaveAttribute('aria-labelledby', 'companyProfileModalLabel');
      expect(modal).toHaveAttribute('aria-hidden', 'true');
      expect(modal).toHaveAttribute('tabindex', '-1');
    });

    test('should have accessible close button', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const closeButton = container.querySelector('.btn-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });

    test('should have properly labeled modal title', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const title = container.querySelector('#companyProfileModalLabel');
      expect(title).toHaveClass('modal-title');
    });
  });

  describe('Widget Container Styling', () => {
    test('should set modal body flex styling', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const modalBody = container.querySelector('.modal-body');
      expect(modalBody).toHaveStyle({ flex: '1', overflow: 'hidden' });
    });

    test('should set widget container height to 100%', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      const widgetContainer = container.querySelector('.modal-body > div');
      expect(widgetContainer).toHaveStyle({ height: '100%' });
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty symbol gracefully', () => {
      const { container } = render(
        <CompanyProfileModal
          symbol=""
          name="Unknown Company"
          show={true}
          onHide={() => {}}
        />
      );

      expect(container.querySelector('#companyProfileModal')).toBeInTheDocument();
    });

    test('should handle rapid show/hide toggles', async () => {
      const { rerender } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      rerender(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={true}
          onHide={() => {}}
        />
      );

      await waitFor(() => {
        expect(mockModal.show).toHaveBeenCalled();
      });

      rerender(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      // Should handle the toggle without errors
      expect(mockModal.show).toHaveBeenCalledTimes(1);
    });

    test('should handle missing Bootstrap gracefully', () => {
      delete (window as any).bootstrap;

      const { container } = render(
        <CompanyProfileModal
          symbol="NASDAQ:AAPL"
          name="Apple Inc"
          show={false}
          onHide={() => {}}
        />
      );

      expect(container.querySelector('#companyProfileModal')).toBeInTheDocument();
    });
  });
});
