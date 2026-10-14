/**
 * Entraîne une politique de combat par auto-affrontement sur le catalogue.
 *
 *   npm run train
 *
 * Écrit data/ai-policy.js (lu par le jeu) et docs/rapport-ia.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { trainPolicies } from "../js/spellcraft.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

let catalog;
try {
  catalog = JSON.parse(readFileSync(join(dataDir, "generated-spells.json"), "utf8"));
} catch {
  console.error("Catalogue absent. Lance d'abord : npm run generate");
  process.exit(1);
}

const result = trainPolicies({
  catalog,
  generations: 6,
  population: 8,
  fights: 6,
  seed: 1889,
});

const payload = {
  weights: result.best,
  holdoutWinRate: result.holdoutWinRate,
  generations: result.generations,
  history: result.history,
};
writeFileSync(join(dataDir, "ai-policy.json"), JSON.stringify(payload, null, 2) + "\n");
writeFileSync(
  join(dataDir, "ai-policy.js"),
  "/* Politique d'IA — npm run train */\nwindow.NEURO_AI_POLICY = " + JSON.stringify({
    weights: result.best,
    holdoutWinRate: result.holdoutWinRate,
    generations: result.generations,
  }) + ";\n",
);

mkdirSync(join(root, "docs"), { recursive: true });
const hist = result.history.map((h) =>
  "| " + h.generation + " | " + h.bestFitness + " | " + Math.round(h.bestWinRate * 100) + " % | " + h.meanFitness + " |",
).join("\n");
const w = result.best;
const md = `# Rapport d'entraînement de l'IA

Entraînement par auto-affrontement (pas de modèle externe). Chaque politique note les sorts avec des poids : dégâts, poussée, drain de PA, soin, kite, économie de PA. Les meilleures sont conservées et mutées.

- Générations : **${result.generations}**
- Population : **${result.population}**
- Duels par individu et par génération : **${result.fights}**
- Taux de victoire du meilleur contre la politique de départ (échantillon fixe) : **${Math.round(result.holdoutWinRate * 100)} %**

## Poids retenus

| Dégâts | Poussée | Drain | Soin | Kite | Économie |
| --- | --- | --- | --- | --- | --- |
| ${w.damage} | ${w.push} | ${w.drain} | ${w.heal} | ${w.kite} | ${w.thrift} |

## Historique

| Génération | Meilleure fitness | Taux de victoire | Fitness moyenne |
| --- | --- | --- | --- |
${hist}

Le jeu charge \`data/ai-policy.js\`. L'IA des ennemis multiplie le score de ses sorts par ces poids (dégâts, poussée, drain).
`;
writeFileSync(join(root, "docs", "rapport-ia.md"), md);
console.log("Politique écrite. Victoires hors échantillon : " + Math.round(result.holdoutWinRate * 100) + " %");
console.log("Rapport : docs/rapport-ia.md");
