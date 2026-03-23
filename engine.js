
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
const isoX = (c,r) => (c - r) * (TW/2);
const isoY = (c,r) => (c + r) * (TH/2);
let offX = 0, offY = 0;
let zoomLevel = 1.0;

const toScreen = (c,r) => ({ x: isoX(c,r)+offX, y: isoY(c,r)+offY });
const toTile   = (sx,sy) => {
  const lx=sx/zoomLevel, ly=sy/zoomLevel;
  const wx=lx-offX, wy=ly-offY;
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

  // Smooth camera (account for zoom so player stays centred at all zoom levels)
  const tx=W/(2*zoomLevel)-player.px, ty=H/(2*zoomLevel)-player.py-TH/zoomLevel;
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
    const building = BUILDING_BOUNDS.find(b => b.id === pendingDoorEntry);
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

// ── NPC WANDERING ─────────────────────────────────────────────
// Each NPC has its own wander timer so they move independently
const NPC_WANDER_RADIUS = 3; // default tiles from home

function initNPCPositions() {
  // Store home positions and stagger each NPC's first move
  NPCS.forEach(npc => {
    npc.homeCol = npc.col;
    npc.homeRow = npc.row;
    npc.wanderPath = [];
    npc.wanderTimer = Math.random() * 20; // staggered start (0–20 s)
  });
}

// Apply period-based schedules: update home positions, filter out NPCs not active this period,
// and add any NPCs newly scheduled for this period.
function applyNPCSchedules() {
  if (currentBuilding || State.scene !== 'village') return;
  const p = State.period;

  // Update homes + remove NPCs whose schedule doesn't include this period
  currentNPCs = currentNPCs.filter(npc => {
    if (!npc.schedule) return true; // no schedule = always present
    const entry = npc.schedule.find(s => s.periods.includes(p));
    if (!entry) return false;
    npc.homeCol = entry.col;
    npc.homeRow = entry.row;
    npc.wanderRadius = entry.radius;
    npc.wanderPath = [];
    return true;
  });

  // Add NPCs that become active this period but aren't in the scene yet
  const presentIds = new Set(currentNPCs.map(n => n.id));
  for (const npc of NPCS) {
    if (!npc.schedule || npc.scene !== 'village' || npc.visible === false) continue;
    if (presentIds.has(npc.id)) continue;
    const entry = npc.schedule.find(s => s.periods.includes(p));
    if (!entry) continue;
    npc.homeCol = entry.col;
    npc.homeRow = entry.row;
    npc.wanderRadius = entry.radius;
    npc.col = entry.col;
    npc.row = entry.row;
    npc.wanderPath = [];
    npc.wanderTimer = Math.random() * 10; // stagger so new arrivals don't all move at once
    npc.px = undefined;
    npc.py = undefined;
    currentNPCs.push(npc);
  }
}

function updateNPCWander(dt) {
  if (currentBuilding) return;

  currentNPCs.forEach(npc => {
    if (npc.stationary) return;
    if (npc.wanderPath && npc.wanderPath.length > 0) return; // still moving

    // Count down this NPC's individual pause timer
    npc.wanderTimer = (npc.wanderTimer || 0) - dt;
    if (npc.wanderTimer > 0) return;

    // Pick a random nearby walkable tile within this NPC's radius
    const radius = npc.wanderRadius || NPC_WANDER_RADIUS;
    const candidates = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const tc = (npc.homeCol||npc.col) + dc;
        const tr = (npc.homeRow||npc.row) + dr;
        if (walkable(tc, tr) && !(tc===npc.col && tr===npc.row))
          candidates.push({col:tc, row:tr});
      }
    }
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    npc.wanderPath = astar(npc.col, npc.row, target.col, target.row).slice(0, 5);

    // Next pause: 8–22 s (varies per NPC so they stay out of sync)
    npc.wanderTimer = 8 + Math.random() * 14;
  });
}

