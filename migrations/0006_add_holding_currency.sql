-- Migration: add holding currency for multi-currency portfolios
-- Existing holdings default to USD, including closed positions that still map to portfolio_holdings

ALTER TABLE portfolio_holdings ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_currency ON portfolio_holdings(currency);
