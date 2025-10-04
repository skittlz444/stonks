# Stonks Portfolio Worker

A unified Cloudflare Worker that serves three different stock portfolio visualization pages.

## Project Structure

```
├── src/
│   ├── index.js        # Main worker with routing logic
│   ├── ticker.js       # Ticker tape page handler
│   ├── chartGrid.js    # Chart grid page handler
│   ├── chartLarge.js   # Large chart page handler
│   ├── utils.js        # Shared HTML utilities and layout functions
│   ├── chartWidgets.js # TradingView widget generation functions
│   ├── dataUtils.js    # Data processing and formatting utilities
│   └── mockKV.js       # Local development KV simulator
├── package.json        # Node.js dependencies
└── wrangler.toml       # Cloudflare Worker configuration
```

## Routes

The worker serves the following routes:

- `/stonks/ticker` - Ticker tape view with individual stock quotes
- `/stonks/charts` - Grid of mini chart widgets with market overview
- `/stonks/charts/large` - Large interactive charts with advanced features

## Setup and Deployment

### Prerequisites

1. Install Node.js and npm
2. Install Wrangler CLI: `npm install -g wrangler`
3. Authenticate with Cloudflare: `wrangler login`

### Configuration

1. **KV Namespace Setup**: Create a KV namespace for storing stock data:
   ```bash
   wrangler kv:namespace create "STONKS"
   wrangler kv:namespace create "STONKS" --preview
   ```

2. **Update wrangler.toml**: Replace the placeholder KV namespace IDs in `wrangler.toml` with your actual namespace IDs from step 1.

3. **Populate KV Data**: Your KV namespace should contain:
   - `currentHoldings`: Pipe-separated list of stock pairs in format `"Description","SYMBOL"`
   - `footerLinks`: Pipe-separated list of footer links in format `"Link Text","URL"`

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## Data Format

### currentHoldings
Format: `"Stock Name","SYMBOL"|"Another Stock","SYMBOL2"`

Example: `"Apple Inc","AAPL"|"Microsoft Corporation","MSFT"`

### footerLinks
Format: `"Link Text","URL"|"Another Link","URL2"`

Example: `"Portfolio","https://example.com/portfolio"|"About","https://example.com/about"`

## Migration from Separate Workers

This project consolidates three separate Cloudflare Workers:
- `ticker.js` → `/stonks/ticker`
- `chart-grid.js` → `/stonks/charts`  
- `chart-large.js` → `/stonks/charts/large`

All original functionality is preserved, but now served from a single worker with proper routing.