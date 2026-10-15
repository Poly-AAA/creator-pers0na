/**
 * Réactions de la cible, sur les feuilles d'origine (TakeDamage, Die, Idle).
 * Elles partent à l'image d'impact et, sauf le K.O., reviennent à l'attente.
 */
(function (root) {
  var IMPACT_MS = 260;
  var BODY_MS = 740;

  var SHEETS = { TakeDamage: true, Die: true, Idle: true };

  /** Quatre directions iso, puis face ou dos. */
  var ISO = [
    { id: "E", dir: 0 },
    { id: "N", dir: 2 },
    { id: "O", dir: 4 },
    { id: "S", dir: 6 },
  ];

  var REACTIONS = {
    flinch: { id: "flinch", label: "Recul léger", sheet: "TakeDamage", kind: "hurt", strength: "light", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2], fps: 16, returnMs: 220, motion: "recoil", recoil: 3 },
    stagger: { id: "stagger", label: "Choc", sheet: "TakeDamage", kind: "hurt", strength: "heavy", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2, 3, 4, 5], fps: 12, returnMs: 420, motion: "recoil", recoil: 7 },
    launch: { id: "launch", label: "Décollage", sheet: "TakeDamage", kind: "hurt", strength: "launch", poseIn: "garde", poseOut: "garde", frames: [2, 3, 4, 5, 6], fps: 12, returnMs: 480, motion: "launch", lift: 16 },
    knockback: { id: "knockback", label: "Poussé", sheet: "TakeDamage", kind: "hurt", strength: "slide", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2, 3, 4], fps: 12, returnMs: 460, motion: "slide", recoil: 8, dust: true },
    burn: { id: "burn", label: "Brûlure", sheet: "TakeDamage", kind: "element", element: "feu", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2], fps: 14, returnMs: 280, motion: "recoil", recoil: 4, flames: true },
    frozen: { id: "frozen", label: "Gel", sheet: "TakeDamage", kind: "element", element: "eau", poseIn: "garde", poseOut: "garde", frames: [1, 2], fps: 8, returnMs: 360, motion: "slow", tint: "eau", slowed: true },
    shock: { id: "shock", label: "Éclair", sheet: "TakeDamage", kind: "element", element: "air", poseIn: "garde", poseOut: "garde", frames: [0, 2, 1, 3, 0], fps: 18, returnMs: 240, motion: "jitter", sparks: true },
    blast: { id: "blast", label: "Souffle", sheet: "TakeDamage", kind: "element", element: "feu", poseIn: "garde", poseOut: "garde", frames: [2, 3, 4, 5, 6], fps: 12, returnMs: 480, motion: "launch", lift: 14, flames: true, dust: true },
    dot: { id: "dot", label: "Tic", sheet: "TakeDamage", kind: "tick", poseIn: "garde", poseOut: "garde", frames: [0, 1], fps: 16, returnMs: 200, motion: "recoil", recoil: 2, tick: true },
    multi: { id: "multi", label: "Surcoup", sheet: "TakeDamage", kind: "hurt", strength: "light", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2], fps: 18, returnMs: 180, motion: "recoil", recoil: 3 },
    buff: { id: "buff", label: "Gain", sheet: "Idle", kind: "buff", poseIn: "garde", poseOut: "garde", frames: [0], fps: 8, returnMs: 400, motion: "lift", lift: 4, glow: "neutre", number: "buff" },
    heal: { id: "heal", label: "Soin", sheet: "Idle", kind: "buff", poseIn: "garde", poseOut: "garde", frames: [0], fps: 8, returnMs: 400, motion: "lift", lift: 5, glow: "heal", number: "heal" },
    shield: { id: "shield", label: "Égide", sheet: "Idle", kind: "buff", poseIn: "garde", poseOut: "garde", frames: [0], fps: 8, returnMs: 400, motion: "lift", lift: 4, glow: "shield", number: "shield" },
    block: { id: "block", label: "Parade", sheet: "TakeDamage", kind: "defense", poseIn: "garde", poseOut: "garde", frames: [0, 1], fps: 14, returnMs: 240, motion: "recoil", recoil: 1 },
    dodge: { id: "dodge", label: "Esquive", sheet: "TakeDamage", kind: "defense", poseIn: "garde", poseOut: "garde", frames: [0, 1, 2], fps: 16, returnMs: 280, motion: "sidestep", recoil: 6 },
    ko: { id: "ko", label: "K.O.", sheet: "Die", kind: "ko", poseIn: "garde", poseOut: "sol", frames: [0, 2, 4, 6, 8, 10, 12, 14], fps: 12, returnMs: 900, motion: "drop", lift: -6, hold: true },
  };

  var GEAR = ["NakedBody", "NakedBody2", "NakedBody3", "Head1", "Chest1", "Legs1", "Shoes1", "Melee1", "Shield1", "Shadow"];

  function copy(obj) {
    var out = {};
    Object.keys(obj || {}).forEach(function (k) { out[k] = obj[k]; });
    if (obj && obj.frames) out.frames = obj.frames.slice();
    return out;
  }

  function get(id) {
    return REACTIONS[id] ? copy(REACTIONS[id]) : null;
  }

  function forSpell(spell) {
    if (!spell) return "flinch";
    var effect = String(spell.effect || "");
    if (spell.heal || spell.type === "heal") return "heal";
    if (spell.type === "shield" || spell.id === "bouclier" || spell.id === "armure_nanites") return "shield";
    if (spell.type === "buff" || effect === "step") return "buff";
    if (effect === "push") return "knockback";
    if (effect === "roulade" || spell.id === "roulade") return "";
    if (spell.type === "damage" || spell.dmg) return "flinch";
    return "buff";
  }

  function compose(id, opts) {
    opts = opts || {};
    if (opts.ko) return get("ko");
    var spec = get(id) || get("flinch");
    var extra = opts.elementFx ? get(opts.elementFx) : null;
    if (extra && extra.kind === "element") {
      spec.flames = spec.flames || extra.flames;
      spec.tint = spec.tint || extra.tint;
      spec.sparks = spec.sparks || extra.sparks;
      spec.slowed = spec.slowed || extra.slowed;
      spec.element = extra.element || spec.element;
      spec.elementFx = extra.id;
    }
    spec.impactMs = IMPACT_MS;
    return spec;
  }

  /** Face : regarde le coup. Dos : le coup arrive dans le dos. */
  function sheetDir(facing, incoming) {
    var inc = incoming & 7;
    if (facing === "front") return (inc + 4) & 7;
    return inc;
  }

  function facingOf(targetDir, incoming) {
    var toward = (incoming + 4) & 7;
    var delta = Math.abs((targetDir & 7) - toward);
    if (delta > 4) delta = 8 - delta;
    return delta <= 1 ? "front" : "back";
  }

  function facingCases() {
    var out = [];
    ISO.forEach(function (iso) {
      ["front", "back"].forEach(function (facing) {
        out.push({
          iso: iso.id,
          incoming: iso.dir,
          facing: facing,
          sheetDir: sheetDir(facing, iso.dir),
        });
      });
    });
    return out;
  }

  function sample(spec, age, dir) {
    var ms = Math.max(1, spec.returnMs || 1);
    var u = Math.max(0, Math.min(1, (age * 1000) / ms));
    var env = spec.poseOut === "garde" ? Math.sin(u * Math.PI) : u;
    var sign = ((dir | 0) & 4) ? -1 : 1;
    var x = 0;
    var y = 0;
    if (spec.motion === "recoil" || spec.motion === "slide" || spec.motion === "sidestep") x = sign * (spec.recoil || 0) * env;
    if (spec.motion === "sidestep") x = sign * (spec.recoil || 0) * env;
    if (spec.motion === "launch") y = -((spec.lift || 0) * env);
    if (spec.motion === "lift") y = -((spec.lift || 0) * env);
    if (spec.motion === "drop") y = -((spec.lift || 0) * u);
    if (spec.motion === "jitter") {
      var j = env * 2;
      x = ((Math.floor(age * 40) % 2) ? 1 : -1) * j;
      y = ((Math.floor(age * 30) % 2) ? 1 : -1) * j * 0.5;
    }
    if (spec.poseOut === "garde" && u >= 1) { x = 0; y = 0; }
    return {
      x: x,
      y: y,
      env: env,
      flames: !!spec.flames && env > 0.05,
      sparks: !!spec.sparks && env > 0.05,
      dust: !!spec.dust && env > 0.05,
      tint: spec.tint || "",
      glow: spec.glow || "",
      slowed: !!spec.slowed,
      hold: !!spec.hold,
    };
  }

  function issues(spec) {
    var bad = [];
    if (!spec) return ["vide"];
    if (!SHEETS[spec.sheet]) bad.push("feuille " + spec.id);
    if (spec.poseIn !== "garde") bad.push("départ " + spec.id);
    if (spec.hold) {
      if (spec.poseOut !== "sol") bad.push("K.O. " + spec.id);
    } else if (spec.poseOut !== "garde") bad.push("fin " + spec.id);
    if (spec.impactMs != null && spec.impactMs !== IMPACT_MS) bad.push("impact " + spec.id);
    if (!spec.hold && spec.returnMs > BODY_MS) bad.push("trop long " + spec.id);
    if (!spec.frames || !spec.frames.length) bad.push("images " + spec.id);
    return bad;
  }

  function auditBlocks(blocks) {
    var bad = [];
    Object.keys(blocks || {}).forEach(function (id) {
      var b = blocks[id];
      if (!b.hit && !b.reaction) return;
      if (b.hit && !REACTIONS[b.reaction]) bad.push("bloc " + id);
    });
    return bad;
  }

  root.Reactions = {
    IMPACT_MS: IMPACT_MS,
    BODY_MS: BODY_MS,
    REACTIONS: REACTIONS,
    ISO: ISO,
    GEAR: GEAR,
    SHEETS: SHEETS,
    get: get,
    forSpell: forSpell,
    compose: compose,
    sheetDir: sheetDir,
    facingOf: facingOf,
    facingCases: facingCases,
    sample: sample,
    issues: issues,
    auditBlocks: auditBlocks,
  };
})(typeof window !== "undefined" ? window : globalThis);
