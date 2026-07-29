/**
 * NEURO-CORE — constantes moteur (seul endroit ; référencé partout).
 */

export const TILE_W = 64;
export const TILE_H = 32;
export const CHAR_H = 96;
export const VIEW_W = 390;
export const VIEW_H = 844;
export const CAMERA_ANGLE_DEG = 30;
export const ZOOM_MIN = 0.75;
export const ZOOM_MAX = 2;
export const ZOOM_DEFAULT = 1;
export const TIME_SCALE = 0.35;
export const HIT_STOP_MS = 100;
export const COMBO_RATIO = 0.35;

/** Durées clips de test (ms, temps animé / scaled). */
export const ANIM = {
  idle: 2000,
  walk: 350,
  attack: 600,
  cast: 700,
  hit: 400,
  dash: 280,
};

export const PALETTE = {
  bg: "#F2F0EB",
  tileLight: "#DCD3C3",
  tileDark: "#C8BDAA",
  ink: "#2E2E30",
  accent: "#E8590C",
  skin: "#e8c4a0",
  skinDark: "#c9a080",
  skinMid: "#dbb494",
  outline: "#2a1c15",
  foot: "#8a6e5a",
};

/** Échelle monde → unités morph (morph Y ≈ -1.75..0.06). */
export const MORPH_UNIT = CHAR_H / 1.9;
