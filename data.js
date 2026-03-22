// ── GAME DATA ────────────────────────────────────────────────
// Buildings, NPCs, market stalls, outdoor zones

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
          { itemId:'knotted_cord', col:10, row:3, oneTime:true,  label:"Knotted cord on Gallan's desk", respawn:false },
          { itemId:'gallan_tools', col:10, row:4, oneTime:true,  label:"Father's tools, half-sorted", respawn:false },
        ],
        stations: [{ type:'worktable', col:10, row:5, label:"Gallan's Worktable 🔧" }],
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
    id:'innkeeper', name:'The Innkeeper', emoji:'🧑‍🍳', col:5, row:5, color:'#806858', shop:'inn_stall',
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
  // Inn sells basic supplies any day
  {
    id:'inn_stall', name:'Inn Supplies', emoji:'🍺',
    sells:[
      { itemId:'fruit',         cost:{red:1}, label:'Bowl of fruit 🍎' },
      { itemId:'grain',         cost:{red:1}, label:'Bag of grain 🌾' },
      { itemId:'simple_bread',  cost:{red:2}, label:'Fresh loaf 🍞' },
      { itemId:'mint_herb',     cost:{red:1}, label:'Fresh mint 🫚' },
      { itemId:'morning_tea',   cost:{red:2}, label:'Morning tea blend 🍵' },
    ],
    buys:['fruit','simple_bread','herb_bundle'],
  },
];

// ── ZONE MAP BUILDERS ──────────────────────────────────────────
function buildForestMap() {
  const cols=32, rows=24;
  const g = Array.from({length:rows}, ()=>Array(cols).fill(T.TREE));
  const set=(r,c,t)=>{ if(r>=0&&r<rows&&c>=0&&c<cols) g[r][c]=t; };
  const fill=(r,c,h,w,t)=>{ for(let i=r;i<r+h;i++) for(let j=c;j<c+w;j++) set(i,j,t); };

  // Entry corridor from east — connects to village west exit (rows 19-20 in village → rows 10-11 here)
  fill(9,27,4,5,T.GRASS); g[10][30]=T.EXIT; g[11][30]=T.EXIT; g[10][31]=T.EXIT; g[11][31]=T.EXIT;

  // Main east-west path, gently winding
  for(let c=22;c<30;c++){ g[10][c]=T.PATH; g[11][c]=T.PATH; }
  // Jog south
  for(let r=11;r<=15;r++){ g[r][22]=T.PATH; g[r][21]=T.PATH; }
  // Continue west
  for(let c=16;c<22;c++){ g[15][c]=T.PATH; g[14][c]=T.PATH; }
  // Jog north to cross stream
  for(let r=10;r<=15;r++){ g[r][16]=T.PATH; }
  // West to campfire clearing
  for(let c=7;c<16;c++){ g[10][c]=T.PATH; g[11][c]=T.PATH; }
  // North spur into berry clearing
  for(let r=5;r<=10;r++){ g[r][20]=T.PATH; }
  for(let c=16;c<21;c++){ g[5][c]=T.PATH; }

  // Stream running north-south (col 13-14)
  for(let r=2;r<22;r++){ g[r][13]=T.WATER; if(r>3&&r<20) g[r][14]=T.WATER; }
  g[10][13]=T.PATH; g[11][13]=T.PATH; g[10][14]=T.PATH; g[11][14]=T.PATH; // bridge

  // Clearings
  fill(8,18,6,8,T.GRASS);   // east clearing
  fill(3,16,6,7,T.GRASS);   // north berry clearing
  fill(7,5,8,9,T.GRASS);    // campfire clearing (west)
  fill(12,18,6,8,T.GRASS);  // south meadow
  fill(2,20,5,9,T.GRASS);   // far north clearing

  // Flowers
  [[4,19],[5,17],[3,23],[4,22],[9,6],[13,7],[14,20],[13,22],[2,21]].forEach(([r,c])=>{
    if(g[r][c]===T.GRASS) g[r][c]=T.FLOWER;
  });

  // Campfire station at (10,8) — handled as a zone station
  return g;
}

