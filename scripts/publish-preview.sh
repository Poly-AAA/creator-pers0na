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
cp "$ROOT/fantasy-weapon-anim.html" "$OUT/fantasy-weapon-anim.html"
cp "$ROOT/js/fantasy-combat-bridge.js" "$OUT/js/fantasy-combat-bridge.js"
# Même noms que le repo pour les liens Créateur ↔ Combat
cp "$ROOT/character-creator-fantasy.html" "$OUT/character-creator-fantasy.html"
cp "$ROOT/character-creator-fantasy.html" "$ROOT/docs/previews/creator.html"
cp "$ROOT/fantasy-cc-layout-editor.html" "$ROOT/docs/previews/editor.html"
cp "$ROOT/fantasy-combat.html" "$ROOT/docs/previews/fantasy-combat.html"
cp "$ROOT/fantasy-dir-calibrate.html" "$ROOT/docs/previews/fantasy-dir-calibrate.html"
cp "$ROOT/fantasy-weapon-anim.html" "$ROOT/docs/previews/fantasy-weapon-anim.html"
cp "$ROOT/js/fantasy-combat-bridge.js" "$ROOT/docs/previews/js/fantasy-combat-bridge.js"
cp "$ROOT/character-creator-fantasy.html" "$ROOT/docs/previews/character-creator-fantasy.html"

# Chapeau Head25 + guide PixelLab (local, pas sur le CDN pin)
mkdir -p "$OUT/hat-refs" "$OUT/assets/packs/fantasy-cc/spritesheets" "$ROOT/docs/previews/hat-refs"
if [[ -d "$ROOT/docs/previews/hat-refs" ]]; then
  cp -a "$ROOT/docs/previews/hat-refs/." "$OUT/hat-refs/"
fi
if [[ -f "$ROOT/docs/previews/hat-wizard-guide.html" ]]; then
  cp "$ROOT/docs/previews/hat-wizard-guide.html" "$OUT/hat-wizard-guide.html"
  cp "$ROOT/docs/previews/hat-wizard-guide.html" "$ROOT/docs/previews/hat-wizard-guide.html"
fi
if [[ -d "$ROOT/assets/packs/fantasy-cc/spritesheets/Head25" ]]; then
  cp -a "$ROOT/assets/packs/fantasy-cc/spritesheets/Head25" "$OUT/assets/packs/fantasy-cc/spritesheets/"
fi
if [[ -f "$ROOT/assets/packs/fantasy-cc/catalog.json" ]]; then
  cp "$ROOT/assets/packs/fantasy-cc/catalog.json" "$OUT/assets/packs/fantasy-cc/catalog.json"
fi

cat > "$OUT/index.html" <<'EOF'
<!DOCTYPE html><html lang="fr"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Previews Fantasy-CC</title>
<body style="font:16px Helvetica;padding:24px;background:#ecece8;color:#3d3d3a">
<h1>Previews</h1>
<p><a href="creator.html">Créateur</a></p>
<p><a href="fantasy-combat.html">Combat</a></p>
<p><a href="hat-wizard-guide.html">Guide chapeau sorcier (Head25)</a></p>
<p><a href="fantasy-weapon-anim.html">Anim par équipement</a></p>
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

# Combat autonome (bridge inliné) — sert mieux sur tunnel mobile
python3 - "$OUT" <<'PY'
from pathlib import Path
import re, sys
out = Path(sys.argv[1])
combat = (out / "fantasy-combat.html").read_text()
bridge = (out / "js" / "fantasy-combat-bridge.js").read_text()
pat = re.compile(
    r'<script[^>]*src=["\'][^"\']*fantasy-combat-bridge\.js["\'][^>]*>\s*</script>',
    re.I,
)
inline = f"<script>\n{bridge}\n</script>"
stand = pat.sub(inline, combat, count=1)
if stand == combat:
    stand = combat.replace("</head>", inline + "\n</head>", 1)
Path("/tmp/fcc-combat-standalone.html").write_text(stand)
(out / "fantasy-combat.html").write_text(stand)
print("standalone ready", len(stand))
PY

wire_fcc_nav() {
  python3 - "$1" "$2" "$3" "$4" "$5" <<'PY'
from pathlib import Path
import re, sys
path, combat, creator, anims, dirs = sys.argv[1:6]
links = {
    "combat": combat,
    "creator": creator,
    "anims": anims,
    "dirs": dirs,
}
p = Path(path)
t = p.read_text()
for key, url in links.items():
    if not url:
        continue
    t = re.sub(
        rf'(data-fcc="{key}"[^>]*href=")[^"]*"',
        rf'\1{url}"',
        t,
    )
if combat:
    t = t.replace('href="fantasy-combat.html"', f'href="{combat}"')
if creator:
    t = t.replace('href="character-creator-fantasy.html"', f'href="{creator}"')
    t = t.replace('href="creator.html"', f'href="{creator}"')
if anims:
    t = t.replace('href="fantasy-weapon-anim.html"', f'href="{anims}"')
if dirs:
    t = t.replace('href="fantasy-dir-calibrate.html"', f'href="{dirs}"')
p.write_text(t)
print("wired", path)
PY
}

start_cloudflared_tunnel() {
  if [[ ! -x /tmp/cloudflared ]]; then
    curl -sL -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x /tmp/cloudflared
  fi
  pkill -f '/tmp/cloudflared tunnel --url' 2>/dev/null || true
  sleep 0.5
  : >"$TUNNEL_LOG"
  SESSION="fcc-tunnel-v2"
  tmux -f /exec-daemon/tmux.portal.conf kill-session -t "$SESSION" 2>/dev/null || true
  tmux -f /exec-daemon/tmux.portal.conf new-session -d -s "$SESSION" -c /tmp -- \
    "/tmp/cloudflared tunnel --url http://127.0.0.1:${PORT} --no-autoupdate 2>&1 | tee $TUNNEL_LOG"
  local i url=""
  for i in $(seq 1 45); do
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1 || true)"
    [[ -n "$url" ]] && break
    sleep 1
  done
  echo "$url"
}

