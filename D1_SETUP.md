# D1 Database Setup Instructions

## Creating the D1 Database

1. **Create the database:**
   ```bash
   wrangler d1 create stonks-portfolio
   ```

2. **Update wrangler.toml:**
   Replace `your-d1-database-id` in `wrangler.toml` with the database ID from step 1.

3. **Run the migration:**
   ```bash
   wrangler d1 migrations apply stonks-portfolio --local
   wrangler d1 migrations apply stonks-portfolio --remote
   ```

## Database Schema

### portfolio_holdings Table
- `id` - Primary key (auto-increment)
- `name` - Display name of the holding (e.g., "Vgrd S&P 500")
- `code` - Trading symbol with exchange (e.g., "BATS:VOO")
- `target_weight` - Optional target portfolio allocation percentage (0-100)
- `hidden` - Visibility flag (0=visible in charts, 1=hidden)
- `created_at` - Timestamp when record was created
- `updated_at` - Timestamp when record was last updated

**Note**: Quantity is no longer stored directly in this table. It is calculated dynamically from the transactions table.

### transactions Table
- `id` - Primary key (auto-increment)
- `code` - Trading symbol matching portfolio_holdings.code
- `type` - Transaction type ('buy' or 'sell')
- `date` - Transaction date (YYYY-MM-DD format)
- `quantity` - Number of shares bought/sold
- `value` - Total transaction value (price × quantity)
- `fee` - Transaction fee/commission
- `created_at` - Timestamp when record was created
- `updated_at` - Timestamp when record was last updated

### portfolio_settings Table
- `key` - Setting name (primary key)
- `value` - Setting value (stored as TEXT)
- Common keys:
  - `cash_amount` - Current cash balance
  - `portfolio_name` - Display name for the portfolio

## Initial Data

The migration includes the following initial holdings:
- Vanguard S&P 500 (BATS:VOO)
- Goldman Sachs Gold (BATS:AAAU)
- Vanguard Ex-US (BATS:VXUS)
- Vanguard S&P 500 Value (BATS:VOOV)
- Vanguard Mid Cap (BATS:VO)
- GOP (BATS:GOP)

Initial transactions are created with current quantities (value and fee set to 0 for migration compatibility).

## Local Development

For local development, the application uses a MockD1Database that simulates the D1 database with the same data structure. No additional setup is required for local testing.

## Database Operations

The `DatabaseService` class provides comprehensive methods for portfolio management:

### Holdings Management
- `getHoldings()` - Get all holdings with dynamic portfolio composition
- `getVisibleHoldings()` - Get only visible holdings (hidden=0)
- `getVisiblePortfolioHoldings()` - Get visible holdings with quantities
- `getHiddenPortfolioHoldings()` - Get hidden holdings
- `addPortfolioHolding(name, code, targetWeight)` - Add a new holding
- `updatePortfolioHolding(id, name, code, targetWeight)` - Update a holding
- `deletePortfolioHolding(id)` - Remove a holding
- `toggleHoldingVisibility(id)` - Toggle hidden status

### Transaction Management
- `addTransaction(code, type, date, quantity, value, fee)` - Record a transaction
- `getTransactions()` - Get all transactions
- `getTransactionsByCode(code)` - Get transactions for a specific holding
- `deleteTransaction(id)` - Remove a transaction
- `getClosedPositions()` - Calculate realized gains from closed positions

### Portfolio Settings
- `getCashAmount()` - Get current cash balance
- `updateCashAmount(amount)` - Update cash balance
- `getPortfolioName()` - Get portfolio display name
- `updatePortfolioName(name)` - Update portfolio name

### Legacy Compatibility
- `getCurrentHoldings()` - Get holdings in KV-compatible format for backward compatibility

## Migrations

The project includes 5 migrations:

1. **0001_initial_schema.sql** - Create initial tables (holdings, settings)
2. **0002_rename_to_portfolio_holdings.sql** - Rename holdings table
3. **0003_add_target_weight.sql** - Add target allocation column
4. **0004_add_transactions.sql** - Add transactions table, migrate quantities
5. **0005_add_hidden_column.sql** - Add visibility control for holdings

Run migrations in order:
```bash
wrangler d1 migrations apply stonks-portfolio --local
wrangler d1 migrations apply stonks-portfolio --remote
```