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
// ── DECORATION IMAGES ─────────────────────────────────────────
// TO ADD A NEW DECORATION:
//   STEP 1 — Register the image here with a short key of your choosing:
//              loadTileImg('my_key', 'images/tiles/Decorations/MyFile.png');
//   STEP 2 — Place it in a scene by adding an entry to SCENE_DECO below.
//
const _DEC = 'images/tiles/Decorations/';
//
// Interior furniture — used by drawFurniturePiece() in renderer.js
loadTileImg('furn_chair', _DEC + 'chair.png');   // replaces chair emoji
loadTileImg('furn_bed',   _DEC + 'bed1.png');    // replaces bed emoji
loadTileImg('furn_cot',   _DEC + 'Bed2.png');    // replaces cot emoji
loadTileImg('furn_chest', _DEC + 'Chest.png');   // replaces chest emoji
//
// Outdoor decorations — placed via SCENE_DECO below
loadTileImg('deco_bench',    _DEC + 'Bench.png');     // outdoor bench (503×400)
loadTileImg('deco_fountain', _DEC + 'Fountain.png');  // town fountain (576×400)
loadTileImg('deco_hay',      _DEC + 'hayBale.png');   // hay bale (633×400)
loadTileImg('deco_well',     _DEC + 'well.png');      // village well (686×400)
// Garden zone decorations
loadTileImg('garden_cart',    _DEC + 'GardenCart.png');  // (643×400)
loadTileImg('garden_gazebo',  _DEC + 'Gazebo.png');      // (421×411)
loadTileImg('garden_nursery', _DEC + 'HerbStation.png'); // (705×400)
loadTileImg('garden_well',    _DEC + 'gardenWell.png');  // (678×400)
// Market stall overlays
loadTileImg('stall_bread',   'images/buildings/stall_bread.png');
loadTileImg('stall_cooking', 'images/buildings/stall_cooking.png');
loadTileImg('stall_pottery', 'images/buildings/stall_pottery.png');
loadTileImg('stall_produce', 'images/buildings/stall_produce.png');
// Temple path features
loadTileImg('temple_eastern',  'images/buildings/temple_eastern.png');
loadTileImg('temple_gate',     'images/buildings/temple_gate.png');
loadTileImg('temple_obelisk',  'images/buildings/temple_obelisk.png');
loadTileImg('temple_pavilion', 'images/buildings/temple_pavilion.png');
loadTileImg('temple_roman',    'images/buildings/temple_roman.png');
loadTileImg('temple_ruins',    'images/buildings/temple_ruins.png');
loadTileImg('temple_wall',     'images/buildings/temple_wall.png');

// ── COLLECTIBLE RESOURCE IMAGES ───────────────────────────────
// These replace the default emoji rendering for items the player can pick up.
// All images live in images/tiles/Resources/.
//
// TO ADD AN IMAGE FOR A NEW COLLECTIBLE ITEM:
//   STEP 1 — Save the PNG to images/tiles/Resources/ and register it here:
//              loadTileImg('res_mykey', _RES + 'MyFile.png');
//   STEP 2 — Map the item's ID to the image key in ITEM_RES_IMG below.
//
const _RES = 'images/tiles/Resources/';
//
loadTileImg('res_berries',  _RES + 'Berries.png');    // fruit / berries
loadTileImg('res_feathers', _RES + 'Feathers.png');   // feathers (unassigned — add to ITEM_RES_IMG when needed)
loadTileImg('res_glass',    _RES + 'Glass.png');      // glass_piece
loadTileImg('res_mushrooms',_RES + 'Mushrooms.png');  // healing_herb
loadTileImg('res_parsley',  _RES + 'Parsley.png');    // common_herb / mint_herb
loadTileImg('res_sticks',   _RES + 'Sticks.png');     // timber
loadTileImg('res_thistle',  _RES + 'Thistle.png');    // lavender / spice_herb
loadTileImg('res_bread',    _RES + 'bread.png');      // simple_bread / spiced_rolls
loadTileImg('res_cloth',    _RES + 'clothScrap.png'); // cloth_scrap
loadTileImg('res_potatoes', _RES + 'potatoes.png');   // (unassigned — add to ITEM_RES_IMG when needed)
loadTileImg('res_stones',   _RES + 'stones.png');     // stone_block / stone_fragment
loadTileImg('res_tonics',   _RES + 'tonics.png');     // healing_tonic / energy_salve / sleep_draught

