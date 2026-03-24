// ── INPUT ─────────────────────────────────────────────────────
// Attached in init() after canvas exists
function attachInputHandlers() {

  // ── Pinch-to-zoom (touch) ──────────────────────────────────
  let _pinchDist = null;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      _pinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      e.preventDefault();
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && _pinchDist !== null) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      zoomLevel = Math.max(0.5, Math.min(3.0, zoomLevel * (d / _pinchDist)));
      _pinchDist = d;
      e.preventDefault();
    }
  }, { passive: false });
  canvas.addEventListener('touchend', e => { if (e.touches.length < 2) _pinchDist = null; });

  // ── Mouse-wheel zoom (desktop) ────────────────────────────
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    zoomLevel = Math.max(0.5, Math.min(3.0, zoomLevel * (e.deltaY < 0 ? 1.1 : 0.9)));
  }, { passive: false });

  canvas.addEventListener('click', e => {
    if (document.getElementById('dialogue-overlay').classList.contains('open')) { closeDialogue(); return; }
    if (document.getElementById('craft-overlay').classList.contains('open')) return;
    if (document.getElementById('event-overlay').classList.contains('open')) return;

    const rect=canvas.getBoundingClientRect();
    const rawX=e.clientX-rect.left, rawY=e.clientY-rect.top;
    // Undo centre-anchored zoom to get logical canvas coords for hit-tests
    const sx=(rawX-W/2)/zoomLevel+W/2, sy=(rawY-H/2)/zoomLevel+H/2;
    const{col:clickCol, row:clickRow}=toTile(rawX,rawY);

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
      // ── Building sprite hit-test (screen-space) ─────────────
      // The tile-based check below misses clicks on the visual building when
      // yOff lifts the sprite above its tile footprint. Check sprite bounds first.
      if (State.scene === 'village') {
        for (const b of VILLAGE_BLDG_SPRITES) {
          const img = _tileImgs[b.img];
          if (!img || !img.naturalWidth) continue;
          const srcW = b.sw ?? img.naturalWidth;
          const srcH = b.sh ?? img.naturalHeight;
          if (!srcW || !srcH) continue;
          const fW = (b.c2 - b.c1 + b.r2 - b.r1) * TW / 2;
          const scale = fW / srcW;
          const dw = srcW * scale;
          const dh = srcH * scale;
          const cc = (b.c1 + b.c2) / 2;
          const cr = (b.r1 + b.r2) / 2;
          const cx = isoX(cc, cr) + offX;
          const cy = isoY(cc, b.r2) + TH / 2 + offY + (b.yOff ?? 0);
          if (sx >= cx - dw / 2 && sx <= cx + dw / 2 && sy >= cy - dh && sy <= cy) {
            const building = BUILDING_BOUNDS.find(bd => bd.id === b.id);
            if (building) {
              if (isAdjacentToBuilding(building)) {
                enterBuilding(building.id);
              } else {
                const doorEntry = Object.entries(DOOR_MAP).find(([_k, v]) => v === building.id);
                if (doorEntry) {
                  const [dc, dr] = doorEntry[0].split(',').map(Number);
                  const adj = getAdjacentWalkable(dc, dr);
                  if (adj) { player.path = astar(player.col, player.row, adj.col, adj.row); pendingDoorEntry = building.id; }
                }
              }
              return;
            }
          }
        }
      }
      // ── Tile-based building detection (fallback / interior tiles) ──
      if (clickCol>=0 && clickRow>=0 && clickCol<mapCols && clickRow<mapRows) {
        const tile = currentMap[clickRow]?.[clickCol];
        if (tile === T.WALL || tile === T.BUILDING || tile === T.DOOR) {
          const building = getBuildingAtTile(clickCol, clickRow);
          if (building) {
            if (isAdjacentToBuilding(building)) {
              enterBuilding(building.id);
            } else {
              // Walk to the door tile of this building
              const doorEntry = Object.entries(DOOR_MAP).find(([_k,v]) => v === building.id);
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

