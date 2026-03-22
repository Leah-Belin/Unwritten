function togglePanel() {
  const collapsed = document.getElementById('layout').classList.toggle('panel-collapsed');
  document.getElementById('panel-toggle').textContent = collapsed ? '›' : '‹';
}

function initPanelState() {
  if (window.innerWidth <= 640) {
    document.getElementById('layout').classList.add('panel-collapsed');
    document.getElementById('panel-toggle').textContent = '›';
  }
}

function initOverlayDismiss() {
  [
    ['craft-overlay',   closeCraftingMenu],
    ['market-overlay',  closeMarket],
    ['plot-overlay',    closePlot],
    ['worldmap-overlay',toggleWorldMap],
  ].forEach(([id, fn]) => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) fn();
    });
  });
}

function clearNarrative() {
  const box = document.getElementById('narrative-box');
  if (box) box.innerHTML = '';
}

function addNarrative(text, cls = '') {
  const box = document.getElementById('narrative-box');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'n-line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  box.appendChild(el);
  // Keep max 3 entries — remove oldest when exceeded
  while (box.children.length > 3) box.removeChild(box.firstChild);
  // Scroll panel wrapper to bottom
  const scroll = document.getElementById('panel-scroll');
  if (scroll) setTimeout(() => scroll.scrollTop = scroll.scrollHeight, 50);
}

// ── TIME & ENERGY UI ──────────────────────────────────────────
function updateTimeUI() {
  const p = PERIODS[State.period];
  document.getElementById('time-badge').textContent   = `${p.icon} ${p.label} · Day ${State.day}`;
  document.getElementById('time-label-r').textContent = `${p.icon} ${p.label}`;
  document.getElementById('day-label').textContent    = `Day ${State.day} · Chapter I`;
  if (State.isMarketDay()) {
    document.getElementById('day-label').textContent += ' 🛒 Market Day';
  }

}

function updateEnergyUI() {
  const pct  = State.energy;
  const fill = document.getElementById('s-energy');
  const lbl  = document.getElementById('energy-label');
  if (!fill || !lbl) return;
  fill.style.width = pct + '%';
  if (pct > 60) {
    fill.className = 'stat-fill f-energy-full';
    lbl.textContent = '✨ energy — well rested';
  } else if (pct > 30) {
    fill.className = 'stat-fill f-energy-tired';
    lbl.textContent = '😴 energy — getting tired';
  } else if (pct > 0) {
    fill.className = 'stat-fill f-energy-danger';
    lbl.textContent = '⚠️ energy — exhausted';
  } else {
    fill.className = 'stat-fill f-energy-danger';
    lbl.textContent = '💀 energy — collapsed';
  }
}

// ── WALLET ────────────────────────────────────────────────────
function renderWallet() {
  const row = document.getElementById('wallet-row');
  if (!row) return;
  row.innerHTML = '';
  const chits = [['red','🔴',State.wallet.red],['blue','🔵',State.wallet.blue],['gold','🟡',State.wallet.gold]];
  let any = false;
  chits.forEach(([cls, emoji, count]) => {
    if (count <= 0) return;
    any = true;
    const g = document.createElement('div');
    g.className = 'chit-group';
    const dots = Math.min(count, 5);
    for (let i = 0; i < dots; i++) {
      const c = document.createElement('span');
      c.className = `chit ${cls}`;
      g.appendChild(c);
    }
    if (count > 5) {
      const n = document.createElement('span');
      n.className = 'chit-count';
      n.textContent = `×${count}`;
      g.appendChild(n);
    }
    row.appendChild(g);
  });
  if (!any) row.innerHTML = '<span class="empty-label">— empty —</span>';

}

// ── INVENTORY ─────────────────────────────────────────────────
let selectedInvIndex = null;

