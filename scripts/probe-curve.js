/**
 * Sonde courte : bande 40-50 et un échantillon de parties vers le niveau 50.
 *   node scripts/probe-curve.js
 */
import { readFileSync } from "node:fs";
import {
  prepareCatalog, simulateBattle, simulateRun, xpNeed, mulberry32,
  createState, gainXp, buildEncounter, unitsFromEncounter, refreshShop, buy,
  equipBest, unequip, recomputeVitals, SLOTS,
} from "../js/roguelite.js";

const RUNS = Number(process.env.PROBE_RUNS || 2500);
const LATE_N = Number(process.env.PROBE_LATE || 40);
const catalog = prepareCatalog(JSON.parse(readFileSync("data/generated-spells.json", "utf8")));

function toLevel(hero, lv) {
  let guard = 0;
  while (hero.level < lv && guard++ < 80) gainXp(hero, xpNeed(hero.level));
  recomputeVitals(hero);
  hero.pv = hero.pvMax;
}
function gearRounds(state, rounds) {
  state.hero.gold = 500000;
  const shopRng = mulberry32(99 + rounds);
  for (let i = 0; i < rounds; i++) {
    refreshShop(state, shopRng);
    for (const o of state.shop) if (o.kind === "item" && !o.sold) buy(state, o.id);
  }
  equipBest(state.hero);
  recomputeVitals(state.hero);
  state.hero.pv = state.hero.pvMax;
}
function lateDuel(seed, level, rounds) {
  const state = createState(seed, catalog);
  toLevel(state.hero, level);
  if (rounds) gearRounds(state, rounds);
  else {
    for (const s of SLOTS) unequip(state.hero, s);
    state.hero.inventory = [];
    recomputeVitals(state.hero);
    state.hero.pv = state.hero.pvMax;
  }
  const enc = buildEncounter(state, "1v1", mulberry32(seed ^ (level * 17)), catalog);
  const units = unitsFromEncounter(state.hero, enc);
  const b = simulateBattle(units.allies, units.foes, { seed });
  return b.winner === "a" && b.playerAlive !== false;
}

const t0 = Date.now();
for (const level of [40, 45, 49]) {
  const bits = [];
  for (const [key, rounds] of [["nude", 0], ["mid", 2], ["full", 40]]) {
    let w = 0;
    for (let i = 0; i < LATE_N; i++) if (lateDuel(7000 + i * 13 + level * 10 + rounds, level, rounds)) w++;
    bits.push(key + " " + w + "/" + LATE_N);
  }
  console.log("L" + level + " " + bits.join("  "));
}
console.log("late " + (Date.now() - t0) + " ms");

const t1 = Date.now();
const runs = [];
for (let i = 0; i < RUNS; i++) runs.push(simulateRun((i * 17 + 3) >>> 0, catalog, { maxFights: 260, stopAt50: true }));
const clears = runs.filter((r) => r.cleared).length;
const bins = { "1-7": 0, "8-20": 0, "21-34": 0, "35-49": 0, "50": 0 };
for (const r of runs) {
  const lv = r.cleared ? 50 : (r.deadAt || r.reached);
  if (r.cleared || lv >= 50) bins["50"]++;
  else if (lv <= 7) bins["1-7"]++;
  else if (lv <= 20) bins["8-20"]++;
  else if (lv <= 34) bins["21-34"]++;
  else bins["35-49"]++;
}
const avg = runs.reduce((a, r) => a + r.reached, 0) / runs.length;
const cleared = runs.filter((r) => r.cleared);
const hours = cleared.length ? cleared.reduce((a, r) => a + r.seconds, 0) / cleared.length / 3600 : 0;
console.log("runs " + RUNS + " clears " + clears + " (" + (100 * clears / RUNS).toFixed(2) + "%) niveau moyen " + avg.toFixed(2) + " en " + (Date.now() - t1) + " ms");
console.log("heures moyennes des arrivées " + hours.toFixed(2));
console.log(JSON.stringify(bins));
