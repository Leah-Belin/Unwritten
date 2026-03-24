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
          (r, _out) => {
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
