/**
 * Morphologies + resolveMorph — contrat Phase 1 préservé.
 */

export const BODY_SLIDER_DEFS = [
  { key: "neck", label: "Cou", min: 0.4, max: 1.8, step: 0.05, def: 1.0 },
  { key: "shoulderWidth", label: "Épaules Ø", min: 0.5, max: 1.6, step: 0.05, def: 1.0 },
  { key: "shoulderCap", label: "Haut épaules", min: 0.0, max: 1.8, step: 0.05, def: 1.0 },
  { key: "biceps", label: "Biceps", min: 0.4, max: 1.8, step: 0.05, def: 1.0 },
  { key: "elbow", label: "Coudes", min: 0.3, max: 2.0, step: 0.05, def: 1.0 },
  { key: "forearm", label: "Avant-bras", min: 0.4, max: 1.8, step: 0.05, def: 1.0 },
  { key: "chestSize", label: "Poitrine Ø", min: 0.0, max: 1.5, step: 0.05, def: 0.55 },
  { key: "belly", label: "Ventre", min: 0.0, max: 1.4, step: 0.05, def: 0.15 },
  { key: "waist", label: "Taille", min: 0.5, max: 1.6, step: 0.05, def: 1.0 },
  { key: "hips", label: "Hanches", min: 0.5, max: 1.7, step: 0.05, def: 1.0 },
  { key: "glutes", label: "Fesses", min: 0.0, max: 1.5, step: 0.05, def: 0.35 },
  { key: "thigh", label: "Cuisses", min: 0.4, max: 1.8, step: 0.05, def: 1.0 },
  { key: "calf", label: "Mollets", min: 0.4, max: 1.8, step: 0.05, def: 1.0 },
];

export function defaultBodyCustom() {
  const body = { chestShape: "pec" };
  for (const d of BODY_SLIDER_DEFS) body[d.key] = d.def;
  return body;
}

export const MORPHS = {
  heavy: {
    id: "heavy",
    label: "LOURD",
    labelColor: "#E8590C",
    height: 1.8,
    shoulderW: 0.45,
    hipW: 0.28,
    waistW: 0.30,
    footSpread: 0.25,
    headRx: 0.20,
    headRy: 0.26,
    neckW: 0.08,
    armThick: 0.10,
    legThick: 0.10,
    headY: -1.75,
    neckTop: -1.65,
    shoulderY: -1.40,
    chestY: -1.10,
    waistY: -0.80,
    hipY: -0.72,
    kneeY: -0.15,
    ankleY: 0.00,
    footY: 0.06,
    elbowY: -0.90,
    wristY: -0.55,
    pantsScaleX: 1.20,
    pantsScaleY: 1.05,
    torsoScaleX: 1.18,
    hatScale: 1.12,
  },
  standard: {
    id: "standard",
    label: "STANDARD",
    labelColor: "#2E2E30",
    height: 1.6,
    shoulderW: 0.35,
    hipW: 0.22,
    waistW: 0.22,
    footSpread: 0.20,
    headRx: 0.18,
    headRy: 0.22,
    neckW: 0.06,
    armThick: 0.08,
    legThick: 0.08,
    headY: -1.56,
    neckTop: -1.48,
    shoulderY: -1.28,
    chestY: -1.00,
    waistY: -0.70,
    hipY: -0.65,
    kneeY: -0.15,
    ankleY: 0.00,
    footY: 0.05,
    elbowY: -0.85,
    wristY: -0.50,
    pantsScaleX: 1.00,
    pantsScaleY: 1.00,
    torsoScaleX: 1.00,
    hatScale: 1.00,
  },
  light: {
    id: "light",
    label: "FIN",
    labelColor: "#2E2E30",
    height: 1.7,
    shoulderW: 0.275,
    hipW: 0.16,
    waistW: 0.16,
    footSpread: 0.15,
    headRx: 0.16,
    headRy: 0.21,
    neckW: 0.05,
    armThick: 0.06,
    legThick: 0.06,
    headY: -1.65,
    neckTop: -1.55,
    shoulderY: -1.35,
    chestY: -1.05,
    waistY: -0.75,
    hipY: -0.68,
    kneeY: -0.15,
    ankleY: 0.00,
    footY: 0.05,
    elbowY: -0.88,
    wristY: -0.52,
    pantsScaleX: 0.82,
    pantsScaleY: 1.02,
    torsoScaleX: 0.82,
    hatScale: 0.92,
  },
};

/**
 * Fusionne preset morphologique + réglages de tronçons.
 * Tout le rendu lit UNIQUEMENT ce profil.
 */
export function resolveMorph(morphId, body) {
  const base = MORPHS[morphId];
  if (!base) throw new Error(`Unknown morph: ${morphId}`);
  const b = body;
  const m = { ...base };

  m.neckW = base.neckW * b.neck;
  m.shoulderW = base.shoulderW * b.shoulderWidth;
  m.shoulderCap = b.shoulderCap;
  m.biceps = base.armThick * b.biceps;
  m.elbowBulk = base.armThick * b.elbow;
  m.forearm = base.armThick * b.forearm;
  m.armThick = (m.biceps + m.forearm) / 2;
  m.chestShape = b.chestShape;
  m.chestSize = b.chestSize;
  m.belly = b.belly;
  m.waistW = (base.waistW || base.hipW) * b.waist;
  m.hipW = base.hipW * b.hips;
  m.glutes = b.glutes;
  m.thigh = base.legThick * b.thigh;
  m.calf = base.legThick * b.calf;
  m.legThick = (m.thigh + m.calf) / 2;

  m.pantsScaleX = base.pantsScaleX * ((b.thigh + b.hips) / 2);
  m.torsoScaleX = base.torsoScaleX * ((b.shoulderWidth + b.waist) / 2);

  return m;
}
