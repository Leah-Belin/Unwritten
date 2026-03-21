
// ── CANVAS ────────────────────────────────────────────────────
let canvas, ctx;
let W = 0, H = 0;

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  W = canvas.width  = wrap.clientWidth;
  H = canvas.height = wrap.clientHeight;
}

// ── PORTRAIT DATA
const PORTRAIT_KAIDA  = 'images/portraits/kaida.jpg';
const PORTRAIT_GALLAN = 'images/portraits/gallan.jpg';

// ── ISO MATH ──────────────────────────────────────────────────
const TW = 64, TH = 32;
const isoX = (c,r) => (c - r) * (TW/2);
const isoY = (c,r) => (c + r) * (TH/2);
let offX = 0, offY = 0;

const toScreen = (c,r) => ({ x: isoX(c,r)+offX, y: isoY(c,r)+offY });
const toTile   = (sx,sy) => {
  const wx=sx-offX, wy=sy-offY;
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
};

const MOVE_SPEED = 90;
const TICKS_PER_PERIOD = 200; // 200 actions per period = ~1400 actions per full day (very slow, real-time feel)

// ── SCENE STATE ───────────────────────────────────────────────
let currentMap  = null;   // 2D tile array
let currentNPCs = [];     // NPC objects visible in this scene
let currentItems = [];    // Interactable items on map { itemId, col, row, label, oneTime, taken }
let currentStations = []; // Crafting stations { type, col, row, label }
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

