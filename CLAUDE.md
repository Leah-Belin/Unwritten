# Unwritten — Project Instructions

## Image Assets

When the user shares an image in conversation (artwork, illustrations, etc.):

1. **Recreate it as an SVG** — hand-craft an inline SVG that captures the style, palette, and key visual elements of the image.
2. **Save it to `images/buildings/<name>.svg`** — choose a descriptive filename matching the subject (e.g. `market.svg`, `bakery.svg`, `forest.svg`).
3. **Reference it via `<img src="...">` in `BUILDING_ART`** in `engine.js` — same pattern as all other building images:
   ```js
   name: `<img src="images/buildings/name.svg" style="width:100%;height:100%;object-fit:cover">`,
   ```
4. **Commit and push** the SVG file along with any engine.js changes.

Do **not** embed the raw SVG inline in engine.js — always use the external file reference.

## Branch

All work goes on `claude/ui-improvements-dHuiD`. Always commit and push changes.
