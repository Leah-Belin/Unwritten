// ── STATION TYPES ─────────────────────────────────────────────
const STATION_TYPES = {
  oven:       { label:'Oven',       emoji:'🔥', canCraft:['food'] },
  hearth:     { label:'Hearth',     emoji:'🔥', canCraft:['food','tonic'] },
  worktable:  { label:'Worktable',  emoji:'🔧', canCraft:['tonic','herb'] },
  forge:      { label:'Forge',      emoji:'🔨', canCraft:[] }, // no crafting, just lore
  campfire:   { label:'Campfire',   emoji:'🏕️', canCraft:['food'] },
};

// ── RECIPES ───────────────────────────────────────────────────
// ingredients: { itemId: count }
// output: { itemId, count }
// stationTypes: array of compatible station types
const RECIPES = {
  // ── TIER 0 — always known ───────────────────────────────────
  simple_bread: {
    id: 'simple_bread',
    name: 'Simple Bread',
    emoji: '🍞',
    tier: 0,
    stationTypes: ['oven','hearth'],
    ingredients: { grain:1 },
    // water is always available — not tracked as item
    output: { itemId:'simple_bread', count:2 },
    energyCost: 8,
    description: 'Basic bread. Fills the belly and sells well.',
  },
  herb_bundle: {
    id: 'herb_bundle',
    name: 'Herb Bundle',
    emoji: '🌿',
    tier: 0,
    stationTypes: ['oven','hearth','worktable','campfire'],
    ingredients: { common_herb:2 },
    output: { itemId:'herb_bundle', count:1 },
    energyCost: 2,
    description: 'Dried and bundled herbs. Useful for trade.',
  },

  // ── TIER 1 — Mariella teaches (goodwill 3) ──────────────────
  spiced_rolls: {
    id: 'spiced_rolls',
    name: 'Spiced Rolls',
    emoji: '🥐',
    tier: 1,
    stationTypes: ['oven','hearth'],
    ingredients: { grain:1, spice_herb:1 },
    output: { itemId:'spiced_rolls', count:3 },
    energyCost: 10,
    description: 'Her mother\'s recipe. Sells for more than plain bread.',
  },
  fruit_preserve: {
    id: 'fruit_preserve',
    name: 'Fruit Preserve',
    emoji: '🫙',
    tier: 1,
    stationTypes: ['oven','hearth'],
    ingredients: { fruit:2, honey:1 },
    output: { itemId:'fruit_preserve', count:1 },
    energyCost: 8,
    description: 'Sweet and long-lasting. Worth a blue chit at market.',
  },
  morning_tea: {
    id: 'morning_tea',
    name: 'Morning Tea',
    emoji: '🍵',
    tier: 1,
    stationTypes: ['hearth','oven','campfire'],
    ingredients: { mint_herb:1 },
    output: { itemId:'morning_tea', count:2 },
    energyCost: 2,
    description: 'Mint tea. Restores energy gently.',
  },

  // ── TIER 2 — Gallan's cabinet (garden key required) ─────────
  healing_tonic: {
    id: 'healing_tonic',
    name: 'Healing Tonic',
    emoji: '🧪',
    tier: 2,
    stationTypes: ['worktable','hearth'],
    ingredients: { healing_herb:1, root:1 },
    output: { itemId:'healing_tonic', count:1 },
    energyCost: 12,
    description: 'Her father\'s formula, learned from the bundles he left. Powerful.',
  },
  energy_salve: {
    id: 'energy_salve',
    name: 'Energy Salve',
    emoji: '💚',
    tier: 2,
    stationTypes: ['worktable'],
    ingredients: { healing_herb:1, spice_herb:1, oil:1 },
    output: { itemId:'energy_salve', count:1 },
    energyCost: 10,
    description: 'Rub into the wrists. Energy returns slowly over time.',
  },
  sleep_draught: {
    id: 'sleep_draught',
    name: 'Sleep Draught',
    emoji: '💤',
    tier: 2,
    stationTypes: ['worktable','hearth'],
    ingredients: { lavender:1, honey:1, root:1 },
    output: { itemId:'sleep_draught', count:1 },
    energyCost: 15,
    rare: true,
    description: 'Full night\'s rest in a vial. Ingredients are hard to come by.',
  },

  // ── TIER 3 — Villager recipes ────────────────────────────────
  hestas_remedy: {
    id: 'hestas_remedy',
    name: "Hesta's Remedy",
    emoji: '🌾',
    tier: 3,
    stationTypes: ['hearth','campfire'],
    ingredients: { common_herb:1, root:1, honey:1 },
    output: { itemId:'hestas_remedy', count:1 },
    energyCost: 5,
    description: 'An old remedy. Works better than anything from a book, Hesta says.',
  },
  strong_tea: {
    id: 'strong_tea',
    name: 'Strong Tea',
    emoji: '☕',
    tier: 3,
    stationTypes: ['hearth','oven','campfire'],
    ingredients: { mint_herb:1, spice_herb:1 },
    output: { itemId:'strong_tea', count:1 },
    energyCost: 3,
    description: "The innkeeper's house blend. Keeps you sharp.",
  },
  blacksmith_broth: {
    id: 'blacksmith_broth',
    name: "Oswin's Broth",
    emoji: '🥣',
    tier: 3,
    stationTypes: ['hearth','campfire'],
    ingredients: { root:1, spice_herb:1 },
    output: { itemId:'blacksmith_broth', count:1 },
    energyCost: 5,
    description: 'Warming. Good for cold nights.',
  },
};

