/* ─── GRE Prep — Service Worker (offline support) ─────── */
var CACHE_NAME = 'gre-prep-v1';
var CACHE_FILES = [
  '/',
  '/index.html',
  '/assets/css/reset.css',
  '/assets/css/variables.css',
  '/assets/css/layout.css',
  '/assets/css/components.css',
  '/assets/css/pages/flashcards.css',
  '/assets/css/pages/practice.css',
  '/assets/css/pages/writing.css',
  '/assets/css/pages/progress.css',
  '/assets/css/pages/schedule.css',
  '/data/vocabulary.js',
  '/data/verbal-questions.js',
  '/data/quant-questions.js',
  '/data/writing-prompts.js',
  '/js/utils.js',
  '/js/store.js',
  '/js/components/modal.js',
  '/js/components/toast.js',
  '/js/components/timer.js',
  '/js/components/chart.js',
  '/js/pages/flashcards.js',
  '/js/pages/practice.js',
  '/js/pages/writing.js',
  '/js/pages/progress.js',
  '/js/pages/schedule.js',
  '/js/router.js',
  '/js/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    }).catch(function(err) {
      console.warn('Service worker cache failed (likely running from file://):', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)  { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        // Offline fallback
        return caches.match('/index.html');
      });
    })
  );
});
