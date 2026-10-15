/**
 * Ramène chaque sort de dégâts dans la bande 35–70 %
 * et réécrit data/generated-spells.json.
 * Le sort est joué avec un coup fixe 8–12, contre ce même coup seul.
 * On garde le réglage le plus fort qui reste dans la bande sur deux graines.
 *
 *   node scripts/persist-balance.js
 */
import { readFileSync, writeFileSync } from "node:fs";
import { simulateBattle } from "../js/roguelite.js";
import { validateSpell } from "../js/spell-lab.js";

const N = 280;
const raw = JSON.parse(readFileSync("data/generated-spells.json", "utf8"));
const spells = raw.filter((s) => s && String(s.id || "").startsWith("gen_") && s.type === "damage" && Array.isArray(s.dmg));

const STATS = { force: 50, intel: 50, chance: 50, agi: 50, sage: 8, ini: 12, vit: 20 };
const RES = { terre: 0, feu: 0, eau: 0, air: 0, neutre: 0 };
const punch = { id: "vol_punch", name: "Coup", type: "damage", role: "melee", element: "terre", cost: 3, range: 1, dmg: [8, 12], hits: 1, effect: "", aoe: 0 };

function shell(spellList) {
  return {
    name: "P", level: 20, leader: false,
    pv: 140, pvMax: 140, pa: 6, paMax: 6, pm: 3, pmMax: 3, po: 0,
    stats: Object.assign({}, STATS), res: Object.assign({}, RES),
    spells: spellList, items: [], c: 1, r: 4,
  };
}

function rateOf(sp, salt) {
  let w = 0;
  for (let i = 0; i < N; i++) {
    const r = simulateBattle([shell([sp, punch])], [shell([punch])], { seed: (salt + i * 19) >>> 0 });
    if (r.winner === "a") w++;
  }
  return w / N;
}

function pair(sp, salt) {
  const a = rateOf(sp, salt);
  const b = rateOf(sp, salt + 250000);
  const inside = a >= 0.35 && a <= 0.7 && b >= 0.35 && b <= 0.7;
  return { a, b, mean: (a + b) / 2, inside };
}

const FACTORS = [0.45, 0.6, 0.75, 0.9, 1.05, 1.25, 1.5, 1.8];
const t0 = Date.now();
const notes = [];

spells.forEach((sp, si) => {
  const orig = sp.dmg.slice();
  const ranges = [sp.range | 0];
  if ((sp.range | 0) > 1) ranges.push(Math.max(1, (sp.range | 0) - 1));
  if ((sp.range | 0) > 2) ranges.push(1);
  let best = null;
  ranges.forEach((range) => {
    FACTORS.forEach((factor, fi) => {
      sp.range = range;
      sp.dmg = orig.map((v) => Math.max(1, Math.min(48, Math.round((v || 1) * factor))));
      if (sp.dmg[1] < sp.dmg[0]) sp.dmg[1] = sp.dmg[0];
      const got = pair(sp, 1000 + si * 8000 + range * 100 + fi * 17);
      const power = ((sp.dmg[0] + sp.dmg[1]) / 2) * Math.max(1, range);
      if (!best) best = { dmg: sp.dmg.slice(), range, got, power };
      else if (got.inside && (!best.got.inside || power > best.power)) best = { dmg: sp.dmg.slice(), range, got, power };
      else if (!best.got.inside && !got.inside && Math.abs(got.mean - 0.5) < Math.abs(best.got.mean - 0.5)) best = { dmg: sp.dmg.slice(), range, got, power };
    });
  });
  sp.dmg = best.dmg;
  sp.range = best.range;
  notes.push({ id: sp.id, name: sp.name, ...best.got, dmg: best.dmg, range: best.range });
});

console.log(new Date().toISOString() + " recherche " + (Date.now() - t0) + " ms");
const still = notes.filter((n) => !n.inside);
for (const sp of raw) {
  const res = validateSpell(sp);
  if (!res.ok) {
    console.error("invalide", sp.id, res.errors.join(", "));
    process.exit(1);
  }
}
writeFileSync("data/generated-spells.json", JSON.stringify(raw, null, 2) + "\n");

const lines = [];
lines.push("# Grimoire réécrit");
lines.push("");
lines.push("Chaque sort de dégâts `gen_*` est joué avec un coup fixe 8–12 contre ce même coup seul. Deux échantillons de " + N + " duels doivent tous les deux rester entre 35 % et 70 %. Parmi les réglages qui tiennent, on garde les dégâts et la portée les plus hauts. Le fichier `data/generated-spells.json` est réécrit.");
lines.push("");
lines.push("Sorts de dégâts : " + notes.length + ". Stables dans la bande : " + (notes.length - still.length) + ". Durée : " + (Date.now() - t0) + " ms.");
lines.push("");
if (!still.length) lines.push("Aucun sort de dégâts hors de la bande sur les deux échantillons.");
else {
  lines.push("Sans réglage stable dans la bande :");
  lines.push("");
  still.forEach((r) => lines.push("- " + r.name + " (`" + r.id + "`) — " + (100 * r.a).toFixed(1) + " % et " + (100 * r.b).toFixed(1) + " % · dégâts " + r.dmg.join("–") + " · portée " + r.range));
}
lines.push("");
writeFileSync("docs/rapport-grimoire.md", lines.join("\n"));
console.log("hors bande " + still.length + " / " + notes.length);
still.forEach((r) => console.log(r.id, (100 * r.a).toFixed(1), (100 * r.b).toFixed(1), r.dmg.join("-"), "r" + r.range));
if (still.length) process.exit(2);