// ── CRAFTING FUNCTIONS ────────────────────────────────────────

// Get all recipes craftable at a given station type
function getStationRecipes(stationType) {
  return Object.values(RECIPES).filter(r =>
    State.knownRecipes.includes(r.id) &&
    r.stationTypes.includes(stationType)
  );
}

// Check if player has ingredients for a recipe
function canCraft(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return false;
  return Object.entries(recipe.ingredients).every(([itemId, count]) =>
    State.countItem(itemId) >= count
  );
}

// Get missing ingredients for a recipe
function getMissing(recipeId) {
  const recipe = RECIPES[recipeId];
  if (!recipe) return [];
  return Object.entries(recipe.ingredients)
    .filter(([itemId, count]) => State.countItem(itemId) < count)
    .map(([itemId, count]) => ({
      item: ITEMS[itemId],
      have: State.countItem(itemId),
      need: count,
    }));
}

// Execute a craft
function doCraft(recipeId, onSuccess, onFail) {
  const recipe = RECIPES[recipeId];
  if (!recipe) { onFail('Unknown recipe.'); return; }
  if (!canCraft(recipeId)) { onFail('You don\'t have the ingredients.'); return; }
  if (State.energy < recipe.energyCost) { onFail('You\'re too tired to craft right now.'); return; }

  // Consume ingredients
  Object.entries(recipe.ingredients).forEach(([itemId, count]) => {
    for (let i = 0; i < count; i++) State.removeItem(itemId);
  });

  // Drain energy
  State.energy = Math.max(0, State.energy - recipe.energyCost);

  // Add output
  const outputItem = ITEMS[recipe.output.itemId];
  for (let i = 0; i < recipe.output.count; i++) State.addItem(outputItem);

  onSuccess(recipe, outputItem);
  State.save();
}

// Use a consumable item
function useItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (!State.hasItem(itemId)) return null;

  if (item.sleepEffect) {
    // Sleep draught — full rest, advance to dawn
    State.removeItem(itemId);
    State.energy = 100;
    State.sleptTonight = true;
    return { type:'sleep', message:'The draught works quickly. You sleep deeply and wake rested.' };
  }

  if (item.energyRestore > 0) {
    State.removeItem(itemId);
    const restored = Math.min(item.energyRestore, 100 - State.energy);
    State.energy = Math.min(100, State.energy + item.energyRestore);
    return { type:'eat', message:`You use the ${item.name}. Energy +${restored}.`, restored };
  }

  return null;
}