function renderInventory() {
  const grid = document.getElementById('inv-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const invItems = State.inventory.filter(i => i.category !== 'currency');
  const slots = 12;
  for (let i = 0; i < slots; i++) {
    const slot = document.createElement('div');
    const item = invItems[i];
    if (item) {
      slot.className = 'inv-slot' + (i === selectedInvIndex ? ' sel' : '');
      slot.textContent = item.emoji;
      const tip = document.createElement('div');
      tip.className = 'tip';
      tip.textContent = item.name;
      if (item.energyRestore) tip.textContent += ` (+${item.energyRestore} energy)`;
      slot.appendChild(tip);
      slot.onclick = () => selectItem(i);
    } else {
      slot.className = 'inv-slot empty';
    }
    grid.appendChild(slot);
  }
  // Use button
  const useBtn = document.getElementById('use-item-btn');
  if (useBtn) {
    const item = selectedInvIndex !== null ? invItems[selectedInvIndex] : null;
    useBtn.style.display = (item && (item.energyRestore > 0 || item.sleepEffect)) ? 'block' : 'none';
    if (item) useBtn.textContent = `Use ${item.emoji} ${item.name}`;
  }
}

function selectItem(index) {
  selectedInvIndex = (selectedInvIndex === index) ? null : index;
  renderInventory();
}

function useSelectedItem() {
  if (selectedInvIndex === null) return;
  const item = State.inventory[selectedInvIndex];
  if (!item) return;
  const result = useItem(item.id);
  if (result) {
    addNarrative(result.message, result.type === 'sleep' ? 'sleep' : 'sys');
    if (result.type === 'sleep') {
      State.period = 0; State.day++;
      updateTimeUI();
      closeSleepWarning();
    }
    selectedInvIndex = null;
    renderInventory();
    renderWallet();
    updateEnergyUI();
    State.save();
  }
}

// ── LEAVE BUTTON ──────────────────────────────────────────────
function updateLeaveButton() {
  document.getElementById('leave-btn').style.display = currentBuilding ? 'block' : 'none';
}

function leaveBuilding() {
  const exit = currentExits.find(e => e.targetScene === 'village');
  if (exit) loadScene('village', currentBuilding?.id);
}

// ── DIALOGUE ──────────────────────────────────────────────────
// actions: [{ label, onClick }]  — optional reply buttons shown in the panel
function showDialogue(npc, text, actions = []) {
  const portrait = document.getElementById('dlg-portrait');
  if (npc.portrait) {
    portrait.innerHTML = `<img src="${npc.portrait}" style="width:100%;height:100%;object-fit:cover;object-position:top">`;
  } else {
    portrait.textContent = npc.emoji;
  }
  document.getElementById('dlg-name').textContent = npc.name;
  document.getElementById('dlg-text').textContent = text;
  const actionsEl = document.getElementById('dlg-actions');
  actionsEl.innerHTML = '';
  actions.forEach(({ label, onClick }) => {
    const btn = document.createElement('button');
    btn.className = 'dlg-action-btn';
    btn.textContent = label;
    btn.onclick = () => { closeDialogue(); onClick(); };
    actionsEl.appendChild(btn);
  });
  document.getElementById('dialogue-overlay').classList.add('open');
}

function closeDialogue() {
  document.getElementById('dialogue-overlay').classList.remove('open');
}

// ── SLEEP LOCATIONS ───────────────────────────────────────────
// Defines which scenes count as valid sleep spots and any requirements
const SLEEP_LOCATIONS = [
  // Home — Kaida's room, available pre and post exile (post exile it gets locked but that's handled by exile flag)
  { scene:'bakery_upper',  label:'your room',       rough:false, goodwill:null,    postExile:false },
  // Post-exile alternatives only
  { scene:'hestas_ground', label:"Hesta's floor",   rough:false, goodwill:'hesta', goodwillMin:1,  postExile:true },
  { scene:'jaxons_ground', label:"Jaxon's floor",   rough:false, goodwill:'jaxon', goodwillMin:2,  postExile:false },
  { scene:'inn_ground',    label:'the inn',         rough:false, cost:{blue:2},    postExile:true  },
  // Rough sleeping outside — exile only
  { scene:'village',       label:'outside',         rough:true,  goodwill:null,    postExile:true,  exileOnly:true },
  { scene:'garden',        label:'in the garden',   rough:true,  goodwill:null,    postExile:true,  exileOnly:true },
];

// Check if current scene is a valid sleep spot — returns spot or null
function currentSleepSpot() {
  const exile = State.flags.exile_begun;
  return SLEEP_LOCATIONS.find(s => {
    if (s.scene !== State.scene) return false;
    if (s.exileOnly && !exile) return false;   // rough outdoor options only post-exile
    if (exile && !s.postExile && s.scene !== 'bakery_upper') return false;
    if (s.goodwill && (State.goodwill[s.goodwill] || 0) < (s.goodwillMin || 1)) return false;
    if (s.cost && !State.canAfford(s.cost)) return false;
    return true;
  }) || null;
}

// Called every time scene or state changes — show/hide the button
function updateSleepButton() {
  const btn = document.getElementById('sleep-here-btn');
  if (!btn) return;
  const spot = currentSleepSpot();
  btn.style.display = spot ? 'block' : 'none';
}

// ── SLEEP WARNING — now just a passive narrative notice ────────
function showSleepWarning(collapsed) {
  if (collapsed) {
    // Collapse — just narrate and handle consequences
    addNarrative('You collapse from exhaustion. Someone carries you to the nearest shelter.', 'alert');
    addNarrative('3 🔴 chits are gone from your purse when you wake.', 'alert');
    State.spendChits('red', 3);
    renderWallet();
    State.energy      = 60;
    State.sleptTonight = true;
    State.period      = 0;
    State.day++;
    updateTimeUI(); updateEnergyUI(); updateSleepButton();
    State.save();
    return;
  }

  // Non-collapsed warning — show a brief fading notice, no interaction needed
  const notice = document.getElementById('exhaustion-notice');
  const text   = document.getElementById('exhaustion-text');
  if (!notice || !text) return;
  text.textContent = State.energy <= 15
    ? 'You are barely standing. Find somewhere to sleep before you collapse.'
    : 'You are exhausted. Find somewhere to rest for the night.';
  notice.classList.add('show');
  setTimeout(() => notice.classList.remove('show'), 4000);
}

function closeSleepWarning() {
  // No-op now — kept so engine.js calls don't break
}

// ── DO SLEEP — triggered by the Sleep Here button ─────────────
function doSleepHere() {
  const spot = currentSleepSpot();
  if (!spot) return;

  // Deduct cost if any
  if (spot.cost) {
    Object.entries(spot.cost).forEach(([k,v]) => State.spendChits(k,v));
    renderWallet();
  }

  State.sleptTonight = true;
  State.warningShown = false;
  State.napAvailable = true;

  if (spot.rough) {
    State.energy = 50;
    addNarrative('You curl up outside. The ground is hard. You sleep anyway.', 'sleep');
  } else {
    State.energy = 100;
    addNarrative(`You sleep in ${spot.label}. The world goes quiet.`, 'sleep');
  }

  State.period = 0;
  State.day++;
  updateTimeUI(); updateEnergyUI(); updateSleepButton();
  addNarrative(`Day ${State.day}.`, 'sys');
  State.save();
}

// ── NAP ───────────────────────────────────────────────────────
function doNap() {
  if (!State.napAvailable) { addNarrative('You\'ve already rested today.', 'sys'); return; }
  State.napAvailable = false;
  State.energy = Math.min(100, State.energy + 40);
  // Advance 2 time periods
  State.period = Math.min(PERIODS.length - 1, State.period + 2);
  addNarrative('You find a quiet spot and rest for a couple of hours.', 'sleep');
  addNarrative(`You wake during the ${PERIODS[State.period].label.toLowerCase()}.`, 'sleep');
  updateTimeUI(); updateEnergyUI();
  State.save();
}

// ── CRAFTING UI ───────────────────────────────────────────────
function showCraftingMenu(stationType, stationLabel) {
  const overlay = document.getElementById('craft-overlay');
  const title   = document.getElementById('craft-title');
  const list    = document.getElementById('craft-list');
  if (!overlay) return;

  title.textContent = `${stationLabel}`;
  list.innerHTML = '';

  const recipes = getStationRecipes(stationType);
  if (recipes.length === 0) {
    list.innerHTML = '<div class="craft-empty">Nothing to craft here yet.</div>';
  }

  recipes.forEach(recipe => {
    const craftable = canCraft(recipe.id);
    const missing   = getMissing(recipe.id);
    const div = document.createElement('div');
    div.className = 'craft-item' + (craftable ? '' : ' unavailable');

    const ingList = Object.entries(recipe.ingredients)
      .map(([id, count]) => `${ITEMS[id]?.emoji || '?'}×${count}`)
      .join(' + ');

    div.innerHTML = `
      <div class="craft-header">
        <span class="craft-emoji">${recipe.emoji}</span>
        <span class="craft-name">${recipe.name}</span>
        <span class="craft-output">→ ×${recipe.output.count}</span>
      </div>
      <div class="craft-desc">${recipe.description}</div>
      <div class="craft-ing">${ingList} · ⚡${recipe.energyCost}</div>
      ${!craftable ? `<div class="craft-missing">Missing: ${missing.map(m=>`${m.item?.emoji}${m.need-m.have}`).join(', ')}</div>` : ''}
    `;
    if (craftable) {
      div.onclick = () => {
        doCraft(recipe.id,
          (r, out) => {
            addNarrative(`You craft ${r.emoji} ${r.name} ×${r.output.count}.`, 'sys');
            renderInventory(); renderWallet(); updateEnergyUI();
            showCraftingMenu(stationType, stationLabel); // refresh
          },
          (msg) => addNarrative(msg, 'alert')
        );
      };
    }
    list.appendChild(div);
  });

  overlay.classList.add('open');
}

function closeCraftingMenu() {
  document.getElementById('craft-overlay')?.classList.remove('open');
}

// ── MARKET UI ─────────────────────────────────────────────────
function showMarket() {
  const overlay = document.getElementById('market-overlay');
  if (overlay) overlay.classList.add('open');
  renderMarket();
}

// Open a single NPC's stall without the market-day requirement
function openNPCShop(stallId) {
  const overlay = document.getElementById('market-overlay');
  if (overlay) overlay.classList.add('open');
  renderMarket(stallId);
}

function renderMarket(filterStallId) {
  const container = document.getElementById('market-stalls');
  if (!container) return;
  container.innerHTML = '';

  const stalls = filterStallId ? MARKET_STALLS.filter(s => s.id === filterStallId) : MARKET_STALLS;
  stalls.forEach(stall => {
    const section = document.createElement('div');
    section.className = 'market-stall';
    section.innerHTML = `<div class="stall-name">${stall.emoji} ${stall.name}</div>`;

    // Buy section
    if (stall.sells.length) {
      const buyDiv = document.createElement('div');
      buyDiv.className = 'stall-section';
      buyDiv.innerHTML = '<div class="stall-label">Buy:</div>';
      stall.sells.forEach(listing => {
        const item = ITEMS[listing.itemId];
        const [colorKey, amount] = Object.entries(listing.cost)[0];
        const emoji = colorKey==='red'?'🔴':colorKey==='blue'?'🔵':'🟡';
        const canBuy = State.canAfford(listing.cost);
        const btn = document.createElement('button');
        btn.className = 'market-btn' + (canBuy ? '' : ' disabled');
        btn.textContent = `${listing.label} — ${amount}${emoji}`;
        if (canBuy) btn.onclick = () => {
          State.spendChits(colorKey, amount);
          State.addItem(item);
          addNarrative(`You buy ${item.emoji} ${item.name}.`);
          renderInventory(); renderWallet(); renderMarket();
        };
        buyDiv.appendChild(btn);
      });
      section.appendChild(buyDiv);
    }

    // Sell section
    if (stall.buys.length) {
      const sellDiv = document.createElement('div');
      sellDiv.className = 'stall-section';
      sellDiv.innerHTML = '<div class="stall-label">Sell:</div>';
      stall.buys.forEach(itemId => {
        const item = ITEMS[itemId];
        if (!item || !State.hasItem(itemId) || !item.sellValue) return;
        const [colorKey, amount] = Object.entries(item.sellValue)[0];
        const emoji = colorKey==='red'?'🔴':colorKey==='blue'?'🔵':'🟡';
        const btn = document.createElement('button');
        btn.className = 'market-btn';
        btn.textContent = `${item.emoji} ${item.name} → ${amount}${emoji}`;
        btn.onclick = () => {
          State.removeItem(itemId);
          State.addChits(colorKey, amount);
          addNarrative(`You sell ${item.emoji} ${item.name} for ${amount}${emoji}.`);
          renderInventory(); renderWallet(); renderMarket();
        };
        sellDiv.appendChild(btn);
      });
      if (!sellDiv.querySelector('.market-btn')) {
        sellDiv.innerHTML += '<div class="stall-empty">Nothing to sell here.</div>';
      }
      section.appendChild(sellDiv);
    }

    container.appendChild(section);
  });
}

function closeMarket() {
  document.getElementById('market-overlay')?.classList.remove('open');
}

// ── BUILDING INTERIOR UI ──────────────────────────────────────
function updateSceneLabel(name) {
  const el = document.getElementById('scene-label');
  if (el) el.textContent = name;
}

// ── PLOT OVERLAY ──────────────────────────────────────────────
const PLOT_GOAL = {
  chits:     { gold: 20 },
  materials: {
    timber:       8,
    stone_block:  12,
    iron_fitting: 6,
    clay_brick:   10,
    glass_piece:  2,
  },
};

function openPlot() {
  renderPlot();
  document.getElementById('plot-overlay').classList.add('open');
}

function closePlot() {
  document.getElementById('plot-overlay').classList.remove('open');
}

function renderPlot() {
  const plot = State.plot;

  // Flavour description
  const desc = document.getElementById('plot-desc');
  const totalMats = Object.values(plot.materials).reduce((a,b)=>a+b,0);
  const goldSaved = plot.chits.gold || 0;
  if (totalMats === 0 && goldSaved === 0) {
    desc.textContent = 'A cleared patch of earth near the old elm. Jaxon hammered a stake in to mark it. It smells like grass and possibility.';
  } else {
    desc.textContent = `The pile is growing. ${goldSaved > 0 ? goldSaved + ' gold chit' + (goldSaved>1?'s':'') + ' tucked under the stake. ' : ''}${totalMats > 0 ? totalMats + ' piece' + (totalMats>1?'s':'')+' of material stacked by the elm.' : ''}`;
  }

  // Contents
  const contents = document.getElementById('plot-contents');
  contents.innerHTML = '';

  // Chits stored
  const chitRow = document.createElement('div');
  chitRow.innerHTML = '<div style="font-family:var(--font-title);font-size:0.72rem;letter-spacing:0.1em;margin-bottom:6px">Fund · Goal: 20 🟡</div>';
  const colors = [['red','🔴',(plot.chits.red||0)], ['blue','🔵',(plot.chits.blue||0)], ['gold','🟡',(plot.chits.gold||0)]];
  colors.forEach(([c,e,n]) => {
    if (n <= 0) return;
    const row = document.createElement('div');
    row.className = 'plot-row';
    row.innerHTML = `<span>${e} ${c} chits</span><span style="font-family:var(--font-hand)">${n}</span>`;
    chitRow.appendChild(row);
  });
  if ((plot.chits.red||0)+(plot.chits.blue||0)+(plot.chits.gold||0) === 0) {
    chitRow.innerHTML += '<div class="plot-empty">No chits deposited yet.</div>';
  }
  contents.appendChild(chitRow);

  // Materials stored
  const matDiv = document.createElement('div');
  matDiv.innerHTML = '<div style="font-family:var(--font-title);font-size:0.72rem;letter-spacing:0.1em;margin:10px 0 6px">Materials</div>';
  const goalMats = PLOT_GOAL.materials;
  let anyMat = false;
  Object.entries(goalMats).forEach(([id, needed]) => {
    const have = plot.materials[id] || 0;
    if (have === 0) return;
    anyMat = true;
    const item = ITEMS[id];
    const row = document.createElement('div');
    row.className = 'plot-row';
    row.innerHTML = `<span>${item.emoji} ${item.name}</span><span style="font-family:var(--font-hand)">${have} / ${needed}</span>`;
    matDiv.appendChild(row);
  });
  // Show what's still needed
  const neededDiv = document.createElement('div');
  neededDiv.style.cssText = 'font-family:var(--font-hand);font-size:0.78rem;color:var(--sepia);margin-top:6px';
  const missing = Object.entries(goalMats)
    .filter(([id, n]) => (plot.materials[id]||0) < n)
    .map(([id, n]) => `${ITEMS[id].emoji} ${n-(plot.materials[id]||0)} more ${ITEMS[id].name}`)
    .join(', ');
  if (missing) neededDiv.textContent = 'Still needed: ' + missing;
  if (!anyMat) matDiv.innerHTML += '<div class="plot-empty">No materials yet.</div>';
  matDiv.appendChild(neededDiv);
  contents.appendChild(matDiv);

  // ── DEPOSIT CHITS ──────────────────────────────────────────
  const depositBtns = document.getElementById('plot-deposit-btns');
  depositBtns.innerHTML = '';
  [['red','🔴'], ['blue','🔵'], ['gold','🟡']].forEach(([color, emoji]) => {
    const have = State.wallet[color] || 0;
    [1, 5, 'all'].forEach(amt => {
      const real = amt === 'all' ? have : amt;
      if (real <= 0) return;
      const btn = document.createElement('button');
      btn.className = 'plot-btn' + (have < real ? ' disabled' : '');
      btn.textContent = `${emoji}×${amt === 'all' ? have : amt}`;
      if (have >= real) btn.onclick = () => {
        State.spendChits(color, real);
        plot.chits[color] = (plot.chits[color] || 0) + real;
        renderWallet();
        renderPlot();
        State.save();
        addNarrative(`You tuck ${real} ${emoji} under the stake.`, 'sys');
      };
      depositBtns.appendChild(btn);
    });
  });

  // ── DEPOSIT MATERIALS ──────────────────────────────────────
  const matBtns = document.getElementById('plot-material-btns');
  matBtns.innerHTML = '';
  Object.keys(goalMats).forEach(id => {
    const item = ITEMS[id];
    const count = State.countItem(id);
    if (count === 0) return;
    const btn = document.createElement('button');
    btn.className = 'plot-btn';
    btn.textContent = `${item.emoji} ${item.name} ×${count}`;
    btn.onclick = () => {
      // Deposit all of this material
      for (let i = 0; i < count; i++) State.removeItem(id);
      plot.materials[id] = (plot.materials[id] || 0) + count;
      renderInventory();
      renderPlot();
      State.save();
      addNarrative(`You stack ${count} ${item.emoji} ${item.name} by the elm.`, 'sys');
    };
    matBtns.appendChild(btn);
  });
  if (matBtns.children.length === 0) {
    matBtns.innerHTML = '<span class="plot-empty">No building materials in your pack.</span>';
  }
}
