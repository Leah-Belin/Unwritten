// ── NPC WANDERING ─────────────────────────────────────────────
// Each NPC has its own wander timer so they move independently
const NPC_WANDER_RADIUS = 3; // default tiles from home

function initNPCPositions() {
  // Store home positions and stagger each NPC's first move
  NPCS.forEach(npc => {
    npc.homeCol = npc.col;
    npc.homeRow = npc.row;
    npc.wanderPath = [];
    npc.wanderTimer = Math.random() * 20; // staggered start (0–20 s)
  });
}

// Apply period-based schedules: update home positions, filter out NPCs not active this period,
// and add any NPCs newly scheduled for this period.
function applyNPCSchedules() {
  if (currentBuilding || State.scene !== 'village') return;
  const p = State.period;

  // Update homes + remove NPCs whose schedule doesn't include this period
  currentNPCs = currentNPCs.filter(npc => {
    if (!npc.schedule) return true; // no schedule = always present
    const entry = npc.schedule.find(s => s.periods.includes(p));
    if (!entry) return false;
    npc.homeCol = entry.col;
    npc.homeRow = entry.row;
    npc.wanderRadius = entry.radius;
    npc.wanderPath = [];
    return true;
  });

  // Add NPCs that become active this period but aren't in the scene yet
  const presentIds = new Set(currentNPCs.map(n => n.id));
  for (const npc of NPCS) {
    if (!npc.schedule || npc.scene !== 'village' || npc.visible === false) continue;
    if (presentIds.has(npc.id)) continue;
    const entry = npc.schedule.find(s => s.periods.includes(p));
    if (!entry) continue;
    npc.homeCol = entry.col;
    npc.homeRow = entry.row;
    npc.wanderRadius = entry.radius;
    npc.col = entry.col;
    npc.row = entry.row;
    npc.wanderPath = [];
    npc.wanderTimer = Math.random() * 10; // stagger so new arrivals don't all move at once
    npc.px = undefined;
    npc.py = undefined;
    currentNPCs.push(npc);
  }
}

function updateNPCWander(dt) {
  if (currentBuilding) return;

  currentNPCs.forEach(npc => {
    if (npc.stationary) return;
    if (npc.wanderPath && npc.wanderPath.length > 0) return; // still moving

    // Count down this NPC's individual pause timer
    npc.wanderTimer = (npc.wanderTimer || 0) - dt;
    if (npc.wanderTimer > 0) return;

    // Pick a random nearby walkable tile within this NPC's radius
    const radius = npc.wanderRadius || NPC_WANDER_RADIUS;
    const candidates = [];
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const tc = (npc.homeCol||npc.col) + dc;
        const tr = (npc.homeRow||npc.row) + dr;
        if (walkable(tc, tr) && !(tc===npc.col && tr===npc.row))
          candidates.push({col:tc, row:tr});
      }
    }
    if (candidates.length === 0) return;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    npc.wanderPath = astar(npc.col, npc.row, target.col, target.row).slice(0, 5);

    // Next pause: 8–22 s (varies per NPC so they stay out of sync)
    npc.wanderTimer = 8 + Math.random() * 14;
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

    npc.moving = true;
    npc.direction = isoDirection(dx, dy);
    npc.animTimer = (npc.animTimer || 0) + step / 60;
    if (npc.animTimer > 0.15) { npc.animTimer=0; npc.animFrame=((npc.animFrame||0)+1)%4; }

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

// ── NPC TALK ──────────────────────────────────────────────────
function talkTo(npc) {

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
