/**
 * Orientation affichée = f(Δcol, Δrow) uniquement.
 * Jamais choisie séparément.
 *
 * Δrow=−1 → dos ; Δcol=+1 → profil droit ;
 * Δrow=+1 → face ; Δcol=−1 → profil gauche ;
 * diagonales → 3/4 correspondants.
 */

export const ORIENT = {
  back: "back",
  qBackRight: "qBackRight",
  sideRight: "sideRight",
  qFrontRight: "qFrontRight",
  front: "front",
  qFrontLeft: "qFrontLeft",
  sideLeft: "sideLeft",
  qBackLeft: "qBackLeft",
};

/** Table canonique (Δcol, Δrow) → orientation. */
const DELTA_TABLE = {
  "0,-1": ORIENT.back,
  "1,-1": ORIENT.qBackRight,
  "1,0": ORIENT.sideRight,
  "1,1": ORIENT.qFrontRight,
  "0,1": ORIENT.front,
  "-1,1": ORIENT.qFrontLeft,
  "-1,0": ORIENT.sideLeft,
  "-1,-1": ORIENT.qBackLeft,
};

/**
 * Métadonnées de rendu pour chaque orientation.
 * left = miroir scaleX(-1) du kind droit correspondant.
 * kind : front | back | side | qFront | qBack
 */
export const ORIENT_META = {
  [ORIENT.back]: { kind: "back", mirror: false, label: "Dos" },
  [ORIENT.qBackRight]: { kind: "qBack", mirror: false, label: "3/4 Dos Droit" },
  [ORIENT.sideRight]: { kind: "side", mirror: false, label: "Profil Droit" },
  [ORIENT.qFrontRight]: { kind: "qFront", mirror: false, label: "3/4 Face Droit" },
  [ORIENT.front]: { kind: "front", mirror: false, label: "Face" },
  [ORIENT.qFrontLeft]: { kind: "qFront", mirror: true, label: "3/4 Face Gauche" },
  [ORIENT.sideLeft]: { kind: "side", mirror: true, label: "Profil Gauche" },
  [ORIENT.qBackLeft]: { kind: "qBack", mirror: true, label: "3/4 Dos Gauche" },
};

/**
 * @param {number} dCol
 * @param {number} dRow
 * @returns {string} clé ORIENT
 */
export function orientationFromDelta(dCol, dRow) {
  const sc = Math.sign(dCol);
  const sr = Math.sign(dRow);
  if (sc === 0 && sr === 0) {
    throw new Error("orientationFromDelta: (0,0) n'a pas d'orientation");
  }
  const key = `${sc},${sr}`;
  const o = DELTA_TABLE[key];
  if (!o) throw new Error(`orientationFromDelta: delta invalide (${dCol},${dRow})`);
  return o;
}

export function getOrientMeta(orient) {
  const m = ORIENT_META[orient];
  if (!m) throw new Error(`Unknown orient: ${orient}`);
  return m;
}

/** Les 8 cas attendus pour les tests. */
export const ORIENT_DELTA_CASES = [
  { dCol: 0, dRow: -1, expect: ORIENT.back },
  { dCol: 1, dRow: -1, expect: ORIENT.qBackRight },
  { dCol: 1, dRow: 0, expect: ORIENT.sideRight },
  { dCol: 1, dRow: 1, expect: ORIENT.qFrontRight },
  { dCol: 0, dRow: 1, expect: ORIENT.front },
  { dCol: -1, dRow: 1, expect: ORIENT.qFrontLeft },
  { dCol: -1, dRow: 0, expect: ORIENT.sideLeft },
  { dCol: -1, dRow: -1, expect: ORIENT.qBackLeft },
];
