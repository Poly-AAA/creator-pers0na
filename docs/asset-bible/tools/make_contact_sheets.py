#!/usr/bin/env python3
"""Planches contact étiquetées (reference/contact_*.png) + nuancier (reference/palette_swatch.png). Lecture seule sur le repo."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
REPO = Path(sys.argv[1] if len(sys.argv) > 1 else "/workspace/creator-pers0na")
SS = REPO / "assets/packs/fantasy-cc/spritesheets"
KIT = Path(__file__).resolve().parents[1]; REF = KIT / "reference"
ANIMS = json.loads((SS.parent / "catalog.json").read_text())["anims"]
DIRS = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"]
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 13)
FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 15)
BG, GRID, TXT = (236, 232, 244, 255), (190, 184, 210, 255), (28, 21, 77, 255)
def sheet(folders, anim):
    base = None
    for f in folders:
        p = SS / f / f"{anim}.png"
        if not p.exists(): continue
        im = Image.open(p).convert("RGBA")
        base = im if base is None else Image.alpha_composite(base, im)
    return base
def grid(folders, out, title, col=0):
    LW, C, TH = 190, 128, 40
    W, H = LW + 8 * C, TH + 20 + len(ANIMS) * C
    img = Image.new("RGBA", (W, H), BG); dr = ImageDraw.Draw(img)
    dr.text((8, 8), title, font=FB, fill=TXT)
    for i, d in enumerate(DIRS):
        dr.text((LW + i * C + 4, TH), f"row {i} = {d}", font=F, fill=TXT)
    for j, a in enumerate(ANIMS):
        y = TH + 20 + j * C; s = sheet(folders, a)
        dr.text((6, y + 50), f"{a}\n15 frames", font=F, fill=TXT)
        for i in range(8):
            x = LW + i * C
            if s: img.alpha_composite(s.crop((col * C, i * C, col * C + C, i * C + C)), (x, y))
            dr.rectangle((x, y, x + C - 1, y + C - 1), outline=GRID)
    img.save(out, optimize=True); print(out, img.size)
def strip(folders, out, row=2):
    LW, C, TH = 190, 128, 40
    img = Image.new("RGBA", (LW + 15 * C, TH + 20 + len(ANIMS) * C), BG); dr = ImageDraw.Draw(img)
    dr.text((8, 8), f"Toutes les frames (col 0..14) — direction row {row} = {DIRS[row]} — NakedBody", font=FB, fill=TXT)
    for c in range(15): dr.text((LW + c * C + 4, TH), f"col {c}", font=F, fill=TXT)
    for j, a in enumerate(ANIMS):
        y = TH + 20 + j * C; s = sheet(folders, a); dr.text((6, y + 56), a, font=F, fill=TXT)
        for c in range(15):
            x = LW + c * C
            img.alpha_composite(s.crop((c * C, row * C, c * C + C, row * C + C)), (x, y))
            dr.rectangle((x, y, x + C - 1, y + C - 1), outline=GRID)
    img.save(out, optimize=True); print(out, img.size)
def swatch(out):
    PALS = [
      ("Contour (outline) obligatoire", [("outline", "1C154D")]),
      ("Féminin — cheveux cuivre", [("L", "F4A96A"), ("M", "C8613F"), ("D", "85323A")]),
      ("Féminin — tissu prune", [("L", "C26BB0"), ("M", "8A3E95"), ("D", "4E2468")]),
      ("Féminin — or rose", [("L", "FFE0B0"), ("M", "E7A465"), ("D", "A9623F")]),
      ("Féminin — sarcelle (gants)", [("L", "8CF0D8"), ("M", "34B3A0"), ("D", "1F6B78")]),
      ("Féminin — vernis ongles", [("L", "FFC2D6"), ("M", "FF4F86"), ("D", "B0245A")]),
      ("Élément Feu (core/edge/dark)", [("core", "FFF6E0"), ("edge", "FF5E2B"), ("dark", "9E1B1B")]),
      ("Élément Eau", [("core", "F0FBFF"), ("edge", "2EA8FF"), ("dark", "164E87")]),
      ("Élément Terre", [("core", "FFF8DC"), ("edge", "E08E26"), ("dark", "6B4423")]),
      ("Élément Air", [("core", "F7FFFA"), ("edge", "3CE6B0"), ("dark", "186A5B")]),
      ("Poussière Meraki (MERAKI_DUST)", [("core", "F2E8DA"), ("edge", "B09E8E")]),
      ("Lumière (MERAKI_PALETTES.lumiere)", [("core", "FFFDF0"), ("edge", "FACC15"), ("dark", "A16207")]),
      ("Ombre (MERAKI_PALETTES.ombre)", [("core", "F5F0FF"), ("edge", "A855F7"), ("dark", "4C1D95")]),
    ]
    S = 64; img = Image.new("RGBA", (360 + 3 * (S + 70), len(PALS) * (S + 12) + 50), BG); dr = ImageDraw.Draw(img)
    dr.text((8, 10), "Nuancier Asset Bible (hex exacts)", font=FB, fill=TXT)
    for j, (name, cs) in enumerate(PALS):
        y = 44 + j * (S + 12); dr.text((8, y + S // 2 - 8), name, font=F, fill=TXT)
        for i, (lab, hx) in enumerate(cs):
            x = 360 + i * (S + 70); rgb = tuple(int(hx[k:k + 2], 16) for k in (0, 2, 4))
            dr.rectangle((x, y, x + S, y + S), fill=rgb, outline=(28, 21, 77))
            dr.text((x + S + 4, y + 16), f"{lab}\n#{hx}", font=F, fill=TXT)
    img.save(out, optimize=True); print(out, img.size)
if __name__ == "__main__":
    grid(["Shadow", "NakedBody"], REF / "contact_NakedBody_frame0.png", "NakedBody — frame col 0 — 30 anims x 8 directions (row 0..7)")
    grid(["NakedBody", "LegsFeminine", "ChestFeminine", "HandsFeminine", "HeadFeminine"], REF / "contact_Feminine_frame0.png", "Panoplie Féminine composée sur NakedBody — frame col 0")
    grid(["NakedBody", "FeetKintsugi", "LegsKintsugi", "ChestKintsugi", "MeleeKintsugi", "BackKintsugi", "HeadKintsugi"], REF / "contact_Kintsugi_frame6.png", "Panoplie Kintsugi composée (ordre row 2/S) — frame col 6", col=6)
    strip(["NakedBody"], REF / "contact_frames_S.png", row=2)
    swatch(REF / "palette_swatch.png")
