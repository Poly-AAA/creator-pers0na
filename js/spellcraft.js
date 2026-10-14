/**
 * Spellcraft — fabrication automatique de sorts pour NEURO CORE.
 *
 * Réutilise les mêmes leviers que le jeu :
 * - animations de cast (clés PackSprites : Attack1…, RunAttack, strafes)
 * - effets mécaniques (dégâts, poussée, drain de PA, soin, bouclier)
 * - améliorations numériques (mêmes champs que evoAdd / st.evo :
 *   dmg, range, cost, heal, push, drain, pierce, crit, shieldAmt)
 *
 * Le format produit est celui de SPELL_DEFS, plus `bakedEvo` copié
 * dans le grimoire. Le combat applique alors ces bonus via Spells.cost,
 * Spells.range, Spells.dmgRange et resolveAttack — sans second moteur.
 */

export const SCHOOLS = ["Cinétique", "Thermique", "Électrique", "Neuro", "Gravité", "Nanites"];

/** Animations réellement présentes dans le pack de combat (thug). */
export const ANIMATIONS = [
  { id: "attack", pack: "attack", file: "Attack1.png", label: "Attack1", kind: "melee", range: 1 },
  { id: "attack2", pack: "attack2", file: "Attack2.png", label: "Attack2", kind: "melee", range: 1 },
  { id: "attack3", pack: "attack3", file: "Attack3.png", label: "Attack3", kind: "melee", range: 1 },
  { id: "attack4", pack: "attack4", file: "Attack4.png", label: "Attack4", kind: "reach", range: 2 },
  { id: "runAttack", pack: "runAttack", file: "RunAttack.png", label: "Course-attaque", kind: "dash", range: 3 },
  { id: "strafeL", pack: "strafeL", file: "StrafeLeftAttack.png", label: "Strafe gauche", kind: "ranged", range: 4 },
  { id: "strafeR", pack: "strafeR", file: "StrafeRightAttack.png", label: "Strafe droite", kind: "ranged", range: 4 },
];

/**
 * Effets de base. `effect` est le drapeau lu par le combat
 * (push / drainPA), comme dans SPELL_DEFS.
 */
export const EFFECTS = [
  { id: "entaille", name: "Entaille", school: "Cinétique", type: "damage", dmg: [10, 14], cost: 3, effect: null, anchor: "limb" },
  { id: "impact", name: "Impact", school: "Cinétique", type: "damage", dmg: [12, 18], cost: 4, effect: "push", anchor: "limb" },
  { id: "arc", name: "Arc", school: "Électrique", type: "damage", dmg: [9, 13], cost: 3, effect: "drainPA", anchor: "limb" },
  { id: "brulure", name: "Brûlure", school: "Thermique", type: "damage", dmg: [12, 17], cost: 4, effect: null, anchor: "bodyCenter" },
  { id: "parasite", name: "Parasite", school: "Neuro", type: "damage", dmg: [8, 12], cost: 4, effect: "drainPA", anchor: "bodyCenter" },
  { id: "onde", name: "Onde", school: "Gravité", type: "damage", dmg: [7, 11], cost: 3, effect: "push", anchor: "grid" },
  { id: "soin", name: "Soin", school: "Nanites", type: "heal", heal: 14, cost: 3, effect: null, anchor: "bodyCenter" },
  { id: "barriere", name: "Barrière", school: "Nanites", type: "shield", shield: 18, shieldTurns: 2, cost: 3, effect: null, anchor: "bodyCenter" },
];

/** Améliorations : mêmes clés que evoAdd dans neuro-core.html. */
export const UPGRADES = [
  { id: "surcharge", name: "Surcharge", key: "dmg", val: 4, types: ["damage"] },
  { id: "frappe", name: "Frappe lourde", key: "dmg", val: 2, types: ["damage"] },
  { id: "allonge", name: "Allonge", key: "range", val: 1, types: ["damage", "heal", "shield"] },
  { id: "econome", name: "Économe", key: "cost", val: -1, types: ["damage", "heal", "shield"] },
  { id: "poussee", name: "Poussée", key: "push", val: 1, types: ["damage"] },
  { id: "drain", name: "Drain neural", key: "drain", val: 1, types: ["damage"] },
  { id: "percage", name: "Perçage", key: "pierce", val: 0.25, types: ["damage"] },
  { id: "soinplus", name: "Régénération", key: "heal", val: 6, types: ["heal"] },
  { id: "blindage", name: "Blindage", key: "shieldAmt", val: 8, types: ["shield"] },
];

