/**
 * Une seule page HTTPS : hub, combat, créateur, éditeur.
 * Les sprites viennent de jsDelivr (dépôt public, ce commit).
 *
 *   node scripts/phone-bundle.js
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@f2e5a50/assets/packs/fantasy-cc/";
const spells = readFileSync("data/user-spells.json", "utf8");
const rigSpells = readFileSync("data/rig-spells.json", "utf8");
const policy = readFileSync("data/ai-policy.json", "utf8");
const skin = readFileSync("css/skin-d.css", "utf8");
const bridge = readFileSync("js/fantasy-combat-bridge.js", "utf8");
const feel = readFileSync("js/cast-feel.js", "utf8");
const combo = readFileSync("js/combo-blocks.js", "utf8");
let hub = readFileSync("js/hub.js", "utf8");
let combat = readFileSync("fantasy-combat.html", "utf8");
let creator = readFileSync("character-creator-fantasy.html", "utf8");
let editor = readFileSync("spell-editor.html", "utf8");
const index = readFileSync("index.html", "utf8");

function jsEmbed(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const back = `<button type="button" id="phoneBack" aria-label="Arène" style="position:fixed;top:6px;left:6px;z-index:80;width:40px;height:40px;border:0;background:#EA7020;color:#fff;padding:0;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M2 7.2L8 2l6 5.2V14H10v-4H6v4H2V7.2z"/></svg></button>
<script>document.getElementById("phoneBack").onclick=function(){parent.postMessage({type:"roguelite-home"},"*");};</script>`;

combat = combat.replace(
  '<link rel="stylesheet" href="css/skin-d.css">',
  "<style>\n" + skin + "\n</style>",
);
combat = combat.replace(
  '<script src="js/combo-blocks.js"></script>\n<script src="js/cast-feel.js"></script>\n<script src="js/fantasy-combat-bridge.js"></script>',
  "<script>\n" + combo + "\n" + feel + "\n" + bridge + "\n</script>",
);
if (!combat.includes("resolveCombo")) throw new Error("combat sans combos");
combat = combat.replace(
  'const BASE_LOCAL = "assets/packs/fantasy-cc/";\n  const BASE_CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@main/assets/packs/fantasy-cc/";',
  'const BASE_LOCAL = ' + JSON.stringify(CDN) + ';\n  const BASE_CDN = BASE_LOCAL;',
);
combat = combat.replace(
  `async function loadGeneratedGrimoire(){
    dropGeneratedSpells();
    try{
      const r = await fetch("data/user-spells.json", { cache:"no-store" });
      if(!r.ok) return 0;
      const arr = await r.json();`,
  `async function loadGeneratedGrimoire(){
    dropGeneratedSpells();
    try{
      const arr = (parent && parent.__PHONE_SPELLS) || [];`,
);
combat = combat.replace(
  `async function loadAiPolicy(){
    try{
      const r = await fetch("data/ai-policy.json", { cache:"no-store" });
      if(r.ok) aiPolicy = await r.json();
    }catch(_e){}
  }`,
  `async function loadAiPolicy(){
    try{ aiPolicy = (parent && parent.__PHONE_POLICY) || null; }catch(_e){}
  }`,
);
combat = combat.replace(
  'setTimeout(()=>{ location.href = "index.html"; }, 500);',
  'setTimeout(()=>{ try{ parent.postMessage({type:"roguelite-home"}, "*"); }catch(_e){ location.href="index.html"; } }, 500);',
);
if (!combat.includes("</body>")) throw new Error("combat sans body");
combat = combat.replace("</body>", back + "\n</body>");

creator = creator.replace(
  'const BASE_CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@f89bfa1/assets/packs/fantasy-cc/";',
  "const BASE_CDN = " + JSON.stringify(CDN) + ";",
);
creator = creator.replace(
  "location.href=combatUrlWithLook();",
  'saveLookPayload(); parent.postMessage({type:"open-combat"}, "*");',
);
creator = creator.replace("</body>", back + "\n</body>");

editor = editor.replace(
  'const BASE_CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@main/assets/packs/fantasy-cc/";',
  "const BASE_CDN = " + JSON.stringify(CDN) + ";",
);
editor = editor.replace(
  "location.href=combatUrlWithSaves((nav&&nav.combat)||\"fantasy-combat.html\");",
  'combatUrlWithSaves("fantasy-combat.html"); parent.postMessage({type:"open-combat"}, "*");',
);
editor = editor.replace("</body>", back + "\n</body>");

hub = hub.replace(
  `  try {
    const res = await fetch("data/user-spells.json", { cache: "no-store" });
    if (res.ok) fileSpells = await res.json();
  } catch (_e) {}`,
  "  fileSpells = window.__PHONE_SPELLS || [];",
);
hub = hub.replace(
  'showLoad(enc.mode + " · niveaux " + enc.levelSum, () => { location.href = "fantasy-combat.html"; });',
  'showLoad(enc.mode + " · niveaux " + enc.levelSum, () => { window.__openFight(); });',
);
hub = hub.replace(
  `document.querySelectorAll('a[href="fantasy-combat.html"]').forEach((a) => {
  a.addEventListener("click", () => { try { localStorage.removeItem(FIGHT); } catch (_e) {} });
});`,
  `document.querySelectorAll('a[href="fantasy-combat.html"]').forEach((a) => {
  a.addEventListener("click", (ev) => {
    ev.preventDefault();
    try { localStorage.removeItem(FIGHT); } catch (_e) {}
    window.__openFight();
  });
});`,
);
hub = hub.replace(
  "boot();",
  `window.__afterFight = () => {
  const frame = document.getElementById("fight");
  if (frame) { frame.style.display = "none"; frame.srcdoc = ""; }
  const hubEl = document.getElementById("hub");
  if (hubEl) hubEl.style.display = "";
  const settled = consumeResult();
  if (settled && settled.unpaid) renderHome("Fuite impossible : pas assez de kamas.");
  else if (settled) renderResult(settled);
  else renderHome();
};
boot();`,
);

if (!combat.includes("parent.__PHONE_SPELLS") || !combat.includes(CDN)) throw new Error("combat non branché");
if (!hub.includes('from "./roguelite.js"') || !hub.includes("window.__openFight")) throw new Error("hub non branché");

const srcDir = "/tmp/phone-src";
mkdirSync(srcDir, { recursive: true });
writeFileSync(srcDir + "/hub.js", hub);
copyFileSync("js/roguelite.js", srcDir + "/roguelite.js");
copyFileSync("js/spell-lab.js", srcDir + "/spell-lab.js");
execFileSync(
  "npx",
  ["--yes", "esbuild", srcDir + "/hub.js", "--bundle", "--format=esm", "--outfile=" + srcDir + "/hub-bundle.js"],
  { stdio: "inherit" },
);
let bundled = readFileSync(srcDir + "/hub-bundle.js", "utf8");
if (/\bfrom\s+["']/.test(bundled)) throw new Error("le bundle hub importe encore un fichier");
bundled = bundled.replace(/<\/script/gi, "<\\/script");

const hubBody = index
  .replace(/<link rel="stylesheet" href="css\/skin-d\.css">/, "<style>\n" + skin + "\n#fight{display:none;position:fixed;inset:0;width:100%;height:100%;border:0;background:#FAF7F0;z-index:50}\n</style>")
  .replace(/<script type="module" src="js\/hub\.js"><\/script>/, "")
  .replace("<body class=\"skin-d\">", "<body class=\"skin-d\">\n<div id=\"hub\">")
  .replace("</body>", "</div>\n<iframe id=\"fight\" title=\"Combat\"></iframe>\n</body>");

const page = hubBody.replace(
  "</body>",
  `<script>
window.__PHONE_SPELLS = ${jsEmbed(JSON.parse(spells))};
window.__RIG_SPELLS = ${jsEmbed(JSON.parse(rigSpells))};
window.__PHONE_POLICY = ${jsEmbed(JSON.parse(policy))};
const __PAGES = {
  combat: ${jsEmbed(combat)},
  creator: ${jsEmbed(creator)},
  editor: ${jsEmbed(editor)}
};
function __show(html){
  const hub = document.getElementById("hub");
  const frame = document.getElementById("fight");
  hub.style.display = "none";
  frame.style.display = "block";
  frame.srcdoc = html;
}
window.__openFight = function(){ __show(__PAGES.combat); };
window.addEventListener("message", function(ev){
  const t = ev.data && ev.data.type;
  if(t === "roguelite-home" && window.__afterFight) window.__afterFight();
  if(t === "open-combat"){
    try{ localStorage.removeItem("roguelite.fight"); }catch(e){}
    __show(__PAGES.combat);
  }
  if(t === "open-creator") __show(__PAGES.creator);
  if(t === "open-spell") __show(__PAGES.editor);
});
document.addEventListener("click", function(ev){
  const a = ev.target && ev.target.closest && ev.target.closest("a");
  if(!a) return;
  const href = a.getAttribute("href") || "";
  if(href.indexOf("character-creator") >= 0){ ev.preventDefault(); __show(__PAGES.creator); }
  if(href.indexOf("spell-editor") >= 0){ ev.preventDefault(); __show(__PAGES.editor); }
}, true);
</script>
<script type="module">
${bundled}
</script>
</body>`,
);

const out = "/tmp/arene-phone.html";
writeFileSync(out, page);
console.log("wrote", out, page.length);

let editorPage = readFileSync("spell-editor.html", "utf8");
editorPage = editorPage.replace(
  '<script src="js/combo-blocks.js"></script>\n<script src="js/fantasy-combat-bridge.js"></script>',
  "<script>\n" + combo + "\n" + bridge + "\n</script>",
);
editorPage = editorPage.replace(
  'const BASE_CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@main/assets/packs/fantasy-cc/";',
  "const BASE_CDN = " + JSON.stringify(CDN) + ";",
);
editorPage = editorPage.replace(
  "<head>",
  "<head>\n<script>window.__PHONE_SPELLS = " + jsEmbed(JSON.parse(spells)) + ";window.__RIG_SPELLS = " + jsEmbed(JSON.parse(rigSpells)) + ";</script>\n",
);
if (!editorPage.includes("resolveCombo")) throw new Error("éditeur sans combos");
if (!editorPage.includes("fantasy-combat-bridge") && !editorPage.includes("EVO_TREE")) {
  throw new Error("éditeur sans pont d’animations");
}
if (!editorPage.includes("Coup brut") || !editorPage.includes("1:Rapide")) {
  throw new Error("éditeur sans les évolutions écrites");
}
if (!editorPage.includes("poing_rig") && !editorPage.includes("__RIG_SPELLS")) {
  throw new Error("éditeur sans le poing cumulatif");
}
const editorOut = "/tmp/editeur-phone.html";
writeFileSync(editorOut, editorPage);
console.log("wrote", editorOut, editorPage.length);

const labSrc = "/tmp/phone-src";
execFileSync(
  "npx",
  ["--yes", "esbuild", "js/creator-app.js", "--bundle", "--format=iife", "--outfile=" + labSrc + "/creator-bundle.js"],
  { stdio: "inherit" },
);
let labJs = readFileSync(labSrc + "/creator-bundle.js", "utf8").replace(/<\/script/gi, "<\\/script");
let labPage = readFileSync("character-lab.html", "utf8").replace(
  '<script type="module" src="js/creator-app.js"></script>',
  "<script>\n" + labJs + "\n</script>",
);
if (!labPage.includes("renderActor") && !labPage.includes("poing_rig")) {
  throw new Error("créateur non assemblé");
}
const labOut = "/tmp/createur-phone.html";
writeFileSync(labOut, labPage);
console.log("wrote", labOut, labPage.length);
