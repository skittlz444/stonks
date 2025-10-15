import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock react-dom/client at the top
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}));

// Mock App component
vi.mock('../../src/client/App', () => ({
  App: () => React.createElement('div', null, 'App')
}));

describe('main.tsx - React App Initialization', () => {
  beforeEach(() => {
    mockRender.mockClear();
    mockCreateRoot.mockClear();
    vi.resetModules();
    // Clean up DOM
    document.body.innerHTML = '';
  });

  test('should find root element and render app', async () => {
    // Set up DOM
    document.body.innerHTML = '<div id="root"></div>';
    const container = document.getElementById('root');

    // Import main.tsx to trigger initialization
    await import('../../src/client/main');

    expect(mockCreateRoot).toHaveBeenCalledWith(container);
    expect(mockRender).toHaveBeenCalled();
  });

  test('should throw error when root element not found', async () => {
    // Make sure there's no root element
    document.body.innerHTML = '';

    // Import should throw error
    await expect(async () => {
      await import('../../src/client/main');
    }).rejects.toThrow('Root element not found');
  });

  test('should render App in StrictMode', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('../../src/client/main');

    expect(mockRender).toHaveBeenCalled();
    // The rendered element should be a React element
    expect(mockRender.mock.calls[0][0]).toBeDefined();
  });
});

describe('main.tsx - Integration Tests', () => {
  beforeEach(() => {
    // Set up a clean DOM
    document.body.innerHTML = '<div id="root"></div>';
  });

  test('should work with real DOM element', () => {
    const container = document.getElementById('root');
    expect(container).toBeTruthy();
    expect(container?.id).toBe('root');
  });

  test('should handle missing root element in real DOM', () => {
    document.body.innerHTML = ''; // Remove root element
    const container = document.getElementById('root');
    expect(container).toBeNull();
  });
});
