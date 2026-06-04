#!/usr/bin/env bash
# Fetches the 2026-programme page, checks image versions against the local
# manifest, and downloads any that have changed. Prints a summary of what's
# new so you can ask Claude to re-read those images and generate a diff.
#
# Usage: ./scripts/check-programme-updates.sh
#
# Image → stage/day mapping (for context in the summary):
#   friday-main-arena.png    → Fri: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   saturday-main-arena.png  → Sat: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   sunday-main-arena.png    → Sun: Main Stage, Dub Corner, Cosmic Cwtsh, Freedom Stage
#   temple-tent.png          → Fri/Sat/Sun: Temple Tent
#   kids-and-youth.png       → Fri/Sat/Sun: Kids & Youth
#   sacred-fire-tan-tips.png → Fri/Sat/Sun: Sacred Fire
#   geojam-tea-of-life.png   → Fri/Sat/Sun: GeoJam & Tea of Life

set -euo pipefail

PROGRAMME_URL="https://www.unearthedfestival.co.uk/pages/2026-programme"
DIR="$(cd "$(dirname "$0")/.." && pwd)/schedule_images"
MANIFEST="$DIR/manifest.json"
CDN_BASE="https://www.unearthedfestival.co.uk/cdn/shop/files"

# Map: local filename → CDN filename
declare -A CDN_NAME
CDN_NAME["friday-main-arena.png"]="2_00e91664-be55-4f4e-86e2-154cce334546.png"
CDN_NAME["saturday-main-arena.png"]="3_3cbf658f-a85e-4eed-ab62-f8c2f3e69f42.png"
CDN_NAME["sunday-main-arena.png"]="UF_Timetable_PHONE_format.png"
CDN_NAME["temple-tent.png"]="5_732960e1-af37-4ef3-8341-1f60877067f3.png"
CDN_NAME["kids-and-youth.png"]="6_f9cd445b-c0f8-40aa-bed2-20600cb47270.png"
CDN_NAME["sacred-fire-tan-tips.png"]="7_5a88a0e7-cee8-4102-babf-e480a6dbb40e.png"
CDN_NAME["geojam-tea-of-life.png"]="8_7d141d94-4d03-4d86-bd06-a6f344279713.png"

echo "=== Unearthed Programme Update Check ==="
echo "Fetching: $PROGRAMME_URL"
echo ""

# Fetch the page and extract CDN files + version numbers
PAGE_HTML=$(curl -sL "$PROGRAMME_URL")

get_version() {
  local cdn_file="$1"
  # Match cdn/shop/files/<name>?v=<version> or cdn/shop/files/<name>?v=<version>&
  echo "$PAGE_HTML" \
    | grep -oP "cdn/shop/files/${cdn_file}\?v=[0-9]+" \
    | head -1 \
    | grep -oP 'v=[0-9]+' \
    | grep -oP '[0-9]+'
}

get_stored_version() {
  local local_file="$1"
  python3 -c "
import json, sys
try:
    d = json.load(open('$MANIFEST'))
    entry = d.get('$local_file', {})
    print(entry.get('version', '') if isinstance(entry, dict) else '')
except:
    print('')
" 2>/dev/null
}

CHANGED=()
UNCHANGED=()
FAILED=()

for local_file in "${!CDN_NAME[@]}"; do
  cdn_file="${CDN_NAME[$local_file]}"
  live_ver=$(get_version "$cdn_file")
  stored_ver=$(get_stored_version "$local_file")

  if [[ -z "$live_ver" ]]; then
    FAILED+=("$local_file (could not find on page)")
    continue
  fi

  if [[ "$live_ver" == "$stored_ver" ]] && [[ -f "$DIR/$local_file" ]]; then
    UNCHANGED+=("$local_file (v=$live_ver)")
  else
    CHANGED+=("$local_file (v=$stored_ver → v=$live_ver)")
    echo "  DOWNLOADING: $local_file (was v=$stored_ver, now v=$live_ver)"
    curl -sL "${CDN_BASE}/${cdn_file}?v=${live_ver}&width=1600" \
      -o "$DIR/$local_file" \
      && echo "    ✓ $(wc -c < "$DIR/$local_file") bytes" \
      || echo "    ✗ download failed"
    # Update manifest
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

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo ""
  echo "WARNING — could not check (page structure may have changed):"
  for f in "${FAILED[@]}"; do echo "  ! $f"; done
fi

echo ""
if [[ ${#CHANGED[@]} -gt 0 ]]; then
  echo "Next step: ask Claude to read the changed images and show a programme diff."
else
  echo "Programme is up to date — nothing to do."
fi