function buildGardenMap() {
  const cols=22, rows=28;
  const g = Array.from({length:rows}, ()=>Array(cols).fill(T.TREE));
  const fill=(r,c,h,w,t)=>{ for(let i=r;i<r+h;i++) for(let j=c;j<c+w;j++){ if(i>=0&&i<rows&&j>=0&&j<cols) g[i][j]=t; }};

  // Entry from south — connects to village north exit (cols 19-20 in village → cols 10-11 here)
  g[27][10]=T.EXIT; g[27][11]=T.EXIT; g[26][10]=T.EXIT; g[26][11]=T.EXIT;

  // Main mountain path winding north
  for(let r=22;r<26;r++){ g[r][10]=T.PATH; g[r][11]=T.PATH; }
  // Bend west then north
  for(let c=7;c<11;c++){ g[22][c]=T.PATH; g[21][c]=T.PATH; }
  for(let r=16;r<=22;r++){ g[r][7]=T.PATH; g[r][8]=T.PATH; }
  // Open terraced area
  for(let c=7;c<16;c++){ g[16][c]=T.PATH; g[17][c]=T.PATH; }
  for(let r=10;r<=16;r++){ g[r][15]=T.PATH; }
  for(let c=10;c<16;c++){ g[10][c]=T.PATH; }
  // Upper garden path
  for(let r=5;r<=10;r++){ g[r][10]=T.PATH; g[r][11]=T.PATH; }
  for(let c=7;c<12;c++){ g[5][c]=T.PATH; }

  // Lower valley (open)
  fill(19,5,7,14,T.GRASS);
  // Garden terraces (dirt beds)
  fill(12,9,5,8,T.DIRT);
  fill(11,14,3,4,T.DIRT);
  fill(7,6,5,6,T.GRASS);
  fill(3,8,5,8,T.GRASS);   // upper garden

  // Stone wall gate position (col 15, rows 13-15) — partial wall
  g[13][15]=T.WALL; g[14][15]=T.WALL;

  // Stream trickle on right side
  for(let r=4;r<20;r++) g[r][18]=T.WATER;

  // Flowers in upper garden
  [[4,9],[5,11],[6,8],[3,13],[8,7],[9,9]].forEach(([r,c])=>{
    if(g[r][c]==='undefined'||g[r][c]===T.GRASS||g[r][c]===T.DIRT) g[r][c]=T.FLOWER;
  });

  return g;
}

function buildTempleMap() {
  const cols=28, rows=22;
  const g = Array.from({length:rows}, ()=>Array(cols).fill(T.TREE));
  const fill=(r,c,h,w,t)=>{ for(let i=r;i<r+h;i++) for(let j=c;j<c+w;j++){ if(i>=0&&i<rows&&j>=0&&j<cols) g[i][j]=t; }};

  // Entry from north — connects to village south exit (cols 19-20 in village → cols 13-14 here)
  g[0][13]=T.EXIT; g[0][14]=T.EXIT; g[1][13]=T.EXIT; g[1][14]=T.EXIT;

  // Long ceremonial path south
  for(let r=2;r<19;r++){ g[r][13]=T.PATH; g[r][14]=T.PATH; }

  // Wide entry plaza
  fill(1,10,4,8,T.DIRT);

  // Ancient stone ruins flanking path
  fill(5,5,5,4,T.DIRT);   // west ruins
  fill(5,19,5,4,T.DIRT);  // east ruins
  g[5][5]=T.WALL;  g[5][6]=T.WALL;  g[5][8]=T.WALL;
  g[5][19]=T.WALL; g[5][20]=T.WALL; g[5][22]=T.WALL;
  g[8][5]=T.WALL;  g[8][8]=T.WALL;
  g[8][19]=T.WALL; g[8][22]=T.WALL;

  // Mid clearing — stone circle
  fill(9,9,5,10,T.DIRT);
  [[10,11],[10,12],[10,14],[10,15],[12,11],[12,15],[11,10],[11,16]].forEach(([r,c])=>g[r][c]=T.WALL);

  // Temple facade at south (rows 16-20, cols 9-18)
  fill(16,9,5,10,T.DIRT);
  for(let c=9;c<19;c++){ g[16][c]=T.WALL; }
  for(let r=16;r<20;r++){ g[r][9]=T.WALL; g[r][18]=T.WALL; }
  g[17][13]=T.DOOR; g[17][14]=T.DOOR; // temple door (closed — story locked)
  for(let c=10;c<13;c++) g[16][c]=T.WALL;
  for(let c=15;c<18;c++) g[16][c]=T.WALL;

  // Grass clearings beside path
  fill(3,5,14,5,T.GRASS);  // west
  fill(3,18,14,5,T.GRASS); // east

  // Flowers/atmosphere
  [[4,6],[6,7],[13,6],[14,7],[4,20],[6,21],[13,21]].forEach(([r,c])=>{
    if(g[r][c]===T.GRASS||g[r][c]===T.DIRT) g[r][c]=T.FLOWER;
  });

  return g;
}

