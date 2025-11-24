import { describe, test, expect, beforeEach, vi } from 'vitest';
import { handleConfigSubmission } from '../src/api.js';

describe('api.js - handleConfigSubmission', () => {
  let mockDatabaseService;
  let mockRequest;

  beforeEach(() => {
    // Mock database service
    mockDatabaseService = {
      db: {
        prepare: vi.fn(() => ({
          bind: vi.fn(() => ({
            run: vi.fn(() => Promise.resolve({ success: true }))
          }))
        }))
      },
      updateCashAmount: vi.fn(() => Promise.resolve(true)),
      addPortfolioHolding: vi.fn(() => Promise.resolve(true)),
      updatePortfolioHolding: vi.fn(() => Promise.resolve(true)),
      deletePortfolioHolding: vi.fn(() => Promise.resolve(true)),
      toggleHoldingVisibility: vi.fn(() => Promise.resolve(true)),
      addTransaction: vi.fn(() => Promise.resolve(true)),
      deleteTransaction: vi.fn(() => Promise.resolve(true))
    };
  });

  describe('update_settings action', () => {
    test('should update portfolio name and cash amount', async () => {
      const formData = new FormData();
      formData.append('action', 'update_settings');
      formData.append('portfolio_name', 'My New Portfolio');
      formData.append('cash_amount', '5000');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.updateCashAmount).toHaveBeenCalledWith(5000);
      expect(mockDatabaseService.db.prepare).toHaveBeenCalled();
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/config');
    });

    test('should return JSON for AJAX request', async () => {
      const formData = new FormData();
      formData.append('action', 'update_settings');
      formData.append('portfolio_name', 'Test Portfolio');
      formData.append('cash_amount', '1000');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers({ 'Accept': 'application/json' })
      };

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({ success: true });
    });
  });

  describe('add_holding action', () => {
    test('should add holding with target weight', async () => {
      const formData = new FormData();
      formData.append('action', 'add_holding');
      formData.append('name', 'New Stock');
      formData.append('code', 'BATS:NEW');
      formData.append('target_weight', '25');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.addPortfolioHolding).toHaveBeenCalledWith('New Stock', 'BATS:NEW', 25);
    });

    test('should add holding without target weight', async () => {
      const formData = new FormData();
      formData.append('action', 'add_holding');
      formData.append('name', 'New Stock');
      formData.append('code', 'BATS:NEW');
      formData.append('target_weight', '');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.addPortfolioHolding).toHaveBeenCalledWith('New Stock', 'BATS:NEW', null);
    });
  });

  describe('update_holding action', () => {
    test('should update holding with all fields', async () => {
      const formData = new FormData();
      formData.append('action', 'update_holding');
      formData.append('holding_id', '1');
      formData.append('name', 'Updated Stock');
      formData.append('code', 'BATS:UPD');
      formData.append('target_weight', '30');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(1, 'Updated Stock', 'BATS:UPD', 30);
    });

    test('should update holding with null target weight', async () => {
      const formData = new FormData();
      formData.append('action', 'update_holding');
      formData.append('holding_id', '2');
      formData.append('name', 'Stock Name');
      formData.append('code', 'BATS:TEST');
      formData.append('target_weight', '');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.updatePortfolioHolding).toHaveBeenCalledWith(2, 'Stock Name', 'BATS:TEST', null);
    });
  });

  describe('delete_holding action', () => {
    test('should delete holding by id', async () => {
      const formData = new FormData();
      formData.append('action', 'delete_holding');
      formData.append('holding_id', '5');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.deletePortfolioHolding).toHaveBeenCalledWith(5);
    });
  });

  describe('toggle_visibility action', () => {
    test('should toggle holding visibility', async () => {
      const formData = new FormData();
      formData.append('action', 'toggle_visibility');
      formData.append('holding_id', '3');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.toggleHoldingVisibility).toHaveBeenCalledWith(3);
    });
  });

  describe('add_transaction action', () => {
    test('should add transaction with all fields', async () => {
      const formData = new FormData();
      formData.append('action', 'add_transaction');
      formData.append('code', 'BATS:TEST');
      formData.append('type', 'buy');
      formData.append('date', '2024-01-15');
      formData.append('quantity', '10');
      formData.append('value', '1000');
      formData.append('fee', '10');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.addTransaction).toHaveBeenCalledWith(
        'BATS:TEST',
        'buy',
        '2024-01-15',
        10,
        1000,
        10
      );
    });

    test('should add transaction with zero fee when not provided', async () => {
      const formData = new FormData();
      formData.append('action', 'add_transaction');
      formData.append('code', 'BATS:TEST');
      formData.append('type', 'sell');
      formData.append('date', '2024-01-15');
      formData.append('quantity', '5');
      formData.append('value', '500');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.addTransaction).toHaveBeenCalledWith(
        'BATS:TEST',
        'sell',
        '2024-01-15',
        5,
        500,
        0
      );
    });
  });

  describe('delete_transaction action', () => {
    test('should delete transaction by id', async () => {
      const formData = new FormData();
      formData.append('action', 'delete_transaction');
      formData.append('transaction_id', '42');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(mockDatabaseService.deleteTransaction).toHaveBeenCalledWith(42);
    });
  });

  describe('error handling', () => {
    test('should handle invalid action', async () => {
      const formData = new FormData();
      formData.append('action', 'invalid_action');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(302);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should return JSON error for AJAX request on failure', async () => {
      const formData = new FormData();
      formData.append('action', 'add_holding');
      formData.append('name', 'Test');
      formData.append('code', 'TEST');

      mockDatabaseService.addPortfolioHolding.mockRejectedValue(new Error('Database error'));

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers({ 'Accept': 'application/json' })
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json).toEqual({ success: false, error: 'Database error' });

      consoleErrorSpy.mockRestore();
    });

    test('should redirect on error for regular form submission', async () => {
      const formData = new FormData();
      formData.append('action', 'update_holding');
      formData.append('holding_id', '1');
      formData.append('name', 'Test');
      formData.append('code', 'TEST');

      mockDatabaseService.updatePortfolioHolding.mockRejectedValue(new Error('Update failed'));

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/config');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('response format', () => {
    test('should return redirect response for non-AJAX request', async () => {
      const formData = new FormData();
      formData.append('action', 'update_settings');
      formData.append('portfolio_name', 'Test');
      formData.append('cash_amount', '1000');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers()
      };

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe('/config');
    });

    test('should detect AJAX from Accept header', async () => {
      const formData = new FormData();
      formData.append('action', 'delete_holding');
      formData.append('holding_id', '1');

      mockRequest = {
        formData: vi.fn(() => Promise.resolve(formData)),
        headers: new Headers({ 'Accept': 'application/json, text/plain, */*' })
      };

      const response = await handleConfigSubmission(mockRequest, mockDatabaseService);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
