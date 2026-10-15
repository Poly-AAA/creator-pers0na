/**
 * Règles du roguelite PvP (ADN, combats, économie, artisanat, forgemagie).
 * Pur : aucun DOM. Le navigateur et les simulations Node importent le même module.
 */
import { combineAnimations, mulberry32, chebyshev, hitCount } from "./spell-lab.js";

export { mulberry32, chebyshev };

export const BALANCE = {
  xpNeedCoef: 48,
  xpNeedPow: 1.45,
  xpFlat: 55,
  xpPerLevel: 42,
  goldFlat: 8,
  goldPerLevel: 3.6,
  erosion: 0.1,
  fleeShare: 0.6,
  dropRate: 0.1,
  rareDrop: 0.004,
  runeRate: 0.03,
  resistCap: 0.5,
  statScale: 85,
  dmgFactor: 0.155,
  playerSkill: 1.85,
  playerGuard: 0.64,
};

export const SLOTS = ["coiffe", "amulette", "cape", "arme", "anneauG", "anneauD", "ceinture", "bouclier", "bottes"];
export const SLOT_LABEL = {
  coiffe: "Coiffe", amulette: "Amulette", cape: "Cape", arme: "Arme",
  anneauG: "Anneau G", anneauD: "Anneau D", ceinture: "Ceinture", bouclier: "Bouclier", bottes: "Bottes",
};
export const STAT_LABEL = {
  vit: "Vitalité", force: "Force", intel: "Intelligence", chance: "Chance",
  agi: "Agilité", sage: "Sagesse", ini: "Initiative",
  pa: "PA", pm: "PM", po: "Portée",
  resTerre: "Rés. terre", resFeu: "Rés. feu", resEau: "Rés. eau", resAir: "Rés. air", resNeutre: "Rés. neutre",
};
const CORE_STATS = ["vit", "force", "intel", "chance", "agi", "sage", "ini"];
const RES_KEYS = ["terre", "feu", "eau", "air", "neutre"];
const ELEMENT_STAT = { terre: "force", neutre: "force", feu: "intel", eau: "chance", air: "agi" };
const COMPAT = { terre: "feu", feu: "terre", eau: "air", air: "eau", neutre: "terre" };

export const MATERIALS = [
  { id: "plume_pigeon", name: "Plume de pigeon", family: "Plumes", price: 14, stat: "agi", amount: 3, tier: 1 },
  { id: "plume_paon", name: "Plume de paon", family: "Plumes", price: 46, stat: "chance", amount: 8, tier: 3 },
  { id: "duvet", name: "Duvet", family: "Plumes", price: 22, stat: "resAir", amount: 2, tier: 2 },
  { id: "tissu", name: "Tissu brut", family: "Tissus", price: 16, stat: "vit", amount: 6, tier: 1 },
  { id: "lin", name: "Lin", family: "Tissus", price: 24, stat: "sage", amount: 3, tier: 2 },
  { id: "soie", name: "Soie claire", family: "Tissus", price: 52, stat: "intel", amount: 8, tier: 3 },
  { id: "fer", name: "Fer", family: "Métaux", price: 18, stat: "force", amount: 4, tier: 1 },
  { id: "bronze", name: "Bronze", family: "Métaux", price: 34, stat: "force", amount: 6, tier: 2 },
  { id: "kobalte", name: "Kobalte", family: "Métaux", price: 64, stat: "ini", amount: 7, tier: 4 },
  { id: "quartz", name: "Quartz", family: "Métaux", price: 80, stat: "intel", amount: 9, tier: 4 },
];

export const SETS = [
  { id: "sable", name: "Tenue de sable", pieces: ["coiffe", "cape", "bottes"], bonus: { force: 10, resTerre: 4 } },
  { id: "lin", name: "Lin clair", pieces: ["amulette", "cape"], bonus: { intel: 12, sage: 4 } },
  { id: "jumeau", name: "Anneaux jumeaux", pieces: ["anneauG", "anneauD"], bonus: { chance: 14, po: 1 } },
];

export const CHALLENGES = [
  { id: "immobile", name: "Sans bouger", desc: "Gagner sans se déplacer" },
  { id: "cinqTours", name: "Cinq tours", desc: "Gagner en cinq tours ou moins" },
  { id: "sansSoin", name: "Sans soin", desc: "Gagner sans lancer de soin" },
];

export const RUNE_VALUE = {
  force: 2, intel: 2, chance: 2, agi: 2, sage: 1, ini: 3, vit: 6,
  pa: 1, pm: 1, po: 1, resTerre: 2, resFeu: 2, resEau: 2, resAir: 2, resNeutre: 2,
};

const NAMES = ["Sable", "Orage", "Lame", "Brume", "Cendre", "Nacre", "Quartz", "Ocre", "Lin", "Ivre", "Nuée", "Gale"];

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function iint(n, fb) { const v = Math.round(Number(n)); return Number.isFinite(v) ? v : fb; }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function roll(rng, lo, hi) {
  const a = lo | 0; const b = hi | 0;
  if (b <= a) return a;
  return a + Math.floor(rng() * (b - a + 1));
}
function emptyRes() { return { terre: 0, feu: 0, eau: 0, air: 0, neutre: 0 }; }
function emptyBase() { return { vit: 5, force: 5, intel: 5, chance: 5, agi: 5, sage: 5, ini: 5 }; }

export function xpNeed(level) {
  const lv = Math.max(1, level | 0);
  return Math.max(40, Math.round(BALANCE.xpNeedCoef * Math.pow(lv, BALANCE.xpNeedPow)));
}
export function jobNeed(level) { return 12 * Math.max(1, level | 0); }
export function geneLabel(gene) {
  if (gene <= 2) return "Faible";
  if (gene <= 5) return "Correcte";
  if (gene <= 7) return "Bonne";
  return "Parfaite";
}
export function gradeOf(score) {
  if (score >= 140) return "S+";
  if (score >= 100) return "S";
  if (score >= 70) return "A";
  if (score >= 45) return "B";
  if (score >= 25) return "C";
  return "D";
}

function materialById(id) { return MATERIALS.find((m) => m.id === id) || null; }

export function tagSpell(spell, index) {
  const s = spell;
  if (!s.element) {
    const byRole = { melee: "terre", ranged: "air", aoe: "feu", control: "air", mobility: "air", heal: "eau", shield: "terre", summon: "neutre" };
    const cycle = ["terre", "feu", "eau", "air", "neutre"];
    s.element = byRole[s.role] || cycle[(index || 0) % cycle.length];
  }
  return s;
}

let _specialCache = null;
function specialSpells() {
  if (_specialCache) return _specialCache;
  const mk = (partial) => {
    const anims = partial.anims;
    const spell = Object.assign({
      generated: true,
      equipped: false,
      aoe: 0,
      push: 0,
      rare: false,
      evoArchetype: "punch",
      steps: combineAnimations(anims, { slash: "Slash1", effect: "Effect2", fps: 14, hit: true, overlay: partial.overlay }),
    }, partial);
    spell.anim = anims[0];
    spell.animSeq = anims.slice();
    return spell;
  };
  _specialCache = [
    mk({ id: "ov_ossuaire", name: "Ossuaire", role: "summon", type: "summon", cost: 4, range: 2, dmg: [6, 10], effect: "summon", overlay: "squelette", element: "neutre", anims: ["Special1", "Attack3"], desc: "Invoque un squelette superposé." }),
    mk({ id: "ov_spectre", name: "Voile spectral", role: "control", type: "damage", cost: 3, range: 4, dmg: [6, 9], effect: "drainPM", overlay: "spectre", element: "air", anims: ["Special1", "Attack6"], desc: "Malédiction : retrait de PM, spectre superposé." }),
    mk({ id: "ov_glyphe", name: "Glyphe de braise", role: "aoe", type: "damage", cost: 4, range: 3, dmg: [7, 11], aoe: 1, effect: "glyph", overlay: "spectre", element: "feu", anims: ["Attack5", "Special1"], desc: "Glyphe au sol." }),
    mk({ id: "ov_piege", name: "Piège d'os", role: "control", type: "damage", cost: 3, range: 3, dmg: [8, 12], effect: "trap", overlay: "squelette", element: "terre", anims: ["Kick", "Special1"], desc: "Piège qui se déclenche au passage." }),
    mk({ id: "ov_relique", name: "Relique de quartz", role: "ranged", type: "damage", cost: 3, range: 5, dmg: [12, 16], effect: "", overlay: "spectre", element: "feu", rare: true, anims: ["Attack6", "Special1"], desc: "Sort rare, synergie forte." }),
  ];
  return _specialCache;
}

export function isHandmadeSpell(spell) {
  if (!spell || !spell.id) return false;
  if (spell.generated || spell.lab) return false;
  const id = String(spell.id);
  if (id.startsWith("gen_") || id.startsWith("ov_")) return false;
  return true;
}

export function prepareCatalog(list) {
  if (list && list._prepared) return list;
  const base = (list && list.length) ? list.map((s, i) => tagSpell(Object.assign({}, s), i)) : [];
  const handmade = base.filter(isHandmadeSpell);
  if (handmade.length || !(list && list.length)) {
    handmade._prepared = true;
    return handmade;
  }
  const have = new Set(base.map((s) => s.id));
  const extra = specialSpells().filter((s) => !have.has(s.id));
  const all = base.concat(extra);
  const out = all.length >= 8 ? all : all.concat(specialSpells());
  out._prepared = true;
  return out;
}

