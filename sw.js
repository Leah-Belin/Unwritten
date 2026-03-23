// ── CACHE VERSION ──────────────────────────────────────────────
// Change this string to force every client to discard the old cache
// and re-fetch all game assets on their next visit.
const CACHE = 'unwritten-v15';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './state.js',
  './world.js',
  './data.js',
  './crafting.js',
  './quests.js',
  './ui.js',
  './events.js',
  './renderer.js',
  './input.js',
  './engine.js',
];

// Pre-cache core files on install, then activate immediately.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Delete every cache that isn't the current version.
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Cache-first for same-origin requests; let cross-origin (fonts, etc.) pass through.
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
