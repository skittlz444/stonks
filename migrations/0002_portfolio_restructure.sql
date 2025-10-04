-- Migration to restructure holdings for dynamic portfolio construction
-- Create new holdings structure with quantity, code, and name
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolio settings table for cash and other portfolio-level settings
CREATE TABLE IF NOT EXISTS portfolio_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_code ON portfolio_holdings(code);
CREATE INDEX IF NOT EXISTS idx_portfolio_settings_key ON portfolio_settings(key);

-- Insert individual holdings parsed from the My Portfolio composition
INSERT INTO portfolio_holdings (name, code, quantity) VALUES 
    ('Vgrd S&P 500', 'BATS:VOO', 2),
    ('GS Gold', 'BATS:AAAU', 27),
    ('Vgrd Ex US', 'BATS:VXUS', 13),
    ('Vgrd S&P 500 Value', 'BATS:VOOV', 3),
    ('Vgrd Mid Cap', 'BATS:VO', 2),
    ('GOP', 'BATS:GOP', 8);

-- Insert portfolio settings including cash
INSERT INTO portfolio_settings (key, value) VALUES 
    ('cash_amount', '101.8'),
    ('portfolio_name', 'My Portfolio');

-- Drop the original holdings table since we're using the new structure
DROP TABLE IF EXISTS holdings;
