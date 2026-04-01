
// ── CANVAS ────────────────────────────────────────────────────
let canvas, ctx;
let W = 0, H = 0;

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  W = canvas.width  = wrap.clientWidth;
  H = canvas.height = wrap.clientHeight;
}

// ── PORTRAIT DATA
const PORTRAIT_KAIDA     = 'images/portraits/kaida.jpg';
const PORTRAIT_GALEN     = 'images/portraits/galen.jpg';
const PORTRAIT_MARIELLA  = 'images/portraits/mariella.jpg';

// ── ISO MATH ──────────────────────────────────────────────────
const TW = 64, TH = 32;
let zoomLevel = 1.0;            // changed by pinch / scroll-wheel
const isoX = (c,r) => (c - r) * (TW/2);
const isoY = (c,r) => (c + r) * (TH/2);
let offX = 0, offY = 0;
const snapCamera = () => { offX = W/2 - player.px; offY = H/2 - player.py - TH; };

const toScreen = (c,r) => ({ x: isoX(c,r)+offX, y: isoY(c,r)+offY });
// Canvas is drawn with ctx.scale(zoom) centred on (W/2, H/2).
// Invert that transform before converting a screen tap to a tile.
const toTile = (sx,sy) => {
  const lx = (sx - W/2) / zoomLevel + W/2;
  const ly = (sy - H/2) / zoomLevel + H/2;
  const wx = lx - offX, wy = ly - offY;
  return {
    col: Math.round((wx/(TW/2) + wy/(TH/2)) / 2),
    row: Math.round((wy/(TH/2) - wx/(TW/2)) / 2),
  };
};

// ── PLAYER ────────────────────────────────────────────────────
const player = {
  col: 20, row: 23,
  px: 0, py: 0,
  path: [],
  color: '#e8c090',
  direction: 'down',
  moving: false,
  animFrame: 0,
  animTimer: 0,
};

const MOVE_SPEED = 90;
const TICKS_PER_PERIOD = 200; // 200 actions per period = ~1400 actions per full day (very slow, real-time feel)

// ── SCENE STATE ───────────────────────────────────────────────
let currentMap  = null;   // 2D tile array
let currentNPCs = [];     // NPC objects visible in this scene
let currentItems = [];    // Interactable items on map { itemId, col, row, label, oneTime, taken }
let currentStations = []; // Crafting stations { type, col, row, label }
let currentFurniture = [];
let currentExits = [];    // Exit points { label, targetScene, targetFloor, col, row }
let currentBuilding = null;
let currentFloor    = null;
let currentCabinet  = null;
let mapCols = 0, mapRows = 0;

// ── A* PATHFINDING ────────────────────────────────────────────
function walkable(c, r) {
  if (c < 0 || r < 0 || c >= mapCols || r >= mapRows) return false;
  const t = currentMap[r]?.[c];
  if (t === undefined) return false;
  if (!TILE_DEF[t]?.walk) return false;
  if (currentNPCs.some(n => n.col===c && n.row===r)) return false;
  // Small furniture (chairs, stools) is passable; large pieces block
  const BLOCKS_WALK = new Set(['table','counter','bed','cot','barrel','shelf','chest']);
  if (currentFurniture.some(f => f.col===c && f.row===r && BLOCKS_WALK.has(f.type))) return false;
  // In interiors, block outer border EXCEPT for door and stairs tiles
  if (currentBuilding && (c === 0 || r === 0 || c === mapCols-1 || r === mapRows-1)) {
    if (t !== T.DOOR && t !== T.STAIRS) return false;
  }
  return true;
}

function astar(sc, sr, ec, er) {
  const key   = (c,r) => `${c},${r}`;
  const h     = (c,r) => Math.abs(c-ec) + Math.abs(r-er);
  const open  = [{ c:sc, r:sr, g:0, f:h(sc,sr), parent:null }];
  const best  = { [key(sc,sr)]: 0 };
  while (open.length) {
    open.sort((a,b) => a.f - b.f);
    const cur = open.shift();
    if (cur.c===ec && cur.r===er) {
      const path = []; let n = cur;
      while (n) { path.unshift({col:n.c,row:n.r}); n=n.parent; }
      return path.slice(1);
    }
    for (const [dc,dr] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nc=cur.c+dc, nr=cur.r+dr, ng=cur.g+1;
      if (!walkable(nc,nr) || ng>=(best[key(nc,nr)]??Infinity)) continue;
      best[key(nc,nr)] = ng;
      open.push({ c:nc, r:nr, g:ng, f:ng+h(nc,nr), parent:cur });
    }
  }
  return [];
}



