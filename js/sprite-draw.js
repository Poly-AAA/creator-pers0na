/**
 * Rendu pixel 192×192. Un seul cran de pixel, lumière unique (nord-ouest),
 * contour commun, ombre au sol séparée. Les pièces sont en niveaux de gris
 * puis teintées par zone.
 */
import {
  FRAME, ANCHOR, JOINTS, DIRS,
  samplePose, sculptPose, toWorld, toScreen, projectPose, footMid,
  clothPoints, clipInfo, speciesOf,
  sampleMount,
} from "./sprite-rig.js";

export { FRAME, ANCHOR, DIRS };

const LIGHT = norm({ east: -0.5, up: 0.82, south: -0.42 });
const CAM_ISO = norm({ east: -0.72, up: 0.38, south: -0.68 });
const CAM_FRONT = { east: 0, up: 0, south: -1 };
const OUTLINE = [20, 22, 26, 255];

export const HAIR = ["bald", "crop", "short", "tied", "long"];
export const FACES = ["calm", "stern", "soft"];
export const UNDER = ["none", "shirt", "wraps", "mesh"];
export const MID = ["none", "chain", "gambeson", "padded"];
export const ARMOR = ["none", "plate", "vest", "future"];
export const OUTER = ["none", "jacket", "coat", "cape", "harness", "scarf"];
export const HEADS = ["none", "helmet", "glasses", "mask"];
export const HANDS = ["none", "gloves", "gauntlets", "wraps"];
export const FEET = ["none", "boots", "shoes", "future"];
export const BELTS = ["none", "belt", "pouches", "harness"];
export const WEAPONS = ["none", "sword", "dagger", "bow", "staff", "pistol", "rifle", "future"];

const MAT = {
  skin: 1, hair: 2, eye: 3, mouth: 4, underwear: 5, cloth: 6, metal: 7,
  leather: 8, accent: 9, bone: 10, ghost: 11, wood: 12, shadow: 13, fx: 14,
};

export function defaultColors() {
  return {
    skin: [214, 164, 130],
    hair: [64, 42, 32],
    eye: [42, 78, 92],
    mouth: [158, 92, 86],
    underwear: [186, 176, 166],
    cloth: [58, 62, 72],
    metal: [168, 172, 178],
    leather: [92, 64, 46],
    accent: [234, 112, 32],
    bone: [214, 206, 190],
    ghost: [186, 198, 206],
    wood: [112, 78, 48],
    fx: [234, 112, 32],
  };
}

