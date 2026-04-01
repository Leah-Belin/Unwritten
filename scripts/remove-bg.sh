#!/usr/bin/env bash
# remove-bg.sh — remove a solid/grid background from an isometric PNG
#
# Usage:
#   scripts/remove-bg.sh <image.png> [fuzz_percent]
#
# If fuzz_percent is omitted the script samples edge pixels, calculates
# the color range of the background, and picks the fuzz automatically.
#
# The original file is backed up as <image>.bak before modification.
# Do NOT pipe the output through pngquant — it corrupts alpha channels.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <image.png> [fuzz_percent]" >&2
  exit 1
fi

IMG="$1"
FUZZ_OVERRIDE="${2:-}"

if [[ ! -f "$IMG" ]]; then
  echo "Error: file not found: $IMG" >&2
  exit 1
fi

command -v convert >/dev/null 2>&1 || { echo "Error: ImageMagick 'convert' not found." >&2; exit 1; }

# ── Dimensions ───────────────────────────────────────────────────────────────
read W H < <(convert "$IMG" -format "%w %h" info: 2>/dev/null)
echo "Image: $IMG  (${W}×${H})"

# ── Sample edge pixels to find background color range ────────────────────────
# Samples: top edge, bottom edge, left edge, right edge (5 points each)
STEP_X=$(( W / 6 ))
STEP_Y=$(( H / 6 ))
MAX_X=$(( W - 2 ))
MAX_Y=$(( H - 2 ))

sample_pixel() {
  convert "$IMG" -format "%[pixel:u.p{$1,$2}]" info: 2>/dev/null
}

rgba_to_r() { echo "$1" | grep -oP '(?<=srgba\()\d+' | head -1; }

echo "Sampling edge pixels..."

declare -a SAMPLES
for i in 1 2 3 4 5; do
  x=$(( STEP_X * i ))
  y=$(( STEP_Y * i ))
  [[ $x -gt $MAX_X ]] && x=$MAX_X
  [[ $y -gt $MAX_Y ]] && y=$MAX_Y
  # top/bottom/left/right edges
  SAMPLES+=( "$(sample_pixel $x 2)" )
  SAMPLES+=( "$(sample_pixel $x $(( H - 2 )))" )
  SAMPLES+=( "$(sample_pixel 2 $y)" )
  SAMPLES+=( "$(sample_pixel $(( W - 2 )) $y)" )
done

# Collect opaque pixel brightness values to estimate background range
MIN_R=255; MAX_R=0
for s in "${SAMPLES[@]}"; do
  # Skip already-transparent pixels
  echo "$s" | grep -q 'srgba(0,0,0,0)' && continue
  r=$(rgba_to_r "$s")
  [[ -z "$r" ]] && continue
  (( r < MIN_R )) && MIN_R=$r
  (( r > MAX_R )) && MAX_R=$r
done

echo "Background brightness range: ${MIN_R}–${MAX_R}"

# ── Pick fuzz ─────────────────────────────────────────────────────────────────
if [[ -n "$FUZZ_OVERRIDE" ]]; then
  FUZZ=$FUZZ_OVERRIDE
  echo "Using provided fuzz: ${FUZZ}%"
else
  # Isometric grid backgrounds typically span ~80 brightness units (fill + grid lines).
  # Add a 4% buffer above the range, minimum 15%, maximum 28%.
  RANGE=$(( MAX_R - MIN_R ))
  FUZZ_CALC=$(( RANGE * 100 / 255 + 4 ))
  FUZZ=$FUZZ_CALC
  [[ $FUZZ -lt 15 ]] && FUZZ=15
  [[ $FUZZ -gt 28 ]] && FUZZ=28
  echo "Auto-calculated fuzz: ${FUZZ}% (color range ${RANGE}/255 + 4% buffer)"
fi

# ── Backup ───────────────────────────────────────────────────────────────────
cp "$IMG" "${IMG%.png}.bak"
echo "Backed up original to ${IMG%.png}.bak"

# ── Build seed points — all four edges, multiple y/x positions ───────────────
DRAWS=""
# Left edge (x=2)
for i in 1 2 3 4 5 6; do
  y=$(( H * i / 7 ))
  DRAWS="$DRAWS -draw \"color 2,${y} floodfill\""
done
# Right edge (x=W-2)
for i in 1 2 3 4 5 6; do
  y=$(( H * i / 7 ))
  DRAWS="$DRAWS -draw \"color $(( W - 2 )),${y} floodfill\""
done
# Top edge (y=2)
for i in 1 2 3 4 5 6; do
  x=$(( W * i / 7 ))
  DRAWS="$DRAWS -draw \"color ${x},2 floodfill\""
done
# Bottom edge (y=H-2)
for i in 1 2 3 4 5 6; do
  x=$(( W * i / 7 ))
  DRAWS="$DRAWS -draw \"color ${x},$(( H - 2 )) floodfill\""
done

TMP="${IMG%.png}_nobg_tmp.png"

eval convert \""$IMG"\" \
  -alpha set \
  -fuzz "${FUZZ}%" \
  -fill none \
  $DRAWS \
  \""$TMP"\"

# ── Verify: count transparent vs opaque pixels ───────────────────────────────
TOTAL_PX=$(( W * H ))
TRANSPARENT=$(convert "$TMP" -format "%[fx:w*h*mean]" \( +clone -alpha extract \) -compose multiply -composite -format "%[fx:w*h*(1-mean)]" info: 2>/dev/null || echo "?")
echo ""
echo "Result saved to: $IMG"
mv "$TMP" "$IMG"

# Quick alpha check: sample the four corners and two side midpoints — should all be transparent
PASS=true
for coord in "2,2" "$(( W-2 )),2" "2,$(( H-2 ))" "$(( W-2 )),$(( H-2 ))" "2,$(( H/2 ))" "$(( W-2 )),$(( H/2 ))"; do
  px=$(convert "$IMG" -format "%[pixel:u.p{${coord}}]" info: 2>/dev/null)
  if echo "$px" | grep -q 'srgba(0,0,0,0)'; then
    echo "  ✓ transparent at corner/edge ($coord)"
  else
    echo "  ✗ NOT transparent at ($coord): $px  ← may need higher fuzz"
    PASS=false
  fi
done

if $PASS; then
  echo ""
  echo "Background removal looks clean. ✓"
  echo "If grid lines are still visible in the game, re-run with a higher fuzz:"
  echo "  scripts/remove-bg.sh $IMG $(( FUZZ + 4 ))"
else
  echo ""
  echo "Some edge pixels are still opaque. Try:"
  echo "  scripts/remove-bg.sh $IMG $(( FUZZ + 5 ))"
fi
