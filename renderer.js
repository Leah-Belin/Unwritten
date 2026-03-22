// ── SPRITE SHEET LOADER ───────────────────────────────────────
// Place PNG files at images/characters/<id>.png to replace emoji rendering.
// Expected format (compatible with LPC Universal Spritesheet Generator):
//   - Frame size: 64×64 px (configurable via SPRITE_W / SPRITE_H)
//   - Rows:  0=walk_up, 1=walk_left, 2=walk_down, 3=walk_right
//   - Columns: 0-3 walk frames (only first 4 used even if sheet has more)
//
// Character IDs:
//   player  → images/characters/player.png
//   NPCs    → images/characters/<npc.id>.png  (npc.id = lowercase name, e.g. "mariella")
const SPRITE_W = 64, SPRITE_H = 64;
const SPRITE_ROWS = { up:8, left:9, down:10, right:11 };
const _sprites = {};   // id → HTMLImageElement (null = load failed)

function loadSprite(id) {
  if (id in _sprites) return;
  _sprites[id] = null; // mark as attempted
  const img = new Image();
  img.onload = () => { _sprites[id] = img; };
  img.src = `images/characters/${id}.png`;
}

// Pre-attempt loads for known characters at startup.
// Add NPC ids here as sprite sheets become available.
loadSprite('player');
loadSprite('jaxon');
loadSprite('blacksmith');
loadSprite('mariella');
loadSprite('children');
loadSprite('hesta');
loadSprite('elder');
loadSprite('father');
loadSprite('innkeeper');

// ── TILE IMAGE LOADER ─────────────────────────────────────────
// Miniature World isometric block sprites (32×32 source → drawn at 64×64).
// Each tile image sits aligned to the game's 64×32 iso diamond.
const _tileImgs = {};
function loadTileImg(id, src) {
  const img = new Image();
  img.onload = () => { _tileImgs[id] = img; };
  img.onerror = () => { console.error('[tiles] failed to load:', id, src); };
  img.src = src;
}
const _MWT = 'images/tiles/Miniature%20world/';
loadTileImg('grass',        _MWT + 'Tiles/Grass%20Block%201.png');
loadTileImg('grass_flower', _MWT + 'Tiles/Grass%20Block%201(flowered).png');
loadTileImg('path',         _MWT + 'Tiles/Path%20Block.png');
loadTileImg('dirt',         _MWT + 'Tiles/Dirt%20Block%201.png');
loadTileImg('water',        _MWT + 'Tiles/Water%20Block.png');
loadTileImg('tree_a',       _MWT + 'Outline/Objects/Tree%201.png');
loadTileImg('tree_b',       _MWT + 'Outline/Objects/Tree%202.png');
loadTileImg('floor',        _MWT + 'Tiles/Sand%20Block%201.png');

// Map tile type → image id for ground tiles
const _GROUND_IMG = {
  [T.GRASS]:  'grass',
  [T.FLOWER]: 'grass_flower',
  [T.TREE]:   'grass',
  [T.PATH]:   'path',
  [T.DOOR]:   'path',
  [T.DIRT]:   'dirt',
  [T.PLOT]:   'dirt',
  [T.WATER]:  'water',
  [T.STAIRS]: 'path',
};

// Draw a 32×32 Miniature World tile at 2× scale.
// Top-face top-vertex lands at (x, y − TH/2), matching the iso diamond.
function drawTileImg(img, x, y) {
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, 32, 32, x - TW/2, y - TH/2, TW, TW);
}