function norm(v) {
  const l = Math.hypot(v.east || 0, v.up || 0, v.south || 0) || 1;
  return { east: (v.east || 0) / l, up: (v.up || 0) / l, south: (v.south || 0) / l };
}
function dot(a, b) { return a.east * b.east + a.up * b.up + a.south * b.south; }
function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function mul(a, s) { return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function vnorm(v) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}
function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function lerp3(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

function shadeOf(worldN, colors, key) {
  const light = clamp01(dot(worldN, LIGHT));
  const band = light < 0.28 ? 0.42 : light < 0.5 ? 0.62 : light < 0.74 ? 0.84 : 1.02;
  const base = colors[key] || colors.cloth;
  return [
    clamp255(base[0] * band),
    clamp255(base[1] * band),
    clamp255(base[2] * band),
    255,
  ];
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function clamp255(v) { return Math.max(0, Math.min(255, v | 0)); }

function emptyBuffers() {
  const n = FRAME * FRAME;
  return {
    rgba: new Uint8Array(n * 4),
    z: new Float32Array(n),
    mat: new Uint8Array(n),
    layer: new Uint8Array(n),
    clipped: 0,
  };
}

function writePx(buf, x, y, depth, rgba, mat, layer) {
  if (x < 0 || y < 0 || x >= FRAME || y >= FRAME) {
    buf.clipped++;
    return;
  }
  const i = y * FRAME + x;
  const score = depth + layer * 0.04;
  if (buf.mat[i] && score < buf.z[i]) return;
  buf.z[i] = score;
  buf.mat[i] = mat;
  buf.layer[i] = layer;
  const o = i * 4;
  buf.rgba[o] = rgba[0];
  buf.rgba[o + 1] = rgba[1];
  buf.rgba[o + 2] = rgba[2];
  buf.rgba[o + 3] = rgba[3];
}

function edge(ax, ay, bx, by, px, py) {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function rasterTri(buf, a, b, c, rgba, mat, layer) {
  const minx = Math.floor(Math.min(a.x, b.x, c.x));
  const maxx = Math.ceil(Math.max(a.x, b.x, c.x));
  const miny = Math.floor(Math.min(a.y, b.y, c.y));
  const maxy = Math.ceil(Math.max(a.y, b.y, c.y));
  const area = edge(a.x, a.y, b.x, b.y, c.x, c.y);
  if (area > -0.08 && area < 0.08) return;
  for (let y = miny; y <= maxy; y++) {
    for (let x = minx; x <= maxx; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const w0 = edge(b.x, b.y, c.x, c.y, px, py);
      const w1 = edge(c.x, c.y, a.x, a.y, px, py);
      const w2 = edge(a.x, a.y, b.x, b.y, px, py);
      if (area > 0) {
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      } else if (w0 > 0 || w1 > 0 || w2 > 0) continue;
      const depth = (a.depth * w0 + b.depth * w1 + c.depth * w2) / area;
      writePx(buf, x, y, depth, rgba, mat, layer);
    }
  }
}

function project(p, dir) {
  return toScreen(p, dir);
}

function drawBox(buf, corners, normal, dir, colors, matKey, matId, layer) {
  const cam = dir === "front" ? CAM_FRONT : CAM_ISO;
  const wn = toWorld(normal, dir);
  const wnN = norm(wn);
  if (dot(wnN, cam) <= 0.02) return;
  const rgba = shadeOf(wnN, colors, matKey);
  const s = corners.map((p) => project(p, dir));
  rasterTri(buf, s[0], s[1], s[2], rgba, matId, layer);
  rasterTri(buf, s[0], s[2], s[3], rgba, matId, layer);
}

function boneCorners(a, b, rx, ry) {
  const axis = vnorm(sub(b, a));
  let up = { x: 0, y: 1, z: 0 };
  if (Math.abs(axis.y) > 0.82) up = { x: 0, y: 0, z: 1 };
  const side = vnorm(cross(axis, up));
  const lift = vnorm(cross(side, axis));
  const mid = lerp3(a, b, 0.5);
  const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) * 0.5;
  const corner = (s, t, u) => add(add(add(mid, mul(axis, s * len)), mul(side, t * rx)), mul(lift, u * ry));
  return { side, lift, axis, corner };
}

function addBone(buf, a, b, rx, ry, dir, colors, matKey, matId, layer) {
  if (!a || !b) return;
  const axis0 = vnorm(sub(b, a));
  const a2 = add(a, mul(axis0, -0.9));
  const b2 = add(b, mul(axis0, 0.9));
  const { side, lift, axis, corner } = boneCorners(a2, b2, rx + 0.35, ry + 0.35);
  const face = (s, normal) => {
    const c = s > 0
      ? [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)]
      : [corner(-1, -1, -1), corner(-1, -1, 1), corner(-1, 1, 1), corner(-1, 1, -1)];
    drawBox(buf, c, normal, dir, colors, matKey, matId, layer);
  };
  face(1, axis);
  face(-1, mul(axis, -1));
  drawBox(buf, [corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)], side, dir, colors, matKey, matId, layer);
  drawBox(buf, [corner(-1, -1, 1), corner(1, -1, 1), corner(1, -1, -1), corner(-1, -1, -1)], mul(side, -1), dir, colors, matKey, matId, layer);
  drawBox(buf, [corner(-1, -1, 1), corner(-1, 1, 1), corner(1, 1, 1), corner(1, -1, 1)], lift, dir, colors, matKey, matId, layer);
  drawBox(buf, [corner(-1, 1, -1), corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1)], mul(lift, -1), dir, colors, matKey, matId, layer);
}

function drawShadow(buf) {
  const rgba = [16, 18, 20, 96];
  for (let y = -8; y <= 8; y++) {
    for (let x = -20; x <= 20; x++) {
      const e = (x * x) / (20 * 20) + (y * y) / (8 * 8);
      if (e > 1) continue;
      const a = (1 - e) * 90;
      writePx(buf, (ANCHOR + x) | 0, (ANCHOR + y) | 0, -40, [rgba[0], rgba[1], rgba[2], a | 0], MAT.shadow, 0);
    }
  }
}

function radii(species) {
  const slim = species === "sylphe" ? 0.86 : species === "skeleton" || species === "specter" ? 0.55 : 1;
  const hip = species === "female" ? 1.12 : 1;
  return {
    head: [6.1 * (species === "sylphe" ? 0.92 : 1), 7.1],
    neck: 2.3 * slim,
    chest: [6.4 * slim, 4.6],
    abdomen: [5.2 * slim, 4.1],
    pelvis: [5.4 * slim * hip, 4.2],
    thigh: 3.5 * slim * (species === "female" ? 1.05 : 1),
    shin: 2.7 * slim,
    foot: [2.3, 1.7],
    arm: 2.5 * slim,
    forearm: 2.05 * slim,
    hand: [1.8, 2.2],
  };
}

