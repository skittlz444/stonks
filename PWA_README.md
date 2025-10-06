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
- Caches essential resources for offline functionality
- Automatically versioned with build timestamps
- Cleans up old caches on activation
- Implements cache-first strategy with network fallback

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
│   └── icons/                   # App icons
│       ├── icon-192x192.png    # 192x192 icon
│       ├── icon-512x512.png    # 512x512 icon
│       └── screenshot-mobile.png
├── scripts/
│   ├── update-cache-version.js  # Build script
│   └── reset-cache-version.js   # Reset script
└── test/
    └── cache-version.test.js    # Tests for cache management
```

## PWA Features

### Installation
Users can install the app on:
- **Mobile (iOS/Android)**: Add to Home Screen
- **Desktop (Chrome/Edge)**: Install button in address bar
- **Desktop (Safari)**: Add to Dock

### Offline Support
- Cached pages load instantly
- Bootstrap CSS/JS cached for styling
- Fallback to offline message when network unavailable
- Smart cache-first strategy with network fallback

### Automatic Updates
- Each deployment gets unique cache version
- Old caches automatically cleaned up
- Users get latest version on next visit
- No manual cache clearing needed

## Cache Strategy

### Cached Resources
1. App routes (`/stonks/`, `/stonks/prices`, `/stonks/config`)
2. Bootstrap CSS (from CDN)
3. Bootstrap JS (from CDN)
4. PWA manifest

### Cache-First with Network Fallback
1. Check cache for resource
2. Return cached version if available
3. Otherwise, fetch from network
4. Cache successful responses
5. Show offline page if both fail

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

### Routes
- `/stonks/sw.js` - Service worker (no-cache)
- `/stonks/manifest.json` - PWA manifest (1hr cache)
- `/stonks/icons/*` - App icons (served as assets)

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

**Cache version not updating:**
- Ensure build script runs before deploy
- Check `public/sw.js` has timestamp (not placeholder)
- Verify wrangler uploads updated file

**Icons not showing:**
- Add your icon files to `public/icons/`
- Update manifest.json with correct paths
- Icons must be PNG format

## Future Enhancements

- [ ] Push notifications for price alerts
- [ ] Background sync for offline transactions
- [ ] Web Share API for sharing portfolios
- [ ] Badging API for portfolio changes
- [ ] Periodic background sync for price updates

## References

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Cloudflare Workers: Static Assets](https://developers.cloudflare.com/workers/configuration/sites/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
