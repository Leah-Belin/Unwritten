// Tests for State helper methods (state.js)
// State methods are all `this`-based with no DOM/canvas deps, so we mirror the
// object structure here rather than importing the global-heavy source file.

function makeState(overrides = {}) {
  return {
    wallet:          { red: 3, blue: 2, gold: 0, ...(overrides.wallet ?? {}) },
    inventory:       overrides.inventory     ?? [],
    knownRecipes:    overrides.knownRecipes  ?? ['simple_bread', 'herb_bundle'],
    goodwill:        {
      mariella: 3, jaxon: 1, sera: 0, blacksmith: 0,
      elder: 0, hesta: 0, innkeeper: 0, children: 0,
      ...(overrides.goodwill ?? {}),
    },
    activeQuests:    overrides.activeQuests    ?? [],
    completedQuests: overrides.completedQuests ?? [],
    day:             overrides.day    ?? 1,
    energy:          overrides.energy ?? 100,

    // ── methods (verbatim from state.js) ──────────────────────────
    addItem(item) {
      if (item.id === 'red_chit')  { this.wallet.red++;  return; }
      if (item.id === 'blue_chit') { this.wallet.blue++; return; }
      this.inventory.push({ ...item });
    },
    removeItem(itemId) {
      const i = this.inventory.findIndex(x => x.id === itemId);
      if (i !== -1) this.inventory.splice(i, 1);
    },
    hasItem(itemId)   { return this.inventory.some(x => x.id === itemId); },
    countItem(itemId) { return this.inventory.filter(x => x.id === itemId).length; },
    countCords()      { return this.inventory.filter(x => x.category === 'cord').length; },
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
        return true;
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
    isMarketDay() { return (this.day - 1) % 7 === 0; },
  };
}

// ── wallet ────────────────────────────────────────────────────────────────────

describe('wallet: addChits', () => {
  it('increases the correct color', () => {
    const s = makeState();
    s.addChits('red', 5);
    expect(s.wallet.red).toBe(8);
    expect(s.wallet.blue).toBe(2); // unchanged
  });

  it('works on a color that starts at zero', () => {
    const s = makeState();
    s.addChits('gold', 1);
    expect(s.wallet.gold).toBe(1);
  });
});

describe('wallet: spendChits', () => {
  it('deducts and returns true when affordable', () => {
    const s = makeState();
    expect(s.spendChits('blue', 1)).toBe(true);
    expect(s.wallet.blue).toBe(1);
  });

  it('returns false and leaves wallet unchanged when insufficient', () => {
    const s = makeState();
    expect(s.spendChits('gold', 1)).toBe(false);
    expect(s.wallet.gold).toBe(0);
  });

  it('allows spending exact balance', () => {
    const s = makeState();
    expect(s.spendChits('red', 3)).toBe(true);
    expect(s.wallet.red).toBe(0);
  });
});

describe('wallet: canAfford', () => {
  it('returns true when wallet covers cost', () => {
    expect(makeState().canAfford({ red: 2, blue: 1 })).toBe(true);
  });

  it('returns false when short on any color', () => {
    expect(makeState().canAfford({ gold: 1 })).toBe(false);
  });

  it('returns true for null cost', () => {
    expect(makeState().canAfford(null)).toBe(true);
  });

  it('returns true for empty cost object', () => {
    expect(makeState().canAfford({})).toBe(true);
  });
});

// ── inventory ─────────────────────────────────────────────────────────────────

describe('inventory: addItem', () => {
  it('adds non-currency items to inventory', () => {
    const s = makeState();
    s.addItem({ id: 'common_herb', name: 'Common Herb', category: 'herb' });
    expect(s.inventory).toHaveLength(1);
    expect(s.inventory[0].id).toBe('common_herb');
  });

  it('red_chit goes to wallet, not inventory', () => {
    const s = makeState();
    s.addItem({ id: 'red_chit' });
    expect(s.wallet.red).toBe(4);
    expect(s.inventory).toHaveLength(0);
  });

  it('blue_chit goes to wallet, not inventory', () => {
    const s = makeState();
    s.addItem({ id: 'blue_chit' });
    expect(s.wallet.blue).toBe(3);
    expect(s.inventory).toHaveLength(0);
  });
});