function skinKey(species) {
  if (species === "skeleton") return "bone";
  if (species === "specter") return "ghost";
  return "skin";
}

function drawBody(buf, pose, species, dir, colors) {
  const r = radii(species);
  const mat = skinKey(species);
  const id = species === "skeleton" ? MAT.bone : species === "specter" ? MAT.ghost : MAT.skin;
  const layer = 1;
  addBone(buf, pose.hips, pose.chest, r.abdomen, r.abdomen * 0.86, dir, colors, mat, id, layer);
  addBone(buf, pose.chest, pose.neck, r.chest, r.chest * 0.78, dir, colors, mat, id, layer);
  addBone(buf, pose.neck, pose.head, r.neck, r.neck, dir, colors, mat, id, layer);
  addBone(buf, pose.head, { x: pose.head.x, y: pose.head.y + r.head[1] * 0.15, z: pose.head.z }, r.head[0], r.head[1] * 0.72, dir, colors, mat, id, layer);
  addBone(buf, pose.hipL, pose.kneeL, r.thigh, r.thigh * 0.92, dir, colors, mat, id, layer);
  addBone(buf, pose.hipR, pose.kneeR, r.thigh, r.thigh * 0.92, dir, colors, mat, id, layer);
  addBone(buf, pose.kneeL, pose.footL, r.shin, r.shin, dir, colors, mat, id, layer);
  addBone(buf, pose.kneeR, pose.footR, r.shin, r.shin, dir, colors, mat, id, layer);
  addBone(buf, pose.footL, { x: pose.footL.x, y: pose.footL.y + 1.2, z: pose.footL.z + 4.2 }, r.foot[0], r.foot[1], dir, colors, mat, id, layer);
  addBone(buf, pose.footR, { x: pose.footR.x, y: pose.footR.y + 1.2, z: pose.footR.z + 4.2 }, r.foot[0], r.foot[1], dir, colors, mat, id, layer);
  addBone(buf, pose.chest, pose.shoulderL, r.arm + 0.4, r.arm, dir, colors, mat, id, layer);
  addBone(buf, pose.chest, pose.shoulderR, r.arm + 0.4, r.arm, dir, colors, mat, id, layer);
  addBone(buf, pose.shoulderL, pose.elbowL, r.arm, r.arm, dir, colors, mat, id, layer);
  addBone(buf, pose.shoulderR, pose.elbowR, r.arm, r.arm, dir, colors, mat, id, layer);
  addBone(buf, pose.elbowL, pose.handL, r.forearm, r.forearm, dir, colors, mat, id, layer);
  addBone(buf, pose.elbowR, pose.handR, r.forearm, r.forearm, dir, colors, mat, id, layer);
  addBone(buf, pose.handL, { x: pose.handL.x, y: pose.handL.y - 1.2, z: pose.handL.z + 1.6 }, r.hand[0], r.hand[1], dir, colors, mat, id, layer);
  addBone(buf, pose.handR, { x: pose.handR.x, y: pose.handR.y - 1.2, z: pose.handR.z + 1.6 }, r.hand[0], r.hand[1], dir, colors, mat, id, layer);
  if (species === "skeleton") {
    addBone(buf, pose.chest, { x: pose.chest.x, y: pose.chest.y - 3, z: pose.chest.z + 1.2 }, 5.2, 0.7, dir, colors, "bone", MAT.bone, layer);
    addBone(buf, pose.back, { x: pose.back.x, y: pose.back.y - 4, z: pose.back.z + 0.4 }, 4.4, 0.6, dir, colors, "bone", MAT.bone, layer);
  }
}

function drawUnderwear(buf, pose, species, dir, colors) {
  const hip = species === "female" ? 4.6 : 4.3;
  addBone(buf, pose.hips, { x: pose.hips.x, y: pose.hips.y - 3.2, z: pose.hips.z }, hip, hip * 0.82, dir, colors, "underwear", MAT.underwear, 2);
  if (species === "female") {
    addBone(buf, pose.chest, { x: pose.chest.x, y: pose.chest.y + 0.4, z: pose.chest.z + 1.4 }, 5.4, 2.4, dir, colors, "underwear", MAT.underwear, 2);
  } else if (species !== "skeleton" && species !== "specter") {
    addBone(buf, pose.hips, { x: pose.hips.x, y: pose.hips.y - 1.2, z: pose.hips.z + 0.4 }, 4.8, 3.2, dir, colors, "underwear", MAT.underwear, 2);
  }
}

