-- Migration to add target_weight column to portfolio_holdings
-- This allows users to set target portfolio allocation percentages

ALTER TABLE portfolio_holdings ADD COLUMN target_weight REAL DEFAULT NULL;

-- Add comment explaining the column
-- target_weight: The desired percentage weight of this holding in the total portfolio (0-100)
-- NULL means no target has been set for this holding
