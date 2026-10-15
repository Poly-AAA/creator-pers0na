/**
 * Idles de caractère, calqués sur une boucle de 11 images (0,72 s).
 * Le corps reste la pose Idle d'origine. Seuls la main, la frange,
 * l'accessoire et une petite lueur d'équipement bougent.
 */
import { FRAME, applyVariant, headBox, HAIR, HAIR_HI } from "./sheet-variant.js";

export const IDLE_FRAMES = 11;
export const IDLE_FPS = 15;
export const IDLE_VARIANTS = ["Lecture", "Sac", "Bijou"];

export const GLOW_HI = [170, 230, 120, 255];
export const GLOW_LO = [90, 160, 70, 255];
export const BOOK = [96, 56, 36, 255];
export const PAGE = [244, 236, 214, 255];
export const SACK = [62, 44, 34, 255];
export const GEM = [220, 186, 72, 255];

function cell(x, y) {
  return (y * FRAME + x) * 4;
}

function ink(px, x, y) {
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return false;
  return px[cell(x, y) + 3] > 40;
}

function dot(px, x, y, rgba) {
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) return;
  const i = cell(x, y);
  px[i] = rgba[0];
  px[i + 1] = rgba[1];
  px[i + 2] = rgba[2];
  px[i + 3] = rgba[3];
}

function sole(px) {
  for (let y = FRAME - 1; y >= 0; y--) {
    for (let x = 0; x < FRAME; x++) if (ink(px, x, y)) return y;
  }
  return -1;
}

/** Onde qui vaut 0 à l'image 0 et à l'image 11. */
export function idleWave(frame) {
  const t = ((frame % IDLE_FRAMES) + IDLE_FRAMES) % IDLE_FRAMES;
  return Math.sin((t / IDLE_FRAMES) * Math.PI * 2);
}

function bob(frame) {
  return Math.round(idleWave(frame));
}

function glowColor(frame) {
  return idleWave(frame) > 0 ? GLOW_HI : GLOW_LO;
}

function hands(body, box, foot) {
  if (!box || foot < 0) return null;
  const y0 = box.y1 + 4;
  const y1 = Math.min(foot - 8, box.y1 + 16);
  let left = null;
  let right = null;
  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < FRAME; x++) {
      if (!ink(body, x, y)) continue;
      if (!left || x < left.x) left = { x, y };
      if (!right || x > right.x) right = { x, y };
    }
  }
  if (!left || !right) return null;
  return { left, right };
}

function swayHair(px, box, frame, foot) {
  const shift = bob(frame);
  if (!box || !shift) return;
  const x = shift > 0 ? box.x1 + 2 : box.x0 - 2;
  for (let y = box.y0; y <= Math.min(box.y1, box.y0 + 4); y++) {
    if (y >= foot - 5) return;
    if (ink(px, x, y)) continue;
    if (!ink(px, x - shift, y) && !ink(px, x - 2 * shift, y)) continue;
    dot(px, x, y, HAIR);
    if (y + 1 < foot - 5 && !ink(px, x, y + 1)) dot(px, x, y + 1, HAIR);
    return;
  }
}

function paintGlow(px, x, y, frame, foot) {
  if (y >= foot - 4) return;
  dot(px, x, y, glowColor(frame));
}

function paintLecture(px, box, hold, frame, foot) {
  const page = bob(frame);
  const x = Math.max(0, hold.x - 1);
  const y = Math.min(Math.max(hold.y, box.y1 + 4), foot - 8);
  dot(px, x, y, BOOK);
  dot(px, x + 1, y, BOOK);
  dot(px, x, y + 1, PAGE);
  dot(px, x + 1, y + 1, PAGE);
  const hy = y - 1 + (page > 0 ? -1 : page < 0 ? 1 : 0);
  if (hy > box.y1 && hy < foot - 4) dot(px, x + 1, hy, PAGE);
  paintGlow(px, Math.round(box.cx), Math.max(0, box.y0 - 1), frame, foot);
}

