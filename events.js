//
// A "story event" is a scripted sequence that plays at a specific
// trigger point — day/time, location, flag combination.
//
// Each event is a series of PANELS:
//   { speaker, portrait, text, style }
//
// Between panels, optional CHOICES branch the narration:
//   { text, onChoose }   — all paths converge, choices only
//                          affect flavour text, not outcomes.
//
// Events can also SET FLAGS and SPAWN items/NPCs.
// ═══════════════════════════════════════════════════════════════


// ── EVENT QUEUE ───────────────────────────────────────────────
// Events waiting to fire, checked each period advance and on
// scene load.
const EVENT_QUEUE = [];
let   currentEvent   = null;   // event currently playing
let   currentPanel   = 0;      // index into event.panels
let   eventCallback  = null;   // called when event finishes

// ── STORY EVENT DEFINITIONS ───────────────────────────────────
// trigger: { day, period, scene, flag, flagFalse }
//   All fields optional — event fires when ALL present match.
//   once: true means it fires only once ever.

const STORY_EVENTS = [

  // ── EVENT 0: KELL BROUGHT IN ─────────────────────────────
  // Fires evening of Day 1 if Kaida is in the bakery or village
  {
    id:      'kell_accident',
    once:    true,
    trigger: { day:1, period:5 },   // Dusk, Day 1
    panels: [
      {
        speaker:  'NARRATION',
        text:     'A desperate scream tears through the village square — then more, frantic and overlapping.',
        style:    'alert',
      },
      {
        speaker:  'NARRATION',
        text:     'You rush to the window. Men are carrying someone from the forge — Kell, the blacksmith. Something has gone terribly wrong.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'Your father is already there. Urgent footsteps cross the square toward the bakery.',
        style:    'normal',
      },
    ],
    choices: {
      // After panel 2, before panel 3
      afterPanel: 1,
      prompt: 'How do you respond?',
      options: [
        {
          text: 'Race downstairs immediately',
          outcome: 'You are already at the door when the knock comes.',
          flag: 'kell_choice_fast',
        },
        {
          text: 'Grab your herb pouch first',
          outcome: 'You snatch your herb pouch — two seconds, but the right instinct.',
          flag: 'kell_choice_prepared',
        },
      ],
    },
    onComplete() {
      State.flags.kell_accident_seen = true;
      // Move player to bakery ground floor for surgery sequence
      // Trigger the surgery scene immediately
      setTimeout(() => queueEvent('kell_surgery'), 800);
    },
  },

  // ── EVENT 1: KELL SURGERY ────────────────────────────────
  {
    id:      'kell_surgery',
    once:    true,
    trigger: { flag: 'kell_accident_seen' },
    panels: [
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Moonflower salve, yarrow tincture, all the fresh bandages. And willow bark tea — strong."',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'Kell fills the surgery doorway — four men barely able to carry him. His left arm is blackened to the bone.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'Your father works without speaking. You know what he needs before he asks.',
        style:    'normal',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Hold him steady, Kaida."',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'Hours pass. Near dawn, Galen sets down his instruments. The rasping of the bone saw. The sizzle of the cauterizing iron. The smell of it.',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     '"He\'ll live," your father says quietly. "The arm is gone, but he\'ll live."',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'You sink into a chair. Your hands are green with herbs, raw from soap. You stare at them for a long time.',
        style:    'sleep',
      },
    ],
    onComplete() {
      State.flags.kell_surgery_done = true;
      State.flags.knows_kell_injured = true;
      // Kell now has a presence in the village — one-armed smith
      addNarrative('Kell will recover. The village will have to find him a new purpose.', 'sys');
      addNarrative('↳ Day 2 begins.', 'sys');
      // Advance to morning of Day 2
      State.day++;
      State.period = 1;
      State.energy = Math.min(70, State.energy); // exhausted from the night
      updateTimeUI();
      updateEnergyUI();
      State.save();
    },
  },

  // ── EVENT 2: GALEN FINDS THE STONE FLOWER ─────────────────
  // Fires when player visits the mountain garden with flag
  // set after Galen mentions it at breakfast
  {
    id:      'stone_flower_discovery',
    once:    true,
    trigger: { scene:'garden', flag:'galen_excited_morning' },
    panels: [
      {
        speaker:  'NARRATION',
        text:     'Your father stops suddenly, dropping to one knee. His hands hover over a small plant with bright green leaves and tiny purple flowers.',
        style:    'normal',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Kaida — look. This is it. I saw this once in the city apothecary years ago. I\'ve been looking ever since."',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'He reaches into his satchel for a clay pot. His hands are careful — reverent, almost.',
        style:    'normal',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Stone flower. A powerful sedative if I\'m right. I need to propagate it, confirm the properties. Send word to the city."',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'He pauses. Something crosses his face — not quite excitement. Something older and more careful.',
        style:    'normal',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Don\'t mention this to your mother yet. I don\'t want to get her hopes up before I\'m certain."',
        style:    'normal',
      },
    ],
    choices: {
      afterPanel: 5,
      prompt: 'How do you respond to his secrecy?',
      options: [
        {
          text: 'Agree without question',
          outcome: 'You nod. He\'s always had reasons for his caution.',
          flag: 'stone_flower_unquestioned',
        },
        {
          text: 'Ask why it needs to be secret',
          outcome: '"Some knowledge draws attention before it\'s ready to be shared," he says. His eyes don\'t quite meet yours.',
          flag: 'stone_flower_questioned',
        },
      ],
    },
    onComplete() {
      State.flags.stone_flower_found = true;
      addNarrative('↳ Your father has found something unusual. He wants it kept quiet.', 'sys');
      State.save();
    },
  },

  // ── EVENT 3: GALEN'S DEATH ────────────────────────────────
  // The central event of Chapter 1. Fires when player reaches
  // the upper garden path after Galen has been up there alone
  // for too long (flag: gallan_writing_now)
  {
    id:      'galen_death',
    once:    true,
    trigger: { scene:'garden', flag:'gallan_writing_now' },
    panels: [
      {
        speaker:  'NARRATION',
        text:     'He\'s further up the path, past the herb garden — at the rock outcropping near the summit. His back is to you.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'As you get closer you see it. He is carving something into the stone with a silver dagger. Symbols. Marks.',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     'Writing.',
        style:    'alert',
      },
      {
        speaker:  'NARRATION',
        text:     'Your voice comes out smaller than you intend. "Father. What are you doing?"',
        style:    'normal',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"Kaida — you shouldn\'t be here. Go back down. Now."',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     'The wind rises from nowhere. The sky goes wrong — too dark, too fast.',
        style:    'dark',
      },
      {
        speaker:  'Galen',
        portrait: 'PORTRAIT_GALLAN',
        text:     '"RUN, KAIDA! RUN!"',
        style:    'alert',
      },
    ],
    choices: {
      afterPanel: 6,
      prompt: 'What do you do?',
      options: [
        {
          text: 'Run immediately',
          outcome: 'You run. You don\'t look back. Later you will wish you had.',
          flag: 'death_ran_immediately',
        },
        {
          text: 'Hesitate — reach toward him',
          outcome: 'You take one step toward him before the darkness swallows him whole. His last look is straight at you.',
          flag: 'death_hesitated',
        },
      ],
    },
    panelsAfterChoice: [
      {
        speaker:  'NARRATION',
        text:     'A fog — black, absolute — rises from the earth around the rock. It moves with purpose.',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     'He shoves you toward the path. His hands are warm on your shoulders, one last time.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'You run. You hear the roaring behind you. You feel the first cold drops of rain. You do not stop.',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     'The village lights appear below. You do not remember reaching them.',
        style:    'sleep',
      },
    ],
    onComplete() {
      State.flags.gallan_dead    = true;
      State.flags.gallan_writing_now = false;
      // Inscription is now etched in stone — visible at garden
      addNarrative('Galen is gone.', 'alert');
      addNarrative('↳ The village will find out. Everything is about to change.', 'sys');
      // Lock bakery upper post-exile eventually
      State.save();
      // After a moment, trigger the village discovery
      setTimeout(() => queueEvent('village_discovers'), 3000);
    },
  },

  // ── EVENT 4: VILLAGE DISCOVERS THE INSCRIPTION ───────────
  {
    id:      'village_discovers',
    once:    true,
    trigger: { flag:'gallan_dead' },
    panels: [
      {
        speaker:  'NARRATION',
        text:     'Morning. Someone has found the stone. The marks your father carved.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'The village does not need words to understand what happened. The inscription is there. The healer is gone. His daughter is standing in the square.',
        style:    'dark',
      },
      {
        speaker:  'Mariella',
        portrait: 'PORTRAIT_MARIELLA',
        text:     '"Stay inside, Kaida. Whatever they say — stay inside."',
        style:    'dark',
      },
      {
        speaker:  'NARRATION',
        text:     'They don\'t come for you that first day. Or the second. But the way the square empties when you walk through it — that is its own answer.',
        style:    'normal',
      },
    ],
    onComplete() {
      State.flags.exile_pending = true;
      addNarrative('↳ The village knows. The world you had is already gone — you just haven\'t been told yet.', 'sys');
      State.save();
    },
  },

  // ── EVENT 5: ARIC ARRIVES ─────────────────────────────────
  // The messenger arrives in the village — can be encountered
  // at the inn before the harvest festival
  {
    id:      'aric_arrives',
    once:    true,
    trigger: { day:5, period:2, scene:'village' },
    panels: [
      {
        speaker:  'NARRATION',
        text:     'A stranger arrives at the inn — broad shoulders, traveler\'s clothes, a worn leather satchel. He moves through the square with the unhurried confidence of someone who has walked a thousand roads.',
        style:    'normal',
      },
      {
        speaker:  'NARRATION',
        text:     'A messenger. You\'ve seen them before, passing through. They carry news between villages — voices for the voiceless.',
        style:    'normal',
      },
    ],
    onComplete() {
      State.flags.aric_in_village = true;
      // Unlock Aric as an NPC in the inn
      addNarrative('↳ A messenger has arrived at the inn.', 'sys');
      State.save();
    },
  },

];

