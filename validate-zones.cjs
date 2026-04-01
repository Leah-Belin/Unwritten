#!/usr/bin/env node
// validate-zones.cjs — zone connection consistency checker
// Run: node validate-zones.cjs
// Checks that ZONE_EXIT_MAP, entryPos, zoneReturn, and zone exits[] all agree.

const fs   = require('fs');
const path = require('path');

const DIR = __dirname;
function slurp(file) { return fs.readFileSync(path.join(DIR, file), 'utf8'); }

const worldSrc = slurp('world.js');
const sceneSrc = slurp('scene.js');
const zonesSrc = slurp('zones.js');

let errors = 0, checks = 0;
function fail(msg) { console.error('  ✗ ' + msg); errors++; checks++; }
function pass(msg) { console.log ('  ✓ ' + msg); checks++; }

// ── 1. Parse ZONE_EXIT_MAP ──────────────────────────────────────────────────
console.log('\n── ZONE_EXIT_MAP (world.js) ──');
const zemMatch = worldSrc.match(/const ZONE_EXIT_MAP\s*=\s*\{([^}]+)\}/s);
if (!zemMatch) { fail('Cannot find ZONE_EXIT_MAP'); process.exit(1); }

const zoneExitMap = {};
for (const m of zemMatch[1].matchAll(/'(\d+),(\d+)'\s*:\s*'(\w+)'/g))
  zoneExitMap[`${m[1]},${m[2]}`] = m[3];

const zoneToTiles = {};
for (const [key, zone] of Object.entries(zoneExitMap))
  (zoneToTiles[zone] ??= []).push(key);

for (const [zone, tiles] of Object.entries(zoneToTiles))
  pass(`${zone}: ${tiles.length} village tile(s) — ${tiles.join(', ')}`);

// ── 2. Village map dimensions ───────────────────────────────────────────────
const dimM = worldSrc.match(/VILLAGE_COLS\s*=\s*(\d+)[^;]*VILLAGE_ROWS\s*=\s*(\d+)/s)
          || worldSrc.match(/VILLAGE_ROWS\s*=\s*(\d+)[^;]*VILLAGE_COLS\s*=\s*(\d+)/s);
const VCOLS = dimM ? parseInt(dimM[1]) : 40;
const VROWS = dimM ? parseInt(dimM[2]) : 40;

// ── 3. Village exit tile bounds ─────────────────────────────────────────────
console.log('\n── Village exit tile bounds ──');
for (const key of Object.keys(zoneExitMap)) {
  const [c, r] = key.split(',').map(Number);
  if (c >= 0 && c < VCOLS && r >= 0 && r < VROWS)
    pass(`tile ${key} within village (${VCOLS}×${VROWS})`);
  else
    fail(`tile ${key} OUT OF BOUNDS for village (${VCOLS}×${VROWS})`);
}

// ── 4. Parse entryPos ───────────────────────────────────────────────────────
console.log('\n── entryPos (scene.js) ──');
// entryPos spans multiple lines and contains nested {}; capture up to the closing };
const epMatch = sceneSrc.match(/const entryPos\s*=\s*\{([\s\S]*?)\}\s*;/);
if (!epMatch) { fail('Cannot find entryPos'); process.exit(1); }

const entryPos = {};
for (const m of epMatch[1].matchAll(/(\w+)\s*:\s*\{col\s*:\s*(\d+)\s*,\s*row\s*:\s*(\d+)\}/g))
  entryPos[m[1]] = { col: +m[2], row: +m[3] };

for (const zone of Object.keys(zoneToTiles)) {
  if (entryPos[zone]) pass(`entryPos.${zone} = col:${entryPos[zone].col}, row:${entryPos[zone].row}`);
  else                fail(`entryPos missing for '${zone}'`);
}

// ── 5. Parse zoneReturn ─────────────────────────────────────────────────────
console.log('\n── zoneReturn (scene.js) ──');
const zrMatch = sceneSrc.match(/const zoneReturn\s*=\s*\{([\s\S]*?)\}\s*;/);
if (!zrMatch) { fail('Cannot find zoneReturn'); process.exit(1); }

const zoneReturn = {};
for (const m of zrMatch[1].matchAll(/(\w+)\s*:\s*\{col\s*:\s*(\d+)\s*,\s*row\s*:\s*(\d+)\}/g))
  zoneReturn[m[1]] = { col: +m[2], row: +m[3] };

for (const zone of Object.keys(zoneToTiles)) {
  if (!zoneReturn[zone]) { fail(`zoneReturn missing for '${zone}'`); continue; }
  const { col, row } = zoneReturn[zone];
  pass(`zoneReturn.${zone} = col:${col}, row:${row}`);

  if (col < 0 || col >= VCOLS || row < 0 || row >= VROWS)
    fail(`  zoneReturn.${zone} (col:${col},row:${row}) is OUT OF BOUNDS`);
  else
    pass(`  zoneReturn.${zone} within village bounds`);

  const returnKey = `${col},${row}`;
  if (zoneExitMap[returnKey])
    fail(`  zoneReturn.${zone} lands on exit tile ${returnKey}→'${zoneExitMap[returnKey]}' — player will immediately re-enter a zone!`);
  else
    pass(`  zoneReturn.${zone} does not overlap a zone exit tile`);
}

// ── 6. Zone exits[] in zones.js ─────────────────────────────────────────────
console.log('\n── Zone exit tiles (zones.js) ──');
const zoneExitTiles = {};
for (const m of zonesSrc.matchAll(/id\s*:\s*'(\w+)'[\s\S]*?exits\s*:\s*\[([\s\S]*?)\]/g)) {
  const id = m[1]; const block = m[2];
  zoneExitTiles[id] = [];
  for (const em of block.matchAll(/col\s*:\s*(\d+).*?row\s*:\s*(\d+)/g))
    zoneExitTiles[id].push({ col: +em[1], row: +em[2] });
}

for (const zone of Object.keys(zoneToTiles)) {
  const exits = zoneExitTiles[zone] || [];
  if (exits.length > 0)
    pass(`zone '${zone}' has ${exits.length} exit tile(s): ${exits.map(e=>`(${e.col},${e.row})`).join(' ')}`);
  else
    fail(`zone '${zone}' has no exit tiles in zones.js`);
}

// ── 7. fromZone cross-check ──────────────────────────────────────────────────
console.log('\n── fromZone cross-check ──');
const fromZones = new Set([...zonesSrc.matchAll(/fromZone\s*:\s*'(\w+)'/g)].map(m => m[1]));
for (const fz of fromZones) {
  if (zoneReturn[fz]) pass(`fromZone '${fz}' has a zoneReturn entry`);
  else                fail(`fromZone '${fz}' has NO zoneReturn entry`);
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n── Result: ${checks} checks, ${errors} error(s) ──`);
if (errors === 0) {
  console.log('All zone connections look consistent. ✓\n');
} else {
  console.error(`${errors} problem(s) found — fix before pushing.\n`);
  process.exit(1);
}
