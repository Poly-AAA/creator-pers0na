/**
 * Squelette commun (mâle, femelle, sylphe, squelette, spectre).
 * Espace personnage : x à droite, y vers le haut, z vers l'avant.
 * L'ancre des pieds est l'origine ; le rendu la pose au centre du cadre.
 */
export const FRAME = 192;
export const ANCHOR = 96;
export const DIRS = ["SE", "SW", "NE", "NW", "front"];
export const JOINTS = [
  "hips", "back", "chest", "neck", "head",
  "shoulderL", "shoulderR", "elbowL", "elbowR", "handL", "handR",
  "hipL", "hipR", "kneeL", "kneeR", "footL", "footR",
];

export const FACING = {
  SE: { fe: 1, fs: 0, re: 0, rs: 1 },
  SW: { fe: 0, fs: 1, re: -1, rs: 0 },
  NE: { fe: 0, fs: -1, re: 1, rs: 0 },
  NW: { fe: -1, fs: 0, re: 0, rs: -1 },
};

const CLIPS = {
  idle: { frames: 10, fps: 16, loop: true, variants: 4 },
  walk: { frames: 8, fps: 16, loop: true },
  run: { frames: 8, fps: 17, loop: true },
  glide: { frames: 6, fps: 16, loop: true },
  hit: { frames: 4, fps: 15, loop: false },
  death: { frames: 12, fps: 14, loop: false },
  step: { frames: 6, fps: 16, loop: false, move: true },
  roll: { frames: 8, fps: 17, loop: false, move: true },
  leap: { frames: 8, fps: 16, loop: false, move: true },
  jabL: { frames: 8, fps: 17, loop: false, hand: "L", attack: "jab" },
  jabR: { frames: 8, fps: 17, loop: false, hand: "R", attack: "jab" },
  crossL: { frames: 8, fps: 16, loop: false, hand: "L", attack: "cross" },
  crossR: { frames: 8, fps: 16, loop: false, hand: "R", attack: "cross" },
  hookL: { frames: 8, fps: 15, loop: false, hand: "L", attack: "hook" },
  hookR: { frames: 8, fps: 15, loop: false, hand: "R", attack: "hook" },
  upperL: { frames: 8, fps: 15, loop: false, hand: "L", attack: "upper" },
  upperR: { frames: 8, fps: 15, loop: false, hand: "R", attack: "upper" },
  pushL: { frames: 8, fps: 14, loop: false, hand: "L", attack: "push" },
  pushR: { frames: 8, fps: 14, loop: false, hand: "R", attack: "push" },
  slam: { frames: 8, fps: 14, loop: false, hand: "B", attack: "slam" },
  guard: { frames: 8, fps: 15, loop: false, hand: "B", attack: "guard" },
  sword: { frames: 8, fps: 16, loop: false, family: "sword" },
  dagger: { frames: 8, fps: 17, loop: false, family: "dagger" },
  bow: { frames: 8, fps: 15, loop: false, family: "bow" },
  staff: { frames: 8, fps: 15, loop: false, family: "staff" },
  pistol: { frames: 8, fps: 16, loop: false, family: "pistol" },
  rifle: { frames: 8, fps: 15, loop: false, family: "rifle" },
  future: { frames: 8, fps: 16, loop: false, family: "future" },
  hold: { frames: 10, fps: 16, loop: true, family: "hold" },
  cast: { frames: 8, fps: 16, loop: false },
  mountIdle: { frames: 10, fps: 16, loop: true, mount: true },
  mountWalk: { frames: 8, fps: 16, loop: true, mount: true },
  mountRun: { frames: 6, fps: 17, loop: true, mount: true },
};

export function clipInfo(name) {
  const c = CLIPS[name];
  if (!c) throw new Error("clip inconnu: " + name);
  return c;
}

export function listClips() {
  return Object.keys(CLIPS);
}

