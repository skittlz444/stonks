-- Migration to add transactions table and remove quantity from portfolio_holdings
-- Transactions will track all buy/sell activity, and quantity will be calculated dynamically

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('buy', 'sell')),
    date TEXT NOT NULL,
    quantity REAL NOT NULL,
    value REAL NOT NULL,
    fee REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_code ON transactions(code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create temporary table with current portfolio_holdings structure (without quantity)
CREATE TABLE IF NOT EXISTS portfolio_holdings_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    target_weight REAL DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new (migrating existing quantities as initial buy transactions)
-- First, copy the holdings structure
INSERT INTO portfolio_holdings_new (id, name, code, target_weight, created_at, updated_at)
SELECT id, name, code, target_weight, created_at, updated_at FROM portfolio_holdings;

-- Create initial buy transactions for existing holdings with quantities
INSERT INTO transactions (code, type, date, quantity, value, fee)
SELECT 
    code, 
    'buy', 
    DATE('now'), 
    quantity, 
    0, 
    0
FROM portfolio_holdings
WHERE quantity > 0;

-- Drop old table and rename new one
DROP TABLE portfolio_holdings;
ALTER TABLE portfolio_holdings_new RENAME TO portfolio_holdings;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_code ON portfolio_holdings(code);
