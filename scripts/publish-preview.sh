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

cat > "$OUT/index.html" <<'EOF'
<!DOCTYPE html><html lang="fr"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Previews Fantasy-CC</title>
<body style="font:16px Helvetica;padding:24px;background:#ecece8;color:#3d3d3a">
<h1>Previews</h1>
<p><a href="creator.html">Créateur</a></p>
<p><a href="fantasy-combat.html">Combat</a></p>
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

CF_OK=0
if [[ -n "$BASE" ]]; then
  if verify_url "$BASE/creator.html" "Créateur" \
    && verify_url "$BASE/fantasy-combat.html" "Combat Fantasy" \
    && verify_url "$BASE/fantasy-dir-calibrate.html" "Calibrage directions"; then
    CF_OK=1
    echo
    echo "EDITOR=$BASE/editor.html"
    echo "CREATOR=$BASE/creator.html"
    echo "COMBAT=$BASE/fantasy-combat.html"
    echo "DIRS=$BASE/fantasy-dir-calibrate.html"
    echo "INDEX=$BASE/"
  else
    echo "WARN: Cloudflare tunnel registered but not reachable — using Litterbox" >&2
  fi
else
  echo "WARN: no Cloudflare tunnel URL — using Litterbox" >&2
fi

# Litterbox fallback (Cursor mobile): inline bridge so combat works without /js/
litter_upload() {
  local file="$1"
  curl -sS --max-time 120 \
    -F "reqtype=fileupload" -F "time=72h" -F "fileToUpload=@${file}" \
    https://litterbox.catbox.moe/resources/internals/api.php
}

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
Path("/tmp/fcc-creator-litter.html").write_text((out / "creator.html").read_text())
Path("/tmp/fcc-dirs-litter.html").write_text((out / "fantasy-dir-calibrate.html").read_text())
Path("/tmp/fcc-weapon-anim-litter.html").write_text((out / "fantasy-weapon-anim.html").read_text())
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
# Fallback relative hrefs (pages without data-fcc)
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
print("wired", path, "-> combat", combat)
PY
}

LIT_COMBAT="$(litter_upload /tmp/fcc-combat-standalone.html)"
LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html)"
LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html)"
LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html)"

# Passe 1 : câbler les 4 pages entre elles
wire_fcc_nav /tmp/fcc-combat-standalone.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-dirs-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-weapon-anim-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"

LIT_COMBAT="$(litter_upload /tmp/fcc-combat-standalone.html)"
LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html)"
LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html)"
LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html)"

# Passe 2 : URLs finales (les uploads ont changé les slugs)
wire_fcc_nav /tmp/fcc-combat-standalone.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-dirs-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-weapon-anim-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"

LIT_COMBAT="$(litter_upload /tmp/fcc-combat-standalone.html)"
LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html)"
LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html)"
LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html)"

# Passe 3 : créateur + anims/dirs doivent pointer le combat FINAL
wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-dirs-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-weapon-anim-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-combat-standalone.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"

LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html)"
LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html)"
LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html)"
LIT_COMBAT="$(litter_upload /tmp/fcc-combat-standalone.html)"

# Dernière rustine : créateur → combat final (combat vient d’être reuploadé)
wire_fcc_nav /tmp/fcc-creator-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-weapon-anim-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
wire_fcc_nav /tmp/fcc-dirs-litter.html "$LIT_COMBAT" "$LIT_CREATOR" "$LIT_ANIMS" "$LIT_DIRS"
LIT_CREATOR="$(litter_upload /tmp/fcc-creator-litter.html)"
LIT_ANIMS="$(litter_upload /tmp/fcc-weapon-anim-litter.html)"
LIT_DIRS="$(litter_upload /tmp/fcc-dirs-litter.html)"

verify_url "$LIT_COMBAT" "fantasy" || { echo "ERROR: litter combat failed" >&2; exit 1; }
verify_url "$LIT_DIRS" "dir" || { echo "ERROR: litter dirs failed" >&2; exit 1; }
verify_url "$LIT_CREATOR" "" || { echo "ERROR: litter creator failed" >&2; exit 1; }
verify_url "$LIT_ANIMS" "Anim" || { echo "ERROR: litter weapon-anim failed" >&2; exit 1; }

# Vérifier que le bouton Combat du créateur pointe bien le combat Litterbox
python3 - "$LIT_CREATOR" "$LIT_COMBAT" <<'PY'
import sys, urllib.request
creator, combat = sys.argv[1], sys.argv[2]
html = urllib.request.urlopen(creator, timeout=30).read().decode("utf-8", "replace")
if combat not in html:
    print("ERROR: creator Combat href is not the final combat URL", file=sys.stderr)
    sys.exit(1)
print("OK  creator→combat wired")
PY

echo
echo "LITTER_COMBAT=$LIT_COMBAT"
echo "LITTER_DIRS=$LIT_DIRS"
echo "LITTER_CREATOR=$LIT_CREATOR"
echo "LITTER_ANIMS=$LIT_ANIMS"
# Prefer Litterbox for mobile when CF is down
if [[ "$CF_OK" -ne 1 ]]; then
  echo "COMBAT=$LIT_COMBAT"
  echo "DIRS=$LIT_DIRS"
  echo "CREATOR=$LIT_CREATOR"
  echo "ANIMS=$LIT_ANIMS"
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
