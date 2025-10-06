# PWA Quick Start Guide

## 🚀 Getting Started

Your Stonks Portfolio Tracker is now a Progressive Web App!

## Development

```bash
# Start dev server (resets service worker cache)
npm run dev
```

The dev server will:
1. Reset service worker to development mode
2. Seed local database
3. Start at http://localhost:8787

## Deployment

```bash
# Deploy with versioned cache
npm run deploy
```

The deploy process will:
1. Generate timestamp for cache version
2. Update service worker with new version
3. Run database migrations
4. Deploy to Cloudflare Workers

## Testing the PWA

### Desktop (Chrome/Edge)
1. Open http://localhost:8787/stonks/prices
2. Look for install button in address bar (⊕)
3. Click "Install Stonks"
4. App opens in standalone window

### Mobile (Any Browser)
1. Open app in mobile browser
2. Tap menu (⋮) or share button
3. Select "Add to Home Screen"
4. Tap the new home screen icon

### Test Offline Mode
1. Install the app
2. Open DevTools > Application > Service Workers
3. Check "Offline" checkbox
4. Navigate around - app still works!

## Verifying Installation

### Check Service Worker
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" in sidebar
4. Should see: "stonks-{{BUILD_TIMESTAMP}}" (dev) or "stonks-YYYYMMDD-HHMMSS" (prod)

### Check Cache
1. DevTools > Application > Cache Storage
2. Should see cache named "stonks-..." with your resources
3. Bootstrap CSS and JS should be cached

### Check Manifest
1. DevTools > Application > Manifest
2. Should show app name, icons, theme colors
3. No errors in console

## Common Commands

```bash
# Development
npm run dev              # Start with reset cache

# Building
npm run build            # Update service worker
npm run build:sw         # Same as above
npm run build:sw:reset   # Reset to dev mode

# Deployment
npm run deploy           # Build + deploy

# Testing
npm test                                  # All tests
npm test test/cache-version.test.js     # Just PWA tests
```

## Troubleshooting

### Service worker not updating?
```bash
npm run build:sw:reset
npm run dev
```
Then hard refresh browser (Ctrl+Shift+R)

### Cache not clearing?
1. DevTools > Application > Storage
2. Click "Clear site data"
3. Reload page

### Install button not showing?
- Must be HTTPS (or localhost)
- Must have valid manifest
- Service worker must be registered
- Wait a few seconds after page load

## What's Cached?

✅ App routes (`/stonks/*`)  
✅ Bootstrap CSS & JS  
✅ PWA Manifest  
✅ App pages (prices, config, etc.)  

## File Checklist

- [ ] Add icons to `public/icons/`
  - [ ] icon-192x192.png
  - [ ] icon-512x512.png
- [ ] Test on mobile device
- [ ] Test offline mode
- [ ] Test installation
- [ ] Deploy to production

## Next Steps

1. **Add Icons**: Create 192x192 and 512x512 PNG icons
2. **Test Locally**: Install and test offline
3. **Deploy**: Run `npm run deploy`
4. **Mobile Test**: Install on actual device
5. **Share**: Users can now install your app!

## Resources

- Full documentation: `PWA_README.md`
- Implementation details: `PWA_IMPLEMENTATION_SUMMARY.md`
- Icon guide: `public/icons/README.md`

---

**Pro Tip**: Always run `npm run dev` (not just `wrangler dev`) to ensure proper cache management during development!