function drawEquip(buf, pose, spec, dir, colors, frame) {
  const eq = spec.equip || {};
  const species = speciesOf(spec.species);
  if (eq.under && eq.under !== "none") {
    const bulk = eq.under === "mesh" ? 0.7 : eq.under === "wraps" ? 0.9 : 1;
    addBone(buf, pose.chest, pose.hips, 5.6 * bulk, 4.4, dir, colors, "cloth", MAT.cloth, 2);
    if (eq.under === "wraps") {
      addBone(buf, pose.elbowL, pose.handL, 2.3, 2.1, dir, colors, "cloth", MAT.cloth, 2);
      addBone(buf, pose.elbowR, pose.handR, 2.3, 2.1, dir, colors, "cloth", MAT.cloth, 2);
    }
  }
  if (eq.mid && eq.mid !== "none") {
    const key = eq.mid === "chain" ? "metal" : "cloth";
    const id = eq.mid === "chain" ? MAT.metal : MAT.cloth;
    addBone(buf, pose.chest, pose.hips, eq.mid === "gambeson" ? 6.6 : 6.1, 4.8, dir, colors, key, id, 3);
  }
  if (eq.armor && eq.armor !== "none") {
    const key = eq.armor === "vest" ? "cloth" : "metal";
    const id = eq.armor === "vest" ? MAT.cloth : MAT.metal;
    const rx = eq.armor === "future" ? 7.2 : eq.armor === "plate" ? 6.8 : 6.4;
    addBone(buf, pose.chest, { x: pose.hips.x, y: pose.hips.y + 6, z: pose.hips.z }, rx, rx * 0.72, dir, colors, key, id, 4);
    if (eq.armor === "plate" || eq.armor === "future") {
      addBone(buf, pose.shoulderL, { x: pose.shoulderL.x, y: pose.shoulderL.y + 1, z: pose.shoulderL.z }, 3.4, 2.2, dir, colors, "metal", MAT.metal, 4);
      addBone(buf, pose.shoulderR, { x: pose.shoulderR.x, y: pose.shoulderR.y + 1, z: pose.shoulderR.z }, 3.4, 2.2, dir, colors, "metal", MAT.metal, 4);
    }
  }
  if (eq.outer && eq.outer !== "none") drawOuter(buf, pose, eq.outer, dir, colors, frame, spec);
  if (eq.head && eq.head !== "none") {
    if (eq.head === "helmet") {
      addBone(buf, pose.head, { x: pose.head.x, y: pose.head.y + 1.5, z: pose.head.z }, 6.8, 6.2, dir, colors, "metal", MAT.metal, 6);
    } else if (eq.head === "mask") {
      addBone(buf, pose.head, { x: pose.head.x, y: pose.head.y - 1, z: pose.head.z + 3.2 }, 4.2, 2.4, dir, colors, "cloth", MAT.cloth, 6);
    } else if (eq.head === "glasses") {
      addBone(buf, pose.head, { x: pose.head.x, y: pose.head.y + 1.2, z: pose.head.z + 4.4 }, 4.6, 0.7, dir, colors, "metal", MAT.metal, 6);
    }
  }
  if (eq.hands && eq.hands !== "none") {
    const key = eq.hands === "gauntlets" ? "metal" : "leather";
    const id = eq.hands === "gauntlets" ? MAT.metal : MAT.leather;
    const rad = eq.hands === "wraps" ? 2.1 : 2.5;
    addBone(buf, pose.handL, { x: pose.handL.x, y: pose.handL.y - 0.4, z: pose.handL.z + 1.2 }, rad, rad, dir, colors, key, id, 6);
    addBone(buf, pose.handR, { x: pose.handR.x, y: pose.handR.y - 0.4, z: pose.handR.z + 1.2 }, rad, rad, dir, colors, key, id, 6);
  }
  if (eq.feet && eq.feet !== "none") {
    const key = eq.feet === "shoes" ? "leather" : "cloth";
    const id = eq.feet === "shoes" ? MAT.leather : MAT.cloth;
    addBone(buf, pose.footL, { x: pose.footL.x, y: pose.footL.y + 2.4, z: pose.footL.z + 3.6 }, 2.8, 2.2, dir, colors, key, id, 6);
    addBone(buf, pose.footR, { x: pose.footR.x, y: pose.footR.y + 2.4, z: pose.footR.z + 3.6 }, 2.8, 2.2, dir, colors, key, id, 6);
    if (eq.feet === "boots" || eq.feet === "future") {
      addBone(buf, pose.kneeL, pose.footL, 3.1, 2.8, dir, colors, key, id, 6);
      addBone(buf, pose.kneeR, pose.footR, 3.1, 2.8, dir, colors, key, id, 6);
    }
  }
  if (eq.belt && eq.belt !== "none") {
    addBone(buf, pose.hips, { x: pose.hips.x, y: pose.hips.y + 1.6, z: pose.hips.z }, 6.2, 1.5, dir, colors, "leather", MAT.leather, 6);
    if (eq.belt === "pouches" || eq.belt === "harness") {
      const bag = { x: pose.hipR.x + 2, y: pose.hips.y - 2, z: pose.hips.z + 1 };
      const pts = clothPoints(bag, frame, 10, 2, spec.wind | 0);
      for (let i = 0; i < pts.length - 1; i++) addBone(buf, pts[i], pts[i + 1], 1.8, 1.6, dir, colors, "leather", MAT.leather, 5);
    }
  }
  if (species === "female" || species === "male") {
    /* sous-couche déjà dessinée par drawUnderwear */
  }
}