function buildMarketMap() {
  const cols=30, rows=22;
  const g = Array.from({length:rows}, ()=>Array(cols).fill(T.TREE));
  const fill=(r,c,h,w,t)=>{ for(let i=r;i<r+h;i++) for(let j=c;j<c+w;j++){ if(i>=0&&i<rows&&j>=0&&j<cols) g[i][j]=t; }};

  // Entry from west — connects to village east exit (rows 19-20 in village → rows 10-11 here)
  g[10][0]=T.EXIT; g[11][0]=T.EXIT; g[10][1]=T.EXIT; g[11][1]=T.EXIT;

  // Entry road from west
  for(let c=2;c<8;c++){ g[10][c]=T.PATH; g[11][c]=T.PATH; }

  // Main market square (open dirt)
  fill(4,7,14,16,T.DIRT);

  // Cobbled central area
  fill(7,10,8,10,T.PATH);

  // Well in centre
  g[11][14]=T.FOUNTAIN;

  // Stall row — north side (rows 4-7, with WALL backs)
  fill(4,8,3,4,T.DIRT);  g[4][8]=T.WALL; g[4][9]=T.WALL; g[4][10]=T.WALL; g[4][11]=T.WALL;
  fill(4,13,3,4,T.DIRT); g[4][13]=T.WALL; g[4][14]=T.WALL; g[4][15]=T.WALL; g[4][16]=T.WALL;
  fill(4,18,3,4,T.DIRT); g[4][18]=T.WALL; g[4][19]=T.WALL; g[4][20]=T.WALL; g[4][21]=T.WALL;

  // Stall row — east side
  fill(8,23,4,3,T.DIRT); for(let r=8;r<12;r++) g[r][25]=T.WALL;
  fill(12,23,4,3,T.DIRT); for(let r=12;r<16;r++) g[r][25]=T.WALL;

  // Side paths
  for(let r=4;r<18;r++){ g[r][7]=T.PATH; } // west side path
  for(let r=4;r<18;r++){ g[r][22]=T.PATH; } // east side path
  for(let c=7;c<23;c++){ g[4][c]=T.PATH; g[17][c]=T.PATH; } // north/south border paths

  // Grass/trees framing
  fill(1,6,3,18,T.GRASS);
  fill(18,6,3,18,T.GRASS);

  // Flowers around square
  [[2,8],[2,14],[2,20],[19,9],[19,16],[19,22]].forEach(([r,c])=>{
    if(g[r][c]===T.GRASS) g[r][c]=T.FLOWER;
  });

  return g;
}