// ── REAL-TIME CLOCK ───────────────────────────────────────────
// Each in-game period = 3 real minutes (7 periods = 21 min full day)
const PERIOD_REAL_SECONDS = 180;
let periodTimer = 0; // accumulates real seconds

// ── GAME LOOP ─────────────────────────────────────────────────
let last = 0;
function loop(ts) {
  const dt = Math.min((ts-last)/1000, 0.08); last=ts;

  if (marker) { marker.alpha-=dt*1.8; if(marker.alpha<=0)marker=null; }

  if (player.path.length) {
    const next = player.path[0];
    const tx=isoX(next.col,next.row), ty=isoY(next.col,next.row);
    const dx=tx-player.px, dy=ty-player.py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const step=MOVE_SPEED*dt;
    player.moving = true;
    player.direction = isoDirection(dx, dy);
    player.animTimer += dt;
    if (player.animTimer > 0.15) { player.animTimer=0; player.animFrame=(player.animFrame+1)%4; }
    if (dist<step) {
      player.px=tx; player.py=ty; player.col=next.col; player.row=next.row;
      player.path.shift();
      checkArrival();
    } else {
      player.px+=dx/dist*step; player.py+=dy/dist*step;
    }
  } else {
    player.moving = false;
    player.animFrame = 0;
  }

  // Real-time period advance
  periodTimer += dt;
  if (periodTimer >= PERIOD_REAL_SECONDS) {
    periodTimer -= PERIOD_REAL_SECONDS;
    advancePeriod();
    State.energy = Math.max(0, State.energy - 8);
    updateEnergyUI();
    checkEnergyWarnings();
    State.save();
  }

  // NPC wandering
  updateNPCWander(dt);
  moveNPCs(dt);

  // Show proximity pickup hints
  updateProximityItems();

  // Smooth camera
  const tx=W/2-player.px, ty=H/2-player.py-TH;
  offX+=(tx-offX)*0.08; offY+=(ty-offY)*0.08;

  render();
  requestAnimationFrame(loop);
}

// ── ARRIVAL CHECKS ────────────────────────────────────────────
function isAdjacent(c1, r1, c2, r2) {
  const dc = Math.abs(c1-c2), dr = Math.abs(r1-r2);
  return dc <= 1 && dr <= 1 && !(dc === 0 && dr === 0);
}

function checkArrival() {
  const c=player.col, r=player.row;

  // Check pending plot open
  if (pendingPlotOpen && !currentBuilding) {
    if (isAdjacent(c, r, 34, 22)) {
      pendingPlotOpen = false;
      openPlot();
      return;
    }
  }

  // Check pending door entry — fire when player is adjacent to the target building
  if (pendingDoorEntry && !currentBuilding) {
    const building = BUILDING_REGISTRY.find(b => b.id === pendingDoorEntry);
    if (building && isAdjacentToBuilding(building)) {
      const id = pendingDoorEntry;
      pendingDoorEntry = null;
      enterBuilding(id);
      return;
    }
  }

  // Check zone exits in village (golden EXIT tiles at path borders)
  if (!currentBuilding) {
    const zoneId = ZONE_EXIT_MAP?.[`${c},${r}`];
    if (zoneId) { loadScene(zoneId); return; }
  }

  // Check exits — player must step ON the exit tile
  currentExits.forEach(exit => {
    if (c === exit.col && r === exit.row) {
      if (exit.targetScene) loadScene(exit.targetScene, currentBuilding?.id, exit.fromZone);
      else if (exit.targetFloor) loadFloor(currentBuilding, exit.targetFloor);
    }
  });

  // Check stairs — player must step ON the stairs tile
  if (currentBuilding && currentMap[r]?.[c] === T.STAIRS) {
    const floors = currentBuilding.floors;
    const currentIdx = floors.findIndex(f => f.id === currentFloor.id);
    const nextIdx = currentIdx === 0 ? 1 : 0;
    if (floors[nextIdx]) {
      setTimeout(() => loadFloor(currentBuilding, floors[nextIdx].id), 200);
    }
  }
}

