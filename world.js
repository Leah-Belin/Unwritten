// ── TILE TYPES ────────────────────────────────────────────────
const T = { GRASS:0, PATH:1, DIRT:2, BUILDING:3, WALL:4, TREE:5, FLOWER:6, WATER:7, DOOR:8, STAIRS:9, PLOT:10 };

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
const BUILDINGS = {
  bakery: {
    id: 'bakery',
    name: 'The Bakery',
    emoji: '🥖',
    exteriorCol: 5, exteriorRow: 5,
    floors: [
      {
        id: 'bakery_ground',
        name: 'Bakery — Ground Floor',
        grid: buildInteriorMap('bakery_ground'),
        npcs: ['mariella'],
        items: [
          { itemId:'grain',       col:3, row:4, oneTime:false, label:'Sack of grain by the counter', respawn:true },
          { itemId:'common_herb', col:7, row:3, oneTime:false, label:'Herbs on the windowsill', respawn:true },
        ],
        stations: [{ type:'oven', col:2, row:3, label:'The Oven 🔥' }],
        exits: [
          { label:'Go upstairs',   targetFloor:'bakery_upper', col:8, row:5 },
          { label:'Leave bakery',  targetScene:'village',      col:5, row:9 },
        ],
      },
      {
        id: 'bakery_upper',
        name: 'Bakery — Upstairs',
        grid: buildInteriorMap('bakery_upper'),
        npcs: [],
        items: [
          { itemId:'cloth_scrap',  col:2,  row:5, oneTime:false, label:"Kaida's spare cloth", respawn:false },
          { itemId:'common_herb',  col:6,  row:5, oneTime:false, label:'Dried herbs on windowsill', respawn:false },
          { itemId:'knotted_cord', col:10, row:3, oneTime:true,  label:"Knotted cord on Gallan's desk", respawn:false },
          { itemId:'gallan_tools', col:10, row:4, oneTime:true,  label:"Father's tools, half-sorted", respawn:false },
        ],
        stations: [{ type:'worktable', col:10, row:5, label:"Gallan's Worktable 🔧" }],
        exits: [
          { label:'Go downstairs', targetFloor:'bakery_ground', col:9, row:5 },
        ],
        cabinet: {
          col:11, row:3,
          label:"Gallan's Medicinal Cabinet",
          lockedLabel:"Gallan's Cabinet (locked)",
          unlockedLabel:"Gallan's Cabinet",
          requiresKey:'garden_key',
          items:[
            { itemId:'healing_herb', label:'Healing herb bundles, carefully sorted by potency' },
            { itemId:'knotted_cord', label:'Another knotted cord, wrapped around the herb bundles' },
            { itemId:'root',         label:'Dried root bundles, labelled only by shape' },
          ],
          recipesUnlocked:['healing_tonic','energy_salve','sleep_draught'],
        },
        lockedPostExile: true,
      },
    ],
  },

  inn: {
    id: 'inn',
    name: 'The Inn',
    emoji: '🍺',
    exteriorCol: 34, exteriorRow: 5,
    floors: [
      {
        id: 'inn_ground',
        name: 'The Inn — Common Room',
        grid: buildInteriorMap('inn'),
        npcs: ['innkeeper'],
        items: [
          { itemId:'fruit',      col:3, row:4, oneTime:false, label:'Bowl of fruit', respawn:true },
          { itemId:'mint_herb',  col:7, row:2, oneTime:false, label:'Mint sprigs',   respawn:false },
        ],
        stations: [{ type:'hearth', col:1, row:3, label:'Hearth 🔥' }],
        exits: [{ label:'Leave inn', targetScene:'village', col:5, row:9 }],
        sleepOption: { cost:{blue:2}, label:'Rent a room (2 🔵)' },
      },
    ],
  },

  forge: {
    id: 'forge',
    name: 'The Forge',
    emoji: '🔥',
    exteriorCol: 27, exteriorRow: 5,
    floors: [
      {
        id: 'forge_ground',
        name: 'The Forge',
        grid: buildInteriorMap('generic'),
        npcs: ['blacksmith'],
        items: [
          { itemId:'useful_tool',  col:4, row:5, oneTime:true,  label:'Spare tool handle' },
          { itemId:'stone_fragment',col:6, row:3, oneTime:true,  label:'Strange smooth stone' },
          { itemId:'iron_fitting', col:7, row:4, oneTime:false, label:'Iron fittings on the shelf', respawn:true },
          { itemId:'iron_fitting', col:5, row:6, oneTime:false, label:'More fittings by the anvil', respawn:false },
        ],
        stations: [{ type:'forge', col:2, row:2, label:'The Forge 🔥' }],
        exits: [{ label:'Leave forge', targetScene:'village', col:5, row:9 }],
      },
    ],
  },

  town_hall: {
    id: 'town_hall',
    name: 'Town Hall',
    emoji: '⚖️',
    exteriorCol: 19, exteriorRow: 11,
    floors: [
      {
        id: 'townhall_ground',
        name: 'Town Hall',
        grid: buildInteriorMap('hall'),
        npcs: ['elder'],
        items: [],
        stations: [],
        exits: [{ label:'Leave', targetScene:'village', col:5, row:11 }],
      },
    ],
  },

  jaxons_house: {
    id: 'jaxons_house',
    name: "Jaxon's House",
    emoji: '🏡',
    exteriorCol: 14, exteriorRow: 28,
    floors: [
      {
        id: 'jaxons_ground',
        name: "Jaxon's House",
        grid: buildInteriorMap('generic'),
        npcs: [{ id:'jaxon', col:5, row:4 }],
        items: [
          { itemId:'fruit',       col:3, row:5, oneTime:false, label:'Fruit on table', respawn:false },
          { itemId:'cloth_scrap', col:6, row:3, oneTime:true,  label:'Cloth scrap' },
          { itemId:'knotted_cord',col:7, row:2, oneTime:true,  label:'Knotted cord hanging on hook' },
        ],
        stations: [],
        exits: [{ label:'Leave', targetScene:'village', col:5, row:9 }],
      },
    ],
  },

  hestas_hut: {
    id: 'hestas_hut',
    name: "Hesta's Hut",
    emoji: '🏚️',
    exteriorCol: 6, exteriorRow: 32,
    floors: [
      {
        id: 'hestas_ground',
        name: "Hesta's Hut",
        grid: buildInteriorMap('small'),
        npcs: ['hesta'],
        items: [
          { itemId:'knotted_cord', col:3, row:2, oneTime:true,  label:'Knotted cord on a hook (your father left this)' },
          { itemId:'common_herb',  col:5, row:3, oneTime:false, label:'Herbs hanging to dry', respawn:false },
          { itemId:'honey',        col:2, row:5, oneTime:true,  label:'Small jar of honey' },
        ],
        stations: [{ type:'hearth', col:1, row:4, label:'Hearth 🔥' }],
        exits: [{ label:'Leave', targetScene:'village', col:5, row:7 }],
        sleepOption: { cost:null, goodwill:'hesta', goodwillMin:1, label:"Sleep on Hesta's floor" },
      },
    ],
  },

  // Generic villager houses — share a template, different NPCs/items
  villager_house_a: {
    id: 'villager_house_a',
    name: 'A Villager\'s Home',
    emoji: '🏠',
    exteriorCol: 10, exteriorRow: 25,
    floors: [{
      id: 'vhouse_a',
      name: 'A Villager\'s Home',
      grid: buildInteriorMap('generic'),
      npcs: [],
      items: [
        { itemId:'common_herb', col:3, row:2, oneTime:false, label:'Herbs on windowsill', respawn:false },
        { itemId:'fruit',       col:6, row:4, oneTime:false, label:'Bowl of fruit', respawn:false },
        { itemId:'red_chit',    col:8, row:6, oneTime:true,  label:'Red chit left on table' },
      ],
      stations: [],
      exits: [{ label:'Leave', targetScene:'village', col:5, row:9 }],
    }],
  },

  villager_house_b: {
    id: 'villager_house_b',
    name: 'A Villager\'s Home',
    exteriorCol: 28, exteriorRow: 12,
    floors: [{
      id: 'vhouse_b',
      name: 'A Villager\'s Home',
      grid: buildInteriorMap('generic'),
      npcs: [],
      items: [
        { itemId:'cloth_scrap', col:3, row:3, oneTime:true,  label:'Cloth scrap on a chair' },
        { itemId:'fruit',       col:7, row:5, oneTime:false, label:'Bowl of fruit on the table', respawn:false },
      ],
      stations: [],
      exits: [{ label:'Leave', targetScene:'village', col:5, row:9 }],
    }],
  },

  villager_house_c: {
    id: 'villager_house_c',
    name: 'A Villager\'s Home',
    exteriorCol: 14, exteriorRow: 32,
    floors: [{
      id: 'vhouse_c',
      name: 'A Villager\'s Home',
      grid: buildInteriorMap('generic'),
      npcs: [],
      items: [
        { itemId:'common_herb', col:4, row:3, oneTime:false, label:'Herbs drying by the window', respawn:false },
        { itemId:'useful_tool', col:7, row:6, oneTime:true,  label:'A small tool left on the floor' },
      ],
      stations: [],
      exits: [{ label:'Leave', targetScene:'village', col:5, row:9 }],
    }],
  },

  council_hall: {
    id: 'council_hall',
    name: 'Council Hall',
    exteriorCol: 29, exteriorRow: 24,
    floors: [{
      id: 'council_ground',
      name: 'Council Hall',
      grid: buildInteriorMap('hall'),
      npcs: [{ id:'elder', col:5, row:4 }],
      items: [],
      stations: [],
      exits: [{ label:'Leave', targetScene:'village', col:5, row:11 }],
    }],
  },
};

