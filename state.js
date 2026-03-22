const SAVE_KEY = 'unwritten_v3';

const State = {

  // ── STORY FLAGS ──────────────────────────────────────────────
  flags: {
    knows_father_missing: false,
    found_garden_key:     false,
    cabinet_unlocked:     false,
    gallan_dead:          false,
    exile_begun:          false,
    harvest_festival:     false,
    volunteered_temple:   false,
    // cord reveal — when she has 3+ cords and talks to the priest
    cord_revealed:        false,
    jaxon_proposed:       false,
  },

  // ── TIME ─────────────────────────────────────────────────────
  day:        1,
  period:     0,   // index into PERIODS array
  actionTick: 0,   // increments per action; every TICKS_PER_PERIOD ticks = advance period

  // ── PLAYER CONDITION ─────────────────────────────────────────
  energy:          100,
  sleptTonight:    false,
  warningShown:    false,
  napAvailable:    true,   // resets each morning

  // ── ECONOMY ──────────────────────────────────────────────────
  wallet: { red: 3, blue: 2, gold: 0 },

  // ── PLOT FUND ────────────────────────────────────────────────
  plot: {
    unlocked:   false,    // true after jaxon_proposed
    chits:      { red:0, blue:0, gold:0 },
    materials:  {},       // { itemId: count }
  },

  // ── INVENTORY ────────────────────────────────────────────────
  // Each item: { id, name, emoji, category, energyRestore?, sellValue? }
  inventory: [],

  // ── KNOWN RECIPES ────────────────────────────────────────────
  knownRecipes: ['simple_bread', 'herb_bundle'],

  // ── GOODWILL ─────────────────────────────────────────────────
  goodwill: {
    mariella:    3,
    jaxon:       1,
    sera:        0,
    blacksmith:  0,
    elder:       0,
    hesta:       0,
    innkeeper:   0,
    children:    0,
  },

  // ── ACTIVE QUESTS ────────────────────────────────────────────
  // Each: { id, npcId, npcName, itemId, itemName, reward, rewardAmount }
  activeQuests: [],
  completedQuests: [],

  // ── SCENE ────────────────────────────────────────────────────
  scene: 'village',   // 'village' | building id
  playerCol: 20,
  playerRow: 23,

  // ── NPC DIALOGUE INDICES ─────────────────────────────────────
  npcDialogueIndex: {},

  // ── ITEM SPAWN TRACKER ───────────────────────────────────────
  // Tracks which one-time items have been taken
  takenItems: [],

  // ── MARKET ───────────────────────────────────────────────────
  // Market opens day 1, 8, 15... (every 7 days)
  isMarketDay() { return (this.day - 1) % 7 === 0; },

  // ── SAVE ─────────────────────────────────────────────────────
  save() {
    try {
      const data = {
        flags:             this.flags,
        day:               this.day,
        period:            this.period,
        actionTick:        this.actionTick,
        energy:            this.energy,
        sleptTonight:      this.sleptTonight,
        napAvailable:      this.napAvailable,
        wallet:            this.wallet,
        inventory:         this.inventory,
        knownRecipes:      this.knownRecipes,
        goodwill:          this.goodwill,
        activeQuests:      this.activeQuests,
        completedQuests:   this.completedQuests,
        scene:             this.scene,
        playerCol:         (typeof player !== 'undefined') ? player.col : this.playerCol,
        playerRow:         (typeof player !== 'undefined') ? player.row : this.playerRow,
        npcDialogueIndex:  this.npcDialogueIndex,
        takenItems:        this.takenItems,
        plot:              this.plot,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) { console.warn('Save failed:', e); }
  },

  // ── LOAD ─────────────────────────────────────────────────────
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      Object.assign(this.flags,    data.flags    || {});
      Object.assign(this.wallet,   data.wallet   || {});
      Object.assign(this.goodwill, data.goodwill || {});
      this.day              = data.day             ?? 1;
      this.period           = data.period          ?? 0;
      this.actionTick       = data.actionTick      ?? 0;
      this.energy           = data.energy          ?? 100;
      this.sleptTonight     = data.sleptTonight    ?? false;
      this.napAvailable     = data.napAvailable    ?? true;
      this.inventory        = data.inventory       ?? [];
      this.knownRecipes     = data.knownRecipes    ?? ['simple_bread','herb_bundle'];
      this.activeQuests     = data.activeQuests    ?? [];
      this.completedQuests  = data.completedQuests ?? [];
      this.scene            = data.scene            ?? 'village';
      this.playerCol        = data.playerCol        ?? 20;
      this.playerRow        = data.playerRow        ?? 23;
      this.npcDialogueIndex = data.npcDialogueIndex ?? {};
      this.takenItems       = data.takenItems      ?? [];
      if (data.plot) Object.assign(this.plot, data.plot);
      return true;
    } catch(e) { console.warn('Load failed:', e); return false; }
  },

  // ── RESET ─────────────────────────────────────────────────────
  reset() {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  },

  // ── HELPERS ──────────────────────────────────────────────────
  addItem(item) {
    // Currency items go straight to the purse, never into the pack
    if (item.id === 'red_chit')  { this.wallet.red++;  this.save(); return; }
    if (item.id === 'blue_chit') { this.wallet.blue++; this.save(); return; }
    this.inventory.push({ ...item });
  },

  removeItem(itemId) {
    const i = this.inventory.findIndex(x => x.id === itemId);
    if (i !== -1) this.inventory.splice(i, 1);
  },

  hasItem(itemId) {
    return this.inventory.some(x => x.id === itemId);
  },

  countItem(itemId) {
    return this.inventory.filter(x => x.id === itemId).length;
  },

  countCords() {
    return this.inventory.filter(x => x.category === 'cord').length;
  },

  addChits(color, amount) {
    this.wallet[color] = (this.wallet[color] || 0) + amount;
  },

  spendChits(color, amount) {
    if (this.wallet[color] < amount) return false;
    this.wallet[color] -= amount;
    return true;
  },

  canAfford(cost) {
    if (!cost) return true;
    return Object.entries(cost).every(([k, v]) => (this.wallet[k] || 0) >= v);
  },

  raiseGoodwill(npcId, amount = 1) {
    if (this.goodwill[npcId] !== undefined)
      this.goodwill[npcId] = Math.min(5, this.goodwill[npcId] + amount);
  },

  learnRecipe(recipeId) {
    if (!this.knownRecipes.includes(recipeId)) {
      this.knownRecipes.push(recipeId);
      return true; // newly learned
    }
    return false;
  },

  addQuest(quest) {
    if (!this.activeQuests.find(q => q.id === quest.id))
      this.activeQuests.push(quest);
  },

  completeQuest(questId) {
    const i = this.activeQuests.findIndex(q => q.id === questId);
    if (i !== -1) {
      this.completedQuests.push(this.activeQuests[i]);
      this.activeQuests.splice(i, 1);
    }
  },
};
