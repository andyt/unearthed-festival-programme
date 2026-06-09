#!/usr/bin/env bash
# Fetches the 2026-programme page, checks image versions against the local
# manifest by page position, and downloads any that have changed. Prints a
# summary of what's new so you can ask Claude to re-read those images and
# generate a diff.
#
# Usage: ./scripts/check-programme-updates.sh
#
# Image → stage/day mapping (by page position):
#   pos 1: friday-main-arena.png    → Fri: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   pos 2: saturday-main-arena.png  → Sat: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   pos 3: sunday-main-arena.png    → Sun: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   pos 4: temple-tent.png          → Fri/Sat/Sun: Temple Tent
#   pos 5: sacred-fire-tan-tips.png → Fri/Sat/Sun: Sacred Fire & Tan Tips
#   pos 6: kids-and-youth.png       → Fri/Sat/Sun: Kids & Youth
#   pos 7: geojam-tea-of-life.png   → Fri/Sat/Sun: GeoJam & Tea of Life

set -euo pipefail

PROGRAMME_URL="https://www.unearthedfestival.co.uk/pages/2026-programme"
DIR="$(cd "$(dirname "$0")/.." && pwd)/schedule_images"
MANIFEST="$DIR/manifest.json"
CDN_BASE="https://www.unearthedfestival.co.uk/cdn/shop/files"

# Local filenames in the order they appear on the programme page.
# If the count check below warns of a mismatch, update this list and the
# mapping comment above to reflect the new page order.
LOCAL_ORDER=(
  "friday-main-arena.png"
  "saturday-main-arena.png"
  "sunday-main-arena.png"
  "temple-tent.png"
  "sacred-fire-tan-tips.png"
  "kids-and-youth.png"
  "geojam-tea-of-life.png"
)

echo "=== Unearthed Programme Update Check ==="
echo "Fetching: $PROGRAMME_URL"
echo ""

TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT
curl -sL "$PROGRAMME_URL" > "$TMPFILE"

# Extract schedule CDN filenames + versions in page order.
# Deduplicates by filename and excludes site-chrome images.
readarray -t LIVE_ENTRIES < <(python3 -c "
import re, sys
html = open(sys.argv[1]).read()
exclude = re.compile(r'logo|background|yin_yang|WG_Part|Untitled_design|our.vision', re.I)
seen = set()
for m in re.finditer(r'cdn/shop/files/([^?&\s\"\']+)\?v=([0-9]+)', html):
    fname, ver = m.group(1), m.group(2)
    if fname in seen or exclude.search(fname):
        continue
    seen.add(fname)
    print(fname, ver)
" "$TMPFILE")

if [[ ${#LIVE_ENTRIES[@]} -ne ${#LOCAL_ORDER[@]} ]]; then
  echo "WARNING: Expected ${#LOCAL_ORDER[@]} schedule images on page, found ${#LIVE_ENTRIES[@]}."
  echo "Live entries detected:"
  for e in "${LIVE_ENTRIES[@]}"; do echo "  $e"; done
  echo ""
  echo "Update LOCAL_ORDER in this script to match, then re-run."
  exit 1
fi

get_stored() {
  local local_file="$1" field="$2"
  python3 -c "
import json, sys
try:
    d = json.load(open('$MANIFEST'))
    entry = d.get('$local_file', {})
    print(entry.get('$field', '') if isinstance(entry, dict) else '')
except:
    pass
" 2>/dev/null || true
}

CHANGED=()
UNCHANGED=()

for i in "${!LOCAL_ORDER[@]}"; do
  local_file="${LOCAL_ORDER[$i]}"
  cdn_file="${LIVE_ENTRIES[$i]%% *}"
  live_ver="${LIVE_ENTRIES[$i]##* }"
  stored_ver=$(get_stored "$local_file" "version")

  if [[ "$live_ver" == "$stored_ver" ]] && [[ -f "$DIR/$local_file" ]]; then
    UNCHANGED+=("$local_file (v=$live_ver)")
  else
    CHANGED+=("$local_file (v=${stored_ver:-none} → v=$live_ver, cdn=$cdn_file)")
    echo "  DOWNLOADING: $local_file"
    echo "    cdn=$cdn_file  v=${stored_ver:-none} → v=$live_ver"
    if curl -sL "${CDN_BASE}/${cdn_file}?v=${live_ver}&width=1600" -o "$DIR/$local_file"; then
      echo "    ✓ $(wc -c < "$DIR/$local_file") bytes"
    else
      echo "    ✗ download failed"
    fi
    python3 -c "
import json
try:
    d = json.load(open('$MANIFEST'))
except:
    d = {}
d['$local_file'] = {'cdn': '$cdn_file', 'version': '$live_ver'}
json.dump(d, open('$MANIFEST', 'w'), indent=2)
"
  fi
done

echo ""
echo "=== Summary ==="

if [[ ${#CHANGED[@]} -gt 0 ]]; then
  echo "CHANGED (re-read these images and generate a diff):"
  for f in "${CHANGED[@]}"; do echo "  ✦ $f"; done
else
  echo "No images changed."
fi

if [[ ${#UNCHANGED[@]} -gt 0 ]]; then
  echo ""
  echo "Unchanged:"
  for f in "${UNCHANGED[@]}"; do echo "  · $f"; done
fi

echo ""
if [[ ${#CHANGED[@]} -gt 0 ]]; then
  echo "Next step: ask Claude to read the changed images and show a programme diff."
else
  echo "Programme is up to date — nothing to do."
fi
