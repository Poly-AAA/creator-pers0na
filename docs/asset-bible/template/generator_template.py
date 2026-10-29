#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generator_template.py — Asset Bible creator-pers0na (Merakintsugi)
====================================================================
Génère UNE pièce d'équipement (un dossier <FOLDER>/<Anim>.png) alignée au pixel sur NakedBody,
pour les 30 animations x 8 directions x 15 frames (sheets 1920x1024, cellules 128x128).
Dérivé de scripts/build-feminine-panoply.py (même cel-shading 3 tons + contour #1C154D).

Dépendances : Python 3.8+, numpy, Pillow. RIEN d'autre (pas de scipy, pas de réseau).
Fichiers lus (relatifs au dossier asset-bible/) :
    anchors.json                       ancres par anim/direction/frame
    reference/NakedBody/<Anim>.png     corps de référence (alignement)
    reference/bodyparts/<Anim>.png     carte des parties (0 vide,1 head,2 torso,3 arm,4 hands,5 legs,6 feet)

Usage :
    python3 template/generator_template.py                 # toutes les anims
    python3 template/generator_template.py --quick         # Idle, Walk, Attack1 seulement (sandbox limitée)
    python3 template/generator_template.py --anims Idle,Die
    python3 template/generator_template.py --check out/MonDossier   # valider un dossier existant (sans générer)
Sorties :
    out/<FOLDER>/<Anim>.png      sheets prêtes pour le jeu
    out/preview_<FOLDER>.png     aperçu x3 (NakedBody + pièce, 8 directions, frames 0/5/10 de 3 anims)
    out/report_<FOLDER>.json     résultat de la checklist de validation

RÈGLE POUR L'IA : tu ne modifies QUE les blocs entre
    # ===== ZONE ÉDITABLE n : ... =====   et   # ===== FIN ZONE ÉDITABLE n =====
Tout le reste (moteur, ombrage, contour, validation) est figé.
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

# ===== ZONE ÉDITABLE 1 : IDENTITÉ DE LA PIÈCE =====
FOLDER = "ChestExemple"        # nom de dossier = <Partie><NomDeSet> : HeadX, ChestX, BackX, LegsX, FeetX, HandsX, MeleeX/MeleeNN, ShieldX
SLOT = "torse"                 # slot jeu : coiffe | cape | torse | jambes | bottes | ceinture | gants | bouclier | arme
VARIANT_NOTES = "Tunique d'exemple : tissu prune, col et ceinture or rose, pan avant avec rebond retardé d'1 frame."
# ===== FIN ZONE ÉDITABLE 1 =====

# ===== ZONE ÉDITABLE 2 : PALETTE (3 tons par matériau : clair, moyen, sombre) =====
# Max 4 matériaux. Couleurs hex exactes. Le contour #1C154D est ajouté automatiquement (ne pas le mettre ici).
PALETTE = {
    "cloth": ["#C26BB0", "#8A3E95", "#4E2468"],   # prune
    "gold":  ["#FFE0B0", "#E7A465", "#A9623F"],   # or rose
}
BODY_FOLDS_DARK = True     # True : les plis/ombres du corps (lum < 120) passent au ton sombre du matériau
# ===== FIN ZONE ÉDITABLE 2 =====


# ---------------------------------------------------------------------------------------------
# MOTEUR (NE PAS MODIFIER)
# ---------------------------------------------------------------------------------------------
KIT = Path(__file__).resolve().parents[1]
FW = FH = 128; COLS, ROWS = 15, 8
OUTLINE = (0x1C, 0x15, 0x4D, 255)
DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"]
FACE = [(1, 0), (0.75, 0.6), (0, 1), (-0.75, 0.6), (-1, 0), (-0.75, -0.6), (0, -1), (0.75, -0.6)]  # (fx, fy) écran par row
ANIMS = ["Idle", "Idle2", "Idle3", "Idle4", "Walk", "Run", "RunBackwards", "StrafeLeft", "StrafeRight",
         "CrouchIdle", "CrouchRun", "Attack1", "Attack2", "Attack3", "Attack4", "Attack5", "Attack6",
         "AttackRun", "AttackRun2", "Kick", "Special1", "TakeDamage", "Die", "Taunt", "Slide", "Rolling",
         "RideIdle", "RideRun", "RideIdleAttack1", "RideRunAttack1"]
LOOP = {"Idle", "Idle2", "Idle3", "Idle4", "Walk", "Run", "RunBackwards", "StrafeLeft", "StrafeRight",
        "CrouchIdle", "CrouchRun", "RideIdle", "RideRun", "RideIdleAttack1", "RideRunAttack1", "AttackRun", "AttackRun2"}
PART_IDS = {"head": 1, "torso": 2, "arm": 3, "hands": 4, "legs": 5, "feet": 6}
# Parties du corps qui DOIVENT être couvertes à >= 99 % par slot (règle "jamais de corps découvert")
REQUIRED_COVER = {"torse": ["torso", "arm"], "jambes": ["legs"], "gants": ["hands"], "bottes": ["feet"]}
# Débord max (px) autorisé hors silhouette du corps (dilatée) par slot
MAX_OUTSET = {"torse": 4, "jambes": 5, "gants": 2, "bottes": 2, "ceinture": 3, "coiffe": 14, "cape": 22,
              "arme": 64, "bouclier": 24}

def H(h):
    h = h.lstrip("#"); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
PAL = {k: [H(c) for c in v] for k, v in PALETTE.items()}

def shift(m, dx, dy):
    o = np.zeros_like(m); h, w = m.shape
    o[max(0, dy):h + min(0, dy), max(0, dx):w + min(0, dx)] = m[max(0, -dy):h + min(0, -dy), max(0, -dx):w + min(0, -dx)]
    return o

def grow(m, n=1):
    """Dilatation 4-voisins de n pixels."""
    for _ in range(n):
        m = m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)
    return m

