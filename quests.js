// Check if a quest can be offered (NPC has quest, not already active/complete, player lacks item)
function canOfferQuest(npc) {
  if (!npc.quest) return false;
  const q = npc.quest;
  if (State.activeQuests.find(aq => aq.id === q.id)) return false;
  if (State.completedQuests.find(cq => cq.id === q.id)) return false;
  return true;
}

// Offer a quest from an NPC — returns dialogue line if offered
function offerQuest(npc) {
  if (!canOfferQuest(npc)) return null;
  const q = npc.quest;
  State.addQuest({
    id:           q.id,
    npcId:        npc.id,
    npcName:      npc.name,
    npcEmoji:     npc.emoji,
    itemId:       q.itemId,
    itemName:     q.itemName,
    reward:       q.reward,        // 'chit' | 'item'
    rewardColor:  q.rewardColor,   // for chit
    rewardAmount: q.rewardAmount,  // for chit
    rewardItemId: q.rewardItemId,  // for item reward
  });
  State.save();
  return q.line;
}

// Check if player can complete any quest (has required item)
function checkQuestCompletion(npcId) {
  const quest = State.activeQuests.find(q => q.npcId === npcId);
  if (!quest) return null;
  if (!State.hasItem(quest.itemId)) return null;
  return quest;
}

// Complete a quest — remove item, grant reward, return result message
function completeQuest(questId) {
  const quest = State.activeQuests.find(q => q.id === questId);
  if (!quest) return null;

  // Remove item from inventory
  State.removeItem(quest.itemId);

  // Grant reward
  let rewardMsg = '';
  if (quest.reward === 'chit') {
    State.addChits(quest.rewardColor, quest.rewardAmount);
    const emoji = quest.rewardColor==='red'?'🔴':quest.rewardColor==='blue'?'🔵':'🟡';
    rewardMsg = `${quest.npcName} thanks you and gives you ${quest.rewardAmount} ${emoji}.`;
  } else if (quest.reward === 'item') {
    const item = ITEMS[quest.rewardItemId];
    if (item) {
      State.addItem(item);
      rewardMsg = `${quest.npcName} thanks you and gives you ${item.emoji} ${item.name}.`;
    }
  }

  // Raise goodwill
  State.raiseGoodwill(quest.npcId, 1);
  State.completeQuest(questId);
  State.save();

  return rewardMsg;
}

// Render quest list to UI
function renderQuestList() {
  const box = document.getElementById('quest-list');
  if (!box) return;
  box.innerHTML = '';

  if (State.activeQuests.length === 0) {
    box.innerHTML = '<div class="quest-empty">No active tasks</div>';
    return;
  }

  State.activeQuests.forEach(q => {
    const item = ITEMS[q.itemId];
    const have = State.hasItem(q.itemId);
    const div = document.createElement('div');
    div.className = 'quest-item' + (have ? ' ready' : '');
    div.innerHTML = `
      <span class="quest-npc">${q.npcEmoji} ${q.npcName}</span>
      <span class="quest-arrow">→</span>
      <span class="quest-item-name">${item?.emoji || ''} ${q.itemName}</span>
      ${have ? '<span class="quest-ready">✓ ready</span>' : ''}
    `;
    box.appendChild(div);
  });
}
