/**
 * Une seule variante, collée sur les feuilles d'origine.
 * Le crâne de référence est la couche Head1, déjà calée sur chaque image.
 * Le visage est peint sur les pixels du corps. La frange part de Head1.
 * Le torse gagne un pixel de chaque côté ; les pieds ne bougent pas.
 */
export const FRAME = 128;
export const COLS = 15;
export const ROWS = 8;
export const ANIMS = [
  "Idle", "Idle2", "Idle3", "Idle4", "Walk", "Run", "RunBackwards",
  "StrafeLeft", "StrafeRight", "CrouchIdle", "CrouchRun",
  "Attack1", "Attack2", "Attack3", "Attack4", "Attack5", "Attack6",
  "AttackRun", "AttackRun2", "Kick", "Special1", "TakeDamage", "Die",
  "Taunt", "Slide", "Rolling", "RideIdle", "RideRun", "RideIdleAttack1", "RideRunAttack1",
];
/** Ligne de feuille → nom de direction (calibrage fantasy-cc). */
export const DIR_LABELS = ["O", "NO", "N", "NE", "E", "SE", "S", "SO"];
export const HAIR = [42, 24, 16, 255];
export const HAIR_HI = [112, 64, 36, 255];
export const EYE = [16, 12, 10, 255];
export const MOUTH = [164, 52, 48, 255];

function at(x, y) {
  return (y * FRAME + x) * 4;
}

function solid(px, x, y, minA) {
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return false;
  return px[at(x, y) + 3] > (minA == null ? 40 : minA);
}

function put(px, x, y, rgba) {
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return;
  const i = at(x, y);
  px[i] = rgba[0];
  px[i + 1] = rgba[1];
  px[i + 2] = rgba[2];
  px[i + 3] = rgba[3];
}

export function headBox(head) {
  let n = 0;
  let x0 = FRAME;
  let y0 = FRAME;
  let x1 = -1;
  let y1 = -1;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      if (!solid(head, x, y, 20)) continue;
      n++;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
      sx += x;
      sy += y;
    }
  }
  if (!n) return null;
  return { n, x0, y0, x1, y1, cx: sx / n, cy: sy / n };
}

function footBottom(px) {
  for (let y = FRAME - 1; y >= 0; y--) {
    for (let x = 0; x < FRAME; x++) if (solid(px, x, y)) return y;
  }
  return -1;
}

function skinOf(luma) {
  const t = luma / 255;
  return [
    Math.round(118 + t * 125),
    Math.round(62 + t * 108),
    Math.round(42 + t * 78),
    255,
  ];
}

function paintSkin(out, body) {
  for (let i = 0; i < body.length; i += 4) {
    if (body[i + 3] <= 40) continue;
    const s = skinOf(body[i]);
    out[i] = s[0];
    out[i + 1] = s[1];
    out[i + 2] = s[2];
    out[i + 3] = 255;
  }
}

function growTorso(out, body, box, foot) {
  if (!box || foot < 0) return;
  const y0 = Math.min(foot - 6, box.y1 + 5);
  const y1 = foot - 6;
  for (let y = y0; y <= y1; y++) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < FRAME; x++) {
      if (!solid(body, x, y)) continue;
      if (left < 0) left = x;
      right = x;
    }
    if (left < 0 || right - left < 2) continue;
    if (left > 0 && !solid(body, left - 1, y)) put(out, left - 1, y, skinOf(body[at(left, y)]));
    if (right < FRAME - 1 && !solid(body, right + 1, y)) put(out, right + 1, y, skinOf(body[at(right, y)]));
  }
}

function facePixels(body, box) {
  const list = [];
  const yA = box.y1 + 1;
  const yB = Math.min(FRAME - 1, box.y1 + 6);
  for (let y = yA; y <= yB; y++) {
    for (let x = box.x0 - 1; x <= box.x1 + 1; x++) {
      if (solid(body, x, y)) list.push([x, y]);
    }
  }
  return list;
}

function paintFace(out, body, box) {
  const cand = [];
  const yA = Math.max(0, Math.floor(box.cy));
  const yB = Math.min(FRAME - 1, box.y1 + 6);
  const xA = Math.max(0, box.x0 - 5);
  const xB = Math.min(FRAME - 1, box.x1 + 5);
  for (let y = yA; y <= yB; y++) {
    for (let x = xA; x <= xB; x++) {
      if (!solid(body, x, y)) continue;
      cand.push([x, y]);
    }
  }
  const below = cand.filter((p) => p[1] >= box.y1);
  const list = below.length >= 2 ? below : cand.length ? cand : facePixels(body, box);
  if (!list.length) return;
  let minY = FRAME;
  for (const p of list) if (p[1] < minY) minY = p[1];
  const top = list.filter((p) => p[1] === minY).map((p) => p[0]).sort((a, b) => a - b);
  const wide = top[top.length - 1] - top[0] >= 4;
  const eyes = wide ? [top[0], top[top.length - 1]] : [top[(top.length / 2) | 0]];
  for (const ex of eyes) put(out, ex, minY, EYE);
  const mouthRow = list.filter((p) => p[1] === Math.min(FRAME - 1, minY + 2));
  if (!mouthRow.length) return;
  const mx = mouthRow[(mouthRow.length / 2) | 0][0];
  put(out, mx, minY + 2, MOUTH);
  if (wide) {
    const mx2 = mouthRow[Math.min(mouthRow.length - 1, (mouthRow.length / 2 | 0) + 1)][0];
    if (mx2 !== mx) put(out, mx2, minY + 2, MOUTH);
  }
}