export function bindPose() {
  return {
    hips: { x: 0, y: 42, z: 0 },
    back: { x: 0, y: 56, z: -1.2 },
    chest: { x: 0, y: 64, z: 1.1 },
    neck: { x: 0, y: 74, z: 0.2 },
    head: { x: 0, y: 81, z: 0.6 },
    shoulderL: { x: -12.5, y: 68, z: 0 },
    shoulderR: { x: 12.5, y: 68, z: 0 },
    elbowL: { x: -14, y: 54, z: 1 },
    elbowR: { x: 14, y: 54, z: 1 },
    handL: { x: -13.5, y: 42, z: 2 },
    handR: { x: 13.5, y: 42, z: 2 },
    hipL: { x: -5.2, y: 42, z: 0 },
    hipR: { x: 5.2, y: 42, z: 0 },
    kneeL: { x: -5.2, y: 22, z: 1.2 },
    kneeR: { x: 5.2, y: 22, z: 1.2 },
    footL: { x: -5.2, y: 0, z: 0 },
    footR: { x: 5.2, y: 0, z: 0 },
  };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}
function add3(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function smooth(u) { return u * u * (3 - 2 * u); }

function envOut(frame, frames) {
  if (frames <= 1) return 0;
  const u = frame / (frames - 1);
  return Math.sin(u * Math.PI);
}

function solveLimbs(pose) {
  for (const side of ["L", "R"]) {
    const sign = side === "L" ? -1 : 1;
    const s = pose["shoulder" + side];
    const h = pose["hand" + side];
    const midA = lerp3(s, h, 0.5);
    pose["elbow" + side] = { x: midA.x + sign * 2.4, y: midA.y - 1.6, z: midA.z - 0.8 };
    const hip = pose["hip" + side];
    const foot = pose["foot" + side];
    const midL = lerp3(hip, foot, 0.52);
    const lift = Math.max(0, foot.y);
    pose["knee" + side] = { x: midL.x, y: midL.y + 1.4, z: midL.z + 2.4 + lift * 0.35 };
  }
  return pose;
}

function applyBreath(pose, frame, frames, amp) {
  const t = (frame / frames) * Math.PI * 2;
  const b = Math.sin(t) * amp;
  pose.chest.y += b;
  pose.back.y += b * 0.7;
  pose.neck.y += b * 0.45;
  pose.head.y += b * 0.3;
  pose.shoulderL.y += b * 0.5;
  pose.shoulderR.y += b * 0.5;
  return pose;
}

function idlePose(frame, variant) {
  const pose = bindPose();
  const frames = 10;
  applyBreath(pose, frame, frames, 0.55);
  const t = (frame / frames) * Math.PI * 2;
  if (variant === 1) {
    const w = Math.sin(t) * 1.1;
    pose.hips.x += w;
    pose.chest.x += w * 0.6;
    pose.head.x += w * 0.3;
    pose.footL.z += 0.4;
    pose.shoulderL.y -= 0.8;
  } else if (variant === 2) {
    pose.handL.z += 3;
    pose.handR.z += 3;
    pose.handL.x += 2;
    pose.handR.x -= 2;
    pose.handL.y += 2;
    pose.handR.y += 2;
  } else if (variant === 3) {
    const turn = Math.sin(t) * 1.4;
    pose.head.x += turn;
    pose.head.z += 0.4;
    pose.neck.x += turn * 0.4;
  }
  return solveLimbs(pose);
}

function cyclePose(frame, frames, ampZ, ampY, lean, arm) {
  const pose = bindPose();
  const phase = (frame / frames) * Math.PI * 2;
  const swing = Math.sin(phase);
  pose.footL.z += swing * ampZ;
  pose.footR.z -= swing * ampZ;
  pose.footL.y += Math.max(0, swing) * ampY;
  pose.footR.y += Math.max(0, -swing) * ampY;
  pose.handR.z += swing * arm;
  pose.handL.z -= swing * arm;
  pose.handR.y += Math.max(0, -swing) * arm * 0.25;
  pose.handL.y += Math.max(0, swing) * arm * 0.25;
  pose.chest.z += lean;
  pose.head.z += lean * 0.5;
  pose.hips.y += Math.abs(swing) * 0.4;
  applyBreath(pose, frame, frames, 0.25);
  return solveLimbs(pose);
}

function hitPose(frame) {
  const pose = bindPose();
  const e = envOut(frame, 4);
  pose.chest.z -= 3.2 * e;
  pose.head.z -= 2.2 * e;
  pose.head.y -= 1.1 * e;
  pose.shoulderL.z -= 2 * e;
  pose.shoulderR.z -= 2 * e;
  pose.handL.z -= 1.5 * e;
  pose.handR.z += 1.2 * e;
  return solveLimbs(pose);
}

function deathPose(frame) {
  const pose = bindPose();
  const u = frame / 11;
  const drop = u * u;
  const sit = Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.5);
  pose.hips.y = lerp(42, 10, drop);
  pose.chest.y = lerp(64, 16, drop);
  pose.chest.z += 6 * sit;
  pose.back.y = lerp(56, 14, drop);
  pose.neck.y = lerp(74, 18, drop);
  pose.head.y = lerp(81, 14, drop);
  pose.head.z += 8 * sit;
  pose.shoulderL.y = lerp(68, 16, drop);
  pose.shoulderR.y = lerp(68, 16, drop);
  pose.handL.y = lerp(42, 6, drop);
  pose.handR.y = lerp(42, 6, drop);
  pose.handL.z += 4 * sit;
  pose.handR.z += 2 * sit;
  pose.hipL.y = lerp(42, 10, drop);
  pose.hipR.y = lerp(42, 10, drop);
  pose.kneeL.z += 6 * sit;
  pose.kneeR.z += 6 * sit;
  pose.kneeL.y = lerp(22, 6, sit);
  pose.kneeR.y = lerp(22, 6, sit);
  return solveLimbs(pose);
}