// Maps item IDs (from ITEMS in world.js) → resource image keys loaded above.
// drawItem() in renderer.js looks up the item's ID here and draws the PNG
// instead of the emoji.  Items not listed here fall back to emoji rendering.
//
// TO MAP A NEW ITEM TO AN IMAGE:
//   Make sure you completed STEP 1 and STEP 2 above, then add a line here:
//      my_item_id: 'res_mykey',
//
const ITEM_RES_IMG = {
  // Building materials
  glass_piece:    'res_glass',
  stone_block:    'res_stones',
  stone_fragment: 'res_stones',
  timber:         'res_sticks',
  cloth_scrap:    'res_cloth',
  // Food
  simple_bread:   'res_bread',
  spiced_rolls:   'res_bread',
  fruit:          'res_berries',
  // Herbs
  common_herb:    'res_parsley',
  healing_herb:   'res_mushrooms',
  mint_herb:      'res_parsley',
  lavender:       'res_thistle',
  spice_herb:     'res_thistle',
  // Tonics
  healing_tonic:  'res_tonics',
  energy_salve:   'res_tonics',
  sleep_draught:  'res_tonics',
};

// Village building PNG overlays.  Each entry describes one building image and
// where it sits on the tile grid.  Fields:
//
//   r1, c1        Top-left corner of the sprite's visual footprint (tile coords).
//   r2, c2        Bottom-right corner of the sprite's visual footprint (inclusive).
//                 This is LARGER than the actual building tiles when the PNG image
//                 extends south over walkable ground in front of the building.
//                 drawBuildingOverlay uses r2 to anchor the image bottom edge and
//                 to size the image to match the footprint width on screen.
//   tileR2        (optional) The actual southernmost row of solid building tiles
//                 placed by placeBuilding().  Rows between tileR2 and r2 are
//                 walkable ground that the image visually overlaps — omit tileR2
//                 when r2 equals the real tile extent (most residential houses).
//                 The z-sort uses tileR2 (not r2) so characters walking on those
//                 foreground tiles appear in front of the building, not behind it.
//   img           Key into _tileImgs for the building's PNG image.
//   yOff          Extra vertical pixel nudge applied when placing the image.
//                 Negative values move the image up; tune this to align the image
//                 bottom with the ground tiles.
//
const VILLAGE_BLDG_SPRITES = [
  // Main character buildings
  { id:'bakery',          r1:4,  c1:3,  r2:9,  c2:8,  tileR2:8,  img:'shop_bakery',      yOff:-20 },
  { id:'forge',           r1:4,  c1:25, r2:8,  c2:30, tileR2:5,  img:'shop_forge',       yOff:-60 },
  { id:'inn',             r1:4,  c1:32, r2:9,  c2:37, tileR2:6,  img:'bldg_inn',         yOff:-60 },
  // Civic buildings
  { id:'town_hall',       r1:14, c1:20, r2:19, c2:27, tileR2:16, img:'bldg_town_hall',   yOff:-60 },
  { id:'council_hall',    r1:22, c1:26, r2:26, c2:31, tileR2:24, img:'bldg_council_hall',yOff:-48 },
  { id:'hestas_hut',      r1:31, c1:4,  r2:35, c2:8,  tileR2:33, img:'bldg_hestas_hut',  yOff:-40 },
  // Residential houses — r2 matches the actual tile extent, so no tileR2 needed
  { id:'jaxons_house',    r1:25, c1:10, r2:28, c2:15, img:'house_halftimber',    yOff:-20 },
  { id:'villager_house_a',r1:28, c1:22, r2:31, c2:25, img:'house_thatched',      yOff:-20 },
  { id:'villager_house_b',r1:12, c1:28, r2:15, c2:31, img:'house_log',           yOff:-20 },
  { id:'villager_house_c',r1:32, c1:14, r2:35, c2:17, img:'house_cottage_large', yOff:-20 },
];