def shrink(m, n=1):
    for _ in range(n):
        m = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
    return m

def rows_between(y0, y1):
    """Masque des lignes y0..y1 incluses."""
    m = np.zeros((FH, FW), bool); m[max(0, int(y0)):max(0, int(y1) + 1)] = True; return m

def disc(cx, cy, r):
    yy, xx = np.mgrid[0:FH, 0:FW]; return (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r

def line(p0, p1, width=1):
    """Segment épais (pixels) de p0=(x,y) à p1."""
    m = np.zeros((FH, FW), bool)
    n = int(max(abs(p1[0] - p0[0]), abs(p1[1] - p0[1]))) + 1
    for t in np.linspace(0, 1, n + 1):
        x = int(round(p0[0] + (p1[0] - p0[0]) * t)); y = int(round(p0[1] + (p1[1] - p0[1]) * t))
        if 0 <= x < FW and 0 <= y < FH: m[y, x] = True
    return grow(m, width - 1) if width > 1 else m

def bbox(m):
    ys, xs = np.nonzero(m)
    return None if len(xs) == 0 else (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))

class Frame:
    """Tout ce qu'une fonction de forme peut lire pour UNE cellule 128x128."""
    def __init__(self, anim, row, col, parts, lum, anchors_row):
        self.anim, self.row, self.col = anim, row, col
        self.dir = DIRS[row]; self.fx, self.fy = FACE[row]
        self.loop = anim in LOOP
        self.parts = parts                     # dict de masques bool : body, head, torso, arm, hands, legs, feet
        self.lum = lum                         # luminance du NakedBody (0..255), < 120 = pli/ombre
        self.A = anchors_row[col] or {}        # ancres de cette frame (voir anchors.json)
        pc = (col - 1) % COLS if self.loop else max(0, col - 1)
        self.prev_col = pc
        self.P = anchors_row[pc] or self.A     # ancres de la frame PRÉCÉDENTE (mouvement secondaire = retard 1 frame)
    def lag(self, key, axis=1, clamp=1):
        """Retard d'1 frame (±clamp px) : position précédente - position actuelle de l'ancre `key`.
        Utiliser pour buste/hanches (clamp=1) et cheveux/pans (clamp=2)."""
        a, p = self.A.get(key), self.P.get(key)
        if not a or not p: return 0
        return int(np.clip(p[axis] - a[axis], -clamp, clamp))
    def back_side(self):
        """-1 si le dos est à gauche écran, +1 à droite, 0 vue face/dos."""
        return 0 if abs(self.fx) < 0.3 else (-1 if self.fx > 0 else 1)


