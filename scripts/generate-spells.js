/**
 * Compose des sorts au format de l’éditeur (steps + évolutions).
 * Usage : npm run generate
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { generateCatalog, validateSpell } from "../js/spell-lab.js";

const count = Number(process.env.SPELL_COUNT || 72);
const seed = Number(process.env.SPELL_SEED || 20261014);
const raw = generateCatalog({ seed, count });
const spells = [];
const rejected = [];
raw.forEach((spell) => {
  const res = validateSpell(spell);
  if (res.ok) spells.push(res.spell);
  else rejected.push({ id: spell.id, name: spell.name, errors: res.errors });
});

mkdirSync("data", { recursive: true });
writeFileSync("data/generated-spells.json", JSON.stringify(spells, null, 2) + "\n");

const byRole = {};
spells.forEach((s) => { byRole[s.role] = (byRole[s.role] || 0) + 1; });
console.log("Sorts valides : " + spells.length + " / " + raw.length);
console.log("Écartés à la validation : " + rejected.length);
console.log("Rôles : " + JSON.stringify(byRole));
console.log("Fichier : data/generated-spells.json");
if (spells.length < 24) {
  console.error("Pas assez de sorts valides.");
  process.exit(1);
}
