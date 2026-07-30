import { PALETTE } from "./constants.js";
import { createPath, createEllipse, px, darken } from "./svg.js";

const SKIN = PALETTE.skin;
const SKIN_DARK = PALETTE.skinDark;
const SKIN_MID = PALETTE.skinMid;
const OUTLINE = PALETTE.outline;
const FOOT = PALETTE.foot;

function buildGlutes(m, w, side) {
  if (m.glutes <= 0.05) return [];
  const nodes = [];
  const isBack = side === "back";
  const gx = isBack ? -m.hipW * 0.45 : m.hipW * 0.25;
  const gy = m.hipY + 0.05;
  const rx = (0.06 + m.glutes * 0.10) * (isBack ? 1.1 : 1.0);
  const ry = 0.05 + m.glutes * 0.09;
  nodes.push(
    createEllipse(gx * w, gy * w, rx * w, ry * w, isBack ? SKIN_DARK : SKIN_MID, OUTLINE, 1.2)
  );
  return nodes;
}

export function buildLegBack(m, w) {
  const nodes = [];
  const sx = -m.footSpread;
  const thigh = m.thigh;
  const calf = m.calf;
  nodes.push(...buildGlutes(m, w, "back"));
  nodes.push(
    createPath(
      `M ${px(-m.hipW * 0.4, w)} ${px(m.hipY, w)}
     L ${px(sx - thigh * 0.35, w)} ${px(m.kneeY, w)}
     L ${px(sx + thigh * 0.55, w)} ${px(m.kneeY + 0.08, w)}
     L ${px(-m.hipW * 0.1, w)} ${px(m.hipY + 0.08, w)} Z`,
      SKIN_DARK,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createPath(
      `M ${px(sx - thigh * 0.35, w)} ${px(m.kneeY, w)}
     L ${px(sx - calf * 0.45, w)} ${px(m.ankleY, w)}
     L ${px(sx + calf * 0.55, w)} ${px(m.ankleY + 0.02, w)}
     L ${px(sx + thigh * 0.55, w)} ${px(m.kneeY + 0.08, w)} Z`,
      SKIN_DARK,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createPath(
      `M ${px(sx - calf * 0.45, w)} ${px(m.ankleY, w)}
     L ${px(sx - calf * 0.2, w)} ${px(m.footY, w)}
     L ${px(sx + calf * 0.95, w)} ${px(m.footY, w)}
     L ${px(sx + calf * 0.55, w)} ${px(m.ankleY + 0.02, w)} Z`,
      FOOT,
      OUTLINE,
      1.5
    )
  );
  return nodes;
}

export function buildLegFront(m, w) {
  const nodes = [];
  const sx = m.footSpread;
  const thigh = m.thigh;
  const calf = m.calf;
  nodes.push(...buildGlutes(m, w, "front"));
  nodes.push(
    createPath(
      `M ${px(m.hipW * 0.15, w)} ${px(m.hipY, w)}
     L ${px(sx - thigh * 0.2, w)} ${px(m.kneeY, w)}
     L ${px(sx + thigh * 0.65, w)} ${px(m.kneeY + 0.08, w)}
     L ${px(m.hipW * 0.5, w)} ${px(m.hipY + 0.08, w)} Z`,
      SKIN,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createPath(
      `M ${px(sx - thigh * 0.2, w)} ${px(m.kneeY, w)}
     L ${px(sx - calf * 0.05, w)} ${px(m.ankleY, w)}
     L ${px(sx + calf * 0.95, w)} ${px(m.ankleY + 0.02, w)}
     L ${px(sx + thigh * 0.65, w)} ${px(m.kneeY + 0.08, w)} Z`,
      SKIN,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createPath(
      `M ${px(sx - calf * 0.05, w)} ${px(m.ankleY, w)}
     L ${px(sx + calf * 0.25, w)} ${px(m.footY, w)}
     L ${px(sx + calf * 1.45, w)} ${px(m.footY, w)}
     L ${px(sx + calf * 0.95, w)} ${px(m.ankleY + 0.02, w)} Z`,
      FOOT,
      OUTLINE,
      1.5
    )
  );
  return nodes;
}

function buildShoulderCap(m, w, side, fill) {
  if (m.shoulderCap <= 0.05) return [];
  const isBack = side === "back";
  const shx = isBack ? -m.shoulderW : m.shoulderW;
  const cap = m.shoulderCap;
  const rx = 0.04 + cap * 0.055;
  const ry = 0.035 + cap * 0.04;
  return [
    createEllipse(
      (shx + (isBack ? 0.02 : -0.02)) * w,
      (m.shoulderY + 0.02) * w,
      rx * w,
      ry * w,
      fill,
      OUTLINE,
      1.3
    ),
  ];
}

function buildElbowJoint(m, w, side, fill) {
  if (m.elbowBulk <= 0.02) return [];
  const isBack = side === "back";
  const shx = isBack ? -m.shoulderW : m.shoulderW;
  const thick = m.biceps;
  const ex = isBack ? shx - thick * 0.8 : shx + thick * 0.9;
  const r = 0.025 + m.elbowBulk * 0.55;
  return [
    createEllipse(ex * w, (m.elbowY + 0.03) * w, r * w, r * 0.85 * w, fill, OUTLINE, 1.2),
  ];
}

export function buildArmBack(m, w) {
  const nodes = [];
  const shx = -m.shoulderW;
  const bi = m.biceps;
  const fo = m.forearm;
  nodes.push(...buildShoulderCap(m, w, "back", SKIN_DARK));
  nodes.push(
    createPath(
      `M ${px(shx + bi * 0.4, w)} ${px(m.shoulderY, w)}
     L ${px(shx - bi * 0.85, w)} ${px(m.elbowY, w)}
     L ${px(shx - bi * 0.05, w)} ${px(m.elbowY + 0.08, w)}
     L ${px(shx + bi * 1.05, w)} ${px(m.shoulderY + 0.12, w)} Z`,
      SKIN_DARK,
      OUTLINE,
      1.5
    )
  );
  nodes.push(...buildElbowJoint(m, w, "back", SKIN_DARK));
  nodes.push(
    createPath(
      `M ${px(shx - bi * 0.85, w)} ${px(m.elbowY, w)}
     L ${px(shx - fo * 1.15, w)} ${px(m.wristY, w)}
     L ${px(shx - fo * 0.25, w)} ${px(m.wristY + 0.04, w)}
     L ${px(shx - bi * 0.05, w)} ${px(m.elbowY + 0.08, w)} Z`,
      SKIN_DARK,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createEllipse(
      (shx - fo * 0.85) * w,
      m.wristY * w,
      Math.max(0.02, fo * 0.45) * w,
      Math.max(0.018, fo * 0.4) * w,
      SKIN_DARK,
      OUTLINE,
      1.2
    )
  );
  return nodes;
}

export function buildArmFront(m, w) {
  const nodes = [];
  const shx = m.shoulderW;
  const bi = m.biceps;
  const fo = m.forearm;
  nodes.push(...buildShoulderCap(m, w, "front", SKIN));
  nodes.push(
    createPath(
      `M ${px(shx - bi * 0.35, w)} ${px(m.shoulderY, w)}
     L ${px(shx + bi * 0.95, w)} ${px(m.elbowY, w)}
     L ${px(shx + bi * 0.15, w)} ${px(m.elbowY + 0.08, w)}
     L ${px(shx - bi * 1.0, w)} ${px(m.shoulderY + 0.12, w)} Z`,
      SKIN,
      OUTLINE,
      1.5
    )
  );
  nodes.push(...buildElbowJoint(m, w, "front", SKIN));
  nodes.push(
    createPath(
      `M ${px(shx + bi * 0.95, w)} ${px(m.elbowY, w)}
     L ${px(shx + fo * 1.2, w)} ${px(m.wristY, w)}
     L ${px(shx + fo * 0.3, w)} ${px(m.wristY + 0.04, w)}
     L ${px(shx + bi * 0.15, w)} ${px(m.elbowY + 0.08, w)} Z`,
      SKIN,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createEllipse(
      (shx + fo * 0.9) * w,
      m.wristY * w,
      Math.max(0.02, fo * 0.45) * w,
      Math.max(0.018, fo * 0.4) * w,
      SKIN,
      OUTLINE,
      1.2
    )
  );
  return nodes;
}

function buildChest(m, w) {
  if (m.chestSize <= 0.05) return [];
  const nodes = [];
  const cy = m.chestY;
  const size = m.chestSize;
  if (m.chestShape === "flat") return [];
  if (m.chestShape === "pec") {
    nodes.push(
      createEllipse((-m.shoulderW * 0.35) * w, cy * w, (0.08 + size * 0.08) * w, (0.05 + size * 0.05) * w, SKIN_MID, OUTLINE, 1.2)
    );
    nodes.push(
      createEllipse((m.shoulderW * 0.35) * w, cy * w, (0.08 + size * 0.08) * w, (0.05 + size * 0.05) * w, SKIN_MID, OUTLINE, 1.2)
    );
  } else {
    const soft = m.chestShape === "full" ? 1.25 : 1;
    nodes.push(
      createEllipse((-m.shoulderW * 0.28) * w, (cy + 0.02) * w, (0.09 + size * 0.1) * soft * w, (0.07 + size * 0.08) * soft * w, SKIN, OUTLINE, 1.2)
    );
    nodes.push(
      createEllipse((m.shoulderW * 0.28) * w, (cy + 0.02) * w, (0.09 + size * 0.1) * soft * w, (0.07 + size * 0.08) * soft * w, SKIN, OUTLINE, 1.2)
    );
  }
  return nodes;
}

function buildBelly(m, w) {
  if (m.belly <= 0.05) return [];
  return [
    createEllipse(
      0,
      ((m.chestY + m.waistY) / 2 + 0.05) * w,
      (m.waistW * 0.9 + m.belly * 0.12) * w,
      (0.06 + m.belly * 0.1) * w,
      SKIN_MID,
      OUTLINE,
      1.2
    ),
  ];
}

export function buildTorso(m, w) {
  const nodes = [];
  const sw = m.shoulderW;
  const ww = m.waistW;
  const hw = m.hipW;
  nodes.push(
    createPath(
      `M ${px(-sw, w)} ${px(m.shoulderY, w)}
     L ${px(sw, w)} ${px(m.shoulderY, w)}
     L ${px(ww, w)} ${px(m.waistY, w)}
     L ${px(hw, w)} ${px(m.hipY, w)}
     L ${px(-hw, w)} ${px(m.hipY, w)}
     L ${px(-ww, w)} ${px(m.waistY, w)} Z`,
      SKIN,
      OUTLINE,
      1.5
    )
  );
  nodes.push(
    createPath(
      `M ${px(-m.neckW, w)} ${px(m.neckTop, w)}
     L ${px(m.neckW, w)} ${px(m.neckTop, w)}
     L ${px(m.neckW * 1.2, w)} ${px(m.shoulderY, w)}
     L ${px(-m.neckW * 1.2, w)} ${px(m.shoulderY, w)} Z`,
      SKIN,
      OUTLINE,
      1.3
    )
  );
  nodes.push(...buildChest(m, w));
  nodes.push(...buildBelly(m, w));
  return nodes;
}

export function buildHead(m, w) {
  const nodes = [];
  nodes.push(
    createEllipse(0, m.headY * w, m.headRx * w, m.headRy * w, SKIN, OUTLINE, 1.5)
  );
  if (m.kind !== "back" && m.kind !== "qBack") {
    const eyeY = (m.headY + 0.02) * w;
    const eyeSpread = m.headRx * 0.35 * w;
    const er = Math.max(1.2, m.headRx * 0.12 * w);
    nodes.push(createEllipse(-eyeSpread, eyeY, er, er * 0.85, "#1a1210", "#1a1210", 0.5));
    nodes.push(createEllipse(eyeSpread, eyeY, er, er * 0.85, "#1a1210", "#1a1210", 0.5));
  }
  return nodes;
}

export function buildPantsLeg(m, w, side, mode, color) {
  const nodes = [];
  const isBack = side === "back";
  const sx = isBack ? -m.footSpread : m.footSpread;
  const thick = m.thigh * m.pantsScaleX;
  const hem = mode === "over" ? m.footY + 0.02 : m.ankleY;
  const fill = color;
  const stroke = darken(color, 0.35);
  nodes.push(
    createPath(
      `M ${px(isBack ? -m.hipW * 0.45 : m.hipW * 0.1, w)} ${px(m.hipY, w)}
     L ${px(sx - thick * 0.4, w)} ${px(m.kneeY, w)}
     L ${px(sx - thick * 0.35, w)} ${px(hem, w)}
     L ${px(sx + thick * 0.55, w)} ${px(hem, w)}
     L ${px(sx + thick * 0.5, w)} ${px(m.kneeY, w)}
     L ${px(isBack ? -m.hipW * 0.05 : m.hipW * 0.55, w)} ${px(m.hipY + 0.05, w)} Z`,
      fill,
      stroke,
      1.4
    )
  );
  return nodes;
}

export function buildPantsWaist(m, w, color) {
  return [
    createPath(
      `M ${px(-m.hipW * 0.95, w)} ${px(m.hipY - 0.02, w)}
     L ${px(m.hipW * 0.95, w)} ${px(m.hipY - 0.02, w)}
     L ${px(m.hipW * 0.9, w)} ${px(m.hipY + 0.08, w)}
     L ${px(-m.hipW * 0.9, w)} ${px(m.hipY + 0.08, w)} Z`,
      color,
      darken(color, 0.35),
      1.4
    ),
  ];
}

export function buildTunic(m, w, color) {
  const sw = m.shoulderW * m.torsoScaleX;
  const ww = Math.max(m.waistW, m.hipW * 0.8) * m.torsoScaleX;
  return [
    createPath(
      `M ${px(-sw * 0.95, w)} ${px(m.shoulderY + 0.02, w)}
     L ${px(sw * 0.95, w)} ${px(m.shoulderY + 0.02, w)}
     L ${px(ww, w)} ${px(m.hipY + 0.05, w)}
     L ${px(-ww, w)} ${px(m.hipY + 0.05, w)} Z`,
      color,
      darken(color, 0.3),
      1.4
    ),
  ];
}

export function buildCap(m, w, color) {
  const s = m.hatScale || 1;
  return [
    createEllipse(0, (m.headY - m.headRy * 0.55) * w, m.headRx * 1.15 * s * w, m.headRy * 0.45 * s * w, color, darken(color, 0.3), 1.3),
    createPath(
      `M ${px(-m.headRx * 1.2 * s, w)} ${px(m.headY - m.headRy * 0.2, w)}
     L ${px(m.headRx * 1.4 * s, w)} ${px(m.headY - m.headRy * 0.15, w)}
     L ${px(m.headRx * 1.2 * s, w)} ${px(m.headY - m.headRy * 0.05, w)}
     L ${px(-m.headRx * 1.05 * s, w)} ${px(m.headY - m.headRy * 0.08, w)} Z`,
      color,
      darken(color, 0.3),
      1.2
    ),
  ];
}
