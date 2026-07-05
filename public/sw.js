/* global self, caches, fetch */
/* MovieZone Service Worker
 * - Precaches the PWA shell (html/manifest/icons).
 * - Stale-while-revalidate for navigations.
 * - Offline caching for movie mp4 blobs (Range-unfriendly network).
 * Dev: skip waiting + clients.claim so the fresh worker wins immediately. */
const CACHE_VERSION = 'moviezone-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const MOVIE_CACHE = `${CACHE_VERSION}-movies`;

const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Movie blobs — stored into the movie cache by the page via postMessage.
  if (url.pathname.startsWith('/__movie__/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(MOVIE_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
            return res;
          })
          .(() => caches.match('/offline.html')),
      }),
    );
    return;
  }

  // Navigations — stale-while-revalidate with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networked = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(request, copy)).catch(() => undefined);
            return res;
          })
          .catch(() => caches.match('/offline.html'));
        return cached || networked;
      }),
    );
    return;
  }

  // Everything else: cache first for same-origin static assets.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'moviezone:skip-waiting') {
    self.skipWaiting();
  }
});
