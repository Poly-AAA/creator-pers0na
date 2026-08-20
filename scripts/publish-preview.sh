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
cp "$ROOT/spell-editor.html" "$OUT/spell-editor.html"
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
cp "$ROOT/spell-editor.html" "$ROOT/docs/previews/spell-editor.html"

# Chapeau Head25 + guide PixelLab (local, pas sur le CDN pin)
mkdir -p "$OUT/hat-refs" "$OUT/assets/packs/fantasy-cc/spritesheets" "$ROOT/docs/previews/hat-refs"
if [[ -d "$ROOT/docs/previews/hat-refs" ]]; then
  cp -a "$ROOT/docs/previews/hat-refs/." "$OUT/hat-refs/"
fi
if [[ -f "$ROOT/hat-place.html" ]]; then
  cp "$ROOT/hat-place.html" "$OUT/hat-place.html"
  cp "$ROOT/hat-place.html" "$ROOT/docs/previews/hat-place.html"
fi
if [[ -f "$ROOT/docs/previews/hat-place.json" ]]; then
  cp "$ROOT/docs/previews/hat-place.json" "$OUT/hat-place.json"
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
<p><a href="spell-editor.html">Éditeur de sorts</a></p>
<p><a href="hat-place.html">Cale chapeau Head25</a></p>
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

# Spell-editor autonome (bridge inliné) — indispensable en Litterbox
python3 - "$OUT" <<'PY'
from pathlib import Path
import re, sys
out = Path(sys.argv[1])
spell_path = out / "spell-editor.html"
if not spell_path.exists():
    print("spell-editor not found; skip standalone") 
    raise SystemExit(0)
spell = spell_path.read_text()
bridge = (out / "js" / "fantasy-combat-bridge.js").read_text()
pat = re.compile(
    r'<script[^>]*src=["\'][^"\']*fantasy-combat-bridge\.js["\'][^>]*>\s*</script>',
    re.I,
)
inline = f"<script>\n{bridge}\n</script>"
stand = pat.sub(inline, spell, count=1)
if stand == spell:
    stand = spell.replace("</head>", inline + "\n</head>", 1)
Path("/tmp/fcc-spell-standalone.html").write_text(stand)
# Litterbox = pas de dossier assets → forcer le CDN jsDelivr
cdn = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@main/assets/packs/fantasy-cc/"
stand_cdn = re.sub(r'const BASE_CDN = "[^"]+";', f'const BASE_CDN = "{cdn}";', stand, count=1)
stand_cdn = re.sub(r'const BASE_LOCAL = "[^"]+";', f'const BASE_LOCAL = "{cdn}";', stand_cdn, count=1)
Path("/tmp/fcc-spell-standalone.html").write_text(stand_cdn)
print("spell standalone ready", len(stand_cdn))
PY