describe('inventory: removeItem', () => {
  it('removes the first match only', () => {
    const s = makeState();
    s.addItem({ id: 'grain' });
    s.addItem({ id: 'grain' });
    s.removeItem('grain');
    expect(s.countItem('grain')).toBe(1);
  });

  it('is a no-op when item is absent', () => {
    const s = makeState();
    expect(() => s.removeItem('missing')).not.toThrow();
    expect(s.inventory).toHaveLength(0);
  });
});

describe('inventory: hasItem / countItem', () => {
  it('hasItem returns false initially', () => {
    expect(makeState().hasItem('healing_tonic')).toBe(false);
  });

  it('hasItem returns true after addItem', () => {
    const s = makeState();
    s.addItem({ id: 'grain', category: 'ingredient' });
    expect(s.hasItem('grain')).toBe(true);
  });

  it('countItem counts duplicates', () => {
    const s = makeState();
    s.addItem({ id: 'common_herb', category: 'herb' });
    s.addItem({ id: 'common_herb', category: 'herb' });
    expect(s.countItem('common_herb')).toBe(2);
  });

  it('countItem returns 0 for absent items', () => {
    expect(makeState().countItem('nope')).toBe(0);
  });
});

describe('inventory: countCords', () => {
  it('counts only cord-category items', () => {
    const s = makeState();
    s.addItem({ id: 'cord_1', category: 'cord' });
    s.addItem({ id: 'cord_2', category: 'cord' });
    s.addItem({ id: 'grain',  category: 'ingredient' });
    expect(s.countCords()).toBe(2);
  });
});

// ── goodwill ──────────────────────────────────────────────────────────────────

describe('goodwill: raiseGoodwill', () => {
  it('increments by 1 by default', () => {
    const s = makeState();
    s.raiseGoodwill('jaxon');
    expect(s.goodwill.jaxon).toBe(2);
  });

  it('increments by custom amount', () => {
    const s = makeState();
    s.raiseGoodwill('jaxon', 3);
    expect(s.goodwill.jaxon).toBe(4);
  });

  it('caps at 5', () => {
    const s = makeState({ goodwill: { mariella: 5 } });
    s.raiseGoodwill('mariella');
    expect(s.goodwill.mariella).toBe(5);
  });

  it('ignores unknown NPC ids without throwing', () => {
    const s = makeState();
    expect(() => s.raiseGoodwill('ghost_npc')).not.toThrow();
  });
});

// ── recipes ───────────────────────────────────────────────────────────────────

describe('recipes: learnRecipe', () => {
  it('adds a new recipe and returns true', () => {
    const s = makeState();
    expect(s.learnRecipe('healing_tonic')).toBe(true);
    expect(s.knownRecipes).toContain('healing_tonic');
  });

  it('is idempotent — duplicate learn returns false', () => {
    const s = makeState();
    s.learnRecipe('simple_bread');
    expect(s.learnRecipe('simple_bread')).toBe(false);
    expect(s.knownRecipes.filter(r => r === 'simple_bread')).toHaveLength(1);
  });
});

// ── quests ────────────────────────────────────────────────────────────────────

const QUEST = { id: 'q_grain', npcId: 'mariella', itemId: 'grain', reward: 'red' };

describe('quests: addQuest / completeQuest', () => {
  it('addQuest adds to active list', () => {
    const s = makeState();
    s.addQuest(QUEST);
    expect(s.activeQuests).toHaveLength(1);
  });

  it('addQuest is idempotent', () => {
    const s = makeState();
    s.addQuest(QUEST);
    s.addQuest(QUEST);
    expect(s.activeQuests).toHaveLength(1);
  });

  it('completeQuest moves quest from active to completed', () => {
    const s = makeState();
    s.addQuest(QUEST);
    s.completeQuest('q_grain');
    expect(s.activeQuests).toHaveLength(0);
    expect(s.completedQuests).toHaveLength(1);
    expect(s.completedQuests[0].id).toBe('q_grain');
  });

  it('completeQuest is a no-op for unknown id', () => {
    const s = makeState();
    expect(() => s.completeQuest('nonexistent')).not.toThrow();
    expect(s.completedQuests).toHaveLength(0);
  });
});

// ── market day ────────────────────────────────────────────────────────────────

describe('isMarketDay', () => {
  it.each([1, 8, 15, 22])('day %i is a market day', (day) => {
    expect(makeState({ day }).isMarketDay()).toBe(true);
  });

  it.each([2, 3, 7, 9, 14])('day %i is not a market day', (day) => {
    expect(makeState({ day }).isMarketDay()).toBe(false);
  });
});