function moveNPCs(dt) {
  if (currentBuilding) return;
  const step = 40 * dt; // slower than player

  currentNPCs.forEach(npc => {
    if (!npc.wanderPath || npc.wanderPath.length === 0) return;
    const next = npc.wanderPath[0];
    if (!next) { npc.wanderPath = []; return; }

    // Initialize pixel position if not set
    if (npc.px === undefined) {
      npc.px = isoX(npc.col, npc.row);
      npc.py = isoY(npc.col, npc.row);
    }

    const tx = isoX(next.col, next.row);
    const ty = isoY(next.col, next.row);
    const dx = tx - npc.px, dy = ty - npc.py;
    const dist = Math.sqrt(dx*dx + dy*dy);

    npc.moving = true;
    npc.direction = isoDirection(dx, dy);
    npc.animTimer = (npc.animTimer || 0) + step / 60;
    if (npc.animTimer > 0.15) { npc.animTimer=0; npc.animFrame=((npc.animFrame||0)+1)%4; }

    if (dist < step) {
      npc.px = tx; npc.py = ty;
      npc.col = next.col; npc.row = next.row;
      npc.wanderPath.shift();
    } else {
      npc.px += dx/dist * step;
      npc.py += dy/dist * step;
    }
  });
}
// Returns nearest walkable tile adjacent to target, or null
function getAdjacentWalkable(tc, tr) {
  const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
  // Sort by distance to player
  return dirs
    .map(([dc,dr]) => ({col:tc+dc, row:tr+dr}))
    .filter(p => walkable(p.col, p.row))
    .sort((a,b) => {
      const da = Math.abs(a.col-player.col)+Math.abs(a.row-player.row);
      const db = Math.abs(b.col-player.col)+Math.abs(b.row-player.row);
      return da-db;
    })[0] || null;
}

// Pending door entry — set when player clicks a door they're not yet adjacent to
let pendingDoorEntry = null;
let pendingPlotOpen  = false;

function checkPendingDoor() {
  const id = pendingDoorEntry;
  pendingDoorEntry = null;
  enterBuilding(id);
}


// ── NPC TALK ──────────────────────────────────────────────────
function talkTo(npc) {

  const idx = State.npcDialogueIndex[npc.id] || 0;
  const lineData = npc.lines[idx % npc.lines.length];
  let line    = typeof lineData === 'object' && lineData !== null ? lineData.text : lineData;
  let lineReplies = typeof lineData === 'object' && lineData !== null ? (lineData.replies || []) : null;
  // Always advance index, wrapping safely
  State.npcDialogueIndex[npc.id] = (idx + 1) % npc.lines.length;

  // Check quest completion first — show Give button
  const completable = checkQuestCompletion(npc.id);
  if (completable) {
    const item = ITEMS[completable.itemId];
    showDialogue(npc, line, [{
      label: `Give ${item?.emoji || ''} ${completable.itemId.replace(/_/g,' ')}`,
      onClick: () => {
        const result = completeQuest(completable.id);
        if (result) {
          addNarrative(result, 'sys');
          renderInventory(); renderWallet(); renderQuestList();
          tickActionSafe(3);
          State.save();
        }
      }
    }]);
    tickActionSafe(1);
    State.save();
    return;
  }

  // Check if should offer quest — show Accept button
  if (canOfferQuest(npc)) {
    const q = npc.quest;
    showDialogue(npc, q.line, [{
      label: `Accept: ${q.itemName}`,
      onClick: () => {
        offerQuest(npc);
        addNarrative(`↳ ${npc.name} has a task for you.`, 'sys');
        renderQuestList();
        State.raiseGoodwill(npc.id);
        tickActionSafe(2);
        State.save();
      }
    }]);
    tickActionSafe(1);
    State.save();
    return;
  }

  // Check recipe teaching
  if (npc.teachesAt) {
    const gw = State.goodwill[npc.id] || 0;
    if (gw >= npc.teachesAt.goodwill) {
      npc.teachesAt.recipes.forEach(rid => {
        if (State.learnRecipe(rid)) {
          const r = RECIPES[rid];
          addNarrative(`↳ You learned to make ${r.emoji} ${r.name}!`, 'alert');
        }
      });
      if (npc.teachesAt.line && !State.flags[`taught_${npc.id}`]) {
        State.flags[`taught_${npc.id}`] = true;
        line = npc.teachesAt.line;
      }
    }
  }

  // Build Kaida reply actions (per-line or NPC's general replies)
  let replyActions = [];
  if (lineReplies && lineReplies.length) {
    replyActions = lineReplies.map(r => ({ label: r.label, onClick: () => {} }));
  } else if (npc.generalReplies) {
    replyActions = npc.generalReplies.map(r => ({ label: r, onClick: () => {} }));
  }
  // If NPC runs a shop, append a "Browse wares" action
  if (npc.shop) {
    replyActions.push({ label:'Browse wares 🛒', onClick: () => openNPCShop(npc.shop) });
  }


  showDialogue(npc, line, replyActions);
  addNarrative(`You spoke with ${npc.name}.`);
  State.raiseGoodwill(npc.id);

  // Story flags
  if ((npc.id==='sera'||npc.id==='blacksmith') && !State.flags.knows_father_missing) {
    State.flags.knows_father_missing = true;
    setTimeout(()=>addNarrative('↳ Something nags at you. Where is your father?','sys'),600);
  }

  // Jaxon reveals the plot on the 4th conversation (line index 3)
  if (npc.id==='jaxon' && !State.flags.jaxon_proposed &&
      (State.npcDialogueIndex["jaxon"] || 0) >= 4) {
    State.flags.jaxon_proposed = true;
    if (State.plot) State.plot.unlocked = true;
    addNarrative("↳ Jaxon leads you to a quiet spot near the east elm. The plot is just right.", 'alert');
    addNarrative('↳ The plot is marked on the east edge of the village. Bring materials and chits there to start building.', 'sys');
    updateTimeUI();
  }

  tickActionSafe(3);
  State.save();
}

