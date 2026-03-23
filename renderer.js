// ── SPRITE SHEET LOADER ───────────────────────────────────────
const SPRITE_W = 64, SPRITE_H = 64;
const SPRITE_ROWS = { up:8, left:9, down:10, right:11 };
const _sprites = {};

function loadSprite(id) {
  if (id in _sprites) return;
  _sprites[id] = null;
  const img = new Image();
  img.onload = () => { _sprites[id] = img; };
  img.src = `images/characters/${id}.png`;
}

// Pre-load characters
['player', 'jaxon', 'blacksmith', 'mariella', 'child1', 'child2', 'child3', 'hesta', 'elder', 'father', 'innkeeper'].forEach(loadSprite);

// ── TILE IMAGE LOADER ─────────────────────────────────────────
const _tileImgs = {};
function loadTileImg(id, src) {
  const img = new Image();
  img.onload = () => { _tileImgs[id] = img; };
  img.src = src;
}

const _MWT = 'images/tiles/Miniature%20world/';
loadTileImg('grass',         _MWT + 'Tiles/Grass%20Block%201.png');
loadTileImg('grass_flower',  _MWT + 'Tiles/Grass%20Block%201(flowered).png');
loadTileImg('path',          _MWT + 'Tiles/Path%20Block.png');
loadTileImg('dirt',          _MWT + 'Tiles/Dirt%20Block%201.png');
loadTileImg('water',         _MWT + 'Tiles/Water%20Block.png');
loadTileImg('tree_a',        _MWT + 'Outline/Objects/Tree%201.png');
loadTileImg('tree_b',        _MWT + 'Outline/Objects/Tree%202.png');

const _IT = 'images/tiles/';
loadTileImg('floor_wood',   _IT + 'isometric_0086.png');
loadTileImg('floor_stone',  _IT + 'isometric_0072.png');

// ── BUILDING EXTERIOR SPRITES ─────────────────────────────────
const _HN = _IT + 'hernandack-houses/';
loadTileImg('bldg_hn1', _HN + 'Isometric-Houses-1.png'); // Blue roof sheet

/**
 * VILLAGE_BLDG_SPRITES
 * Updated with specific source coordinates (sx, sy) for the blue-roof houses.
 * Added interior colors to fix the transparency issue.
 */
const VILLAGE_BLDG_SPRITES = [
  { 
    id: 'jaxons_house', 
    r1: 25, c1: 10, r2: 28, c2: 15, 
    img: 'bldg_hn1', 
    sx: 48, sy: 0, sw: 48, sh: 48, // Second house in top row
    yOff: 24, 
    wallColor: '#6d4c3d',     // Back-left wall
    wallShadow: '#52382d',    // Back-right wall
    floorColor: '#3d2b22'     // Interior floor
  },
  { 
    id: 'villager_house_a', 
    r1: 28, c1: 22, r2: 31, c2: 25, 
    img: 'bldg_hn1', 
    sx: 0, sy: 0, sw: 48, sh: 48,  // First house in top row
    yOff: 22, 
    wallColor: '#6d4c3d', 
    wallShadow: '#52382d', 
    floorColor: '#3d2b22' 
  }
];

// ── CORE RENDERER FUNCTIONS ───────────────────────────────────

function drawBuildingSprite(b) {
  const img = _tileImgs[b.img];
  if (!img) return;

  const srcX = b.sx ?? 0, srcY = b.sy ?? 0;
  const srcW = b.sw ?? img.naturalWidth;
  const srcH = b.sh ?? img.naturalHeight;

  // Horizontal centre and bottom-ground alignment
  const cc = (b.c1 + b.c2) / 2;
  const cr = (b.r1 + b.r2) / 2;
  const cx = isoX(cc, cr) + offX;
  const cy = isoY(cc, b.r2) + TH / 2 + offY + (b.yOff ?? 0);

  // Scale relative to footprint
  const fW = (b.c2 - b.c1 + b.r2 - b.r1) * TW / 2;
  const scale = fW / srcW;
  const dw = srcW * scale;
  const dh = srcH * scale;

  /**
   * FIX: INTERIOR FILLER
   * This draws the floor and back walls BEFORE the sprite image.
   */
  if (b.wallColor) {
    const hw = TW / 2, hh = TH / 2;
    const bh = b.wallBH ?? 32;

    // 1. Draw Interior Floor (covers grass)
    ctx.beginPath();
    const pTop = toScreen(b.c1, b.r1);
    const pRight = toScreen(b.c2, b.r1);
    const pBottom = toScreen(b.c2, b.r2);
    const pLeft = toScreen(b.c1, b.r2);
    ctx.moveTo(pTop.x, pTop.y - hh);
    ctx.lineTo(pRight.x
