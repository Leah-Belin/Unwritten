// ── SPRITE SHEET LOADER ───────────────────────────────────────
// Place PNG files at images/characters/<id>.png to replace emoji rendering.
// Expected format (compatible with LPC Universal Spritesheet Generator):
//   - Frame size: 64×64 px (configurable via SPRITE_W / SPRITE_H)
//   - Rows:  0=walk_up, 1=walk_left, 2=walk_down, 3=walk_right
//   - Columns: 0-3 walk frames (only first 4 used even if sheet has more)
//
// Character IDs:
//   player  → images/characters/player.png
//   NPCs    → images/characters/<npc.id>.png  (npc.id = lowercase name, e.g. "mariella")
const SPRITE_W = 64, SPRITE_H = 64;
const SPRITE_ROWS = { up:8, left:9, down:10, right:11 };
const _sprites = {};   // id → HTMLImageElement (null = load failed)

function loadSprite(id) {
  if (id in _sprites) return;
  _sprites[id] = null; // mark as attempted
  const img = new Image();
  img.onload = () => { _sprites[id] = img; };
  img.src = `images/characters/${id}.png`;
}

// Pre-attempt loads for known characters at startup.
// Add NPC ids here as sprite sheets become available.
loadSprite('player');
loadSprite('jaxon');
loadSprite('blacksmith');
loadSprite('mariella');
loadSprite('child1');
loadSprite('child2');
loadSprite('child3');
loadSprite('hesta');
loadSprite('elder');
loadSprite('father');
loadSprite('innkeeper');

// ── TILE IMAGE LOADER ─────────────────────────────────────────
// Miniature World isometric block sprites (32×32 source → drawn at 64×64).
// Each tile image sits aligned to the game's 64×32 iso diamond.
const _tileImgs = {};
function loadTileImg(id, src) {
  const img = new Image();
  img.onload = () => { _tileImgs[id] = img; };
  img.onerror = () => { console.error('[tiles] failed to load:', id, src); };
  img.src = src;
}
const _MWT = 'images/tiles/Miniature%20world/';
loadTileImg('grass',        _MWT + 'Tiles/Grass%20Block%201.png');
loadTileImg('grass_flower', _MWT + 'Tiles/Grass%20Block%201(flowered).png');
loadTileImg('path',         _MWT + 'Tiles/Path%20Block.png');
loadTileImg('dirt',         _MWT + 'Tiles/Dirt%20Block%201.png');
loadTileImg('water',        _MWT + 'Tiles/Water%20Block.png');
loadTileImg('tree_a',       _MWT + 'Outline/Objects/Tree%201.png');
loadTileImg('tree_b',       _MWT + 'Outline/Objects/Tree%202.png');
const _IT = 'images/tiles/';
loadTileImg('floor_wood',   _IT + 'isometric_0086.png');
loadTileImg('floor_stone',  _IT + 'isometric_0072.png');
loadTileImg('floor_brick',  _IT + 'isometric_0100.png');
loadTileImg('floor_slate',  _IT + 'isometric_0201.png');
loadTileImg('floor_cobble', _IT + 'isometric_0215.png');

// ── BUILDING EXTERIOR SPRITES ─────────────────────────────────
// Shops (extracted from Isometric shops.png)
loadTileImg('shop_bakery',  'images/buildings/shop_bakery.png');
loadTileImg('shop_forge',   'images/buildings/shop_forge.png');
loadTileImg('shop_mill',    'images/buildings/shop_mill.png');
loadTileImg('shop_general', 'images/buildings/shop_general.png');
// Civic & special buildings
loadTileImg('bldg_inn',          'images/buildings/bldg_inn.png');
loadTileImg('bldg_town_hall',    'images/buildings/bldg_town_hall.png');
loadTileImg('bldg_council_hall', 'images/buildings/bldg_council_hall.png');
loadTileImg('bldg_hestas_hut',   'images/buildings/bldg_hestas_hut.png');
// Villager houses (extracted from Villager houses 1.png)
loadTileImg('house_thatched',      'images/buildings/house_thatched.png');
loadTileImg('house_log',           'images/buildings/house_log.png');
loadTileImg('house_cottage_large', 'images/buildings/house_cottage_large.png');
loadTileImg('house_halftimber',    'images/buildings/house_halftimber.png');