// tickActionSafe — like tickAction but never triggers sleep modal
// while dialogue or other overlays are open. Defers the warning instead.
function tickActionSafe(weight) {
  const drain = weight * 2;
  State.energy = Math.max(0, State.energy - drain);

  actionTick += weight;
  if (actionTick >= TICKS_PER_PERIOD) {
    actionTick -= TICKS_PER_PERIOD;
    advancePeriod();
  }

  updateEnergyUI();

  // Only show sleep warning if nothing else is open
  const anyOpen =
    document.getElementById('dialogue-overlay').classList.contains('open') ||
    document.getElementById('craft-overlay').classList.contains('open') ||
    document.getElementById('market-overlay').classList.contains('open');

  if (!anyOpen) {
    checkEnergyWarnings();
  }
  // If something is open, the warning will trigger on next tickAction instead

  State.save();
}

// ── CABINET ───────────────────────────────────────────────────
function interactCabinet() {
  if (!currentCabinet) return;
  if (!State.flags.cabinet_unlocked) {
    if (!State.hasItem('garden_key')) {
      addNarrative('The cabinet is locked. There must be a key somewhere.', 'sys');
    } else {
      State.flags.cabinet_unlocked = true;
      State.removeItem('garden_key');
      addNarrative('The small key fits. The cabinet swings open.', 'sys');
      addNarrative('Inside: carefully arranged herb bundles. Each one a formula, preserved without words.', 'sys');
      // Grant cabinet items and recipes
      currentCabinet.items.forEach(ci => {
        const def = ITEMS[ci.itemId];
        if (def) { State.addItem(def); addNarrative(`↳ You find ${def.emoji} ${def.name}. ${ci.label}`, 'sys'); }
      });
      currentCabinet.recipesUnlocked.forEach(rid => {
        if (State.learnRecipe(rid)) {
          const r = RECIPES[rid];
          addNarrative(`↳ From the bundles, you work out how to make ${r.emoji} ${r.name}.`, 'alert');
        }
      });
      renderInventory(); State.save();
    }
  } else {
    addNarrative("The cabinet is open. His herbs are still here, carefully sorted.", 'sys');
  }
  tickAction(2);
}

