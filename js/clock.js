import { TIME_SCALE, HIT_STOP_MS, COMBO_RATIO } from "./constants.js";

/**
 * Horloge moteur.
 * - Animations : scaledDt = realDt * timeScale (gelé pendant hit-stop)
 * - Hit-stop et fenêtre combo : temps réel, non affectés par le ralenti
 */
export function createClock(options = {}) {
  let timeScale = options.timeScale ?? TIME_SCALE;
  let hitStopRemaining = 0;
  let comboRemaining = 0;
  let scaledTime = 0;
  let realTime = 0;

  return {
    get timeScale() {
      return timeScale;
    },
    setTimeScale(v) {
      timeScale = v;
    },
    get scaledTime() {
      return scaledTime;
    },
    get realTime() {
      return realTime;
    },
    get inHitStop() {
      return hitStopRemaining > 0;
    },
    get comboRemaining() {
      return comboRemaining;
    },
    get inComboWindow() {
      return comboRemaining > 0;
    },

    /** Déclenche un hit-stop en ms réelles. */
    triggerHitStop(ms = HIT_STOP_MS) {
      hitStopRemaining = Math.max(hitStopRemaining, ms);
    },

    /**
     * Ouvre une fenêtre combo proportionnelle à la durée du clip courant.
     * Avance en temps réel.
     */
    openComboWindow(clipDurationMs, ratio = COMBO_RATIO) {
      comboRemaining = clipDurationMs * ratio;
    },

    /**
     * @param {number} realDt ms écoulées réelles
     * @returns {{ realDt, scaledDt, scaledTime, realTime }}
     */
    tick(realDt) {
      realTime += realDt;

      if (hitStopRemaining > 0) {
        hitStopRemaining = Math.max(0, hitStopRemaining - realDt);
      }
      if (comboRemaining > 0) {
        comboRemaining = Math.max(0, comboRemaining - realDt);
      }

      const scaledDt = hitStopRemaining > 0 ? 0 : realDt * timeScale;
      scaledTime += scaledDt;

      return { realDt, scaledDt, scaledTime, realTime };
    },
  };
}