function movePose(kind, frame) {
  const pose = bindPose();
  if (kind === "step") {
    const frames = 6;
    const u = frame / (frames - 1);
    const e = Math.sin(u * Math.PI);
    pose.footR.z += 7 * e;
    pose.footR.y += 3.2 * e;
    pose.footL.z -= 1.2 * e;
    pose.hips.z += 1.4 * e;
    pose.chest.z += 1.6 * e;
    pose.handL.z -= 2 * e;
    pose.handR.z += 2 * e;
  } else if (kind === "roll") {
    const frames = 8;
    const u = frame / (frames - 1);
    const e = Math.sin(u * Math.PI);
    const tuck = e;
    pose.hips.y -= 10 * tuck;
    pose.chest.y -= 16 * tuck;
    pose.chest.z += 4 * tuck;
    pose.head.y -= 18 * tuck;
    pose.head.z += 6 * tuck;
    pose.shoulderL.y -= 12 * tuck;
    pose.shoulderR.y -= 12 * tuck;
    pose.handL.y -= 8 * tuck;
    pose.handR.y -= 8 * tuck;
    pose.handL.z += 6 * tuck;
    pose.handR.z += 4 * tuck;
    pose.kneeL.z += 5 * tuck;
    pose.kneeR.z += 5 * tuck;
    const spin = Math.sin(u * Math.PI * 2) * 3.2 * (u > 0 && u < 1 ? 1 : 0);
    pose.chest.x += spin;
    pose.head.x += spin * 0.6;
    pose.hips.z += 2 * e;
  } else if (kind === "leap") {
    const frames = 8;
    const u = frame / (frames - 1);
    const e = Math.sin(u * Math.PI);
    const hop = 8 * e;
    const tuck = 6 * e;
    for (const k of JOINTS) pose[k].y += hop;
    pose.chest.y -= tuck;
    pose.head.y -= tuck;
    pose.shoulderL.y -= tuck * 0.8;
    pose.shoulderR.y -= tuck * 0.8;
    pose.kneeL.z += 4 * e;
    pose.kneeR.z += 4 * e;
    pose.footL.y -= hop * 0.15;
    pose.footR.y -= hop * 0.15;
    pose.handL.y -= 2 * e;
    pose.handR.y -= 2 * e;
    pose.hips.z += 2 * e;
  }
  return solveLimbs(pose);
}

