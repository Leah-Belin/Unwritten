// ── CACHE VERSION ──────────────────────────────────────────────
// Bump this only if you need to force-wipe everything (rare).
// JS/HTML/CSS: always fetched fresh (network-first, cache = offline fallback).
// Images: served from cache instantly, refreshed in background (stale-while-revalidate).
const CACHE = 'unwritten-v20';

const PRECACHE = [
  // Core scripts
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
  './renderer-assets.js',
  './renderer-tiles.js',
  './input.js',
  './engine.js',
  './scene.js',
  './npc.js',
  './npcs.js',
  './zones.js',
  // Village ground tiles (needed immediately on startup)
  './images/tiles/Miniature%20world/Tiles/Grass%20Block%201.png',
  './images/tiles/Miniature%20world/Tiles/Grass%20Block%201(flowered).png',
  './images/tiles/Miniature%20world/Tiles/Path%20Block.png',
  './images/tiles/Miniature%20world/Tiles/Dirt%20Block%201.png',
  './images/tiles/Miniature%20world/Tiles/Water%20Block.png',
  './images/tiles/Miniature%20world/Outline/Objects/Tree%201.png',
  './images/tiles/Miniature%20world/Outline/Objects/Tree%202.png',
  './images/tiles/isometric_0086.png',
  './images/tiles/isometric_0072.png',
  './images/tiles/isometric_0100.png',
  './images/tiles/isometric_0201.png',
  './images/tiles/isometric_0215.png',
  // Village building exteriors
  './images/buildings/shop_bakery.png',
  './images/buildings/shop_forge.png',
  './images/buildings/bldg_inn.png',
  './images/buildings/bldg_town_hall.png',
  './images/buildings/bldg_council_hall.png',
  './images/buildings/bldg_hestas_hut.png',
  './images/buildings/house_thatched.png',
  './images/buildings/house_log.png',
  './images/buildings/house_cottage_large.png',
  './images/buildings/house_halftimber.png',
  // Village decorations
  './images/tiles/Decorations/Bench.png',
  './images/tiles/Decorations/Fountain.png',
  './images/tiles/Decorations/hayBale.png',
  './images/tiles/Decorations/well.png',
  // Interior furniture
  './images/tiles/Decorations/chair.png',
  './images/tiles/Decorations/Table.png',
  './images/tiles/Decorations/bed1.png',
  './images/tiles/Decorations/Bed2.png',
  './images/tiles/Decorations/Chest.png',
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

const _isImage = url => /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(url);
const _isCode  = url => /\.(js|html|css)(\?|$)/i.test(url) || url.endsWith('/');

// Network-first for JS/HTML/CSS — always fresh, cache = offline fallback only.
// Stale-while-revalidate for images — instant from cache, refreshed in background.
// Everything else: cache-first passthrough.
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const url = e.request.url;

  if (_isCode(url)) {
    // Network-first: try live fetch, fall back to cache when offline
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  if (_isImage(url)) {
    // Stale-while-revalidate: serve cache immediately, refresh in background
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Default: cache-first for anything else (fonts, data files, etc.)
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
