/* BOXD service worker — v1
   Strategy:
   - NEVER touch Supabase requests (live game data must always be fresh)
   - Navigations: network-first, falling back to cached shell when offline
   - Static assets + TMDB posters: cache-first (hashed bundles are immutable)
*/
const CACHE = 'boxd-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Live data — always straight to network, never cached
  if (url.hostname.includes('supabase.co')) return;

  // App navigations — network-first so new deploys land immediately
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/__shell', copy));
          return res;
        })
        .catch(() => caches.match('/__shell'))
    );
    return;
  }

  // Same-origin static assets + TMDB poster images — cache-first
  if (url.origin === location.origin || url.hostname.includes('image.tmdb.org')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
