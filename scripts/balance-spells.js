/**
 * Simule des duels, répare ou écarte les sorts cassés, écrit le rapport.
 * Usage : npm run balance
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { balanceCatalog, damagePerCost } from "../js/spell-lab.js";

const src = "data/generated-spells.json";
const spells = JSON.parse(readFileSync(src, "utf8"));
const result = balanceCatalog(spells, { fights: 8 });
mkdirSync("data", { recursive: true });
mkdirSync("docs", { recursive: true });
writeFileSync(src, JSON.stringify(result.spells, null, 2) + "\n");

const byRole = {};
result.spells.forEach((s) => { byRole[s.role] = (byRole[s.role] || 0) + 1; });
const damage = result.spells.filter((s) => s.type === "damage");
const extreme = damage.filter((s) => s.balance.winRate <= 0.05 || s.balance.winRate >= 0.95);
const lines = [];
lines.push("# Rapport d’équilibrage des sorts");
lines.push("");
lines.push("Duels simulés sur une grille 10×10 (distance de Chebyshev, comme le combat).");
lines.push("Chaque sort de dégâts est testé **avec Coup brut** contre deux Coup brut.");
lines.push("Un sort sans effet en sonde est réparé une fois, puis écarté s’il ne fait toujours rien.");
lines.push("Les dégâts sont ramenés vers **3,6 à 7,2 dégâts moyens par PA** (double frappe comprise), puis ajustés selon le taux de victoire.");
lines.push("");
lines.push("## Bilan");
lines.push("");
lines.push("| Mesure | Valeur |");
lines.push("| --- | --- |");
lines.push("| Sorts en entrée | " + result.summary.input + " |");
lines.push("| Conservés | " + result.summary.kept + " |");
lines.push("| Écartés | " + result.summary.discarded + " |");
lines.push("| Réparés | " + result.summary.repaired + " |");
lines.push("| Dégâts moyens / PA | " + result.summary.meanDamagePerCost + " |");
lines.push("| Taux de victoire moyen (dégâts) | " + Math.round(result.summary.meanWinRate * 100) + " % |");
lines.push("");
lines.push("## Rôles conservés");
lines.push("");
Object.keys(byRole).sort().forEach((role) => {
  lines.push("- " + role + " : " + byRole[role]);
});
lines.push("");
if (result.discarded.length) {
  lines.push("## Écartés");
  lines.push("");
  result.discarded.forEach((d) => {
    lines.push("- **" + (d.name || d.id) + "** (`" + d.id + "`) — " + d.reason);
  });
  lines.push("");
}
if (extreme.length) {
  lines.push("## Encore très polarisés");
  lines.push("");
  lines.push("Ces sorts restent sous 5 % ou au-dessus de 95 % de victoires après trois ajustements. Ils sont conservés : la sonde confirme qu’ils agissent, mais leur effet (poussée, double frappe, contrôle) pèse plus que les dégâts bruts.");
  lines.push("");
  extreme.forEach((s) => {
    lines.push("- " + s.name + " (`" + s.id + "`) — " + Math.round(s.balance.winRate * 100) + " % · " + damagePerCost(s).toFixed(2) + " dégâts/PA");
  });
  lines.push("");
}
lines.push("## Ajustements");
lines.push("");
const shown = result.notes.slice(0, 40);
if (!shown.length) lines.push("Aucun ajustement chiffré.");
shown.forEach((n) => lines.push("- `" + n.id + "` — " + n.action + " (" + n.detail + ")"));
if (result.notes.length > shown.length) {
  lines.push("- … " + (result.notes.length - shown.length) + " autres ajustements");
}
lines.push("");
lines.push("Fichier mis à jour : `data/generated-spells.json`.");
lines.push("");
writeFileSync("docs/rapport-equilibrage.md", lines.join("\n"));
console.log(JSON.stringify(result.summary));
console.log("Rapport : docs/rapport-equilibrage.md");
if (!result.spells.length) process.exit(1);