# ===== ZONE ÉDITABLE 3 : FORME DE LA PIÈCE =====
def draw_piece(F):
    """Retourne une LISTE ORDONNÉE de (masque_bool_128x128, nom_matériau) ; le dernier est peint par-dessus.
    Optionnel : un 3e élément "L"/"M"/"D" force un ton plat (détail : couture, laçage, rivet).
    Règles : couvrir les parties exigées par REQUIRED_COVER[SLOT] ; rester dans MAX_OUTSET[SLOT] px du corps ;
    pas de visage (ni yeux ni bouche) ; tenue toujours couvrante ; mouvement secondaire via F.lag(...)."""
    p = F.parts
    if not p["body"].any():
        return []
    torso, arm = p["torso"], p["arm"]
    out = []
    tunic = torso | arm                                   # couvre 100 % torse + manches
    tb = bbox(torso)
    if tb is None:
        return [(tunic, "cloth")]
    x0, y0, x1, y1 = tb
    # pan de tunique sous la ceinture : 2 px sur le haut des jambes, rebond retardé d'1 frame
    hem_lag = F.lag("pelvis", axis=1, clamp=1)
    flap = grow(torso & rows_between(y1 - 1, y1), 1) & ~torso & rows_between(y1 + 1, y1 + 2 + hem_lag) & grow(p["legs"], 1)
    out.append((tunic | flap, "cloth"))
    # col : 2 premières lignes du torse
    out.append((torso & rows_between(y0, y0 + 1), "gold"))
    # ceinture : 1 ligne à 62 % de la hauteur du torse
    wy = y0 + int(round((y1 - y0) * 0.62))
    out.append((torso & rows_between(wy, wy), "gold", "M"))
    return out
# ===== FIN ZONE ÉDITABLE 3 =====


# ---------------------------------------------------------------------------------------------
# RENDU + VALIDATION (NE PAS MODIFIER)
# ---------------------------------------------------------------------------------------------
def cel(mask, tones, lum=None):
    """3 tons : lumière haut-gauche, ombre bas-droite (+ plis du corps)."""
    L, M, D = tones
    img = np.zeros((FH, FW, 4), np.uint8)
    img[mask] = M
    edge_dark = mask & (~shift(mask, -1, 0) | ~shift(mask, 0, -1))
    edge_light = mask & (~shift(mask, 1, 0) | ~shift(mask, 0, 1)) & ~edge_dark
    img[edge_light] = L; img[edge_dark] = D
    if lum is not None and BODY_FOLDS_DARK:
        img[mask & (lum < 120)] = D
    return img

def render_cell(F):
    layers = draw_piece(F)
    img = np.zeros((FH, FW, 4), np.uint8)
    for item in layers:
        m, mat = item[0], item[1]
        m = m.astype(bool)
        if not m.any(): continue
        if mat not in PAL: raise KeyError(f"matériau '{mat}' absent de PALETTE")
        if len(item) > 2:
            img[m] = PAL[mat]["LMD".index(item[2])]
        else:
            c = cel(m, PAL[mat], F.lum if F.parts["body"].any() else None)
            img[m] = c[m]
    a = img[..., 3] > 0
    ring = grow(a) & ~a
    img[ring] = OUTLINE
    return img

def load_anim(anim):
    nb = np.array(Image.open(KIT / "reference/NakedBody" / f"{anim}.png").convert("RGBA"))
    bp = np.array(Image.open(KIT / "reference/bodyparts" / f"{anim}.png"))
    return nb, bp

def cell_parts(nb, bp, r, c):
    sl = (slice(r * FH, (r + 1) * FH), slice(c * FW, (c + 1) * FW))
    lab = bp[sl]
    parts = {k: lab == v for k, v in PART_IDS.items()}
    parts["body"] = nb[sl][..., 3] > 24
    return parts, nb[sl][..., 0].astype(int)

def build(anims, out_root):
    anchors = json.loads((KIT / "anchors.json").read_text())["anims"]
    out = out_root / FOLDER; out.mkdir(parents=True, exist_ok=True)
    for anim in anims:
        nb, bp = load_anim(anim)
        sheet = np.zeros((FH * ROWS, FW * COLS, 4), np.uint8)
        for r in range(ROWS):
            arow = anchors[anim][r]["frames"]
            for c in range(COLS):
                parts, lum = cell_parts(nb, bp, r, c)
                sheet[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW] = render_cell(Frame(anim, r, c, parts, lum, arow))
        Image.fromarray(sheet, "RGBA").save(out / f"{anim}.png", optimize=True)
        print("ok", FOLDER, anim, flush=True)
    return out

