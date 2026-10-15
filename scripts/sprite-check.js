/**
 * Contrôles visuels et planches contact. Aucune simulation de partie.
 *   node scripts/sprite-check.js
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { auditAll, actorHeight, contactSheets } from "../js/sprite-audit.js";
import { encodePNG } from "../js/sprite-png.js";

const dir = "docs/previews/sprites";
mkdirSync(dir, { recursive: true });
const { issues, hashes } = auditAll();
const height = actorHeight({ species: "male", dir: "SE", anim: "idle", frame: 0, hair: "short" });
if (height < 90 || height > 128) issues.push("taille " + height + " px hors 96-128");
const baselinePath = dir + "/baseline.json";
let baseline = null;
try { baseline = JSON.parse(readFileSync(baselinePath, "utf8")); } catch (_e) { baseline = null; }
if (baseline && baseline.hashes) {
  for (const [k, v] of Object.entries(hashes)) {
    if (baseline.hashes[k] && baseline.hashes[k] !== v) issues.push("régression " + k + " " + baseline.hashes[k] + " → " + v);
  }
}
const sheets = contactSheets();
for (const [name, img] of Object.entries(sheets)) {
  writeFileSync(dir + "/" + name + ".png", encodePNG(img.rgba, img.w, img.h));
}
writeFileSync(baselinePath, JSON.stringify({ height, hashes, updated: new Date().toISOString() }, null, 2));
console.log(issues.length ? issues.slice(0, 40).join("\n") : "sprite ok, taille " + height);
if (issues.length) {
  console.log("écarts", issues.length);
  process.exit(1);
}