// ── PROXIMITY ITEMS ───────────────────────────────────────────
// Shows pickup hint when Kaida is adjacent to an item
function updateProximityItems() {
  if (!currentItems.length) return;
  // Check if any untaken item is adjacent to player
  const near = currentItems.find(item =>
    !item.taken &&
    Math.abs(item.col - player.col) <= 1 &&
    Math.abs(item.row - player.row) <= 1
  );
  const hint = document.getElementById('hint-badge');
  if (hint) {
    if (near) {
      const def = ITEMS[near.itemId];
      hint.textContent = `tap ${def?.emoji || '📦'} ${def?.name || 'item'} to pick up`;
      hint.style.opacity = '0.9';
    } else {
      hint.textContent = 'click to move · click buildings to enter · click villagers to talk';
      hint.style.opacity = '0.45';
    }
  }
}

// ── ITEM PICKUP ───────────────────────────────────────────────
function promptPickup(item) {
  const def = ITEMS[item.itemId];
  if (!def) return;
  if (item.taken) return;

  // Require adjacency
  if (Math.abs(item.col - player.col) > 1 || Math.abs(item.row - player.row) > 1) {
    // Path toward item instead
    player.path = astar(player.col, player.row, item.col, item.row);
    return;
  }

  // Check exile rules
  if (State.flags.exile_begun && currentBuilding && currentBuilding !== 'garden') {
    addNarrative('You can\'t take things from here anymore.', 'sys');
    return;
  }

  // Build the taken-key appropriate to where the item lives
  const currentZone = !currentBuilding && State.scene !== 'village' ? State.scene : null;
  let takenKey;
  if (currentZone) {
    const dayKey = `day_${State.day}`;
    takenKey = `zone_${currentZone}_${item.itemId}_${item.col}_${item.row}_${item.oneTime ? 'once' : dayKey}`;
  } else if (!currentBuilding && ITEMS[item.itemId]?.category === 'building') {
    takenKey = `village_${item.itemId}_${item.col}_${item.row}_day_${State.day}`;
  } else {
    takenKey = `${currentBuilding?.id||'village'}_${item.itemId}_${item.col}_${item.row}`;
  }
  if (State.takenItems.includes(takenKey)) return;

  // Add to inventory
  State.addItem(def);
  addNarrative(`You pick up ${def.emoji} ${def.name}.`, 'sys');

  // Mark taken immediately
  item.taken = true;

  // Persist if oneTime OR non-respawning
  if (item.oneTime || !item.respawn) {
    State.takenItems.push(takenKey);
  }

  // Story triggers
  if (item.itemId === 'garden_key') {
    addNarrative('A small iron key, tied with a bit of cord. What does it open?', 'sys');
    State.flags.found_garden_key = true;
  }
  if (item.itemId === 'knotted_cord') {
    addNarrative('An odd knotted cord. Decorative, maybe. You pocket it.', 'sys');
  }
  if (item.itemId === 'gallan_tools') {
    showDialogue(
      {emoji:'👨‍🔬', name:'Memory — Galen', portrait:PORTRAIT_GALEN},
      '"Kaida, come look at this. See how the root structure mirrors the bloom? Everything in nature has a logic, if you look close enough." He held it up to the light, eyes bright.'
    );
  }

  renderInventory();
  State.save();
}

