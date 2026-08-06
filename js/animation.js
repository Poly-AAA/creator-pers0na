import { ANIM, COMBO_RATIO } from "./constants.js";

/**
 * Clips de test. Les keyframes déclenchent des hooks (sorts), jamais de timers parallèles.
 */
export const CLIPS = {
  idle: {
    id: "idle",
    duration: ANIM.idle,
    loop: true,
    keyframes: [],
    sample(t) {
      const u = t / this.duration;
      const breath = Math.sin(u * Math.PI * 2) * 0.015;
      return { bobY: breath, swayX: Math.sin(u * Math.PI * 2) * 0.008, limbPhase: u };
    },
  },
  walk: {
    id: "walk",
    duration: ANIM.walk,
    loop: false,
    keyframes: [{ at: 1, hook: "onStep" }],
    sample(t) {
      const u = Math.min(1, t / this.duration);
      return {
        bobY: Math.sin(u * Math.PI) * -0.04,
        swayX: 0,
        limbPhase: u,
        moveProgress: u,
      };
    },
  },
  attack: {
    id: "attack",
    duration: ANIM.attack,
    loop: false,
    keyframes: [{ at: 0.55, hook: "onHit" }],
    sample(t) {
      const u = Math.min(1, t / this.duration);
      const swing = u < 0.55 ? u / 0.55 : 1 - (u - 0.55) / 0.45;
      return { bobY: 0, swayX: swing * 0.06, limbPhase: u, attackSwing: swing };
    },
  },
  cast: {
    id: "cast",
    duration: ANIM.cast,
    loop: false,
    keyframes: [
      { at: 0.2, hook: "onCastStart" },
      { at: 0.65, hook: "onHit" },
    ],
    sample(t) {
      const u = Math.min(1, t / this.duration);
      return { bobY: Math.sin(u * Math.PI) * -0.03, swayX: 0, limbPhase: u, castGlow: u };
    },
  },
  hit: {
    id: "hit",
    duration: ANIM.hit,
    loop: false,
    keyframes: [{ at: 0.05, hook: "onHurt" }],
    sample(t) {
      const u = Math.min(1, t / this.duration);
      const recoil = u < 0.3 ? u / 0.3 : 1 - (u - 0.3) / 0.7;
      return { bobY: 0, swayX: -recoil * 0.05, limbPhase: u };
    },
  },
  dash: {
    id: "dash",
    duration: ANIM.dash,
    loop: false,
    keyframes: [{ at: 1, hook: "onDashEnd" }],
    sample(t) {
      const u = Math.min(1, t / this.duration);
      return { bobY: -0.02, swayX: 0, limbPhase: u, moveProgress: u };
    },
  },
};

export function comboWindowMs(clipId, ratio = COMBO_RATIO) {
  const clip = CLIPS[clipId];
  if (!clip) return 0;
  return clip.duration * ratio;
}

/**
 * Lecteur d'animation piloté par scaledDt.
 */
export function createAnimator(onHook) {
  let current = null;
  let time = 0;
  let fired = new Set();

  return {
    get current() {
      return current;
    },
    get time() {
      return time;
    },
    get clip() {
      return current ? CLIPS[current] : null;
    },

    play(clipId) {
      if (!CLIPS[clipId]) throw new Error(`Unknown clip: ${clipId}`);
      current = clipId;
      time = 0;
      fired = new Set();
    },

    /**
     * @param {number} scaledDt
     * @returns {object|null} pose sample
     */
    update(scaledDt) {
      if (!current) return null;
      const clip = CLIPS[current];
      time += scaledDt;

      for (let i = 0; i < clip.keyframes.length; i++) {
        const kf = clip.keyframes[i];
        const atMs = kf.at * clip.duration;
        if (!fired.has(i) && time >= atMs) {
          fired.add(i);
          if (onHook) onHook(kf.hook, clip.id);
        }
      }

      if (time >= clip.duration) {
        if (clip.loop) {
          time = time % clip.duration;
          fired = new Set();
        } else {
          const pose = clip.sample(clip.duration);
          current = null;
          time = 0;
          return pose;
        }
      }

      return clip.sample(time);
    },

    sample() {
      if (!current) return CLIPS.idle.sample(0);
      return CLIPS[current].sample(Math.min(time, CLIPS[current].duration));
    },
  };
}
