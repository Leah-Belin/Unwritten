// ── BUILDINGS ────────────────────────────────────────────────
// Interior floor layouts, NPCs, items, furniture, and exits for each building.

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
        furniture: [
          {type:'counter', col:3, row:2}, {type:'counter', col:4, row:2},
          {type:'stool',   col:3, row:6},
          {type:'barrel',  col:7, row:7},
        ],
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
          { itemId:'knotted_cord', col:10, row:3, oneTime:true,  label:"Knotted cord on Galen's desk", respawn:false },
          { itemId:'gallan_tools', col:10, row:4, oneTime:true,  label:"Father's tools, half-sorted", respawn:false },
        ],
        stations: [{ type:'worktable', col:10, row:5, label:"Galen's Worktable 🔧" }],
        furniture: [
          {type:'bed',   col:2, row:2},
          {type:'bed',   col:2, row:5},
          {type:'table', col:8, row:2},
          {type:'chair', col:7, row:3},
          {type:'chest', col:9, row:6},
        ],
        exits: [
          { label:'Go downstairs', targetFloor:'bakery_ground', col:9, row:5 },
        ],
        cabinet: {
          col:10, row:3,
          label:"Galen's Medicinal Cabinet",
          lockedLabel:"Galen's Cabinet (locked)",
          unlockedLabel:"Galen's Cabinet",
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
        furniture: [
          {type:'counter', col:5, row:2}, {type:'counter', col:6, row:2},
          {type:'stool',   col:5, row:3}, {type:'stool',   col:6, row:3},
          {type:'table',   col:4, row:5}, {type:'chair',   col:3, row:5}, {type:'chair', col:5, row:5},
          {type:'table',   col:7, row:5}, {type:'chair',   col:6, row:5}, {type:'chair', col:8, row:5},
        ],
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
        furniture: [
          {type:'barrel',  col:2, row:7},
          {type:'barrel',  col:3, row:7},
          {type:'counter', col:6, row:2},
          {type:'stool',   col:7, row:3},
        ],
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
        furniture: [
          {type:'table', col:4, row:3}, {type:'table', col:5, row:3}, {type:'table', col:6, row:3},
          {type:'chair', col:3, row:3}, {type:'chair', col:7, row:3},
          {type:'chair', col:4, row:2}, {type:'chair', col:5, row:2}, {type:'chair', col:6, row:2},
          {type:'chair', col:5, row:8}, {type:'chair', col:6, row:8},
        ],
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
        furniture: [
          {type:'bed',   col:2, row:3},
          {type:'table', col:5, row:6},
          {type:'chair', col:4, row:6}, {type:'chair', col:6, row:6},
          {type:'chest', col:2, row:7},
        ],
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
        furniture: [
          {type:'bed',   col:2, row:2},
          {type:'shelf', col:6, row:2},
          {type:'chair', col:4, row:6},
        ],
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
      furniture: [
        {type:'bed',   col:2, row:2},
        {type:'table', col:5, row:5}, {type:'chair', col:4, row:5}, {type:'chair', col:6, row:5},
        {type:'chest', col:7, row:7},
      ],
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
      furniture: [
        {type:'bed',   col:2, row:2},
        {type:'table', col:5, row:5}, {type:'chair', col:4, row:5}, {type:'chair', col:6, row:5},
        {type:'barrel', col:7, row:2},
      ],
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
      furniture: [
        {type:'bed',   col:2, row:2},
        {type:'table', col:5, row:5}, {type:'chair', col:4, row:5}, {type:'chair', col:6, row:5},
        {type:'shelf', col:7, row:2},
      ],
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
      furniture: [
        {type:'table', col:4, row:3}, {type:'table', col:5, row:3}, {type:'table', col:6, row:3},
        {type:'chair', col:3, row:3}, {type:'chair', col:7, row:3},
        {type:'chair', col:4, row:2}, {type:'chair', col:6, row:2},
        {type:'chair', col:5, row:8},
      ],
      exits: [{ label:'Leave', targetScene:'village', col:5, row:11 }],
    }],
  },
};
