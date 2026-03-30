// ── PENDING TRANSITIONS ───────────────────────────────────────
// Pending door entry — set when player clicks a door they're not yet adjacent to
let pendingDoorEntry = null;
let pendingPlotOpen  = false;

function checkPendingDoor() {
  const id = pendingDoorEntry;
  pendingDoorEntry = null;
  enterBuilding(id);
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
    loadZoneImages(sceneId);   // lazy-load zone-specific images on first visit
    const zone = ZONES[sceneId];
    currentBuilding  = null;
    currentFloor     = null;
    currentCabinet   = null;
    currentMap       = zone.grid;
    mapRows          = zone.grid.length;
    mapCols          = zone.grid[0].length;
    currentNPCs = (zone.npcs || []).map(entry => {
      const id  = typeof entry === 'string' ? entry : entry.id;
      const npc = NPCS.find(n => n.id === id);
      if (!npc) return null;
      // Merge position override (col/row) with the full NPC definition
      if (typeof entry === 'object' && (entry.col !== undefined || entry.row !== undefined)) {
        return { ...npc, col: entry.col ?? npc.col, row: entry.row ?? npc.row };
      }
      return npc;
    }).filter(Boolean);
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
                       temple_path:{col:13,row:18}, market:{col:3,row:10} };
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
      const b = BUILDING_REGISTRY.find(b => b.id === fromBuildingId);
      if (b) {
        player.col = b.doorCol; player.row = b.doorRow + 1;
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

  inn: `<img src="images/buildings/inn_interior.jpg" style="width:100%;height:100%;object-fit:cover">`,

  forge: `<img src="images/buildings/forge.jpg" style="width:100%;height:100%;object-fit:cover">`,

  town_hall: `<img src="images/buildings/town_hall_interior.jpg" style="width:100%;height:100%;object-fit:cover">`,

  council_hall: `<img src="images/buildings/council_interior.jpg" style="width:100%;height:100%;object-fit:cover">`,

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

// ── WORLD MAP ─────────────────────────────────────────────────
// Single source of truth for building door positions and tile footprints.
// doorCol/doorRow: the door tile coordinates on the village map.
// rMin/rMax/cMin/cMax: tile footprint used for click-to-enter detection.
const BUILDING_REGISTRY = [
  { id:'bakery',          doorCol:6,  doorRow:8,  rMin:4,  rMax:8,  cMin:3,  cMax:8  },
  { id:'forge',           doorCol:28, doorRow:5,  rMin:4,  rMax:5,  cMin:25, cMax:30 },
  { id:'inn',             doorCol:35, doorRow:6,  rMin:4,  rMax:6,  cMin:32, cMax:37 },
  { id:'town_hall',       doorCol:20, doorRow:13, rMin:10, rMax:13, cMin:15, cMax:24 },
  { id:'council_hall',    doorCol:29, doorRow:24, rMin:22, rMax:24, cMin:26, cMax:31 },
  { id:'hestas_hut',      doorCol:6,  doorRow:33, rMin:31, rMax:33, cMin:4,  cMax:8  },
  { id:'jaxons_house',    doorCol:13, doorRow:28, rMin:25, rMax:28, cMin:10, cMax:15 },
  { id:'villager_house_a',doorCol:24, doorRow:31, rMin:28, rMax:31, cMin:22, cMax:25 },
  { id:'villager_house_b',doorCol:30, doorRow:15, rMin:12, rMax:15, cMin:28, cMax:31 },
  { id:'villager_house_c',doorCol:16, doorRow:35, rMin:32, rMax:35, cMin:14, cMax:17 },
];

function getBuildingAtTile(col, row) {
  return BUILDING_REGISTRY.find(b =>
    row >= b.rMin && row <= b.rMax &&
    col >= b.cMin && col <= b.cMax
  ) || null;
}

function isAdjacentToBuilding(building) {
  const b = BUILDING_REGISTRY.find(b => b.id === building.id);
  if (!b) return false;
  return Math.abs(player.col - b.doorCol) <= 1 && Math.abs(player.row - b.doorRow) <= 1;
}

function getDoorBuilding(col, row) {
  return BUILDING_REGISTRY.find(b => b.doorCol === col && b.doorRow === row)?.id || null;
}

function toggleWorldMap() {
  document.getElementById('worldmap-overlay').classList.toggle('open');
}
function travelTo(zone) {
  if (zone === 'village') { toggleWorldMap(); loadScene('village'); }
}
