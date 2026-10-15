/**
 * Page téléphone autonome : feuilles d'origine incluses.
 *   node scripts/variant-phone.js
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ANIMS } from "../js/sheet-variant.js";

const pack = {};
for (const folder of ["NakedBody", "Head1"]) {
  for (const anim of ANIMS) {
    const buf = readFileSync("assets/packs/fantasy-cc/spritesheets/" + folder + "/" + anim + ".png");
    pack[folder + "/" + anim] = buf.toString("base64");
  }
}

const lib = readFileSync("js/sheet-variant.js", "utf8").replace(/^export /gm, "");
const idle = readFileSync("js/idle-variants.js", "utf8")
  .replace(/^import [\s\S]*?;\n/m, "")
  .replace(/^export /gm, "");
let view = readFileSync("js/variant-view.js", "utf8").replace(
  /^import \{[\s\S]*?\} from "\.\/[^"]+";\n/gm,
  "",
);
view = view.replace(
  `const CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@f2e5a50/assets/packs/fantasy-cc/spritesheets/";\n`,
  "",
);
view = view.replace(
  `function remote() {
  const host = location.hostname || "";
  return host.includes("catbox") || host.includes("litter");
}

function sheetUrl(folder, anim) {
  const file = folder + "/" + anim + ".png";
  return remote() ? CDN + file : "assets/packs/fantasy-cc/spritesheets/" + file;
}`,
  `function sheetUrl(folder, anim) {
  return "data:image/png;base64," + PACK[folder + "/" + anim];
}`,
);

const html = readFileSync("variante.html", "utf8").replace(
  '<script type="module" src="js/variant-view.js"></script>',
  "<script type=\"module\">\nconst PACK = " + JSON.stringify(pack) + ";\n" + lib + "\n" + idle + "\n" + view + "\n</script>",
);
writeFileSync("/tmp/variante-phone.html", html);
console.log("octets", html.length);
