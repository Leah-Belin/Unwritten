// ── TILE TYPES ────────────────────────────────────────────────
const T = { GRASS:0, PATH:1, DIRT:2, BUILDING:3, WALL:4, TREE:5, FLOWER:6, WATER:7, DOOR:8, STAIRS:9, PLOT:10, FOUNTAIN:11, EXIT:12, COBBLE:13 };

const TILE_DEF = {
  [T.GRASS]:    { walk:true,  top:'#8a9a6a', left:'#6a7a4a', right:'#7a8a5a' },
  [T.PATH]:     { walk:true,  top:'#c8b078', left:'#a89058', right:'#b8a068' },
  [T.DIRT]:     { walk:true,  top:'#c0a870', left:'#907850', right:'#a09060' },
  [T.BUILDING]: { walk:false, top:'#d0c09a', left:'#6a5030', right:'#8a6a40', raised:20 },
  [T.WALL]:     { walk:false, top:'#c8b890', left:'#7a6040', right:'#9a8060', raised:28 },
  [T.TREE]:     { walk:false, top:'#8a9a6a', left:'#6a7a4a', right:'#7a8a5a', tree:true },
  [T.FLOWER]:   { walk:true,  top:'#8a9a6a', left:'#6a7a4a', right:'#7a8a5a', flower:true },
  [T.WATER]:    { walk:false, top:'#6080b0', left:'#405880', right:'#5070a0' },
  [T.DOOR]:     { walk:true,  top:'#c8a060', left:'#8a6030', right:'#a07040', door:true },
  [T.STAIRS]:   { walk:true,  top:'#b8a878', left:'#806848', right:'#a08858', stairs:true },
  [T.PLOT]:     { walk:true,  top:'#b8a060', left:'#907840', right:'#a89050', plot:true },
  [T.FOUNTAIN]: { walk:false, fountain:true },
  [T.EXIT]:     { walk:true,  top:'#f0e870', left:'#c8b830', right:'#e0d050', exit:true },
  [T.COBBLE]:   { walk:true,  top:'#b0a898', left:'#807870', right:'#988880' },
};

// Visual styles per building — walls, roof/interior, chimney & window flags
const BUILDING_STYLES = {
  bakery:           { wall:'#ece0c8', wallL:'#8a6840', wallR:'#b08858', roof:'#5a3020', chimney:true, bigWindows:true, texture:'wood' },
  forge:            { wall:'#b0a898', wallL:'#504840', wallR:'#706860', roof:'#2a2420', chimney:true, texture:'stone' },
  inn:              { wall:'#d8c890', wallL:'#9a7840', wallR:'#bea060', roof:'#5a3018', chimney:true, texture:'wood' },
  town_hall:        { wall:'#dcd8c8', wallL:'#706860', wallR:'#908878', roof:'#484038', texture:'stone_cut' },
  council_hall:     { wall:'#d4d0c0', wallL:'#686058', wallR:'#888070', roof:'#404038', texture:'stone_cut' },
  hestas_hut:       { wall:'#d0c8a0', wallL:'#7a6840', wallR:'#988858', roof:'#4a2c1c', chimney:true, texture:'stone' },
  jaxons_house:     { wall:'#ccc8a8', wallL:'#706040', wallR:'#907858', roof:'#503020', chimney:true, texture:'brick' },
  villager_house_a: { wall:'#d4caa8', wallL:'#7a6840', wallR:'#987860', roof:'#5c3020', chimney:true, texture:'brick' },
  villager_house_b: { wall:'#cac4a0', wallL:'#706040', wallR:'#908058', roof:'#502818', chimney:true, texture:'brick' },
  villager_house_c: { wall:'#cecaa8', wallL:'#7a6840', wallR:'#988860', roof:'#5a3020', chimney:true, texture:'brick' },
};

// ── TIME PERIODS ──────────────────────────────────────────────
const PERIODS = [
  { label:'Dawn',      icon:'🌅', sky1:'#1a1208', sky2:'#2a1c10', tint:'rgba(200,130,80,0.14)',  energyCap:100 },
  { label:'Morning',   icon:'🌤️', sky1:'#141010', sky2:'#1e160c', tint:'rgba(255,240,180,0.04)', energyCap:100 },
  { label:'Midday',    icon:'☀️',  sky1:'#101008', sky2:'#181408', tint:'rgba(255,250,200,0.04)', energyCap:100 },
  { label:'Afternoon', icon:'🌥️', sky1:'#141010', sky2:'#1e160c', tint:'rgba(220,200,150,0.06)', energyCap:100 },
  { label:'Dusk',      icon:'🌆', sky1:'#1a1008', sky2:'#2c1408', tint:'rgba(190,100,50,0.22)',  energyCap:70  },
  { label:'Evening',   icon:'🌇', sky1:'#100808', sky2:'#200c08', tint:'rgba(160,80,30,0.32)',   energyCap:40  },
  { label:'Night',     icon:'🌙', sky1:'#080812', sky2:'#100820', tint:'rgba(10,15,45,0.65)',    energyCap:20  },
];