// ── DRAW MORTAR/GRAIN TEXTURE ─────────────────────────────────
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

  // Top face — Miniature World block sprite when loaded, else procedural diamond
  if (!def.raised) {
    const tileType = currentMap[r]?.[c];
    const isFloor = currentBuilding && tileType === T.DIRT;
    if (isFloor && !window._floorLogged) { window._floorLogged=true; console.log('[floor] currentBuilding:', !!currentBuilding, 'tileType:', tileType, 'T.DIRT:', T.DIRT, 'img loaded:', !!_tileImgs.floor); }
    const imgId = isFloor ? 'floor' : _GROUND_IMG[tileType];
    const tileImg = imgId && _tileImgs[imgId];
    if (tileImg) {
      drawTileImg(tileImg, x, y);
    } else {
      ctx.beginPath();
      ctx.moveTo(x,y-hh); ctx.lineTo(x+hw,y); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
      ctx.closePath(); ctx.fillStyle=def.top; ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.5; ctx.stroke();
    }
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
    // grass_flower tile image already drawn above as the ground; no overlay needed
    if (!_tileImgs.grass_flower) {
      ctx.font='9px serif'; ctx.textAlign='center';
      ctx.fillText(['✿','❀','✾'][((c*7+r*3)%3)], x, y+3);
    }
    return;
  }
  if (def.tree) {
    // Draw tree object on top of the grass block ground
    const treeImg = _tileImgs[((c*7+r*3)%2===0) ? 'tree_a' : 'tree_b'];
    if (treeImg) {
      ctx.imageSmoothingEnabled = false;
      // Object base anchored at tile diamond centre (x, y); extends upward TW px
      ctx.drawImage(treeImg, 0, 0, 32, 32, x - TW/2, y - TW, TW, TW);
    } else {
      ctx.fillStyle='#5a4028'; ctx.fillRect(x-3,y-4,6,12);
      for (const [ox,oy,rx,ry,col] of [
        [0,-26,18,14,'#5a7830'],[0,-32,13,10,'#6a8840'],[0,-38,8,7,'#7a9848']
      ]) {
        ctx.beginPath(); ctx.ellipse(x+ox,y+oy,rx,ry,0,0,Math.PI*2);
        ctx.fillStyle=col; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5; ctx.stroke();
      }
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

function drawSprite(x, y, emoji, label, bodyColor, isPlayer, spriteId, direction, animFrame) {
  const base = y - TH/2;   // feet at tile top vertex
  const sheet = spriteId ? _sprites[spriteId] : null;

  if (sheet) {
    // ── Pixel art sprite sheet rendering ──
    const row  = SPRITE_ROWS[direction || 'down'];
    const col  = (animFrame || 0) % 4;
    const sx   = col  * SPRITE_W;
    const sy   = row  * SPRITE_H;
    const scale = isPlayer ? 1 : 0.75;
    const dw   = SPRITE_W * scale;
    const dh   = SPRITE_H * scale;
    const dx   = x - dw / 2;
    const dy   = base - dh;   // feet at base

    // Shadow
    ctx.beginPath(); ctx.ellipse(x, base+2, isPlayer?13:11, 5, 0, 0, Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fill();

    ctx.imageSmoothingEnabled = false; // keep pixels crisp
    ctx.drawImage(sheet, sx, sy, SPRITE_W, SPRITE_H, dx, dy, dw, dh);
  } else {
    // ── Fallback: emoji circle (original rendering) ──
    const radius = isPlayer ? 14 : 12;
    const centre = base - radius;

    ctx.beginPath(); ctx.ellipse(x, base+2, isPlayer?13:11, 5, 0, 0, Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(x, centre, radius, 0, Math.PI*2);
    ctx.fillStyle=bodyColor; ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.font=`${isPlayer?15:13}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(emoji, x, centre);
    ctx.textBaseline='alphabetic';
  }

  // Name label (always shown)
  const radius = isPlayer ? 14 : 12;
  const labelY = sheet
    ? (base - (SPRITE_H * (isPlayer?1:0.75)) - 2)
    : (base - radius*2 - 4);
  ctx.font=`${isPlayer?'bold ':''}9px Caveat,cursive`;
  ctx.fillStyle=isPlayer?'#ffe8c0':'#f0e8d5';
  ctx.shadowColor='rgba(0,0,0,0.95)'; ctx.shadowBlur=5;
  ctx.textAlign='center';
  ctx.fillText(label, x, labelY);
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
      const nid = n.id || n.name?.toLowerCase().replace(/\s+/g,'_');
      if (nid && !(nid in _sprites)) loadSprite(nid);
      drawSprite(nx, ny, n.emoji, n.name, n.color, false, nid, n.direction||'down', n.animFrame||0);
    }
    else if (d.k==='player')  drawSprite(player.px+offX,player.py+offY,'👧','Kaida',player.color,true,'player',player.direction,player.animFrame);
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