// Maps 'col,row' → image key for every tile coordinate inside a building's
// sprite footprint (r1..r2 × c1..c2).  drawTile looks up each tile here; if
// the building image is loaded it draws a plain grass base instead of the
// normal procedural 3D box, so the PNG overlay (drawn later at higher z) lands
// cleanly on flat ground.  If the image hasn't loaded yet, the 3D box shows as
// a fallback.
const _buildingFootprintTiles = new Map();
for (const b of VILLAGE_BLDG_SPRITES)
  for (let r = b.r1; r <= b.r2; r++)
    for (let c = b.c1; c <= b.c2; c++)
      _buildingFootprintTiles.set(`${c},${r}`, b.img);

// ── SCENE DECORATIONS ─────────────────────────────────────────
// Decorative objects placed on top of the tile grid, grouped by scene.
// The rendering engine draws each entry at the correct isometric depth
// automatically — you only need to specify where and what.
//
// HOW TO ADD A NEW DECORATION
// ────────────────────────────
// 1. Save the PNG to images/buildings/ and register it above with loadTileImg.
// 2. Add an entry to the right scene array below:
//
//      { img:'your_key', col:X, row:Y, size:64, yOff:0 },
//
//    col / row  — tile coordinates, matching the zone's grid (same numbers
//                 you'd use in buildVillageMap, buildGardenMap, etc.).
//                 col increases going right/east, row increases going down/south.
//
//    size       — height of the image in pixels. Width is derived automatically
//                 from the image's aspect ratio, so wide images won't be
//                 squashed. Start with 64–80 for small objects, 80–96 for
//                 larger ones, and tune visually.
//
//    yOff       — fine-tune the vertical position after size is set. The image
//                 bottom sits at ground level by default. Negative values shift
//                 the image upward (use if it looks like it's sinking into the
//                 ground); positive shifts it down.
//
// The same image key can appear in multiple entries — e.g. two benches using
// 'deco_bench' at different col/row positions.
//
// Valid scene keys: 'village', 'garden', 'market', 'temple_path', 'forest'
// (add a new key for a new zone — the renderer picks up any scene automatically).
//
const SCENE_DECO = {
  village: [
    // Benches flanking the east-west path through the town square
    { img:'deco_bench', col:17, row:20, size:80, yOff:0 },
    { img:'deco_bench', col:23, row:20, size:80, yOff:0 },
    // Well in the residential area (south of Jaxon's house)
    { img:'deco_well',  col:13, row:29, size:80, yOff:0 },
    // Hay bale south of the forge
    { img:'deco_hay',   col:27, row:8,  size:64, yOff:0 },
  ],
  garden: [
    { img:'garden_gazebo',  col:12, row:5,  size:80, yOff:0 },
    { img:'garden_nursery', col:11, row:14, size:80, yOff:0 },
    { img:'garden_well',    col:10, row:22, size:80, yOff:0 },
    { img:'garden_cart',    col:8,  row:24, size:64, yOff:0 },
  ],
  market: [
    { img:'stall_bread',   col:9,  row:5,  size:80, yOff:0 },
    { img:'stall_produce', col:14, row:5,  size:80, yOff:0 },
    { img:'stall_pottery', col:19, row:5,  size:80, yOff:0 },
    { img:'stall_cooking', col:24, row:10, size:80, yOff:0 },
  ],
  temple_path: [
    { img:'temple_gate',     col:13, row:2,  size:96, yOff:0 },
    { img:'temple_ruins',    col:6,  row:7,  size:96, yOff:0 },
    { img:'temple_ruins',    col:21, row:7,  size:96, yOff:0 },
    { img:'temple_obelisk',  col:13, row:11, size:64, yOff:0 },
    { img:'temple_pavilion', col:13, row:17, size:96, yOff:0 },
  ],
};

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
