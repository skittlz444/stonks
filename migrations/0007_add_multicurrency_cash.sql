-- Migration: add multi-currency cash balance support
-- Existing single cash amount is preserved as USD cash for backward compatibility

INSERT OR REPLACE INTO portfolio_settings (key, value, updated_at)
SELECT 'cash_amount_USD', value, CURRENT_TIMESTAMP
FROM portfolio_settings
WHERE key = 'cash_amount';
