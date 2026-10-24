/**
 * Blocs de combo du poing.
 * Chaque bloc part et revient sur la garde, donc tout enchaînement se pose.
 * Les champs anim, fps, slash, effect, enabled et delay des sorts restent ceux de l'éditeur.
 */
(function (root) {
  var BLOCKS = {
    jabL: { id: "jabL", label: "Direct G", anim: "Attack1", fps: 17, poseIn: "garde", poseOut: "garde", hand: "L", hit: true, reaction: "flinch" },
    jabR: { id: "jabR", label: "Direct D", anim: "Attack2", fps: 16, poseIn: "garde", poseOut: "garde", hand: "R", hit: true, reaction: "flinch" },
    hook: { id: "hook", label: "Crochet", anim: "Attack6", fps: 15, poseIn: "garde", poseOut: "garde", hand: "R", hit: true, reaction: "stagger" },
    uppercut: { id: "uppercut", label: "Uppercut", anim: "Special1", fps: 17, poseIn: "garde", poseOut: "garde", hand: "R", hit: true, effect: "Effect1", finisher: true, reaction: "launch" },
    bigKick: { id: "bigKick", label: "Grand coup de pied", anim: "Kick", fps: 14, poseIn: "garde", poseOut: "garde", hand: "R", hit: true, reaction: "knockback" },
    knee: { id: "knee", label: "Genou", anim: "Attack3", fps: 16, poseIn: "garde", poseOut: "garde", hand: "R", hit: true, reaction: "flinch" },
    dashIn: { id: "dashIn", label: "Dash", anim: "Slide", fps: 16, poseIn: "garde", poseOut: "garde", move: "dash", reaction: "" },
    leapIn: { id: "leapIn", label: "Bond", anim: "AttackRun", fps: 16, poseIn: "garde", poseOut: "garde", move: "leap", reaction: "" },
    explosion: { id: "explosion", label: "Explosion", anim: "Special1", fps: 14, poseIn: "garde", poseOut: "garde", finisher: true, fx: "explosion", effect: "Effect1", reaction: "blast" },
    shockwave: { id: "shockwave", label: "Onde", anim: "Attack5", fps: 16, poseIn: "garde", poseOut: "garde", finisher: true, fx: "shockwave", slash: "Slash1", reaction: "knockback" },
    projectile: { id: "projectile", label: "Projectile", anim: "Attack4", fps: 15, poseIn: "garde", poseOut: "garde", finisher: true, fx: "projectile", slash: "Slash2", reaction: "flinch" },
  };

  var OVERLAYS = {
    fire: { id: "fire", label: "Feu", element: "feu", where: "hands" },
    ice: { id: "ice", label: "Glace", element: "eau", where: "hands" },
    lightning: { id: "lightning", label: "Foudre", element: "air", where: "hands" },
  };

  var EFFECTS = {
    knockback: { id: "knockback", label: "Recul", push: 1 },
    multi: { id: "multi", label: "Multi", hits: 2 },
    dot: { id: "dot", label: "Brûlure", turns: 3 },
  };

  /** Listes par évolution de Coup brut. N'écrase pas l'animation déjà écrite. */
  var PUNCH_EVO = {
    "1:Brise-Os": { mode: "modify", blocks: ["jabR"], overlays: [], effects: [], reaction: "stagger" },
    "1:Boxeur": { mode: "append", blocks: ["jabR"], overlays: [], effects: [], reaction: "flinch" },
    "1:Rapide": { mode: "modify", blocks: ["bigKick"], overlays: [], effects: [], reaction: "knockback" },
    "2:Uppercut": { mode: "finish", blocks: ["uppercut"], overlays: [], effects: [], reaction: "launch" },
    "2:Percutant": { mode: "append", blocks: ["bigKick"], overlays: [], effects: ["knockback"], reaction: "knockback" },
    "2:Double Impact": { mode: "append", blocks: ["shockwave"], overlays: [], effects: ["multi"], reaction: "multi" },
    "3:Brasier": {
      enabled: false, anim: "Special1", slash: "None", effect: "Effect1", fps: 14, delay: 0,
      mode: "finish", blocks: ["explosion"], overlays: ["fire"], effects: [], reaction: "blast",
    },
    "3:Montante": {
      enabled: false, anim: "Special1", slash: "None", effect: "Effect1", fps: 17, delay: 0,
      mode: "finish", blocks: ["uppercut"], overlays: ["fire"], effects: [], reaction: "launch",
    },
    "3:Éclairs": {
      enabled: false, anim: "Special1", slash: "None", effect: "Effect3", fps: 15, delay: 0,
      mode: "append", blocks: [], overlays: ["lightning"], effects: ["dot"], reaction: "shock",
    },
  };

  var EXAMPLES = [
    { name: "Double coup", picks: [{ tier: 1, name: "Boxeur" }] },
    { name: "Repousse", picks: [{ tier: 1, name: "Boxeur" }, { tier: 2, name: "Percutant" }] },
    { name: "Feu · explosion", picks: [{ tier: 1, name: "Boxeur" }, { tier: 3, name: "Brasier" }] },
    { name: "Feu · uppercut", picks: [{ tier: 1, name: "Boxeur" }, { tier: 2, name: "Uppercut" }, { tier: 3, name: "Montante" }] },
  ];

  function copy(obj) {
    var out = {};
    if (!obj) return out;
    Object.keys(obj).forEach(function (k) { out[k] = obj[k]; });
    return out;
  }

  function blockById(id) {
    return BLOCKS[id] ? copy(BLOCKS[id]) : null;
  }

  function blockFromAnim(anim, fps) {
    var keys = Object.keys(BLOCKS);
    for (var i = 0; i < keys.length; i++) {
      var b = BLOCKS[keys[i]];
      if (b.anim === anim && !b.finisher) return Object.assign(copy(b), { fps: fps || b.fps });
    }
    return {
      id: "base", anim: anim || "Attack1", fps: fps || 17,
      poseIn: "garde", poseOut: "garde", hit: true, reaction: "flinch",
    };
  }

  function instantiate(id, entry) {
    var b = blockById(id);
    if (!b) return null;
    if (entry && entry.blocks && entry.blocks.length === 1) {
      if (entry.fps != null) b.fps = entry.fps;
      if (entry.slash && entry.slash !== "None") b.slash = entry.slash;
      if (entry.effect && entry.effect !== "None") b.effect = entry.effect;
    }
    if (entry && entry.reaction) b.reaction = entry.reaction;
    return b;
  }

  /** Ajoute les listes manquantes. Ne change pas anim, fps, slash, effect, enabled, delay. */
  function stamp(spell) {
    if (!spell || spell.id !== "punch") return false;
    if (!spell.evoConfig) spell.evoConfig = {};
    var changed = false;
    Object.keys(PUNCH_EVO).forEach(function (key) {
      var spec = PUNCH_EVO[key];
      var entry = spell.evoConfig[key];
      if (!entry) {
        spell.evoConfig[key] = copy(spec);
        spell.evoConfig[key].blocks = (spec.blocks || []).slice();
        spell.evoConfig[key].overlays = (spec.overlays || []).slice();
        spell.evoConfig[key].effects = (spec.effects || []).slice();
        changed = true;
        return;
      }
      if (entry.blocks == null) {
        entry.blocks = (spec.blocks || []).slice();
        entry.mode = entry.mode || spec.mode || "append";
        entry.overlays = entry.overlays || (spec.overlays || []).slice();
        entry.effects = entry.effects || (spec.effects || []).slice();
        changed = true;
      }
      if (entry.reaction == null && spec.reaction) {
        entry.reaction = spec.reaction;
        changed = true;
      }
    });
    return changed;
  }

  function entryFor(spell, pick) {
    if (!spell || !spell.evoConfig || !pick) return null;
    var key = pick.key || ((pick.tier | 0) + ":" + pick.name);
    return spell.evoConfig[key] || null;
  }

  function resolveCombo(spell, picks) {
    var baseAnim = "Attack1";
    var baseFps = 17;
    if (spell && spell.steps && spell.steps[0]) {
      baseAnim = spell.steps[0].anim || baseAnim;
      baseFps = spell.steps[0].fps != null ? spell.steps[0].fps : baseFps;
    }
    var steps = [blockFromAnim(baseAnim, baseFps)];
    var overlays = [];
    var effects = [];
    var looseReaction = "";
    (picks || []).forEach(function (pick) {
      var entry = entryFor(spell, pick);
      if (!entry) return;
      var mode = entry.mode || "append";
      var blocks = (entry.blocks || []).map(function (id) { return instantiate(id, entry); }).filter(Boolean);
      if (mode === "modify" && blocks.length) {
        steps.splice(Math.max(0, steps.length - 1), 1, blocks[0]);
        blocks.slice(1).forEach(function (b) { steps.push(b); });
      } else if (mode === "finish") {
        steps = steps.filter(function (s) { return !s.finisher; });
        blocks.forEach(function (b) {
          b.finisher = true;
          steps.push(b);
        });
      } else {
        blocks.forEach(function (b) { steps.push(b); });
        if (!blocks.length && entry.reaction) looseReaction = entry.reaction;
      }
      (entry.overlays || []).forEach(function (id) {
        overlays = overlays.filter(function (x) { return x !== id; });
        if (OVERLAYS[id]) overlays.push(id);
      });
      (entry.effects || []).forEach(function (id) {
        if (EFFECTS[id] && effects.indexOf(id) < 0) effects.push(id);
      });
    });
    var overlayId = overlays.length ? overlays[overlays.length - 1] : "";
    var overlay = overlayId ? OVERLAYS[overlayId] : null;
    var elementFx = "";
    if (overlay && overlay.element === "feu") elementFx = "burn";
    else if (overlay && overlay.element === "eau") elementFx = "frozen";
    else if (overlay && overlay.element === "air") elementFx = "shock";
    else if (looseReaction === "burn" || looseReaction === "frozen" || looseReaction === "shock") elementFx = looseReaction;
    steps.forEach(function (s) {
      if (!s.reaction && s.hit) s.reaction = "flinch";
      if (s.reaction) s.elementFx = elementFx;
    });
    var hits = 1;
    var push = 0;
    var turns = 0;
    effects.forEach(function (id) {
      var fx = EFFECTS[id];
      if (fx.hits) hits = fx.hits;
      if (fx.push) push = fx.push;
      if (fx.turns) turns = fx.turns;
    });
    return {
      steps: steps,
      overlays: overlays,
      overlay: overlay,
      effects: effects,
      element: overlay ? overlay.element : "",
      hits: hits,
      push: push,
      turns: turns,
    };
  }

  function chainIssues(steps) {
    var issues = [];
    if (!steps || !steps.length) return ["vide"];
    if (steps[0].poseIn !== "garde") issues.push("départ " + steps[0].id);
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      if (s.poseIn !== "garde" || s.poseOut !== "garde") issues.push("pose " + s.id);
      if (i > 0 && steps[i - 1].poseOut !== s.poseIn) issues.push("saut " + steps[i - 1].id + " → " + s.id);
    }
    if (steps[steps.length - 1].poseOut !== "garde") issues.push("fin " + steps[steps.length - 1].id);
    return issues;
  }

  function tiersOf(spell) {
    var map = {};
    Object.keys((spell && spell.evoConfig) || {}).forEach(function (key) {
      var tier = String(key).split(":")[0];
      if (!map[tier]) map[tier] = [];
      map[tier].push(key);
    });
    return Object.keys(map).sort().map(function (tier) { return map[tier].sort(); });
  }

  /** Un choix par palier, dans l'ordre. On peut s'arrêter avant le dernier palier. */
  function reachable(spell) {
    var tiers = tiersOf(spell);
    var chains = [[]];
    var frontier = [[]];
    tiers.forEach(function (options) {
      var next = [];
      frontier.forEach(function (prefix) {
        options.forEach(function (key) {
          var tier = Number(String(key).split(":")[0]);
          var name = String(key).split(":").slice(1).join(":");
          next.push(prefix.concat([{ tier: tier, name: name, key: key }]));
        });
      });
      frontier = next;
      chains = chains.concat(next);
    });
    return chains;
  }

  root.Combo = {
    BLOCKS: BLOCKS,
    OVERLAYS: OVERLAYS,
    EFFECTS: EFFECTS,
    PUNCH_EVO: PUNCH_EVO,
    EXAMPLES: EXAMPLES,
    blockById: blockById,
    stamp: stamp,
    resolveCombo: resolveCombo,
    chainIssues: chainIssues,
    reachable: reachable,
  };
})(typeof window !== "undefined" ? window : globalThis);
