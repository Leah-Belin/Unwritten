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

function openCredits() {
  document.getElementById('credits-overlay').classList.add('open');
}

function closeCredits() {
  document.getElementById('credits-overlay').classList.remove('open');
}

function initOverlayDismiss() {
  [
    ['craft-overlay',   closeCraftingMenu],
    ['market-overlay',  closeMarket],
    ['plot-overlay',    closePlot],
    ['worldmap-overlay',toggleWorldMap],
    ['credits-overlay', closeCredits],
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
  chits.forEach(([cls, _emoji, count]) => {
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

// ── SCENE LABEL ───────────────────────────────────────────────
function updateSceneLabel(name) {
  const el = document.getElementById('scene-label');
  if (el) el.textContent = name;
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