def validate(folder, anims):
    """Checklist automatique. Retourne (ok, rapport)."""
    allowed = {OUTLINE[:3]} | {c[:3] for v in PAL.values() for c in v}
    rep = {"folder": str(folder), "slot": SLOT, "anims": {}, "errors": []}
    for anim in anims:
        p = Path(folder) / f"{anim}.png"
        e = []
        if not p.exists():
            rep["errors"].append(f"{anim}: fichier manquant"); continue
        im = Image.open(p)
        if im.size != (1920, 1024): e.append(f"taille {im.size} != (1920,1024)")
        if im.mode != "RGBA": e.append(f"mode {im.mode} != RGBA")
        a = np.array(im.convert("RGBA"))
        al = np.unique(a[..., 3])
        if not set(al.tolist()) <= {0, 255}: e.append(f"alpha partiel (anti-aliasing) : {al[:8].tolist()}")
        cols = {tuple(x) for x in np.unique(a[a[..., 3] > 0][:, :3], axis=0).tolist()}
        extra = cols - allowed
        if extra: e.append(f"{len(extra)} couleur(s) hors palette ex. {['#%02X%02X%02X' % x for x in list(extra)[:4]]}")
        nb, bp = load_anim(anim)
        cover_min, empty, outset_bad, edge_bad, outline_ratio = 1.0, 0, 0, 0, []
        for r in range(ROWS):
            for c in range(COLS):
                parts, _ = cell_parts(nb, bp, r, c)
                cell = a[r * FH:(r + 1) * FH, c * FW:(c + 1) * FW]
                op = cell[..., 3] > 0
                if parts["body"].any() and not op.any() and SLOT not in ("cape", "bouclier", "arme"): empty += 1
                if op[0].any() or op[-1].any() or op[:, 0].any() or op[:, -1].any(): edge_bad += 1
                for k in REQUIRED_COVER.get(SLOT, []):
                    if parts[k].sum() >= 3:
                        cover_min = min(cover_min, float((op & parts[k]).sum()) / parts[k].sum())
                if parts["body"].any():
                    zone = grow(parts["body"], MAX_OUTSET.get(SLOT, 8) + 1)
                    if (op & ~zone).any(): outset_bad += 1
                if op.any():
                    border = op & ~shrink(op)
                    is_out = np.all(cell[..., :3] == OUTLINE[:3], axis=-1)
                    outline_ratio.append(float((border & is_out).sum()) / max(1, border.sum()))
        if cover_min < 0.99: e.append(f"corps découvert : couverture min {cover_min:.1%} des parties {REQUIRED_COVER.get(SLOT)}")
        if empty: e.append(f"{empty} frame(s) vide(s) alors que le corps est visible")
        if outset_bad: e.append(f"{outset_bad} frame(s) dépassent MAX_OUTSET={MAX_OUTSET.get(SLOT)} px hors du corps (désalignement ?)")
        if edge_bad: e.append(f"{edge_bad} frame(s) touchent le bord de cellule (débordement)")
        orat = min(outline_ratio) if outline_ratio else 1.0
        if orat < 0.9: e.append(f"contour #1C154D incomplet : min {orat:.0%} du bord extérieur")
        rep["anims"][anim] = {"ok": not e, "errors": e, "colors": len(cols), "cover_min": round(cover_min, 4), "outline_min": round(orat, 3)}
        rep["errors"] += [f"{anim}: {x}" for x in e]
    rep["ok"] = not rep["errors"]
    return rep["ok"], rep

def preview(folder, out_png, anims=("Idle", "Walk", "Attack1"), cols=(0, 5, 10), S=3):
    tiles = []
    for anim in anims:
        p = Path(folder) / f"{anim}.png"
        if not p.exists(): continue
        nb = Image.open(KIT / "reference/NakedBody" / f"{anim}.png").convert("RGBA")
        comp = Image.alpha_composite(nb, Image.open(p).convert("RGBA"))
        for c in cols:
            row = Image.new("RGBA", (8 * 96, 96), (236, 232, 244, 255))
            for r in range(8):
                row.alpha_composite(comp.crop((c * 128 + 16, r * 128 + 16, c * 128 + 112, r * 128 + 112)), (r * 96, 0))
            tiles.append(row)
    if not tiles: return
    img = Image.new("RGBA", (8 * 96, 96 * len(tiles)))
    for i, t in enumerate(tiles): img.paste(t, (0, i * 96))
    img.resize((img.width * S, img.height * S), Image.NEAREST).save(out_png)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anims", default="")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--out", default=str(KIT / "out"))
    ap.add_argument("--check", default="")
    a = ap.parse_args()
    anims = ["Idle", "Walk", "Attack1"] if a.quick else ([x for x in a.anims.split(",") if x] or ANIMS)
    for x in anims: assert x in ANIMS, f"anim inconnue : {x}"
    out_root = Path(a.out)
    folder = Path(a.check) if a.check else build(anims, out_root)
    ok, rep = validate(folder, anims)
    out_root.mkdir(parents=True, exist_ok=True)
    name = Path(folder).name
    (out_root / f"report_{name}.json").write_text(json.dumps(rep, indent=1, ensure_ascii=False))
    preview(folder, out_root / f"preview_{name}.png")
    print("VALIDATION", "OK" if ok else "ÉCHEC", f"({len(anims)} anims)")
    for err in rep["errors"][:40]: print("  -", err)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
