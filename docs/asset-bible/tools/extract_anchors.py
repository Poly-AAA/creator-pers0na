#!/usr/bin/env python3
"""
Extraction des ancres (anchors.json) + cartes de parties du corps (reference/bodyparts/<Anim>.png)
depuis les sheets NakedBody du repo creator-pers0na. Lecture seule sur le repo.

Méthode (identique à la segmentation de scripts/build-feminine-panoply.py) :
  body  = alpha(NakedBody) > 24
  head  = alpha(Head7) & body          torso = alpha(Chest3) & body & ~head
  arm   = alpha(Chest9) & ~Chest3 & body & ~head (manches)
  legs  = alpha(Legs1) & body & ~torso & ~arm & ~feet       feet = alpha(Shoes1) & body
  hands = alpha(Hands3) & body + composantes restantes reliées aux manches
  Les pixels restants sont rattachés à la partie voisine (torso/legs), sinon à hands.
Ancres (coordonnées pixel DANS la cellule 128x128, origine haut-gauche, x→droite, y→bas, entiers) :
  head_top    : point le plus haut de head (x = milieu des pixels de cette ligne)
  head_center : centre de la bbox de head
  neck        : centroïde des pixels head touchant torso/arm (sinon bas-centre de head)
  chest       : centroïde de la moitié haute de torso
  pelvis      : centroïde des 3 premières lignes de legs
  hand_l/hand_r : centroïde des 2 plus grandes composantes de hands, triées par x ÉCRAN (l = gauche écran)
  foot_l/foot_r : composantes de feet triées par x écran ; point = (x moyen, y max) = contact sol
  ground_y    : y max du corps ; bbox : [x0,y0,x1,y1] du corps
  weapon_grip : (Melee2) centroïde des pixels d'arme qui recouvrent une main dilatée de 1 px,
                sinon centroïde de la partie sombre (manche, lum<140) ; weapon_tip = pixel d'arme le plus éloigné du grip
  Valeur null = partie invisible/introuvable sur cette frame (ex. main cachée derrière le corps).
"""
import json, sys
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

REPO = Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/creator-pers0na")
SS = REPO / "assets/packs/fantasy-cc/spritesheets"
KIT = Path(__file__).resolve().parents[1]
FW = FH = 128; COLS, ROWS = 15, 8
ANIMS = json.loads((SS.parent / "catalog.json").read_text())["anims"]
DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"]
PART_IDS = {"head": 1, "torso": 2, "arm": 3, "hands": 4, "legs": 5, "feet": 6}

def load(folder, anim):
    p = SS / folder / f"{anim}.png"
    return np.array(Image.open(p).convert("RGBA")) if p.exists() else None

def cellm(arr, r, c):
    if arr is None: return np.zeros((FH, FW), bool)
    return arr[r*FH:(r+1)*FH, c*FW:(c+1)*FW, 3] > 24

def dil(m, n=1):
    return ndi.binary_dilation(m, structure=ndi.generate_binary_structure(2, 1), iterations=n) if m.any() else m

def segment(S, r, c):
    body = cellm(S["NakedBody"], r, c)
    head = cellm(S["Head7"], r, c) & body
    ch9 = cellm(S["Chest9"], r, c) & body
    ch3 = cellm(S["Chest3"], r, c) & body
    feet = cellm(S["Shoes1"], r, c) & body
    h3 = cellm(S["Hands3"], r, c) & body
    torso = ch3 & ~head
    arm = ch9 & ~ch3 & ~head
    legs = cellm(S["Legs1"], r, c) & body & ~torso & ~arm & ~feet
    left = body & ~head & ~torso & ~arm & ~legs & ~feet
    hands = h3.copy()
    lab, n = ndi.label(left)
    for i in range(1, n + 1):
        comp = lab == i; near = dil(comp)
        if (near & (h3 | arm)).any(): hands |= comp
        elif (near & torso).any(): torso |= comp
        elif (near & legs).any(): legs |= comp
        else: hands |= comp
    torso &= ~hands; arm &= ~hands; legs &= ~hands; feet &= ~hands
    return dict(body=body, head=head, torso=torso, arm=arm, hands=hands, legs=legs, feet=feet)

def pt(x, y): return [int(round(float(x))), int(round(float(y)))]
def centroid(m):
    ys, xs = np.nonzero(m)
    return pt(xs.mean(), ys.mean()) if len(xs) else None

def comps_sorted(m, k=2, min_px=2):
    lab, n = ndi.label(m, structure=ndi.generate_binary_structure(2, 2))
    cs = [(lab == i) for i in range(1, n + 1)]
    cs = sorted([c for c in cs if c.sum() >= min_px], key=lambda c: -c.sum())[:k]
    return sorted(cs, key=lambda c: np.nonzero(c)[1].mean())

