#!/usr/bin/env python3
"""Build Head25 (wizard hat) sheets: same placement on all 8 dirs, per-frame on every anim (Walk/Attack/Die…)."""
from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FW, FH, COLS, ROWS = 128, 128, 15, 8
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
TARGET_W = 14
DX = 0
DY = -8
SIT = 0.42


def load_cfg(path: Path | None) -> None:
    global TARGET_W, DX, DY, SIT
    if not path or not path.exists():
        return
    import json
    o = json.loads(path.read_text())
    TARGET_W = int(o.get("targetW", TARGET_W))
    DX = int(o.get("dx", DX))
    DY = int(o.get("dy", DY))
    SIT = float(o.get("sit", SIT))


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


def place_hat(hat: Image.Image, head_bbox: tuple[int, int, int, int]) -> Image.Image:
    """Same dx/dy/sit/size for every dir & frame — hat sticks to that frame's head bbox."""
    cell = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
    hx0, hy0, hx1, hy1 = head_bbox
    hcx = (hx0 + hx1) / 2
    x = int(round(hcx - hat.width / 2 + DX))
    y = int(round(hy1 - hat.height * SIT + DY))
    x = max(-hat.width + 4, min(FW - 4, x))
    y = max(-hat.height + 4, min(FH - 4, y))
    cell.alpha_composite(hat, (x, y))
    return cell


def head_bbox_at(head_sheet: Image.Image, row: int, col: int) -> tuple[int, int, int, int]:
    cell = head_sheet.crop((col * FW, row * FH, (col + 1) * FW, (row + 1) * FH))
    bb = cell.getchannel("A").getbbox()
    if not bb:
        return (60, 48, 70, 58)
    return bb


def build_anim_sheet(hats: dict, head_sheet: Image.Image) -> Image.Image:
    sheet = Image.new("RGBA", (FW * COLS, FH * ROWS), (0, 0, 0, 0))
    for row, lab in enumerate(ROW_LABEL):
        hat = hats[lab]
        for col in range(COLS):
            hb = head_bbox_at(head_sheet, row, col)
            cell = place_hat(hat, hb)
            sheet.alpha_composite(cell, (col * FW, row * FH))
    return sheet


def build(
    src_rot: Path,
    head3_dir: Path,
    out_dir: Path,
    preview_dir: Path | None = None,
) -> Path:
    hats = {}
    for lab, fn in FILE_FOR.items():
        hats[lab] = scale_nn(content(Image.open(src_rot / fn)), TARGET_W)

    idle_head = head3_dir / "Idle.png"
    if not idle_head.exists():
        # legacy single full sheet
        legacy = ROOT / "docs/previews/hat-refs/Head3_Idle_full.png"
        head_idle = Image.open(legacy).convert("RGBA")
    else:
        head_idle = Image.open(idle_head).convert("RGBA")

    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for anim in ANIMS:
        head_path = head3_dir / f"{anim}.png"
        head_sheet = Image.open(head_path).convert("RGBA") if head_path.exists() else head_idle
        sheet = build_anim_sheet(hats, head_sheet)
        dest = out_dir / f"{anim}.png"
        sheet.save(dest, optimize=True)
        written.append(dest.name)
        print(" ", anim, dest.stat().st_size)

    idle_out = out_dir / "Idle.png"

    if preview_dir:
        preview_dir.mkdir(parents=True, exist_ok=True)
        body_path = preview_dir / "NakedBody_Idle_full.png"
        body = Image.open(body_path).convert("RGBA") if body_path.exists() else None
        sheet = Image.open(idle_out).convert("RGBA")
        for row, lab in enumerate(ROW_LABEL):
            cell = sheet.crop((0, row * FH, FW, (row + 1) * FH))
            vis = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            if body:
                vis.alpha_composite(body.crop((0, row * FH, FW, (row + 1) * FH)))
            # also show Head3 under hat for preview
            vis.alpha_composite(head_idle.crop((0, row * FH, FW, (row + 1) * FH)))
            vis.alpha_composite(cell)
            vis.resize((FW * 4, FH * 4), Image.NEAREST).save(preview_dir / f"Head25_{lab}_on_body.png")
        sheet.resize((FW * COLS // 2, FH * ROWS // 2), Image.NEAREST).save(preview_dir / "Head25_Idle_sheet.png")
        # Die + Attack1 contact-sheet previews (frame 0 / mid / last)
        for anim in ("Die", "Attack1", "Walk"):
            hp = head3_dir / f"{anim}.png"
            if not hp.exists():
                continue
            hsheet = Image.open(hp).convert("RGBA")
            asheet = Image.open(out_dir / f"{anim}.png").convert("RGBA")
            bp = head3_dir.parent / "NakedBody" / f"{anim}.png"
            bsheet = Image.open(bp).convert("RGBA") if bp.exists() else None
            strip = Image.new("RGBA", (FW * 3 * 2, FH * 2), (232, 232, 226, 255))
            for i, col in enumerate((0, 7, 14)):
                for row in (2, 0):  # S and E
                    vis = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
                    if bsheet:
                        vis.alpha_composite(bsheet.crop((col * FW, row * FH, (col + 1) * FW, (row + 1) * FH)))
                    vis.alpha_composite(hsheet.crop((col * FW, row * FH, (col + 1) * FW, (row + 1) * FH)))
                    vis.alpha_composite(asheet.crop((col * FW, row * FH, (col + 1) * FW, (row + 1) * FH)))
                    strip.alpha_composite(vis.resize((FW * 2, FH * 2), Image.NEAREST), (i * FW * 2, (0 if row == 2 else 1) * FH * 2))
            strip.save(preview_dir / f"Head25_{anim}_frames.png")

    print("wrote", len(written), "anims →", out_dir)
    return idle_out


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--src", default=str(ROOT / "docs/previews/hat-refs/pixellab-source"))
    p.add_argument("--head3", default=str(ROOT / "assets/packs/fantasy-cc/spritesheets/Head3"))
    p.add_argument("--out", default=str(ROOT / "assets/packs/fantasy-cc/spritesheets/Head25"))
    p.add_argument("--cfg", default=str(ROOT / "docs/previews/hat-place.json"))
    args = p.parse_args()
    load_cfg(Path(args.cfg) if args.cfg else None)
    print("cfg targetW", TARGET_W, "dx", DX, "dy", DY, "sit", SIT)
    print("base views (8 dirs) reused; placing on every anim frame…")
    prev = ROOT / "docs/previews/hat-refs"
    path = build(Path(args.src), Path(args.head3), Path(args.out), prev)
    print("Idle", path, "bytes", path.stat().st_size)
