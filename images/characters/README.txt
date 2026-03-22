CHARACTER SPRITE SHEETS
=======================

Place PNG sprite sheets here to replace the emoji character rendering.

FILE NAMING
-----------
  player.png          → Kaida (the player)
  mariella.png        → Mariella
  jaxon.png           → Jaxon
  the_priest.png      → The Priest
  (etc.)              → lowercase NPC name, spaces → underscores

SPRITE SHEET FORMAT
-------------------
  Frame size:  64 × 64 pixels per frame
  Sheet rows:
    Row 0  →  walk up    (4 frames across)
    Row 1  →  walk left  (4 frames across)
    Row 2  →  walk down  (4 frames across)
    Row 3  →  walk right (4 frames across)

  Total sheet size: 256 × 256 px minimum

RECOMMENDED TOOL
----------------
  Universal LPC Spritesheet Character Generator
  https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/

  The LPC generator exports sheets with 64×64 frames.
  Walk cycle rows in LPC output: up=8, left=9, down=10, right=11
  If using the full LPC sheet, update SPRITE_ROWS in renderer.js:
    const SPRITE_ROWS = { up:8, left:9, down:2, right:11 };
  (Row 2 for down is the same in both formats; up/left/right differ.)

FALLBACK
--------
  If no PNG is found, the game automatically falls back to the
  original emoji circle rendering — so the game always works.