// ── SCENE MANAGEMENT ──────────────────────────────────────────
function loadScene(sceneId, fromBuildingId, fromZone) {
  pendingDoorEntry = null;
  clearNarrative();
  if (sceneId !== 'village' && ZONES?.[sceneId]) {
    // ── Load an outdoor zone ───────────────────────────────────
    const zone = ZONES[sceneId];
    currentBuilding  = null;
    currentFloor     = null;
    currentCabinet   = null;
    currentMap       = zone.grid;
    mapRows          = zone.grid.length;
    mapCols          = zone.grid[0].length;
    currentNPCs      = zone.npcs || [];
    currentStations  = zone.stations || [];
    currentFurniture = [];
    currentExits     = zone.exits || [];

    // Zone items respawn daily
    const dayKey = `day_${State.day}`;
    currentItems = (zone.items || []).map(item => {
      const takenKey = `zone_${sceneId}_${item.itemId}_${item.col}_${item.row}_${item.oneTime ? 'once' : dayKey}`;
      return { ...item, taken: State.takenItems.includes(takenKey) };
    });

    // Place player at the entry point (opposite edge from the exit)
    const entryPos = { forest:{col:28,row:10}, garden:{col:10,row:24},
                       temple_path:{col:13,row:2}, market:{col:3,row:10} };
    const pos = entryPos[sceneId] || { col:Math.floor(mapCols/2), row:Math.floor(mapRows/2) };
    player.col=pos.col; player.row=pos.row;
    player.px=isoX(player.col,player.row); player.py=isoY(player.col,player.row);
    player.path=[];

    updateSceneLabel(zone.name);
    State.scene = sceneId; State.save();
    const arrivals = { forest:'The trees close in around you.',
                       garden:'The air is cool and herb-sweet.',
                       temple_path:'The ancient road stretches ahead.',
                       market:'Voices and colour fill the square.' };
    addNarrative(arrivals[sceneId] || `You arrive at ${zone.name}.`, 'sys');
    updateSleepButton();
    updateLeaveButton();

    // Show transition art for zones that have an image
    if (BUILDING_ART[sceneId]) {
      document.getElementById('rt-art').innerHTML  = BUILDING_ART[sceneId];
      document.getElementById('rt-name').textContent = zone.name;
      document.getElementById('rt-sub').textContent  = arrivals[sceneId] || '';
      const rt = document.getElementById('room-transition');
      rt.classList.add('show');
      pendingBuilding = null;
      setTimeout(() => rt.classList.remove('show'), 2200);
    }
    return;
  }
  if (sceneId === 'village') {
    currentBuilding = null;
    currentFloor    = null;
    currentCabinet  = null;
    currentMap      = villageMap;
    mapCols         = VILLAGE_COLS;
    mapRows         = VILLAGE_ROWS;
    currentNPCs     = NPCS.filter(n => n.scene==='village' && (n.visible!==false || State.flags.harvest_festival));
    applyNPCSchedules();
    currentStations = [];
    currentExits    = [];

    // Village items: forest edge materials (respawn each day)
    const dayKey = `day_${State.day}`;
    currentItems = FOREST_EDGE_ITEMS.map(item => {
      const takenKey = `village_${item.itemId}_${item.col}_${item.row}_${dayKey}`;
      return { ...item, taken: State.takenItems.includes(takenKey) };
    });

    // Place player at the zone exit they came from, or the building door, or default
    if (fromZone) {
      const zoneReturn = { forest:{col:2,row:19}, garden:{col:19,row:2},
                           temple_path:{col:19,row:37}, market:{col:37,row:19} };
      const pos = zoneReturn[fromZone] || { col:20, row:23 };
      player.col=pos.col; player.row=pos.row;
    } else if (fromBuildingId) {
      const doorEntry = Object.entries(DOOR_MAP).find(([_k,v]) => v === fromBuildingId);
      if (doorEntry) {
        const [dc, dr] = doorEntry[0].split(',').map(Number);
        player.col = dc; player.row = dr + 1;
      } else {
        player.col=20; player.row=23;
      }
    } else {
      player.col=20; player.row=23;
    }
    player.px=isoX(player.col,player.row);
    player.py=isoY(player.col,player.row);
    player.path=[];
    updateSceneLabel('The Village');
    State.scene='village'; State.save();
    addNarrative('You step outside.','sys');
    updateSleepButton();
    updateLeaveButton();

    // Check story triggers on scene change
    if (typeof checkStoryTriggers === 'function') checkStoryTriggers();

    // Unlock plot tile once Jaxon has proposed
    if (State.flags.jaxon_proposed && State.plot) {
      State.plot.unlocked = true;
    }
  }
}