function paintPack(px, box, hold, frame, foot) {
  const lift = bob(frame) > 0 ? -1 : 0;
  const x = Math.min(FRAME - 2, hold.x + 1);
  const y = Math.max(box.y1 + 2, Math.min(hold.y, foot - 8)) + lift;
  dot(px, x, y, SACK);
  dot(px, x, y + 1, SACK);
  dot(px, x + 1, y + 1, SACK);
  paintGlow(px, x + 1, Math.max(box.y1, y - 1), frame, foot);
}

function paintGem(px, box, frame, foot) {
  const x = Math.round(box.cx);
  const y = Math.min(box.y1 + 5, foot - 6);
  const hover = bob(frame);
  dot(px, x, y, GEM);
  const py = y - 1 + (hover < 0 ? 1 : hover > 0 ? -1 : 0);
  if (py > box.y1 && py < foot - 4) dot(px, x + 1, py, PAGE);
  paintGlow(px, x, Math.max(0, box.y0 - 1), frame, foot);
}

/**
 * Une image de la boucle. `body` et `head` sont la pose Idle tenue
 * (même image pour les 11 cases) : le retour sur la première image est exact
 * pour le corps, et les accessoires suivent une onde de période 11.
 */
export function idleFrame(kind, body, head, frame) {
  const out = applyVariant(body, head);
  const box = headBox(head);
  const foot = sole(out);
  if (!box) return out;
  swayHair(out, box, frame, foot);
  const arms = hands(body, box, foot);
  const hold = arms ? (kind === "Sac" ? arms.right : arms.left) : { x: Math.round(box.cx) - 4, y: box.y1 + 6 };
  if (kind === "Lecture") paintLecture(out, box, hold, frame, foot);
  else if (kind === "Sac") paintPack(out, box, hold, frame, foot);
  else paintGem(out, box, frame, foot);
  return out;
}

export function sameFeet(a, b) {
  const foot = sole(a);
  if (foot < 0) return true;
  for (let y = Math.max(0, foot - 4); y <= foot; y++) {
    for (let x = 0; x < FRAME; x++) {
      if ((a[cell(x, y) + 3] > 40) !== (b[cell(x, y) + 3] > 40)) return false;
    }
  }
  return true;
}

function countColor(px, rgb) {
  let n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] === rgb[0] && px[i + 1] === rgb[1] && px[i + 2] === rgb[2]) n++;
  }
  return n;
}

export function idleIssues(kind, body, head) {
  const issues = [];
  const frames = [];
  for (let f = 0; f < IDLE_FRAMES; f++) frames.push(idleFrame(kind, body, head, f));
  const again = idleFrame(kind, body, head, IDLE_FRAMES);
  for (let i = 0; i < frames[0].length; i++) {
    if (frames[0][i] !== again[i]) {
      issues.push("boucle");
      break;
    }
  }
  const base = applyVariant(body, head);
  for (let f = 0; f < IDLE_FRAMES; f++) {
    if (!sameFeet(base, frames[f])) issues.push("pieds " + f);
  }
  let moved = false;
  for (let i = 0; i < frames[0].length; i++) if (frames[0][i] !== frames[3][i]) moved = true;
  if (!moved) issues.push("immobile");
  const mark = kind === "Lecture" ? BOOK : kind === "Sac" ? SACK : GEM;
  if (countColor(frames[0], mark) < 1) issues.push("accessoire");
  const glow = countColor(frames[0], GLOW_LO) + countColor(frames[3], GLOW_HI);
  if (glow < 1) issues.push("lueur");
  if (countColor(frames[0], HAIR) + countColor(frames[0], HAIR_HI) < 4) issues.push("frange");
  const hair0 = countColor(frames[0], HAIR);
  let sway = false;
  for (let f = 1; f < IDLE_FRAMES; f++) if (countColor(frames[f], HAIR) > hair0) sway = true;
  if (!sway) issues.push("mèche");
  return issues;
}