// ── OUTDOOR ZONES ──────────────────────────────────────────────
const ZONES = {
  forest: {
    id:'forest', name:'The Birchwood',
    grid: buildForestMap(),
    items:[
      { itemId:'common_herb',   col:19, row:4,  label:'Wild herbs in a sunny patch',     respawn:true  },
      { itemId:'common_herb',   col:9,  row:8,  label:'Herbs at the edge of the path',   respawn:true  },
      { itemId:'root',          col:15, row:5,  label:'Roots by the stream bank',        respawn:true  },
      { itemId:'root',          col:14, row:16, label:'Tangled roots in the meadow',     respawn:false },
      { itemId:'honey',         col:7,  row:8,  label:'Wild honeycomb in the hollow',    respawn:false },
      { itemId:'mint_herb',     col:21, row:9,  label:'Mint growing near the water',     respawn:true  },
      { itemId:'lavender',      col:4,  row:5,  label:'Wild lavender in the clearing',   respawn:true  },
      { itemId:'common_herb',   col:23, row:4,  label:'Herbs in the north clearing',     respawn:true  },
    ],
    stations:[{ type:'campfire', col:8, row:10, label:'Campfire 🏕️' }],
    npcs:[],
    exits:[
      { label:'Back to village', targetScene:'village', fromZone:'forest', col:30, row:10 },
      { label:'Back to village', targetScene:'village', fromZone:'forest', col:31, row:10 },
      { label:'Back to village', targetScene:'village', fromZone:'forest', col:30, row:11 },
      { label:'Back to village', targetScene:'village', fromZone:'forest', col:31, row:11 },
    ],
  },

  garden: {
    id:'garden', name:"Gallan's Garden",
    grid: buildGardenMap(),
    items:[
      { itemId:'healing_herb', col:11, row:13, label:"Gallan's healing herb patch",   respawn:true  },
      { itemId:'healing_herb', col:14, row:12, label:'More healing herbs',            respawn:true  },
      { itemId:'lavender',     col:9,  row:13, label:'Rows of lavender',              respawn:true  },
      { itemId:'spice_herb',   col:12, row:14, label:'Spice herbs in the terrace',    respawn:true  },
      { itemId:'common_herb',  col:8,  row:8,  label:'Common herbs in the upper bed', respawn:true  },
      { itemId:'root',         col:10, row:12, label:'Roots ready to harvest',        respawn:false },
      { itemId:'knotted_cord', col:10, row:7,  label:'A knotted cord on a post',     respawn:false, oneTime:true },
      { itemId:'garden_key',   col:9,  row:6,  label:'Small key under a stone',      respawn:false, oneTime:true },
    ],
    stations:[],
    npcs:[],
    exits:[
      { label:'Return to village', targetScene:'village', fromZone:'garden', col:10, row:26 },
      { label:'Return to village', targetScene:'village', fromZone:'garden', col:11, row:26 },
      { label:'Return to village', targetScene:'village', fromZone:'garden', col:10, row:27 },
      { label:'Return to village', targetScene:'village', fromZone:'garden', col:11, row:27 },
    ],
  },

  temple_path: {
    id:'temple_path', name:'The Old Temple Road',
    grid: buildTempleMap(),
    items:[
      { itemId:'stone_fragment', col:6,  row:6,  label:'Carved stone in the ruins',       respawn:false },
      { itemId:'stone_fragment', col:21, row:7,  label:'Worn stone with faded markings',  respawn:false },
      { itemId:'common_herb',   col:6,  row:13, label:'Herbs growing in old stonework',   respawn:true  },
      { itemId:'common_herb',   col:21, row:12, label:'Herbs in the east ruins',          respawn:true  },
      { itemId:'lavender',      col:7,  row:4,  label:'Lavender beside the path',         respawn:true  },
    ],
    stations:[],
    npcs:[],
    exits:[
      { label:'Return to village', targetScene:'village', fromZone:'temple_path', col:13, row:0 },
      { label:'Return to village', targetScene:'village', fromZone:'temple_path', col:14, row:0 },
      { label:'Return to village', targetScene:'village', fromZone:'temple_path', col:13, row:1 },
      { label:'Return to village', targetScene:'village', fromZone:'temple_path', col:14, row:1 },
    ],
  },

  market: {
    id:'market', name:'The Market Road',
    grid: buildMarketMap(),
    items:[],
    stations:[],
    npcs:[
      {
        id:'sera_market', name:'Sera', emoji:'🧑‍🦳', col:9, row:5,
        color:'#c09070', scene:'market', shop:'sera_stall', stationary:true,
        lines:[
          "Good morning! Fresh herbs and fruit today.",
          "The bees have been busy — got lovely honey in.",
          "I always save the best herbs for healing. You never know when you'll need them.",
          "Take care on the road north. The old mountain path can be treacherous.",
        ],
      },
      {
        id:'tool_vendor', name:'Edric', emoji:'🧔', col:14, row:5,
        color:'#907060', scene:'market', shop:'tool_stall', stationary:true,
        lines:[
          "Best tools this side of the mountain. Guaranteed.",
          "Iron fittings fresh from the forge. Good price.",
          "You building something? I can sort you out.",
        ],
      },
      {
        id:'fabric_merchant', name:'Marta', emoji:'👩', col:20, row:5,
        color:'#b08070', scene:'market', shop:'fabric_stall', stationary:true,
        lines:[
          "Fine cloth, all hand-spun. Nothing finer in the valley.",
          "Looking for something specific? I can order it in.",
          "The dyes this season are beautiful. You should see the new bolts.",
        ],
      },
      {
        id:'travelling_trader', name:'Davan', emoji:'🧳', col:24, row:9,
        color:'#608080', scene:'market', shop:'trader_stall', stationary:true,
        lines:[
          "Fresh in from the eastern passes. Rare goods.",
          "Glass panes — you won't find these in the village. Trust me.",
          "I travel light, trade heavy. What are you looking for?",
        ],
      },
    ],
    exits:[
      { label:'Back to village', targetScene:'village', fromZone:'market', col:0, row:10 },
      { label:'Back to village', targetScene:'village', fromZone:'market', col:1, row:10 },
      { label:'Back to village', targetScene:'village', fromZone:'market', col:0, row:11 },
      { label:'Back to village', targetScene:'village', fromZone:'market', col:1, row:11 },
    ],
  },
};
