import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../../../../src/client/components/common/Navigation';

describe('Navigation', () => {
  const renderNavigation = (initialRoute = '/', portfolioName?: string) => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Navigation portfolioName={portfolioName} />
      </MemoryRouter>
    );
  };

  test('should render portfolio name', () => {
    renderNavigation('/', 'My Portfolio');
    expect(screen.getByText('My Portfolio')).toBeInTheDocument();
  });

  test('should use default portfolio name if not provided', () => {
    renderNavigation('/');
    expect(screen.getByText('Stock Portfolio')).toBeInTheDocument();
  });

  test('should render all navigation links', () => {
    renderNavigation('/');
    expect(screen.getByRole('link', { name: 'Ticker' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Grid' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Large' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Advanced' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prices' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Config' })).toBeInTheDocument();
  });

  test('should highlight Ticker link when on /ticker route', () => {
    renderNavigation('/ticker');
    const tickerLink = screen.getByRole('link', { name: 'Ticker' });
    expect(tickerLink).toHaveClass('btn-light');
    expect(tickerLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Prices link when on /prices route', () => {
    renderNavigation('/prices');
    const pricesLink = screen.getByRole('link', { name: 'Prices' });
    expect(pricesLink).toHaveClass('btn-light');
    expect(pricesLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Config link when on /config route', () => {
    renderNavigation('/config');
    const configLink = screen.getByRole('link', { name: 'Config' });
    expect(configLink).toHaveClass('btn-light');
    expect(configLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Grid link when on /charts route', () => {
    renderNavigation('/charts');
    const gridLink = screen.getByRole('link', { name: 'Grid' });
    expect(gridLink).toHaveClass('btn-light');
    expect(gridLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Grid link when on /chart-grid route', () => {
    renderNavigation('/chart-grid');
    const gridLink = screen.getByRole('link', { name: 'Grid' });
    expect(gridLink).toHaveClass('btn-light');
    expect(gridLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Large link when on /charts/large route', () => {
    renderNavigation('/charts/large');
    const largeLink = screen.getByRole('link', { name: 'Large' });
    expect(largeLink).toHaveClass('btn-light');
    expect(largeLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Large link when on /chart-large route', () => {
    renderNavigation('/chart-large');
    const largeLink = screen.getByRole('link', { name: 'Large' });
    expect(largeLink).toHaveClass('btn-light');
    expect(largeLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Advanced link when on /charts/advanced route', () => {
    renderNavigation('/charts/advanced');
    const advancedLink = screen.getByRole('link', { name: 'Advanced' });
    expect(advancedLink).toHaveClass('btn-light');
    expect(advancedLink).not.toHaveClass('btn-outline-light');
  });

  test('should highlight Advanced link when on /chart-advanced route', () => {
    renderNavigation('/chart-advanced');
    const advancedLink = screen.getByRole('link', { name: 'Advanced' });
    expect(advancedLink).toHaveClass('btn-light');
    expect(advancedLink).not.toHaveClass('btn-outline-light');
  });

  test('should not highlight any link when on unknown route', () => {
    renderNavigation('/unknown');
    const tickerLink = screen.getByRole('link', { name: 'Ticker' });
    const pricesLink = screen.getByRole('link', { name: 'Prices' });
    const configLink = screen.getByRole('link', { name: 'Config' });
    
    expect(tickerLink).toHaveClass('btn-outline-light');
    expect(pricesLink).toHaveClass('btn-outline-light');
    expect(configLink).toHaveClass('btn-outline-light');
  });

  test('should have correct link hrefs', () => {
    renderNavigation('/');
    expect(screen.getByRole('link', { name: 'Ticker' })).toHaveAttribute('href', '/ticker');
    expect(screen.getByRole('link', { name: 'Grid' })).toHaveAttribute('href', '/chart-grid');
    expect(screen.getByRole('link', { name: 'Large' })).toHaveAttribute('href', '/chart-large');
    expect(screen.getByRole('link', { name: 'Advanced' })).toHaveAttribute('href', '/chart-advanced');
    expect(screen.getByRole('link', { name: 'Prices' })).toHaveAttribute('href', '/prices');
    expect(screen.getByRole('link', { name: 'Config' })).toHaveAttribute('href', '/config');
  });
});