function drawOuter(buf, pose, kind, dir, colors, frame, spec) {
  const wind = spec.wind | 0;
  if (kind === "jacket" || kind === "coat" || kind === "harness") {
    addBone(buf, pose.shoulderL, pose.chest, 3.2, 2.6, dir, colors, "cloth", MAT.cloth, 5);
    addBone(buf, pose.shoulderR, pose.chest, 3.2, 2.6, dir, colors, "cloth", MAT.cloth, 5);
    addBone(buf, pose.chest, pose.hips, kind === "coat" ? 7.2 : 6.6, 4.6, dir, colors, "cloth", MAT.cloth, 5);
  }
  if (kind === "coat" || kind === "cape") {
    const n = kind === "cape" ? 6 : 5;
    const pts = clothPoints({ x: pose.back.x, y: pose.shoulderL.y, z: pose.back.z }, frame, 10, n, wind);
    for (let i = 0; i < pts.length - 1; i++) {
      addBone(buf, pts[i], pts[i + 1], kind === "cape" ? 5.5 : 4.2, 1.3, dir, colors, "cloth", MAT.cloth, 5);
    }
  }
  if (kind === "jacket") {
    addBone(buf, pose.shoulderL, pose.elbowL, 2.8, 2.6, dir, colors, "cloth", MAT.cloth, 5);
    addBone(buf, pose.shoulderR, pose.elbowR, 2.8, 2.6, dir, colors, "cloth", MAT.cloth, 5);
  }
}

function drawHair(buf, pose, spec, dir, colors, frame) {
  const style = spec.hair || "short";
  if (style === "bald") return;
  const head = pose.head;
  if (style === "crop" || style === "short" || style === "tied" || style === "long") {
    addBone(buf, head, { x: head.x, y: head.y + 3.4, z: head.z - 0.4 }, style === "crop" ? 6.2 : 6.6, 3.2, dir, colors, "hair", MAT.hair, 6);
  }
  if (style === "short" || style === "tied") {
    addBone(buf, head, { x: head.x, y: head.y - 1, z: head.z - 2.4 }, 5.4, 3.4, dir, colors, "hair", MAT.hair, 6);
  }
  if (style === "tied" || style === "long") {
    const anchor = { x: head.x, y: head.y - 1, z: head.z - 2 };
    const count = style === "long" ? 7 : 4;
    const pts = clothPoints(anchor, frame, 10, count, spec.wind | 0);
    for (let i = 0; i < pts.length - 1; i++) addBone(buf, pts[i], pts[i + 1], style === "long" ? 2.4 : 1.8, 1.6, dir, colors, "hair", MAT.hair, 6);
  }
  if (spec.equip && spec.equip.outer === "scarf") {
    const pts = clothPoints({ x: pose.neck.x, y: pose.neck.y, z: pose.neck.z }, frame, 10, 4, spec.wind | 0);
    for (let i = 0; i < pts.length - 1; i++) addBone(buf, pts[i], pts[i + 1], 1.6, 1.4, dir, colors, "accent", MAT.accent, 5);
  }
}

