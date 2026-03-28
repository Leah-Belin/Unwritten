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
// Draws the PNG overlay image for one village building entry from VILLAGE_BLDG_SPRITES.
// The image is scaled so its width matches the footprint's screen width, centred
// horizontally over the footprint, and bottom-aligned to the south ground edge.
function drawBuildingOverlay(b) {
  const img = _tileImgs[b.img];
  if (!img) return;

  // Source rectangle within the PNG (defaults to the full image).
  const srcX = b.sx ?? 0, srcY = b.sy ?? 0;
  const srcW = b.sw ?? img.naturalWidth;
  const srcH = b.sh ?? img.naturalHeight;
  if (!srcW || !srcH) return;

  // In isometric projection the screen width of a tile footprint is
  // (colSpan + rowSpan) * TW/2, because each tile adds TW/2 horizontally
  // whether you step east (column) or south (row).
  const footprintScreenWidth = (b.c2 - b.c1 + b.r2 - b.r1) * TW / 2;
  const scale = footprintScreenWidth / srcW;
  const drawW = srcW * scale;
  const drawH = srcH * scale;

  // Screen position: horizontally centred on the footprint's middle tile,
  // vertically anchored so the image bottom sits at the south ground edge.
  const midCol = (b.c1 + b.c2) / 2;
  const midRow = (b.r1 + b.r2) / 2;
  const cx = isoX(midCol, midRow) + offX;
  const cy = isoY(midCol, b.r2) + TH / 2 + offY + (b.yOff ?? 0);

  // Fill the south-facing wall behind the sprite for buildings whose PNG has a
  // transparent south face (open-front isometric sprites).  Draw the right-face
  // quad for every tile along the bottom footprint row before the sprite image
  // is composited on top — opaque sprite pixels cover it, transparent ones let it show.
  if (b.wallColor) {
    const hw = TW / 2, hh = TH / 2;
    const bh = b.wallBH ?? 28;
    for (let c = b.c1; c <= b.c2; c++) {
      const {x, y} = toScreen(c, b.r2);
      ctx.beginPath();
      ctx.moveTo(x + hw, y - bh); ctx.lineTo(x, y + hh - bh);
      ctx.lineTo(x, y + hh);      ctx.lineTo(x + hw, y);
      ctx.closePath();
      ctx.fillStyle = b.wallColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  // Pixel-art sprites (identified by having an explicit source rect) need
  // nearest-neighbour scaling so they stay crisp rather than blurring.
  const pixelArt = (b.sw !== undefined);
  if (pixelArt) ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, srcX, srcY, srcW, srcH, cx - drawW / 2, cy - drawH, drawW, drawH);
  if (pixelArt) ctx.imageSmoothingEnabled = true;
}

// Draws one entry from SCENE_DECO (defined in renderer-assets.js) at its tile
// position.  The image bottom is anchored at tile ground level and extends
// upward by `size` pixels; `yOff` shifts the whole thing up or down.
// To add or move decorations, edit SCENE_DECO in renderer-assets.js —
// no changes are needed here.
function drawDecoOverlay(d) {
  const img = _tileImgs[d.img];
  if (!img) return;
  const {x, y} = toScreen(d.col, d.row);
  const size = d.size ?? TW;
  const bottom = y + TH / 2 + (d.yOff ?? 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x - size / 2, bottom - size, size, size);
  ctx.imageSmoothingEnabled = true;
}

function drawTile(c, r) {
  const def = TILE_DEF[currentMap[r]?.[c]];
  if (!def) return;
  // For tiles inside a building-sprite footprint, draw a flat grass base instead of
  // the procedural 3D box — but only when the sprite image has actually loaded.
  const _spriteImgKey = _buildingFootprintTiles.get(`${c},${r}`);
  // Tiles inside a loaded building-sprite footprint get a flat grass base;
  // the sprite image is drawn on top (at higher z) and covers everything.
  // Exception: cobble and path tiles (e.g. town square) render as-is even when
  // they fall within the footprint of an adjacent building sprite.
  const _tileType = currentMap[r]?.[c];
  if (!currentBuilding && _spriteImgKey && _tileImgs[_spriteImgKey]
      && _tileType !== T.COBBLE && _tileType !== T.PATH) {
    const {x,y} = toScreen(c,r);
    if (x<-TW||x>W+TW||y<-TH*3||y>H+TH*2) return;
    const grassImg = _tileImgs['grass'];
    if (grassImg) { drawTileImg(grassImg, x, y); }
    else {
      const hw=TW/2, hh=TH/2;
      ctx.beginPath();
      ctx.moveTo(x,y-hh); ctx.lineTo(x+hw,y); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
      ctx.closePath(); ctx.fillStyle='#8a9a6a'; ctx.fill();
    }
    return;
  }
  const {x,y} = toScreen(c,r);
  if (x<-TW||x>W+TW||y<-TH*3||y>H+TH*2) return;
  const hw=TW/2, hh=TH/2;

  // Top face — Miniature World block sprite when loaded, else procedural diamond
  if (!def.raised) {
    const tileType = currentMap[r]?.[c];
    const isFloor = currentBuilding && tileType === T.DIRT;
    if (isFloor && !window._floorLogged) { window._floorLogged=true; const _fid=_FLOOR_IMG[currentBuilding.id]; console.log('[floor] building.id:', currentBuilding.id, 'floorImgId:', _fid, 'img loaded:', !!_tileImgs[_fid]); }
    const imgId = isFloor ? (_FLOOR_IMG[currentBuilding.id] || 'floor_stone') : _GROUND_IMG[tileType];
    const tileImg = imgId && _tileImgs[imgId];
    if (tileImg) {
      drawTileImg(tileImg, x, y);
    } else {
      ctx.beginPath();
      ctx.moveTo(x,y-hh); ctx.lineTo(x+hw,y); ctx.lineTo(x,y+hh); ctx.lineTo(x-hw,y);
      ctx.closePath();
      ctx.fillStyle = isFloor ? '#ff0000' : def.top;
      ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.1)'; ctx.lineWidth=0.5; ctx.stroke();
    }
  }

  if (def.fountain) {
    // Use the PNG image if loaded; fall back to the procedural fountain below.
    const fountainImg = _tileImgs['deco_fountain'];
    if (fountainImg) {
      const bottom = y + TH / 2;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fountainImg, x - TW / 2, bottom - TW, TW, TW);
      ctx.imageSmoothingEnabled = true;
      return;
    }
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
    let bldg=null, style=null, isRoof=false;
    if (!currentBuilding) {
      bldg = getBuildingAtTile(c, r);
      if (bldg) {
        style = BUILDING_STYLES[bldg.id];
        if (style) {
          isRoof = (currentMap[r]?.[c] === T.BUILDING); // interior tile = roof
          if (isRoof) {
            // Pitched (gabled) roof: ridge runs N-S, gable faces E and W.
            // Vary bh by column position so the centre column peaks above the walls.
            const roofPeak = style.roofPeak ?? 10;
            const interiorCols = bldg.cMax - bldg.cMin - 1;
            const interiorC    = c - bldg.cMin - 1; // 0-indexed interior column
            if (interiorCols >= 2) {
              const centerC = (interiorCols - 1) / 2;
              const dist = Math.abs(interiorC - centerC) / Math.max(centerC, 0.5);
              bh = bh + Math.round(roofPeak * Math.max(0, 1 - dist));
            } else {
              bh = bh + roofPeak; // narrow building: whole roof at peak height
            }
            leftCol  = style.roofL  ?? style.roof;
            rightCol = style.roofR  ?? style.roof;
            topCol   = style.roof;
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
    // Shingle/tile lines on roof top face
    if (isRoof && style) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, y-hh-bh); ctx.lineTo(x+hw, y-bh);
      ctx.lineTo(x, y+hh-bh); ctx.lineTo(x-hw, y-bh);
      ctx.clip();
      ctx.strokeStyle='rgba(0,0,0,0.14)'; ctx.lineWidth=0.8;
      for (let dy=3; dy<TH*1.5; dy+=4) {
        ctx.beginPath();
        ctx.moveTo(x-hw-2, y-bh-hh+dy); ctx.lineTo(x+hw+2, y-bh-hh+dy); ctx.stroke();
      }
      ctx.restore();
    }

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