// ── DIRECTION HELPER ──────────────────────────────────────────
// Convert screen-space dx/dy (isometric) to a cardinal direction name.
// In isometric view, moving right on screen = moving down-right on the map.
function isoDirection(dx, dy) {
  // Use the larger component to determine dominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

// ── TIME & ENERGY ─────────────────────────────────────────────
let actionTick = 0;

function tickAction(weight = 1) {
  const drain = weight * 2;
  State.energy = Math.max(0, State.energy - drain);
  actionTick += weight;
  if (actionTick >= TICKS_PER_PERIOD) {
    actionTick -= TICKS_PER_PERIOD;
    advancePeriod();
  }
  updateEnergyUI();
  checkEnergyWarnings();
  State.save();
}

function checkEnergyWarnings() {
  if (State.energy <= 0 && !State.sleptTonight) {
    showSleepWarning(true); // collapse
  } else if (State.energy <= 15 && State.period >= 5 && !State.sleptTonight && !State.warningShown) {
    State.warningShown = true;
    showSleepWarning(false); // passive notice
  } else if (State.energy <= 30 && !State.warningShown) {
    State.warningShown = true;
    addNarrative('You\'re getting tired. Think about eating something or finding somewhere to rest.', 'sys');
  }
}

function advancePeriod() {
  State.period++;
  if (State.period >= PERIODS.length) {
    State.period = 0;
    State.day++;
    State.sleptTonight = false;
    State.warningShown = false;
    State.napAvailable = true;
    State.energy       = Math.min(State.energy, 80);
    addNarrative(`A new day. Day ${State.day}.`, 'sleep');
    // Trigger day-specific story beats
    if (typeof checkStoryTriggers === 'function') checkStoryTriggers();
    if (State.day === 2 && typeof triggerGalenMorning === 'function') {
      setTimeout(triggerGalenMorning, 1500);
    }
  }
  const cap = PERIODS[State.period].energyCap;
  State.energy = Math.min(State.energy, cap);
  if (State.period === 4 && !State.sleptTonight)
    addNarrative('The light is fading. Think about where you\'ll sleep tonight.', 'sys');
  if (State.period === 6 && !State.sleptTonight)
    setTimeout(() => {
      // Only show if no overlays open
      const anyOpen =
        document.getElementById('dialogue-overlay').classList.contains('open') ||
        document.getElementById('craft-overlay').classList.contains('open');
      if (!anyOpen) showSleepWarning(false);
    }, 800);
  updateTimeUI();
  applyNPCSchedules(); // reposition/show/hide NPCs based on new period
  // Check for story events on period change
  if (typeof checkStoryTriggers === 'function') checkStoryTriggers();
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  // Assign canvas now that DOM is ready
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  const hasSave = State.load();
  buildVillageMap();
  initNPCPositions();

  if (hasSave && State.scene) {
    const savedScene = State.scene;
    const savedCol   = State.playerCol;
    const savedRow   = State.playerRow;

    if (savedScene === 'village') {
      loadScene('village');
    } else if (ZONES?.[savedScene]) {
      loadScene(savedScene);
    } else {
      // Building floor — find which building contains this floor id
      const building = Object.values(BUILDINGS).find(b => b.floors?.some(f => f.id === savedScene));
      if (building) {
        loadFloor(building, savedScene);
      } else {
        loadScene('village');
      }
    }

    // Restore exact position (load functions set a default spawn point)
    if (savedCol !== undefined && savedRow !== undefined) {
      player.col = savedCol;
      player.row = savedRow;
      player.px  = isoX(player.col, player.row);
      player.py  = isoY(player.col, player.row);
      snapCamera();
    }
  } else {
    loadScene('village');
  }

  // Starting inventory if fresh game
  if (State.inventory.length === 0) {
    State.addItem(ITEMS.herb_pouch || ITEMS.common_herb);
    State.addItem(ITEMS.ribbon     || ITEMS.cloth_scrap);
    State.addItem(ITEMS.grain);
  }

  initPanelState();
  initOverlayDismiss();
  resize();
  // ResizeObserver catches both window resize and panel collapse/expand
  new ResizeObserver(resize).observe(document.getElementById('canvas-wrap'));
  attachInputHandlers();
  renderInventory();
  renderWallet();
  renderQuestList();
  updateTimeUI();
  updateEnergyUI();

  addNarrative('The village is already busy. Someone is laughing near the well.');
  addNarrative('The bakery smells like warm bread and spiced rolls. A perfect morning.');

  requestAnimationFrame(loop);
}
