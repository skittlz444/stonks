# PWA (Progressive Web App) Implementation

This document describes the PWA implementation for the Stonks Portfolio Tracker application.

## Overview

The application is now a fully functional Progressive Web App that can:
- Be installed on mobile devices and desktops
- Work offline with cached content
- Receive automatic cache updates with each deployment
- Provide a native app-like experience

## Architecture

### Service Worker (`public/sw.js`)
- Caches static resources (HTML, CSS, JS bundles) for offline functionality
- **Does NOT cache API endpoints** (`/api/*`) - always fetched fresh
- Automatically versioned with build timestamps
- Cleans up old caches on activation
- Implements cache-first strategy with network fallback for static assets
- Development mode detection (skips caching when using placeholders)

### Manifest (`public/manifest.json`)
- Defines app metadata (name, icons, theme colors)
- Configures display mode (standalone)
- Specifies start URL and scope
- Lists app icons for different sizes

### Cache Versioning Scripts

#### Build Script (`scripts/update-cache-version.js`)
- Replaces `{{BUILD_TIMESTAMP}}` placeholder with actual timestamp
- Format: `stonks-YYYYMMDD-HHMMSS`
- Ensures each deployment gets a fresh cache
- Runs automatically before deployment

#### Reset Script (`scripts/reset-cache-version.js`)
- Restores development placeholder
- Runs automatically when starting dev server
- Prevents cache conflicts during development

## Usage

### Development
```bash
npm run dev
```
Automatically resets service worker to use placeholder cache name for development.

### Deployment
```bash
npm run deploy
```
Automatically updates service worker with timestamped cache version before deploying.

### Manual Cache Management
```bash
# Update cache version (for production builds)
npm run build:sw

# Reset to development placeholder
npm run build:sw:reset
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Resets SW cache, seeds DB, starts dev server |
| `npm run deploy` | Updates SW cache, runs migrations, deploys |
| `npm run build` | Updates service worker cache version |
| `npm run build:sw` | Updates service worker cache version |
| `npm run build:sw:reset` | Resets service worker to dev placeholder |

## File Structure

```
stonks/
├── public/
│   ├── sw.js                    # Service worker (auto-versioned)
│   ├── manifest.json            # PWA manifest
│   ├── dist/                    # Built React bundles (cached)
│   │   ├── prices.js           # Prices page React bundle
│   │   ├── config.js           # Config page React bundle
│   │   ├── ticker.js           # Ticker page React bundle
│   │   └── ...                 # Other page bundles
│   └── icons/                   # App icons
│       ├── icon-192x192.png    # 192x192 icon
│       ├── icon-512x512.png    # 512x512 icon
│       └── ...                 # Other icons
├── src/
│   ├── index.js                 # Cloudflare Worker (serves HTML + API)
│   └── client/                  # React/TypeScript source
│       ├── pages/              # React page components
│       ├── components/         # Reusable React components
│       └── ...                 # Hooks, utils, types
├── scripts/
│   ├── update-cache-version.js  # Build script (adds timestamp)
│   └── reset-cache-version.js   # Reset script (dev mode)
└── test/
    └── cache-version.test.js    # Tests for cache management (8 tests)
