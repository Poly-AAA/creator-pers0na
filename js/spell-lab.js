/**
 * Atelier de sorts — même format que l’éditeur et le combat fantasy.
 *
 * Un sort = identité + steps (anims chaînées) + evoConfig (évolutions du jeu).
 * Les évolutions appliquent les mêmes bonus que FantasyBridge.EVO_TREE
 * (dégâts, portée, coût, poussée, hits, zone, soin, drain) et activent
 * l’entrée d’anim/FX correspondante.
 *
 * Node (ESM) : import { generateCatalog } from "./js/spell-lab.js"
 */

export const ALL_ANIMS = [
  "Idle", "Walk", "Run", "Rolling", "Slide",
  "Attack1", "Attack2", "Attack3", "Attack4", "Attack5", "Attack6",
  "AttackRun", "AttackRun2", "Kick", "Special1", "Taunt",
  "RideIdleAttack1", "RideRunAttack1", "TakeDamage", "Die",
];

export const CAST_ANIMS = [
  "Attack1", "Attack2", "Attack3", "Attack4", "Attack5", "Attack6",
  "AttackRun", "AttackRun2", "Kick", "Special1", "Taunt", "Rolling", "Slide",
];

export const FX_SLASH = ["None", "Slash1", "Slash2"];
export const FX_EFFECT = ["None", "Effect1", "Effect2", "Effect3", "Effect4", "Effect5"];

const TYPES = new Set(["damage", "heal", "shield", "buff", "clone", "summon"]);
const EFFECTS = new Set(["", "none", "push", "roulade", "drainPA", "drainPM", "glyph", "trap", "summon"]);

/**
 * Arbres d’évolution — mêmes noms, anims et bonus que js/fantasy-combat-bridge.js.
 * Un seul choix par palier (règle du combat).
 */