function punchPose(frame, frames, hand, kind) {
  const pose = bindPose();
  const e = envOut(frame, frames);
  const side = hand === "L" ? "L" : "R";
  const sign = side === "L" ? -1 : 1;
  const moveHand = (dz, dx, dy) => {
    if (hand === "B") {
      pose.handL.z += dz; pose.handR.z += dz;
      pose.handL.y += dy; pose.handR.y += dy;
      pose.handL.x += dx; pose.handR.x -= dx;
      return;
    }
    pose["hand" + side].z += dz;
    pose["hand" + side].x += dx;
    pose["hand" + side].y += dy;
  };
  if (kind === "jab") {
    moveHand(14 * e, sign * -1.2 * e, 1.5 * e);
    pose.chest.z += 1.6 * e;
  } else if (kind === "cross") {
    moveHand(12 * e, -sign * 7 * e, 2 * e);
    pose.chest.x += -sign * 2.4 * e;
    pose.chest.z += 1.4 * e;
    pose.hips.x += -sign * 1.2 * e;
  } else if (kind === "hook") {
    moveHand(6 * e, -sign * 9 * e, 3 * e);
    pose.chest.x += -sign * 2 * e;
  } else if (kind === "upper") {
    moveHand(5 * e, sign * 1 * e, 14 * e);
    pose.chest.z += 1 * e;
    pose.shoulderL.y += (side === "L" ? 2 : 0) * e;
    pose.shoulderR.y += (side === "R" ? 2 : 0) * e;
  } else if (kind === "push") {
    moveHand(18 * e, sign * 0.4 * e, 2 * e);
    pose.chest.z += 3.2 * e;
    pose.hips.z += 1.6 * e;
    pose.head.z += 1.2 * e;
  } else if (kind === "slam") {
    moveHand(8 * e, 2 * e, 8 * e);
    pose.chest.y -= 3 * e;
    pose.hips.y -= 1.5 * e;
  } else if (kind === "guard") {
    pose.handL.z += 4 * e;
    pose.handR.z += 4 * e;
    pose.handL.y += 6 * e;
    pose.handR.y += 6 * e;
    pose.handL.x += 3 * e;
    pose.handR.x -= 3 * e;
  }
  return solveLimbs(pose);
}

function weaponPose(frame, frames, family) {
  const pose = bindPose();
  const e = family === "hold" ? 0.35 + Math.sin((frame / frames) * Math.PI * 2) * 0.08 : envOut(frame, frames);
  const grip = (z, y, x) => {
    pose.handR.z += z;
    pose.handR.y += y;
    pose.handR.x += x;
  };
  if (family === "sword" || family === "hold") {
    grip(6 * (family === "hold" ? 0.4 : e) + 2, 4, -2);
    pose.handL.z += 2;
    pose.handL.x += 2;
    if (family === "sword") {
      pose.chest.x += -2 * e;
      pose.handR.x += -4 * e;
      pose.handR.z += 4 * e;
    }
  } else if (family === "dagger") {
    grip(10 * e + 2, 2, -1);
    pose.chest.z += 1.2 * e;
  } else if (family === "bow") {
    pose.handL.z += 8;
    pose.handL.y += 6;
    pose.handL.x += 2;
    pose.handR.z += 4 + 6 * e;
    pose.handR.y += 6;
    pose.handR.x -= 1;
    pose.chest.z += 0.6;
  } else if (family === "staff") {
    grip(3, 8 + 4 * e, -1);
    pose.handL.y += 4;
    pose.handL.z += 2;
    pose.handL.x += 3;
  } else if (family === "pistol" || family === "rifle" || family === "future") {
    const reach = family === "pistol" ? 10 : 12;
    grip(reach * (0.45 + 0.55 * e), 4, -1);
    pose.handL.z += family === "pistol" ? 3 : 8;
    pose.handL.y += 3;
    pose.handL.x += 2;
    if (family === "future") pose.handR.z -= 2 * e;
  }
  applyBreath(pose, frame, frames, 0.2);
  return solveLimbs(pose);
}

