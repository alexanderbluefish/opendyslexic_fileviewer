const CACHE_NAME = 'dyslexic-reader-v4';
const STATIC_ASSETS = [
  'https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@master/woff/OpenDyslexic-Regular.woff',
  'https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@master/woff/OpenDyslexic-Bold.woff',
  'https://cdn.jsdelivr.net/gh/antijingoist/open-dyslexic@master/woff/OpenDyslexic-Italic.woff',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// Pre-cache fonts and libraries
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Remove old caches automatically
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Network-first for HTML updates, cache-first for heavy assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Checks GitHub first for code updates; falls back to cache if offline
  if (event.request.mode === 'navigate' || requestUrl.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
    );
    return;
  }

  // Load fonts/libraries from cache instantly
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
      );
    })
  );
});