// Village building sprite overlays.
// r1,c1..r2,c2 = tile footprint (inclusive).
// img = tile image key. yOff = extra vertical offset (positive = down).
const VILLAGE_BLDG_SPRITES = [
  // Main character buildings
  // tileR2 = actual south row of building tiles (from placeBuilding); r2 is the
  // larger sprite footprint used for ground-tile suppression and image sizing.
  // Z-sort must use tileR2 so characters on walkable tiles south of the building
  // tiles (but inside the sprite footprint) render in front, not behind.
  { id:'bakery',          r1:4,  c1:3,  r2:9,  c2:8,  tileR2:8,  img:'shop_bakery',      yOff:-20 },
  { id:'forge',           r1:4,  c1:25, r2:8,  c2:30, tileR2:5,  img:'shop_forge',       yOff:-60 },
  { id:'inn',             r1:4,  c1:32, r2:9,  c2:37, tileR2:6,  img:'bldg_inn',         yOff:-60 },
  // Civic buildings
  { id:'town_hall',       r1:10, c1:15, r2:15, c2:24, tileR2:13, img:'bldg_town_hall',   yOff:-40 },
  { id:'council_hall',    r1:22, c1:26, r2:26, c2:31, tileR2:24, img:'bldg_council_hall',yOff:-40 },
  { id:'hestas_hut',      r1:31, c1:4,  r2:35, c2:8,  tileR2:33, img:'bldg_hestas_hut',  yOff:-40 },
  // Residential houses — sprite r2 matches tile extent, no tileR2 needed
  { id:'jaxons_house',    r1:25, c1:10, r2:28, c2:15, img:'house_halftimber',    yOff:-80 },
  { id:'villager_house_a',r1:28, c1:22, r2:31, c2:25, img:'house_thatched',      yOff:-80 },
  { id:'villager_house_b',r1:12, c1:28, r2:15, c2:31, img:'house_log',           yOff:-20 },
  { id:'villager_house_c',r1:32, c1:14, r2:35, c2:17, img:'house_cottage_large', yOff:-20 },
];

// Maps 'col,row' → sprite img key for every tile inside a building footprint.
// drawTile uses this to skip procedural raised-box rendering only when the
// sprite image is actually loaded (falls back to procedural if image is missing).
const _BLDG_TILE_SPRITE = new Map();
for (const b of VILLAGE_BLDG_SPRITES)
  for (let r = b.r1; r <= b.r2; r++)
    for (let c = b.c1; c <= b.c2; c++)
      _BLDG_TILE_SPRITE.set(`${c},${r}`, b.img);

// Per-building floor tile
const _FLOOR_IMG = {
  bakery:          'floor_wood',
  inn:             'floor_stone',
  forge:           'floor_brick',
  town_hall:       'floor_slate',
  council_hall:    'floor_slate',
  jaxons_house:    'floor_wood',
  hestas_hut:      'floor_stone',
  villager_house_a:'floor_wood',
  villager_house_b:'floor_stone',
  villager_house_c:'floor_wood',
};

// Map tile type → image id for ground tiles
const _GROUND_IMG = {
  [T.GRASS]:  'grass',
  [T.FLOWER]: 'grass_flower',
  [T.TREE]:   'grass',
  [T.PATH]:   'path',
  [T.DOOR]:   'path',
  [T.DIRT]:   'dirt',
  [T.PLOT]:   'dirt',
  [T.WATER]:  'water',
  [T.STAIRS]: 'path',
  [T.COBBLE]: 'floor_stone',
};

// Draw a 32×32 Miniature World tile at 2× scale.
// Top-face top-vertex lands at (x, y − TH/2), matching the iso diamond.
function drawTileImg(img, x, y) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x - TW/2, y - TH/2, TW, TW);
}