// ── DRAWING ───────────────────────────────────────────────────
function drawTile(c, r) {
  const def = TILE_DEF[currentMap[r]?.[c]];
  if (!def) return;
  const {x,y} = toScreen(c,r);
  if (x<-TW||x>W+TW||y<-TH*3||y>H+TH*2) return;
  const hw=TW/2, hh=TH/2;

  // Top diamond (flat tiles only — raised tiles draw their own top)
  if (!def.raised) {
    ctx.beginPath();
    ctx.moveTo(x,y-hh); ctx.lineTo(x+hw,y); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
    ctx.closePath(); ctx.fillStyle=def.top; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.5; ctx.stroke();
  }

  if (def.plot) {
    // Draw stake marker — only visible after jaxon_proposed
    if (State.flags.jaxon_proposed) {
      // Peg/stake
      ctx.fillStyle='#5a3810';
      ctx.fillRect(x-2, y-20, 4, 20);
      // Small crosspiece
      ctx.fillRect(x-6, y-18, 12, 3);
      // Glow ring on ground
      ctx.beginPath(); ctx.ellipse(x, y+2, 14, 6, 0, 0, Math.PI*2);
      ctx.strokeStyle='rgba(200,160,40,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      // Label
      ctx.font='8px Caveat,cursive'; ctx.fillStyle='#f0e0a0';
      ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
      ctx.textAlign='center'; ctx.fillText('🏡 Our plot', x, y-24);
      ctx.shadowBlur=0;
    }
    return;
  }
  if (def.stairs) {
    // Draw stair steps
    ctx.fillStyle='#a08858';
    for(let i=0;i<3;i++){
      ctx.fillRect(x-10+(i*4), y-hh+(i*4), 20-(i*4), 4);
    }
    ctx.font='10px serif'; ctx.textAlign='center';
    ctx.fillText('🪜', x, y+4);
    return;
  }
  if (def.flower) {
    ctx.font='9px serif'; ctx.textAlign='center';
    ctx.fillText(['✿','❀','✾'][((c*7+r*3)%3)], x, y+3);
    return;
  }
  if (def.tree) {
    ctx.fillStyle='#5a4028'; ctx.fillRect(x-3,y-4,6,12);
    for (const [ox,oy,rx,ry,col] of [
      [0,-26,18,14,'#5a7830'],[0,-32,13,10,'#6a8840'],[0,-38,8,7,'#7a9848']
    ]) {
      ctx.beginPath(); ctx.ellipse(x+ox,y+oy,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5; ctx.stroke();
    }
    return;
  }
  if (def.raised) {
    const bh = def.raised;
    // Left face — goes UP from bottom-left diamond corner
    ctx.beginPath();
    ctx.moveTo(x-hw, y-bh);
    ctx.lineTo(x,    y+hh-bh);
    ctx.lineTo(x,    y+hh);
    ctx.lineTo(x-hw, y);
    ctx.closePath(); ctx.fillStyle=def.left; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8; ctx.stroke();
    // Right face
    ctx.beginPath();
    ctx.moveTo(x+hw, y-bh);
    ctx.lineTo(x,    y+hh-bh);
    ctx.lineTo(x,    y+hh);
    ctx.lineTo(x+hw, y);
    ctx.closePath(); ctx.fillStyle=def.right; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8; ctx.stroke();
    // Top face (shifted up by bh)
    ctx.beginPath();
    ctx.moveTo(x,    y-hh-bh);
    ctx.lineTo(x+hw, y-bh);
    ctx.lineTo(x,    y+hh-bh);
    ctx.lineTo(x-hw, y-bh);
    ctx.closePath(); ctx.fillStyle=def.top; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.6; ctx.stroke();
  }
}

function drawSprite(x, y, emoji, label, bodyColor, isPlayer) {
  // Sprite sits ON the tile surface — base at top vertex of diamond, body above
  const base = y - TH/2;                  // feet at tile top vertex (not centre)
  const radius = isPlayer ? 14 : 12;
  const centre = base - radius;            // circle centre above tile

  // Shadow on tile surface
  ctx.beginPath(); ctx.ellipse(x, base+2, isPlayer?13:11, 5, 0, 0, Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fill();
  // Body circle
  ctx.beginPath(); ctx.arc(x, centre, radius, 0, Math.PI*2);
  ctx.fillStyle=bodyColor; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.2; ctx.stroke();
  // Face emoji
  ctx.font=`${isPlayer?15:13}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(emoji, x, centre);
  ctx.textBaseline='alphabetic';
  // Name label
  ctx.font=`${isPlayer?'bold ':''}9px Caveat,cursive`;
  ctx.fillStyle=isPlayer?'#ffe8c0':'#f0e8d5';
  ctx.shadowColor='rgba(0,0,0,0.95)'; ctx.shadowBlur=5;
  ctx.fillText(label, x, centre-radius-4);
  ctx.shadowBlur=0;
}

function drawItem(item) {
  if (item.taken) return;
  const {x,y} = toScreen(item.col, item.row);
  ctx.font='16px serif'; ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
  ctx.fillText(ITEMS[item.itemId]?.emoji || '📦', x, y);
  ctx.shadowBlur=0;
  // Subtle glow ring
  ctx.beginPath(); ctx.ellipse(x,y+4,12,5,0,0,Math.PI*2);
  ctx.strokeStyle='rgba(220,180,80,0.4)'; ctx.lineWidth=1; ctx.stroke();
}

function drawStation(station) {
  const {x,y} = toScreen(station.col, station.row);
  ctx.font='18px serif'; ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
  ctx.fillText(STATION_TYPES[station.type]?.emoji || '⚙️', x, y-8);
  ctx.shadowBlur=0;
  ctx.font='8px Caveat,cursive'; ctx.fillStyle='#f0e8d5';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText(station.label, x, y+6); ctx.shadowBlur=0;
}

function drawCabinet(cabinet) {
  if (!cabinet) return;
  const {x,y} = toScreen(cabinet.col, cabinet.row);
  const unlocked = State.flags.cabinet_unlocked;
  ctx.font='18px serif'; ctx.textAlign='center';
  ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
  ctx.fillText(unlocked ? '🗄️' : '🔒', x, y-8);
  ctx.shadowBlur=0;
  ctx.font='8px Caveat,cursive'; ctx.fillStyle='#f0e8d5';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText(unlocked ? cabinet.unlockedLabel : cabinet.lockedLabel, x, y+6);
  ctx.shadowBlur=0;
}

let marker = null;

function drawMarker() {
  if (!marker) return;
  const {col,row,alpha} = marker;
  const {x,y} = toScreen(col,row);
  ctx.save(); ctx.globalAlpha=alpha*0.8;
  ctx.beginPath();
  ctx.moveTo(x,y-TH/2); ctx.lineTo(x+TW/2,y); ctx.lineTo(x,y+TH/2); ctx.lineTo(x-TW/2,y);
  ctx.closePath(); ctx.strokeStyle='#d4a040'; ctx.lineWidth=2; ctx.stroke();
  ctx.restore();
}

function render() {
  const p = PERIODS[State.period];
  const sky = ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0, p.sky1); sky.addColorStop(1, p.sky2);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

  // Collect and sort drawables (painter's algorithm)
  // Raised tiles (walls/buildings) get a small z boost so they overdraw correctly
  const items = [];
  for (let r=0; r<mapRows; r++)
    for (let c=0; c<mapCols; c++) {
      const def = TILE_DEF[currentMap[r]?.[c]];
      const raised = def?.raised ? 0.4 : 0;
      items.push({k:'tile',c,r, z:r+c+raised});
    }

  currentItems.forEach(item => {
    if (!item.taken) items.push({k:'item',item,z:item.row+item.col+0.5});
  });
  currentStations.forEach(st => items.push({k:'station',st,z:st.row+st.col+0.6}));
  if (currentCabinet) items.push({k:'cabinet',z:currentCabinet.row+currentCabinet.col+0.6});
  currentNPCs.forEach(n => items.push({k:'npc',n,z:n.row+n.col+0.8}));
  items.push({k:'player',z:player.row+player.col+0.8});
  items.sort((a,b) => a.z-b.z);

  ctx.textAlign='center';
  for (const d of items) {
    if      (d.k==='tile')    drawTile(d.c,d.r);
    else if (d.k==='item')    drawItem(d.item);
    else if (d.k==='station') drawStation(d.st);
    else if (d.k==='cabinet') drawCabinet(currentCabinet);
    else if (d.k==='npc') {
      const n = d.n;
      // Use pixel position if NPC is wandering, else tile position
      const nx = (n.px !== undefined ? n.px : isoX(n.col,n.row)) + offX;
      const ny = (n.py !== undefined ? n.py : isoY(n.col,n.row)) + offY;
      drawSprite(nx, ny, n.emoji, n.name, n.color, false);
    }
    else if (d.k==='player')  drawSprite(player.px+offX,player.py+offY,'👧','Kaida',player.color,true);
  }

  drawMarker();

  // Time tint
  ctx.fillStyle=p.tint; ctx.fillRect(0,0,W,H);

  // Vignette
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.8);
  vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.45)');
  ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

  // Interior: dim border to signal enclosed space
  if (currentBuilding) {
    ctx.strokeStyle='rgba(139,111,71,0.3)';
    ctx.lineWidth=8; ctx.strokeRect(4,4,W-8,H-8);
  }
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
    if (dist<step) {
      player.px=tx; player.py=ty; player.col=next.col; player.row=next.row;
      player.path.shift();
      checkArrival();
    } else {
      player.px+=dx/dist*step; player.py+=dy/dist*step;
    }
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
    const building = BUILDING_BOUNDS.find(b => b.id === pendingDoorEntry);
    if (building && isAdjacentToBuilding(building)) {
      const id = pendingDoorEntry;
      pendingDoorEntry = null;
      enterBuilding(id);
      return;
    }
  }

  // Check exits — player must step ON the exit tile
  currentExits.forEach(exit => {
    if (c === exit.col && r === exit.row) {
      if (exit.targetScene) loadScene(exit.targetScene, currentBuilding?.id);
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

  // Key includes day for respawning forest items
  const isForest = ITEMS[item.itemId]?.category === 'building' && !currentBuilding;
  const takenKey = isForest
    ? `village_${item.itemId}_${item.col}_${item.row}_day_${State.day}`
    : `${currentBuilding?.id||'village'}_${item.itemId}_${item.col}_${item.row}`;
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
      {emoji:'👨‍🔬', name:'Memory — Gallan', portrait:PORTRAIT_GALLAN},
      '"Kaida, come look at this. See how the root structure mirrors the bloom? Everything in nature has a logic, if you look close enough." He held it up to the light, eyes bright.'
    );
  }

  renderInventory();
  State.save();
}

// ── NPC WANDERING ─────────────────────────────────────────────
// NPCs wander near their home position every ~30 seconds
const NPC_WANDER_INTERVAL = 30; // seconds between wander steps
const NPC_WANDER_RADIUS   = 3;  // tiles from home
let npcWanderTimer = 0;

function initNPCPositions() {
  // Store home positions
  NPCS.forEach(npc => {
    npc.homeCol = npc.col;
    npc.homeRow = npc.row;
    npc.wanderPath = [];
  });
}

function updateNPCWander(dt) {
  if (currentBuilding) return; // NPCs don't wander inside buildings
  npcWanderTimer += dt;
  if (npcWanderTimer < NPC_WANDER_INTERVAL) return;
  npcWanderTimer = 0;

  currentNPCs.forEach(npc => {
    if (npc.wanderPath && npc.wanderPath.length > 0) return; // already moving

    // Pick a random nearby walkable tile within radius of home
    const candidates = [];
    for (let dr = -NPC_WANDER_RADIUS; dr <= NPC_WANDER_RADIUS; dr++) {
      for (let dc = -NPC_WANDER_RADIUS; dc <= NPC_WANDER_RADIUS; dc++) {
        const tc = (npc.homeCol||npc.col) + dc;
        const tr = (npc.homeRow||npc.row) + dr;
        if (walkable(tc, tr) && !(tc===npc.col && tr===npc.row))
          candidates.push({col:tc, row:tr});
      }
    }
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    // Short A* path for NPC
    npc.wanderPath = astar(npc.col, npc.row, target.col, target.row).slice(0, 4);
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

// ── INPUT ─────────────────────────────────────────────────────
// Attached in init() after canvas exists
function attachInputHandlers() {
  canvas.addEventListener('click', e => {
    if (document.getElementById('dialogue-overlay').classList.contains('open')) { closeDialogue(); return; }
    if (document.getElementById('craft-overlay').classList.contains('open')) return;
    if (document.getElementById('event-overlay').classList.contains('open')) return;

    const rect=canvas.getBoundingClientRect();
    const sx=e.clientX-rect.left, sy=e.clientY-rect.top;
    const{col:clickCol, row:clickRow}=toTile(sx,sy);

    // ── NPC click — must be adjacent to talk ──────────────────
    for (const npc of currentNPCs) {
      const nx = (npc.px !== undefined ? npc.px : isoX(npc.col,npc.row)) + offX;
      const ny = (npc.py !== undefined ? npc.py : isoY(npc.col,npc.row)) + offY;
      const by = ny - TH/2 - 12; // matches sprite circle centre in drawSprite
      if ((sx-nx)**2+(sy-by)**2 < 30**2) {
        if (isAdjacent(player.col, player.row, npc.col, npc.row)) {
          talkTo(npc);
        } else {
          // Walk toward NPC
          const adj = getAdjacentWalkable(npc.col, npc.row);
          if (adj) player.path = astar(player.col, player.row, adj.col, adj.row);
        }
        return;
      }
    }

    // ── Item click — must be adjacent to pick up ──────────────
    for (const item of currentItems) {
      if (item.taken) continue;
      const{x,y}=toScreen(item.col,item.row);
      if (Math.abs(sx-x)<24 && Math.abs(sy-y)<24) {
        if (isAdjacent(player.col, player.row, item.col, item.row)) {
          promptPickup(item);
        } else {
          const adj = getAdjacentWalkable(item.col, item.row);
          if (adj) player.path = astar(player.col, player.row, adj.col, adj.row);
        }
        return;
      }
    }

    // ── Station click — must be adjacent ─────────────────────
    for (const st of currentStations) {
      const{x,y}=toScreen(st.col,st.row);
      if (Math.abs(sx-x)<30 && Math.abs(sy-y)<30) {
        if (isAdjacent(player.col, player.row, st.col, st.row)) {
          showCraftingMenu(st.type, st.label);
        } else {
          const adj = getAdjacentWalkable(st.col, st.row);
          if (adj) player.path = astar(player.col, player.row, adj.col, adj.row);
        }
        return;
      }
    }

    // ── Cabinet click — must be adjacent ─────────────────────
    if (currentCabinet) {
      const{x,y}=toScreen(currentCabinet.col,currentCabinet.row);
      if (Math.abs(sx-x)<30 && Math.abs(sy-y)<30) {
        if (isAdjacent(player.col, player.row, currentCabinet.col, currentCabinet.row)) {
          interactCabinet();
        } else {
          const adj = getAdjacentWalkable(currentCabinet.col, currentCabinet.row);
          if (adj) player.path = astar(player.col, player.row, adj.col, adj.row);
        }
        return;
      }
    }

    // ── Plot tile click ───────────────────────────────────────
    if (!currentBuilding && State.flags.jaxon_proposed) {
      if (clickCol>=0 && clickRow>=0 && clickCol<mapCols && clickRow<mapRows) {
        if (currentMap[clickRow]?.[clickCol] === T.PLOT) {
          if (isAdjacent(player.col, player.row, clickCol, clickRow)) {
            openPlot();
          } else {
            const adj = getAdjacentWalkable(clickCol, clickRow);
            if (adj) { player.path = astar(player.col, player.row, adj.col, adj.row); pendingPlotOpen = true; }
          }
          return;
        }
      }
    }
    if (!currentBuilding) {
      if (clickCol>=0 && clickRow>=0 && clickCol<mapCols && clickRow<mapRows) {
        const tile = currentMap[clickRow]?.[clickCol];
        if (tile === T.WALL || tile === T.BUILDING || tile === T.DOOR) {
          const building = getBuildingAtTile(clickCol, clickRow);
          if (building) {
            if (isAdjacentToBuilding(building)) {
              enterBuilding(building.id);
            } else {
              // Walk to the door tile of this building
              const doorEntry = Object.entries(DOOR_MAP).find(([k,v]) => v === building.id);
              if (doorEntry) {
                const [dc, dr] = doorEntry[0].split(',').map(Number);
                // Walk to tile adjacent to door
                const adj = getAdjacentWalkable(dc, dr);
                if (adj) {
                  player.path = astar(player.col, player.row, adj.col, adj.row);
                  pendingDoorEntry = building.id;
                }
              }
            }
            return;
          }
        }
      }
    }

    // ── Move click ────────────────────────────────────────────
    if (clickCol>=0&&clickRow>=0&&clickCol<mapCols&&clickRow<mapRows
        && TILE_DEF[currentMap[clickRow]?.[clickCol]]?.walk) {
      player.path=astar(player.col,player.row,clickCol,clickRow);
      marker={col:clickCol,row:clickRow,alpha:1};
    }
  });
}

// ── NPC TALK ──────────────────────────────────────────────────
function talkTo(npc) {
  // Guard: never open dialogue if sleep warning is showing
  if (false) return;

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
function loadScene(sceneId, fromBuildingId) {
  clearNarrative();
  if (sceneId === 'village') {
    currentBuilding = null;
    currentFloor    = null;
    currentCabinet  = null;
    currentMap      = villageMap;
    mapCols         = VILLAGE_COLS;
    mapRows         = VILLAGE_ROWS;
    currentNPCs     = NPCS.filter(n => n.scene==='village' && (n.visible!==false || State.flags.harvest_festival));
    currentStations = [];
    currentExits    = [];

    // Village items: forest edge materials (respawn each day)
    const dayKey = `day_${State.day}`;
    currentItems = FOREST_EDGE_ITEMS.map(item => {
      const takenKey = `village_${item.itemId}_${item.col}_${item.row}_${dayKey}`;
      return { ...item, taken: State.takenItems.includes(takenKey) };
    });

    // Place player at the building door they just exited, or default starting position
    if (fromBuildingId) {
      const doorEntry = Object.entries(DOOR_MAP).find(([k,v]) => v === fromBuildingId);
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
// Placeholder SVG art per building — swap for <img src="..."> when real art exists
const BUILDING_ART = {
  bakery: `<img src="images/buildings/bakery.jpg" style="width:100%;height:100%;object-fit:cover">`,

  bakery_upper: `<img src="images/buildings/bakery_upper.jpg" style="width:100%;height:100%;object-fit:cover">`,

  inn: `<img src="images/buildings/inn.jpg" style="width:100%;height:100%;object-fit:cover">`,

  forge: `<img src="images/buildings/forge.jpg" style="width:100%;height:100%;object-fit:cover">`,

  town_hall: `<img src="images/buildings/town_hall.jpg" style="width:100%;height:100%;object-fit:cover">`,

  jaxons_house: `<img src="images/buildings/jaxons_house.jpg" style="width:100%;height:100%;object-fit:cover">`,

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

  currentStations = floor.stations || [];
  currentExits    = floor.exits    || [];

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
  const doorKey = Object.entries(DOOR_MAP).find(([k,v]) => v === building.id);
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
  loadScene('village');

  // Restore saved player position — only if the save was made in the village
  // (interior saves store small map coords that would land inside a building footprint)
  if (hasSave && State.playerCol !== undefined && State.scene === 'village') {
    player.col = State.playerCol;
    player.row = State.playerRow;
    player.px  = isoX(player.col, player.row);
    player.py  = isoY(player.col, player.row);
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