function gainAmount(rng, gene) {
  if (gene <= 2) return 3;
  if (gene <= 5) return rng() < 0.38 ? 4 : 3;
  if (gene <= 7) return rng() < 0.78 ? 4 : 3;
  return rng() < 0.92 ? 4 : 3;
}

function planStats(rng, gene, primary, secondary) {
  const gains = [];
  for (let level = 1; level <= 50; level++) {
    if (level === 1) {
      gains.push({ level, stat: primary, amount: 0 });
      continue;
    }
    const amount = gainAmount(rng, gene);
    let stat = primary;
    const r = rng();
    if (gene <= 2) stat = r < 0.82 ? primary : "vit";
    else if (gene <= 5) {
      const bag = [primary, secondary, "vit", "sage", "ini", "agi", "chance", "intel", "force"];
      stat = pick(rng, bag);
    } else if (gene <= 7) {
      if (r < 0.48) stat = primary;
      else if (r < 0.78) stat = secondary;
      else stat = pick(rng, ["vit", "sage", "ini"]);
    } else if (r < 0.52) stat = primary;
    else if (r < 0.8) stat = secondary;
    else if (r < 0.9) stat = "vit";
    else stat = r < 0.96 ? "sage" : "ini";
    gains.push({ level, stat, amount });
  }
  return gains;
}

function handmadeKit(spells) {
  const rank = { punch: 0, roulade: 1, coup_de_pied: 2 };
  const list = spells.filter(isHandmadeSpell).slice().sort((a, b) => {
    const ra = Object.prototype.hasOwnProperty.call(rank, a.id) ? rank[a.id] : 10;
    const rb = Object.prototype.hasOwnProperty.call(rank, b.id) ? rank[b.id] : 10;
    if (ra !== rb) return ra - rb;
    return String(a.id).localeCompare(String(b.id));
  });
  const seen = new Set();
  const kit = [];
  let extra = 0;
  list.forEach((spell) => {
    if (seen.has(spell.id)) return;
    seen.add(spell.id);
    let unlock = 1;
    if (spell.id !== "punch" && spell.id !== "roulade" && spell.id !== "coup_de_pied") {
      const later = [5, 15, 30, 40, 45];
      unlock = later[Math.min(extra, later.length - 1)];
      extra += 1;
    }
    kit.push(cloneSpell(spell, unlock));
  });
  return kit;
}

export function syncHeroSpells(hero, catalog) {
  if (!hero) return false;
  const next = pickKit(prepareCatalog(catalog), mulberry32((hero.seed || 1) >>> 0), hero.gene || 1, hero.elements || ["terre"]);
  const prev = hero.spells || [];
  const kept = prev.filter(isHandmadeSpell);
  const have = new Set(kept.map((s) => s.id));
  let filled = false;
  next.forEach((s) => {
    if (!have.has(s.id)) {
      kept.push(s);
      return;
    }
    const prevSpell = kept.find((x) => x.id === s.id);
    if (!prevSpell) return;
    if (!prevSpell.steps && s.steps) { prevSpell.steps = s.steps; filled = true; }
    if (!prevSpell.evoConfig && s.evoConfig) { prevSpell.evoConfig = s.evoConfig; filled = true; }
    else if (s.evoConfig) {
      prevSpell.evoConfig = prevSpell.evoConfig || {};
      Object.keys(s.evoConfig).forEach((k) => {
        if (!prevSpell.evoConfig[k]) { prevSpell.evoConfig[k] = s.evoConfig[k]; filled = true; }
      });
    }
  });
  const order = next.map((s) => s.id);
  kept.sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const same = !filled && prev.length === kept.length && prev.every((s, i) => kept[i] && s.id === kept[i].id && (s.unlock | 0) === (kept[i].unlock | 0));
  hero.spells = kept;
  return !same;
}

function pickKit(catalog, rng, gene, elements) {
  const pool = catalog.filter((s) => s && s.id);
  const handmade = pool.filter(isHandmadeSpell);
  if (handmade.length) return handmadeKit(handmade);
  const moves = pool.filter((s) => s.role === "mobility" || s.effect === "roulade");
  const heals = pool.filter((s) => s.type === "heal" || s.type === "shield");
  const attacks = pool.filter((s) => s.type === "damage" || s.type === "summon");
  const rare = pool.filter((s) => s.rare);
  const ofEl = (list, el) => list.filter((s) => s.element === el);
  const primary = elements[0];
  const take = (list, n) => {
    const out = [];
    const bag = list.slice();
    while (out.length < n && bag.length) {
      const i = Math.floor(rng() * bag.length);
      out.push(bag.splice(i, 1)[0]);
    }
    return out;
  };
  let movePicked = take(moves.length ? moves : attacks, 2);
  while (movePicked.length < 2) movePicked.push(attacks[movePicked.length % Math.max(1, attacks.length)] || pool[0]);
  let spells = [];
  if (gene <= 2) {
    const match = ofEl(attacks, primary);
    const off = attacks.filter((s) => s.element !== primary);
    spells = take(match.length ? match : attacks, 1).concat(take(off.length ? off : attacks, 3));
  } else if (gene <= 5) {
    spells = take(attacks, 3).concat(take(heals.length ? heals : attacks, 1));
  } else {
    const a = take(ofEl(attacks, elements[0]).concat(ofEl(attacks, elements[1] || elements[0])), 3);
    const h = take(heals.length ? heals : attacks, 1);
    spells = a.concat(h);
    if (gene >= 8) {
      const r = rare[0] || attacks.find((s) => s.overlay) || null;
      if (r) spells[spells.length - 1] = r;
    }
  }
  while (spells.length < 4) spells.push(attacks[spells.length % Math.max(1, attacks.length)] || pool[0]);
  const unlocks = [1, 5, 15, 30];
  const kit = [];
  movePicked.slice(0, 2).forEach((s) => kit.push(cloneSpell(s, 1)));
  spells.slice(0, 4).forEach((s, i) => kit.push(cloneSpell(s, unlocks[i] || 30)));
  return kit;
}

function cloneSpell(spell, unlock) {
  return {
    id: spell.id,
    name: spell.name,
    cost: spell.cost | 0 || 2,
    range: spell.range | 0,
    dmg: Array.isArray(spell.dmg) ? spell.dmg.slice() : [0, 0],
    heal: Array.isArray(spell.heal) ? spell.heal.slice() : null,
    type: spell.type || "damage",
    effect: spell.effect || "",
    aoe: spell.aoe | 0,
    push: spell.push | 0,
    element: spell.element || "neutre",
    role: spell.role || "melee",
    overlay: spell.overlay || null,
    rare: !!spell.rare,
    anim: spell.anim || "Attack1",
    steps: spell.steps ? JSON.parse(JSON.stringify(spell.steps)) : null,
    evoArchetype: spell.evoArchetype || "punch",
    evoConfig: spell.evoConfig ? JSON.parse(JSON.stringify(spell.evoConfig)) : null,
    unlock,
    rank: 0,
  };
}

export function spellForLevel(spell, level) {
  const s = Object.assign({}, spell);
  if (Array.isArray(spell.dmg)) s.dmg = spell.dmg.slice();
  if (Array.isArray(spell.heal)) s.heal = spell.heal.slice();
  const rank = level >= 50 ? 2 : level >= 40 ? 1 : 0;
  s.rank = rank;
  if (rank >= 1 && s.type === "damage" && s.dmg) s.dmg = [s.dmg[0] + 2, s.dmg[1] + 3];
  if (rank >= 2 && s.type === "damage" && s.dmg) {
    s.dmg = [s.dmg[0] + 3, s.dmg[1] + 4];
    s.cost = Math.max(1, (s.cost | 0) - (s.rare ? 1 : 0));
  }
  if (rank >= 1 && s.heal) s.heal = [s.heal[0] + 3, s.heal[1] + 4];
  if (rank >= 2 && s.heal) s.heal = [s.heal[0] + 4, s.heal[1] + 6];
  s.hits = 1;
  try { s.hits = hitCount(spell); } catch (_e) { s.hits = 1; }
  return s;
}

export function unlockedSpells(hero) {
  return (hero.spells || []).filter((s) => (s.unlock | 0) <= hero.level).map((s) => spellForLevel(s, hero.level));
}

export function createHero(seed, catalog) {
  const rng = mulberry32(seed >>> 0);
  const gene = 1 + Math.floor(rng() * 8);
  const elementsAll = ["terre", "feu", "eau", "air"];
  const primaryEl = pick(rng, elementsAll);
  const secondaryEl = COMPAT[primaryEl];
  const elements = gene <= 2 ? [primaryEl] : [primaryEl, secondaryEl];
  const statOf = { terre: "force", feu: "intel", eau: "chance", air: "agi" };
  const primary = statOf[primaryEl];
  const secondary = statOf[secondaryEl];
  const gains = planStats(rng, gene, primary, secondary);
  const base = emptyBase();
  const name = pick(rng, NAMES) + "-" + String(1 + Math.floor(rng() * 89)).padStart(2, "0");
  const hero = {
    id: "h" + (seed >>> 0).toString(16),
    name,
    seed: seed >>> 0,
    gene,
    geneLabel: geneLabel(gene),
    elements,
    level: 1,
    xp: 0,
    gold: roll(rng, 0, 8),
    base,
    dna: { gains, primary, secondary, elements },
    spells: pickKit(prepareCatalog(catalog), rng, gene, elements),
    pv: 50,
    inventory: [],
    equipped: {},
    materials: {},
    runes: {},
    fleeCharges: 0,
    companions: [],
    fights: 0,
    wins: 0,
    kills: 0,
    healsGiven: 0,
    shieldsGiven: 0,
    combos: 0,
    fastTurns: 0,
    styleLast: 0,
    styleBest: 0,
    styleSum: 0,
    alive: true,
  };
  recomputeVitals(hero);
  hero.pv = hero.pvMax;
  return hero;
}

