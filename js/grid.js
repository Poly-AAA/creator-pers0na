import { TILE_W, TILE_H } from "./constants.js";

/**
 * Case (col, row) → monde.
 * x = (col − row) × 32, y = (col + row) × 16
 */
export function gridToWorld(col, row) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/**
 * Clé de profondeur totale : (col+row), puis row, puis id stable.
 * Garantit aucune égalité non résolue entre acteurs distincts.
 */
export function depthKey(col, row, id) {
  const depth = col + row;
  const idPart = String(id);
  // Encode as comparable tuple string with zero-padded numerics
  return [
    String(depth).padStart(8, "0"),
    String(row).padStart(8, "0"),
    idPart,
  ].join("|");
}

/** Comparateur stable pour tri d'affichage (plus petit = derrière). */
export function compareDepth(a, b) {
  const ka = depthKey(a.col, a.row, a.id);
  const kb = depthKey(b.col, b.row, b.id);
  if (ka < kb) return -1;
  if (ka > kb) return 1;
  return 0;
}

export function sortActorsByDepth(actors) {
  return [...actors].sort(compareDepth);
}
