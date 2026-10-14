/**
 * Génère le catalogue de sorts (animations × effets × améliorations),
 * écarte les sorts invalides, équilibre, écrit le format lu par le jeu.
 *
 *   npm run generate
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateCatalog,
  auditAndFix,
  catalogMetrics,
  validateSpell,
} from "../js/spellcraft.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
mkdirSync(dataDir, { recursive: true });

const raw = generateCatalog({ seed: 1889, maxUpgrades: 2 });
const audited = auditAndFix(raw.spells, { fights: 6, seed: 11 });
const spells = audited.spells;
const metrics = catalogMetrics(spells);

const stillBad = spells.filter((s) => !validateSpell(s).ok);
if (stillBad.length) {
  console.error("Sorts encore invalides :", stillBad.map((s) => s.id));
  process.exit(1);
}

const jsonPath = join(dataDir, "generated-spells.json");
const jsPath = join(dataDir, "generated-spells.js");
writeFileSync(jsonPath, JSON.stringify(spells, null, 2) + "\n");
writeFileSync(
  jsPath,
  "/* Catalogue généré — ne pas éditer à la main. Relancer : npm run generate */\n" +
    "window.GENERATED_SPELLS = " + JSON.stringify(spells) + ";\n",
);

const summary = {
  generatedAt: new Date().toISOString(),
  seed: raw.seed,
  composed: raw.spells.length + raw.discarded.length,
  discardedAtCompose: raw.discarded.length,
  droppedAtAudit: audited.dropped.length,
  adjusted: audited.notes.length,
  kept: spells.length,
  metrics: {
    byType: metrics.byType,
    avgDamagePerCost: metrics.avgDamagePerCost,
    minPerCost: metrics.minPerCost,
    maxPerCost: metrics.maxPerCost,
  },
};
writeFileSync(join(dataDir, "generation-summary.json"), JSON.stringify(summary, null, 2) + "\n");

const craftSrc = readFileSync(join(root, "js", "spellcraft.js"), "utf8").replace(/^export /gm, "");
writeFileSync(
  join(dataDir, "spellcraft-browser.js"),
  "/* Copie navigateur (sans export) — régénérée par npm run generate.\n" +
    "   Isolée dans une fonction pour ne pas entrer en collision avec le jeu. */\n" +
    "(function(){\n" +
    craftSrc +
    "\nwindow.SpellCraft = { SCHOOLS, ANIMATIONS, EFFECTS, UPGRADES, composeSpell, applyUpgrade, validateSpell, balanceSpell, effectiveStats, upgradesFor, findAnim, findEffect, findUpgrade, generateCatalog, simulateFight, defaultPolicy };\n" +
    "})();\n",
);

console.log(
  "Sorts gardés : " + spells.length +
    " · écartés à la composition : " + raw.discarded.length +
    " · écartés à l'audit : " + audited.dropped.length,
);
console.log("Dégâts/coût moyen : " + metrics.avgDamagePerCost + " (min " + metrics.minPerCost + ", max " + metrics.maxPerCost + ")");
console.log("Écrit : data/generated-spells.json et data/generated-spells.js");