// ── ROOM TRANSITION ───────────────────────────────────────────
const BUILDING_ART = {
  market: `<img src="images/buildings/market_day.jpeg" style="width:100%;height:100%;object-fit:cover">`,

  bakery: `<img src="images/buildings/bakery.jpg" style="width:100%;height:100%;object-fit:cover">`,

  bakery_upper: `<img src="images/buildings/bakery_upper.jpg" style="width:100%;height:100%;object-fit:cover">`,

  inn: `<img src="images/buildings/inn.jpeg" style="width:100%;height:100%;object-fit:cover">`,

  forge: `<img src="images/buildings/forge.jpg" style="width:100%;height:100%;object-fit:cover">`,

  town_hall: `<img src="images/buildings/town_hall.jpg" style="width:100%;height:100%;object-fit:cover">`,

  jaxons_house:     `<img src="images/buildings/house_large.jpg"     style="width:100%;height:100%;object-fit:cover">`,

  villager_house_a: `<img src="images/buildings/house_cottage.jpg"   style="width:100%;height:100%;object-fit:cover">`,
  villager_house_b: `<img src="images/buildings/house_dark_roof.jpg" style="width:100%;height:100%;object-fit:cover">`,
  villager_house_c: `<img src="images/buildings/house_simple.jpg"    style="width:100%;height:100%;object-fit:cover">`,

  hestas_hut: `<img src="images/buildings/hestas_hut.jpg" style="width:100%;height:100%;object-fit:cover">`,

  default: `<img src="images/buildings/default.jpg" style="width:100%;height:100%;object-fit:cover">`,
};

// Map building IDs and floor IDs to art keys
function getArtKey(buildingId, floorId) {
  if (floorId === 'bakery_upper') return 'bakery_upper';
  return buildingId in BUILDING_ART ? buildingId : 'default';
}

// Pending building load — set during transition, committed on click/timeout
let pendingBuilding = null;

function enterBuilding(buildingId) {
  const building = BUILDINGS[buildingId];
  if (!building) return;

  pendingDoorEntry = null;

  if (State.flags.exile_begun && buildingId !== 'hestas_hut') {
    addNarrative('The door is closed to you now.', 'alert');
    return;
  }

  // Show transition screen
  const floor   = building.floors[0];
  const artKey  = getArtKey(buildingId, floor.id);
  const artHTML = BUILDING_ART[artKey] || BUILDING_ART.default;

  document.getElementById('rt-art').innerHTML  = artHTML;
  document.getElementById('rt-name').textContent = building.name;
  document.getElementById('rt-sub').textContent  = floor.name !== building.name ? floor.name : '';

  const rt = document.getElementById('room-transition');
  rt.classList.add('show');

  pendingBuilding = { building, floorId: floor.id };

  // Auto-advance after 2.5s
  clearTimeout(window._rtTimer);
  window._rtTimer = setTimeout(commitEnterBuilding, 2500);

  tickAction(2);
}

function commitEnterBuilding() {
  clearTimeout(window._rtTimer);
  if (!pendingBuilding) return;

  const { building, floorId } = pendingBuilding;
  pendingBuilding = null;

  // Fade out transition
  const rt = document.getElementById('room-transition');
  rt.classList.remove('show');

  setTimeout(() => {
    loadFloor(building, floorId);
    addNarrative(`You enter ${building.name}.`, 'sys');
  }, 420); // wait for fade
}

