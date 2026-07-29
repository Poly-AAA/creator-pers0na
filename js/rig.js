import { getOrientMeta } from "./orientation.js";
import { TILE_W, TILE_H, CAMERA_ANGLE_DEG } from "./constants.js";

/**
 * Facteurs de projection par kind — calculés, pas copiés de la section 3.
 * side : compression X forte (profils étroits).
 * front/back : épaules plus larges, pieds resserrés.
 * qFront/qBack : interpolation + isoSkew aligné pente grille.
 *
 * Pente iso 2:1 = TILE_H/TILE_W (= 0.5). CAMERA_ANGLE_DEG (30°) documente la caméra iso.
 */
export const ISO_GRID_SLOPE = TILE_H / TILE_W;
export const ISO_CAMERA_ANGLE = CAMERA_ANGLE_DEG;
const ISO_SKEW_Q = -ISO_GRID_SLOPE;

const KIND_FACTORS = {
  front: {
    shoulder: 1.18,
    hip: 1.12,
    waist: 1.12,
    foot: 0.38,
    headRx: 1.08,
    arm: 1.0,
    chest: 1.0,
    glutes: 1.0,
    isoSkew: 0,
  },
  back: {
    shoulder: 1.18,
    hip: 1.12,
    waist: 1.12,
    foot: 0.38,
    headRx: 1.08,
    arm: 1.0,
    chest: 0.35,
    glutes: 1.35,
    isoSkew: 0,
  },
  side: {
    shoulder: 0.38,
    hip: 0.42,
    waist: 0.44,
    foot: 0.10,
    headRx: 0.72,
    arm: 0.82,
    chest: 0.55,
    glutes: 0.7,
    isoSkew: 0,
  },
  qFront: {
    shoulder: 1.0,
    hip: 1.0,
    waist: 1.0,
    foot: 1.0,
    headRx: 1.0,
    arm: 1.0,
    chest: 1.0,
    glutes: 1.0,
    isoSkew: ISO_SKEW_Q,
  },
  qBack: {
    shoulder: 1.0,
    hip: 1.0,
    waist: 1.0,
    foot: 0.9,
    headRx: 1.0,
    arm: 1.0,
    chest: 0.45,
    glutes: 1.25,
    isoSkew: ISO_SKEW_Q,
  },
};

/**
 * Projette le morph résolu selon l'orientation.
 * Un seul calcul appliqué à tout le squelette.
 */
export function projectRig(morph, orient) {
  const meta = getOrientMeta(orient);
  const f = KIND_FACTORS[meta.kind];
  const m = { ...morph };

  m.shoulderW *= f.shoulder;
  m.hipW *= f.hip;
  m.waistW *= f.waist;
  m.footSpread *= f.foot;
  m.headRx *= f.headRx;
  m.biceps *= f.arm;
  m.forearm *= f.arm;
  m.armThick = (m.biceps + m.forearm) / 2;
  m.elbowBulk *= f.arm;
  m.chestSize *= f.chest;
  m.glutes = Math.min(1.6, m.glutes * f.glutes + (meta.kind === "back" || meta.kind === "qBack" ? 0.08 : 0));
  m.pantsScaleX *= (f.hip + f.foot) / 2;
  m.torsoScaleX *= (f.shoulder + f.waist) / 2;

  m.orient = orient;
  m.orientMeta = meta;
  m.kind = meta.kind;
  m.mirror = meta.mirror;
  m.isoSkew = f.isoSkew;

  return m;
}

/**
 * Ancres locales (unités morph) après projection.
 */
export function getAnchors(m) {
  return {
    head: { x: 0, y: m.headY },
    neck: { x: 0, y: m.neckTop },
    shoulderL: { x: -m.shoulderW, y: m.shoulderY },
    shoulderR: { x: m.shoulderW, y: m.shoulderY },
    elbowL: { x: -m.shoulderW * 1.05, y: m.elbowY },
    elbowR: { x: m.shoulderW * 1.05, y: m.elbowY },
    waistL: { x: -m.waistW * 0.85, y: m.waistY },
    waistR: { x: m.waistW * 0.85, y: m.waistY },
    hip: { x: 0, y: m.hipY },
    bodyCenter: { x: 0, y: (m.chestY + m.waistY) / 2 },
    gluteL: { x: -m.hipW * 0.55, y: m.hipY + 0.06 },
    gluteR: { x: m.hipW * 0.35, y: m.hipY + 0.06 },
    handL: { x: -m.shoulderW * 1.15, y: m.wristY },
    handR: { x: m.shoulderW * 1.15, y: m.wristY },
    footL: { x: -m.footSpread, y: m.ankleY },
    footR: { x: m.footSpread, y: m.ankleY },
    pivot: { x: 0, y: 0 },
  };
}

/**
 * Applique scaleX(-1) aux points d'ancrage (miroir mathématique).
 */
export function mirrorAnchors(anchors) {
  const out = {};
  for (const [k, p] of Object.entries(anchors)) {
    out[k] = { x: -p.x, y: p.y };
  }
  // Swap L/R semantic names so callers reading handL get the mirrored-left slot
  const swap = (a, b) => {
    const t = out[a];
    out[a] = out[b];
    out[b] = t;
  };
  swap("shoulderL", "shoulderR");
  swap("elbowL", "elbowR");
  swap("waistL", "waistR");
  swap("gluteL", "gluteR");
  swap("handL", "handR");
  swap("footL", "footR");
  return out;
}

/**
 * Miroir d'un objet ancre simple {x,y} (pour tests d'idempotence).
 */
export function mirrorPoint(p) {
  return { x: -p.x, y: p.y };
}

export function mirrorRigPoints(points) {
  const out = {};
  for (const [k, p] of Object.entries(points)) {
    out[k] = mirrorPoint(p);
  }
  return out;
}

/**
 * Largeur silhouette projetée (épaule à épaule + pieds) — pour tests profil.
 */
export function projectedWidth(m) {
  const a = getAnchors(m);
  const xs = Object.values(a).map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
}

/**
 * Ordre des calques selon orientation (bras/jambes avant-arrière dynamiques).
 */
export function layerOrderFor(orient) {
  const meta = getOrientMeta(orient);
  const baseFront = [
    "auraBehind",
    "legBack",
    "armBack",
    "torso",
    "head",
    "armFront",
    "legFront",
    "weapon",
    "auraFront",
    "anchors",
    "meta",
  ];
  if (meta.kind === "back" || meta.kind === "qBack") {
    return [
      "auraBehind",
      "legFront",
      "armFront",
      "torso",
      "head",
      "armBack",
      "legBack",
      "weapon",
      "auraFront",
      "anchors",
      "meta",
    ];
  }
  if (meta.kind === "side") {
    // Profil : jambe « arrière » derrière, bras dominant devant
    return [
      "auraBehind",
      "legBack",
      "armBack",
      "torso",
      "head",
      "legFront",
      "armFront",
      "weapon",
      "auraFront",
      "anchors",
      "meta",
    ];
  }
  return baseFront;
}

export const LAYER_ORDER_DEFAULT = layerOrderFor("front");

/**
 * Transform SVG du corps : skew puis miroir (ordre SVG : droite → gauche).
 */
export function bodyTransform(m) {
  const parts = [];
  if (m.mirror) parts.push("scale(-1,1)");
  if (m.isoSkew) parts.push(`matrix(1,0,${m.isoSkew},1,0,0)`);
  return parts.join(" ");
}
