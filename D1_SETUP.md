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

### Holdings Table
- `id` - Primary key (auto-increment)
- `name` - Display name of the holding (e.g., "Vgrd S&P 500")
- `symbol` - Trading symbol (e.g., "AMEX:VOO")
- `created_at` - Timestamp when record was created
- `updated_at` - Timestamp when record was last updated

## Initial Data

The migration includes the following initial holdings:
- My Portfolio (complex multi-stock composition)
- Vanguard S&P 500 (AMEX:VOO)
- Goldman Sachs Gold (CBOE:AAAU)
- Vanguard Ex-US (NASDAQ:VXUS)
- Vanguard S&P 500 Value (AMEX:VOOV)
- Vanguard Mid Cap (AMEX:VO)
- GOP (CBOE:GOP)

## Local Development

For local development, the application uses a MockD1Database that simulates the D1 database with the same data structure. No additional setup is required for local testing.

## Database Operations

The `DatabaseService` class provides methods to:
- `getCurrentHoldings()` - Get holdings in KV-compatible format
- `addHolding(name, symbol)` - Add a new holding
- `updateHolding(id, name, symbol)` - Update an existing holding
- `deleteHolding(id)` - Remove a holding
- `getAllHoldings()` - Get structured data for all holdings