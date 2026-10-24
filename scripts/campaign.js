/**
 * Campagne chiffrée : duels, parties, tailles d’équipe.
 * Le volume complet du cahier (100 000 combats par passe, millions de self-play,
 * 10 000 parties) se lance avec des variables d’environnement. Sans elles, un
 * échantillon tient dans une exécution courte.
 *
 *   ROGUELITE_RUNS=400 ROGUELITE_DUELS=4000 node scripts/campaign.js
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { generateCatalog } from "../js/spell-lab.js";
import {
  prepareCatalog, simulateRun, simulateBattle, buildEncounter, createState,
  unitsFromEncounter, mulberry32, xpNeed, gainXp, BALANCE,
} from "../js/roguelite.js";

const RUNS = Number(process.env.ROGUELITE_RUNS || 240);
const DUELS = Number(process.env.ROGUELITE_DUELS || 2400);
const TEAMS = Number(process.env.ROGUELITE_TEAMS || 80);

const catalog = prepareCatalog(generateCatalog({ seed: 11, count: 48 }));

function hist(runs) {
  const bins = { "1-7": 0, "8-20": 0, "21-34": 0, "35-49": 0, "50": 0 };
  for (const r of runs) {
    const lv = r.cleared ? 50 : (r.deadAt || r.reached);
    if (r.cleared || lv >= 50) bins["50"]++;
    else if (lv <= 7) bins["1-7"]++;
    else if (lv <= 20) bins["8-20"]++;
    else if (lv <= 34) bins["21-34"]++;
    else bins["35-49"]++;
  }
  return bins;
}

const t0 = Date.now();
const runs = [];
for (let i = 0; i < RUNS; i++) runs.push(simulateRun(12000 + i * 17, catalog, { maxFights: 260, stopAt50: true }));
const runMs = Date.now() - t0;
const avg = (k) => runs.reduce((a, r) => a + (r[k] || 0), 0) / Math.max(1, runs.length);
const clears = runs.filter((r) => r.cleared);
const bins = hist(runs);

const duelT = Date.now();
let wins = 0, turns = 0, seconds = 0, style = 0;
const byLevel = {};
for (let i = 0; i < DUELS; i++) {
  const level = 1 + (i % 40);
  const rng = mulberry32(30000 + i);
  const st = createState(40000 + i, catalog);
  while (st.hero.level < level) gainXp(st.hero, xpNeed(st.hero.level));
  const enc = buildEncounter(st, "1v1", rng, catalog);
  const u = unitsFromEncounter(st.hero, enc);
  const b = simulateBattle(u.allies, u.foes, { seed: i + 3 });
  const win = b.winner === "a" && b.playerAlive !== false;
  if (win) wins++;
  turns += b.turns; seconds += b.seconds; style += b.style;
  const bucket = level < 8 ? "1-7" : level < 21 ? "8-20" : level < 35 ? "21-34" : "35-49";
  byLevel[bucket] = byLevel[bucket] || { n: 0, w: 0, sec: 0 };
  byLevel[bucket].n++; if (win) byLevel[bucket].w++; byLevel[bucket].sec += b.seconds;
}
const duelMs = Date.now() - duelT;

const teamT = Date.now();
const teamStats = {};
for (let i = 0; i < TEAMS; i++) {
  const rng = mulberry32(80000 + i);
  const st = createState(90000 + i, catalog);
  const enc = buildEncounter(st, "equipe", rng, catalog);
  const u = unitsFromEncounter(st.hero, enc);
  const b = simulateBattle(u.allies, u.foes, { seed: 500 + i });
  const key = enc.mode;
  teamStats[key] = teamStats[key] || { n: 0, w: 0, sec: 0, turns: 0 };
  teamStats[key].n++;
  if (b.winner === "a" && b.playerAlive !== false) teamStats[key].w++;
  teamStats[key].sec += b.seconds;
  teamStats[key].turns += b.turns;
}
const teamMs = Date.now() - teamT;

let xp40 = 0;
for (let l = 40; l < 50; l++) xp40 += xpNeed(l);
const reward40 = Math.round((BALANCE.xpFlat + 40 * BALANCE.xpPerLevel) * 1.8);

const lines = [];
lines.push("# Rapport de parties");
lines.push("");
lines.push("Échantillon produit par `scripts/campaign.js`. Ce n’est pas le volume intégral du cahier (100 000 combats par passe, 1 à 5 millions de self-play, 10 000 parties, 5 passes).");
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
lines.push("## Duels 1v1 par tranche de niveau");
lines.push("");
lines.push("Duels : " + DUELS + " en " + duelMs + " ms. Le personnage est nu (pas d’équipement) : la chute de victoires après le niveau 20 mesure la difficulté sans stuff. Victoires globales : " + (100 * wins / DUELS).toFixed(1) + " %. Tours moyens : " + (turns / DUELS).toFixed(2) + ". Secondes moyennes : " + Math.round(seconds / DUELS) + ". Style moyen : " + Math.round(style / DUELS) + ".");
lines.push("");
lines.push("| Tranche | Duels | Victoires | Secondes moyennes |");
lines.push("| --- | --- | --- | --- |");
Object.keys(byLevel).forEach((k) => {
  const b = byLevel[k];
  lines.push("| " + k + " | " + b.n + " | " + (100 * b.w / b.n).toFixed(1) + " % | " + Math.round(b.sec / b.n) + " |");
});
lines.push("");
lines.push("## Équipes");
lines.push("");
lines.push("Échantillons : " + TEAMS + " en " + teamMs + " ms. Le joueur est nu au niveau 1, donc les grandes équipes sont très dures.");
lines.push("");
Object.keys(teamStats).sort().forEach((k) => {
  const b = teamStats[k];
  lines.push("- " + k + " : n=" + b.n + ", victoires " + (100 * b.w / b.n).toFixed(1) + " %, tours " + (b.turns / b.n).toFixed(1) + ", secondes " + Math.round(b.sec / b.n));
});
lines.push("");
lines.push("## Courbe d’XP");
lines.push("");
lines.push("XP des niveaux 40 à 49 : " + xp40 + ". Récompense d’un duel au niveau 40 (×1,8) : environ " + reward40 + ". Combats théoriques pour cette bande si chaque combat est gagné : " + Math.ceil(xp40 / reward40) + ".");
lines.push("");
lines.push("Constantes : érosion " + BALANCE.erosion + ", fuite " + BALANCE.fleeShare + ", drop " + BALANCE.dropRate + ", dégâts ×" + BALANCE.dmgFactor + ", avantage joueur ×" + BALANCE.playerSkill + ", garde ×" + BALANCE.playerGuard + ".");
lines.push("");

mkdirSync("docs", { recursive: true });
writeFileSync("docs/rapport-parties.md", lines.join("\n"));
console.log(lines.join("\n"));