function castPose(frame) {
  const pose = bindPose();
  const e = envOut(frame, 8);
  pose.handR.y += 12 * e;
  pose.handR.z += 4 * e;
  pose.handL.y += 4 * e;
  pose.chest.z += 0.8 * e;
  pose.head.y += 0.6 * e;
  return solveLimbs(pose);
}

export function samplePose(anim, frame, variant) {
  const info = clipInfo(anim);
  const f = ((frame % info.frames) + info.frames) % info.frames;
  const v = variant | 0;
  if (anim === "idle") return idlePose(f, ((v % 4) + 4) % 4);
  if (anim === "walk") return cyclePose(f, info.frames, 5.5, 3.6, 1.2, 3.2);
  if (anim === "run") return cyclePose(f, info.frames, 7.2, 6.2, 3.4, 4.6);
  if (anim === "glide") return cyclePose(f, info.frames, 4.2, 1.4, 5.2, 2.2);
  if (anim === "hit") return hitPose(f);
  if (anim === "death") return deathPose(f);
  if (anim === "step" || anim === "roll" || anim === "leap") return movePose(anim, f);
  if (info.attack) return punchPose(f, info.frames, info.hand, info.attack);
  if (info.family) return weaponPose(f, info.frames, anim === "hold" ? "hold" : info.family);
  if (anim === "cast") return castPose(f);
  if (info.mount) return mountRider(anim, f);
  return bindPose();
}

export function blendPose(a, b, u) {
  const t = clamp(u, 0, 1);
  const s = smooth(t);
  const out = {};
  for (const k of JOINTS) out[k] = lerp3(a[k], b[k], s);
  return out;
}

export function poseAt(anim, frame, opts) {
  opts = opts || {};
  const cur = samplePose(anim, frame, opts.variant || 0);
  if (!opts.transition) return cur;
  const prev = samplePose(opts.transition.fromAnim, opts.transition.fromFrame, opts.variant || 0);
  return blendPose(prev, cur, opts.transition.u);
}

export function footMid(pose) {
  return {
    x: (pose.footL.x + pose.footR.x) * 0.5,
    y: (pose.footL.y + pose.footR.y) * 0.5,
    z: (pose.footL.z + pose.footR.z) * 0.5,
  };
}

export function jointDelta(a, b) {
  let m = 0;
  for (const k of JOINTS) {
    const d = a[k];
    const e = b[k];
    const dist = Math.hypot(d.x - e.x, d.y - e.y, d.z - e.z);
    if (dist > m) m = dist;
  }
  return m;
}

function mountLeg(frame, frames, phase, lift) {
  const s = Math.sin((frame / frames) * Math.PI * 2 + phase);
  return { z: s * 4.2, y: Math.max(0, s) * lift };
}

export function sampleMount(anim, frame) {
  const info = clipInfo(anim);
  const f = ((frame % info.frames) + info.frames) % info.frames;
  const run = anim === "mountRun";
  const walk = anim === "mountWalk" || run;
  const lift = run ? 5 : 3;
  const bodyY = 28 + (walk ? Math.abs(Math.sin((f / info.frames) * Math.PI * 2)) * (run ? 1.4 : 0.6) : Math.sin((f / info.frames) * Math.PI * 2) * 0.4);
  const fl = walk ? mountLeg(f, info.frames, 0, lift) : { z: 0, y: 0 };
  const fr = walk ? mountLeg(f, info.frames, Math.PI, lift) : { z: 0, y: 0 };
  const bl = walk ? mountLeg(f, info.frames, Math.PI, lift) : { z: 0, y: 0 };
  const br = walk ? mountLeg(f, info.frames, 0, lift) : { z: 0, y: 0 };
  return {
    hips: { x: 0, y: bodyY, z: 0 },
    chest: { x: 0, y: bodyY + 6, z: 8 },
    neck: { x: 0, y: bodyY + 14, z: 16 },
    head: { x: 0, y: bodyY + 20, z: 20 },
    seat: { x: 0, y: bodyY + 8, z: -2 },
    hoofFL: { x: -5, y: fl.y, z: 12 + fl.z },
    hoofFR: { x: 5, y: fr.y, z: 12 + fr.z },
    hoofBL: { x: -5, y: bl.y, z: -12 + bl.z },
    hoofBR: { x: 5, y: br.y, z: -12 + br.z },
    tail: { x: 0, y: bodyY + 4, z: -16 },
  };
}

