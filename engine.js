
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

// Draw mortar/grain texture lines on a face, clipped to the parallelogram shape.
function drawWallTexture(x, y, bh, face, texture) {
  const hw=TW/2, hh=TH/2;
  const x0 = face==='left' ? x-hw : x;
  const faceW=hw, faceH=bh+hh;
  ctx.save();
  ctx.beginPath();
  if (face==='left') {
    ctx.moveTo(x-hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
  } else {
    ctx.moveTo(x+hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x,y+hh); ctx.lineTo(x+hw,y);
  }
  ctx.clip();
  ctx.strokeStyle='rgba(0,0,0,0.18)';
  if (texture==='wood') {
    ctx.lineWidth=0.7;
    for (let dy=7; dy<faceH+7; dy+=7) {
      ctx.beginPath(); ctx.moveTo(x0-4,y-bh+dy); ctx.lineTo(x0+faceW+4,y-bh+dy); ctx.stroke();
    }
    ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.lineWidth=0.4;
    for (let dx=5; dx<faceW; dx+=9) {
      ctx.beginPath(); ctx.moveTo(x0+dx,y-bh-2); ctx.lineTo(x0+dx-2,y+hh+2); ctx.stroke();
    }
  } else if (texture==='brick') {
    ctx.lineWidth=0.7;
    const bH=5,bW=11; let row=0;
    for (let dy=0; dy<faceH+bH; dy+=bH+1,row++) {
      ctx.beginPath(); ctx.moveTo(x0-4,y-bh+dy); ctx.lineTo(x0+faceW+4,y-bh+dy); ctx.stroke();
      const xOff=(row%2===0)?0:(bW+1)/2;
      for (let dx=xOff; dx<faceW+bW; dx+=bW+1) {
        ctx.beginPath(); ctx.moveTo(x0+dx,y-bh+dy); ctx.lineTo(x0+dx,y-bh+dy+bH+1); ctx.stroke();
      }
    }
  } else if (texture==='stone'||texture==='stone_cut') {
    ctx.lineWidth=0.8;
    const rows=texture==='stone_cut'?[14,14,14,14]:[11,13,12,14];
    let curY=0,ri=0;
    while(curY<faceH+20) {
      const sh=rows[ri%rows.length];
      ctx.beginPath(); ctx.moveTo(x0-4,y-bh+curY); ctx.lineTo(x0+faceW+4,y-bh+curY); ctx.stroke();
      const vxList=(ri%2===0)?[9,22,32]:[4,16,28,38];
      for(const vx of vxList) {
        if(vx<faceW){ ctx.beginPath(); ctx.moveTo(x0+vx,y-bh+curY); ctx.lineTo(x0+vx,y-bh+curY+sh); ctx.stroke(); }
      }
      curY+=sh+1; ri++;
    }
  }
  ctx.restore();
}

// ── DRAWING HELPERS ───────────────────────────────────────────

// Draw a perspective-correct window inset on one face of a raised tile.
// face: 'left' (SW-facing) or 'right' (SE-facing)
// large: wider display window (bakery)
function drawFaceWindow(x, y, bh, face, large, fillCol, borderCol) {
  const hw = TW/2, hh = TH/2;
  const u1 = large ? 0.10 : 0.20, u2 = large ? 0.90 : 0.80;
  const v1 = 0.18, v2 = 0.80;
  // Face corners: BL, BR, TL, TR
  let BL, BR, TL, TR;
  if (face === 'right') {
    BL=[x,    y+hh];      BR=[x+hw, y];
    TL=[x,    y+hh-bh];   TR=[x+hw, y-bh];
  } else {
    BL=[x-hw, y];         BR=[x,    y+hh];
    TL=[x-hw, y-bh];      TR=[x,    y+hh-bh];
  }
  // Bilinear point on face
  function pt(u,v) {
    const bx=BL[0]+u*(BR[0]-BL[0]), by=BL[1]+u*(BR[1]-BL[1]);
    const tx=TL[0]+u*(TR[0]-TL[0]), ty=TL[1]+u*(TR[1]-TL[1]);
    return [bx+v*(tx-bx), by+v*(ty-by)];
  }
  const wTL=pt(u1,v2), wTR=pt(u2,v2), wBR=pt(u2,v1), wBL=pt(u1,v1);
  // Pane fill
  ctx.beginPath();
  ctx.moveTo(wTL[0],wTL[1]); ctx.lineTo(wTR[0],wTR[1]);
  ctx.lineTo(wBR[0],wBR[1]); ctx.lineTo(wBL[0],wBL[1]);
  ctx.closePath(); ctx.fillStyle=fillCol; ctx.fill();
  // Border
  ctx.strokeStyle=borderCol; ctx.lineWidth=0.8; ctx.stroke();
  // Mullion cross
  const mH=pt((u1+u2)/2,v1), mHt=pt((u1+u2)/2,v2);
  const mVl=pt(u1,(v1+v2)/2), mVr=pt(u2,(v1+v2)/2);
  ctx.strokeStyle=borderCol; ctx.lineWidth=0.7;
  ctx.beginPath(); ctx.moveTo(mH[0],mH[1]);  ctx.lineTo(mHt[0],mHt[1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mVl[0],mVl[1]); ctx.lineTo(mVr[0],mVr[1]); ctx.stroke();
}

// Draw a small stone chimney on top of a tile, offset toward the NW corner.
// Called after the main tile box is painted so it sits on top.
function drawChimney(x, y, bh) {
  const ch=14, cw=4;
  const cx=x-12, cy=y-bh-5; // NW area of tile top, just above surface
  // Left face
  ctx.beginPath();
  ctx.moveTo(cx-cw, cy-ch); ctx.lineTo(cx, cy-ch+cw*0.5);
  ctx.lineTo(cx, cy);        ctx.lineTo(cx-cw, cy-cw*0.5);
  ctx.closePath(); ctx.fillStyle='#585048'; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.6; ctx.stroke();
  // Right face
  ctx.beginPath();
  ctx.moveTo(cx+cw, cy-ch); ctx.lineTo(cx, cy-ch+cw*0.5);
  ctx.lineTo(cx, cy);        ctx.lineTo(cx+cw, cy-cw*0.5);
  ctx.closePath(); ctx.fillStyle='#706860'; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.6; ctx.stroke();
  // Top cap
  ctx.beginPath();
  ctx.moveTo(cx, cy-ch-cw*0.5); ctx.lineTo(cx+cw, cy-ch);
  ctx.lineTo(cx, cy-ch+cw*0.5); ctx.lineTo(cx-cw, cy-ch);
  ctx.closePath(); ctx.fillStyle='#888078'; ctx.fill();
  // Smoke wisps (in cooler periods)
  const p = State.period;
  if (p === 0 || p === 1 || p >= 4) {
    const t = Date.now()*0.0015;
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(t+x*0.1)*0.08;
    ctx.fillStyle='#c8c8c0';
    ctx.beginPath(); ctx.ellipse(cx-1, cy-ch-7,  2.5, 4,   0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx-2, cy-ch-14, 3.5, 5.5, 0.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
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

  if (def.fountain) {
    const hw=TW/2, hh=TH/2;
    const basinH=10; // height of basin rim above ground
    // Left face of basin rim
    ctx.beginPath();
    ctx.moveTo(x-hw+3, y-basinH); ctx.lineTo(x, y+hh-basinH);
    ctx.lineTo(x, y+hh);          ctx.lineTo(x-hw+3, y);
    ctx.closePath(); ctx.fillStyle='#888090'; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.7; ctx.stroke();
    // Right face of basin rim
    ctx.beginPath();
    ctx.moveTo(x+hw-3, y-basinH); ctx.lineTo(x, y+hh-basinH);
    ctx.lineTo(x, y+hh);          ctx.lineTo(x+hw-3, y);
    ctx.closePath(); ctx.fillStyle='#a0a0b0'; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=0.7; ctx.stroke();
    // Top rim (flat diamond at basinH)
    ctx.beginPath();
    ctx.moveTo(x, y-hh-basinH); ctx.lineTo(x+hw-3, y-basinH);
    ctx.lineTo(x, y+hh-basinH); ctx.lineTo(x-hw+3, y-basinH);
    ctx.closePath(); ctx.fillStyle='#b0b0c0'; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=0.6; ctx.stroke();
    // Water pool (inset diamond)
    const ps=9; // pool shrink
    ctx.beginPath();
    ctx.moveTo(x, y-hh-basinH+3);       ctx.lineTo(x+hw-3-ps, y-basinH+ps*0.5);
    ctx.lineTo(x, y+hh-basinH-ps*0.5);  ctx.lineTo(x-hw+3+ps, y-basinH+ps*0.5);
    ctx.closePath();
    const wc=['#3870a8','#5090c0','#60a8cc','#4888b8','#305890','#284070','#1c2c50'][State.period];
    ctx.fillStyle=wc; ctx.fill();
    ctx.strokeStyle='rgba(140,210,255,0.5)'; ctx.lineWidth=0.5; ctx.stroke();
    // Pedestal (thin raised box at centre)
    const pedH=18, pedW=4;
    ctx.beginPath();
    ctx.moveTo(x-pedW, y-basinH-pedH); ctx.lineTo(x, y-basinH-pedH+pedW*0.5);
    ctx.lineTo(x, y-basinH);           ctx.lineTo(x-pedW, y-basinH-pedW*0.5);
    ctx.closePath(); ctx.fillStyle='#787080'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x+pedW, y-basinH-pedH); ctx.lineTo(x, y-basinH-pedH+pedW*0.5);
    ctx.lineTo(x, y-basinH);           ctx.lineTo(x+pedW, y-basinH-pedW*0.5);
    ctx.closePath(); ctx.fillStyle='#9090a0'; ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y-basinH-pedH, pedW, pedW*0.5, 0, 0, Math.PI*2);
    ctx.fillStyle='#a0a0b0'; ctx.fill();
    // Water jets — three arching streams, gently animated
    const t=Date.now()*0.002;
    ctx.save();
    ctx.globalAlpha=0.72+Math.sin(t)*0.12;
    ctx.strokeStyle='rgba(170,220,255,0.85)'; ctx.lineWidth=1.4;
    const jBase=[x, y-basinH-pedH]; // jet origin (top of pedestal)
    const jets=[
      [jBase[0]-10, y-basinH-3],  // left arc
      [jBase[0]+10, y-basinH-3],  // right arc
      [jBase[0],    y-basinH-3],  // centre drop
    ];
    for (const [ex,ey] of jets) {
      const mx=(jBase[0]+ex)/2, my=Math.min(jBase[1],ey)-14+Math.sin(t*1.3)*2;
      ctx.beginPath(); ctx.moveTo(jBase[0],jBase[1]);
      ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
    }
    ctx.restore();
    return;
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
  if (def.exit) {
    // Golden path with a small signpost arrow
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 500);
    ctx.strokeStyle = `rgba(220,180,30,${pulse})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x,y-hh); ctx.lineTo(x+hw,y); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y); ctx.closePath(); ctx.stroke();
    ctx.font = '11px serif'; ctx.textAlign = 'center';
    ctx.fillText('➤', x, y+3);
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
    // Interior walls are short so the room is visible.
    // The "near" sides (bottom row, right col) are almost flush with the floor
    // so they don't obscure the interior from the isometric camera.
    let bh = def.raised;
    if (currentBuilding) {
      const nearSide = (r === mapRows-1 || c === mapCols-1);
      bh = nearSide ? 3 : 9;
    }
    // Resolve building-specific colors when in the village
    let leftCol=def.left, rightCol=def.right, topCol=def.top;
    let bldg=null, style=null;
    if (!currentBuilding) {
      bldg = getBuildingAtTile(c, r);
      if (bldg) {
        style = BUILDING_STYLES[bldg.id];
        if (style) {
          const isRoof = (currentMap[r]?.[c] === T.BUILDING); // interior tile = roof
          if (isRoof) {
            leftCol=style.roof; rightCol=style.roof; topCol=style.roof;
          } else {
            leftCol=style.wallL; rightCol=style.wallR; topCol=style.wall;
          }
        }
      }
    }
    // Left face
    ctx.beginPath();
    ctx.moveTo(x-hw, y-bh); ctx.lineTo(x, y+hh-bh);
    ctx.lineTo(x, y+hh);    ctx.lineTo(x-hw, y);
    ctx.closePath(); ctx.fillStyle=leftCol; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8; ctx.stroke();
    // Right face
    ctx.beginPath();
    ctx.moveTo(x+hw, y-bh); ctx.lineTo(x, y+hh-bh);
    ctx.lineTo(x, y+hh);    ctx.lineTo(x+hw, y);
    ctx.closePath(); ctx.fillStyle=rightCol; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8; ctx.stroke();
    // Top face
    ctx.beginPath();
    ctx.moveTo(x, y-hh-bh); ctx.lineTo(x+hw, y-bh);
    ctx.lineTo(x, y+hh-bh); ctx.lineTo(x-hw, y-bh);
    ctx.closePath(); ctx.fillStyle=topCol; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.6; ctx.stroke();

    // Building details — windows and chimneys on WALL tiles in village mode
    if (!currentBuilding && bldg && style && currentMap[r]?.[c] === T.WALL) {
      const onS = r===bldg.rMax, onE=c===bldg.cMax, onN=r===bldg.rMin, onW=c===bldg.cMin;
      const isCorner = (onS||onN)&&(onE||onW);
      if (!isCorner) {
        const glowing = State.period >= 4; // dusk→night: warm light inside
        const winFill   = glowing ? 'rgba(190,140,50,0.88)' : 'rgba(12,8,4,0.92)';
        const winBorder = '#807060';
        if (onS && !onE && !onW) drawFaceWindow(x, y, bh, 'right', style.bigWindows||false, winFill, winBorder);
        if (onE && !onS && !onN) drawFaceWindow(x, y, bh, 'left',  style.bigWindows||false, winFill, winBorder);
      }
      if (style.chimney && r===bldg.rMin && c===bldg.cMin) drawChimney(x, y, bh);
      drawWallTexture(x, y, bh, 'left',  style.texture);
      drawWallTexture(x, y, bh, 'right', style.texture);
    }
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

// ── FURNITURE DRAWING ──────────────────────────────────────────
// Iso-box helper: left/right/top faces
function _isoBox(x, y, hw, hh, bh, topC, leftC, rightC, lw=0.75) {
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x-hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
  ctx.closePath(); ctx.fillStyle=leftC; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.30)'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x,y+hh); ctx.lineTo(x+hw,y);
  ctx.closePath(); ctx.fillStyle=rightC; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.30)'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x,y-hh-bh); ctx.lineTo(x+hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x-hw,y-bh);
  ctx.closePath(); ctx.fillStyle=topC; ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.16)'; ctx.stroke();
}

// Wood grain lines clipped to iso-box top face
function _woodGrain(x, y, hw, hh, bh) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x,y-hh-bh); ctx.lineTo(x+hw,y-bh); ctx.lineTo(x,y+hh-bh); ctx.lineTo(x-hw,y-bh);
  ctx.closePath(); ctx.clip();
  ctx.strokeStyle='rgba(80,40,10,0.10)'; ctx.lineWidth=0.7;
  for (let i=-5; i<=5; i++) {
    const ox = i * hw * 0.22;
    ctx.beginPath();
    ctx.moveTo(x+ox-hw*0.6, y-bh-hh*0.5); ctx.lineTo(x+ox+hw*0.6, y-bh+hh*0.5); ctx.stroke();
  }
  ctx.restore();
}

// Render an emoji centred on the tile with a drop shadow
function _furnitureEmoji(x, y, emoji, size, yOff=0) {
  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillText(emoji, x, y + yOff);
  ctx.restore();
}

function drawFurniturePiece(piece) {
  const {x,y} = toScreen(piece.col, piece.row);
  const HW=TW/2, HH=TH/2;

  switch (piece.type) {

    case 'table': {
      // Clean flat surface — legs hidden below, just show the top
      const s=0.62, hw=HW*s, hh=HH*s, bh=9;
      // Leg stubs (just visible below the top)
      const legC='#6a4020';
      ctx.fillStyle=legC;
      [[x-hw*0.48,y+hh*0.45],[x+hw*0.48,y+hh*0.45],
       [x-hw*0.48,y-hh*0.45],[x+hw*0.48,y-hh*0.45]].forEach(([lx,ly])=>{
        ctx.beginPath(); ctx.moveTo(lx-2,ly-1); ctx.lineTo(lx,ly+hh*0.5);
        ctx.lineTo(lx+2,ly+hh*0.5); ctx.lineTo(lx+4,ly-1); ctx.closePath(); ctx.fill();
      });
      _isoBox(x, y, hw, hh, bh, '#d4aa68','#8a5a2e','#b07838');
      _woodGrain(x, y, hw, hh, bh);
      break;
    }

    case 'counter': {
      const s=0.66, hw=HW*s, hh=HH*s, bh=13;
      _isoBox(x, y, hw, hh, bh, '#c09050','#7a4e26','#a07038');
      // Horizontal plank lines on sides
      ctx.strokeStyle='rgba(0,0,0,0.10)'; ctx.lineWidth=0.65;
      for (let i=1; i<4; i++) {
        const t=i/4;
        ctx.beginPath(); ctx.moveTo(x-hw,y-bh*(1-t)); ctx.lineTo(x,y+hh-bh*(1-t)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+hw,y-bh*(1-t)); ctx.lineTo(x,y+hh-bh*(1-t)); ctx.stroke();
      }
      _woodGrain(x, y, hw, hh, bh);
      break;
    }

    case 'chair':
      _furnitureEmoji(x, y, '🪑', 22, -4);
      break;

    case 'stool':
      _furnitureEmoji(x, y, '🪑', 16, -2);
      break;

    case 'bed':
      _furnitureEmoji(x, y, '🛏️', 32, -6);
      break;

    case 'cot':
      _furnitureEmoji(x, y, '🛏️', 26, -4);
      break;

    case 'barrel': {
      const s=0.28, hw=HW*s, hh=HH*s, bh=16;
      const topY = y - bh;
      // Left face (slightly curved via two segments)
      ctx.beginPath();
      ctx.moveTo(x-hw*0.82, topY+hh*0.82);
      ctx.quadraticCurveTo(x-hw*1.1, y-bh*0.45+hh*0.45, x-hw, y+hh*0.25);
      ctx.lineTo(x, y+hh); ctx.lineTo(x, topY+hh); ctx.closePath();
      ctx.fillStyle='#7a5820'; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=0.7; ctx.stroke();
      // Right face
      ctx.beginPath();
      ctx.moveTo(x+hw*0.82, topY+hh*0.82);
      ctx.quadraticCurveTo(x+hw*1.1, y-bh*0.45+hh*0.45, x+hw, y+hh*0.25);
      ctx.lineTo(x, y+hh); ctx.lineTo(x, topY+hh); ctx.closePath();
      ctx.fillStyle='#6a4c18'; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=0.7; ctx.stroke();
      // Top ellipse
      ctx.beginPath(); ctx.ellipse(x, topY+hh*0.85, hw*0.85, hh*0.85, 0, 0, Math.PI*2);
      ctx.fillStyle='#8a6428'; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.38)'; ctx.lineWidth=0.85; ctx.stroke();
      // Metal hoops
      ctx.strokeStyle='rgba(40,28,10,0.60)'; ctx.lineWidth=1.1;
      for (const frac of [0.22, 0.54, 0.84]) {
        const hy = topY+hh*0.85 + (y+hh - topY - hh*0.85)*frac;
        const hw2 = hw*(0.80+0.22*Math.sin(frac*Math.PI));
        ctx.beginPath(); ctx.moveTo(x-hw2,hy); ctx.lineTo(x,hy+hh*0.70); ctx.lineTo(x+hw2,hy); ctx.stroke();
      }
      break;
    }

    case 'shelf': {
      const s=0.56, hw=HW*s, hh=HH*s, bh=20;
      // Back panel
      _isoBox(x-hw*0.04, y, hw, hh*0.16, bh, '#9a7848','#685030','#887040');
      // Three shelf planks with coloured jars
      const jarColors = ['#8ab880','#c08060','#7898c0','#d4a840','#a07888'];
      for (let si=0; si<3; si++) {
        const sby = y - bh*(0.16+si*0.29);
        _isoBox(x, sby, hw*0.86, hh*0.42, 2.2, '#b09050','#786038','#988048');
        if (si < 2) {
          for (let ji=0; ji<3; ji++) {
            const jx = x - hw*0.38 + ji*hw*0.40;
            const jy = sby - 2.2 - hh*0.20;
            const jc = jarColors[(si*3+ji)%jarColors.length];
            ctx.fillStyle=jc;
            ctx.beginPath(); ctx.ellipse(jx, jy-3, 2.6, 1.5, 0.3, 0, Math.PI*2); ctx.fill();
            ctx.fillRect(jx-2.2, jy-8, 4.4, 5);
            ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=0.5; ctx.strokeRect(jx-2.2, jy-8, 4.4, 5);
          }
        }
      }
      break;
    }

    case 'chest':
      _furnitureEmoji(x, y, '📦', 26, -4);
      break;

    default: break;
  }
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
  currentFurniture.forEach(f => items.push({k:'furniture',f,z:f.row+f.col+0.55}));
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
    else if (d.k==='furniture') drawFurniturePiece(d.f);
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
    if (npc.stationary) return; // stall holders etc. stay put
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

    // ── Furniture click — walk to adjacent tile (never an exit) ──
    for (const f of currentFurniture) {
      const {x:fx, y:fy} = toScreen(f.col, f.row);
      if (Math.abs(sx-fx) < 34 && Math.abs(sy-fy) < 26) {
        const adj = [[0,-1],[-1,0],[1,0],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]
          .map(([dc,dr]) => ({col:f.col+dc, row:f.row+dr}))
          .filter(p => walkable(p.col, p.row)
                    && !currentExits.some(e => e.col===p.col && e.row===p.row))
          .sort((a,b) => (Math.abs(a.col-player.col)+Math.abs(a.row-player.row))
                       - (Math.abs(b.col-player.col)+Math.abs(b.row-player.row)))[0];
        if (adj) player.path = astar(player.col, player.row, adj.col, adj.row);
        return;
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
  market: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" style="width:100%;height:100%;background:#fdf6ee">
    <!-- Sky -->
    <rect width="400" height="300" fill="#fdf6ee"/>
    <!-- Peach cloud left -->
    <ellipse cx="80" cy="40" rx="55" ry="18" fill="#f5cdb4" opacity="0.6"/>
    <ellipse cx="55" cy="48" rx="30" ry="12" fill="#f5cdb4" opacity="0.5"/>
    <!-- Blue cloud right -->
    <ellipse cx="310" cy="35" rx="50" ry="16" fill="#c8dce8" opacity="0.6"/>
    <ellipse cx="340" cy="44" rx="28" ry="11" fill="#c8dce8" opacity="0.5"/>
    <!-- Cobblestone ground -->
    <rect x="0" y="210" width="400" height="90" fill="#e8d8c0"/>
    <line x1="0" y1="225" x2="400" y2="225" stroke="#c8b89a" stroke-width="0.8"/>
    <line x1="0" y1="245" x2="400" y2="245" stroke="#c8b89a" stroke-width="0.8"/>
    <line x1="0" y1="265" x2="400" y2="265" stroke="#c8b89a" stroke-width="0.8"/>
    <line x1="30" y1="210" x2="30" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="80" y1="210" x2="80" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="130" y1="210" x2="130" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="180" y1="210" x2="180" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="230" y1="210" x2="230" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="280" y1="210" x2="280" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="330" y1="210" x2="330" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <line x1="380" y1="210" x2="380" y2="300" stroke="#c8b89a" stroke-width="0.6"/>
    <!-- LEFT STALL — pink awning -->
    <polygon points="0,80 120,80 105,105 15,105" fill="#e8b4a0" stroke="#5a3a2a" stroke-width="1.2"/>
    <line x1="15" y1="105" x2="105" y2="105" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- scallop fringe -->
    <path d="M15,105 Q25,115 35,105 Q45,115 55,105 Q65,115 75,105 Q85,115 95,105 Q100,115 105,105" fill="none" stroke="#5a3a2a" stroke-width="1"/>
    <!-- stall posts -->
    <rect x="15" y="105" width="5" height="105" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="100" y="105" width="5" height="105" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- stall table -->
    <rect x="5" y="165" width="115" height="10" fill="#d4b890" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="5" y="175" width="115" height="35" fill="#e8d0a8" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- bread loaves on table -->
    <ellipse cx="30" cy="168" rx="10" ry="7" fill="#c8955a" stroke="#5a3a2a" stroke-width="0.8"/>
    <ellipse cx="50" cy="166" rx="11" ry="8" fill="#c8955a" stroke="#5a3a2a" stroke-width="0.8"/>
    <ellipse cx="70" cy="168" rx="10" ry="7" fill="#c8955a" stroke="#5a3a2a" stroke-width="0.8"/>
    <ellipse cx="88" cy="167" rx="9" ry="6" fill="#c8955a" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- sausages hanging -->
    <line x1="30" y1="80" x2="30" y2="120" stroke="#5a3a2a" stroke-width="0.8"/>
    <ellipse cx="30" cy="125" rx="5" ry="8" fill="#a06840" stroke="#5a3a2a" stroke-width="0.8"/>
    <line x1="50" y1="80" x2="50" y2="115" stroke="#5a3a2a" stroke-width="0.8"/>
    <ellipse cx="50" cy="120" rx="4" ry="7" fill="#a06840" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- LEFT stall keeper (round cap, apron) -->
    <circle cx="25" cy="148" r="9" fill="#d4a870" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="18" y="155" width="14" height="12" rx="2" fill="#c8956a" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- apron -->
    <rect x="19" y="157" width="12" height="9" rx="1" fill="#e8e0d0" stroke="#5a3a2a" stroke-width="0.6"/>
    <!-- cap -->
    <ellipse cx="25" cy="141" rx="9" ry="4" fill="#7a6a5a" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- 2nd stall person -->
    <circle cx="55" cy="145" r="9" fill="#c8a068" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="48" y="152" width="14" height="18" rx="2" fill="#b8845a" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- CENTRE STALL — cream tent -->
    <polygon points="160,60 240,60 255,95 145,95" fill="#f0e8d0" stroke="#5a3a2a" stroke-width="1.2"/>
    <path d="M145,95 Q157,107 169,95 Q181,107 193,95 Q205,107 217,95 Q229,107 241,95 Q248,107 255,95" fill="none" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="148" y="95" width="5" height="115" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="250" y="95" width="5" height="115" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- centre table -->
    <rect x="148" y="165" width="108" height="8" fill="#d4b890" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="148" y="173" width="108" height="37" fill="#e8d0a8" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- goods on table -->
    <rect x="158" y="158" width="18" height="10" rx="1" fill="#d4c090" stroke="#5a3a2a" stroke-width="0.7"/>
    <rect x="180" y="156" width="18" height="12" rx="1" fill="#d4c090" stroke="#5a3a2a" stroke-width="0.7"/>
    <rect x="202" y="158" width="16" height="10" rx="1" fill="#d4c090" stroke="#5a3a2a" stroke-width="0.7"/>
    <rect x="222" y="157" width="18" height="11" rx="1" fill="#d4c090" stroke="#5a3a2a" stroke-width="0.7"/>
    <!-- centre NPC -->
    <circle cx="200" cy="143" r="9" fill="#d4a870" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="193" y="150" width="14" height="18" rx="2" fill="#c8a078" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- RIGHT STALL — blue awning -->
    <polygon points="280,75 400,75 400,100 265,100" fill="#b8d0d8" stroke="#5a3a2a" stroke-width="1.2"/>
    <path d="M265,100 Q277,112 289,100 Q301,112 313,100 Q325,112 337,100 Q349,112 361,100 Q373,112 385,100 Q393,112 400,100" fill="none" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="268" y="100" width="5" height="110" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="392" y="100" width="5" height="110" fill="#8a6a50" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- right table / counter -->
    <rect x="320" y="158" width="75" height="10" fill="#d4b890" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="320" y="168" width="75" height="42" fill="#c4a878" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- clothes hanging right -->
    <line x1="310" y1="75" x2="310" y2="145" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="303" y="105" width="14" height="22" rx="2" fill="#a8c0b8" stroke="#5a3a2a" stroke-width="0.8"/>
    <line x1="340" y1="75" x2="340" y2="140" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="333" y="100" width="12" height="25" rx="2" fill="#d0b8a0" stroke="#5a3a2a" stroke-width="0.8"/>
    <line x1="365" y1="75" x2="365" y2="143" stroke="#5a3a2a" stroke-width="0.8"/>
    <rect x="358" y="103" width="13" height="22" rx="2" fill="#c8a8b8" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- right stall keeper -->
    <circle cx="355" cy="150" r="9" fill="#d4a870" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="348" y="157" width="14" height="18" rx="2" fill="#c8956a" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- right stall 2nd person -->
    <circle cx="385" cy="148" r="9" fill="#c8b888" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="378" y="155" width="14" height="22" rx="2" fill="#e0c890" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- barrel (right foreground) -->
    <ellipse cx="305" cy="248" rx="18" ry="10" fill="#c4a060" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="287" y="215" width="36" height="33" fill="#c4a060" stroke="#5a3a2a" stroke-width="1"/>
    <ellipse cx="305" cy="215" rx="18" ry="8" fill="#d4b070" stroke="#5a3a2a" stroke-width="1"/>
    <line x1="287" y1="228" x2="323" y2="228" stroke="#5a3a2a" stroke-width="0.8"/>
    <line x1="287" y1="238" x2="323" y2="238" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- plant in barrel -->
    <ellipse cx="305" cy="210" rx="14" ry="6" fill="#90b878" stroke="#5a3a2a" stroke-width="0.8"/>
    <path d="M300,205 Q305,192 310,205" fill="#78a060" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- FOREGROUND CHILDREN -->
    <!-- girl skipping rope -->
    <circle cx="90" cy="238" r="10" fill="#e8c090" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="83" y="247" width="14" height="20" rx="2" fill="#e8c898" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- rope arc -->
    <path d="M75,265 Q90,285 110,265" fill="none" stroke="#5a3a2a" stroke-width="1.2"/>
    <line x1="83" y1="265" x2="75" y2="265" stroke="#5a3a2a" stroke-width="1"/>
    <line x1="97" y1="265" x2="110" y2="265" stroke="#5a3a2a" stroke-width="1"/>
    <!-- running boy 1 -->
    <circle cx="185" cy="232" r="10" fill="#d4a868" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="178" y="241" width="14" height="18" rx="2" fill="#c8a068" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- hoop -->
    <circle cx="210" cy="260" r="16" fill="none" stroke="#5a3a2a" stroke-width="2"/>
    <!-- running boy 2 -->
    <circle cx="225" cy="228" r="10" fill="#d4b878" stroke="#5a3a2a" stroke-width="1"/>
    <rect x="218" y="237" width="14" height="18" rx="2" fill="#c0a060" stroke="#5a3a2a" stroke-width="0.8"/>
    <!-- birds -->
    <path d="M255,275 Q260,270 265,275" fill="none" stroke="#8a7060" stroke-width="1.5"/>
    <path d="M270,268 Q276,263 282,268" fill="none" stroke="#8a7060" stroke-width="1.5"/>
    <ellipse cx="260" cy="276" rx="5" ry="3" fill="#a08070" stroke="#5a3a2a" stroke-width="0.7"/>
    <ellipse cx="276" cy="269" rx="5" ry="3" fill="#a08070" stroke="#5a3a2a" stroke-width="0.7"/>
    <!-- outline sketch texture lines -->
    <rect x="0" y="0" width="400" height="300" fill="none" stroke="#5a3a2a" stroke-width="1.5" rx="8"/>
  </svg>`,

  bakery: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" style="width:100%;height:100%;background:#fdf0c8">
    <!-- warm golden background -->
    <rect width="400" height="300" fill="#fdf0c8"/>
    <!-- ceiling beams -->
    <rect x="0" y="0" width="400" height="28" fill="#c8a060"/>
    <rect x="0" y="5" width="400" height="6" fill="#b89050" stroke="#8a6830" stroke-width="0.5"/>
    <rect x="60" y="0" width="14" height="28" fill="#a07840" stroke="#8a6830" stroke-width="0.5"/>
    <rect x="160" y="0" width="14" height="28" fill="#a07840" stroke="#8a6830" stroke-width="0.5"/>
    <rect x="260" y="0" width="14" height="28" fill="#a07840" stroke="#8a6830" stroke-width="0.5"/>
    <rect x="350" y="0" width="14" height="28" fill="#a07840" stroke="#8a6830" stroke-width="0.5"/>
    <!-- hanging bundles from beam -->
    <line x1="90" y1="5" x2="90" y2="40" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="90" cy="45" rx="6" ry="9" fill="#c89848" stroke="#8a6830" stroke-width="0.8"/>
    <line x1="115" y1="5" x2="115" y2="50" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="115" cy="55" rx="5" ry="8" fill="#d4a850" stroke="#8a6830" stroke-width="0.8"/>
    <line x1="135" y1="5" x2="135" y2="38" stroke="#8a6830" stroke-width="1"/>
    <!-- herb bundle -->
    <path d="M128,38 Q135,30 142,38" fill="#a0b870" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="135" cy="40" rx="7" ry="4" fill="#90a860" stroke="#8a6830" stroke-width="0.7"/>
    <line x1="200" y1="5" x2="200" y2="42" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="200" cy="48" rx="6" ry="9" fill="#c89848" stroke="#8a6830" stroke-width="0.8"/>
    <!-- wall -->
    <rect x="0" y="28" width="400" height="272" fill="#f0d898"/>
    <!-- LEFT WINDOW -->
    <rect x="18" y="55" width="55" height="65" rx="12" fill="#d0e8f0" stroke="#8a6830" stroke-width="2"/>
    <rect x="18" y="55" width="55" height="65" rx="12" fill="none" stroke="#c8a860" stroke-width="3"/>
    <!-- window curtains -->
    <path d="M18,55 Q28,80 22,120" fill="#e09068" stroke="#8a6830" stroke-width="1"/>
    <path d="M73,55 Q63,80 68,120" fill="#e09068" stroke="#8a6830" stroke-width="1"/>
    <!-- window cross -->
    <line x1="45" y1="55" x2="45" y2="120" stroke="#8a6830" stroke-width="1"/>
    <line x1="18" y1="88" x2="73" y2="88" stroke="#8a6830" stroke-width="1"/>
    <!-- SMALL WINDOW right -->
    <rect x="340" y="50" width="42" height="40" rx="4" fill="#d0e8f0" stroke="#8a6830" stroke-width="1.5"/>
    <line x1="361" y1="50" x2="361" y2="90" stroke="#8a6830" stroke-width="1"/>
    <line x1="340" y1="70" x2="382" y2="70" stroke="#8a6830" stroke-width="1"/>
    <!-- BREAD OVEN / FIREPLACE — centre -->
    <rect x="195" y="80" width="130" height="155" rx="5" fill="#c8a870" stroke="#8a6830" stroke-width="1.5"/>
    <!-- stone blocks on oven -->
    <rect x="195" y="80" width="130" height="155" rx="5" fill="none" stroke="#b89050" stroke-width="0.5"/>
    <!-- stone texture grid -->
    <line x1="215" y1="80" x2="215" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="235" y1="80" x2="235" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="255" y1="80" x2="255" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="275" y1="80" x2="275" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="295" y1="80" x2="295" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="315" y1="80" x2="315" y2="235" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="100" x2="325" y2="100" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="120" x2="325" y2="120" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="140" x2="325" y2="140" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="160" x2="325" y2="160" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="180" x2="325" y2="180" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="200" x2="325" y2="200" stroke="#b89050" stroke-width="0.5"/>
    <line x1="195" y1="220" x2="325" y2="220" stroke="#b89050" stroke-width="0.5"/>
    <!-- oven arch mouth -->
    <path d="M225,235 Q225,175 260,170 Q295,175 295,235" fill="#3a2510" stroke="#8a6830" stroke-width="1.5"/>
    <!-- fire glow -->
    <ellipse cx="260" cy="230" rx="28" ry="12" fill="#f0a020" opacity="0.8"/>
    <ellipse cx="260" cy="218" rx="18" ry="16" fill="#f8c030" opacity="0.7"/>
    <path d="M248,215 Q255,195 260,210 Q265,195 272,215" fill="#ffd040" opacity="0.9"/>
    <!-- BREAD SHELF right side -->
    <rect x="345" y="75" width="55" height="155" rx="3" fill="#c4a060" stroke="#8a6830" stroke-width="1.5"/>
    <rect x="345" y="110" width="55" height="5" fill="#a07840" stroke="#8a6830" stroke-width="0.8"/>
    <rect x="345" y="150" width="55" height="5" fill="#a07840" stroke="#8a6830" stroke-width="0.8"/>
    <rect x="345" y="190" width="55" height="5" fill="#a07840" stroke="#8a6830" stroke-width="0.8"/>
    <!-- bread loaves on shelves -->
    <ellipse cx="360" cy="105" rx="10" ry="8" fill="#c8905a" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="378" cy="103" rx="10" ry="8" fill="#c8905a" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="362" cy="145" rx="11" ry="8" fill="#d4a060" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="380" cy="143" rx="10" ry="8" fill="#c8905a" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="360" cy="185" rx="10" ry="7" fill="#c8905a" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="378" cy="183" rx="9" ry="7" fill="#d4a060" stroke="#8a6830" stroke-width="0.8"/>
    <!-- COUNTER left -->
    <rect x="0" y="170" width="185" height="20" rx="2" fill="#c4a060" stroke="#8a6830" stroke-width="1.5"/>
    <rect x="0" y="190" width="185" height="80" rx="2" fill="#d4b070" stroke="#8a6830" stroke-width="1.5"/>
    <!-- counter top items: lavender pot -->
    <rect x="12" y="145" width="20" height="28" rx="3" fill="#c8a060" stroke="#8a6830" stroke-width="1"/>
    <path d="M12,148 Q22,135 32,148" fill="#c0a8d8" stroke="#8a6830" stroke-width="0.8"/>
    <path d="M16,145 Q22,130 28,145" fill="#b898cc" stroke="#8a6830" stroke-width="0.7"/>
    <!-- clay jars on counter -->
    <ellipse cx="65" cy="170" rx="10" ry="8" fill="#c89860" stroke="#8a6830" stroke-width="1"/>
    <rect x="55" y="152" width="20" height="20" rx="4" fill="#c89860" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="65" cy="152" rx="10" ry="5" fill="#d4a870" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="95" cy="168" rx="9" ry="7" fill="#b88850" stroke="#8a6830" stroke-width="1"/>
    <rect x="86" y="152" width="18" height="18" rx="4" fill="#b88850" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="95" cy="152" rx="9" ry="4" fill="#c89860" stroke="#8a6830" stroke-width="0.8"/>
    <!-- BAKER (round, cheerful) behind counter -->
    <!-- body -->
    <ellipse cx="148" cy="195" rx="25" ry="22" fill="#d4a870" stroke="#8a6830" stroke-width="1.5"/>
    <!-- shirt -->
    <ellipse cx="148" cy="210" rx="25" ry="15" fill="#c8956a" stroke="#8a6830" stroke-width="1"/>
    <!-- collar -->
    <path d="M135,190 Q148,195 161,190" fill="#90c0a0" stroke="#8a6830" stroke-width="1"/>
    <!-- head -->
    <circle cx="148" cy="168" r="20" fill="#e0b880" stroke="#8a6830" stroke-width="1.5"/>
    <!-- face: smile -->
    <path d="M140,172 Q148,180 156,172" fill="none" stroke="#8a6830" stroke-width="1.2"/>
    <!-- eyes -->
    <ellipse cx="142" cy="165" rx="3" ry="3.5" fill="#5a3a20"/>
    <ellipse cx="154" cy="165" rx="3" ry="3.5" fill="#5a3a20"/>
    <!-- cheeks -->
    <ellipse cx="138" cy="172" rx="5" ry="3" fill="#e09070" opacity="0.5"/>
    <ellipse cx="158" cy="172" rx="5" ry="3" fill="#e09070" opacity="0.5"/>
    <!-- CENTRE TABLE -->
    <rect x="100" y="248" width="120" height="8" rx="2" fill="#c4a060" stroke="#8a6830" stroke-width="1.2"/>
    <rect x="108" y="256" width="5" height="30" fill="#b08848" stroke="#8a6830" stroke-width="0.8"/>
    <rect x="207" y="256" width="5" height="30" fill="#b08848" stroke="#8a6830" stroke-width="0.8"/>
    <!-- bowl on table -->
    <ellipse cx="150" cy="248" rx="22" ry="10" fill="#c8a060" stroke="#8a6830" stroke-width="1"/>
    <ellipse cx="150" cy="244" rx="20" ry="8" fill="#d4b070" stroke="#8a6830" stroke-width="0.8"/>
    <!-- fruits in bowl -->
    <circle cx="142" cy="241" r="6" fill="#e07050" stroke="#8a6830" stroke-width="0.7"/>
    <circle cx="154" cy="239" r="6" fill="#e08050" stroke="#8a6830" stroke-width="0.7"/>
    <circle cx="163" cy="242" r="5" fill="#d06040" stroke="#8a6830" stroke-width="0.7"/>
    <!-- bottle on table -->
    <rect x="182" y="228" width="12" height="22" rx="3" fill="#d0b870" stroke="#8a6830" stroke-width="1"/>
    <rect x="185" y="222" width="6" height="10" rx="2" fill="#c8a858" stroke="#8a6830" stroke-width="0.8"/>
    <!-- small bowl -->
    <ellipse cx="118" cy="248" rx="10" ry="5" fill="#c09050" stroke="#8a6830" stroke-width="0.8"/>
    <ellipse cx="118" cy="245" rx="9" ry="4" fill="#d0a060" stroke="#8a6830" stroke-width="0.7"/>
    <!-- FLOOR tiles -->
    <rect x="0" y="265" width="400" height="35" fill="#e8d090"/>
    <line x1="0" y1="275" x2="400" y2="275" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="0" y1="285" x2="400" y2="285" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="50" y1="265" x2="50" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="100" y1="265" x2="100" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="150" y1="265" x2="150" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="200" y1="265" x2="200" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="250" y1="265" x2="250" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="300" y1="265" x2="300" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <line x1="350" y1="265" x2="350" y2="300" stroke="#c8a850" stroke-width="0.6"/>
    <!-- sketch border -->
    <rect x="0" y="0" width="400" height="300" fill="none" stroke="#8a6830" stroke-width="1.5" rx="6"/>
  </svg>`,

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