```

## PWA Features

### Installation
Users can install the app on:
- **Mobile (iOS/Android)**: Add to Home Screen
- **Desktop (Chrome/Edge)**: Install button in address bar
- **Desktop (Safari)**: Add to Dock

### Offline Support
- Cached React app shells load instantly
- React bundles cached for offline functionality
- Bootstrap CSS/JS cached for styling
- API data requires network (not cached)
- Fallback to offline message when network unavailable
- Smart cache-first strategy for static assets only

### Automatic Updates
- Each deployment gets unique cache version (timestamped)
- Old caches automatically cleaned up on service worker activation
- Users get latest React bundles and HTML on next visit
- No manual cache clearing needed
- API data always fresh (never cached by service worker)
- Server-side caching (1-minute for quotes) independent of PWA cache

## React Application Integration

The PWA works seamlessly with the React/TypeScript application:

### How It Works
1. **Service Worker** caches the minimal HTML shell and React bundles
2. **User visits offline** → Cached HTML and React bundles load
3. **React app initializes** → Attempts to fetch data from API endpoints
4. **API fetch fails** (offline) → React components show error state with retry
5. **User goes online** → React app can fetch fresh data

### What's Cached vs What's Not

**Cached (Works Offline):**
- HTML shells for all pages
- React JavaScript bundles (Vite builds)
- Bootstrap CSS and JavaScript
- PWA manifest and icons
- TradingView widget scripts (if previously loaded)

**Not Cached (Requires Network):**
- Portfolio data (holdings, transactions)
- Stock quotes (Finnhub API)
- Currency exchange rates (OpenExchangeRates)
- Database queries (D1)
- User actions (add/edit/delete)

### React Loading States

React components handle offline gracefully:
```typescript
// React component shows loading/error states
const { data, loading, error } = usePricesData();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} retry={refetch} />;
```

## Cache Strategy

### Cached Resources
1. **App routes**: `/stonks/`, `/stonks/prices`, `/stonks/config`, `/stonks/ticker`, `/stonks/charts`, `/stonks/charts/large`
2. **React bundles**: `/stonks/dist/prices.js`, `/stonks/dist/config.js`, `/stonks/dist/ticker.js`, etc.
3. **Bootstrap CSS**: CDN (jsdelivr.net)
4. **Bootstrap JS**: CDN (jsdelivr.net)
5. **PWA manifest**: `/stonks/manifest.json`

### NOT Cached (Always Fresh)
1. **API endpoints**: `/stonks/api/prices-data`, `/stonks/api/config-data` - always fetched from network
2. **External APIs**: Finnhub, OpenExchangeRates - never cached by service worker
3. **Database queries**: All D1 queries bypass the service worker
4. **POST/PUT/DELETE requests**: Non-GET requests always go to network

### Cache Strategy Details

**For Static Assets (HTML, JS, CSS):**
1. Check cache for resource
2. Return cached version if available (instant load)
3. Otherwise, fetch from network
4. Cache successful responses for future use
5. Show offline page if both fail

**For API Endpoints:**
1. Always bypass cache
2. Fetch directly from network
3. Server-side caching handles data freshness (1-minute for quotes)
4. Ensures real-time data updates

### Cache Invalidation
- New cache version on each deployment
- Old caches deleted on service worker activation
- Service worker file never cached (always fresh)
- Manifest cached for 1 hour

## Testing

Run tests for cache version management:
```bash
npm test test/cache-version.test.js
```

Tests cover:
- ✅ Timestamp placeholder replacement
- ✅ Timestamp format validation (YYYYMMDD-HHMMSS)
- ✅ Cache name updates
- ✅ Consistent timestamps between constants
- ✅ Placeholder restoration
- ✅ Idempotent resets
- ✅ Full update/reset cycles

## Browser Support

### Full PWA Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ Firefox (Android)

### Partial Support
- ⚠️ Safari (iOS/macOS) - Limited PWA features
- ⚠️ Firefox (Desktop) - Install prompt varies

### Service Worker Support
- ✅ All modern browsers
- ✅ Graceful degradation for older browsers

## Cloudflare Workers Integration

### Static Assets
Assets are served via Cloudflare Workers with:
- `[assets]` binding in `wrangler.toml`
- Static files from `public/` directory
- Automatic MIME type detection
- Edge caching for performance

### Routes & Caching Headers
- `/stonks/sw.js` - Service worker (no-cache, always fresh)
- `/stonks/manifest.json` - PWA manifest (1hr cache)
- `/stonks/icons/*` - App icons (served as assets, long cache)
- `/stonks/dist/*` - React bundles (cached by service worker)
- `/stonks/api/*` - API endpoints (NEVER cached by service worker)

## Development Notes

### Service Worker Updates
- Always use `npm run dev` to ensure clean dev state
- Service worker updates require page refresh
- Chrome DevTools > Application > Service Workers to debug
- Use "Update on reload" during development

### Cache Debugging
- Chrome DevTools > Application > Cache Storage
- Check cache name matches deployment timestamp
- Verify cached resources are correct
- Clear specific cache versions if needed

### Common Issues

**Service worker not updating:**
- Run `npm run build:sw:reset` before dev
- Hard refresh (Ctrl+Shift+R) in browser
- Check DevTools > Application > Service Workers
- Ensure "Update on reload" is checked during development

**Cache version not updating:**
- Ensure build script runs before deploy: `npm run build`
- Check `public/sw.js` has timestamp (not `{{BUILD_TIMESTAMP}}` placeholder)
- Verify wrangler uploads updated file
- Clear old service workers in DevTools if needed

**React app loads but shows "no data":**
- This is expected offline behavior - API endpoints not cached
- Check Network tab in DevTools to confirm API requests failing
- React error boundaries should show retry option
- Ensure you have network connectivity for data

**Icons not showing:**
- Add your icon files to `public/icons/`
- Update manifest.json with correct paths
- Icons must be PNG format (192x192, 512x512 minimum)

**API data seems stale:**
- Service worker does NOT cache API endpoints
- If data seems old, it's server-side caching (1-minute for quotes)
- Check cache timestamp displayed in React UI
- API requests always go to network, bypassing service worker

## Important Notes for Developers

### Service Worker Scope
The service worker operates at `/stonks/` scope and:
- ✅ **Caches**: HTML shells, React bundles (`/stonks/dist/*`), CSS, JS
- ❌ **Does NOT cache**: API endpoints (`/stonks/api/*`), external APIs
- 🔄 **Always fresh**: Service worker file itself, manifest

### React Bundle Caching
React bundles are cached by the service worker:
- First visit: Downloaded and cached
- Subsequent visits: Loaded from cache (instant)
- After deployment: New cache version, old bundles purged
- Vite builds include content hashes in filenames for cache busting

### API vs Static Asset Caching
**Two separate caching layers:**

1. **Service Worker Cache** (Client-Side):
   - Caches: HTML, React bundles, CSS, JS
   - Duration: Until next deployment
   - Purpose: Offline functionality

2. **Server-Side Cache** (Cloudflare Worker):
   - Caches: Stock quotes (1 minute), FX rates (1 hour)
   - Duration: Time-based expiration
   - Purpose: Reduce API calls, improve performance

These work independently and complement each other.

## Future Enhancements

- [ ] Push notifications for price alerts
- [ ] Background sync for offline transactions
- [ ] Web Share API for sharing portfolios
- [ ] Badging API for portfolio changes
- [ ] Periodic background sync for price updates
- [ ] IndexedDB for offline data caching (optional)

## References

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Cloudflare Workers: Static Assets](https://developers.cloudflare.com/workers/configuration/sites/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