function mountRider(anim, frame) {
  const mount = sampleMount(anim, frame);
  const pose = bindPose();
  const seat = mount.seat;
  const dy = seat.y - 42;
  for (const k of JOINTS) pose[k].y += dy;
  pose.hips.z += seat.z;
  pose.chest.z += seat.z + 1;
  pose.head.z += seat.z;
  pose.hipL.z += seat.z + 2;
  pose.hipR.z += seat.z + 2;
  pose.kneeL.z += seat.z + 6;
  pose.kneeR.z += seat.z + 6;
  pose.kneeL.y = seat.y - 6;
  pose.kneeR.y = seat.y - 6;
  pose.footL.y = Math.max(8, seat.y - 16);
  pose.footR.y = Math.max(8, seat.y - 16);
  pose.footL.z = seat.z + 8;
  pose.footR.z = seat.z + 8;
  pose.handL.y = seat.y + 6;
  pose.handR.y = seat.y + 6;
  pose.handL.z = seat.z + 4;
  pose.handR.z = seat.z + 4;
  return solveLimbs(pose);
}

export function speciesOf(name) {
  if (name === "female" || name === "sylphe" || name === "skeleton" || name === "specter") return name;
  return "male";
}

export function sculptPose(pose, species) {
  const src = pose;
  const out = {};
  for (const k of JOINTS) out[k] = { x: src[k].x, y: src[k].y, z: src[k].z };
  if (species === "female") {
    out.shoulderL.x *= 0.9;
    out.shoulderR.x *= 0.9;
    out.hipL.x *= 1.14;
    out.hipR.x *= 1.14;
    out.chest.z += 1.3;
    out.handL.x *= 0.94;
    out.handR.x *= 0.94;
  } else if (species === "sylphe") {
    for (const k of JOINTS) out[k].x *= 0.86;
    out.head.y += 1.5;
    out.neck.y += 0.6;
    out.handL.y -= 1.5;
    out.handR.y -= 1.5;
  } else if (species === "skeleton" || species === "specter") {
    for (const k of JOINTS) out[k].x *= 0.9;
  }
  return out;
}

export function toWorld(p, dir) {
  if (dir === "front") return { east: p.x, up: p.y, south: -p.z };
  const f = FACING[dir];
  if (!f) throw new Error("direction inconnue: " + dir);
  return {
    east: p.z * f.fe + p.x * f.re,
    up: p.y,
    south: p.z * f.fs + p.x * f.rs,
  };
}

export function toScreen(p, dir) {
  const w = toWorld(p, dir);
  if (dir === "front") {
    return { x: ANCHOR + w.east, y: ANCHOR - w.up, depth: -w.south };
  }
  return {
    x: ANCHOR + (w.east - w.south),
    y: ANCHOR + (w.east + w.south) * 0.5 - w.up,
    depth: w.east + w.south,
  };
}

export function projectPose(pose, dir) {
  const out = {};
  for (const k of JOINTS) out[k] = toScreen(pose[k], dir);
  const mid = footMid(pose);
  out.feet = toScreen(mid, dir);
  return out;
}

export const SOFT_PIECES = ["cape", "coat", "long", "scarf", "bag"];

export function windAmp(level) {
  if (level >= 2) return 5.6;
  if (level === 1) return 2.4;
  return 0.35;
}

export function clothPoints(anchor, frame, frames, count, level) {
  const amp = windAmp(level);
  const pts = [anchor];
  let prev = anchor;
  for (let i = 1; i <= count; i++) {
    const sway = Math.sin((frame / frames) * Math.PI * 2 + i * 0.55) * amp * (i / count);
    const p = {
      x: anchor.x + sway,
      y: anchor.y - i * 5.4,
      z: anchor.z - 1.05,
    };
    pts.push(p);
    prev = p;
  }
  return pts;
}
