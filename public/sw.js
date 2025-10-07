// Build timestamp - this should be replaced during build process
const BUILD_TIMESTAMP = '{{BUILD_TIMESTAMP}}';
const CACHE_NAME = `stonks-{{BUILD_TIMESTAMP}}`;

// Check if we're in development mode (timestamp placeholder not replaced)
const isDevelopment = BUILD_TIMESTAMP.includes('{{');

const urlsToCache = [
  '/stonks/',
  '/stonks/prices',
  '/stonks/config',
  '/stonks/ticker',
  '/stonks/charts',
  '/stonks/charts/large',
  '/stonks/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.bundle.min.js'
];

if (isDevelopment) {
  console.log('Service Worker: Running in DEVELOPMENT mode - caching disabled');
}

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...', CACHE_NAME);
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Skip caching in development
  if (isDevelopment) {
    console.log('Service Worker: Skipping cache in development mode');
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cached all files');
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...', CACHE_NAME);
  // Claim all clients immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline, fallback to network
self.addEventListener('fetch', (event) => {
  // In development mode, bypass cache entirely - always fetch from network
  if (isDevelopment) {
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip requests to external domains (except CDN resources)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin && !url.hostname.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache static assets and API responses (but not POST/PUT/DELETE)
            if (event.request.url.includes('/stonks/')) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, return a basic offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/stonks/').then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Return a basic offline message
                return new Response('Offline - Please check your connection', {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'text/plain' }
                });
              });
            }
          });
      })
  );
});