function drawFace(buf, pose, spec, dir, colors) {
  if (spec.species === "skeleton") {
    stamp(buf, pose.head, { x: 0, y: 1.2, z: 5.2 }, dir, [16, 18, 20, 255], MAT.eye, 7, 2);
    stamp(buf, pose.head, { x: -2.2, y: 1.4, z: 5.4 }, dir, [16, 18, 20, 255], MAT.eye, 7, 1);
    stamp(buf, pose.head, { x: 2.2, y: 1.4, z: 5.4 }, dir, [16, 18, 20, 255], MAT.eye, 7, 1);
    return;
  }
  const face = spec.face || "calm";
  const eye = colors.eye || [40, 70, 90];
  const white = [236, 232, 226, 255];
  const brow = [40, 32, 28, 255];
  stamp(buf, pose.head, { x: -2.15, y: 1.5, z: 5.5 }, dir, [eye[0], eye[1], eye[2], 255], MAT.eye, 7, 1);
  stamp(buf, pose.head, { x: 2.15, y: 1.5, z: 5.5 }, dir, [eye[0], eye[1], eye[2], 255], MAT.eye, 7, 1);
  stamp(buf, pose.head, { x: -2.5, y: 2.1, z: 5.7 }, dir, white, MAT.eye, 7, 0);
  stamp(buf, pose.head, { x: 1.8, y: 2.1, z: 5.7 }, dir, white, MAT.eye, 7, 0);
  const browY = face === "stern" ? 3.1 : face === "soft" ? 2.5 : 2.8;
  stamp(buf, pose.head, { x: -2.2, y: browY, z: 5.6 }, dir, brow, MAT.hair, 7, 1);
  stamp(buf, pose.head, { x: 2.2, y: browY, z: 5.6 }, dir, brow, MAT.hair, 7, 1);
  const mouth = colors.mouth || [150, 90, 80];
  const my = face === "soft" ? -1.2 : -1.8;
  stamp(buf, pose.head, { x: 0, y: my, z: 5.5 }, dir, [mouth[0], mouth[1], mouth[2], 255], MAT.mouth, 7, 1);
}

function stamp(buf, joint, local, dir, rgba, mat, layer, rad) {
  const p = { x: joint.x + local.x, y: joint.y + local.y, z: joint.z + local.z };
  const s = project(p, dir);
  const x0 = Math.round(s.x);
  const y0 = Math.round(s.y);
  for (let y = -rad; y <= rad; y++) {
    for (let x = -rad; x <= rad; x++) {
      if (x * x + y * y > (rad + 0.2) * (rad + 0.2)) continue;
      writePx(buf, x0 + x, y0 + y, s.depth + 0.2, rgba, mat, layer);
    }
  }
}

function drawWeapon(buf, pose, weapon, dir, colors) {
  if (!weapon || weapon === "none") return;
  const h = pose.handR;
  const reach = {
    sword: 16, dagger: 8, bow: 14, staff: 18, pistol: 7, rifle: 16, future: 15,
  }[weapon] || 10;
  const tip = { x: h.x - 1.2, y: h.y + (weapon === "staff" ? reach * 0.55 : 2), z: h.z + reach };
  const key = weapon === "bow" || weapon === "staff" ? "wood" : "metal";
  const id = key === "wood" ? MAT.wood : MAT.metal;
  const thick = weapon === "dagger" || weapon === "pistol" ? 1.15 : weapon === "staff" || weapon === "bow" ? 1.35 : 1.25;
  const back = vnorm(sub(h, tip));
  const grip = add(h, mul(back, 2.8));
  addBone(buf, grip, tip, thick, thick * 0.75, dir, colors, key, id, 7);
  if (weapon === "sword" || weapon === "dagger") {
    addBone(buf, h, { x: h.x + 2.2, y: h.y, z: h.z }, 2.2, 0.6, dir, colors, "leather", MAT.leather, 7);
  }
  if (weapon === "bow") {
    addBone(buf, { x: h.x, y: h.y + 8, z: h.z + 2 }, { x: h.x, y: h.y - 8, z: h.z + 2 }, 0.7, 0.7, dir, colors, "wood", MAT.wood, 7);
  }
  if (weapon === "rifle" || weapon === "future") {
    addBone(buf, pose.handL, { x: pose.handL.x, y: pose.handL.y, z: pose.handL.z + 6 }, 1.1, 0.9, dir, colors, key, id, 7);
  }
}

function drawFx(buf, pose, fx, dir) {
  const list = Array.isArray(fx) ? fx : [];
  for (const item of list) {
    const joint = item.hand === "L" ? pose.handL : pose.handR;
    const pal = item.kind === "ice" ? [170, 214, 228] : item.kind === "lightning" ? [236, 230, 150] : item.kind === "shock" ? [210, 210, 216] : [234, 112, 32];
    const len = item.kind === "fireball" || item.kind === "shock" ? 10 : 4;
    const tip = { x: joint.x, y: joint.y, z: joint.z + len };
    addBone(buf, joint, tip, item.kind === "fireball" ? 2.4 : 1.6, 1.6, dir, { fx: pal, cloth: pal, metal: pal }, "fx", MAT.fx, 8);
  }
}