wire_fcc_nav() {
  python3 - "$1" "$2" "$3" "$4" "$5" "${6:-}" <<'PY'
from pathlib import Path
import re, sys
path, combat, creator, anims, dirs, spell = (sys.argv[1:7] + [""]*6)[:6]
links = {
    "combat": combat,
    "creator": creator,
    "anims": anims,
    "dirs": dirs,
    "spell": spell,
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
if spell:
    t = t.replace('href="spell-editor.html"', f'href="{spell}"')
if anims:
    t = t.replace('href="fantasy-weapon-anim.html"', f'href="{anims}"')
if dirs:
    t = t.replace('href="fantasy-dir-calibrate.html"', f'href="{dirs}"')
p.write_text(t)
print("wired", path)
PY
}

inject_fcc_nav() {
  python3 - "$1" "$2" "$3" "$4" "$5" "${6:-}" <<'PY'
from pathlib import Path
import json, re, sys
path, combat, creator, spell, anims, dirs = (sys.argv[1:7] + [""]*6)[:6]
nav = {k:v for k,v in {
    "combat": combat, "creator": creator, "spell": spell,
    "anims": anims, "dirs": dirs,
}.items() if v}
if not nav:
    raise SystemExit(0)
p = Path(path)
t = p.read_text()
block = f'<script>window.FCC_NAV={json.dumps(nav)};</script>\n'
if "window.FCC_NAV" in t:
    t = re.sub(r'<script>window\.FCC_NAV=.*?</script>\s*', block, t, count=1)
else:
    t = t.replace("</head>", block + "</head>", 1)
p.write_text(t)
print("inject nav", path)
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
  for i in $(seq 1 60); do
    url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | tail -1 || true)"
    [[ -n "$url" ]] && break
    sleep 1
  done
  # Cloudflare advertises the URL before the edge is reachable — retry verify.
  if [[ -n "$url" ]]; then
    for i in $(seq 1 30); do
      if tunnel_alive "$url"; then
        echo "$url"
        return 0
      fi
      sleep 2
    done
  fi
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
  SPELL_URL="$BASE/spell-editor.html"
  wire_fcc_nav "$OUT/fantasy-combat.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  wire_fcc_nav "$OUT/creator.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  wire_fcc_nav "$OUT/character-creator-fantasy.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  wire_fcc_nav "$OUT/spell-editor.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  inject_fcc_nav "$OUT/fantasy-combat.html" "$COMBAT_URL" "$CREATOR_URL" "$SPELL_URL" "$ANIMS_URL" "$DIRS_URL"
  inject_fcc_nav "$OUT/spell-editor.html" "$COMBAT_URL" "$CREATOR_URL" "$SPELL_URL" "$ANIMS_URL" "$DIRS_URL"
  wire_fcc_nav "$OUT/fantasy-weapon-anim.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  wire_fcc_nav "$OUT/fantasy-dir-calibrate.html" "$COMBAT_URL" "$CREATOR_URL" "$ANIMS_URL" "$DIRS_URL" "$SPELL_URL"
  # Patch BASE_LOCAL to absolute tunnel URL so sprites load even from single-file hosts
  python3 - "$OUT" "$BASE" <<'PY'
from pathlib import Path
import sys
out, base = Path(sys.argv[1]), sys.argv[2]
asset_base = f"{base}/assets/packs/fantasy-cc/"
for fname in ["creator.html","character-creator-fantasy.html","fantasy-combat.html","spell-editor.html"]:
    p = out / fname
    if not p.exists(): continue
    t = p.read_text()
    t2 = t.replace('const BASE_LOCAL = "assets/packs/fantasy-cc/";', f'const BASE_LOCAL = "{asset_base}";', 1)
    t2 = t2.replace("const BASE_LOCAL = 'assets/packs/fantasy-cc/';", f"const BASE_LOCAL = '{asset_base}';", 1)
    if t2 != t:
        p.write_text(t2)
        print(f"  patched BASE_LOCAL in {fname}")
PY
  # For safety: link to spell-editor should be valid even in Litterbox fallback.
  python3 - "$OUT/creator.html" "$OUT/fantasy-combat.html" "$SPELL_URL" <<'PY'
from pathlib import Path
import sys
creator, combat, spell = sys.argv[1:4]
for path in [creator, combat]:
    p=Path(path)
    t=p.read_text()
    t=t.replace('href="spell-editor.html"', f'href="{spell}"')
    p.write_text(t)
PY
  if verify_url "$CREATOR_URL" "combatUrlWithLook" \
    && verify_url "$COMBAT_URL" "Combat Fantasy" \
    && verify_url "$DIRS_URL" "Calibrage directions" \
    && verify_url "$SPELL_URL" "Évolutions du jeu"; then
    CF_OK=1
    echo
    echo "EDITOR=$BASE/editor.html"
    echo "CREATOR=$CREATOR_URL"
    echo "COMBAT=$COMBAT_URL"
    echo "DIRS=$DIRS_URL"
    echo "ANIMS=$ANIMS_URL"
    echo "SPELL=$SPELL_URL"
    echo "INDEX=$BASE/"
    # ── Mettre à jour tunnel-base.txt + portail.html pour le portail permanent ──
    echo "$BASE" > "$ROOT/docs/previews/tunnel-base.txt"
    sed -i "s|href=\"[^\"]*\/creator\.html\"|href=\"$BASE/creator.html\"|g" "$ROOT/docs/previews/portail.html"
    sed -i "s|href=\"[^\"]*\/fantasy-combat\.html\"|href=\"$BASE/fantasy-combat.html\"|g" "$ROOT/docs/previews/portail.html"
    sed -i "s|href=\"[^\"]*\/spell-editor\.html\"|href=\"$BASE/spell-editor.html\"|g" "$ROOT/docs/previews/portail.html"
    sed -i "s|Dernière mise à jour.*<|Dernière mise à jour : $(date '+%H:%M le %d/%m/%Y')<|" "$ROOT/docs/previews/portail.html"
    git -C "$ROOT" add docs/previews/tunnel-base.txt docs/previews/portail.html 2>/dev/null || true
    git -C "$ROOT" commit -m "Update tunnel-base.txt → $BASE" 2>/dev/null || true
    git -C "$ROOT" push origin HEAD 2>/dev/null || true
    echo "PORTAIL=https://htmlpreview.github.io/?https://github.com/Poly-AAA/creator-pers0na/blob/cursor/strict-regen-idle-66c0/docs/previews/portail.html"
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
  cp /tmp/fcc-spell-standalone.html /tmp/fcc-spell-litter.html
  cp /tmp/fcc-combat-standalone.html /tmp/fcc-combat-litter.html
  LIT_COMBAT="$(litter_upload /tmp/fcc-combat-litter.html || true)"
  LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html || true)"
  LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html || true)"
  LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html || true)"
  if [[ "$LIT_COMBAT" == https://* ]]; then
    wire_fcc_nav /tmp/fcc-spell-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS" ""
    LIT_SPELL="$(litter_upload /tmp/fcc-spell-litter.html || true)"
    if [[ "$LIT_SPELL" == https://* ]]; then
      wire_fcc_nav /tmp/fcc-combat-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS" "$LIT_SPELL"
      inject_fcc_nav /tmp/fcc-spell-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_SPELL" "$LIT_ANIMS" "$LIT_DIRS"
      inject_fcc_nav /tmp/fcc-combat-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_SPELL" "$LIT_ANIMS" "$LIT_DIRS"
      LIT_SPELL="$(litter_upload /tmp/fcc-spell-litter.html || true)"
      LIT_COMBAT="$(litter_upload /tmp/fcc-combat-litter.html || true)"
    fi
  fi
  if [[ "$LIT_COMBAT" == https://* ]] && verify_url "$LIT_COMBAT" "Combat Fantasy"; then
    wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS" "$LIT_SPELL"
    LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html || true)"
    # Rewrite spell-editor link inside littered creator HTML
    if [[ "$LIT_CREATOR" == https://* ]] && [[ "$LIT_SPELL" == https://* ]]; then
      python3 - /tmp/fcc-creator-litter.html "$LIT_SPELL" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); spell=sys.argv[2]
t=p.read_text()
t=t.replace('href="spell-editor.html"', f'href="{spell}"')
p.write_text(t)
PY
      # Re-upload creator to apply the rewrite
      LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html || true)"
      if [[ "$LIT_CREATOR" == https://* ]] && verify_url "$LIT_SPELL" "Évolutions du jeu"; then
        LIT_OK=1
      fi
    else
      if [[ "$LIT_CREATOR" == https://* ]]; then LIT_OK=1; fi
    fi
  fi
  if [[ "$LIT_OK" -eq 1 ]]; then
    echo
    echo "LITTER_COMBAT=$LIT_COMBAT"
    echo "LITTER_CREATOR=$LIT_CREATOR"
    echo "COMBAT=$LIT_COMBAT"
    echo "CREATOR=$LIT_CREATOR"
    if [[ "$LIT_SPELL" == https://* ]]; then echo "SPELL=$LIT_SPELL"; fi
  else
    echo "WARN: Litterbox unavailable — use Cloudflare links only" >&2
  fi
fi

if [[ "$CF_OK" -eq 1 ]]; then
  echo "COMBAT=$COMBAT_URL"
  echo "CREATOR=$CREATOR_URL"
  echo "DIRS=$DIRS_URL"
  echo "ANIMS=$ANIMS_URL"
  echo "SPELL=$SPELL_URL"
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
