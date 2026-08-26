#!/usr/bin/env bash
# Publish Fantasy-CC HTML previews for mobile (Cloudflare tunnel preferred).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${PREVIEW_OUT:-/tmp/fcc-preview}"
DOCS="$ROOT/docs/previews"
mkdir -p "$OUT" "$DOCS"

FILES=(
  fantasy-equip-categories.html
  character-creator-fantasy.html
)

for f in "${FILES[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    cp -f "$ROOT/$f" "$OUT/$f"
    cp -f "$ROOT/$f" "$DOCS/$f"
  fi
done

# Assets needed by both pages
if [[ -d "$ROOT/assets" ]]; then
  mkdir -p "$OUT/assets"
  rsync -a --delete "$ROOT/assets/" "$OUT/assets/" 2>/dev/null || cp -a "$ROOT/assets/." "$OUT/assets/"
fi

PORT="${PREVIEW_PORT:-8765}"
echo "Preview files in $OUT"
echo "Docs copies in $DOCS"
echo "Serve: python3 -m http.server $PORT --directory $OUT"
echo "Tunnel: cloudflared tunnel --url http://127.0.0.1:$PORT"
