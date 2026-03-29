// ── CACHE VERSION ──────────────────────────────────────────────
// Change this string to force every client to discard the old cache
// and re-fetch all game assets on their next visit.
const CACHE = 'unwritten-v19';

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
