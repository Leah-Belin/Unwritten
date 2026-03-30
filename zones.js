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

  // Temple grounds at south — open dirt plaza behind the PNG overlay
  fill(16,9,5,10,T.DIRT);

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
    id:'garden', name:"Galen's Garden",
    grid: buildGardenMap(),
    items:[
      { itemId:'healing_herb', col:11, row:13, label:"Galen's healing herb patch",   respawn:true  },
      { itemId:'healing_herb', col:14, row:12, label:'More healing herbs',            respawn:true  },
      { itemId:'lavender',     col:9,  row:13, label:'Rows of lavender',              respawn:true  },
      { itemId:'spice_herb',   col:12, row:14, label:'Spice herbs in the terrace',    respawn:true  },
      { itemId:'common_herb',  col:8,  row:8,  label:'Common herbs in the upper bed', respawn:true  },
      { itemId:'root',         col:10, row:12, label:'Roots ready to harvest',        respawn:false },
      { itemId:'knotted_cord', col:10, row:7,  label:'A knotted cord on a post',     respawn:false, oneTime:true },
      { itemId:'garden_key',   col:9,  row:6,  label:'Small key under a stone',      respawn:false, oneTime:true },
    ],
    stations:[],
    npcs:[{ id:'galen', col:12, row:10 }],
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