function paintHair(out, body, head, box, foot) {
  const allowNew = (x, y) => {
    if (foot < 0) return true;
    if (solid(body, x, y)) return true;
    return y < foot - 4;
  };
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      if (!solid(head, x, y, 20) || !allowNew(x, y)) continue;
      put(out, x, y, y === box.y0 ? HAIR_HI : HAIR);
    }
  }
  const fringe = Math.min(FRAME - 1, box.y1 + 1);
  for (let x = box.x0; x <= box.x1; x++) {
    if (!solid(body, x, fringe)) continue;
    put(out, x, fringe, HAIR);
  }
  for (const x of [box.x0 - 1, box.x1 + 1]) {
    for (let y = box.y0 + 1; y <= Math.min(FRAME - 1, box.y1 + 4); y++) {
      if (!allowNew(x, y)) continue;
      const stuck = solid(body, x, y) || solid(head, x + (x < box.cx ? 1 : -1), y, 20);
      if (!stuck) continue;
      put(out, x, y, HAIR);
    }
  }
}

/** Image 128×128 : corps d'origine + ancre Head1. */
export function applyVariant(body, head) {
  const out = new Uint8Array(body);
  const box = headBox(head);
  const foot = footBottom(body);
  paintSkin(out, body);
  growTorso(out, body, box, foot);
  if (box) {
    paintHair(out, body, head, box, foot);
    paintFace(out, body, box);
  }
  return out;
}

export function sliceFrame(sheet, sheetW, col, row) {
  const out = new Uint8Array(FRAME * FRAME * 4);
  const x0 = col * FRAME;
  const y0 = row * FRAME;
  for (let y = 0; y < FRAME; y++) {
    const src = ((y0 + y) * sheetW + x0) * 4;
    out.set(sheet.subarray(src, src + FRAME * 4), y * FRAME * 4);
  }
  return out;
}

export function blitFrame(dest, destW, frame, col, row) {
  const x0 = col * FRAME;
  const y0 = row * FRAME;
  for (let y = 0; y < FRAME; y++) {
    const di = ((y0 + y) * destW + x0) * 4;
    dest.set(frame.subarray(y * FRAME * 4, (y + 1) * FRAME * 4), di);
  }
}

function sameAlpha(a, b, x, y) {
  return (a[at(x, y) + 3] > 40) === (b[at(x, y) + 3] > 40);
}

/** Écarts d'ancrage : pieds immobiles, visage sur le corps, frange près du crâne. */
export function frameDrift(body, head, variant) {
  const issues = [];
  const foot = footBottom(body);
  if (foot >= 0) {
    for (let y = Math.max(0, foot - 4); y <= foot; y++) {
      for (let x = 0; x < FRAME; x++) {
        if (!sameAlpha(body, variant, x, y)) issues.push("pied " + x + "," + y);
      }
    }
  }
  const box = headBox(head);
  let eyes = 0;
  let hair = 0;
  let hairFar = 0;
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      const i = at(x, y);
      const eye = variant[i] === EYE[0] && variant[i + 1] === EYE[1] && variant[i + 2] === EYE[2];
      const mouth = variant[i] === MOUTH[0] && variant[i + 1] === MOUTH[1] && variant[i + 2] === MOUTH[2];
      const isHair = variant[i] === HAIR[0] && variant[i + 1] === HAIR[1] && variant[i + 2] === HAIR[2]
        || variant[i] === HAIR_HI[0] && variant[i + 1] === HAIR_HI[1] && variant[i + 2] === HAIR_HI[2];
      if ((eye || mouth) && !solid(body, x, y)) issues.push("visage hors corps " + x + "," + y);
      if (eye) eyes++;
      if (!isHair) continue;
      hair++;
      if (!box) {
        hairFar++;
        continue;
      }
      const near = Math.abs(x - box.cx) <= (box.x1 - box.x0) / 2 + 4 && Math.abs(y - box.cy) <= (box.y1 - box.y0) / 2 + 8;
      if (!near) hairFar++;
    }
  }
  if (box && box.n >= 8 && eyes < 1) issues.push("visage absent");
  if (box && box.n >= 8 && hair < 8) issues.push("frange absente");
  if (hairFar) issues.push("frange loin du crâne " + hairFar);
  return issues;
}