tunnel_alive() {
  local base="$1"
  [[ -n "$base" ]] && verify_url "$base/fantasy-combat.html" "Combat Fantasy"
}

# Ensure local static server
if ! curl -sI --max-time 2 "http://127.0.0.1:${PORT}/creator.html" | head -1 | grep -q 200; then
  python3 -m http.server "$PORT" --directory "$OUT" >/tmp/fcc-http.log 2>&1 &
  echo $! >/tmp/fcc-http.pid
  sleep 0.6
fi

# Ensure cloudflared quick tunnel (GET complet — évite les 530 « tunnel error »)
TUNNEL_LOG=/tmp/fcc-tunnel.log
BASE=""
if [[ -f "$TUNNEL_LOG" ]]; then
  BASE="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1 || true)"
fi
if [[ -n "$BASE" ]] && tunnel_alive "$BASE"; then
  echo "Reusing tunnel $BASE"
else
  echo "Starting fresh Cloudflare tunnel…" >&2
  BASE="$(start_cloudflared_tunnel)"
fi
if [[ -z "$BASE" ]] || ! tunnel_alive "$BASE"; then
  echo "WARN: Cloudflare tunnel unavailable" >&2
  BASE=""
fi

CF_OK=0
if [[ -n "$BASE" ]]; then
  CREATOR_URL="$BASE/creator.html"
  COMBAT_URL="$BASE/fantasy-combat.html"
  ANIMS_URL="$BASE/fantasy-weapon-anim.html"
  DIRS_URL="$BASE/fantasy-dir-calibrate.html"
  wire_fcc_nav "$OUT/fantasy-combat.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL"
  wire_fcc_nav "$OUT/creator.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL"
  wire_fcc_nav "$OUT/character-creator-fantasy.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL"
  wire_fcc_nav "$OUT/fantasy-weapon-anim.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL"
  wire_fcc_nav "$OUT/fantasy-dir-calibrate.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL"
  if verify_url "$CREATOR_URL" "combatUrlWithLook" \
    && verify_url "$COMBAT_URL" "Combat Fantasy" \
    && verify_url "$DIRS_URL" "Calibrage directions"; then
    CF_OK=1
    echo
    echo "EDITOR=$BASE/editor.html"
    echo "CREATOR=$CREATOR_URL"
    echo "COMBAT=$COMBAT_URL"
    echo "DIRS=$DIRS_URL"
    echo "ANIMS=$ANIMS_URL"
    echo "INDEX=$BASE/"
  else
    echo "WARN: Cloudflare tunnel registered but verify failed" >&2
    CF_OK=0
  fi
fi

# Litterbox fallback (optionnel — souvent indisponible)
LIT_OK=0
LIT_COMBAT="" LIT_DIRS="" LIT_CREATOR="" LIT_ANIMS=""
if [[ "$CF_OK" -ne 1 ]]; then
  litter_upload() {
    local file="$1" resp
    resp="$(curl -sS --max-time 120 \
      -F "reqtype=fileupload" -F "time=72h" -F "fileToUpload=@${file}" \
      https://litterbox.catbox.moe/resources/internals/api.php 2>/dev/null || true)"
    if [[ "$resp" == https://* ]]; then echo "$resp"; fi
  }
  cp "$OUT/creator.html" /tmp/fcc-creator-litter.html
  cp "$OUT/fantasy-dir-calibrate.html" /tmp/fcc-dirs-litter.html
  cp "$OUT/fantasy-weapon-anim.html" /tmp/fcc-weapon-anim-litter.html
  LIT_COMBAT="$(litter_upload /tmp/fcc-combat-standalone.html || true)"
  LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html || true)"
  LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html || true)"
  LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html || true)"
  if [[ "$LIT_COMBAT" == https://* ]] && verify_url "$LIT_COMBAT" "Combat Fantasy"; then
    wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
    LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html || true)"
    if [[ "$LIT_CREATOR" == https://* ]]; then LIT_OK=1; fi
  fi
  if [[ "$LIT_OK" -eq 1 ]]; then
    echo
    echo "LITTER_COMBAT=$LIT_COMBAT"
    echo "LITTER_CREATOR=$LIT_CREATOR"
    echo "COMBAT=$LIT_COMBAT"
    echo "CREATOR=$LIT_CREATOR"
  else
    echo "WARN: Litterbox unavailable — use Cloudflare links only" >&2
  fi
fi

if [[ "$CF_OK" -eq 1 ]]; then
  echo "COMBAT=$COMBAT_URL"
  echo "CREATOR=$CREATOR_URL"
  echo "DIRS=$DIRS_URL"
  echo "ANIMS=$ANIMS_URL"
fi

if [[ "$CF_OK" -ne 1 && "$LIT_OK" -ne 1 ]]; then
  echo "ERROR: no verified preview URL (tunnel + litterbox failed)" >&2
  exit 1
fi

# Fallback links (repo) — only print SHA; caller should verify htmlpreview separately after push
SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || true)"
if [[ -n "$SHA" ]]; then
  echo "HTMLPREVIEW_EDITOR=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/editor.html"
  echo "HTMLPREVIEW_CREATOR=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/creator.html"
  echo "HTMLPREVIEW_COMBAT=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/fantasy-combat.html"
  echo "HTMLPREVIEW_DIRS=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/fantasy-dir-calibrate.html"
  echo "HTMLPREVIEW_ANIMS=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/${SHA}/docs/previews/fantasy-weapon-anim.html"
fi
