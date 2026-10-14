/**
 * Volumes du cahier : 5 passes d’équilibrage, self-play, 10 000 parties.
 * Les ajustements de dégâts restent en mémoire : le grimoire versionné n’est pas réécrit.
 *
 *   node scripts/volume.js
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import {
  prepareCatalog, simulateBattle, simulateRun, xpNeed, BALANCE, mulberry32,
  createState, gainXp, buildEncounter, unitsFromEncounter, refreshShop, buy,
  equipBest, unequip, recomputeVitals, SLOTS,
} from "../js/roguelite.js";

const FIGHTS_PER_PASS = 100000;
const PASSES = 5;
const GEN_SIZE = 250000;
const MIN_FIGHTS = 1000000;
const MAX_FIGHTS = 5000000;
const STALL_LIMIT = 3;
const RUNS = 10000;

const raw = JSON.parse(readFileSync("data/generated-spells.json", "utf8"));
const catalog = prepareCatalog(raw.map((s) => Object.assign({}, s, { dmg: s.dmg ? s.dmg.slice() : s.dmg })));
const spells = catalog.filter((s) => String(s.id || "").startsWith("gen_")).map((s) => Object.assign({}, s, { dmg: s.dmg ? s.dmg.slice() : s.dmg }));

const STATS = { force: 50, intel: 50, chance: 50, agi: 50, sage: 8, ini: 12, vit: 20 };
const RES = { terre: 0, feu: 0, eau: 0, air: 0, neutre: 0 };
const punch = { id: "vol_punch", name: "Coup", type: "damage", role: "melee", element: "terre", cost: 3, range: 1, dmg: [8, 12], hits: 1, effect: "", aoe: 0 };

function shell(spellList) {
  return {
    name: "P", level: 20, leader: false,
    pv: 140, pvMax: 140, pa: 6, paMax: 6, pm: 3, pmMax: 3, po: 0,
    stats: STATS, res: RES, spells: spellList, items: [],
    c: 1, r: 4,
  };
}

function log(msg) {
  console.log(new Date().toISOString() + " " + msg);
}

mkdirSync("docs", { recursive: true });

const perSpell = Math.max(1000, Math.ceil(FIGHTS_PER_PASS / spells.length));
const passTotal = perSpell * spells.length;
log("équilibrage " + PASSES + " × " + passTotal + " (" + spells.length + " sorts × " + perSpell + ")");

const balance = [];
const tBalance = Date.now();
for (let pass = 1; pass <= PASSES; pass++) {
  const t = Date.now();
  let wins = 0;
  let fights = 0;
  const rows = [];
  let adjusted = 0;
  spells.forEach((sp, si) => {
    const a = shell([sp, punch]);
    const b = shell([punch]);
    let w = 0;
    for (let i = 0; i < perSpell; i++) {
      const r = simulateBattle([a], [b], { seed: (pass * 1000003 + si * perSpell + i) >>> 0 });
      if (r.winner === "a") w++;
    }
    const rate = w / perSpell;
    wins += w;
    fights += perSpell;
    let action = "inchangé";
    if (sp.type === "damage" && sp.dmg) {
      if (rate > 0.58) {
        sp.dmg = sp.dmg.map((v) => Math.max(1, Math.round(v * 0.92)));
        action = "dégâts ×0,92";
        adjusted++;
      } else if (rate < 0.42) {
        sp.dmg = sp.dmg.map((v) => Math.max(1, Math.round((v || 1) * 1.08)));
        action = "dégâts ×1,08";
        adjusted++;
      }
    }
    rows.push({ id: sp.id, name: sp.name, type: sp.type, rate, action });
  });
  const mean = wins / fights;
  const ms = Date.now() - t;
  balance.push({ pass, fights, mean, adjusted, ms, rows });
  log("passe " + pass + " victoires " + (100 * mean).toFixed(1) + "% ajustés " + adjusted + " en " + ms + " ms");
  writeFileSync("docs/volume-progress.json", JSON.stringify({ phase: "balance", pass, fights, mean }, null, 2));
}
const balanceMs = Date.now() - tBalance;

const damageRows = balance[balance.length - 1].rows.filter((r) => r.type === "damage");
const outliers = damageRows.filter((r) => r.rate <= 0.35 || r.rate >= 0.7);

const kit = [];
const dmgSp = catalog.find((s) => s.type === "damage" && (s.range | 0) <= 2) || punch;
const farSp = catalog.find((s) => s.type === "damage" && (s.range | 0) >= 4) || dmgSp;
const healSp = catalog.find((s) => s.type === "heal" || s.type === "shield") || { id: "vol_heal", type: "heal", cost: 3, range: 0, heal: [12, 20], effect: "" };
kit.push(dmgSp, farSp, healSp);
const proto = shell(kit);
const MIX = [["1v1", 1, 100000], ["2v2", 2, 50000], ["3v3", 3, 40000], ["5v5", 5, 35000], ["10v10", 10, 25000]];
const squads = new Map();
function pair(n) {
  let got = squads.get(n);
  if (!got) {
    const A = [];
    const B = [];
    for (let i = 0; i < n; i++) {
      A.push(Object.assign({}, proto, { name: "A" + i }));
      B.push(Object.assign({}, proto, { name: "B" + i }));
    }
    got = { A, B };
    squads.set(n, got);
  }
  return got;
}

function generation(polA, polB, salt) {
  const by = {};
  let wins = 0;
  let fights = 0;
  let seed = salt;
  for (const [label, n, count] of MIX) {
    const { A, B } = pair(n);
    for (const u of A) u._policy = polA;
    for (const u of B) u._policy = polB;
    let w = 0;
    for (let i = 0; i < count; i++) {
      seed = (seed + 1) >>> 0;
      const swap = (i & 1) === 1;
      for (const u of A) u._policy = swap ? polB : polA;
      for (const u of B) u._policy = swap ? polA : polB;
      const sideA = simulateBattle(A, B, { seed }).winner === "a";
      if (swap ? !sideA : sideA) w++;
    }
    by[label] = { n: count, wins: w, rate: w / count };
    wins += w;
    fights += count;
  }
  return { wins, fights, rate: wins / fights, by };
}

function mutate(p, rng) {
  const focuses = ["nearest", "weakest", "leader"];
  const healAt = Math.min(0.9, Math.max(0.25, p.healAt + (rng() - 0.5) * 0.18));
  return {
    healAt: Math.round(healAt * 1000) / 1000,
    kite: rng() < 0.28 ? !p.kite : p.kite,
    focus: rng() < 0.32 ? focuses[Math.floor(rng() * focuses.length)] : p.focus,
  };
}

log("self-play, génération " + GEN_SIZE);
const tAi = Date.now();
let champion = { healAt: 0.62, kite: true, focus: "nearest" };
const history = [];
let aiFights = 0;
let stall = 0;
let gen = 0;
const rng = mulberry32(20261014);
const mirror = generation(champion, champion, 11);
aiFights += mirror.fights;
let bestRate = mirror.rate;
history.push({ gen, kind: "miroir", policy: Object.assign({}, champion), rate: mirror.rate, by: mirror.by, fights: mirror.fights, accepted: false });
log("miroir " + (100 * mirror.rate).toFixed(2) + "% en " + mirror.fights + " combats");
gen = 1;
while (aiFights < MAX_FIGHTS && !(stall >= STALL_LIMIT && aiFights >= MIN_FIGHTS)) {
  const challenger = mutate(champion, rng);
  const g = generation(challenger, champion, 1000 + gen * 17);
  aiFights += g.fights;
  const improved = g.rate > bestRate + 0.005;
  if (improved) {
    champion = challenger;
    bestRate = g.rate;
    stall = 0;
  } else stall++;
  history.push({ gen, kind: "mutant", policy: challenger, rate: g.rate, by: g.by, fights: g.fights, accepted: improved, stall });
  log("gen " + gen + " " + (100 * g.rate).toFixed(2) + "% " + (improved ? "retenu" : "écarté") + " stall " + stall + " total " + aiFights);
  writeFileSync("docs/volume-progress.json", JSON.stringify({ phase: "ai", gen, aiFights, stall, rate: g.rate }, null, 2));
  gen++;
}
const aiMs = Date.now() - tAi;

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
log("sonde 40-50");
const lateN = 60;
const lateProbe = { n: lateN, rows: [] };
for (const level of [35, 40, 45, 49]) {
  const cell = { level };
  for (const [key, rounds] of [["nude", 0], ["mid", 2], ["full", 40]]) {
    let w = 0;
    for (let i = 0; i < lateN; i++) if (lateDuel(5000 + i * 13 + level * 10 + rounds, level, rounds)) w++;
    cell[key] = (100 * w / lateN).toFixed(1) + " % (" + w + "/" + lateN + ")";
  }
  lateProbe.rows.push(cell);
  log("L" + level + " " + cell.nude + " / " + cell.mid + " / " + cell.full);
}

log("parties " + RUNS);
const tRuns = Date.now();
const runs = [];
for (let i = 0; i < RUNS; i++) {
  runs.push(simulateRun((i * 17 + 3) >>> 0, catalog, { maxFights: 260, stopAt50: true }));
  if (i > 0 && i % 1000 === 0) {
    log("parties " + i + " en " + (Date.now() - tRuns) + " ms");
    writeFileSync("docs/volume-progress.json", JSON.stringify({ phase: "runs", i }, null, 2));
  }
}
const runMs = Date.now() - tRuns;
const avg = (k) => runs.reduce((a, r) => a + (r[k] || 0), 0) / runs.length;
const clears = runs.filter((r) => r.cleared);
const bins = { "1-7": 0, "8-20": 0, "21-34": 0, "35-49": 0, "50": 0 };
for (const r of runs) {
  const lv = r.cleared ? 50 : (r.deadAt || r.reached);
  if (r.cleared || lv >= 50) bins["50"]++;
  else if (lv <= 7) bins["1-7"]++;
  else if (lv <= 20) bins["8-20"]++;
  else if (lv <= 34) bins["21-34"]++;
  else bins["35-49"]++;
}
let xp40 = 0;
for (let l = 40; l < 50; l++) xp40 += xpNeed(l);
const reward40 = Math.round((BALANCE.xpFlat + 40 * BALANCE.xpPerLevel) * 1.8);

const lines = [];
lines.push("# Rapport de parties");
lines.push("");
lines.push("Volume intégral des parties, lancé par `node scripts/volume.js`. Les duels d’équilibrage et le self-play sont dans `docs/rapport-volumes.md`.");
lines.push("");
lines.push("## Parties de niveau 1 vers 50");
lines.push("");
lines.push("| Indicateur | Valeur |");
lines.push("| --- | --- |");
lines.push("| Parties | " + RUNS + " |");
lines.push("| Durée du calcul | " + runMs + " ms |");
lines.push("| Niveau moyen à l’arrêt | " + avg("reached").toFixed(2) + " |");
lines.push("| Combats moyens | " + avg("fights").toFixed(1) + " |");
lines.push("| Victoires moyennes | " + avg("wins").toFixed(1) + " |");
lines.push("| Fuites moyennes | " + avg("flees").toFixed(1) + " |");
lines.push("| Heures modélisées moyennes | " + (avg("seconds") / 3600).toFixed(2) + " |");
lines.push("| Arrivées au niveau 50 | " + clears.length + " (" + (100 * clears.length / RUNS).toFixed(1) + " %) |");
if (clears.length) {
  const h = clears.reduce((a, r) => a + r.seconds, 0) / clears.length / 3600;
  lines.push("| Heures modélisées des arrivées | " + h.toFixed(2) + " |");
}
lines.push("");
lines.push("Répartition des morts (ou arrivée) :");
lines.push("");
Object.keys(bins).forEach((k) => lines.push("- " + k + " : " + bins[k] + " (" + (100 * bins[k] / RUNS).toFixed(1) + " %)"));
lines.push("");
lines.push("## Bande 40-50");
lines.push("");
lines.push("Sonde de " + lateProbe.n + " duels par case, lancée dans le même passage. Le personnage est mis au niveau indiqué. Nu : aucun objet. Milieu : quelques achats en boutique. Complet : quarante passages boutique puis le meilleur objet par emplacement. L’adversaire est celui d’une rencontre 1v1 à ce niveau (six pièces à partir de 40, qualité 1,74 puis 1,96 et 2,02). L’avantage du meneur retombe à 0,24 à partir du niveau 40.");
lines.push("");
lines.push("| Niveau | Nu | Milieu | Complet |");
lines.push("| --- | --- | --- | --- |");
lateProbe.rows.forEach((row) => {
  lines.push("| " + row.level + " | " + row.nude + " | " + row.mid + " | " + row.full + " |");
});
lines.push("");
lines.push("XP des niveaux 40 à 49 : " + xp40 + ". Récompense d’un duel au niveau 40 (×1,8) : environ " + reward40 + ". Combats théoriques si chaque combat est gagné : " + Math.ceil(xp40 / reward40) + ".");
lines.push("");
lines.push("Constantes : érosion " + BALANCE.erosion + ", fuite " + BALANCE.fleeShare + ", drop " + BALANCE.dropRate + ", dégâts ×" + BALANCE.dmgFactor + ", avantage joueur ×" + BALANCE.playerSkill + ", garde ×" + BALANCE.playerGuard + ".");
lines.push("");
writeFileSync("docs/rapport-parties.md", lines.join("\n"));

const vol = [];
vol.push("# Rapport des volumes");
vol.push("");
vol.push("Chiffres mesurés par `scripts/volume.js`. Les dégâts ajustés pendant l’équilibrage ne sont pas réécrits dans `data/generated-spells.json`.");
vol.push("");
vol.push("## Équilibrage");
vol.push("");
vol.push(PASSES + " passes, " + passTotal + " combats chacune (" + spells.length + " sorts du grimoire × " + perSpell + " duels, donc au moins 1 000 combats par sort et par passe). Durée totale : " + balanceMs + " ms.");
vol.push("");
vol.push("| Passe | Combats | Victoires du sort testé | Ajustements | Durée |");
vol.push("| --- | --- | --- | --- | --- |");
balance.forEach((p) => {
  vol.push("| " + p.pass + " | " + p.fights + " | " + (100 * p.mean).toFixed(1) + " % | " + p.adjusted + " | " + p.ms + " ms |");
});
vol.push("");
vol.push("Règle, en mémoire seulement : un sort de dégâts au-dessus de 58 % voit ses dégâts ×0,92 ; en dessous de 42 %, ×1,08. Le coup de référence adverse est un coup fixe 8-12.");
vol.push("");
if (outliers.length) {
  vol.push("Sorts de dégâts encore sous 35 % ou au-dessus de 70 % après la passe " + PASSES + " :");
  vol.push("");
  outliers.forEach((r) => vol.push("- " + r.name + " (`" + r.id + "`) — " + (100 * r.rate).toFixed(1) + " % · " + r.action));
  vol.push("");
} else {
  vol.push("Aucun sort de dégâts sous 35 % ou au-dessus de 70 % à la dernière passe.");
  vol.push("");
}
vol.push("## Self-play");
vol.push("");
vol.push("Formats par génération : 1v1 " + MIX[0][2] + ", 2v2 " + MIX[1][2] + ", 3v3 " + MIX[2][2] + ", 5v5 " + MIX[3][2] + ", 10v10 " + MIX[4][2] + " (" + GEN_SIZE + " combats). Arrêt après " + STALL_LIMIT + " générations sans gain de plus de 0,5 point contre le champion, une fois " + MIN_FIGHTS + " combats atteints. Plafond " + MAX_FIGHTS + ".");
vol.push("");
vol.push("| | Valeur |");
vol.push("| --- | --- |");
vol.push("| Combats | " + aiFights + " |");
vol.push("| Durée | " + aiMs + " ms |");
vol.push("| Générations | " + history.length + " |");
vol.push("| Politique retenue | soin sous " + champion.healAt + ", kiting " + (champion.kite ? "oui" : "non") + ", cible " + champion.focus + " |");
vol.push("");
history.forEach((h) => {
  const bits = Object.keys(h.by).map((k) => k + " " + (100 * h.by[k].rate).toFixed(1) + "%").join(", ");
  vol.push("- Génération " + h.gen + " (" + h.kind + ") — " + (100 * h.rate).toFixed(2) + " % sur " + h.fights + " combats" + (h.accepted ? " · retenue" : "") + ". " + bits);
});
vol.push("");
vol.push("Le fichier `data/ai-policy.json` du combat libre n’est pas remplacé : il sert encore à pondérer les sorts. Cette politique de self-play est celle du simulateur (`_policy` sur l’unité).");
vol.push("");
vol.push("## Parties");
vol.push("");
vol.push(RUNS + " parties en " + runMs + " ms. Arrivées au niveau 50 : " + clears.length + " (" + (100 * clears.length / RUNS).toFixed(1) + " %). Détail dans `docs/rapport-parties.md`.");
vol.push("");
writeFileSync("docs/rapport-volumes.md", vol.join("\n"));
writeFileSync("docs/volume-progress.json", JSON.stringify({
  phase: "done",
  balanceMs, passTotal, passes: balance.map((p) => ({ pass: p.pass, fights: p.fights, mean: p.mean, adjusted: p.adjusted, ms: p.ms })),
  aiFights, aiMs, champion, stall, runs: RUNS, runMs, clears: clears.length, bins,
}, null, 2));
log("terminé équilibrage " + balanceMs + " ms, ia " + aiFights + " en " + aiMs + " ms, parties " + runMs + " ms, clears " + clears.length);
