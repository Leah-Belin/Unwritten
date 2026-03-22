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

