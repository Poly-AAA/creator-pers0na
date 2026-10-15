/**
 * Rythme des sorts, calqué sur une caméra iso 2:1 fixe.
 * Anticipation pieds plantés, impact sans images intermédiaires,
 * retour avec dépassement, puis l'attente. Les effets restent ensuite.
 */
(function (root) {
  var ANTICIPATE = 0.26;
  var IMPACT = 0.08;
  var RECOVER = 0.4;
  var LINGER = 0.5;
  var BODY = ANTICIPATE + IMPACT + RECOVER;

  var COLORS = {
    feu: [226, 74, 42],
    fire: [226, 74, 42],
    eau: [46, 120, 200],
    water: [46, 120, 200],
    air: [110, 124, 255],
    terre: [140, 106, 46],
    earth: [140, 106, 46],
    neutre: [232, 215, 176],
    neutral: [232, 215, 176],
  };

  var NUM = {
    damage: [210, 48, 42],
    shield: [58, 120, 210],
    heal: [46, 154, 85],
  };

  function elementColor(element) {
    var key = String(element || "neutre").toLowerCase();
    return COLORS[key] || COLORS.neutre;
  }

  function motionKind(spell) {
    var effect = String((spell && spell.effect) || "").toLowerCase();
    var anim = "";
    if (spell) {
      anim = spell.anim || "";
      if (!anim && spell.steps && spell.steps[0]) anim = spell.steps[0].anim || "";
    }
    if (effect === "roulade" || /rolling|slide/i.test(anim)) return "dash";
    if (/attackrun/i.test(anim)) return "leap";
    if (effect === "summon" || effect === "glyph" || effect === "trap" || (spell && spell.type === "summon")) return "summon";
    return "strike";
  }

  /** Colonne de feuille. L'impact saute à l'image forte : pas d'entre-deux. */
  function castColumn(elapsed, cols) {
    cols = cols || 15;
    if (elapsed >= BODY) return { col: 0, phase: "idle", idle: true, smear: false, overshoot: false };
    if (elapsed < ANTICIPATE) {
      var u = elapsed / ANTICIPATE;
      return { col: Math.min(3, Math.floor(u * 4)), phase: "anticipate", idle: false, smear: false, overshoot: false };
    }
    if (elapsed < ANTICIPATE + IMPACT) {
      return { col: Math.min(cols - 1, 6), phase: "impact", idle: false, smear: true, overshoot: false };
    }
    var v = (elapsed - ANTICIPATE - IMPACT) / RECOVER;
    var eased = 1 - (1 - v) * (1 - v);
    var col = 8 + Math.floor(eased * Math.max(0, cols - 9));
    return {
      col: Math.min(cols - 1, col),
      phase: "recover",
      idle: false,
      smear: false,
      overshoot: v > 0.7 && v < 0.92,
    };
  }

  function travel(kind, u) {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    if (kind === "knock") return u;
    if (kind === "dash") {
      if (u < 0.22) return u * 0.25;
      if (u < 0.62) return 0.055 + ((u - 0.22) / 0.4) * 0.82;
      return 0.875 + ((u - 0.62) / 0.38) * 0.125;
    }
    return u * u * (3 - 2 * u);
  }

  function leapLift(u) {
    return 4 * u * (1 - u) * 1.15;
  }

  function landSquash(u) {
    if (u < 0.88) return { x: 1, y: 1 };
    var s = Math.sin(Math.min(1, (u - 0.88) / 0.12) * Math.PI);
    return { x: 1 + s * 0.14, y: 1 - s * 0.18 };
  }

  function numberMotion(age, hitIndex) {
    var i = hitIndex || 0;
    var side = i % 2 ? 1 : -1;
    var scatter = i ? side * (8 + (i % 3) * 5) : 0;
    var scale = 1;
    if (age < 0.08) scale = 0.35 + (age / 0.08) * 0.95;
    else if (age < 0.16) scale = 1.3 - ((age - 0.08) / 0.08) * 0.3;
    var y = age > 0.22 ? (age - 0.22) * 46 : 0;
    var alpha = age > 0.38 ? Math.max(0, 1 - (age - 0.38) / 0.34) : 1;
    return {
      scale: scale,
      alpha: alpha,
      y: y,
      x: scatter * Math.min(1, age / 0.1),
      alive: age < 0.74 && alpha > 0,
    };
  }

  function lean(dir, phase) {
    var table = [
      [1, 0], [0.7, -0.5], [0, -1], [-0.7, -0.5],
      [-1, 0], [-0.7, 0.5], [0, 1], [0.7, 0.5],
    ];
    var v = table[(dir | 0) & 7];
    var mag = phase === "impact" ? 9 : phase === "recover" ? 3 : 0;
    return { x: v[0] * mag, y: v[1] * mag * 0.5 };
  }

  /** Hauteur du corps ≈ 1,75 tuile (entre 1,5 et 2). */
  function tileScale(tileH, bodyPx) {
    return (1.75 * tileH) / bodyPx;
  }

  root.CastFeel = {
    ANTICIPATE: ANTICIPATE,
    IMPACT: IMPACT,
    RECOVER: RECOVER,
    LINGER: LINGER,
    BODY: BODY,
    BODY_MS: Math.round(BODY * 1000),
    IMPACT_AT_MS: Math.round(ANTICIPATE * 1000),
    COLORS: COLORS,
    NUM: NUM,
    elementColor: elementColor,
    motionKind: motionKind,
    castColumn: castColumn,
    travel: travel,
    leapLift: leapLift,
    landSquash: landSquash,
    numberMotion: numberMotion,
    lean: lean,
    tileScale: tileScale,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