function drawMount(buf, anim, frame, dir, colors) {
  const m = sampleMount(anim, frame);
  const hide = "leather";
  addBone(buf, m.hoofBL, m.hips, 2.2, 2, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.hoofBR, m.hips, 2.2, 2, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.hips, m.chest, 4.2, 3.4, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.chest, m.neck, 2.4, 2.2, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.neck, m.head, 1.8, 1.6, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.head, { x: m.head.x, y: m.head.y - 1, z: m.head.z + 4 }, 1.6, 1.4, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.chest, m.hoofFL, 2.1, 1.9, dir, colors, hide, MAT.leather, 1);
  addBone(buf, m.chest, m.hoofFR, 2.1, 1.9, dir, colors, hide, MAT.leather, 1);
  const pts = clothPoints(m.tail, frame, 10, 4, 1);
  for (let i = 0; i < pts.length - 1; i++) addBone(buf, pts[i], pts[i + 1], 1.2, 1, dir, colors, "hair", MAT.hair, 5);
  return m;
}

function sealCracks(buf) {
  const mat = buf.mat;
  const n = FRAME * FRAME;
  const empty = (i) => !mat[i] || mat[i] === MAT.shadow;
  const outside = new Uint8Array(n);
  const stack = [];
  for (let i = 0; i < n; i++) {
    const x = i % FRAME;
    const y = (i / FRAME) | 0;
    if ((x === 0 || y === 0 || x === FRAME - 1 || y === FRAME - 1) && empty(i)) stack.push(i);
  }
  while (stack.length) {
    const i = stack.pop();
    if (outside[i] || !empty(i)) continue;
    outside[i] = 1;
    if (i % FRAME > 0) stack.push(i - 1);
    if (i % FRAME < FRAME - 1) stack.push(i + 1);
    if (i >= FRAME) stack.push(i - FRAME);
    if (i < n - FRAME) stack.push(i + FRAME);
  }
  const seen = outside.slice();
  for (let i = 0; i < n; i++) {
    if (!empty(i) || seen[i]) continue;
    const comp = [];
    const q = [i];
    seen[i] = 1;
    while (q.length) {
      const j = q.pop();
      comp.push(j);
      const x = j % FRAME;
      if (x > 0 && empty(j - 1) && !seen[j - 1]) { seen[j - 1] = 1; q.push(j - 1); }
      if (x < FRAME - 1 && empty(j + 1) && !seen[j + 1]) { seen[j + 1] = 1; q.push(j + 1); }
      if (j >= FRAME && empty(j - FRAME) && !seen[j - FRAME]) { seen[j - FRAME] = 1; q.push(j - FRAME); }
      if (j < n - FRAME && empty(j + FRAME) && !seen[j + FRAME]) { seen[j + FRAME] = 1; q.push(j + FRAME); }
    }
    let left = comp;
    for (let pass = 0; pass < 24 && left.length; pass++) {
      const next = [];
      for (const j of left) {
        const x = j % FRAME;
        const y = (j / FRAME) | 0;
        let filled = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= FRAME || ny >= FRAME) continue;
          const k = ny * FRAME + nx;
          if (!mat[k] || mat[k] === MAT.shadow) continue;
          const o = j * 4;
          const s = k * 4;
          buf.rgba[o] = buf.rgba[s];
          buf.rgba[o + 1] = buf.rgba[s + 1];
          buf.rgba[o + 2] = buf.rgba[s + 2];
          buf.rgba[o + 3] = 255;
          buf.mat[j] = mat[k];
          buf.layer[j] = buf.layer[k];
          filled = true;
          break;
        }
        if (!filled) next.push(j);
      }
      left = next;
    }
  }
}

function outline(buf) {
  const src = buf.rgba;
  const mat = buf.mat;
  const next = src.slice();
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      const i = y * FRAME + x;
      if (!mat[i] || mat[i] === MAT.shadow) continue;
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= FRAME || ny >= FRAME) { edge = true; break; }
        const j = ny * FRAME + nx;
        if (!mat[j] || mat[j] === MAT.shadow) { edge = true; break; }
      }
      if (!edge) continue;
      const o = i * 4;
      next[o] = OUTLINE[0];
      next[o + 1] = OUTLINE[1];
      next[o + 2] = OUTLINE[2];
      next[o + 3] = 255;
    }
  }
  buf.rgba.set(next);
}