// ── EVENT ENGINE ──────────────────────────────────────────────

function queueEvent(eventId) {
  const event = STORY_EVENTS.find(e => e.id === eventId);
  if (!event) return;
  if (event.once && State.flags[`event_done_${eventId}`]) return;
  if (!EVENT_QUEUE.find(e => e.id === eventId)) {
    EVENT_QUEUE.push(event);
  }
}

// Called every time period advances or scene changes
function checkStoryTriggers() {
  for (const event of STORY_EVENTS) {
    if (event.once && State.flags[`event_done_${event.id}`]) continue;
    if (EVENT_QUEUE.find(e => e.id === event.id)) continue;
    if (currentEvent?.id === event.id) continue;

    const t = event.trigger;
    if (!t) continue;

    let match = true;
    if (t.day     !== undefined && State.day    !== t.day)     match = false;
    if (t.period  !== undefined && State.period !== t.period)  match = false;
    if (t.scene   !== undefined && State.scene  !== t.scene)   match = false;
    if (t.flag    !== undefined && !State.flags[t.flag])       match = false;
    if (t.flagFalse !== undefined && State.flags[t.flagFalse]) match = false;

    if (match) EVENT_QUEUE.push(event);
  }

  // Fire next queued event if none playing
  if (!currentEvent && EVENT_QUEUE.length > 0) {
    fireNextEvent();
  }
}

