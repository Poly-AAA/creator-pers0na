#!/usr/bin/env python3
"""Build Head25 (wizard hat) 1920×1024 sheets from PixelLab 8-dir PNGs."""
from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FW, FH, COLS, ROWS = 128, 128, 15, 8
# sheet row → compass label (Idle mapping fantasy-cc)
ROW_LABEL = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"]
FILE_FOR = {
    "S": "south.png",
    "SE": "south-east.png",
    "E": "east.png",
    "NE": "north-east.png",
    "N": "north.png",
    "NW": "north-west.png",
    "W": "west.png",
    "SW": "south-west.png",
}
ANIMS = [
    "Idle", "Idle2", "Idle3", "Idle4", "Walk", "Run", "RunBackwards",
    "StrafeLeft", "StrafeRight", "CrouchIdle", "CrouchRun",
    "Attack1", "Attack2", "Attack3", "Attack4", "Attack5", "Attack6",
    "AttackRun", "AttackRun2", "Kick", "Special1", "TakeDamage", "Die",
    "Taunt", "Slide", "Rolling", "RideIdle", "RideRun", "RideIdleAttack1",
    "RideRunAttack1",
]
TARGET_W = 26  # brim width in 128×128 cell (head gear ~9px, hat a bit wider)


def content(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def scale_nn(im: Image.Image, tw: int) -> Image.Image:
    w, h = im.size
    if w <= 0:
        return im
    th = max(1, round(h * (tw / w)))
    return im.resize((tw, th), Image.NEAREST)


def place_on_cell(hat: Image.Image, head_bbox: tuple[int, int, int, int]) -> Image.Image:
    cell = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    hx0, hy0, hx1, hy1 = head_bbox
    hcx = (hx0 + hx1) / 2
    # Sit the brim on the helmet: hat bottom a couple px below helmet bottom
    x = int(round(hcx - hat.width / 2))
    y = int(round(hy1 - hat.height * 0.42))
    x = max(0, min(FW - hat.width, x))
    y = max(0, min(FH - hat.height, y))
    cell.alpha_composite(hat, (x, y))
    return cell


def build(src_rot: Path, head3_idle: Path, out_dir: Path, preview_dir: Path | None = None) -> Path:
    head3 = Image.open(head3_idle).convert("RGBA")
    hats = {}
    for lab, fn in FILE_FOR.items():
        hats[lab] = scale_nn(content(Image.open(src_rot / fn)), TARGET_W)

    sheet = Image.new("RGBA", (FW * COLS, FH * ROWS), (0, 0, 0, 0))
    for row, lab in enumerate(ROW_LABEL):
        hb = head3.crop((0, row * FH, FW, (row + 1) * FH)).getchannel("A").getbbox()
        if not hb:
            hb = (60, 48, 70, 58)
        cell = place_on_cell(hats[lab], hb)
        for col in range(COLS):
            sheet.alpha_composite(cell, (col * FW, row * FH))

    out_dir.mkdir(parents=True, exist_ok=True)
    idle = out_dir / "Idle.png"
    sheet.save(idle, optimize=True)
    for anim in ANIMS:
        if anim == "Idle":
            continue
        dest = out_dir / f"{anim}.png"
        if dest.resolve() != idle.resolve():
            dest.write_bytes(idle.read_bytes())

    if preview_dir:
        preview_dir.mkdir(parents=True, exist_ok=True)
        body_path = preview_dir / "NakedBody_Idle_full.png"
        body = Image.open(body_path).convert("RGBA") if body_path.exists() else None
        for row, lab in enumerate(ROW_LABEL):
            cell = sheet.crop((0, row * FH, FW, (row + 1) * FH))
            vis = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            if body:
                vis.alpha_composite(body.crop((0, row * FH, FW, (row + 1) * FH)))
            vis.alpha_composite(cell)
            vis.resize((FW * 4, FH * 4), Image.NEAREST).save(preview_dir / f"Head25_{lab}_on_body.png")
        sheet.resize((FW * COLS // 2, FH * ROWS // 2), Image.NEAREST).save(preview_dir / "Head25_Idle_sheet.png")
    return idle


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--src", default="/tmp/hat-dropbox/extracted/Pixel_art_isometrique_2_1_sty/rotations")
    p.add_argument("--head3", default=str(ROOT / "docs/previews/hat-refs/Head3_Idle_full.png"))
    p.add_argument("--out", default=str(ROOT / "assets/packs/fantasy-cc/spritesheets/Head25"))
    args = p.parse_args()
    prev = ROOT / "docs/previews/hat-refs"
    path = build(Path(args.src), Path(args.head3), Path(args.out), prev)
    print("wrote", path, "bytes", path.stat().st_size)