export function createMeta() {
  return { craftLevel: 1, forgeLevel: 1, craftXp: 0, forgeXp: 0, knowledge: {}, board: [] };
}

export function createState(seed, catalog) {
  const state = { meta: createMeta(), hero: null, shop: [], catalogStamp: (catalog && catalog.length) || 0 };
  state.hero = createHero(seed >>> 0, catalog);
  refreshShop(state, mulberry32((seed >>> 0) ^ 0x9e3779b9));
  return state;
}

function equippedItems(hero) {
  const out = [];
  SLOTS.forEach((slot) => { if (hero.equipped && hero.equipped[slot]) out.push(hero.equipped[slot]); });
  return out;
}

function applyLine(bucket, res, line) {
  const stat = line.stat;
  const v = line.value | 0;
  if (stat === "resTerre") res.terre += v;
  else if (stat === "resFeu") res.feu += v;
  else if (stat === "resEau") res.eau += v;
  else if (stat === "resAir") res.air += v;
  else if (stat === "resNeutre") res.neutre += v;
  else bucket[stat] = (bucket[stat] || 0) + v;
}

function setBonuses(hero) {
  const bonus = {};
  const names = [];
  SETS.forEach((set) => {
    const ok = set.pieces.every((slot) => hero.equipped && hero.equipped[slot] && hero.equipped[slot].set === set.id);
    if (!ok) return;
    names.push(set.name);
    Object.keys(set.bonus).forEach((k) => { bonus[k] = (bonus[k] || 0) + set.bonus[k]; });
  });
  return { bonus, names };
}

export function effectiveStats(hero) {
  const add = Object.assign({}, hero.base);
  const res = emptyRes();
  equippedItems(hero).forEach((it) => (it.lines || []).forEach((ln) => applyLine(add, res, ln)));
  const sets = setBonuses(hero);
  Object.keys(sets.bonus).forEach((k) => {
    if (k.indexOf("res") === 0) {
      const map = { resTerre: "terre", resFeu: "feu", resEau: "eau", resAir: "air", resNeutre: "neutre" };
      res[map[k]] = (res[map[k]] || 0) + sets.bonus[k];
    } else add[k] = (add[k] || 0) + sets.bonus[k];
  });
  RES_KEYS.forEach((k) => { res[k] = clamp(res[k], 0, BALANCE.resistCap * 100) / 100; });
  return {
    vit: add.vit | 0, force: add.force | 0, intel: add.intel | 0, chance: add.chance | 0,
    agi: add.agi | 0, sage: add.sage | 0, ini: add.ini | 0,
    pa: 6 + (add.pa | 0), pm: 3 + (add.pm | 0), po: add.po | 0,
    res, sets: sets.names,
  };
}

export function recomputeVitals(hero) {
  const eff = effectiveStats(hero);
  const pvMax = 50 + (hero.level - 1) * 5 + Math.max(0, eff.vit - 5);
  hero.pvMax = Math.max(1, pvMax);
  hero.paMax = eff.pa;
  hero.pmMax = eff.pm;
  hero.po = eff.po;
  if (hero.pv > hero.pvMax) hero.pv = hero.pvMax;
  hero.eff = eff;
  return eff;
}

function addJobXp(meta, job, amount) {
  const key = job === "forge" ? "forge" : "craft";
  meta[key + "Xp"] = (meta[key + "Xp"] | 0) + amount;
  let lv = meta[key + "Level"] | 0 || 1;
  while (lv < 50 && meta[key + "Xp"] >= jobNeed(lv)) {
    meta[key + "Xp"] -= jobNeed(lv);
    lv += 1;
  }
  meta[key + "Level"] = lv;
}

export function itemScore(it) {
  if (!it) return 0;
  return (it.lines || []).reduce((s, l) => {
    if (l.stat === "pa") return s + 48;
    if (l.stat === "pm") return s + 32;
    if (l.stat === "po") return s + 22;
    return s + (l.value | 0);
  }, 0);
}

export function equipBest(hero) {
  const bag = hero.inventory.slice();
  bag.forEach((it) => {
    const slot = it.slot === "anneau" ? (hero.equipped.anneauG ? "anneauD" : "anneauG") : it.slot;
    if (SLOTS.indexOf(slot) < 0) return;
    const cur = hero.equipped[slot];
    if (!cur || itemScore(it) > itemScore(cur) + 1) equip(hero, it.id);
  });
}

export function gainXp(hero, amount) {
  const gained = [];
  hero.xp += Math.max(0, amount | 0);
  while (hero.level < 50 && hero.xp >= xpNeed(hero.level)) {
    hero.xp -= xpNeed(hero.level);
    hero.level += 1;
    const g = (hero.dna.gains || []).find((x) => x.level === hero.level);
    if (g && g.amount) hero.base[g.stat] = (hero.base[g.stat] || 0) + g.amount;
    gained.push(hero.level);
  }
  if (hero.level >= 50) hero.xp = Math.min(hero.xp, xpNeed(50));
  recomputeVitals(hero);
  return gained;
}

function weaponFolder(item) {
  const el = (item && item.element) || "terre";
  const table = { terre: "Melee8", feu: "Magic3", eau: "Magic2", air: "Ranged1", neutre: "Melee2" };
  return table[el] || "Melee2";
}

const GEAR_HEADS = ["Head1", "Head3", "Head5", "Head8", "Head12", "Head16", "Head18", "Head22"];
const GEAR_CHESTS = ["Chest2", "Chest4", "Chest6", "Chest8", "Chest10", "Chest14"];
const GEAR_LEGS = ["Legs1", "Legs3", "Legs5", "Legs7", "Legs9"];
const GEAR_OFF = ["Offhand1", "Offhand2", "Shield1", "Shield2"];