// ── ITEMS MASTER LIST ─────────────────────────────────────────
const ITEMS = {
  // Herbs
  common_herb:    { id:'common_herb',    name:'Common Herb',        emoji:'🌿', category:'herb',       energyRestore:8,  sellValue:{red:1} },
  healing_herb:   { id:'healing_herb',   name:"Gallan's Herb",      emoji:'🌱', category:'herb',       energyRestore:20, sellValue:{red:2} },
  mint_herb:      { id:'mint_herb',      name:'Mint',               emoji:'🫚', category:'herb',       energyRestore:6,  sellValue:{red:1} },
  spice_herb:     { id:'spice_herb',     name:'Spice Herb',         emoji:'🌶️', category:'herb',       energyRestore:5,  sellValue:{red:1} },
  lavender:       { id:'lavender',       name:'Lavender',           emoji:'💜', category:'herb',       energyRestore:8,  sellValue:{red:1} },
  root:           { id:'root',           name:'Dried Root',         emoji:'🪨', category:'ingredient', energyRestore:0,  sellValue:{red:1} },
  honey:          { id:'honey',          name:'Honey',              emoji:'🍯', category:'ingredient', energyRestore:5,  sellValue:{red:1} },
  oil:            { id:'oil',            name:'Pressed Oil',        emoji:'🫙', category:'ingredient', energyRestore:0,  sellValue:{red:1} },
  grain:          { id:'grain',          name:'Grain',              emoji:'🌾', category:'ingredient', energyRestore:0,  sellValue:null    },
  fruit:          { id:'fruit',          name:'Fruit',              emoji:'🍎', category:'food',       energyRestore:10, sellValue:{red:1} },
  // Crafted food
  simple_bread:   { id:'simple_bread',   name:'Simple Bread',       emoji:'🍞', category:'food',       energyRestore:12, sellValue:{red:1} },
  spiced_rolls:   { id:'spiced_rolls',   name:'Spiced Rolls',       emoji:'🥐', category:'food',       energyRestore:18, sellValue:{red:2} },
  fruit_preserve: { id:'fruit_preserve', name:'Fruit Preserve',     emoji:'🫙', category:'food',       energyRestore:20, sellValue:{blue:1} },
  morning_tea:    { id:'morning_tea',    name:'Morning Tea',        emoji:'🍵', category:'food',       energyRestore:15, sellValue:null    },
  herb_bundle:    { id:'herb_bundle',    name:'Herb Bundle',        emoji:'🌿', category:'herb',       energyRestore:10, sellValue:{red:1} },
  // Crafted tonics
  healing_tonic:  { id:'healing_tonic',  name:'Healing Tonic',      emoji:'🧪', category:'tonic',      energyRestore:35, sellValue:{blue:2} },
  energy_salve:   { id:'energy_salve',   name:'Energy Salve',       emoji:'💚', category:'tonic',      energyRestore:25, sellValue:{blue:1} },
  sleep_draught:  { id:'sleep_draught',  name:'Sleep Draught',      emoji:'💤', category:'tonic',      energyRestore:0,  sellValue:{blue:3}, sleepEffect:true },
  hestas_remedy:  { id:'hestas_remedy',  name:"Hesta's Remedy",     emoji:'🌾', category:'tonic',      energyRestore:20, sellValue:{red:2} },
  strong_tea:     { id:'strong_tea',     name:'Strong Tea',         emoji:'☕', category:'food',       energyRestore:15, sellValue:null    },
  blacksmith_broth:{ id:'blacksmith_broth',name:"Oswin's Broth",    emoji:'🥣', category:'food',       energyRestore:22, sellValue:null    },
  // Story items
  garden_key:     { id:'garden_key',     name:'Small Iron Key',     emoji:'🗝️', category:'key',        energyRestore:0,  sellValue:null    },
  knotted_cord:   { id:'knotted_cord',   name:'Knotted Cord',       emoji:'🪢', category:'cord',       energyRestore:0,  sellValue:null    },
  gallan_tools:   { id:'gallan_tools',   name:"Father's Tools",     emoji:'🔧', category:'story',      energyRestore:0,  sellValue:null    },
  stone_fragment: { id:'stone_fragment', name:'Smooth Stone',       emoji:'🪨', category:'story',      energyRestore:0,  sellValue:null    },
  // Misc
  cloth_scrap:    { id:'cloth_scrap',    name:'Cloth Scrap',        emoji:'🧵', category:'material',   energyRestore:0,  sellValue:{red:1} },
  useful_tool:    { id:'useful_tool',    name:'Small Tool',         emoji:'🔨', category:'tool',       energyRestore:0,  sellValue:{red:1} },
  red_chit:       { id:'red_chit',       name:'Red Chit',           emoji:'🔴', category:'currency',   energyRestore:0,  sellValue:null    },
  blue_chit:      { id:'blue_chit',      name:'Blue Chit',          emoji:'🔵', category:'currency',   energyRestore:0,  sellValue:null    },
  // House building materials — for the plot fund
  timber:         { id:'timber',         name:'Timber',             emoji:'🪵', category:'building',   energyRestore:0,  sellValue:{red:2},
                    plotValue:1, plotLabel:'lengths of timber' },
  stone_block:    { id:'stone_block',    name:'Stone Block',        emoji:'🪨', category:'building',   energyRestore:0,  sellValue:{red:2},
                    plotValue:1, plotLabel:'stone blocks' },
  iron_fitting:   { id:'iron_fitting',   name:'Iron Fitting',       emoji:'🔩', category:'building',   energyRestore:0,  sellValue:{blue:1},
                    plotValue:2, plotLabel:'iron fittings' },
  clay_brick:     { id:'clay_brick',     name:'Clay Brick',         emoji:'🧱', category:'building',   energyRestore:0,  sellValue:{red:1},
                    plotValue:1, plotLabel:'clay bricks' },
  glass_piece:    { id:'glass_piece',    name:'Glass Piece',        emoji:'🪟', category:'building',   energyRestore:0,  sellValue:{blue:2},
                    plotValue:3, plotLabel:'panes of glass', rare:true },
};