const ANIM_BY_ID = Object.fromEntries(ANIMATIONS.map((a) => [a.id, a]));
const EFFECT_BY_ID = Object.fromEntries(EFFECTS.map((e) => [e.id, e]));
const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

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

export function findAnim(id) { return ANIM_BY_ID[id] || null; }
export function findEffect(id) { return EFFECT_BY_ID[id] || null; }
export function findUpgrade(id) { return UPGRADE_BY_ID[id] || null; }

export function upgradesFor(type) {
  return UPGRADES.filter((u) => u.types.includes(type));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compose un sort : animation + effet + 0..n améliorations.
 * Les bonus restent dans `bakedEvo` (pas additionnés aux dégâts de base),
 * pour que le grimoire du jeu les applique via le moteur existant.
 */
export function composeSpell({ animId, effectId, upgradeIds = [], custom = false } = {}) {
  const anim = findAnim(animId);
  const effect = findEffect(effectId);
  if (!anim || !effect) {
    return { spell: null, errors: ["animation ou effet inconnu"] };
  }
  const ups = [];
  const errors = [];
  const bakedEvo = {};
  for (const id of upgradeIds) {
    const up = findUpgrade(id);
    if (!up) { errors.push("amélioration inconnue : " + id); continue; }
    if (!up.types.includes(effect.type)) { errors.push(up.name + " incompatible avec " + effect.type); continue; }
    if (ups.some((u) => u.id === up.id)) continue;
    ups.push({ id: up.id, name: up.name, key: up.key, val: up.val });
    bakedEvo[up.key] = (bakedEvo[up.key] || 0) + up.val;
  }
  const suffix = ups.length ? ups.map((u) => u.id).join("_") : "base";
  const id = "gen_" + anim.id + "_" + effect.id + "_" + suffix;
  const upName = ups.length ? " (" + ups.map((u) => u.name).join(", ") + ")" : "";
  const spell = {
    id,
    name: effect.name + " · " + anim.label + upName,
    school: effect.school,
    cost: effect.cost,
    range: anim.range,
    type: effect.type,
    desc: buildDesc(effect, anim, ups),
    anim: anim.pack,
    fx: effect.id,
    anchor: effect.anchor,
    generated: true,
    custom: !!custom,
    upgrades: ups,
    bakedEvo,
  };
  if (effect.type === "damage") {
    spell.dmg = effect.dmg.slice();
    if (effect.effect) spell.effect = effect.effect;
  } else if (effect.type === "heal") {
    spell.heal = effect.heal;
  } else if (effect.type === "shield") {
    spell.shield = effect.shield;
    spell.shieldTurns = effect.shieldTurns || 2;
  }
  const check = validateSpell(spell);
  return { spell, errors: errors.concat(check.errors), ok: check.ok && errors.length === 0 };
}

function buildDesc(effect, anim, ups) {
  const bits = [effect.name + " (" + anim.label + ")"];
  if (effect.effect === "push") bits.push("repousse");
  if (effect.effect === "drainPA") bits.push("retire des PA");
  if (ups.length) bits.push(ups.map((u) => u.name).join(", "));
  return bits.join(" · ") + ".";
}

/** Stats effectives, mêmes formules que Spells.cost / range / dmgRange (sans niveaux). */
export function effectiveStats(spell) {
  const evo = spell.bakedEvo || {};
  const cost = Math.max(1, (spell.cost || 1) + (evo.cost || 0));
  const range = Math.max(0, (spell.range || 0) + (evo.range || 0));
  let dmg = null;
  let avg = 0;
  if (spell.type === "damage" && Array.isArray(spell.dmg)) {
    const lo = spell.dmg[0] + (evo.dmg || 0);
    const hi = spell.dmg[1] + (evo.dmg || 0);
    dmg = [lo, hi];
    avg = (lo + hi) / 2;
  } else if (spell.type === "heal") {
    avg = (spell.heal || 0) + (evo.heal || 0);
  } else if (spell.type === "shield") {
    avg = (spell.shield || 0) + (evo.shieldAmt || 0);
  }
  const perCost = cost > 0 ? avg / cost : 0;
  return { cost, range, dmg, avg, perCost, push: (spell.effect === "push" ? 1 : 0) + (evo.push || 0), drain: (spell.effect === "drainPA" ? 1 : 0) + (evo.drain || 0) };
}

export function validateSpell(spell) {
  const errors = [];
  if (!spell || typeof spell !== "object") return { ok: false, errors: ["sort absent"] };
  if (!spell.id || !/^[a-zA-Z0-9_]+$/.test(spell.id)) errors.push("id invalide");
  if (!spell.name || typeof spell.name !== "string") errors.push("nom manquant");
  if (!SCHOOLS.includes(spell.school)) errors.push("école inconnue");
  if (!["damage", "heal", "shield"].includes(spell.type)) errors.push("type non jouable");
  if (!findAnim(spell.anim) && !ANIMATIONS.some((a) => a.pack === spell.anim)) errors.push("animation inconnue");
  if (spell.fx && !findEffect(spell.fx)) errors.push("effet inconnu");
  const st = effectiveStats(spell);
  if (!Number.isFinite(st.cost) || st.cost < 1 || st.cost > 8) errors.push("coût hors bornes");
  if (!Number.isFinite(st.range) || st.range < 0 || st.range > 9) errors.push("portée hors bornes");
  if (spell.type === "damage") {
    if (!st.dmg || st.dmg.length !== 2 || !Number.isFinite(st.dmg[0]) || !Number.isFinite(st.dmg[1])) errors.push("dégâts illisibles");
    else if (st.dmg[0] < 1 || st.dmg[1] < st.dmg[0]) errors.push("fourchette de dégâts invalide");
    else if (st.perCost < 1 || st.perCost > 14) errors.push("dégâts/coût hors plage jouable (" + st.perCost.toFixed(2) + ")");
  }
  if (spell.type === "heal") {
    if (!Number.isFinite(st.avg) || st.avg < 1) errors.push("soin invalide");
    else if (st.perCost < 2 || st.perCost > 12) errors.push("soin/coût hors plage");
  }
  if (spell.type === "shield") {
    if (!Number.isFinite(st.avg) || st.avg < 1) errors.push("bouclier invalide");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Ramène dégâts/soin par PA dans une bande cible en ajustant la base
 * (le moteur de combat lira ensuite base + bakedEvo).
 */
export function balanceSpell(spell) {
  const next = clone(spell);
  const target = next.type === "heal" ? [4.2, 7.5] : next.type === "damage" ? [4.0, 7.2] : [5, 9];
  for (let i = 0; i < 6; i++) {
    const st = effectiveStats(next);
    if (next.type === "shield") break;
    if (st.perCost > target[1] && st.perCost > 0) {
      const factor = target[1] / st.perCost;
      if (next.type === "damage") {
        const lo = Math.max(1, Math.round(next.dmg[0] * factor));
        const hi = Math.max(lo, Math.round(next.dmg[1] * factor));
        next.dmg = [lo, hi];
      } else if (next.type === "heal") {
        next.heal = Math.max(1, Math.round((next.heal || 1) * factor));
      }
    } else if (st.perCost < target[0]) {
      if (next.type === "damage") {
        next.dmg = [next.dmg[0] + 1, next.dmg[1] + 1];
      } else if (next.type === "heal") {
        next.heal = (next.heal || 0) + 1;
      }
    } else break;
  }
  // coût plancher si la portée est longue et le sort trop rentable
  let st = effectiveStats(next);
  if (next.type === "damage" && st.range >= 4 && st.perCost > 6.2 && next.cost < 5) {
    next.cost += 1;
  }
  // rattrapage après arrondi : rester dans la bande haute
  for (let i = 0; i < 12; i++) {
    st = effectiveStats(next);
    if (next.type === "damage" && st.perCost > 7.2 && next.dmg[1] > next.dmg[0]) next.dmg[1] -= 1;
    else if (next.type === "damage" && st.perCost > 7.2 && next.dmg[0] > 1) {
      next.dmg[0] -= 1;
      next.dmg[1] = Math.max(next.dmg[0], next.dmg[1] - 1);
    } else if (next.type === "heal" && st.perCost > 7.5 && next.heal > 1) next.heal -= 1;
    else break;
  }
  return next;
}

export function applyUpgrade(spell, upgradeId) {
  const up = findUpgrade(upgradeId);
  if (!spell || !up) return { ok: false, reason: "amélioration inconnue" };
  if (!up.types.includes(spell.type)) return { ok: false, reason: "incompatible avec ce type" };
  if ((spell.upgrades || []).some((u) => u.id === up.id)) return { ok: false, reason: "déjà appliquée" };
  if (!spell.bakedEvo) spell.bakedEvo = {};
  if (!spell.upgrades) spell.upgrades = [];
  spell.bakedEvo[up.key] = (spell.bakedEvo[up.key] || 0) + up.val;
  spell.upgrades.push({ id: up.id, name: up.name, key: up.key, val: up.val });
  spell.desc = (spell.desc || "").replace(/\.$/, "") + (spell.desc && spell.desc.includes(up.name) ? "." : " · " + up.name + ".");
  const check = validateSpell(spell);
  if (!check.ok) {
    // trop fort : on rééquilibre la base puis on revalide
    const balanced = balanceSpell(spell);
    Object.assign(spell, balanced);
  }
  const again = validateSpell(spell);
  return { ok: again.ok, reason: again.ok ? "" : again.errors.join("; "), spell };
}

/**
 * Génère un catalogue : chaque couple animation × effet, avec 0, 1 ou 2
 * améliorations compatibles. Les sorts invalides sont écartés ; les autres
 * sont équilibrés puis revalidés.
 */
export function generateCatalog({ seed = 1889, maxUpgrades = 2 } = {}) {
  const rng = mulberry32(seed);
  const kept = [];
  const discarded = [];
  const seen = new Set();
  for (const anim of ANIMATIONS) {
    for (const effect of EFFECTS) {
      const pool = upgradesFor(effect.type);
      const variants = [[]];
      if (pool.length) variants.push([pool[Math.floor(rng() * pool.length)].id]);
      if (maxUpgrades >= 2 && pool.length >= 2) {
        const a = pool[Math.floor(rng() * pool.length)];
        let b = pool[Math.floor(rng() * pool.length)];
        if (b.id === a.id) b = pool[(pool.indexOf(a) + 1) % pool.length];
        variants.push([a.id, b.id]);
      }
      for (const upgradeIds of variants) {
        const { spell, errors, ok } = composeSpell({ animId: anim.id, effectId: effect.id, upgradeIds });
        if (!spell || seen.has(spell.id)) {
          discarded.push({ id: spell && spell.id, errors: errors.length ? errors : ["doublon ou composition vide"] });
          continue;
        }
        seen.add(spell.id);
        if (!ok) {
          discarded.push({ id: spell.id, errors });
          continue;
        }
        const balanced = balanceSpell(spell);
        const check = validateSpell(balanced);
        if (!check.ok) discarded.push({ id: balanced.id, errors: check.errors });
        else kept.push(balanced);
      }
    }
  }
  return { spells: kept, discarded, seed };
}

export function catalogMetrics(spells) {
  const rows = spells.map((s) => {
    const st = effectiveStats(s);
    return { id: s.id, name: s.name, type: s.type, school: s.school, cost: st.cost, range: st.range, avg: Math.round(st.avg * 10) / 10, perCost: Math.round(st.perCost * 100) / 100 };
  });
  const dmg = rows.filter((r) => r.type === "damage");
  const avg = (list, key) => list.length ? list.reduce((a, r) => a + r[key], 0) / list.length : 0;
  return {
    count: spells.length,
    byType: {
      damage: rows.filter((r) => r.type === "damage").length,
      heal: rows.filter((r) => r.type === "heal").length,
      shield: rows.filter((r) => r.type === "shield").length,
    },
    avgDamagePerCost: Math.round(avg(dmg, "perCost") * 100) / 100,
    minPerCost: dmg.length ? Math.min(...dmg.map((r) => r.perCost)) : 0,
    maxPerCost: dmg.length ? Math.max(...dmg.map((r) => r.perCost)) : 0,
    rows,
  };
}

function manhattan(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }

/**
 * Dégâts d'un cast, calqués sur resolveAttack (sans couverture / états) :
 * raw = dé[lo,hi] + floor(pow*0.2) ; réduction = floor(res*0.4*(1-pierce)).
 */
export function rollDamage(spell, attacker, target, rng) {
  const st = effectiveStats(spell);
  if (spell.type !== "damage" || !st.dmg) return 0;
  const lo = Math.round(st.dmg[0]);
  const hi = Math.round(st.dmg[1]);
  const roll = lo + Math.floor(rng() * (hi - lo + 1));
  let raw = roll + Math.floor((attacker.pow || 0) * 0.2);
  const pierce = Math.max(0, Math.min(1, (spell.bakedEvo && spell.bakedEvo.pierce) || 0));
  const reduce = Math.floor((target.res || 0) * 0.4 * (1 - pierce));
  let dmg = Math.max(1, raw - reduce);
  if (st.push > 0) dmg += Math.round(st.push * 2);
  return dmg;
}

function scoreSpell(caster, spell, foe, policy) {
  const st = effectiveStats(spell);
  const w = policy || defaultPolicy();
  if (st.cost > caster.pa) return -1e9;
  if (spell.type === "heal" || spell.type === "shield") {
    const missing = caster.pvMax - caster.pv;
    if (missing < 8) return -1e9;
    return missing * 0.35 * (w.heal || 1) - st.cost * (w.thrift || 0);
  }
  const dist = manhattan(caster, foe);
  if (dist > st.range) return -1e9;
  const avg = st.avg + Math.floor((caster.pow || 0) * 0.2);
  let s = avg * (w.damage || 1);
  s += st.push * (w.push || 0);
  s += st.drain * (w.drain || 0);
  s -= st.cost * (w.thrift || 0);
  if ((w.kite || 0) > 1 && dist <= 1 && st.range >= 3) s -= 6 * w.kite;
  return s;
}

export function defaultPolicy() {
  return { damage: 1, push: 6, drain: 8, heal: 1.1, kite: 0.4, thrift: 0.35 };
}

function pickAction(caster, foe, policy) {
  let best = null;
  let bestS = -1e9;
  for (const spell of caster.spells) {
    const s = scoreSpell(caster, spell, foe, policy);
    if (s > bestS) { bestS = s; best = spell; }
  }
  if (best && bestS > -1e8) return { kind: "cast", spell: best };
  return { kind: "move" };
}

function stepToward(a, b, kite) {
  const dist = manhattan(a, b);
  let dc = Math.sign(b.c - a.c);
  let dr = Math.sign(b.r - a.r);
  if (kite && dist <= 2) { dc = -dc; dr = -dr; }
  if (Math.abs(b.c - a.c) >= Math.abs(b.r - a.r)) a.c += dc || 0;
  else a.r += dr || 0;
  a.c = Math.max(0, Math.min(10, a.c));
  a.r = Math.max(0, Math.min(10, a.r));
}

/**
 * Combat simulé sans DOM. Deux combattants, grimoires de sorts,
 * PA/PM, formules de dégâts du jeu. Sert au tri et à l'équilibrage.
 */
export function simulateFight(spellsA, spellsB, rng, policyA, policyB, opts = {}) {
  const maxRounds = opts.maxRounds || 18;
  const make = (spells, c) => ({
    pv: 100, pvMax: 100, pa: 6, paMax: 6, pm: 3, pow: 10, res: 10,
    c, r: 4, spells: spells.filter(Boolean), shield: 0,
  });
  const A = make(spellsA, 1);
  const B = make(spellsB, 9);
  const log = { rounds: 0, dmgA: 0, dmgB: 0, castsA: 0, castsB: 0, draws: 0 };
  if (!A.spells.length || !B.spells.length) {
    return { winner: null, invalid: true, reason: "loadout vide", ...log };
  }
  const act = (caster, foe, policy, isA) => {
    caster.pa = caster.paMax;
    caster.pm = 3;
    let guard = 0;
    while (caster.pv > 0 && foe.pv > 0 && guard++ < 8) {
      const action = pickAction(caster, foe, policy);
      if (action.kind === "cast") {
        const spell = action.spell;
        const st = effectiveStats(spell);
        caster.pa -= st.cost;
        if (isA) log.castsA++; else log.castsB++;
        if (spell.type === "heal") {
          const gain = Math.min(caster.pvMax - caster.pv, Math.round(st.avg));
          caster.pv += gain;
        } else if (spell.type === "shield") {
          caster.shield += Math.round(st.avg);
        } else {
          let dmg = rollDamage(spell, caster, foe, rng);
          if (foe.shield > 0) {
            const absorbed = Math.min(foe.shield, dmg);
            foe.shield -= absorbed;
            dmg -= absorbed;
          }
          foe.pv = Math.max(0, foe.pv - dmg);
          if (isA) log.dmgA += dmg; else log.dmgB += dmg;
          if (st.drain > 0) foe.pa = Math.max(0, foe.pa - st.drain);
        }
      } else if (caster.pm > 0) {
        stepToward(caster, foe, (policy && policy.kite || 0) > 1.2);
        caster.pm -= 1;
        caster.pa = Math.max(0, caster.pa - 1);
      } else break;
      if (caster.pa <= 0 && caster.pm <= 0) break;
      if (action.kind === "cast" && caster.pa < 2 && caster.pm <= 0) break;
    }
  };
  for (let round = 1; round <= maxRounds; round++) {
    log.rounds = round;
    if (rng() < 0.5) {
      act(A, B, policyA, true);
      if (B.pv > 0) act(B, A, policyB, false);
    } else {
      act(B, A, policyB, false);
      if (A.pv > 0) act(A, B, policyA, true);
    }
    if (A.pv <= 0 || B.pv <= 0) break;
  }
  let winner = null;
  if (A.pv > 0 && B.pv <= 0) winner = "A";
  else if (B.pv > 0 && A.pv <= 0) winner = "B";
  else if (A.pv > B.pv) winner = "A";
  else if (B.pv > A.pv) winner = "B";
  else winner = "draw";
  return { winner, invalid: false, pvA: A.pv, pvB: B.pv, ...log };
}

export function loadoutOf(ids, catalog) {
  const byId = new Map(catalog.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/** Plusieurs duels. Renvoie taux de victoire du camp A. */
export function winRate(spellsA, spellsB, fights, seed, policyA, policyB) {
  const rng = mulberry32(seed);
  let wins = 0;
  let draws = 0;
  let dmg = 0;
  for (let i = 0; i < fights; i++) {
    const r = simulateFight(spellsA, spellsB, rng, policyA, policyB);
    if (r.invalid) return { wins: 0, fights: 0, rate: 0, invalid: true };
    if (r.winner === "A") wins++;
    else if (r.winner === "draw") draws++;
    dmg += r.dmgA;
  }
  return { wins, draws, fights, rate: fights ? wins / fights : 0, avgDmg: fights ? dmg / fights : 0 };
}

function mutatePolicy(base, rng, scale = 0.35) {
  const next = {};
  for (const k of Object.keys(base)) {
    const jitter = (rng() * 2 - 1) * scale * (Math.abs(base[k]) + 0.2);
    next[k] = Math.round(Math.max(0, base[k] + jitter) * 100) / 100;
  }
  return next;
}

/**
 * Auto-apprentissage léger : population de politiques, duels sur des
 * loadouts variés, on garde les meilleures et on les mute.
 * Pas de réseau de neurones — adapté au JS du projet.
 */
export function trainPolicies({ catalog, generations = 6, population = 8, fights = 6, seed = 42 } = {}) {
  if (!catalog || catalog.length < 2) {
    return { best: defaultPolicy(), history: [], error: "catalogue trop petit" };
  }
  const rng = mulberry32(seed);
  const damageSpells = catalog.filter((s) => s.type === "damage");
  const support = catalog.filter((s) => s.type !== "damage");
  const pool = damageSpells.length ? damageSpells : catalog;
  function randomLoadout() {
    const bag = pool.slice();
    const out = [];
    while (out.length < 3 && bag.length) {
      const i = Math.floor(rng() * bag.length);
      out.push(bag.splice(i, 1)[0]);
    }
    if (support.length && rng() < 0.45) out.push(support[Math.floor(rng() * support.length)]);
    return out;
  }
  let pop = [defaultPolicy()];
  while (pop.length < population) pop.push(mutatePolicy(defaultPolicy(), rng, 0.8));
  const history = [];
  for (let g = 1; g <= generations; g++) {
    const scored = pop.map((policy) => {
      let fitness = 0;
      let wins = 0;
      let played = 0;
      for (let f = 0; f < fights; f++) {
        const mine = randomLoadout();
        const theirs = randomLoadout();
        const foePolicy = pop[Math.floor(rng() * pop.length)];
        const r = simulateFight(mine, theirs, rng, policy, foePolicy);
        played++;
        if (r.winner === "A") { wins++; fitness += 1; }
        else if (r.winner === "draw") fitness += 0.35;
        fitness += Math.min(0.4, (r.dmgA || 0) / 400);
      }
      return { policy, fitness: fitness / Math.max(1, played), rate: played ? wins / played : 0 };
    });
    scored.sort((a, b) => b.fitness - a.fitness);
    history.push({
      generation: g,
      bestFitness: Math.round(scored[0].fitness * 1000) / 1000,
      bestWinRate: Math.round(scored[0].rate * 1000) / 1000,
      meanFitness: Math.round((scored.reduce((s, x) => s + x.fitness, 0) / scored.length) * 1000) / 1000,
    });
    const elite = scored.slice(0, Math.max(2, Math.ceil(population / 3)));
    const next = elite.map((e) => e.policy);
    while (next.length < population) {
      const parent = elite[Math.floor(rng() * elite.length)].policy;
      next.push(mutatePolicy(parent, rng, 0.28));
    }
    pop = next;
  }
  // réévalue le meilleur sur un échantillon fixe
  const best = pop[0];
  let wins = 0;
  const hold = 12;
  for (let i = 0; i < hold; i++) {
    const r = simulateFight(randomLoadout(), randomLoadout(), rng, best, defaultPolicy());
    if (r.winner === "A") wins++;
  }
  return {
    best,
    holdoutWinRate: Math.round((wins / hold) * 1000) / 1000,
    history,
    generations,
    population,
    fights,
  };
}

/** Repère les sorts dont le taux de victoire en duel miroir est absurde, et les rééquilibre. */
export function auditAndFix(spells, { fights = 8, seed = 7 } = {}) {
  const fixed = [];
  const dropped = [];
  const notes = [];
  const survivors = [];
  for (const spell of spells) {
    const check = validateSpell(spell);
    if (!check.ok) {
      const balanced = balanceSpell(spell);
      const again = validateSpell(balanced);
      if (!again.ok) { dropped.push({ id: spell.id, errors: again.errors }); continue; }
      fixed.push(balanced.id);
      survivors.push(balanced);
    } else survivors.push(spell);
  }
  // duel de chaque sort offensif contre un sort médian : si > 80% ou < 20%, ajuster
  const offenders = survivors.filter((s) => s.type === "damage");
  if (offenders.length >= 2) {
    const mid = offenders[Math.floor(offenders.length / 2)];
    offenders.forEach((spell, idx) => {
      if (spell.id === mid.id) return;
      const wr = winRate([spell], [mid], fights, seed + idx, defaultPolicy(), defaultPolicy());
      if (wr.rate > 0.8) {
        spell.dmg = [Math.max(1, spell.dmg[0] - 2), Math.max(1, spell.dmg[1] - 2)];
        const b = balanceSpell(spell);
        Object.assign(spell, b);
        notes.push({ id: spell.id, action: "nerf", winRate: wr.rate });
      } else if (wr.rate < 0.15 && wr.fights > 0) {
        spell.dmg = [spell.dmg[0] + 2, spell.dmg[1] + 2];
        const b = balanceSpell(spell);
        Object.assign(spell, b);
        notes.push({ id: spell.id, action: "buff", winRate: wr.rate });
      }
    });
  }
  const finalSpells = [];
  for (const spell of survivors) {
    const check = validateSpell(spell);
    if (!check.ok) dropped.push({ id: spell.id, errors: check.errors });
    else finalSpells.push(spell);
  }
  return { spells: finalSpells, fixed, dropped, notes };
}