function mixHero(hero) {
  const s = String((hero && (hero.id || hero.name)) || "x");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function layersForHero(hero) {
  const h = mixHero(hero);
  const eq = hero.equipped || {};
  const weapons = ["Melee2", "Melee8", "Magic2", "Magic3", "Ranged1"];
  const layers = [
    { folder: "Shadow", tint: null, alpha: 1 },
    { folder: "NakedBody", tint: null, alpha: 1 },
    { folder: GEAR_LEGS[(eq.bottes ? h : (h >>> 2)) % GEAR_LEGS.length], tint: null, alpha: 1 },
  ];
  if (eq.ceinture && !eq.cape) layers.push({ folder: (h & 1) ? "Belt1" : "Belt2", tint: null, alpha: 1 });
  else layers.push({ folder: GEAR_CHESTS[(h >>> 3) % GEAR_CHESTS.length], tint: null, alpha: 1 });
  if (eq.bouclier) layers.push({ folder: GEAR_OFF[(h >>> 5) % GEAR_OFF.length], tint: null, alpha: 1 });
  layers.push({ folder: eq.arme ? weaponFolder(eq.arme) : weapons[(h >>> 6) % weapons.length], tint: null, alpha: 1 });
  layers.push({ folder: GEAR_HEADS[(h >>> 8) % GEAR_HEADS.length], tint: null, alpha: 1 });
  return layers;
}

function leaderFade(level) {
  const lv = level | 0 || 1;
  if (lv >= 48) return 0.18;
  if (lv >= 44) return 0.24;
  if (lv >= 40) return 0.32;
  if (lv >= 36) return 0.55;
  if (lv >= 30) return 0.82;
  return 1;
}

export function powerScore(heroOrFighter) {
  const eff = heroOrFighter.eff || heroOrFighter.stats || effectiveStats(heroOrFighter);
  const lv = heroOrFighter.level | 0 || 1;
  const spells = (heroOrFighter.spells || []).filter((s) => s.unlock == null || (s.unlock | 0) <= lv);
  let dmg = 0;
  spells.forEach((s) => {
    if (!s.dmg) return;
    const avg = ((s.dmg[0] || 0) + (s.dmg[1] || 0)) / 2;
    dmg += avg * (s.hits || 1) / Math.max(1, s.cost || 1);
  });
  const stat = (eff.force || 0) + (eff.intel || 0) + (eff.chance || 0) + (eff.agi || 0);
  return (heroOrFighter.pvMax || 50) * 0.35 + stat * 1.1 + (eff.pa || eff.paMax || 6) * 28 + (eff.pm || eff.pmMax || 3) * 16 + dmg * 10;
}

function makeItem(rng, opts) {
  const level = clamp(opts.level | 0 || 1, 1, 50);
  const slot = opts.slot || pick(rng, SLOTS);
  const quality = opts.quality != null ? opts.quality : 0.75 + rng() * 0.45;
  const rare = !!opts.rare;
  const element = opts.element || pick(rng, ["terre", "feu", "eau", "air", "neutre"]);
  const mains = {
    arme: ["force", "intel", "chance", "agi"],
    coiffe: ["vit", "ini", "sage"],
    cape: ["vit", "agi", "resAir"],
    bottes: ["agi", "ini", "pm"],
    anneauG: ["chance", "force", "po"],
    anneauD: ["intel", "agi", "po"],
    amulette: ["sage", "vit", "chance"],
    ceinture: ["vit", "force", "sage"],
    bouclier: ["vit", "resTerre", "resNeutre"],
  };
  const bag = (mains[slot] || ["vit"]).slice();
  const n = rare ? 4 : 2 + (rng() < 0.45 ? 1 : 0);
  const lines = [];
  for (let i = 0; i < n; i++) {
    const stat = bag[i % bag.length];
    if (stat === "pa" || stat === "pm" || stat === "po") {
      if (rng() > (rare ? 0.55 : 0.18)) continue;
      lines.push({ stat, value: 1, min: 1, max: 1 });
      continue;
    }
    if (String(stat).indexOf("res") === 0) {
      const v = clamp(Math.round((2 + level * 0.12) * quality), 1, 12);
      lines.push({ stat, value: v, min: 1, max: v + 4 });
      continue;
    }
    const spread = stat === "vit" ? 1.6 : 1;
    const mid = (stat === "vit" ? 4 : 2) + level * (stat === "vit" ? 0.55 : 0.42) * quality * (rare ? 1.35 : 1);
    const lo = Math.max(1, Math.round(mid * 0.7));
    const hi = Math.max(lo + 1, Math.round(mid * 1.25 * spread));
    lines.push({ stat, value: roll(rng, lo, hi), min: lo, max: hi });
  }
  if (!lines.length) lines.push({ stat: "vit", value: 2 + level, min: 2, max: 4 + level });
  let set = null;
  if (rng() < 0.22 || opts.set) {
    const candidates = SETS.filter((s) => s.pieces.indexOf(slot) >= 0);
    if (candidates.length) set = (opts.set && candidates.find((s) => s.id === opts.set)) ? opts.set : pick(rng, candidates).id;
  }
  const setName = set ? (SETS.find((s) => s.id === set) || {}).name : "";
  const nouns = { arme: "Lame", coiffe: "Coiffe", cape: "Cape", bottes: "Bottes", anneauG: "Anneau", anneauD: "Anneau", amulette: "Amulette", ceinture: "Ceinture", bouclier: "Bouclier" };
  return {
    id: "it" + Math.floor(rng() * 1e9).toString(16),
    name: (rare ? "Relique " : "") + (nouns[slot] || "Pièce") + (setName ? " · " + setName : "") + " " + level,
    slot, level, element, set, rare,
    lines,
    maxLines: rare ? 8 : 6,
  };
}

function scaleCrafted(item, heroLevel) {
  const f = clamp(heroLevel / 50, 0.04, 1);
  item.lines.forEach((ln) => {
    if (ln.stat === "pa" || ln.stat === "pm" || ln.stat === "po") {
      ln.value = heroLevel >= 40 && ln.value > 0 ? 1 : 0;
      if (!ln.value) ln.value = 0;
    } else ln.value = Math.max(ln.stat.indexOf("res") === 0 ? 0 : 1, Math.round(ln.value * f));
  });
  item.lines = item.lines.filter((ln) => ln.value > 0);
  item.level = heroLevel;
  item.crafted = true;
  return item;
}

export function craft(state, slot, materialIds, rng) {
  const hero = state.hero;
  const ids = (materialIds || []).filter(Boolean);
  if (!ids.length) return { ok: false, reason: "vide" };
  if (ids.length > 4) return { ok: false, reason: "trop" };
  for (const id of ids) {
    if ((hero.materials[id] || 0) < 1) return { ok: false, reason: "matériau" };
  }
  ids.forEach((id) => { hero.materials[id] -= 1; });
  const lv = state.meta.craftLevel | 0 || 1;
  const fail = clamp(0.08 + 0.11 * (ids.length - 1) - lv * 0.004, 0.04, 0.72);
  if (rng() < fail) {
    addJobXp(state.meta, "craft", 4);
    return { ok: false, reason: "échec", fail };
  }
  const lines = [];
  let tier = 1;
  ids.forEach((id) => {
    const m = materialById(id);
    if (!m) return;
    tier = Math.max(tier, m.tier | 0);
    const known = state.meta.knowledge[id] || { samples: 0, confidence: 0 };
    known.samples += 1;
    known.confidence = 1 - Math.exp(-known.samples / 2.4);
    known.stat = m.stat;
    known.amount = m.amount;
    state.meta.knowledge[id] = known;
    const prev = lines.find((l) => l.stat === m.stat);
    const bonus = 1 + (lv - 1) * 0.01;
    const value = Math.max(1, Math.round(m.amount * bonus));
    if (prev) prev.value += value;
    else lines.push({ stat: m.stat, value, min: 1, max: value * 2 });
  });
  const item = scaleCrafted({
    id: "cf" + Math.floor(rng() * 1e9).toString(16),
    name: "Ouvrage " + (SLOT_LABEL[slot] || slot),
    slot: SLOTS.indexOf(slot) >= 0 ? slot : "arme",
    level: hero.level,
    element: hero.elements[0] || "terre",
    set: rng() < 0.18 ? pick(rng, SETS.filter((s) => s.pieces.indexOf(slot) >= 0).concat([{ id: null }])).id : null,
    rare: tier >= 4 && ids.length >= 3 && rng() < 0.04 && hero.level >= 48,
    lines,
    maxLines: 7,
  }, hero.level);
  if (!item.lines.length) return { ok: false, reason: "échec" };
  hero.inventory.push(item);
  addJobXp(state.meta, "craft", 16 + ids.length * 6);
  return { ok: true, item, fail };
}

export function crush(state, itemId, rng) {
  const hero = state.hero;
  const idx = hero.inventory.findIndex((it) => it.id === itemId);
  let item = idx >= 0 ? hero.inventory[idx] : null;
  let fromSlot = null;
  if (!item) {
    SLOTS.forEach((slot) => {
      if (hero.equipped[slot] && hero.equipped[slot].id === itemId) { item = hero.equipped[slot]; fromSlot = slot; }
    });
  }
  if (!item) return { ok: false, reason: "introuvable" };
  if (idx >= 0) hero.inventory.splice(idx, 1);
  if (fromSlot) delete hero.equipped[fromSlot];
  const runes = [];
  const rate = BALANCE.runeRate + (state.meta.forgeLevel | 0) * 0.0008;
  (item.lines || []).forEach((ln) => {
    if (rng() < rate) {
      const n = rng() < 0.12 ? 2 : 1;
      hero.runes[ln.stat] = (hero.runes[ln.stat] || 0) + n;
      runes.push({ stat: ln.stat, n });
    }
  });
  addJobXp(state.meta, "forge", 3 + runes.length * 4);
  recomputeVitals(hero);
  return { ok: true, runes };
}

export function forgePreview(state, item, stat) {
  const lv = state.meta.forgeLevel | 0 || 1;
  const filled = (item.lines || []).length;
  const has = (item.lines || []).some((l) => l.stat === stat);
  let p = 0.4 + lv * 0.009 - filled * 0.035;
  if (!has && filled >= (item.maxLines | 0 || 6)) p -= 0.25;
  p = clamp(p, 0.08, 0.86);
  return { success: p, neutral: (1 - p) * 0.35, fail: 1 - p - (1 - p) * 0.35 };
}

export function forge(state, itemId, stat, rng) {
  const hero = state.hero;
  if (!RUNE_VALUE[stat]) return { ok: false, reason: "rune" };
  if ((hero.runes[stat] || 0) < 1) return { ok: false, reason: "stock" };
  const item = findItem(hero, itemId);
  if (!item) return { ok: false, reason: "introuvable" };
  hero.runes[stat] -= 1;
  const preview = forgePreview(state, item, stat);
  const rollP = rng();
  const amount = RUNE_VALUE[stat];
  let outcome = "fail";
  if (rollP < preview.success) {
    outcome = "success";
    const line = item.lines.find((l) => l.stat === stat);
    if (line) line.value += amount;
    else if (item.lines.length < (item.maxLines | 0 || 6)) item.lines.push({ stat, value: amount, min: 0, max: amount * 4 });
    else {
      outcome = "fail";
      const victim = item.lines[Math.floor(rng() * item.lines.length)];
      if (victim) victim.value = Math.max(0, victim.value - Math.max(1, Math.round(amount * 0.6)));
    }
  } else if (rollP < preview.success + preview.neutral) outcome = "neutral";
  else {
    const others = item.lines.filter((l) => l.stat !== stat);
    const victim = (others.length ? others : item.lines)[Math.floor(rng() * Math.max(1, (others.length ? others : item.lines).length))];
    if (victim) victim.value = Math.max(0, victim.value - Math.max(1, Math.ceil(amount * 0.8)));
  }
  item.lines = item.lines.filter((l) => l.value > 0);
  addJobXp(state.meta, "forge", outcome === "success" ? 10 : 6);
  recomputeVitals(hero);
  return { ok: true, outcome, preview };
}

function findItem(hero, itemId) {
  const inv = hero.inventory.find((it) => it.id === itemId);
  if (inv) return inv;
  for (const slot of SLOTS) if (hero.equipped[slot] && hero.equipped[slot].id === itemId) return hero.equipped[slot];
  return null;
}

export function equip(hero, itemId) {
  const idx = hero.inventory.findIndex((it) => it.id === itemId);
  if (idx < 0) return { ok: false, reason: "introuvable" };
  const item = hero.inventory[idx];
  let slot = item.slot;
  if (slot === "anneauG" || slot === "anneauD" || slot === "anneau") {
    slot = hero.equipped.anneauG ? "anneauD" : "anneauG";
    item.slot = slot;
  }
  if (SLOTS.indexOf(slot) < 0) return { ok: false, reason: "slot" };
  hero.inventory.splice(idx, 1);
  if (hero.equipped[slot]) hero.inventory.push(hero.equipped[slot]);
  hero.equipped[slot] = item;
  recomputeVitals(hero);
  return { ok: true, slot };
}

export function unequip(hero, slot) {
  if (!hero.equipped[slot]) return { ok: false, reason: "vide" };
  hero.inventory.push(hero.equipped[slot]);
  delete hero.equipped[slot];
  recomputeVitals(hero);
  return { ok: true };
}

export function healPrice(hero, tier) {
  const lv = hero.level | 0 || 1;
  if (tier === "mediocre") return 5 + lv * 2;
  if (tier === "bon") return 14 + lv * 7;
  return 32 + lv * 16;
}

export function healAmount(hero, tier, rng) {
  const max = hero.pvMax || 50;
  if (tier === "mediocre") return roll(rng, Math.max(8, Math.round(max * 0.18)), Math.max(14, Math.round(max * 0.4)));
  if (tier === "bon") {
    const r = rng();
    if (r < 0.12) return Math.round(max * (0.12 + rng() * 0.1));
    if (r > 0.9) return Math.round(max * (0.55 + rng() * 0.25));
    return Math.round(max * (0.3 + rng() * 0.12));
  }
  if (rng() < 0.78) return Math.round(max * (0.62 + rng() * 0.38));
  return Math.round(max * (0.35 + rng() * 0.15));
}

export function applyHeal(hero, tier, rng) {
  const price = healPrice(hero, tier);
  if (hero.pv >= hero.pvMax) return { ok: false, reason: "plein" };
  if (hero.gold < price) return { ok: false, reason: "kamas", price };
  const amount = healAmount(hero, tier, rng);
  hero.gold -= price;
  const before = hero.pv;
  hero.pv = Math.min(hero.pvMax, hero.pv + amount);
  return { ok: true, amount: hero.pv - before, price };
}

export function fleePrice(hero) {
  const gold = hero.gold | 0;
  if (gold <= 0) return null;
  return Math.max(1, Math.round(gold * BALANCE.fleeShare));
}

export function useFlee(hero) {
  if ((hero.fleeCharges | 0) > 0) {
    hero.fleeCharges -= 1;
    return { ok: true, paid: 0, via: "charge" };
  }
  const price = fleePrice(hero);
  if (price == null || hero.gold < price) return { ok: false, reason: "kamas" };
  hero.gold -= price;
  return { ok: true, paid: price, via: "kamas" };
}

export function refreshShop(state, rng) {
  const hero = state.hero;
  const offers = [];
  const mats = MATERIALS.slice();
  for (let i = 0; i < 4; i++) {
    const m = mats.splice(Math.floor(rng() * mats.length), 1)[0];
    if (!m) break;
    const price = Math.round(m.price * (0.85 + hero.level * 0.03));
    offers.push({ id: "m" + m.id + i, kind: "material", ref: m.id, name: m.name, family: m.family, price, qty: 1 + (rng() < 0.3 ? 1 : 0) });
  }
  for (let i = 0; i < 2; i++) {
    const item = makeItem(rng, { level: clamp(hero.level + roll(rng, -1, 2), 1, 50), quality: 0.7 + rng() * 0.35, element: pick(rng, hero.elements.concat(["neutre"])) });
    const price = 8 + Math.round(item.level * 2.4 * Math.max(1, item.lines.length));
    offers.push({ id: item.id, kind: "item", name: item.name, price, item });
  }
  if (hero.level >= 48 && rng() < 0.02) {
    const item = makeItem(rng, { level: 50, quality: 1.4, rare: true, element: hero.elements[0] });
    offers.push({ id: item.id, kind: "item", name: item.name, price: 220 + hero.level * 8, item, rare: true });
  }
  const potion = fleePrice(hero);
  offers.push({ id: "potion", kind: "potion", name: "Potion de fuite", price: potion || Math.max(1, Math.round((8 + hero.gold) * 0.6)), qty: 1 });
  state.shop = offers;
  return offers;
}

export function buy(state, offerId) {
  const hero = state.hero;
  const offer = (state.shop || []).find((o) => o.id === offerId);
  if (!offer) return { ok: false, reason: "offre" };
  const price = offer.kind === "potion" ? (fleePrice(hero) || offer.price) : offer.price;
  if (hero.gold < price) return { ok: false, reason: "kamas", price };
  hero.gold -= price;
  if (offer.kind === "material") hero.materials[offer.ref] = (hero.materials[offer.ref] || 0) + (offer.qty || 1);
  else if (offer.kind === "item") hero.inventory.push(offer.item);
  else if (offer.kind === "potion") hero.fleeCharges = (hero.fleeCharges | 0) + 1;
  offer.sold = true;
  return { ok: true, price };
}

function fighterFrom(source, side, spot, leader) {
  const eff = source.eff || source.stats || emptyBase();
  const lv = source.level | 0 || 1;
  const spells = (source.spells || []).filter((s) => (s.unlock | 0) <= lv).map((s) => spellForLevel(s, lv));
  return {
    id: source.id || side + spot.c,
    name: source.name || "Combattant",
    side, leader: !!leader,
    level: source.level | 0 || 1,
    c: spot.c, r: spot.r,
    pv: source.pv != null ? source.pv : (source.pvMax || 50),
    pvMax: source.pvMax || 50,
    pa: eff.pa || source.paMax || 6,
    paMax: eff.pa || source.paMax || 6,
    pm: eff.pm || source.pmMax || 3,
    pmMax: eff.pm || source.pmMax || 3,
    po: eff.po || 0,
    stats: {
      force: eff.force | 0, intel: eff.intel | 0, chance: eff.chance | 0,
      agi: eff.agi | 0, sage: eff.sage | 0, ini: eff.ini | 0, vit: eff.vit | 0,
    },
    res: eff.res ? Object.assign(emptyRes(), eff.res) : emptyRes(),
    spells,
    shield: 0,
    alive: true,
    overlay: null,
    items: source.items || equippedItems(source),
    moved: false,
    summoned: 0,
  };
}

function npcHero(rng, level, catalog, gearQuality) {
  const h = createHero((rng() * 1e9) >>> 0, catalog);
  while (h.level < level) gainXp(h, xpNeed(h.level));
  const n = level < 16 ? 1 : level < 28 ? 2 : level < 40 ? 3 : 6;
  for (let i = 0; i < n; i++) {
    const it = makeItem(rng, { level: clamp(level + roll(rng, -2, 1), 1, 50), quality: gearQuality, element: pick(rng, h.elements) });
    h.inventory.push(it);
    equip(h, it.id);
  }
  recomputeVitals(h);
  h.pv = h.pvMax;
  return h;
}

function splitLevels(total, n, rng) {
  const out = [];
  let left = Math.max(n, total);
  for (let i = 0; i < n; i++) {
    const slots = n - i;
    if (i === n - 1) { out.push(clamp(left, 1, 50)); break; }
    const avg = left / slots;
    const v = clamp(Math.round(avg * (0.75 + rng() * 0.5)), 1, 50);
    out.push(v);
    left -= v;
  }
  const sum = out.reduce((a, b) => a + b, 0);
  out[out.length - 1] = clamp(out[out.length - 1] + (total - sum), 1, 50);
  return out;
}

export function rollTeamSize(rng) {
  const bag = [2, 2, 3, 3, 5, 10];
  return bag[Math.floor(rng() * bag.length)];
}

export function buildEncounter(state, mode, rng, catalog) {
  const hero = state.hero;
  recomputeVitals(hero);
  const size = mode === "equipe" ? rollTeamSize(rng) : 1;
  const allies = [];
  const companions = (hero.companions || []).slice(0, Math.max(0, size - 1));
  companions.forEach((c) => allies.push(c));
  const levels = companions.map((c) => c.level | 0);
  while (levels.length < size - 1) {
    levels.push(clamp(hero.level + roll(rng, -2, 2), 1, 50));
  }
  const allyHeroes = companions.slice();
  while (allyHeroes.length < size - 1) {
    const lv = levels[allyHeroes.length];
    const q = lv >= 40 ? 1.15 : lv >= 35 ? 1.05 : lv >= 15 ? 0.85 : 0.6;
    allyHeroes.push(npcHero(rng, lv, catalog, q));
  }
  const sum = hero.level + allyHeroes.reduce((a, h) => a + (h.level | 0), 0);
  const foeLevels = splitLevels(sum, size, rng);
  const late = hero.level >= 48 ? 2.05 : hero.level >= 45 ? 1.9 : hero.level >= 40 ? 1.84 : hero.level >= 36 ? 0.88 : hero.level >= 18 ? 0.42 : hero.level >= 8 ? 0.3 : 0.18;
  const foes = foeLevels.map((lv) => npcHero(rng, lv, catalog, late * (0.9 + rng() * 0.25)));
  if (hero.level >= 45 && rng() < BALANCE.rareDrop * 8) {
    const rare = makeItem(rng, { level: 50, rare: true, quality: 1.5, element: pick(rng, ["terre", "feu", "eau", "air"]) });
    foes[0].inventory.push(rare);
    foes[0].items = equippedItems(foes[0]).concat([rare]);
  }
  return { size, mode: size === 1 ? "1v1" : size + "v" + size, allies: allyHeroes, foes, levelSum: sum };
}

function placeTeam(list, side) {
  return list.map((f, i) => {
    const col = side === "a" ? (i % 3) : 9 - (i % 3);
    const row = 1 + (i % 8);
    f.c = clamp(col, 0, 9);
    f.r = clamp(row + Math.floor(i / 3), 0, 9);
    return f;
  });
}

function occupied(units, c, r, self) {
  return units.some((u) => u !== self && u.alive && u.c === c && u.r === r);
}

function stepToward(unit, target, units) {
  const opts = [];
  if (unit.c !== target.c) opts.push({ c: unit.c + Math.sign(target.c - unit.c), r: unit.r });
  if (unit.r !== target.r) opts.push({ c: unit.c, r: unit.r + Math.sign(target.r - unit.r) });
  opts.sort((a, b) => chebyshev(a, target) - chebyshev(b, target));
  for (const o of opts) {
    if (o.c < 0 || o.r < 0 || o.c > 9 || o.r > 9) continue;
    if (occupied(units, o.c, o.r, unit)) continue;
    unit.c = o.c; unit.r = o.r; unit.moved = true;
    return true;
  }
  return false;
}

function stepAway(unit, from, units) {
  const opts = [{ c: unit.c + 1, r: unit.r }, { c: unit.c - 1, r: unit.r }, { c: unit.c, r: unit.r + 1 }, { c: unit.c, r: unit.r - 1 }]
    .filter((o) => o.c >= 0 && o.r >= 0 && o.c <= 9 && o.r <= 9 && !occupied(units, o.c, o.r, unit));
  opts.sort((a, b) => chebyshev(b, from) - chebyshev(a, from));
  if (!opts.length || chebyshev(opts[0], from) <= chebyshev(unit, from)) return false;
  unit.c = opts[0].c; unit.r = opts[0].r; unit.moved = true;
  return true;
}

function nearest(unit, list) {
  let best = null; let bestD = 99;
  list.forEach((f) => {
    if (!f.alive) return;
    const d = chebyshev(unit, f);
    if (d < bestD) { bestD = d; best = f; }
  });
  return best;
}

function woundedAlly(unit, allies) {
  let best = null; let ratio = 0.72;
  allies.forEach((a) => {
    if (!a.alive || a === unit) return;
    const r = a.pv / Math.max(1, a.pvMax);
    if (r < ratio) { ratio = r; best = a; }
  });
  return best;
}

function castOn(rng, caster, spell, target, allies, foes, log, zones) {
  const cost = Math.max(1, spell.cost | 0);
  if (caster.pa < cost) return false;
  const range = (spell.range | 0) + (caster.po | 0);
  if (spell.type === "heal" || (spell.heal && spell.type !== "damage" && spell.type !== "shield")) {
    const dest = (spell.range | 0) > 0 ? (woundedAlly(caster, allies) || caster) : caster;
    if ((spell.range | 0) > 0 && chebyshev(caster, dest) > range) return false;
    caster.pa -= cost;
    const h = roll(rng, spell.heal[0], spell.heal[1]);
    const stat = caster.stats.intel || 0;
    const amount = Math.max(1, Math.round(h * (1 + stat / 140)));
    dest.pv = Math.min(dest.pvMax, dest.pv + amount);
    if (dest === caster) log.healed += amount;
    else log.healedAlly += amount;
    return true;
  }
  if (spell.type === "shield") {
    caster.pa -= cost;
    const h = roll(rng, (spell.heal || [8, 12])[0], (spell.heal || [8, 12])[1]);
    caster.shield += Math.max(2, Math.round(h * 0.7));
    caster.pv = Math.min(caster.pvMax, caster.pv + Math.round(h * 0.25));
    log.shielded += 1;
    return true;
  }
  if (spell.effect === "roulade" || spell.type === "move" || (spell.role === "mobility" && spell.type !== "damage")) {
    caster.pa -= cost;
    const cells = Math.max(1, range);
    const foe = target;
    if (!foe) return true;
    const toward = chebyshev(caster, foe) > 1;
    for (let i = 0; i < cells; i++) {
      const ok = toward ? stepToward(caster, foe, allies.concat(foes)) : stepAway(caster, foe, allies.concat(foes));
      if (!ok) break;
    }
    return true;
  }
  if (!target || !target.alive) return false;
  if (chebyshev(caster, target) > range) return false;
  caster.pa -= cost;
  const hits = spell.hits || 1;
  const statName = ELEMENT_STAT[spell.element] || "force";
  const stat = caster.stats[statName] || 0;
  let power = (1 + stat / BALANCE.statScale) * BALANCE.dmgFactor;
  if (caster.leader) power *= 1 + (BALANCE.playerSkill - 1) * leaderFade(caster.level);
  const res = Math.min(BALANCE.resistCap, (target.res && target.res[spell.element]) || 0);
  for (let h = 0; h < hits; h++) {
    if (!target.alive) break;
    let d = Math.max(1, Math.round(roll(rng, spell.dmg[0] || 4, spell.dmg[1] || spell.dmg[0] || 6) * power * (1 - res)));
    if (spell.rare) d = Math.round(d * 1.08);
    if (target.leader) {
      const fade = leaderFade(target.level);
      const guard = 1 - (1 - BALANCE.playerGuard) * fade;
      d = Math.max(1, Math.round(d * guard));
    }
    if (target.shield > 0) {
      const a = Math.min(target.shield, d);
      target.shield -= a;
      d -= a;
    }
    const ero = Math.floor(d * BALANCE.erosion);
    target.pvMax = Math.max(1, target.pvMax - ero);
    target.pv = Math.max(0, Math.min(target.pvMax, target.pv - d));
    log.dealt += d;
    if (target.pv <= 0) {
      target.alive = false;
      log.kills += 1;
    }
  }
  if (spell.effect === "push" && target.alive) stepAway(target, caster, allies.concat(foes));
  if (spell.effect === "drainPA" && target.alive) {
    if (rng() > (target.stats.sage || 0) / 400) target.pa = Math.max(0, target.pa - 1);
  }
  if (spell.effect === "drainPM" && target.alive) {
    if (rng() > (target.stats.sage || 0) / 400) target.pmMax = Math.max(0, target.pmMax - 1);
  }
  if ((spell.effect === "glyph" || spell.effect === "trap") && zones) {
    zones.push({ c: target.c, r: target.r, dmg: 4 + Math.round((spell.dmg[0] || 4) * 0.35), turns: 2, side: caster.side, trap: spell.effect === "trap" });
  }
  if ((spell.effect === "summon" || spell.type === "summon") && caster.summoned < 1) {
    caster.summoned += 1;
    const sk = {
      id: caster.id + "-os", name: "Ossement", side: caster.side, leader: false, level: caster.level,
      c: caster.c, r: clamp(caster.r + 1, 0, 9), pv: 16 + caster.level, pvMax: 16 + caster.level,
      pa: 4, paMax: 4, pm: 3, pmMax: 3, po: 0,
      stats: { force: 8 + Math.floor(caster.level / 2), intel: 5, chance: 5, agi: 6, sage: 0, ini: 8, vit: 5 },
      res: emptyRes(),
      spells: [{ id: "os-frappe", name: "Morsure", cost: 3, range: 1, dmg: [5, 8], type: "damage", effect: "", element: "neutre", hits: 1 }],
      shield: 0, alive: true, overlay: "squelette", items: [], moved: false, summoned: 1, summonTurns: 4,
    };
    allies.push(sk);
    log.summoned += 1;
  }
  return true;
}

function chooseAndAct(rng, unit, allies, foes, log, zones) {
  unit.pa = unit.paMax;
  unit.pm = unit.pmMax;
  let casts = 0;
  const budget = 7;
  for (let g = 0; g < budget && unit.alive; g++) {
    const liveFoes = foes.filter((f) => f.alive);
    if (!liveFoes.length) break;
    const policy = unit._policy;
    const target = policy && policy.focus === "weakest"
      ? liveFoes.reduce((best, f) => (!best || f.pv < best.pv ? f : best), null)
      : policy && policy.focus === "leader"
        ? (liveFoes.find((f) => f.leader) || nearest(unit, liveFoes))
        : nearest(unit, liveFoes);
    const spells = unit.spells || [];
    const hp = unit.pv / Math.max(1, unit.pvMax);
    const healAt = policy && policy.healAt != null ? policy.healAt : 0.62;
    let acted = false;
    if (hp < healAt) {
      const heal = spells.find((s) => (s.type === "heal" || s.type === "shield") && unit.pa >= (s.cost | 0));
      if (heal && castOn(rng, unit, heal, unit, allies, foes, log, zones)) { casts++; acted = true; }
    }
    if (!acted) {
      const ally = woundedAlly(unit, allies);
      const help = ally && spells.find((s) => s.type === "heal" && (s.range | 0) > 0 && unit.pa >= (s.cost | 0));
      if (help && castOn(rng, unit, help, ally, allies, foes, log, zones)) { casts++; acted = true; }
    }
    if (!acted && target) {
      const ready = spells.filter((s) => s.type !== "heal" && s.type !== "shield" && s.effect !== "roulade" && unit.pa >= (s.cost | 0) && chebyshev(unit, target) <= (s.range | 0) + (unit.po | 0));
      ready.sort((a, b) => ((b.dmg ? (b.dmg[0] + b.dmg[1]) : 0) / Math.max(1, b.cost)) - ((a.dmg ? (a.dmg[0] + a.dmg[1]) : 0) / Math.max(1, a.cost)));
      if (ready[0] && castOn(rng, unit, ready[0], target, allies, foes, log, zones)) { casts++; acted = true; }
    }
    if (!acted && target && chebyshev(unit, target) > 1) {
      const dash = spells.find((s) => (s.effect === "roulade" || s.type === "move") && unit.pa >= (s.cost | 0));
      if (dash && castOn(rng, unit, dash, target, allies, foes, log, zones)) { casts++; acted = true; }
    }
    if (acted) continue;
    if (unit.pm <= 0 || !target) break;
    const ranged = spells.some((s) => (s.range | 0) >= 3 && s.type === "damage");
    const kite = !(policy && policy.kite === false);
    const moved = kite && ranged && chebyshev(unit, target) <= 1 ? stepAway(unit, target, allies.concat(foes)) : stepToward(unit, target, allies.concat(foes));
    if (!moved) break;
    unit.pm -= 1;
  }
  if (casts >= 3) log.combos += 1;
  if (casts >= 2) log.fast += 1;
  zones.forEach((z) => {
    if (z.turns <= 0 || z.side === unit.side) return;
    if (z.trap) return;
    if (Math.max(Math.abs(unit.c - z.c), Math.abs(unit.r - z.r)) <= 1 && unit.alive) {
      unit.pv = Math.max(0, unit.pv - z.dmg);
      if (unit.pv <= 0) unit.alive = false;
    }
  });
}

export function simulateBattle(sideA, sideB, options) {
  const opt = options || {};
  const rng = mulberry32(opt.seed != null ? opt.seed : 1);
  const allies = placeTeam(sideA.map((u) => Object.assign({}, u, { side: "a", alive: true, shield: 0, moved: false, summoned: 0 })), "a");
  const foes = placeTeam(sideB.map((u) => Object.assign({}, u, { side: "b", alive: true, shield: 0, moved: false, summoned: 0 })), "b");
  const leader = allies.find((u) => u.leader) || allies[0];
  const log = { dealt: 0, healed: 0, healedAlly: 0, shielded: 0, kills: 0, combos: 0, fast: 0, summoned: 0 };
  const trace = opt.trace ? [] : null;
  const zones = [];
  const maxTurns = allies.length + foes.length >= 16 ? 8 : allies.length + foes.length >= 8 ? 10 : 14;
  let turns = 0;
  let winner = "draw";
  for (let t = 0; t < maxTurns; t++) {
    turns = t + 1;
    const order = allies.concat(foes).filter((u) => u.alive).sort((a, b) => (b.stats.ini || 0) - (a.stats.ini || 0));
    for (const unit of order) {
      if (!unit.alive) continue;
      if (unit.summonTurns != null) {
        unit.summonTurns -= 1;
        if (unit.summonTurns <= 0) { unit.alive = false; continue; }
      }
      const friends = unit.side === "a" ? allies : foes;
      const enemies = unit.side === "a" ? foes : allies;
      const before = unit === leader ? leader.moved : true;
      chooseAndAct(rng, unit, friends, enemies, unit.side === "a" && unit.leader ? log : { dealt: 0, healed: 0, healedAlly: 0, shielded: 0, kills: 0, combos: 0, fast: 0, summoned: 0 }, zones);
      if (trace) trace.push({ t: turns, who: unit.name, side: unit.side, pa: unit.pa, at: unit.c + "," + unit.r, pv: unit.pv });
      if (unit === leader && !before) { /* moved flag sticks */ }
      zones.forEach((z) => {
        if (!z.trap) return;
        enemies.forEach((f) => {
          if (f.alive && f.c === z.c && f.r === z.r) {
            f.pv = Math.max(0, f.pv - z.dmg);
            if (f.pv <= 0) f.alive = false;
            z.turns = 0;
          }
        });
      });
      if (!leader.alive) { winner = "b"; break; }
      if (!foes.some((f) => f.alive)) { winner = "a"; break; }
      if (!allies.some((f) => f.alive)) { winner = "b"; break; }
    }
    for (let i = zones.length - 1; i >= 0; i--) {
      zones[i].turns -= 1;
      if (zones[i].turns <= 0) zones.splice(i, 1);
    }
    if (winner !== "draw") break;
  }
  if (winner === "draw") {
    const ap = allies.filter((u) => u.alive).reduce((s, u) => s + u.pv, 0);
    const bp = foes.filter((u) => u.alive).reduce((s, u) => s + u.pv, 0);
    winner = ap === bp ? "draw" : ap > bp ? "a" : "b";
    if (!leader.alive) winner = "b";
  }
  const style = log.kills * 26 + log.combos * 12 + (log.healedAlly > 0 ? 16 : 0) + log.shielded * 10 + (turns <= 6 ? 14 : 0);
  const seconds = 12 + turns * 22 + Math.max(0, allies.length + foes.length - 2) * 7;
  return {
    winner,
    turns,
    seconds,
    style,
    grade: gradeOf(style),
    kills: log.kills,
    healed: log.healed + log.healedAlly,
    shielded: log.shielded,
    combos: log.combos,
    fastTurns: log.fast,
    playerMoved: !!(leader && leader.moved),
    playerAlive: !!(leader && leader.alive),
    playerPv: leader ? Math.max(0, leader.pv | 0) : 0,
    playerPvMax: leader ? leader.pvMax : 1,
    foeItems: foes.reduce((arr, f) => arr.concat(f.items || []), []),
    trace,
  };
}

export function unitsFromEncounter(hero, encounter) {
  recomputeVitals(hero);
  const player = fighterFrom(hero, "a", { c: 1, r: 4 }, true);
  player.pv = hero.pv;
  player.items = equippedItems(hero);
  const allies = [player].concat(encounter.allies.map((h, i) => {
    recomputeVitals(h);
    h.pv = h.pvMax;
    return fighterFrom(h, "a", { c: 1, r: i }, false);
  }));
  const foes = encounter.foes.map((h, i) => {
    recomputeVitals(h);
    h.pv = h.pvMax;
    const f = fighterFrom(h, "b", { c: 8, r: i }, false);
    f.layers = layersForHero(h);
    return f;
  });
  allies.forEach((u, i) => {
    u.layers = i === 0 ? layersForHero(hero) : layersForHero(encounter.allies[i - 1] || u);
  });
  return { allies, foes };
}

export function challengeSuccess(report, selected) {
  const done = [];
  (selected || []).forEach((id) => {
    if (id === "immobile" && report.playerMoved === false && report.winner === "a") done.push(id);
    if (id === "cinqTours" && report.turns <= 5 && report.winner === "a") done.push(id);
    if (id === "sansSoin" && (report.healed | 0) === 0 && report.winner === "a") done.push(id);
  });
  return done;
}

export function settleFight(state, report, rng) {
  const hero = state.hero;
  hero.fights += 1;
  if (report.fled) {
    const paid = report.paid | 0;
    return { ok: true, fled: true, paid, text: "Fuite. Aucune autre perte." };
  }
  const victory = report.winner === "a" && report.playerAlive !== false;
  hero.kills += report.kills | 0;
  hero.healsGiven += report.healed | 0;
  hero.shieldsGiven += report.shielded | 0;
  hero.combos += report.combos | 0;
  hero.fastTurns += report.fastTurns | 0;
  hero.styleLast = report.style | 0;
  hero.styleSum += hero.styleLast;
  if (hero.styleLast > hero.styleBest) hero.styleBest = hero.styleLast;
  if (!victory) {
    return finishDeath(state, report);
  }
  hero.wins += 1;
  hero.pv = clamp(report.playerPv != null ? report.playerPv : hero.pv, 1, hero.pvMax);
  recomputeVitals(hero);
  if (hero.pv > hero.pvMax) hero.pv = hero.pvMax;
  const foeLevels = (report.foeLevels && report.foeLevels.length) ? report.foeLevels : [hero.level];
  const avg = foeLevels.reduce((a, b) => a + b, 0) / foeLevels.length;
  const sage = (hero.eff && hero.eff.sage) || hero.base.sage || 5;
  const done = challengeSuccess(report, report.challenges || []);
  let xp = Math.round((BALANCE.xpFlat + avg * BALANCE.xpPerLevel) * (1 + (foeLevels.length - 1) * 0.08) * (1 + sage / 220));
  let gold = Math.round((BALANCE.goldFlat + avg * BALANCE.goldPerLevel) * (0.85 + rng() * 0.4) * (1 + (foeLevels.length - 1) * 0.05));
  if (done.length) { xp = Math.round(xp * (1 + 0.18 * done.length)); gold = Math.round(gold * (1 + 0.12 * done.length)); }
  if (hero.level >= 36) xp = Math.round(xp * 5);
  const levels = gainXp(hero, xp);
  hero.gold += gold;
  const drops = [];
  (report.foeItems || []).forEach((it) => {
    const rate = it.rare ? BALANCE.rareDrop : BALANCE.dropRate + done.length * 0.02;
    if (rng() < rate) {
      const copy = JSON.parse(JSON.stringify(it));
      copy.id = "dp" + Math.floor(rng() * 1e9).toString(16);
      hero.inventory.push(copy);
      drops.push(copy);
    }
  });
  let companion = null;
  if (rng() < 0.42) companion = offerCompanion(state, rng);
  return { ok: true, victory: true, xp, gold, levels, drops, grade: gradeOf(hero.styleLast), challenges: done, companion, style: hero.styleLast };
}

function offerCompanion(state, rng) {
  const hero = state.hero;
  const lv = clamp(hero.level + roll(rng, -3, 1), 1, 50);
  const c = npcHero(rng, lv, state._catalog || [], 0.75);
  c.kind = "compagnon";
  const speed = hero.fights ? hero.fastTurns / hero.fights : 0;
  let p = 0.12 + Math.min(0.2, hero.level / 250) + Math.min(0.22, hero.styleBest / 500) + Math.min(0.18, hero.combos / 50) + Math.min(0.14, (hero.healsGiven + hero.shieldsGiven) / 40) + Math.min(0.14, speed);
  p = clamp(p, 0.05, 0.88);
  const accepted = rng() < p;
  return { companion: publicCompanion(c), accepted, chance: Math.round(p * 100) };
}

function publicCompanion(c) {
  return {
    id: c.id, name: c.name, level: c.level, gene: c.gene, elements: c.elements,
    spells: c.spells, base: c.base, equipped: c.equipped, inventory: [],
    pv: c.pvMax, pvMax: c.pvMax, materials: {}, runes: {}, companions: [],
    fights: 0, wins: 0, kills: 0, healsGiven: 0, shieldsGiven: 0, combos: 0, fastTurns: 0,
    styleLast: 0, styleBest: 0, styleSum: 0, alive: true, gold: 0, xp: 0, fleeCharges: 0, dna: c.dna,
  };
}

export function recruit(hero, companion) {
  if (!companion) return { ok: false };
  recomputeVitals(companion);
  hero.companions = hero.companions || [];
  if (hero.companions.length >= 9) return { ok: false, reason: "complet" };
  hero.companions.push(companion);
  return { ok: true };
}

export function finishDeath(state, report) {
  const hero = state.hero;
  const entry = {
    name: hero.name,
    level: hero.level,
    style: hero.styleBest,
    grade: gradeOf(hero.styleBest),
    fights: hero.fights,
    wins: hero.wins,
    gear: Object.keys(hero.equipped || {}).length,
    gene: hero.gene,
    at: Date.now(),
  };
  state.meta.board.push(entry);
  state.meta.board.sort((a, b) => b.level - a.level || b.style - a.style || b.fights - a.fights);
  state.meta.board = state.meta.board.slice(0, 20);
  const meta = state.meta;
  const seed = ((hero.seed | 0) + hero.fights * 17 + 1) >>> 0;
  state.hero = createHero(seed, state._catalog || []);
  refreshShop(state, mulberry32(seed ^ 0x51a));
  return { ok: true, victory: false, dead: true, entry, next: state.hero.name, style: report && report.style };
}

export function acceptanceChance(hero) {
  const speed = hero.fights ? hero.fastTurns / Math.max(1, hero.fights) : 0;
  return clamp(0.12 + Math.min(0.2, hero.level / 250) + Math.min(0.22, (hero.styleBest || 0) / 500) + Math.min(0.18, (hero.combos || 0) / 50) + Math.min(0.14, ((hero.healsGiven || 0) + (hero.shieldsGiven || 0)) / 40) + Math.min(0.14, speed), 0.05, 0.88);
}

export function knownMaterial(meta, id) {
  const m = materialById(id);
  const k = meta.knowledge && meta.knowledge[id];
  if (!m) return null;
  if (!k || k.samples < 1) return { id, name: m.name, family: m.family, known: false, confidence: 0 };
  return { id, name: m.name, family: m.family, known: true, confidence: k.confidence, stat: k.confidence >= 0.45 ? m.stat : null, amount: k.confidence >= 0.8 ? m.amount : null, vague: k.confidence < 0.8 };
}

function aiPolicy(state, rng) {
  const hero = state.hero;
  equipBest(hero);
  recomputeVitals(hero);
  for (let n = 0; n < 4; n++) {
    const ratio = hero.pv / Math.max(1, hero.pvMax);
    if (ratio >= 0.84) break;
    const cheap = healPrice(hero, "mediocre");
    if (hero.gold < cheap) break;
    const tier = ratio < 0.4 && hero.gold >= healPrice(hero, "bon") ? "bon" : "mediocre";
    if (!applyHeal(hero, tier, rng).ok) break;
  }
  const reserve = healPrice(hero, "mediocre") * 2;
  (state.shop || []).forEach((offer) => {
    if (offer.sold || offer.kind !== "item" || !offer.item) return;
    const slot = offer.item.slot === "anneau"
      ? (itemScore(hero.equipped.anneauG) <= itemScore(hero.equipped.anneauD) ? "anneauG" : "anneauD")
      : offer.item.slot;
    if (SLOTS.indexOf(slot) < 0) return;
    const cur = hero.equipped[slot];
    if (cur && itemScore(offer.item) <= itemScore(cur) + 2) return;
    if (hero.gold - offer.price < reserve) return;
    if (offer.price > hero.gold * 0.7) return;
    buy(state, offer.id);
  });
  equipBest(hero);
  if (hero.level >= 4 && rng() < 0.55) {
    const bag = Object.keys(hero.materials).filter((id) => hero.materials[id] > 0);
    if (bag.length) {
      const slot = pick(rng, ["arme", "coiffe", "cape", "bottes", "ceinture", "bouclier", "amulette"]);
      const use = bag.slice(0, 1 + Math.floor(rng() * Math.min(3, bag.length)));
      craft(state, slot, use, rng);
    } else if (hero.gold > reserve + 20) {
      const matOffer = (state.shop || []).find((o) => o.kind === "material" && !o.sold && hero.gold - o.price >= reserve);
      if (matOffer) buy(state, matOffer.id);
    }
  }
  const runeStat = Object.keys(hero.runes).find((s) => hero.runes[s] > 0);
  if (runeStat && rng() < 0.4) {
    const it = hero.inventory[0] || hero.equipped.arme;
    if (it) forge(state, it.id, runeStat, rng);
  }
  if (hero.inventory.length > 6 && rng() < 0.5) crush(state, hero.inventory[hero.inventory.length - 1].id, rng);
}

export function simulateRun(seed, catalog, options) {
  const opt = options || {};
  const state = createState(seed >>> 0, catalog);
  state._catalog = catalog;
  const rng = mulberry32(((seed >>> 0) * 13 + 7) >>> 0);
  const trace = { fights: 0, wins: 0, flees: 0, seconds: 0, reached: 1, deadAt: null, goldEnd: 0, styleBest: 0 };
  const cap = opt.maxFights || 260;
  while (state.hero && state.hero.alive && trace.fights < cap) {
    if (state.hero.level >= 50 && trace.fights > (opt.stopAfter50 || 12) + trace._at50) break;
    if (state.hero.level >= 50 && trace._at50 == null) trace._at50 = trace.fights;
    aiPolicy(state, rng);
    refreshShop(state, rng);
    if (opt.diary) opt.diary.push({ step: "before", lv: state.hero.level, pv: state.hero.pv, max: state.hero.pvMax, gold: state.hero.gold, eq: Object.keys(state.hero.equipped).length });
    const team = state.hero.level >= 12 && (state.hero.companions || []).length && rng() < 0.34;
    const encounter = buildEncounter(state, team ? "equipe" : "1v1", rng, catalog);
    const units = unitsFromEncounter(state.hero, encounter);
    equipBest(state.hero);
    const est = powerScore(state.hero) / Math.max(1, powerScore(encounter.foes[0]));
    const low = state.hero.pv / Math.max(1, state.hero.pvMax) < 0.5;
    if ((est < 0.62 || (low && est < 0.78)) && fleePrice(state.hero)) {
      const fled = useFlee(state.hero);
      if (fled.ok) {
        if (opt.diary) opt.diary.push({ step: "flee", est: +est.toFixed(2), gold: state.hero.gold });
        trace.flees += 1;
        trace.fights += 1;
        trace.seconds += 20;
        settleFight(state, { fled: true, paid: fled.paid, winner: "draw", style: 0, playerAlive: true }, rng);
        continue;
      }
    }
    const battle = simulateBattle(units.allies, units.foes, { seed: (rng() * 1e9) >>> 0 });
    battle.foeLevels = encounter.foes.map((f) => f.level);
    battle.challenges = [];
    const settled = settleFight(state, battle, rng);
    trace.fights += 1;
    trace.seconds += battle.seconds;
    if (opt.diary) opt.diary.push({ step: settled.dead ? "dead" : settled.victory ? "win" : "lose", est: +est.toFixed(2), turns: battle.turns, pv: battle.playerPv, style: battle.style, gold: state.hero.gold, lv: state.hero.level });
    if (settled.victory) trace.wins += 1;
    if (settled.companion && settled.companion.accepted) recruit(state.hero, settled.companion.companion);
    if (!settled.dead) equipBest(state.hero);
    if (settled.dead) {
      trace.deadAt = settled.entry.level;
      trace.reached = settled.entry.level;
      trace.styleBest = settled.entry.style;
      trace.gear = settled.entry.gear;
      break;
    }
    trace.reached = state.hero.level;
    trace.styleBest = state.hero.styleBest;
    if (state.hero.level >= 50 && opt.stopAt50) break;
  }
  if (!trace.deadAt && state.hero) {
    trace.reached = state.hero.level;
    trace.goldEnd = state.hero.gold;
    trace.styleBest = state.hero.styleBest;
    trace.cleared = state.hero.level >= 50;
  }
  trace.seconds = Math.round(trace.seconds);
  trace.craftLevel = state.meta.craftLevel;
  trace.forgeLevel = state.meta.forgeLevel;
  return trace;
}

export function attachCatalog(state, catalog) { state._catalog = catalog; return state; }