// ── BUILDINGS ─────────────────────────────────────────────────


// ── INTERIOR MAP BUILDER ──────────────────────────────────────
function buildInteriorMap(type) {
  // Bakery upper floor is wider — 12 cols, 8 rows — 2 rooms side by side
  const cols = (type === 'bakery_upper') ? 12 : 10;
  const rows = (type === 'small') ? 8 : (type === 'hall') ? 12 : 10;
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows-1 || c === 0 || c === cols-1) grid[r][c] = T.WALL;
      else grid[r][c] = T.DIRT;
    }
  }
  // Door at bottom center
  grid[rows-1][Math.floor(cols/2)] = T.DOOR;

  if (type === 'bakery_ground') {
    for (let c = 1; c < 5; c++) grid[1][c] = T.WALL;
    grid[2][1] = T.WALL; grid[3][1] = T.WALL;
    grid[5][8] = T.STAIRS;  // col 8, inside right wall
  }

  if (type === 'bakery_upper') {
    // Single dividing wall at col 5, passage rows 3-5 (3 tiles wide)
    for (let r = 1; r < rows-1; r++) {
      if (r < 3 || r > 5) grid[r][5] = T.WALL;
    }
    grid[5][9] = T.STAIRS;  // stairs in right room
  }

  if (type === 'inn') {
    grid[3][3] = T.WALL; grid[3][6] = T.WALL;
    grid[5][3] = T.WALL; grid[5][6] = T.WALL;
  }
  if (type === 'hall') {
    for (let c = 2; c < 10; c++) grid[6][c] = T.WALL;
    grid[6][6] = T.DIRT;
  }
  return grid;
}

// ── VILLAGE MAP BUILDER ────────────────────────────────────────
const VILLAGE_COLS = 40, VILLAGE_ROWS = 40;
const villageMap = [];

