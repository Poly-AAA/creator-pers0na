/**
 * Rejoue des duels simulés sur le catalogue généré, rééquilibre les
 * extrêmes, et écrit docs/rapport-equilibrage.md.
 *
 *   npm run balance
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditAndFix,
  catalogMetrics,
  validateSpell,
  winRate,
  defaultPolicy,
  effectiveStats,
} from "../js/spellcraft.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "data");
const jsonPath = join(dataDir, "generated-spells.json");

let spells;
try {
  spells = JSON.parse(readFileSync(jsonPath, "utf8"));
} catch {
  console.error("Catalogue absent. Lance d'abord : npm run generate");
  process.exit(1);
}

const before = catalogMetrics(spells);
const audited = auditAndFix(spells, { fights: 10, seed: 99 });
spells = audited.spells.filter((s) => validateSpell(s).ok);
const after = catalogMetrics(spells);

writeFileSync(jsonPath, JSON.stringify(spells, null, 2) + "\n");
writeFileSync(
  join(dataDir, "generated-spells.js"),
  "/* Catalogue généré — ne pas éditer à la main. Relancer : npm run generate */\n" +
    "window.GENERATED_SPELLS = " + JSON.stringify(spells) + ";\n",
);

const damage = spells.filter((s) => s.type === "damage");
const ranked = [];
if (damage.length >= 2) {
  const pivot = damage[Math.floor(damage.length / 2)];
  for (let i = 0; i < damage.length; i++) {
    const wr = winRate([damage[i]], [pivot], 8, 200 + i, defaultPolicy(), defaultPolicy());
    const st = effectiveStats(damage[i]);
    ranked.push({
      id: damage[i].id,
      name: damage[i].name,
      school: damage[i].school,
      perCost: Math.round(st.perCost * 100) / 100,
      winRate: Math.round(wr.rate * 1000) / 1000,
    });
  }
  ranked.sort((a, b) => b.winRate - a.winRate);
}

const report = {
  generatedAt: new Date().toISOString(),
  before: { count: before.count, avgDamagePerCost: before.avgDamagePerCost, min: before.minPerCost, max: before.maxPerCost },
  after: { count: after.count, avgDamagePerCost: after.avgDamagePerCost, min: after.minPerCost, max: after.maxPerCost, byType: after.byType },
  dropped: audited.dropped,
  notes: audited.notes,
  top: ranked.slice(0, 8),
  bottom: ranked.slice(-8).reverse(),
};
writeFileSync(join(dataDir, "balance-report.json"), JSON.stringify(report, null, 2) + "\n");

mkdirSync(join(root, "docs"), { recursive: true });
const md = renderMarkdown(report);
writeFileSync(join(root, "docs", "rapport-equilibrage.md"), md);
console.log("Rapport : docs/rapport-equilibrage.md");
console.log("Sorts : " + after.count + " · dégâts/coût " + after.avgDamagePerCost);

function renderMarkdown(r) {
  const line = (row) => "| " + row.name + " | " + row.school + " | " + row.perCost + " | " + Math.round(row.winRate * 100) + " % |";
  const table = (rows) => rows.length
    ? ["| Sort | École | Dégâts/coût | Victoires vs médian |", "| --- | --- | --- | --- |", ...rows.map(line)].join("\n")
    : "_Pas assez de sorts offensifs._";
  return `# Rapport d'équilibrage des sorts générés

Généré le ${r.generatedAt.slice(0, 10)}. Les duels sont des combats simulés (sans navigateur) qui réutilisent les formules de dégâts du jeu : dé entre le minimum et le maximum, plus 20 % de la puissance, moins 40 % de la résistance, pondéré par le perçage.

## Volume

- Sorts avant audit : **${r.before.count}**
- Sorts après audit : **${r.after.count}** (${r.after.byType.damage} dégâts, ${r.after.byType.heal} soins, ${r.after.byType.shield} boucliers)
- Écartés car invalides : **${r.dropped.length}**
- Ajustés selon le taux de victoire : **${r.notes.length}**

## Dégâts par point d'action

| | Avant | Après |
| --- | --- | --- |
| Moyenne | ${r.before.avgDamagePerCost} | ${r.after.avgDamagePerCost} |
| Minimum | ${r.before.min} | ${r.after.min} |
| Maximum | ${r.before.max} | ${r.after.max} |

La bande visée pour un sort de dégâts est d'environ 4 à 7,2 points de dégâts moyens par PA.

## Sorts les plus gagnants (duel contre le sort médian)

${table(r.top)}

## Sorts les moins gagnants

${table(r.bottom)}

## Ajustements

${r.notes.length ? r.notes.map((n) => "- **" + n.id + "** : " + (n.action === "nerf" ? "affaibli" : "renforcé") + " (taux " + Math.round(n.winRate * 100) + " %)").join("\n") : "Aucun extrême détecté sur cet échantillon."}

${r.dropped.length ? "\n## Écartés\n\n" + r.dropped.map((d) => "- " + d.id + " — " + (d.errors || []).join(", ")).join("\n") : ""}
`;
}
