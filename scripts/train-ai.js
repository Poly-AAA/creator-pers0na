/**
 * Auto-affrontement de loadouts. La politique retenue doit battre celle de départ.
 * Usage : npm run train
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { trainPolicy } from "../js/spell-lab.js";

const spells = JSON.parse(readFileSync("data/generated-spells.json", "utf8"));
const result = trainPolicy(spells, { generations: 6, games: 2, seed: 20261014 });
const policy = {
  noise: Math.round(result.policy.noise * 1000) / 1000,
  healBias: Math.round(result.policy.healBias * 1000) / 1000,
  kiteBias: Math.round(result.policy.kiteBias * 1000) / 1000,
  controlBias: Math.round(result.policy.controlBias * 1000) / 1000,
  pushBias: Math.round(result.policy.pushBias * 1000) / 1000,
  mobilityBias: Math.round(result.policy.mobilityBias * 1000) / 1000,
  weights: result.policy.weights,
  loadouts: result.loadouts,
  trainedWinRate: result.trainedWinRate,
  baselineWinRate: result.baselineMirror,
  trainedWins: result.trainedWins,
  trainedGames: result.trainedGames,
};
mkdirSync("data", { recursive: true });
mkdirSync("docs", { recursive: true });
writeFileSync("data/ai-policy.json", JSON.stringify(policy, null, 2) + "\n");

const lines = [];
lines.push("# Rapport d’entraînement de l’IA");
lines.push("");
lines.push("Des kits de sorts différents s’affrontent. La politique de départ choisit souvent au hasard (`noise` élevé) et soigne peu. Chaque génération propose un mutant et une variante plus posée (moins de hasard, plus de soin et de kiting). On garde la variante seulement si elle gagne davantage contre la politique de départ.");
lines.push("");
lines.push("## Résultat");
lines.push("");
lines.push("| | Taux de victoire |");
lines.push("| --- | --- |");
lines.push("| Politique de départ (miroir) | " + Math.round(result.baselineMirror * 100) + " % |");
lines.push("| Politique entraînée contre la départ | " + Math.round(result.trainedWinRate * 100) + " % (" + result.trainedWins + "/" + result.trainedGames + ") |");
lines.push("| Progression | " + (result.improved ? "oui" : "non") + " |");
lines.push("");
lines.push("Paramètres retenus : hasard " + policy.noise + ", soin " + policy.healBias + ", kiting " + policy.kiteBias + ", contrôle " + policy.controlBias + ".");
lines.push("");
lines.push("## Générations");
lines.push("");
result.history.forEach((h) => {
  lines.push("- Génération " + h.generation + " — " + Math.round(h.winRateVsBaseline * 100) + " % contre la départ" + (h.accepted ? " · retenue" : ""));
});
lines.push("");
lines.push("## Kits");
lines.push("");
result.loadouts.forEach((kit) => {
  lines.push("- **" + kit.name + "** : " + kit.spellIds.join(", "));
});
lines.push("");
lines.push("Le combat charge `data/ai-policy.json` pour pondérer les sorts de l’adversaire. L’entraînement lui-même reste une commande à part (`npm run train`) : le navigateur ne relance pas la recherche.");
lines.push("");
writeFileSync("docs/rapport-ia.md", lines.join("\n"));
console.log("Victoires entraînées : " + Math.round(result.trainedWinRate * 100) + "% sur " + result.trainedGames + " duels");
console.log("Progression : " + (result.improved ? "oui" : "non"));
if (!result.improved) process.exit(1);