function buildVillageMap() {
  for (let r = 0; r < VILLAGE_ROWS; r++) {
    villageMap[r] = [];
    for (let c = 0; c < VILLAGE_COLS; c++) villageMap[r][c] = T.GRASS;
  }
  // Main paths
  for (let i = 0; i < VILLAGE_ROWS; i++) { villageMap[i][19] = T.PATH; villageMap[i][20] = T.PATH; }
  for (let j = 0; j < VILLAGE_COLS; j++) { villageMap[19][j] = T.PATH; villageMap[20][j] = T.PATH; }
  // Town square — cobblestone plaza around fountain (7×7, fountain at exact centre, gap before town hall)
  fillVRect(17, 17, 7, 7, T.COBBLE);
  // Flowers
  [[5,5],[8,12],[12,4],[30,6],[35,14],[6,28],[3,35],[32,32],[14,36],[22,8],[28,34],[15,22],[24,30]].forEach(([r,c])=>{
    if(villageMap[r][c]===T.GRASS)villageMap[r][c]=T.FLOWER;
  });
  // Buildings (removed separate healer's house — Gallan lives in bakery)
  placeBuilding(4,3,6,6);    // Bakery (Kaida & Gallan's home)
  placeBuilding(4,25,5,6);   // Forge
  placeBuilding(4,32,6,6);   // Inn
  placeBuilding(10,15,6,10); // Town Hall
  placeBuilding(22,26,5,6);  // Council Hall (moved west to clear the plot)
  placeBuilding(31,4,5,5);   // Hesta's hut
  placeBuilding(25,10,5,5);  // Jaxon's house
  placeBuilding(28,22,4,4);  // Villager house A
  placeBuilding(12,28,4,4);  // Villager house B
  placeBuilding(32,14,4,4);  // Villager house C
  // Central fountain
  villageMap[20][20] = T.FOUNTAIN;
  // Tree border — only on pure grass tiles
  for (let i=0;i<VILLAGE_ROWS;i++) for (let j=0;j<VILLAGE_COLS;j++)
    if(i<2||i>VILLAGE_ROWS-3||j<2||j>VILLAGE_COLS-3)
      if(villageMap[i][j]===T.GRASS) villageMap[i][j]=T.TREE;
  // Tree clusters — only place on grass, never on buildings/paths/doors
  [[8,8],[9,8],[8,9],  // NW cluster (clear of bakery)
   [26,8],[27,8],[26,9], // NE cluster (clear of forge)
   [8,28],[9,28],[8,29], // W cluster
   [28,28],[29,28]       // SE cluster
  ].forEach(([r,c])=>{
    if(villageMap[r][c]===T.GRASS) villageMap[r][c]=T.TREE;
  });
  // Market stalls (only visible on market day — handled in renderer)
  // (market area is within the 9×9 plaza fill above)

  // The Plot — east side near forest, row 22 col 34
  fillVRect(21, 33, 4, 4, T.DIRT);
  villageMap[22][34] = T.PLOT;

  // Zone exits — golden tiles at the 4 path borders leading to outdoor zones
  // North (rows 0-1, cols 19-20) → Gallan's Garden / mountain path
  villageMap[0][19]=T.EXIT; villageMap[0][20]=T.EXIT;
  villageMap[1][19]=T.EXIT; villageMap[1][20]=T.EXIT;
  // South (rows 38-39, cols 19-20) → Temple Path
  villageMap[38][19]=T.EXIT; villageMap[38][20]=T.EXIT;
  villageMap[39][19]=T.EXIT; villageMap[39][20]=T.EXIT;
  // West (rows 19-20, cols 0-1) → The Birchwood
  villageMap[19][0]=T.EXIT; villageMap[20][0]=T.EXIT;
  villageMap[19][1]=T.EXIT; villageMap[20][1]=T.EXIT;
  // East (rows 19-20, cols 38-39) → Market Road
  villageMap[19][38]=T.EXIT; villageMap[20][38]=T.EXIT;
  villageMap[19][39]=T.EXIT; villageMap[20][39]=T.EXIT;
}

// ── ZONE EXIT MAP — village tile → zone scene ID ──────────────
// Format: 'col,row'
const ZONE_EXIT_MAP = {
  '19,0':'garden','20,0':'garden','19,1':'garden','20,1':'garden',
  '19,38':'temple_path','20,38':'temple_path','19,39':'temple_path','20,39':'temple_path',
  '0,19':'forest','0,20':'forest','1,19':'forest','1,20':'forest',
  '38,19':'market','39,19':'market','38,20':'market','39,20':'market',
};

// ── PLOT MATERIAL SPAWNS — east forest edge ───────────────────
// These respawn each day and can only be gathered near the forest
const FOREST_EDGE_ITEMS = [
  { itemId:'timber',      col:37, row:10, label:'A fallen branch, good timber', respawn:true },
  { itemId:'timber',      col:38, row:18, label:'Timber from a felled tree',    respawn:true },
  { itemId:'timber',      col:36, row:26, label:'Hewn timber, left behind',     respawn:true },
  { itemId:'stone_block', col:37, row:14, label:'A good flat stone',            respawn:true },
  { itemId:'stone_block', col:38, row:22, label:'Stones from the bank',         respawn:true },
  { itemId:'stone_block', col:36, row:30, label:'Loose stone block',            respawn:true },
];

function fillVRect(r,c,h,w,t){
  for(let i=r;i<r+h;i++)for(let j=c;j<c+w;j++)if(i>=0&&i<VILLAGE_ROWS&&j>=0&&j<VILLAGE_COLS)villageMap[i][j]=t;
}
function placeBuilding(r,c,h,w){
  for(let i=r;i<r+h;i++)for(let j=c;j<c+w;j++){
    if(i<0||i>=VILLAGE_ROWS||j<0||j>=VILLAGE_COLS)continue;
    villageMap[i][j]=(i===r||i===r+h-1||j===c||j===c+w-1)?T.WALL:T.BUILDING;
  }
  // Door on south face, center
  const doorRow = r+h-1;
  const doorCol = c+Math.floor(w/2);
  if(doorRow<VILLAGE_ROWS)villageMap[doorRow][doorCol]=T.DOOR;
}