def anchors_of(seg, wmask=None, wlum=None):
    A = {}
    body, head, torso = seg["body"], seg["head"], seg["torso"]
    if not body.any(): return None
    ys, xs = np.nonzero(body)
    A["bbox"] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    A["ground_y"] = int(ys.max())
    if head.any():
        hy, hx = np.nonzero(head)
        top = hy.min(); A["head_top"] = pt(hx[hy == top].mean(), top)
        A["head_center"] = pt((hx.min() + hx.max()) / 2, (hy.min() + hy.max()) / 2)
        nk = head & dil(torso | seg["arm"])
        A["neck"] = centroid(nk) if nk.any() else pt((hx.min() + hx.max()) / 2, hy.max())
    else:
        A["head_top"] = A["head_center"] = A["neck"] = None
    if torso.any():
        ty, tx = np.nonzero(torso); mid = (ty.min() + ty.max()) / 2
        A["chest"] = centroid(torso & (np.arange(FH)[:, None] <= mid))
    else: A["chest"] = None
    lg = seg["legs"]
    if lg.any():
        ly = np.nonzero(lg)[0].min()
        A["pelvis"] = centroid(lg & (np.arange(FH)[:, None] < ly + 3))
    else: A["pelvis"] = None
    hc = comps_sorted(seg["hands"])
    A["hand_l"] = centroid(hc[0]) if hc else None
    A["hand_r"] = centroid(hc[-1]) if len(hc) > 1 else None
    fc = comps_sorted(seg["feet"])
    def foot(c):
        y, x = np.nonzero(c); return pt(x.mean(), y.max())
    A["foot_l"] = foot(fc[0]) if fc else None
    A["foot_r"] = foot(fc[-1]) if len(fc) > 1 else None
    if wmask is not None and wmask.any():
        ov = wmask & dil(seg["hands"], 1)
        grip = centroid(ov) if ov.any() else (centroid(wmask & (wlum < 140)) if (wmask & (wlum < 140)).any() else centroid(wmask))
        wy, wx = np.nonzero(wmask)
        d = (wx - grip[0]) ** 2 + (wy - grip[1]) ** 2
        A["weapon_grip"] = grip; A["weapon_tip"] = pt(wx[d.argmax()], wy[d.argmax()])
    else:
        A["weapon_grip"] = A["weapon_tip"] = None
    return A

def process(anim):
    S = {f: load(f, anim) for f in ("NakedBody", "Head7", "Chest3", "Chest9", "Legs1", "Hands3", "Shoes1", "Melee2")}
    lab = np.zeros((FH * ROWS, FW * COLS), np.uint8)
    rows = []
    for r in range(ROWS):
        frames = []
        for c in range(COLS):
            seg = segment(S, r, c)
            for k, v in PART_IDS.items():
                lab[r*FH:(r+1)*FH, c*FW:(c+1)*FW][seg[k]] = v
            w = S["Melee2"]
            wm = cellm(w, r, c) if w is not None else None
            wl = w[r*FH:(r+1)*FH, c*FW:(c+1)*FW, :3].mean(2) if w is not None else None
            frames.append(anchors_of(seg, wm, wl))
        rows.append({"row": r, "dir": DIRS[r], "frames": frames})
    im = Image.fromarray(lab, "P")
    pal = [0, 0, 0, 255, 80, 80, 80, 200, 80, 80, 140, 255, 255, 220, 60, 160, 90, 220, 60, 200, 200] + [0] * (256 * 3 - 21)
    im.putpalette(pal); im.info["transparency"] = 0
    out = KIT / "reference/bodyparts"; out.mkdir(parents=True, exist_ok=True)
    im.save(out / f"{anim}.png", optimize=True, transparency=0)
    return anim, rows

if __name__ == "__main__":
    res = {}
    with ProcessPoolExecutor() as ex:
        for anim, rows in ex.map(process, ANIMS):
            res[anim] = rows; print("ok", anim, flush=True)
    doc = {
        "meta": {
            "source": "Poly-AAA/creator-pers0na assets/packs/fantasy-cc/spritesheets/NakedBody (+ masques Head7, Chest3, Chest9, Legs1, Hands3, Shoes1 ; arme Melee2)",
            "sheet": {"w": 1920, "h": 1024, "cols": 15, "rows": 8, "cell": 128},
            "coords": "pixels entiers dans la cellule 128x128 ; origine haut-gauche ; x vers la droite, y vers le bas. Position absolue dans la sheet = (col*128 + x, row*128 + y).",
            "rows": {str(i): d for i, d in enumerate(DIRS)},
            "lr": "hand_l/hand_r et foot_l/foot_r = gauche/droite ÉCRAN (tri par x), pas gauche/droite anatomique. Si une seule composante est visible, elle est dans *_l et *_r = null.",
            "null": "partie non visible ou non séparable sur cette frame",
            "bodyparts_png": "reference/bodyparts/<Anim>.png : PNG palette, index 0=vide 1=head 2=torso 3=arm(manche) 4=hands 5=legs 6=feet",
            "keys": ["bbox", "ground_y", "head_top", "head_center", "neck", "chest", "pelvis", "hand_l", "hand_r", "foot_l", "foot_r", "weapon_grip", "weapon_tip"],
            "method": "voir tools/extract_anchors.py (docstring)",
        },
        "anims": {a: res[a] for a in ANIMS},
    }
    (KIT / "anchors.json").write_text(json.dumps(doc, separators=(",", ":")))
    print("anchors.json", (KIT / "anchors.json").stat().st_size, "bytes")
