# Unwritten — Project Instructions

## Image Assets

This project uses **jpg/jpeg only** — no SVG files.

When the user shares an image in conversation (artwork, illustrations, etc.):

1. **Save or obtain the image as a jpg** — if the user uploads one, save it directly to `images/buildings/<name>.jpg`.
2. **Reference it via `<img src="...">` in `BUILDING_ART`** in `engine.js` — same pattern as all other building images:
   ```js
   name: `<img src="images/buildings/name.jpg" style="width:100%;height:100%;object-fit:cover">`,
   ```
3. **Commit and push** the jpg file along with any engine.js changes.

Do **not** create SVG files. Do **not** embed inline SVG in engine.js.

## Branch

All work goes on `main`. Always commit and push directly to `main`.