export const EVO_TREES = {
  punch: {
    1: [
      { name: "Brise-Os", d: "+4 dégâts.", anim: "Attack2", fx: null, bonus: { dmg: 4 } },
      { name: "Boxeur", d: "+1 portée.", anim: "Attack1", fx: "Slash1", bonus: { range: 1 } },
      { name: "Rapide", d: "-1 PA.", anim: "Kick", fx: null, bonus: { cost: -1 } },
    ],
    2: [
      { name: "Percutant", d: "Repousse +1.", anim: "Attack3", fx: "Slash1", bonus: { push: 1 } },
      { name: "Double Impact", d: "Frappe 2 fois.", anim: "Attack4", fx: "Slash2", bonus: { hits: 1 } },
      { name: "Uppercut", d: "+3 dégâts.", anim: "Special1", fx: "Effect1", bonus: { dmg: 3 } },
    ],
  },
  arc: {
    1: [
      { name: "Chaîne", d: "+1 rebond.", anim: "Attack1", fx: "Effect1", bonus: { chain: 1 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, bonus: { cost: -1 } },
      { name: "Saturation", d: "+2 dégâts.", anim: "Attack5", fx: "Effect2", bonus: { dmg: 2 } },
    ],
    2: [
      { name: "Paralysie", d: "Drain PA.", anim: "Special1", fx: "Effect3", bonus: { drain: 1 } },
      { name: "Conducteur", d: "+3 dégâts.", anim: "Attack6", fx: "Effect4", bonus: { dmg: 3 } },
      { name: "Orage", d: "+1 AoE.", anim: "Attack3", fx: "Effect5", bonus: { aoe: 1 } },
    ],
  },
  dash: {
    1: [
      { name: "Élan", d: "+2 portée.", anim: "AttackRun", fx: null, bonus: { range: 2 } },
      { name: "Bélier", d: "+5 dégâts.", anim: "AttackRun2", fx: "Slash1", bonus: { dmg: 5 } },
      { name: "Percussion", d: "Poussée +1.", anim: "Kick", fx: "Slash2", bonus: { push: 1 } },
    ],
    2: [
      { name: "Transperçant", d: "+pierce.", anim: "AttackRun2", fx: "Effect1", bonus: { pierce: 1 } },
      { name: "Onde de choc", d: "+1 AoE.", anim: "Special1", fx: "Effect3", bonus: { aoe: 1 } },
      { name: "Relance", d: "+2 dégâts.", anim: "AttackRun", fx: "Slash2", bonus: { dmg: 2 } },
    ],
  },
  surchauffe: {
    1: [
      { name: "Brûlure", d: "+4 dégâts.", anim: "Attack5", fx: "Effect2", bonus: { dmg: 4 } },
      { name: "Longue portée", d: "+1 portée.", anim: "Attack3", fx: "Effect1", bonus: { range: 1 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, bonus: { cost: -1 } },
    ],
    2: [
      { name: "Fusion", d: "+5 dégâts.", anim: "Special1", fx: "Effect4", bonus: { dmg: 5 } },
      { name: "Fournaise", d: "+8 dégâts.", anim: "Attack6", fx: "Effect5", bonus: { dmg: 8 } },
      { name: "Brasier élargi", d: "+1 AoE.", anim: "Attack5", fx: "Effect3", bonus: { aoe: 1 } },
    ],
  },
  tir_magnetique: {
    1: [
      { name: "Précision", d: "+3 dégâts.", anim: "Attack1", fx: "Effect1", bonus: { dmg: 3 } },
      { name: "Recul", d: "Push +1.", anim: "Attack3", fx: "Slash1", bonus: { push: 1 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, bonus: { cost: -1 } },
    ],
    2: [
      { name: "Perforant", d: "+pierce.", anim: "Attack4", fx: "Effect2", bonus: { pierce: 1 } },
      { name: "Longue vue", d: "+1 portée.", anim: "Attack1", fx: "Effect3", bonus: { range: 1 } },
      { name: "Salve", d: "2 hits.", anim: "Attack6", fx: "Slash2", bonus: { hits: 1 } },
    ],
  },
  nanites: {
    1: [
      { name: "Réparation", d: "+6 soin.", anim: "Special1", fx: "Effect1", bonus: { heal: 6 } },
      { name: "Diffusion", d: "+1 portée.", anim: "Attack3", fx: "Effect2", bonus: { range: 1 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack1", fx: null, bonus: { cost: -1 } },
    ],
    2: [
      { name: "Régénération", d: "+12 soin.", anim: "Special1", fx: "Effect3", bonus: { heal: 12 } },
      { name: "Surcadence", d: "-1 PA, +5 soin.", anim: "Attack5", fx: "Effect4", bonus: { cost: -1, heal: 5 } },
      { name: "Bénédiction", d: "+8 soin, +1 portée.", anim: "Taunt", fx: "Effect5", bonus: { heal: 8, range: 1 } },
    ],
  },
  bouclier: {
    1: [
      { name: "Renfort", d: "+8 soin.", anim: "Special1", fx: "Effect1", bonus: { heal: 8 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack5", fx: null, bonus: { cost: -1 } },
      { name: "Durée", d: "+1 tour bouclier.", anim: "Taunt", fx: "Effect2", bonus: { shieldTurns: 1 } },
    ],
    2: [
      { name: "Égide sacrée", d: "+12 soin.", anim: "Special1", fx: "Effect3", bonus: { heal: 12 } },
      { name: "Riposte", d: "Thorns 4.", anim: "Attack3", fx: "Slash1", bonus: { thorns: 4 } },
      { name: "Rempart", d: "+16 bouclier.", anim: "Attack5", fx: "Effect4", bonus: { shield: 16 } },
    ],
  },
  mine: {
    1: [
      { name: "Charge", d: "+6 dégâts.", anim: "Kick", fx: "Effect1", bonus: { dmg: 6 } },
      { name: "Capteur", d: "+1 portée.", anim: "Attack2", fx: null, bonus: { range: 1 } },
      { name: "Économe", d: "-1 PA.", anim: "Attack1", fx: null, bonus: { cost: -1 } },
    ],
    2: [
      { name: "Zone", d: "+1 AoE.", anim: "Special1", fx: "Effect2", bonus: { aoe: 1 } },
      { name: "Aimant", d: "+push.", anim: "Attack4", fx: "Effect3", bonus: { push: 1 } },
      { name: "Immobilise", d: "Tag stun.", anim: "Kick", fx: "Slash1", bonus: { stun: 1 } },
    ],
  },
};

const RECIPES = [
  { role: "melee", type: "damage", evo: "punch", cost: 2, range: 1, dmg: [8, 12], anims: ["Attack1", "Attack2"], effect: "" },
  { role: "melee", type: "damage", evo: "punch", cost: 3, range: 1, dmg: [11, 16], anims: ["Attack3", "Kick"], effect: "" },
  { role: "melee", type: "damage", evo: "mine", cost: 3, range: 1, dmg: [10, 15], anims: ["Kick", "Attack6"], effect: "push", push: 1 },
  { role: "ranged", type: "damage", evo: "tir_magnetique", cost: 3, range: 4, dmg: [9, 13], anims: ["Attack1"], effect: "" },
  { role: "ranged", type: "damage", evo: "arc", cost: 4, range: 5, dmg: [11, 16], anims: ["Attack5", "Special1"], effect: "" },
  { role: "ranged", type: "damage", evo: "dash", cost: 3, range: 3, dmg: [9, 14], anims: ["AttackRun", "Attack3"], effect: "" },
  { role: "aoe", type: "damage", evo: "surchauffe", cost: 4, range: 3, dmg: [8, 12], aoe: 1, anims: ["Attack5", "Special1"], effect: "" },
  { role: "aoe", type: "damage", evo: "arc", cost: 5, range: 4, dmg: [10, 14], aoe: 1, anims: ["Special1"], effect: "" },
  { role: "control", type: "damage", evo: "arc", cost: 4, range: 4, dmg: [7, 11], anims: ["Attack3", "Special1"], effect: "drainPA" },
  { role: "control", type: "damage", evo: "dash", cost: 4, range: 2, dmg: [8, 12], anims: ["AttackRun2", "Kick"], effect: "push", push: 1 },
  { role: "mobility", type: "buff", evo: "punch", cost: 3, range: 2, dmg: [0, 0], anims: ["Rolling"], effect: "roulade" },
  { role: "mobility", type: "damage", evo: "dash", cost: 2, range: 3, dmg: [6, 9], anims: ["Slide", "AttackRun"], effect: "" },
  { role: "heal", type: "heal", evo: "nanites", cost: 3, range: 0, heal: [12, 16], anims: ["Special1"], effect: "" },
  { role: "heal", type: "heal", evo: "nanites", cost: 4, range: 0, heal: [18, 24], anims: ["Taunt", "Special1"], effect: "" },
  { role: "shield", type: "shield", evo: "bouclier", cost: 3, range: 0, heal: [8, 12], anims: ["Special1"], effect: "" },
  { role: "shield", type: "shield", evo: "bouclier", cost: 4, range: 0, heal: [10, 14], anims: ["Taunt"], effect: "" },
  { role: "summon", type: "summon", evo: "mine", cost: 4, range: 2, dmg: [6, 9], anims: ["Special1", "Attack3"], effect: "summon", overlay: "squelette", element: "neutre" },
  { role: "control", type: "damage", evo: "arc", cost: 3, range: 4, dmg: [6, 9], anims: ["Special1"], effect: "drainPM", overlay: "spectre", element: "air" },
  { role: "aoe", type: "damage", evo: "surchauffe", cost: 4, range: 3, dmg: [7, 11], aoe: 1, anims: ["Attack5", "Special1"], effect: "glyph", overlay: "spectre", element: "feu" },
  { role: "control", type: "damage", evo: "mine", cost: 3, range: 3, dmg: [8, 12], anims: ["Kick", "Special1"], effect: "trap", overlay: "squelette", element: "terre" },
];

const NOUNS = {
  melee: ["Frappe", "Entaille", "Uppercut", "Estoc", "Morsure", "Talon"],
  ranged: ["Trait", "Éclair", "Flèche", "Rayon", "Dard", "Salve"],
  aoe: ["Brasier", "Orbe", "Onde", "Nuée", "Tempête", "Fournaise"],
  control: ["Entrave", "Poussée", "Maléfice", "Emprise", "Répulsion", "Lien"],
  mobility: ["Roulade", "Glissade", "Bond", "Élan", "Pas", "Charge"],
  heal: ["Baume", "Lueur", "Soin", "Ondée", "Grâce", "Sève"],
  shield: ["Égide", "Rempart", "Carapace", "Aurore", "Mur", "Bulle"],
  summon: ["Ossuaire", "Spectre", "Glyphe", "Piège", "Ombre", "Relique"],
};
const ADJECTIVES = ["runique", "magique", "sombre", "rouge", "rapide", "funeste", "lunaire", "solaire", "fragile", "calme"];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function clampInt(n, lo, hi, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function splitFx(fx) {
  if (!fx) return { slash: "None", effect: "None" };
  if (/^Slash/i.test(fx)) return { slash: fx, effect: "None" };
  if (/^Effect/i.test(fx)) return { slash: "None", effect: fx };
  return { slash: "None", effect: "None" };
}

export function evoKey(tier, name) {
  return String(tier) + ":" + name;
}

/** Chaîne d’animations → steps du format éditeur. */
export function combineAnimations(anims, extras) {
  const opt = extras || {};
  const list = (anims && anims.length ? anims : ["Attack1"]).filter((a) => ALL_ANIMS.includes(a));
  const seq = list.length ? list : ["Attack1"];
  return seq.map((anim, i) => {
    const step = {
      anim,
      move: i === 0 ? "Idle" : (opt.move && ALL_ANIMS.includes(opt.move) ? opt.move : "Idle"),
      slash: FX_SLASH.includes(opt.slash) ? opt.slash : "None",
      effect: FX_EFFECT.includes(opt.effect) ? opt.effect : "None",
      delay: i === 0 ? 0 : clampInt(opt.delay != null ? opt.delay : 40 + i * 20, 0, 3000, 40),
      fps: clampInt(opt.fps != null ? opt.fps : 14, 1, 30, 14),
      hitTarget: i === seq.length - 1 && opt.hit !== false && !/Rolling|Slide|Taunt/.test(anim),
    };
    if (opt.overlay === "squelette" || opt.overlay === "spectre") step.overlay = opt.overlay;
    return step;
  });
}

function blankEvoConfig(archetype) {
  const tree = EVO_TREES[archetype] || EVO_TREES.punch;
  const cfg = {};
  [1, 2].forEach((tier) => {
    (tree[tier] || []).forEach((ch) => {
      const fx = splitFx(ch.fx);
      cfg[evoKey(tier, ch.name)] = {
        enabled: false,
        anim: ch.anim || "Attack1",
        slash: fx.slash,
        effect: fx.effect,
        fps: 14,
        delay: 0,
      };
    });
  });
  return cfg;
}

function findChoice(archetype, tier, name) {
  const tree = EVO_TREES[archetype];
  if (!tree || !tree[tier]) return null;
  return tree[tier].find((c) => c.name === name) || null;
}

/**
 * Applique 1 choix par palier : bonus chiffrés dans le sort + case anim cochée.
 * Ne double pas les dégâts quand le bonus est « hits » (le combat lit Double Impact / Salve / Déchirure).
 */
export function applyUpgrades(spell, picks) {
  const arch = spell.evoArchetype && EVO_TREES[spell.evoArchetype] ? spell.evoArchetype : "punch";
  spell.evoArchetype = arch;
  if (!spell.evoConfig) spell.evoConfig = blankEvoConfig(arch);
  spell.upgrades = [];
  const usedTier = new Set();
  (picks || []).forEach((p) => {
    if (!p || usedTier.has(p.tier)) return;
    const ch = findChoice(arch, p.tier, p.name);
    if (!ch) return;
    usedTier.add(p.tier);
    const key = evoKey(p.tier, ch.name);
    const fx = splitFx(ch.fx);
    spell.evoConfig[key] = {
      enabled: true,
      anim: ch.anim || "Attack1",
      slash: fx.slash,
      effect: fx.effect,
      fps: 15,
      delay: 0,
    };
    const b = ch.bonus || {};
    if (b.dmg) {
      if (!Array.isArray(spell.dmg)) spell.dmg = [0, 0];
      spell.dmg = [spell.dmg[0] + b.dmg, spell.dmg[1] + b.dmg];
    }
    if (b.range) spell.range = (spell.range | 0) + b.range;
    if (b.cost) spell.cost = (spell.cost | 0) + b.cost;
    if (b.push) {
      spell.effect = spell.effect && spell.effect !== "none" && spell.effect !== "roulade" ? spell.effect : "push";
      if (spell.effect === "push") spell.push = (spell.push | 0) + b.push;
    }
    if (b.aoe) spell.aoe = (spell.aoe | 0) + b.aoe;
    if (b.heal) {
      if (!Array.isArray(spell.heal)) spell.heal = [0, 0];
      spell.heal = [spell.heal[0] + b.heal, spell.heal[1] + b.heal];
    }
    if (b.shield) spell.shield = (spell.shield | 0) + b.shield;
    if (b.drain) spell.effect = "drainPA";
    spell.upgrades.push(key);
  });
  return spell;
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function hitCount(spell) {
  const cfg = (spell && spell.evoConfig) || {};
  const keys = ["2:Double Impact", "2:Déchirure", "2:Salve"];
  for (const k of keys) {
    if (cfg[k] && cfg[k].enabled) return 2;
  }
  return 1;
}

export function avgAmount(pair) {
  if (!Array.isArray(pair) || pair.length < 2) return 0;
  return ((Number(pair[0]) || 0) + (Number(pair[1]) || 0)) / 2;
}

/** Dégâts moyens par PA, en tenant compte de la double frappe. */
export function damagePerCost(spell) {
  if (!spell || spell.type === "heal" || spell.type === "shield" || spell.effect === "roulade") return 0;
  if (!spell.dmg) return 0;
  const cost = Math.max(1, spell.cost | 0);
  return (avgAmount(spell.dmg) * hitCount(spell)) / cost;
}

export function generateCatalog(options) {
  const opt = options || {};
  const count = opt.count != null ? opt.count : 72;
  const rng = mulberry32(opt.seed != null ? opt.seed : 20261014);
  const spells = [];
  const seenNames = new Set();
  for (let i = 0; i < count; i++) {
    const recipe = RECIPES[i % RECIPES.length];
    const noun = NOUNS[recipe.role][i % NOUNS[recipe.role].length];
    const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
    let name = titleCase(noun) + " " + adj;
    if (seenNames.has(name)) name = name + " " + (i + 1);
    seenNames.add(name);
    const animPool = CAST_ANIMS.filter((a) => recipe.role === "mobility" ? /Rolling|Slide|AttackRun|Kick/.test(a) : !/Rolling|Slide|Die|TakeDamage|Idle/.test(a));
    const nSteps = recipe.anims.length + (rng() < 0.35 ? 1 : 0);
    const anims = [];
    for (let s = 0; s < Math.min(3, nSteps); s++) {
      anims.push(s < recipe.anims.length ? recipe.anims[s] : pick(rng, animPool));
    }
    const slash = rng() < 0.45 ? pick(rng, ["Slash1", "Slash2"]) : "None";
    const fx = rng() < 0.4 ? pick(rng, FX_EFFECT.filter((x) => x !== "None")) : "None";
    const overlay = recipe.overlay || (rng() < 0.12 ? (rng() < 0.5 ? "squelette" : "spectre") : null);
    const ELEMENTS = ["terre", "feu", "eau", "air", "neutre"];
    const element = recipe.element || ELEMENTS[i % ELEMENTS.length];
    const spell = {
      id: "gen_" + String(i + 1).padStart(3, "0"),
      name,
      cost: recipe.cost + (rng() < 0.25 ? 1 : 0),
      range: recipe.range,
      dmg: recipe.dmg ? recipe.dmg.slice() : [0, 0],
      anim: anims[0],
      type: recipe.type,
      aoe: recipe.aoe || 0,
      animSeq: anims.slice(),
      effect: recipe.effect || "",
      push: recipe.push || 0,
      element,
      overlay,
      rare: recipe.rare || false,
      desc: name + " — " + recipe.role + ", anims " + anims.join(" → "),
      steps: combineAnimations(anims, { slash, effect: fx, fps: 12 + Math.floor(rng() * 8), hit: recipe.type === "damage" || recipe.type === "summon", overlay }),
      evoArchetype: recipe.evo,
      role: recipe.role,
      generated: true,
      equipped: false,
    };
    if (recipe.heal) spell.heal = recipe.heal.slice();
    if (recipe.type === "shield") spell.shield = 8 + Math.floor(rng() * 6);
    const tree = EVO_TREES[recipe.evo];
    const picks = [];
    if (rng() < 0.85) picks.push({ tier: 1, name: pick(rng, tree[1]).name });
    if (rng() < 0.7) picks.push({ tier: 2, name: pick(rng, tree[2]).name });
    if (!picks.length) picks.push({ tier: 1, name: tree[1][0].name });
    applyUpgrades(spell, picks);
    spells.push(spell);
  }
  const starterRoles = ["melee", "ranged", "heal"];
  starterRoles.forEach((role) => {
    const s = spells.find((x) => x.role === role);
    if (s) s.equipped = true;
  });
  return spells;
}

export function validateSpell(input) {
  const errors = [];
  if (!input || typeof input !== "object") return { ok: false, errors: ["sort vide"], spell: null };
  const spell = JSON.parse(JSON.stringify(input));
  if (!spell.id || typeof spell.id !== "string") errors.push("id manquant");
  if (!spell.name || typeof spell.name !== "string") errors.push("nom manquant");
  if (!TYPES.has(spell.type)) errors.push("type invalide");
  spell.cost = clampInt(spell.cost, 1, 8, 2);
  spell.range = clampInt(spell.range, 0, 8, 1);
  spell.aoe = clampInt(spell.aoe || 0, 0, 3, 0);
  if (spell.effect == null) spell.effect = "";
  if (!EFFECTS.has(spell.effect)) errors.push("effet invalide");
  if (spell.effect === "none") spell.effect = "";
  if (spell.effect === "push") spell.push = clampInt(spell.push != null ? spell.push : 1, 1, 4, 1);
  if (spell.effect === "roulade") {
    spell.type = "buff";
    spell.range = Math.max(1, spell.range);
    spell.dmg = [0, 0];
  }
  if (!Array.isArray(spell.steps) || !spell.steps.length) {
    const seq = Array.isArray(spell.animSeq) && spell.animSeq.length ? spell.animSeq : [spell.anim || "Attack1"];
    spell.steps = combineAnimations(seq, { hit: spell.type === "damage" });
  }
  spell.steps = spell.steps.map((st) => {
    const anim = st && ALL_ANIMS.includes(st.anim) ? st.anim : "Attack1";
    return {
      anim,
      move: st && ALL_ANIMS.includes(st.move) ? st.move : "Idle",
      slash: st && FX_SLASH.includes(st.slash) ? st.slash : "None",
      effect: st && FX_EFFECT.includes(st.effect) ? st.effect : "None",
      delay: clampInt(st && st.delay, 0, 3000, 0),
      fps: clampInt(st && st.fps, 1, 30, 14),
      hitTarget: !!(st && st.hitTarget),
    };
  });
  spell.anim = spell.steps[0].anim;
  spell.animSeq = spell.steps.map((s) => s.anim);
  if (spell.type === "damage" || (spell.dmg && spell.effect !== "roulade" && spell.type !== "heal" && spell.type !== "shield")) {
    if (!Array.isArray(spell.dmg) || spell.dmg.length < 2) spell.dmg = [6, 10];
    let lo = clampInt(spell.dmg[0], 0, 80, 6);
    let hi = clampInt(spell.dmg[1], 0, 80, 10);
    if (hi < lo) hi = lo;
    spell.dmg = [lo, hi];
    if (spell.type === "damage" && hi <= 0 && spell.effect !== "roulade") errors.push("dégâts nuls");
  }
  if (spell.type === "heal" || spell.type === "shield") {
    if (!Array.isArray(spell.heal) || spell.heal.length < 2) spell.heal = spell.type === "shield" ? [8, 12] : [12, 16];
    let lo = clampInt(spell.heal[0], 1, 60, 10);
    let hi = clampInt(spell.heal[1], 1, 60, 14);
    if (hi < lo) hi = lo;
    spell.heal = [lo, hi];
    spell.range = 0;
  }
  if (!spell.evoArchetype || !EVO_TREES[spell.evoArchetype]) spell.evoArchetype = "punch";
  if (!spell.evoConfig || typeof spell.evoConfig !== "object") spell.evoConfig = blankEvoConfig(spell.evoArchetype);
  const dpc = damagePerCost(spell);
  if (spell.type === "damage" && (!Number.isFinite(dpc) || dpc <= 0)) errors.push("ratio dégâts/coût invalide");
  if (spell.type === "damage" && spell.range <= 0 && spell.effect !== "roulade") errors.push("sort de dégâts sans portée");
  return { ok: errors.length === 0, errors, spell };
}

const GRID = 10;

export function chebyshev(a, b) {
  return Math.max(Math.abs(a.c - b.c), Math.abs(a.r - b.r));
}

function inBounds(c, r) {
  return c >= 0 && r >= 0 && c < GRID && r < GRID;
}

function rollPair(rng, pair) {
  const lo = pair[0] | 0;
  const hi = pair[1] | 0;
  if (hi <= lo) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function stepToward(ent, target, blocked) {
  const opts = [];
  if (ent.c !== target.c) opts.push({ c: ent.c + Math.sign(target.c - ent.c), r: ent.r });
  if (ent.r !== target.r) opts.push({ c: ent.c, r: ent.r + Math.sign(target.r - ent.r) });
  opts.sort((a, b) => chebyshev(a, target) - chebyshev(b, target));
  for (const o of opts) {
    if (!inBounds(o.c, o.r)) continue;
    if (blocked && blocked.c === o.c && blocked.r === o.r) continue;
    ent.c = o.c;
    ent.r = o.r;
    return true;
  }
  return false;
}

function stepAway(ent, from, blocked) {
  const opts = [
    { c: ent.c + 1, r: ent.r },
    { c: ent.c - 1, r: ent.r },
    { c: ent.c, r: ent.r + 1 },
    { c: ent.c, r: ent.r - 1 },
  ].filter((o) => inBounds(o.c, o.r) && !(blocked && blocked.c === o.c && blocked.r === o.r));
  opts.sort((a, b) => chebyshev(b, from) - chebyshev(a, from));
  if (!opts.length) return false;
  if (chebyshev(opts[0], from) <= chebyshev(ent, from)) return false;
  ent.c = opts[0].c;
  ent.r = opts[0].r;
  return true;
}

function pushAway(target, from, cells, blocked) {
  let n = 0;
  for (let i = 0; i < cells; i++) {
    if (!stepAway(target, from, blocked)) break;
    n++;
  }
  return n;
}

export const REFERENCE_PUNCH = {
  id: "punch",
  name: "Coup brut",
  cost: 2,
  range: 1,
  dmg: [8, 12],
  anim: "Attack2",
  type: "damage",
  aoe: 0,
  effect: "",
  steps: [{ anim: "Attack1", move: "Idle", slash: "None", effect: "None", delay: 0, fps: 17, hitTarget: true }],
  evoConfig: {},
  role: "melee",
};

function spellView(spell) {
  const cost = clampInt(spell.cost, 1, 8, 2);
  const range = clampInt(spell.range, 0, 8, 1);
  return { cost, range, hits: hitCount(spell) };
}

/**
 * Score d’un sort selon l’état et la politique (poids par id + biais de situation).
 */
export function scoreSpell(spell, self, foe, policy) {
  const pol = policy || {};
  const w = pol.weights && typeof pol.weights[spell.id] === "number" ? pol.weights[spell.id] : 1;
  const view = spellView(spell);
  if (self.pa < view.cost) return -1;
  const dist = chebyshev(self, foe);
  const hp = self.pv / Math.max(1, self.pvMax);
  if (spell.type === "heal" || (spell.heal && spell.type !== "shield" && spell.type !== "damage")) {
    return (1 - hp) * 48 * w * (pol.healBias != null ? pol.healBias : 1);
  }
  if (spell.type === "shield") {
    if (self.shield > 8) return (1 - hp) * 4 * w;
    return (1 - hp) * 30 * w * (pol.healBias != null ? pol.healBias : 1);
  }
  if (spell.effect === "roulade") {
    const want = dist > 1 ? 14 : 5;
    return want * w * (pol.mobilityBias != null ? pol.mobilityBias : 1);
  }
  if (!spell.dmg || (spell.type !== "damage" && spell.type !== "buff")) return 0;
  if (avgAmount(spell.dmg) <= 0) return 0;
  const avg = avgAmount(spell.dmg) * view.hits;
  let s = (avg / view.cost) * w;
  if (dist <= view.range) s *= 6;
  else s *= 0.35;
  if (spell.effect === "push") s += 2.5 * (pol.pushBias != null ? pol.pushBias : 1);
  if (spell.effect === "drainPA") s += 3 * (pol.controlBias != null ? pol.controlBias : 1);
  if ((spell.aoe | 0) > 0) s += 1.5;
  if (dist <= 1 && view.range >= 3) s *= 0.75 / (pol.kiteBias != null ? pol.kiteBias : 1);
  return s;
}

function castSpell(rng, caster, foe, spell, log) {
  const view = spellView(spell);
  if (caster.pa < view.cost) return { ok: false, reason: "pa" };
  caster.pa -= view.cost;
  if (spell.effect === "roulade") {
    const cells = Math.max(1, view.range);
    const before = chebyshev(caster, foe);
    let moved = 0;
    if (before <= 1) {
      for (let i = 0; i < cells; i++) {
        if (!stepAway(caster, foe, foe)) break;
        moved++;
      }
    } else {
      const steps = Math.min(cells, before);
      for (let i = 0; i < steps; i++) {
        if (!stepToward(caster, foe, foe)) break;
        moved++;
      }
    }
    if (log) log.moved += moved;
    return { ok: true, moved };
  }
  if (spell.type === "heal" || (spell.heal && spell.type !== "damage" && spell.type !== "shield")) {
    const h = rollPair(rng, spell.heal || [10, 14]);
    caster.pv = Math.min(caster.pvMax, caster.pv + h);
    if (log) log.healed += h;
    return { ok: true, healed: h };
  }
  if (spell.type === "shield") {
    const h = rollPair(rng, spell.heal || [8, 12]);
    caster.pv = Math.min(caster.pvMax, caster.pv + Math.floor(h / 2));
    caster.shield = (caster.shield || 0) + Math.floor(h / 2) + (spell.shield | 0);
    if (log) log.healed += h;
    return { ok: true, shield: caster.shield };
  }
  const dist = chebyshev(caster, foe);
  if (dist > view.range) return { ok: false, reason: "range", wasted: true };
  let dealt = 0;
  for (let h = 0; h < view.hits; h++) {
    if (foe.pv <= 0) break;
    let dmg = rollPair(rng, spell.dmg || [6, 10]);
    if (foe.shield > 0) {
      const a = Math.min(foe.shield, dmg);
      foe.shield -= a;
      dmg -= a;
    }
    foe.pv = Math.max(0, foe.pv - dmg);
    dealt += dmg;
  }
  if (spell.effect === "push" && foe.pv > 0) {
    pushAway(foe, caster, Math.max(1, spell.push | 0), caster);
  }
  if (spell.effect === "drainPA") foe.pa = Math.max(0, foe.pa - 1);
  if (spell.effect === "drainPM") foe.pm = Math.max(0, (foe.pm || 0) - 1);
  if (spell.effect === "summon" || spell.type === "summon") {
    if (log) log.summoned = (log.summoned || 0) + 1;
  }
  if (spell.effect === "glyph" || spell.effect === "trap") {
    const extra = Math.max(1, Math.floor(dealt * 0.35) || rollPair(rng, spell.dmg || [4, 6]));
    foe.pv = Math.max(0, foe.pv - extra);
    dealt += extra;
    if (log) log.zones = (log.zones || 0) + 1;
  }
  if (log) log.dealt += dealt;
  return { ok: true, dealt };
}

function chooseSpell(rng, actor, foe, spells, policy) {
  const pol = policy || {};
  const noise = pol.noise != null ? pol.noise : 0;
  const affordable = spells.filter((s) => actor.pa >= spellView(s).cost);
  if (!affordable.length) return null;
  if (noise > 0 && rng() < noise) return pick(rng, affordable);
  let best = null;
  let bestS = -Infinity;
  affordable.forEach((s) => {
    const sc = scoreSpell(s, actor, foe, pol);
    if (sc > bestS) {
      bestS = sc;
      best = s;
    }
  });
  return bestS > 0 ? best : null;
}

function actTurn(rng, actor, foe, spells, policy, log) {
  actor.pa = actor.paMax;
  actor.pm = actor.pmMax;
  let guard = 8;
  while (guard-- > 0 && actor.pv > 0 && foe.pv > 0) {
    const chosen = chooseSpell(rng, actor, foe, spells, policy);
    if (chosen && chebyshev(actor, foe) <= spellView(chosen).range || (chosen && (chosen.type === "heal" || chosen.type === "shield" || chosen.effect === "roulade"))) {
      const res = castSpell(rng, actor, foe, chosen, log);
      if (res && res.ok) continue;
    }
    if (actor.pm <= 0) break;
    const ranged = spells.some((s) => s.type === "damage" && spellView(s).range >= 3);
    const kite = ranged && (policy && policy.kiteBias ? policy.kiteBias : 1) >= 1.15 && chebyshev(actor, foe) <= 1;
    const moved = kite ? stepAway(actor, foe, foe) : stepToward(actor, foe, foe);
    if (!moved) break;
    actor.pm -= 1;
  }
}

function makeFighter(spells, spot) {
  return {
    c: spot.c,
    r: spot.r,
    pv: 80,
    pvMax: 80,
    pa: 6,
    paMax: 6,
    pm: 3,
    pmMax: 3,
    shield: 0,
  };
}

/**
 * Duel simulé. Même distance de Chebyshev et mêmes coûts/portées que le combat.
 * Renvoie le vainqueur ("a", "b" ou "draw") et les dégâts infligés.
 */
export function simulateDuel(spellsA, spellsB, options) {
  const opt = options || {};
  const rng = mulberry32(opt.seed != null ? opt.seed : 1);
  const policyA = opt.policyA || opt.policy || {};
  const policyB = opt.policyB || opt.policy || {};
  const a = makeFighter(spellsA, opt.swap ? { c: 7, r: 4 } : { c: 2, r: 5 });
  const b = makeFighter(spellsB, opt.swap ? { c: 2, r: 5 } : { c: 7, r: 4 });
  const logA = { dealt: 0, healed: 0, moved: 0 };
  const logB = { dealt: 0, healed: 0, moved: 0 };
  const maxTurns = opt.maxTurns || 14;
  let winner = "draw";
  for (let t = 0; t < maxTurns; t++) {
    actTurn(rng, a, b, spellsA, policyA, logA);
    if (b.pv <= 0) { winner = "a"; break; }
    actTurn(rng, b, a, spellsB, policyB, logB);
    if (a.pv <= 0) { winner = "b"; break; }
  }
  if (winner === "draw") {
    if (a.pv > b.pv) winner = "a";
    else if (b.pv > a.pv) winner = "b";
  }
  return { winner, a: { pv: a.pv, ...logA }, b: { pv: b.pv, ...logB } };
}

/** Sonde un sort seul : détecte un sort qui ne fait rien. */
export function probeSpell(spell, seed) {
  const rng = mulberry32(seed || 1);
  const view = validateSpell(spell);
  const s = view.spell;
  if (!view.ok) return { ok: false, errors: view.errors, dealt: 0, healed: 0, moved: 0 };
  const caster = makeFighter([s], { c: 2, r: 5 });
  const foe = makeFighter([REFERENCE_PUNCH], { c: 2 + Math.min(s.range || 1, 4), r: 5 });
  if (s.effect === "roulade") foe.c = 6;
  const log = { dealt: 0, healed: 0, moved: 0 };
  if ((s.type === "damage" || s.effect === "push" || s.effect === "drainPA") && chebyshev(caster, foe) > spellView(s).range) {
    let guard = 6;
    while (guard-- > 0 && chebyshev(caster, foe) > spellView(s).range) {
      if (!stepToward(caster, foe, foe)) break;
    }
  }
  const res = castSpell(rng, caster, foe, s, log);
  const special = s.effect === "summon" || s.type === "summon" || s.effect === "glyph" || s.effect === "trap" || s.effect === "drainPM" || s.effect === "drainPA";
  const useful = log.dealt > 0 || log.healed > 0 || log.moved > 0 || log.summoned > 0 || log.zones > 0 || (s.type === "shield" && caster.shield > 0) || (special && res && res.ok);
  return { ok: !!(res && res.ok && useful), errors: useful ? [] : ["aucune effet en sonde"], dealt: log.dealt, healed: log.healed, moved: log.moved, spell: s };
}

function scaleDamage(spell, factor) {
  if (!spell.dmg) return;
  spell.dmg = spell.dmg.map((n) => clampInt(Math.round(n * factor), 1, 80, 6));
  if (spell.dmg[1] < spell.dmg[0]) spell.dmg[1] = spell.dmg[0];
}

const DPC_LO = 3.6;
const DPC_HI = 7.2;

/**
 * Écarte ou répare les sorts cassés, puis ramène les dégâts/coût et le taux de victoire
 * vers une bande jouable. `fights` duels par sort contre Coup brut.
 */
export function balanceCatalog(spells, options) {
  const opt = options || {};
  const fights = opt.fights != null ? opt.fights : 10;
  const kept = [];
  const discarded = [];
  const notes = [];
  (spells || []).forEach((raw, index) => {
    const checked = validateSpell(raw);
    if (!checked.spell) {
      discarded.push({ id: raw && raw.id, name: raw && raw.name, reason: "illisible" });
      return;
    }
    let spell = checked.spell;
    if (!checked.ok) {
      const again = validateSpell(spell);
      spell = again.spell;
      if (!again.ok) {
        discarded.push({ id: spell.id, name: spell.name, reason: again.errors.join(", ") });
        return;
      }
      notes.push({ id: spell.id, action: "réparé", detail: checked.errors.join(", ") });
    }
    const probe = probeSpell(spell, 1000 + index);
    if (!probe.ok) {
      if (spell.type === "damage" && spell.dmg) scaleDamage(spell, 1.25);
      if (spell.effect === "roulade") spell.range = Math.max(2, spell.range | 0);
      const retry = probeSpell(spell, 2000 + index);
      if (!retry.ok) {
        discarded.push({ id: spell.id, name: spell.name, reason: "sonde sans effet" });
        return;
      }
      notes.push({ id: spell.id, action: "réparé", detail: "sonde initiale vide" });
    }
    if (spell.type === "damage") {
      let dpc = damagePerCost(spell);
      if (dpc > DPC_HI) {
        scaleDamage(spell, DPC_HI / dpc);
        notes.push({ id: spell.id, action: "nerf ratio", detail: dpc.toFixed(2) + " → " + damagePerCost(spell).toFixed(2) });
      } else if (dpc < DPC_LO && dpc > 0) {
        scaleDamage(spell, DPC_LO / dpc);
        notes.push({ id: spell.id, action: "buff ratio", detail: dpc.toFixed(2) + " → " + damagePerCost(spell).toFixed(2) });
      }
    }
    const measure = (seedBase) => {
      let wins = 0;
      let dealt = 0;
      for (let f = 0; f < fights; f++) {
        const duel = simulateDuel(
          [spell, REFERENCE_PUNCH],
          [REFERENCE_PUNCH, REFERENCE_PUNCH],
          { seed: seedBase + f, swap: f % 2 === 1 }
        );
        if (duel.winner === "a") wins++;
        dealt += duel.a.dealt;
      }
      return { winRate: wins / fights, dealt };
    };
    let measured = measure(3000 + index * 40);
    if (spell.type === "damage" && measured.dealt <= 0) {
      scaleDamage(spell, 1.3);
      const retry = probeSpell(spell, 4000 + index);
      if (!retry.ok || retry.dealt <= 0) {
        discarded.push({ id: spell.id, name: spell.name, reason: "aucun dégât en duel" });
        return;
      }
      notes.push({ id: spell.id, action: "réparé", detail: "dégâts nuls en duel" });
      measured = measure(5000 + index * 40);
    }
    if (spell.type === "damage") {
      for (let pass = 0; pass < 3; pass++) {
        if (measured.winRate > 0.68) {
          scaleDamage(spell, 0.88);
          notes.push({ id: spell.id, action: "nerf victoires", detail: Math.round(measured.winRate * 100) + "%" });
        } else if (measured.winRate < 0.32) {
          scaleDamage(spell, 1.12);
          notes.push({ id: spell.id, action: "buff victoires", detail: Math.round(measured.winRate * 100) + "%" });
        } else break;
        measured = measure(7000 + index * 40 + pass * 3);
      }
      const dpc = damagePerCost(spell);
      if (!Number.isFinite(dpc) || dpc < 1.5 || dpc > 12) {
        discarded.push({ id: spell.id, name: spell.name, reason: "ratio dégâts/coût hors bande " + dpc.toFixed(2) });
        return;
      }
    }
    const winRate = measured.winRate;
    spell.balance = {
      winRate: Math.round(winRate * 1000) / 1000,
      damagePerCost: Math.round(damagePerCost(spell) * 100) / 100,
    };
    kept.push(spell);
  });
  const damage = kept.filter((s) => s.type === "damage");
  const meanDpc = damage.length ? damage.reduce((a, s) => a + damagePerCost(s), 0) / damage.length : 0;
  const meanWr = damage.length ? damage.reduce((a, s) => a + (s.balance.winRate || 0), 0) / damage.length : 0;
  return {
    spells: kept,
    discarded,
    notes,
    summary: {
      input: (spells || []).length,
      kept: kept.length,
      discarded: discarded.length,
      repaired: notes.filter((n) => n.action === "réparé").length,
      meanDamagePerCost: Math.round(meanDpc * 100) / 100,
      meanWinRate: Math.round(meanWr * 1000) / 1000,
    },
  };
}

export function buildLoadouts(spells) {
  const byRole = {};
  (spells || []).forEach((s) => {
    const role = s.role || "melee";
    if (!byRole[role]) byRole[role] = [];
    byRole[role].push(s);
  });
  function take(role, n, skip) {
    const pool = (byRole[role] || []).filter((s) => !skip || skip.indexOf(s.id) < 0);
    return pool.slice(0, n);
  }
  const kits = [
    { name: "Brute", roles: [["melee", 2], ["control", 1]] },
    { name: "Tireur", roles: [["ranged", 2], ["mobility", 1]] },
    { name: "Pyromancien", roles: [["aoe", 1], ["ranged", 1], ["control", 1]] },
    { name: "Duelliste", roles: [["melee", 1], ["mobility", 1], ["control", 1]] },
    { name: "Clerc", roles: [["heal", 1], ["shield", 1], ["ranged", 1]] },
    { name: "Harceleur", roles: [["mobility", 1], ["melee", 1], ["ranged", 1]] },
  ];
  return kits.map((kit) => {
    const chosen = [];
    kit.roles.forEach(([role, n]) => {
      take(role, n, chosen.map((s) => s.id)).forEach((s) => chosen.push(s));
    });
    if (chosen.length < 3) {
      (spells || []).forEach((s) => {
        if (chosen.length < 3 && !chosen.find((c) => c.id === s.id)) chosen.push(s);
      });
    }
    return { name: kit.name, spellIds: chosen.map((s) => s.id), spells: chosen };
  }).filter((k) => k.spells.length >= 2);
}

export function baselinePolicy(spells) {
  const weights = {};
  (spells || []).forEach((s) => { weights[s.id] = 1; });
  return {
    noise: 0.55,
    healBias: 0.4,
    kiteBias: 0.8,
    controlBias: 0.7,
    pushBias: 0.7,
    mobilityBias: 0.6,
    weights,
  };
}

function clonePolicy(policy) {
  return {
    noise: policy.noise,
    healBias: policy.healBias,
    kiteBias: policy.kiteBias,
    controlBias: policy.controlBias,
    pushBias: policy.pushBias,
    mobilityBias: policy.mobilityBias,
    weights: Object.assign({}, policy.weights),
  };
}

function mutatePolicy(policy, rng, spells) {
  const next = clonePolicy(policy);
  const bump = (v, lo, hi, spread) => Math.max(lo, Math.min(hi, v + (rng() - 0.5) * spread));
  next.noise = bump(next.noise, 0, 0.85, 0.25);
  next.healBias = bump(next.healBias, 0.2, 2.4, 0.5);
  next.kiteBias = bump(next.kiteBias, 0.5, 2.2, 0.4);
  next.controlBias = bump(next.controlBias, 0.4, 2.2, 0.4);
  next.pushBias = bump(next.pushBias, 0.4, 2.2, 0.4);
  next.mobilityBias = bump(next.mobilityBias, 0.3, 2.2, 0.4);
  const sample = (spells || []).filter(() => rng() < 0.18);
  sample.forEach((s) => {
    const cur = next.weights[s.id] != null ? next.weights[s.id] : 1;
    next.weights[s.id] = Math.max(0.25, Math.min(2.5, cur + (rng() - 0.45) * 0.6));
  });
  return next;
}

function lookupSpells(ids, byId) {
  return ids.map((id) => byId[id]).filter(Boolean);
}

function gauntlet(challenger, opponent, loadouts, games, seed) {
  let wins = 0;
  let played = 0;
  for (let i = 0; i < loadouts.length; i++) {
    for (let j = 0; j < loadouts.length; j++) {
      if (i === j) continue;
      for (let g = 0; g < games; g++) {
        const swap = g % 2 === 1;
        const duel = simulateDuel(loadouts[i].spells, loadouts[j].spells, {
          seed: seed + i * 1000 + j * 50 + g,
          swap,
          policyA: swap ? opponent : challenger,
          policyB: swap ? challenger : opponent,
        });
        played++;
        const challengerIsA = !swap;
        if ((challengerIsA && duel.winner === "a") || (!challengerIsA && duel.winner === "b")) wins++;
      }
    }
  }
  return { wins, played, winRate: played ? wins / played : 0 };
}

/**
 * Auto-affrontement : le champion affronte des mutants, puis on mesure
 * le champion final contre la politique de départ.
 */
export function trainPolicy(spells, options) {
  const opt = options || {};
  const generations = opt.generations != null ? opt.generations : 6;
  const games = opt.games != null ? opt.games : 2;
  const rng = mulberry32(opt.seed != null ? opt.seed : 4242);
  const loadouts = opt.loadouts && opt.loadouts.length ? opt.loadouts : buildLoadouts(spells);
  const byId = {};
  (spells || []).forEach((s) => { byId[s.id] = s; });
  loadouts.forEach((kit) => {
    if (!kit.spells) kit.spells = lookupSpells(kit.spellIds, byId);
  });
  const usable = loadouts.filter((k) => k.spells && k.spells.length >= 2).slice(0, 6);
  const base = baselinePolicy(spells);
  let champion = clonePolicy(base);
  const history = [];
  const scoreVsBase = (policy, seed) => gauntlet(policy, base, usable, games, seed).winRate;
  let championScore = scoreVsBase(champion, 40000);
  for (let gen = 1; gen <= generations; gen++) {
    const directed = clonePolicy(champion);
    directed.noise = Math.max(0, champion.noise - 0.12);
    directed.healBias = Math.min(2.2, champion.healBias + 0.25);
    directed.kiteBias = Math.min(2, champion.kiteBias + 0.12);
    directed.controlBias = Math.min(2, champion.controlBias + 0.08);
    const candidates = [mutatePolicy(champion, rng, spells), directed];
    let best = null;
    let bestScore = championScore;
    candidates.forEach((cand, ci) => {
      const wr = scoreVsBase(cand, 50000 + gen * 200 + ci * 17);
      if (wr > bestScore + 0.02) {
        bestScore = wr;
        best = cand;
      }
    });
    const accepted = !!best;
    if (accepted) {
      champion = best;
      championScore = bestScore;
    }
    history.push({
      generation: gen,
      winRateVsBaseline: Math.round((accepted ? bestScore : championScore) * 1000) / 1000,
      accepted,
    });
  }
  const before = { winRate: 0.5 };
  const againstBase = gauntlet(champion, base, usable, Math.max(3, games), 91000);
  return {
    policy: champion,
    baseline: base,
    loadouts: usable.map((k) => ({ name: k.name, spellIds: k.spells.map((s) => s.id) })),
    history,
    baselineMirror: Math.round(before.winRate * 1000) / 1000,
    trainedWinRate: Math.round(againstBase.winRate * 1000) / 1000,
    trainedWins: againstBase.wins,
    trainedGames: againstBase.played,
    improved: againstBase.winRate > before.winRate + 0.02,
  };
}