// ── INTERIOR MAP BUILDER ──────────────────────────────────────
function buildInteriorMap(type) {
  // Bakery upper floor is wider — 12 cols, 8 rows — 3 rooms side by side
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
    for (let r = 1; r < rows-1; r++) grid[r][4] = T.WALL;
    grid[4][4] = T.DIRT;
    for (let r = 1; r < rows-1; r++) grid[r][8] = T.WALL;
    grid[4][8] = T.DIRT;
    grid[5][9] = T.STAIRS;  // col 9, inside right wall of 12-wide map
    grid[2][2] = T.WALL; grid[2][3] = T.WALL;
    grid[2][6] = T.WALL; grid[2][7] = T.WALL;
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
  // Town square
  fillVRect(17, 17, 6, 6, T.DIRT);
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
  // Well
  villageMap[19][19] = T.WALL;
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
  fillVRect(21,17,2,6,T.PATH); // market area south of square

  // The Plot — east side near forest, row 22 col 34
  // A small cleared area: 3x3 dirt patch with the plot marker in centre
  fillVRect(21, 33, 4, 4, T.DIRT);
  villageMap[22][34] = T.PLOT; // the actual plot tile
}

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

// ── NPCS ──────────────────────────────────────────────────────
const NPCS = [
  {
    id:'mariella', portrait:'images/portraits/mariella.jpg', name:'Mariella', emoji:'👩', col:5, row:5, color:'#c07850',
    lines:[
      '"Good morning, love. Rolls are nearly done — take some to the square when they\'re cool, would you?"',
      '"Market day tomorrow! I need you to fetch me some fresh herbs before then."',
      '"Your father\'s up at the garden. You know how he gets when a new batch of something is coming in."',
      '"Try Sera\'s stall if you need anything — she got a lovely delivery of honey this week."',
      '"It\'s a beautiful day, Kaida. Go enjoy it."',
    ],
    generalReplies: ['"Yes, Mum."', '"Of course."', '"I will soon."'],
    quest: { id:'mariella_herbs', itemId:'common_herb', itemName:'Common Herb', reward:'chit', rewardColor:'red', rewardAmount:1, line:'"Could you find me some fresh herbs? The windowsill ones are going dry."' },
    teachesAt: { goodwill:3, recipes:['spiced_rolls','fruit_preserve','morning_tea'], line:'"Come here — let me show you how to do the spiced rolls properly. Your father requests them every single morning."' },
  },
  {
    id:'jaxon', portrait:'images/portraits/jaxon.jpg', name:'Jaxon', emoji:'🧑', col:21, row:22, color:'#507090',
    scene:'village',
    lines:[
      {
        text: '"You know what I keep thinking about?" He looks out toward the east field. "A place of our own. Not your mum\'s, not my dad\'s — somewhere we chose. Somewhere that\'s just ours."',
        replies: [
          { label: '"I think about it too."' },
          { label: '"It would be wonderful."' },
        ],
      },
      {
        text: '"We could actually make it happen, Kaida. We save up, we gather what we need — a little at a time if we have to. But we could start now. There\'s nothing stopping us."',
        replies: [
          { label: '"You really think so?"' },
          { label: '"I\'d like that more than anything."' },
        ],
      },
      {
        text: '"A home we built ourselves. So when we\'re married, we\'re walking through our own door for the very first time. Together." He smiles. "That\'s what I want for us."',
        replies: [
          { label: '"Before the wedding?"' },
          { label: '"That\'s exactly what I want too."' },
        ],
      },
      {
        text: '"I\'ve already been looking." He grins, a little sheepish. "There\'s a plot on the east edge — near the old elm. Nobody\'s claimed it. It\'s just sitting there. I wanted to show you before I did anything else."',
        replies: [
          { label: '"You already picked one out?"' },
          { label: '"Show me."' },
        ],
      },
      '"My dad thinks we could start the foundation before winter, if we save enough. Your work at the bakery, my carpentry — maybe by harvest?"',
      '"I keep telling Sera we\'re saving up. She keeps telling everyone else." He grins. "Small village."',
      '"Your mum offered to teach me her bread recipe. I think she likes me."',
      '"Twenty gold chits is a lot. But we can do it. I know we can."',
    ],
    generalReplies: ['"I\'ll keep that in mind."', '"Thanks, Jaxon."', '"I should get going."'],
    houseSavingsGoal: 20,
  },
  {
    id:'sera', name:'Sera', emoji:'🧑‍🦳', col:23, row:21, color:'#907050',
    scene:'village',
    lines:[
      '"Kaida! Just the person. Tell your mother I have fresh coriander — she\'s been asking."',
      '"Market day tomorrow, I\'m run off my feet. Your father always stops for a chat, bless him."',
      '"Lovely weather for the festival coming up. Good for the harvest too, touch wood."',
    ],
    generalReplies: ['"I\'ll pass that on."', '"Good to know."', '"I should get moving."'],
    quest: { id:'sera_bread', itemId:'simple_bread', itemName:'Simple Bread', reward:'chit', rewardColor:'red', rewardAmount:2, line:'"Oh, I don\'t suppose you have any of your mother\'s bread spare? Mine burned this morning, catastrophe."' },
  },
  {
    id:'blacksmith', name:'Oswin', emoji:'🧔', col:5, row:5, color:'#605040',
    lines:[
      '"Morning! Good day for it. Whatever \'it\' is."',
      '"Your father\'s the only healer I\'d trust. Fixed my shoulder right up last winter."',
      '"Big order this week. Three new ploughs before festival. My arms are going to fall off."',
    ],
    generalReplies: ['"Sounds about right."', '"Take care of yourself."', '"I won\'t keep you."'],
    teachesAt: { goodwill:2, recipes:['blacksmith_broth'], line:'"You look half-starved. Here — my mother\'s broth. She swore it could fix anything. Mostly true."' },
  },
  {
    id:'elder', name:'Elder Maren', emoji:'👵', col:5, row:4, color:'#806050',
    lines:[
      '"Good morning, child. The council met this week — we\'re planning the harvest ceremony."',
      '"Your father does good work. The village is lucky to have him."',
      '"The old ways keep us safe. There\'s comfort in that, when you\'re my age."',
      '"Writing is not forbidden by us. It is forbidden by the world. We are only wise enough to obey."',
    ],
    generalReplies: ['"I understand."', '"Thank you, Elder."', '"I\'ll bear that in mind."'],
  },
  {
    id:'hesta', portrait:'images/portraits/hesta.jpg', name:'Hesta', emoji:'🧓', col:5, row:4, color:'#7a6050',
    lines:[
      '"Oh, it\'s you! Come and sit a moment, my knees are giving me trouble today."',
      '"I\'ve been out here forty years. Village hasn\'t changed much. That\'s the way I like it."',
      '"Your father brought me a tonic last month. Slept like a stone. Good man."',
    ],
    generalReplies: ['"Of course."', '"I\'m glad you\'re well."', '"I won\'t stay too long."'],
    teachesAt: { goodwill:2, recipes:['hestas_remedy'], line:'"My grandmother\'s remedy. Don\'t tell your father I said it\'s better than his — but it is."' },
    quest: { id:'hesta_water', itemId:'common_herb', itemName:'Common Herb', reward:'item', rewardItemId:'honey', line:'"Could you fetch me some fresh herbs from the wood\'s edge? My knees won\'t manage it today."' },
  },
  {
    id:'innkeeper', name:'The Innkeeper', emoji:'🧑‍🍳', col:5, row:5, color:'#806858',
    lines:[
      '"Morning! Festival\'s coming up — half the region will be through that door. Exciting!"',
      '"Your mother\'s rolls are the best thing about market day. Don\'t tell her I said that, she\'ll raise her prices."',
      '"Quiet week. Just the way I like it before the rush."',
    ],
    generalReplies: ['"Good to hear."', '"I can imagine."', '"I\'ll let you get back to it."'],
    teachesAt: { goodwill:2, recipes:['strong_tea'], line:'"My house blend. Travelers come back year after year just for this. Secret\'s in the steep time."' },
    quest: { id:'inn_fruit', itemId:'fruit', itemName:'Fruit', reward:'chit', rewardColor:'red', rewardAmount:2, line:'"I\'m short on fruit for the festival pies. Bring me some and I\'ll see you right."' },
  },
  {
    id:'children', name:'Children', emoji:'👧', col:20, row:17, color:'#a08060',
    scene:'village',
    lines:[
      'They\'re playing a chasing game around the well, shrieking with laughter.',
      'A girl drags a stick through the dirt idly — draws a curve — then stops. Scuffs it out fast with her shoe. The others don\'t even notice.',
      'They\'re sorting colored stones into elaborate patterns. Someone disagrees about the rules. Loudly.',
    ],
    generalReplies: ['"Hello."', '"Don\'t mind me."'],
  },
  {
    id:'father', portrait:'images/portraits/father.jpg', name:'The Priest', emoji:'👴', col:20, row:20, color:'#c0b090',
    scene:'village',
    visible: false,
    lines:[
      '"A good harvest this year. Nature is generous when we honor the compact."',
      '"The temple welcomes all who wish to serve. It is a quiet life, but a meaningful one."',
      '"Writing is a sacred responsibility. We treat it with the reverence it deserves."',
    ],
  },
];

