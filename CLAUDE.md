# Unwritten — Project Instructions

## Image Assets

This project uses **PNG only for game sprites/decos** and **jpg/jpeg for building art panels**.

When the user shares an image in conversation (artwork, illustrations, etc.):

1. **Save or obtain the image as a jpg** — if the user uploads one, save it directly to `images/buildings/<name>.jpg`.
2. **Reference it via `<img src="...">` in `BUILDING_ART`** in `engine.js` — same pattern as all other building images:
   ```js
   name: `<img src="images/buildings/name.jpg" style="width:100%;height:100%;object-fit:cover">`,
   ```
3. **Commit and push** the jpg file along with any engine.js changes.

Do **not** create SVG files. Do **not** embed inline SVG in engine.js.

---

## Branch

All work goes on `main`. Always commit and push directly to `main`.

---

## Isometric Coordinate System

**Tile coordinates** (`col`, `row`) map to screen like this:

```
         col increases →  (screen: down-right)
         row increases ↓  (screen: down-left)

         Screen "north" (upper-right) = low row, low col
         Screen "south" (lower-left)  = high row, high col
```

- **A player walking north** moves toward row=0, col=0 (upper-right on screen).
- **A player walking south** moves toward high rows (lower-left on screen).
- **isoX(col, row)** = `(col - row) * TW/2` — increases right as col increases, decreases as row increases.
- **isoY(col, row)** = `(col + row) * TH/2` — always increases as col+row increases (south = lower on screen).

### Z-sort values (painter's algorithm — lower z drawn first = appears behind)

| Layer              | z bias |
|--------------------|--------|
| Ground tiles       | 0      |
| Collectible items  | +0.5   |
| Furniture          | +0.55  |
| Stations/cabinets  | +0.6   |
| Buildings (village)| +0.7   |
| Trees              | +0.75  |
| NPCs               | +0.8   |
| Decorations (deco) | +0.85  |

Full z = `row + col + bias`. Two objects at the same tile sort by bias.

### Building/deco image orientation

Isometric images have a **baked-in viewpoint**: camera looks from the north-east, so the **south-west face** (lower-left of the image) is the most visible "front."

- **A building's entrance should be on its lower-left** (SW face) for it to face an approaching player.
- A player approaching a building **from the south** (high row, walking toward low row) will see the SW face = the entrance. ✓
- A player approaching **from the north** (low row, walking toward high row) sees the NE face = the back. ✗

**Rule:** to make an entrance face the player, make the player approach from the south (enter the zone at a high row, walk toward low row where the building sits).

**Flipping a zone map ≠ flipping the image.** When you reverse which end of a zone the player enters from, update `entryPos`, `zoneReturn`, zone `exits`, and `ZONE_EXIT_MAP` — but do **not** flip the image. The image orientation is determined by approach direction in the zone, not by flipping pixels.

---

## Zone Connection Checklist

Four places must stay in sync whenever zone connections change:

| What                                | File                   | Key                    |
|-------------------------------------|------------------------|------------------------|
| Village tiles that trigger zone entry | `world.js`           | `ZONE_EXIT_MAP`        |
| Where player spawns when entering zone | `scene.js`          | `entryPos`             |
| Where player spawns on return to village | `scene.js`        | `zoneReturn`           |
| Exit tiles inside the zone itself   | `zones.js`             | zone `exits[]`         |

Current connections:

```
Village north (cols 19-20, rows 0-1)   ↔  temple_path  entryPos {col:13,row:18}  return {col:19,row:2}
Village south (cols 19-20, rows 38-39) ↔  garden       entryPos {col:10,row:24}  return {col:19,row:37}
Village west  (cols 0-1,   rows 19-20) ↔  forest       entryPos {col:28,row:10}  return {col:2,row:19}
Village east  (cols 38-39, rows 19-20) ↔  market       entryPos {col:3,row:10}   return {col:37,row:19}
```

Run `node validate-zones.js` after any zone connection change to catch mismatches automatically.

---

## Removing Image Backgrounds

Use the `scripts/remove-bg.sh` helper — it samples pixel colors, picks the right fuzz level, and saves a clean PNG in one step:

```bash
scripts/remove-bg.sh images/buildings/temple.png
# or with explicit fuzz override:
scripts/remove-bg.sh images/buildings/foo.png 20
```

The script:
1. Samples 20 points around the image edges to find the background color range
2. Calculates minimum fuzz needed to cover grid lines / fill areas
3. Runs flood-fill from all four edges with that fuzz
4. Saves the result in-place (backs up original to `.bak`)
5. Prints a visual alpha-coverage summary so you can confirm it worked

Do **not** pipe the result through `pngquant` — it corrupts alpha channels at low quality settings.
