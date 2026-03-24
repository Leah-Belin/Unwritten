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
