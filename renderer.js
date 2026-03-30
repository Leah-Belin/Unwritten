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

}

// ── HOVER LABEL ────────────────────────────────────────────────
// Mouse position in canvas pixels (updated by mousemove on the canvas)
let _mouseX = -9999, _mouseY = -9999;
(function _initHover() {
  const c = document.getElementById('game-canvas');
  if (!c) return;
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    _mouseX = (e.clientX - r.left) * (c.width  / r.width);
    _mouseY = (e.clientY - r.top)  * (c.height / r.height);
  });
  c.addEventListener('mouseleave', () => { _mouseX = -9999; _mouseY = -9999; });
})();

function drawItem(item) {
  if (item.taken) return;
  const {x, y} = toScreen(item.col, item.row);

  // Subtle glow ring on the ground beneath the item
  ctx.beginPath(); ctx.ellipse(x, y+4, 12, 5, 0, 0, Math.PI*2);
  ctx.strokeStyle='rgba(220,180,80,0.4)'; ctx.lineWidth=1; ctx.stroke();

  // Try to draw a resource PNG; fall back to emoji if no image is mapped or loaded.
  // To add a PNG for an item, see ITEM_RES_IMG in renderer-assets.js.
  const resKey = ITEM_RES_IMG[item.itemId];
  const resImg = resKey ? _tileImgs[resKey] : null;
  if (resImg && resImg.naturalWidth) {
    // Height is fixed; width derived from aspect ratio so images are never squashed
    const drawH = 40;
    const drawW = drawH * (resImg.naturalWidth / resImg.naturalHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(resImg, x - drawW/2, y + 4 - drawH, drawW, drawH);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.font='16px serif'; ctx.textAlign='center';
    ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
    ctx.fillText(ITEMS[item.itemId]?.emoji || '📦', x, y);
    ctx.shadowBlur=0;
  }
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

// Draws one piece of interior furniture.
// Furniture that has a PNG replacement checks _tileImgs for the image key and
// falls back to an emoji if the image isn't loaded yet.
//
// TO REPLACE A FURNITURE EMOJI WITH A PNG:
//   1. Add the image to images/tiles/Decorations/ and register it in
//      renderer-assets.js under the "Interior furniture" group (see the
//      furn_chair / furn_bed pattern there).
//   2. Find the matching case below and replace the _furnitureEmoji() call
//      with the same image-draw pattern used in 'chair', 'bed', or 'chest'.
//
function drawFurniturePiece(piece) {
  const {x,y} = toScreen(piece.col, piece.row);
  const HW=TW/2, HH=TH/2;

  switch (piece.type) {

    case 'table': {
      const img = _tileImgs['furn_table'];
      if (img && img.naturalWidth) {
        const drawH = Math.round(TW * 1.4);
        const drawW = drawH * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x - drawW/2, y + TH/2 - drawH, drawW, drawH);
        ctx.imageSmoothingEnabled = true;
      } else {
        // Procedural fallback — flat-top iso box with leg stubs and wood grain
        const s=0.62, hw=HW*s, hh=HH*s, bh=9;
        const legC='#6a4020';
        ctx.fillStyle=legC;
        [[x-hw*0.48,y+hh*0.45],[x+hw*0.48,y+hh*0.45],
         [x-hw*0.48,y-hh*0.45],[x+hw*0.48,y-hh*0.45]].forEach(([lx,ly])=>{
          ctx.beginPath(); ctx.moveTo(lx-2,ly-1); ctx.lineTo(lx,ly+hh*0.5);
          ctx.lineTo(lx+2,ly+hh*0.5); ctx.lineTo(lx+4,ly-1); ctx.closePath(); ctx.fill();
        });
        _isoBox(x, y, hw, hh, bh, '#d4aa68','#8a5a2e','#b07838');
        _woodGrain(x, y, hw, hh, bh);
      }
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

    case 'chair': {
      const img = _tileImgs['furn_chair'];
      if (img && img.naturalWidth) {
        const dh = Math.round(TW * 1.4);
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x - dw/2, y + TH/2 - dh, dw, dh);
        ctx.imageSmoothingEnabled = true;
      } else { _furnitureEmoji(x, y, '🪑', 22, -4); }
      break;
    }

    case 'stool':
      _furnitureEmoji(x, y, '🪑', 16, -2);
      break;

    case 'bed': {
      const img = _tileImgs['furn_bed'];
      if (img && img.naturalWidth) {
        const dh = Math.round(TW * 1.5);
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x - dw/2, y + TH/2 - dh, dw, dh);
        ctx.imageSmoothingEnabled = true;
      } else { _furnitureEmoji(x, y, '🛏️', 32, -6); }
      break;
    }

    case 'cot': {
      const img = _tileImgs['furn_cot'];
      if (img && img.naturalWidth) {
        const dh = Math.round(TW * 1.3);
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x - dw/2, y + TH/2 - dh, dw, dh);
        ctx.imageSmoothingEnabled = true;
      } else { _furnitureEmoji(x, y, '🛏️', 26, -4); }
      break;
    }

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

    case 'chest': {
      const img = _tileImgs['furn_chest'];
      if (img && img.naturalWidth) {
        const dh = Math.round(TW * 1.2);
        const dw = dh * (img.naturalWidth / img.naturalHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, x - dw/2, y + TH/2 - dh, dw, dh);
        ctx.imageSmoothingEnabled = true;
      } else { _furnitureEmoji(x, y, '📦', 26, -4); }
      break;
    }

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

  // Zoom: scale from the canvas centre so the player (centred by offX/offY) stays fixed
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(-W/2, -H/2);

  // Collect and sort drawables (painter's algorithm)
  // Raised tiles (walls/buildings) get a small z boost so they overdraw correctly.
  // BORDER extra rows/cols of trees are added around the map so the viewport never
  // shows the raw sky background when zoomed out to 0.5×.
  const BORDER = 8;
  const items = [];
  for (let r=-BORDER; r<mapRows+BORDER; r++)
    for (let c=-BORDER; c<mapCols+BORDER; c++) {
      const inMap = r>=0 && r<mapRows && c>=0 && c<mapCols;
      const def = inMap ? TILE_DEF[currentMap[r]?.[c]] : TILE_DEF[T.TREE];
      const raised = def?.raised ? 0.4 : def?.tree ? 0.75 : 0;
      items.push({k:'tile',c,r, z:r+c+raised});
    }

  currentItems.forEach(item => {
    if (!item.taken) items.push({k:'item',item,z:item.row+item.col+0.5});
  });
  currentStations.forEach(st => items.push({k:'station',st,z:st.row+st.col+0.6}));
  currentFurniture.forEach(f => items.push({k:'furniture',f,z:f.row+f.col+0.55}));
  if (currentCabinet) items.push({k:'cabinet',z:currentCabinet.row+currentCabinet.col+0.6});
  // Building sprite overlays — village only
  if (!currentBuilding && State.scene === 'village') {
    for (const b of VILLAGE_BLDG_SPRITES)
      // Use tileR2 (actual building-tile south row) not sprite r2, so characters
      // on walkable grass tiles between tileR2 and r2 sort in front of the building.
      items.push({k:'bldg', b, z:(b.tileR2??b.r2)+b.c1+0.7});
  }
  // Scene-specific decorative objects (benches, wells, stalls, temple features, etc.)
  if (!currentBuilding) {
    const deco = SCENE_DECO[State.scene];
    // z=0.85 so decorations draw after trees (z=0.75) at the same diagonal
    if (deco) for (const d of deco) items.push({k:'deco', d, z:d.row+d.col+0.85});
  }
  // Use pixel py for z during movement; py = isoY(col,row) = (col+row)*(TH/2)
  currentNPCs.forEach(n => items.push({k:'npc',n,z:(n.py!==undefined?n.py/(TH/2):n.row+n.col)+0.8}));
  items.push({k:'player',z:player.py/(TH/2)+0.8});
  items.sort((a,b) => a.z-b.z);

  ctx.textAlign='center';
  for (const d of items) {
    if      (d.k==='tile')    drawTile(d.c,d.r);
    else if (d.k==='bldg')   drawBuildingOverlay(d.b);
    else if (d.k==='deco')   drawDecoOverlay(d.d);
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
  ctx.restore(); // end zoom

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

  // ── Hover name label ─────────────────────────────────────────
  // Find the NPC or player closest to the mouse and show their name.
  // Converts zoomed canvas positions to screen pixels for comparison.
  // zoomLevel + offX/offY match the transform set up at the top of render().
  let _hoverLabel = null, _hoverLX = 0, _hoverLY = 0, _hoverBest = 32;
  const _toScreen = (wx, wy) => ({
    sx: zoomLevel * (wx - W/2) + W/2,
    sy: zoomLevel * (wy - H/2) + H/2,
  });
  for (const n of currentNPCs) {
    const wx = (n.px !== undefined ? n.px : isoX(n.col, n.row)) + offX;
    const wy = (n.py !== undefined ? n.py : isoY(n.col, n.row)) + offY;
    const {sx, sy} = _toScreen(wx, wy);
    const dist = Math.hypot(_mouseX - sx, _mouseY - sy);
    if (dist < _hoverBest) { _hoverBest = dist; _hoverLabel = n.name; _hoverLX = sx; _hoverLY = sy; }
  }
  // Check player too
  {
    const {sx, sy} = _toScreen(player.px + offX, player.py + offY);
    if (Math.hypot(_mouseX - sx, _mouseY - sy) < _hoverBest) {
      _hoverLabel = 'Kaida'; _hoverLX = sx; _hoverLY = sy;
    }
  }
  if (_hoverLabel) {
    ctx.font = 'bold 15px Caveat, cursive';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a1008';
    ctx.shadowColor = 'rgba(240,228,200,0.95)';
    ctx.shadowBlur = 10;
    ctx.fillText(_hoverLabel, _hoverLX, _hoverLY - 52);
    ctx.shadowBlur = 0;
  }
}
