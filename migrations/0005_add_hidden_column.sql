-- Migration: Add hidden column to portfolio_holdings
-- This allows users to hide holdings (e.g., closed positions) from charts and ticker view

-- Add hidden column with default value of 0 (visible)
ALTER TABLE portfolio_holdings ADD COLUMN hidden INTEGER DEFAULT 0 NOT NULL;

-- Create index for better query performance when filtering visible holdings
CREATE INDEX idx_portfolio_holdings_hidden ON portfolio_holdings(hidden);
