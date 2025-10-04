-- Initial migration for stonks portfolio database
-- Create holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

-- Insert initial data based on current mock KV
INSERT INTO holdings (name, symbol) VALUES 
    ('My Portfolio', '2*BATS:VOO+27*BATS:AAAU+13*BATS:VXUS+3*BATS:VOOV+2*BATS:VO+8*BATS:GOP+101.8'),
    ('Vgrd S&P 500', 'AMEX:VOO'),
    ('GS Gold', 'CBOE:AAAU'),
    ('Vgrd Ex US', 'NASDAQ:VXUS'),
    ('Vgrd S&P 500 Value', 'AMEX:VOOV'),
    ('Vgrd Mid Cap', 'AMEX:VO'),
    ('GOP', 'CBOE:GOP');