function loadFloor(building, floorId) {
  const floor = building.floors.find(f => f.id === floorId);
  if (!floor) return;

  currentBuilding = building;
  currentFloor    = floor;
  currentMap      = floor.grid;
  mapRows         = floor.grid.length;
  mapCols         = floor.grid[0].length;  // actual width, may differ from rows
  currentNPCs = (floor.npcs || []).map(entry => {
    const id  = typeof entry === 'string' ? entry : entry.id;
    const npc = NPCS.find(n => n.id === id);
    if (!npc) return null;
    if (typeof entry === 'object' && (entry.col !== undefined || entry.row !== undefined)) {
      return { ...npc, col: entry.col ?? npc.col, row: entry.row ?? npc.row };
    }
    return npc;
  }).filter(Boolean);
  currentCabinet  = floor.cabinet || null;

  // Build item list, respecting taken items
  currentItems = (floor.items || []).map(item => {
    const takenKey = `${building.id}_${item.itemId}_${item.col}_${item.row}`;
    const isTaken = State.takenItems.includes(takenKey);
    return { ...item, taken: isTaken };
  });

  currentStations  = floor.stations  || [];
  currentFurniture = floor.furniture || [];
  currentExits     = floor.exits     || [];

  // Place player just inside the door (1 tile above the exit row)
  player.col = Math.floor(mapCols/2);
  player.row = mapRows - 2;
  player.px  = isoX(player.col, player.row);
  player.py  = isoY(player.col, player.row);
  player.path = [];

  updateSceneLabel(floor.name);
  State.scene = floorId; State.save();
  updateSleepButton();
  updateLeaveButton();
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

// ── WORLD MAP ─────────────────────────────────────────────────
// Maps door tile positions to building IDs
// Matches placeBuilding(r,c,h,w) — door at row r+h-1, col c+floor(w/2)
const DOOR_MAP = {
  '6,9':   'bakery',
  '28,8':  'forge',
  '35,9':  'inn',
  '20,15': 'town_hall',
  '29,26': 'council_hall',
  '6,35':  'hestas_hut',
  '12,29': 'jaxons_house',
  '24,31': 'villager_house_a',
  '30,15': 'villager_house_b',
  '16,35': 'villager_house_c',
};

// Building footprints for click-to-enter — any click on a wall/building/door tile
// triggers entry if player is adjacent. Maps each building's tile range.
const BUILDING_BOUNDS = [
  { id:'bakery',          rMin:4,  rMax:9,  cMin:3,  cMax:8  },
  { id:'forge',           rMin:4,  rMax:8,  cMin:25, cMax:30 },
  { id:'inn',             rMin:4,  rMax:9,  cMin:32, cMax:37 },
  { id:'town_hall',       rMin:10, rMax:15, cMin:15, cMax:24 },
  { id:'council_hall',    rMin:22, rMax:26, cMin:26, cMax:31 },
  { id:'hestas_hut',      rMin:31, rMax:35, cMin:4,  cMax:8  },
  { id:'jaxons_house',    rMin:25, rMax:29, cMin:10, cMax:14 },
  { id:'villager_house_a',rMin:28, rMax:31, cMin:22, cMax:25 },
  { id:'villager_house_b',rMin:12, rMax:15, cMin:28, cMax:31 },
  { id:'villager_house_c',rMin:32, rMax:35, cMin:14, cMax:17 },
];

function getBuildingAtTile(col, row) {
  return BUILDING_BOUNDS.find(b =>
    row >= b.rMin && row <= b.rMax &&
    col >= b.cMin && col <= b.cMax
  ) || null;
}

function isAdjacentToBuilding(building) {
  // Check if player is adjacent to the building's door tile
  const doorKey = Object.entries(DOOR_MAP).find(([_k,v]) => v === building.id);
  if (!doorKey) return false;
  const [dc, dr] = doorKey[0].split(',').map(Number);
  return Math.abs(player.col - dc) <= 1 && Math.abs(player.row - dr) <= 1;
}

function getDoorBuilding(col, row) {
  return DOOR_MAP[`${col},${row}`] || null;
}

function toggleWorldMap() {
  document.getElementById('worldmap-overlay').classList.toggle('open');
}
function travelTo(zone) {
  if (zone === 'village') { toggleWorldMap(); loadScene('village'); }
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
