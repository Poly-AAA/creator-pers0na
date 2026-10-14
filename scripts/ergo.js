/**
 * Suite mobile portrait : 4 téléphones, écrans du hub, combat d’équipe, un cliché par sort.
 *   node scripts/ergo.js
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import {
  prepareCatalog, createState, buildEncounter, unitsFromEncounter, mulberry32, gainXp, xpNeed,
} from "../js/roguelite.js";

const BASE = process.env.ROGUELITE_BASE || "http://127.0.0.1:8765";
const phones = [
  { id: "android-small", width: 360, height: 640 },
  { id: "android-large", width: 412, height: 915 },
  { id: "iphone-se", width: 375, height: 667 },
  { id: "iphone-large", width: 430, height: 932 },
];

const raw = JSON.parse(readFileSync("data/generated-spells.json", "utf8"));
const catalog = prepareCatalog(raw);

function pack(u) {
  return {
    name: u.name, level: u.level, pv: u.pv, pvMax: u.pvMax,
    paMax: u.paMax, pmMax: u.pmMax, po: u.po | 0,
    stats: u.stats, res: u.res, spells: u.spells, layers: u.layers || [],
    items: u.items || [], c: u.c, r: u.r, side: u.side,
  };
}

function encounterOf(size) {
  for (let i = 0; i < 80; i++) {
    const state = createState(4200 + i * 9 + size, catalog);
    while (state.hero.level < 12) gainXp(state.hero, xpNeed(state.hero.level));
    const enc = buildEncounter(state, "equipe", mulberry32(9000 + i * 13 + size), catalog);
    if (enc.size !== size) continue;
    const units = unitsFromEncounter(state.hero, enc);
    return {
      mode: enc.mode,
      size: enc.size,
      challenges: [],
      player: pack(units.allies[0]),
      allies: units.allies.slice(1).map(pack),
      foes: units.foes.map(pack),
      foeItems: [],
      foeLevels: enc.foes.map((f) => f.level),
      gold: 40,
      fleeCharges: 0,
    };
  }
  throw new Error("pas de rencontre " + size);
}

async function controlReport(page) {
  return page.evaluate(() => {
    const view = { w: window.innerWidth, h: window.innerHeight };
    const overflow = document.documentElement.scrollWidth > view.w + 1;
    const nodes = [...document.querySelectorAll("button, a.link-cc, #dpad button")];
    const boxes = nodes.map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        t: (el.innerText || el.getAttribute("aria-label") || el.id || "").replace(/\s+/g, " ").slice(0, 48),
        x: r.x, y: r.y, w: r.width, h: r.height,
        fs: parseFloat(s.fontSize) || 0,
        disp: s.display,
        vis: s.visibility,
      };
    }).filter((b) => b.disp !== "none" && b.vis !== "hidden" && b.w > 0 && b.h > 0);
    const outside = boxes.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > view.w + 1 || b.y + b.h > view.h + 1);
    const tiny = boxes.filter((b) => b.fs > 0 && b.fs < 11);
    const hits = [];
    const hit = (a, b) => a.x < b.x + b.w - 2 && a.x + a.w - 2 > b.x && a.y < b.y + b.h - 2 && a.y + a.h - 2 > b.y;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (hit(boxes[i], boxes[j])) hits.push(boxes[i].t + " ∩ " + boxes[j].t);
      }
    }
    return { overflow, outside: outside.map((b) => b.t), tiny: tiny.map((b) => b.t + " " + b.fs), hits, n: boxes.length };
  });
}

async function shot(page, file) {
  mkdirSync(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  await page.screenshot({ path: file, fullPage: false });
}

const issues = [];
function note(phone, where, report) {
  const bits = [];
  if (report.overflow) bits.push("défilement horizontal");
  if (report.outside.length) bits.push("hors écran : " + report.outside.join(", "));
  if (report.tiny.length) bits.push("texte < 11px : " + report.tiny.join(", "));
  if (report.hits.length) bits.push("chevauchement : " + report.hits.slice(0, 6).join(" ; "));
  if (bits.length) issues.push(phone + " · " + where + " — " + bits.join(" | "));
}

const fights = { 2: encounterOf(2), 5: encounterOf(5), 10: encounterOf(10) };

const browser = await chromium.launch({ headless: true });
try {
  for (const phone of phones) {
    const context = await browser.newContext({
      viewport: { width: phone.width, height: phone.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.clear());
    await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
    await page.waitForSelector("#goFight");
    await shot(page, "docs/previews/phones/" + phone.id + "/accueil.png");
    note(phone.id, "accueil", await controlReport(page));

    for (const go of ["inv", "heal", "shop", "craft", "forge", "board"]) {
      await page.click('[data-go="' + go + '"]');
      await page.waitForSelector("#back");
      await shot(page, "docs/previews/phones/" + phone.id + "/" + go + ".png");
      note(phone.id, go, await controlReport(page));
      await page.click("#back");
      await page.waitForSelector("#goFight");
    }
    await page.click("#goFight");
    await page.waitForSelector("#duel");
    await shot(page, "docs/previews/phones/" + phone.id + "/avant-combat.png");
    note(phone.id, "avant-combat", await controlReport(page));

    await page.addInitScript((payload) => {
      localStorage.setItem("roguelite.fight", JSON.stringify(payload));
    }, fights[10]);
    await page.goto(BASE + "/fantasy-combat.html", { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__arenaRoster && window.__arenaRoster().length >= 19, null, { timeout: 8000 });
    await page.waitForTimeout(700);
    const roster = await page.evaluate(() => window.__arenaRoster());
    const thin = roster.filter((u) => !u.layers || u.layers.length < 4);
    const sides = { a: roster.filter((u) => u.side === "a").length, b: roster.filter((u) => u.side === "b").length };
    if (thin.length) issues.push(phone.id + " · 10v10 — " + thin.length + " combattants sans équipement visible");
    if (sides.b < 10 || sides.a < 9) issues.push(phone.id + " · 10v10 — effectif " + sides.a + " alliés + " + sides.b + " ennemis");
    const sample = await page.evaluate(() => {
      const c = document.getElementById("arena");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sig = 0; let ink = 0;
      for (let i = 0; i < d.length; i += 16) {
        sig = (sig + d[i] * 3 + d[i + 1] * 5 + d[i + 2]) % 10000019;
        if (d[i] < 90 && d[i + 1] < 90) ink++;
      }
      return { sig, ink };
    });
    await page.waitForTimeout(450);
    const sample2 = await page.evaluate(() => {
      const c = document.getElementById("arena");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sig = 0;
      for (let i = 0; i < d.length; i += 16) sig = (sig + d[i] * 3 + d[i + 1] * 5 + d[i + 2]) % 10000019;
      return sig;
    });
    if (sample.ink < 80) issues.push(phone.id + " · 10v10 — sprites trop peu visibles (" + sample.ink + ")");
    if (sample.sig === sample2) issues.push(phone.id + " · 10v10 — image figée, pas d’animation");
    await shot(page, "docs/previews/phones/" + phone.id + "/combat-10v10.png");
    note(phone.id, "combat-10v10", await controlReport(page));

    const beforePinch = sample2;
    await page.evaluate(() => {
      const canvas = document.getElementById("arena");
      const r = canvas.getBoundingClientRect();
      const fire = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, {
        pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true,
      }));
      const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
      fire("pointerdown", 1, cx - 20, cy);
      fire("pointerdown", 2, cx + 20, cy);
      fire("pointermove", 1, cx - 70, cy);
      fire("pointermove", 2, cx + 70, cy);
      fire("pointerup", 1, cx - 70, cy);
      fire("pointerup", 2, cx + 70, cy);
    });
    await page.waitForTimeout(200);
    const afterPinch = await page.evaluate(() => {
      const c = document.getElementById("arena");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let sig = 0;
      for (let i = 0; i < d.length; i += 16) sig = (sig + d[i] * 3 + d[i + 1] * 5 + d[i + 2]) % 10000019;
      return sig;
    });
    if (afterPinch === beforePinch) issues.push(phone.id + " · pincement sans effet visuel");

    await context.close();
  }

  const check = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const page = await check.newPage();
  for (const size of [2, 5]) {
    await page.addInitScript((payload) => localStorage.setItem("roguelite.fight", JSON.stringify(payload)), fights[size]);
    await page.goto(BASE + "/fantasy-combat.html", { waitUntil: "networkidle" });
    await page.waitForFunction((n) => window.__arenaRoster && window.__arenaRoster().length >= n, size * 2 - 1);
    await page.waitForTimeout(500);
    const roster = await page.evaluate(() => window.__arenaRoster());
    const thin = roster.filter((u) => !u.layers || u.layers.length < 4);
    if (thin.length) issues.push(size + "v" + size + " — " + thin.length + " sans équipement");
    if (roster.filter((u) => u.side === "b").length < size) issues.push(size + "v" + size + " — ennemis manquants");
    await shot(page, "docs/previews/phones/android-large/combat-" + size + "v" + size + ".png");
  }
  await check.close();

  const gallery = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const gpage = await gallery.newPage();
  let spellsShot = 0;
  for (const sp of raw) {
    await gpage.goto(BASE + "/spell-preview.html?id=" + encodeURIComponent(sp.id), { waitUntil: "networkidle" });
    await gpage.waitForFunction(() => document.body.dataset.ready && document.body.dataset.ready !== "", null, { timeout: 8000 });
    const ready = await gpage.evaluate(() => document.body.dataset.ready);
    if (ready !== sp.id) issues.push("sort " + sp.id + " — prêt=" + ready);
    await shot(gpage, "docs/previews/sorts/" + sp.id + ".png");
    spellsShot++;
  }
  await gallery.close();

  const lines = [];
  lines.push("# Rapport d’ergonomie mobile");
  lines.push("");
  lines.push("Playwright, Chromium headless, portrait. Téléphones : Android petit 360×640, Android grand 412×915, iPhone SE 375×667, iPhone grand 430×932.");
  lines.push("");
  lines.push("Écrans du hub sur chaque téléphone : accueil, inventaire, soins, boutique, artisanat, forgemagie, classement, avant-combat. Combat 10v10 sur les quatre. Combats 2v2 et 5v5 en plus sur l’Android grand. Un cliché par sort du grimoire (" + spellsShot + " fichiers dans `docs/previews/sorts/`).");
  lines.push("");
  lines.push("Contrôles : pas de défilement horizontal, boutons dans l’écran, texte d’au moins 11 px, pas de chevauchement. En 10v10, chaque combattant hors joueur a au moins quatre calques (ombre, corps, pièce, tête), les deux camps sont au complet, l’image bouge entre deux images, et un pincement change le cadre.");
  lines.push("");
  if (!issues.length) {
    lines.push("Aucun écart relevé.");
  } else {
    lines.push("Écarts (" + issues.length + ") :");
    lines.push("");
    issues.forEach((x) => lines.push("- " + x));
  }
  lines.push("");
  writeFileSync("docs/rapport-ergo.md", lines.join("\n"));
  console.log(issues.length ? issues.join("\n") : "ergo ok, sorts " + spellsShot);
  if (issues.length) process.exit(1);
} finally {
  await browser.close();
}
