#!/usr/bin/env bash
# Publish Fantasy-CC HTML previews and VERIFY they load as text/html before printing URLs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${PREVIEW_DIR:-/tmp/fcc-preview}"
PORT="${PREVIEW_PORT:-8877}"
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

mkdir -p "$OUT" "$OUT/js" "$ROOT/docs/previews" "$ROOT/docs/previews/js"
cp "$ROOT/character-creator-fantasy.html" "$OUT/creator.html"
cp "$ROOT/fantasy-cc-layout-editor.html" "$OUT/editor.html"
cp "$ROOT/fantasy-combat.html" "$OUT/fantasy-combat.html"
cp "$ROOT/fantasy-dir-calibrate.html" "$OUT/fantasy-dir-calibrate.html"
cp "$ROOT/js/fantasy-combat-bridge.js" "$OUT/js/fantasy-combat-bridge.js"
# Même noms que le repo pour les liens Créateur ↔ Combat
cp "$ROOT/character-creator-fantasy.html" "$OUT/character-creator-fantasy.html"
cp "$ROOT/character-creator-fantasy.html" "$ROOT/docs/previews/creator.html"
cp "$ROOT/fantasy-cc-layout-editor.html" "$ROOT/docs/previews/editor.html"
cp "$ROOT/fantasy-combat.html" "$ROOT/docs/previews/fantasy-combat.html"
cp "$ROOT/fantasy-dir-calibrate.html" "$ROOT/docs/previews/fantasy-dir-calibrate.html"
cp "$ROOT/js/fantasy-combat-bridge.js" "$ROOT/docs/previews/js/fantasy-combat-bridge.js"
cp "$ROOT/character-creator-fantasy.html" "$ROOT/docs/previews/character-creator-fantasy.html"

cat > "$OUT/index.html" <<'EOF'
<!DOCTYPE html><html lang="fr"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Previews Fantasy-CC</title>
<body style="font:16px Helvetica;padding:24px;background:#ecece8;color:#3d3d3a">
<h1>Previews</h1>
<p><a href="creator.html">Créateur</a></p>
<p><a href="fantasy-combat.html">Combat</a></p>
<p><a href="fantasy-dir-calibrate.html">Calibrage directions</a></p>
<p><a href="editor.html">Éditeur placement</a></p>
</body></html>
EOF
cp "$OUT/index.html" "$ROOT/docs/previews/index.html"

verify_url() {
  local url="$1" expect="$2"
  local tmp code ctype
  tmp="$(mktemp)"
  code="$(curl -sL --max-time 30 -A "$UA" -o "$tmp" -w '%{http_code}' "$url" || true)"
  ctype="$(file -b --mime-type "$tmp" 2>/dev/null || echo '?')"
  if [[ "$code" != "200" ]]; then
    echo "FAIL $url http=$code" >&2
    rm -f "$tmp"
    return 1
  fi
  if ! grep -q '<!DOCTYPE html>' "$tmp"; then
    echo "FAIL $url missing DOCTYPE (ctype=$ctype)" >&2
    rm -f "$tmp"
    return 1
  fi
  if [[ -n "$expect" ]] && ! grep -qi "$expect" "$tmp"; then
    echo "FAIL $url missing expected content: $expect" >&2
    rm -f "$tmp"
    return 1
  fi
  # Prefer real text/html from server headers
  local hctype
  hctype="$(curl -sI -L --max-time 20 -A "$UA" "$url" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2; exit}')"
  if [[ "$hctype" != *text/html* ]]; then
    echo "FAIL $url Content-Type='$hctype' (need text/html)" >&2
    rm -f "$tmp"
    return 1
  fi
  echo "OK  $url ($hctype, $(wc -c <"$tmp") bytes)"
  rm -f "$tmp"
}

# Ensure local static server
if ! curl -sI --max-time 2 "http://127.0.0.1:${PORT}/creator.html" | head -1 | grep -q 200; then
  python3 -m http.server "$PORT" --directory "$OUT" >/tmp/fcc-http.log 2>&1 &
  echo $! >/tmp/fcc-http.pid
  sleep 0.6
fi

# Ensure cloudflared quick tunnel; reuse existing URL if alive
TUNNEL_LOG=/tmp/fcc-tunnel.log
BASE=""
if [[ -f "$TUNNEL_LOG" ]]; then
  BASE="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1 || true)"
fi
if [[ -n "$BASE" ]] && curl -sI -L --max-time 15 -A "$UA" "$BASE/creator.html" | tr -d '\r' | grep -qi 'text/html'; then
  echo "Reusing tunnel $BASE"
else
  if [[ ! -x /tmp/cloudflared ]]; then
    curl -sL -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x /tmp/cloudflared
  fi
  : >"$TUNNEL_LOG"
  SESSION="fcc-tunnel"
  tmux -f /exec-daemon/tmux.portal.conf has-session -t "=$SESSION" 2>/dev/null || \
    tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION" -c /tmp -- "${SHELL:-zsh}" -l
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION:0.0" C-c
  sleep 0.3
  tmux -f /exec-daemon/tmux.portal.conf send-keys -t "$SESSION:0.0" \
    "/tmp/cloudflared tunnel --url http://127.0.0.1:${PORT} 2>&1 | tee $TUNNEL_LOG" C-m
  for i in $(seq 1 30); do
    BASE="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1 || true)"
    [[ -n "$BASE" ]] && break
    sleep 1
  done
fi

if [[ -z "$BASE" ]]; then
  echo "ERROR: no tunnel URL" >&2
  exit 1
fi

verify_url "$BASE/editor.html" "Placement"
verify_url "$BASE/creator.html" "Créateur"
verify_url "$BASE/fantasy-combat.html" "Combat Fantasy"
verify_url "$BASE/fantasy-dir-calibrate.html" "Calibrage directions"
verify_url "$BASE/character-creator-fantasy.html" "Créateur"

echo
echo "EDITOR=$BASE/editor.html"
echo "CREATOR=$BASE/creator.html"
echo "COMBAT=$BASE/fantasy-combat.html"
echo "DIRS=$BASE/fantasy-dir-calibrate.html"
echo "INDEX=$BASE/"

# Fallback links (repo) — only print SHA; caller should verify htmlpreview separately after push
SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || true)"
if [[ -n "$SHA" ]]; then
  echo "HTMLPREVIEW_EDITOR=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/editor.html"
  echo "HTMLPREVIEW_CREATOR=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/creator.html"
  echo "HTMLPREVIEW_COMBAT=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/fantasy-combat.html"
  echo "HTMLPREVIEW_DIRS=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/fantasy-dir-calibrate.html"
fi