function fireNextEvent() {
  if (currentEvent) return;
  if (EVENT_QUEUE.length === 0) return;

  currentEvent = EVENT_QUEUE.shift();
  currentPanel = 0;

  // Block all input while event plays
  openEventOverlay();
  showEventPanel(currentPanel);
}

// ── OVERLAY ───────────────────────────────────────────────────
function openEventOverlay() {
  const overlay = document.getElementById('event-overlay');
  if (overlay) overlay.classList.add('open');
}

function closeEventOverlay() {
  const overlay = document.getElementById('event-overlay');
  if (overlay) overlay.classList.remove('open');
}

function showEventPanel(idx) {
  if (!currentEvent) return;

  // Check if we should show a choice before this panel
  const choices = currentEvent.choices;
  if (choices && choices.afterPanel === idx - 1 && !State.flags[`choice_made_${currentEvent.id}`]) {
    showEventChoice();
    return;
  }

  const panels = currentEvent.panels;
  let panel = panels[idx];

  // After choices, use panelsAfterChoice if available
  const afterChoicePanels = currentEvent.panelsAfterChoice;
  if (idx >= panels.length && afterChoicePanels) {
    const afterIdx = idx - panels.length;
    panel = afterChoicePanels[afterIdx];
    if (!panel) {
      finishEvent();
      return;
    }
  } else if (!panel) {
    finishEvent();
    return;
  }

  renderEventPanel(panel);
}

