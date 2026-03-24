// ── EVENT QUEUE ───────────────────────────────────────────────
// Events waiting to fire, checked each period advance and on
// scene load.
const EVENT_QUEUE = [];
let   currentEvent   = null;   // event currently playing
let   currentPanel   = 0;      // index into event.panels
let   eventCallback  = null;   // called when event finishes

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