export function renderActor(spec) {
  const dir = spec.dir || "SE";
  const species = speciesOf(spec.species);
  const anim = spec.anim || "idle";
  const frame = spec.frame | 0;
  const colors = Object.assign(defaultColors(), spec.colors || {});
  if (spec.fxColor) colors.fx = spec.fxColor;
  const buf = emptyBuffers();
  drawShadow(buf);
  let pose;
  let mount = null;
  if (spec.mount) {
    mount = drawMount(buf, spec.mount === true ? "mountIdle" : spec.mount, frame, dir, colors);
    pose = sculptPose(samplePose(spec.mount === true ? "mountIdle" : spec.mount, frame, 0), species);
  } else {
    const raw = spec.pose || samplePose(anim, frame, spec.variant || 0);
    pose = sculptPose(raw, species);
    if (spec.transition) {
      const prev = sculptPose(samplePose(spec.transition.fromAnim, spec.transition.fromFrame, spec.variant || 0), species);
      const u = spec.transition.u;
      for (const k of JOINTS) {
        pose[k] = lerp3(prev[k], pose[k], u * u * (3 - 2 * u));
      }
    }
  }
  drawBody(buf, pose, species, dir, colors);
  if (species === "male" || species === "female") drawUnderwear(buf, pose, species, dir, colors);
  drawEquip(buf, pose, spec, dir, colors, frame);
  drawHair(buf, pose, spec, dir, colors, frame);
  if (!spec.equip || spec.equip.head !== "helmet") drawFace(buf, pose, spec, dir, colors);
  drawWeapon(buf, pose, spec.weapon, dir, colors);
  drawFx(buf, pose, spec.fx, dir);
  sealCracks(buf);
  outline(buf);
  const joints = projectPose(pose, dir);
  return { rgba: buf.rgba, mat: buf.mat, layer: buf.layer, clipped: buf.clipped, joints, pose, mount, w: FRAME, h: FRAME };
}

export function countHoles(mat) {
  const n = FRAME * FRAME;
  const seen = new Uint8Array(n);
  const stack = [];
  const empty = (i) => !mat[i] || mat[i] === MAT.shadow;
  for (let i = 0; i < n; i++) {
    const x = i % FRAME;
    const y = (i / FRAME) | 0;
    if ((x === 0 || y === 0 || x === FRAME - 1 || y === FRAME - 1) && empty(i)) stack.push(i);
  }
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !empty(i)) continue;
    seen[i] = 1;
    const x = i % FRAME;
    const y = (i / FRAME) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < FRAME - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - FRAME);
    if (y < FRAME - 1) stack.push(i + FRAME);
  }
  let holes = 0;
  for (let i = 0; i < n; i++) if (empty(i) && !seen[i]) holes++;
  return holes;
}

export function opaqueCount(mat) {
  let n = 0;
  for (let i = 0; i < mat.length; i++) if (mat[i] && mat[i] !== MAT.shadow) n++;
  return n;
}

function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

export function hashFrame(rgba) {
  return crc32(rgba).toString(16).padStart(8, "0");
}

export function blit(dst, src, dw, dx, dy, sw, sh) {
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const si = (y * sw + x) * 4;
      const di = ((dy + y) * dw + (dx + x)) * 4;
      dst[di] = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = src[si + 3];
    }
  }
}

export function sheet(renders, cols) {
  const rows = Math.ceil(renders.length / cols);
  const w = cols * FRAME;
  const h = rows * FRAME;
  const rgba = new Uint8Array(w * h * 4);
  renders.forEach((r, i) => {
    const c = i % cols;
    const y = (i / cols) | 0;
    blit(rgba, r.rgba, w, c * FRAME, y * FRAME, FRAME, FRAME);
  });
  return { rgba, w, h };
}

export function nearJoint(mat, joints, name, matId) {
  const p = joints[name];
  if (!p) return 99;
  let best = 99;
  const x0 = Math.round(p.x);
  const y0 = Math.round(p.y);
  for (let y = Math.max(0, y0 - 18); y <= Math.min(FRAME - 1, y0 + 18); y++) {
    for (let x = Math.max(0, x0 - 18); x <= Math.min(FRAME - 1, x0 + 18); x++) {
      if (mat[y * FRAME + x] !== matId) continue;
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < best) best = d;
    }
  }
  return best;
}

export function sampleMat(mat, x, y) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= FRAME || iy >= FRAME) return 0;
  return mat[iy * FRAME + ix];
}

export { MAT, clipInfo };