// ── SPAWN TABLE FOR GARDEN ────────────────────────────────────
const GARDEN_ITEMS = [
  { itemId:'healing_herb', col:4, row:3, oneTime:false, label:"Gallan's herb patch", respawn:true },
  { itemId:'healing_herb', col:6, row:5, oneTime:false, label:'More healing herbs',  respawn:true },
  { itemId:'lavender',     col:3, row:6, oneTime:false, label:'Lavender row',        respawn:true },
  { itemId:'root',         col:7, row:3, oneTime:false, label:'Dug-up roots',        respawn:false },
  { itemId:'knotted_cord', col:5, row:7, oneTime:true,  label:'Knotted cord wrapped around a stone' },
  { itemId:'garden_key',   col:5, row:7, oneTime:true,  label:'Small key hidden under the cord' },
  { itemId:'common_herb',  col:2, row:4, oneTime:false, label:'Common herbs',        respawn:true },
];

// ── MARKET STALLS ─────────────────────────────────────────────
const MARKET_STALLS = [
  {
    id:'sera_stall', name:"Sera's Stall", emoji:'🧑‍🦳',
    sells:[
      { itemId:'fruit',      cost:{red:1},  label:'Fresh Fruit 🍎' },
      { itemId:'honey',      cost:{red:2},  label:'Local Honey 🍯' },
      { itemId:'spice_herb', cost:{red:1},  label:'Spice Herbs 🌶️' },
      { itemId:'clay_brick', cost:{red:2},  label:'Clay Bricks 🧱 (from the kiln)' },
    ],
    buys:['simple_bread','herb_bundle','spiced_rolls','fruit_preserve'],
  },
  {
    id:'tool_stall', name:'Tool Vendor', emoji:'🔨',
    sells:[
      { itemId:'useful_tool',  cost:{red:2},  label:'Small Tool 🔨' },
      { itemId:'oil',          cost:{red:1},  label:'Pressed Oil 🫙' },
      { itemId:'iron_fitting', cost:{blue:1}, label:'Iron Fittings 🔩' },
      { itemId:'timber',       cost:{red:3},  label:'Dressed Timber 🪵' },
    ],
    buys:['cloth_scrap','timber','stone_block'],
  },
  {
    id:'fabric_stall', name:'Fabric Stall', emoji:'🧵',
    sells:[
      { itemId:'cloth_scrap', cost:{red:1}, label:'Cloth Scrap 🧵' },
    ],
    buys:['fruit','common_herb'],
  },
  {
    // Travelling trader — only appears on market day, sells rare items
    id:'trader_stall', name:'Travelling Trader', emoji:'🧳',
    sells:[
      { itemId:'glass_piece', cost:{gold:1}, label:'Glass Pane 🪟 (rare)' },
      { itemId:'stone_block', cost:{red:2},  label:'Cut Stone 🪨' },
    ],
    buys:['healing_tonic','energy_salve'],
  },
];