function renderEventPanel(panel) {
  const portrait = document.getElementById('event-portrait');
  const speaker  = document.getElementById('event-speaker');
  const text     = document.getElementById('event-text');
  const cont     = document.getElementById('event-continue');

  if (!portrait || !speaker || !text) return;

  // Portrait
  if (panel.portrait && window[panel.portrait]) {
    portrait.innerHTML = `<img src="${window[panel.portrait]}" style="width:100%;height:100%;object-fit:cover;object-position:top">`;
  } else if (panel.speaker === 'NARRATION') {
    portrait.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--sepia)">📖</div>`;
  } else {
    portrait.textContent = '👤';
  }

  // Speaker
  speaker.textContent = panel.speaker === 'NARRATION' ? '' : panel.speaker;

  // Text — animate in
  text.textContent = '';
  text.className = `event-text style-${panel.style || 'normal'}`;
  typewriterEffect(text, panel.text, 28);

  // Continue prompt
  if (cont) cont.style.opacity = '0';
  setTimeout(() => {
    if (cont) cont.style.opacity = '1';
  }, panel.text.length * 28 + 300);
}

function typewriterEffect(el, str, delay) {
  el.textContent = '';
  let i = 0;
  function tick() {
    if (i < str.length) {
      el.textContent += str[i];
      i++;
      setTimeout(tick, delay);
    }
  }
  tick();
}

function advanceEventPanel() {
  if (!currentEvent) return;
  currentPanel++;
  showEventPanel(currentPanel);
}

function showEventChoice() {
  const choices = currentEvent.choices;
  const box     = document.getElementById('event-choice-box');
  const prompt  = document.getElementById('event-choice-prompt');
  const btns    = document.getElementById('event-choice-btns');
  if (!box || !btns) return;

  prompt.textContent = choices.prompt;
  btns.innerHTML = '';

  choices.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'event-choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      // Record choice flag
      State.flags[opt.flag] = true;
      State.flags[`choice_made_${currentEvent.id}`] = true;
      // Show outcome as a quick narrative
      addNarrative(opt.outcome, 'sys');
      // Hide choice box, continue panels
      box.style.display = 'none';
      currentPanel++; // advance past choice point
      showEventPanel(currentPanel);
    };
    btns.appendChild(btn);
  });

  box.style.display = 'block';
}

function finishEvent() {
  const event = currentEvent;
  currentEvent  = null;
  currentPanel  = 0;

  // Mark done
  State.flags[`event_done_${event.id}`] = true;

  // Run completion callback
  if (event.onComplete) event.onComplete();

  closeEventOverlay();

  // Check if more events queued
  setTimeout(checkStoryTriggers, 500);
}

// ── MORNING TRIGGER: Galen's breakfast excitement ─────────────
// Called from engine when day advances to Day 2 morning
function triggerGalenMorning() {
  if (State.flags.galen_excited_morning) return;
  if (State.flags.gallan_dead) return;
  State.flags.galen_excited_morning = true;
  // Queue a short in-bakery conversation
  queueEvent('galen_morning_herbs');
  State.save();
}

// Inline short event — Galen arrives with herbs, excited
STORY_EVENTS.push({
  id:   'galen_morning_herbs',
  once: true,
  trigger: { flag:'galen_excited_morning' },
  panels: [
    {
      speaker:  'NARRATION',
      text:     'Your father pushes open the bakery door, a sack of herbs over his shoulder. Something in his face is different — bright, barely contained.',
      style:    'normal',
    },
    {
      speaker:  'Galen',
      portrait: 'PORTRAIT_GALLAN',
      text:     '"Good morning." He sets the sack down, sorts one herb with exaggerated calm. The corner of his mouth betrays him.',
      style:    'normal',
    },
    {
      speaker:  'Mariella',
      portrait: 'PORTRAIT_MARIELLA',
      text:     '"What is it?" Your mother doesn\'t even look up from her dough.',
      style:    'normal',
    },
    {
      speaker:  'Galen',
      portrait: 'PORTRAIT_GALLAN',
      text:     '"I found something in the forest this morning. I want to go back and investigate." He is terrible at hiding excitement.',
      style:    'normal',
    },
    {
      speaker:  'Mariella',
      portrait: 'PORTRAIT_MARIELLA',
      text:     '"Go with your father this afternoon, Kaida. I can handle the bakery."',
      style:    'normal',
    },
  ],
  onComplete() {
    addNarrative('↳ Your father wants to show you something in the forest.', 'sys');
    State.save();
  },
});
