/**
 * Boucle du roguelite : personnage immédiat, menus, départ en combat.
 * L’écran visible est fait d’icônes et de nombres. Le français reste dans les aria-label.
 */
import {
  createState, prepareCatalog, recomputeVitals, xpNeed, gradeOf, geneLabel,
  healPrice, applyHeal, fleePrice, useFlee, equip, unequip, equipBest,
  craft, crush, forge, buy, refreshShop, knownMaterial, MATERIALS, SLOTS, SLOT_LABEL, STAT_LABEL,
  buildEncounter, unitsFromEncounter, settleFight, recruit, mulberry32, CHALLENGES,
  unlockedSpells, effectiveStats,
} from "./roguelite.js";

const SAVE = "roguelite.save";
const FIGHT = "roguelite.fight";
const RESULT = "roguelite.result";

const screen = document.getElementById("screen");
const title = document.getElementById("title");
const badge = document.getElementById("badge");

let catalog = [];
let state = null;

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}
function svg(inner) {
  return "<svg viewBox='0 0 16 16' aria-hidden='true'>" + inner + "</svg>";
}
const I = {
  heart: svg("<path fill='currentColor' d='M8 13.4S2.4 9.4 2.4 6.2A2.8 2.8 0 0 1 8 4.8 2.8 2.8 0 0 1 13.6 6.2C13.6 9.4 8 13.4 8 13.4z'/>"),
  bolt: svg("<path fill='currentColor' d='M9 1L4 9h3l-1 6 6-8H9l1-6z'/>"),
  boot: svg("<path fill='currentColor' d='M3 9l2-5h4l1 3h3v2l1 4H3V9z'/>"),
  coin: svg("<circle cx='8' cy='8' r='5.2' fill='none' stroke='currentColor' stroke-width='1.6'/><path fill='currentColor' d='M8 4.2h1.2v7.6H8z'/>"),
  star: svg("<path fill='currentColor' d='M8 1.4l1.5 3.3 3.6.5-2.6 2.5.6 3.6L8 9.7 4.9 11.3l.6-3.6L2.9 5.2l3.6-.5z'/>"),
  dice: svg("<rect x='3' y='3' width='10' height='10' rx='1.4' fill='none' stroke='currentColor' stroke-width='1.4'/><circle cx='6' cy='6' r='.8' fill='currentColor'/><circle cx='10' cy='10' r='.8' fill='currentColor'/><circle cx='8' cy='8' r='.8' fill='currentColor'/>"),
  sword: svg("<path fill='currentColor' d='M11.2 1.2l3.6 3.6-6.2 6.2-1.2-.4-.6 1.8H5.2V11l1.8-.6-.4-1.2 6.2-6.2z'/>"),
  spark: svg("<path fill='currentColor' d='M8 1l1.2 4.2L13.5 6.5 9.2 7.8 8 12 6.8 7.8 2.5 6.5l4.3-1.3z'/>"),
  wind: svg("<path fill='none' stroke='currentColor' stroke-width='1.6' d='M2 5h8M2 8h12M4 11h7'/>"),
  eye: svg("<path fill='currentColor' fill-rule='evenodd' d='M1.5 8S4 4 8 4s6.5 4 6.5 4S12 12 8 12 1.5 8 1.5 8zm6.5-1.6a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z'/>"),
  shield: svg("<path fill='currentColor' d='M8 1.4l5 2v4c0 3.1-2 5-5 6.6-3-1.6-5-3.5-5-6.6v-4l5-2z'/>"),
  hat: svg("<path fill='currentColor' d='M3 10l2-5h6l2 5H3zm-1 1.2h12v1.8H2v-1.8z'/>"),
  gem: svg("<path fill='currentColor' d='M8 1.6l5 3.6-5 9.2L3 5.2l5-3.6z'/>"),
  cape: svg("<path fill='currentColor' d='M4 2h8l-1 12H5L4 2zm1.2.2c1.2 1.6 4.4 1.6 5.6 0'/>"),
  ring: svg("<circle cx='8' cy='8' r='3.4' fill='none' stroke='currentColor' stroke-width='1.8'/>"),
  belt: svg("<path fill='currentColor' d='M2 6h12v4H2V6zm5 1h2v2H7V7z'/>"),
  bag: svg("<path fill='currentColor' d='M5 6V4.6a3 3 0 0 1 6 0V6h2v8H3V6h2zm1.4 0h3.2V4.6a1.6 1.6 0 0 0-3.2 0V6z'/>"),
  flask: svg("<path fill='currentColor' d='M6 1h4v2l2.6 7.2V12a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2v-1.8L6 3V1z'/>"),
  hammer: svg("<path fill='currentColor' d='M2 6h7l1-3h4v4h-3L9 13H7L5 7H2V6z'/>"),
  anvil: svg("<path fill='currentColor' d='M2 4h12v3H9v2h4v2H3v-2h4V7H2V4z'/>"),
  person: svg("<circle cx='8' cy='4' r='2.1' fill='currentColor'/><path fill='currentColor' d='M4 14v-2.1C4 9.6 5.7 8.2 8 8.2s4 1.4 4 3.7V14H4z'/>"),
  people: svg("<circle cx='6' cy='4.2' r='1.8' fill='currentColor'/><circle cx='11' cy='5' r='1.4' fill='currentColor'/><path fill='currentColor' d='M2.4 14v-1.8C2.4 10.4 3.8 9.2 6 9.2s3.6 1.2 3.6 3V14H2.4zm6 0v-1.4c0-.5.2-1 .5-1.4.6-.7 1.5-1.1 2.6-1.1 1.4 0 2.5 1 2.5 2.4V14H8.4z'/>"),
  arrow: svg("<path fill='currentColor' d='M10 2L4 8l6 6V10h5V6h-5V2z'/>"),
  go: svg("<path fill='currentColor' d='M6 2l6 6-6 6V10H1V6h5V2z'/>"),
  refresh: svg("<path fill='none' stroke='currentColor' stroke-width='1.6' d='M13 8a5 5 0 1 1-1.4-3.4'/><path fill='currentColor' d='M12 1.6V5H8.6z'/>"),
  trophy: svg("<path fill='currentColor' d='M4 2h8v2h2v2.2A3.8 3.8 0 0 1 10.4 12H10v1h2v1.6H4V13h2v-1h-.4A3.8 3.8 0 0 1 2 6.2V4h2V2z'/>"),
  pin: svg("<path fill='currentColor' d='M8 1.4a3.6 3.6 0 0 0-3.6 3.6c0 2.6 3.6 7.6 3.6 7.6s3.6-5 3.6-7.6A3.6 3.6 0 0 0 8 1.4zm0 4.8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z'/>"),
  feather: svg("<path fill='currentColor' d='M13 2C8 3.2 4 8 4 12c2.2 0 4.2-1 6.2-3.2C12.2 6.6 13 4 13 2z'/>"),
  cloth: svg("<path fill='currentColor' d='M2 3h12v2L12 14H4L2 5V3z'/>"),
  ingot: svg("<path fill='currentColor' d='M3 6.2L8 3l5 3.2v4.6L8 14 3 10.8V6.2z'/>"),
  target: svg("<circle cx='8' cy='8' r='5' fill='none' stroke='currentColor' stroke-width='1.6'/><circle cx='8' cy='8' r='1.5' fill='currentColor'/>"),
  swords: svg("<path fill='currentColor' d='M2.2 12.4L9.6 5l1.2 1.2-7.4 7.4-1.2-1.2zm.6-7.2L1.4 3.8 3 2.2l1.4 1.4L3 4.8 2.8 5.2zm9.2-3L5 9.6l1.2 1.2 7.4-7.4L12 2.2z'/>"),
  noheal: svg("<path fill='currentColor' d='M8 13S2.6 9.2 2.6 6.2A2.6 2.6 0 0 1 8 4.8 2.6 2.6 0 0 1 13.4 6.2C13.4 9.2 8 13 8 13z'/><path stroke='var(--bg)' stroke-width='1.8' d='M3 12.5L13 3'/>"),
  skull: svg("<path fill='currentColor' d='M8 2a4.2 4.2 0 0 0-3.2 7v2.2h6.4V9A4.2 4.2 0 0 0 8 2zM6 7.2h1.3v1.4H6zm2.7 0H10v1.4H8.7z'/>"),
  check: svg("<path fill='none' stroke='currentColor' stroke-width='2' d='M3 8l3.2 3.2L13 4.2'/>"),
};
const STAT_ICO = {
  vit: "heart", force: "sword", intel: "spark", chance: "dice", agi: "wind", sage: "eye", ini: "bolt",
  pa: "bolt", pm: "boot", po: "target",
  resTerre: "shield", resFeu: "shield", resEau: "shield", resAir: "shield", resNeutre: "shield",
};
const SLOT_ICO = {
  coiffe: "hat", amulette: "gem", cape: "cape", arme: "sword",
  anneauG: "ring", anneauD: "ring", ceinture: "belt", bouclier: "shield", bottes: "boot",
};
const EL_MARK = { feu: "▲", eau: "●", air: "◆", terre: "■", neutre: "○" };

function ico(name) {
  return "<span class='ico'>" + (I[name] || "") + "</span>";
}
function rng() {
  state.meta.tick = ((state.meta.tick | 0) + 1) >>> 0;
  const r = mulberry32((state.hero.seed ^ (state.meta.tick * 997)) >>> 0);
  return r;
}
function save() {
  const cat = state._catalog;
  delete state._catalog;
  try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (_e) {}
  state._catalog = cat;
}
function nextRng() {
  return rng();
}

function bars(cur, max, n) {
  const cells = n || 12;
  const on = Math.round((cur / Math.max(1, max)) * cells);
  let html = "";
  for (let i = 0; i < cells; i++) html += "<i class=\"" + (i < on ? "on" : "") + "\"></i>";
  return "<div class=\"bar\" aria-hidden=\"true\">" + html + "</div>";
}

function setMode(mode) {
  screen.className = "screen " + mode;
}

function showLoad(_text, then) {
  title.textContent = "SYNC";
  badge.textContent = "·";
  setMode("load-screen");
  screen.innerHTML = "<div class=\"load\"><div class=\"kicker ar\">التزامن</div><h1>MAGI</h1><div class=\"track\"><i></i></div></div>";
  setTimeout(then, 420);
}

function heroLine() {
  const h = state.hero;
  recomputeVitals(h);
  const eff = h.eff || effectiveStats(h);
  return { h, eff };
}

function banner(note) {
  if (!note) return "";
  const s = String(note);
  if (s.indexOf("<") >= 0) return s;
  if (s.indexOf("Fuite impossible") >= 0) return "<p class='float-note'>" + ico("flask") + " 0</p>";
  if (s.indexOf("Fuite") >= 0) {
    const n = s.match(/\d+/);
    return "<p class='float-note'>" + ico("flask") + " " + (n ? n[0] : "0") + "</p>";
  }
  if (s.indexOf("Nouveau") >= 0) {
    const name = s.replace(/^.*:\s*/, "").replace(/\.$/, "");
    return "<p class='float-note'>" + ico("person") + " " + esc(name) + "</p>";
  }
  return "<p class='float-note'>" + esc(s) + "</p>";
}

function renderHome(note) {
  const { h, eff } = heroLine();
  title.textContent = h.name;
  badge.textContent = String(h.level);
  const spells = unlockedSpells(h).map((s) => {
    const el = s.element || "neutre";
    return "<i class='" + (el === "feu" || el === "air" ? "tone-acc" : "tone-soft") + "'>" + (EL_MARK[el] || "○") + "</i>";
  }).join("");
  const next = (h.dna.gains || []).find((g) => g.level === h.level + 1);
  setMode("cols home");
  screen.innerHTML = ""
    + banner(note)
    + "<section class=\"panel\">"
    + "<div class=\"meters\">"
    + "<span class='pill tone-acc' aria-label='PV'>" + I.heart + "<b>" + h.pv + "/" + h.pvMax + "</b></span>"
    + "<span class='pill tone-acc' aria-label='PA'>" + I.bolt + "<b>" + eff.pa + "</b></span>"
    + "<span class='pill' aria-label='PM'>" + I.boot + "<b>" + eff.pm + (eff.po ? "+" + eff.po : "") + "</b></span>"
    + "<span class='pill tone-acc' aria-label='kamas'>" + I.coin + "<b>" + h.gold + "</b></span>"
    + "<span class='pill' aria-label='XP'>" + I.star + "<b>" + h.xp + "/" + xpNeed(h.level) + "</b></span>"
    + "<span class='pill' aria-label='" + esc(geneLabel(h.gene)) + "'>" + I.dice + "<b>" + h.gene + "</b></span>"
    + "<span class='pill tone-acc'>" + I.trophy + "<b>" + gradeOf(h.styleBest) + "</b></span>"
    + "</div>"
    + bars(h.pv, h.pvMax, 16)
    + "<div class=\"statgrid\">"
    + stat("heart", eff.vit) + stat("sword", eff.force) + stat("spark", eff.intel) + stat("dice", eff.chance)
    + stat("wind", eff.agi) + stat("eye", eff.sage) + stat("bolt", eff.ini)
    + "</div>"
    + "<div class='pips'>" + spells + (next ? "<b>+" + next.amount + "</b>" + ico(STAT_ICO[next.stat] || "star") : "") + "</div>"
    + "</section>"
    + "<div class=\"actions icon-actions\">"
    + "<button class=\"primary\" id=\"goFight\" type=\"button\" aria-label=\"Combattre\">" + ico("swords") + "</button>"
    + "<button type=\"button\" data-go=\"inv\" aria-label=\"Inventaire\">" + ico("bag") + "</button>"
    + "<button type=\"button\" data-go=\"heal\" aria-label=\"Soins\">" + ico("heart") + "</button>"
    + "<button type=\"button\" data-go=\"shop\" aria-label=\"Boutique\">" + ico("coin") + "</button>"
    + "<button type=\"button\" data-go=\"craft\" aria-label=\"Artisanat\">" + ico("hammer") + "</button>"
    + "<button type=\"button\" data-go=\"forge\" aria-label=\"Forgemagie\">" + ico("anvil") + "</button>"
    + "<button type=\"button\" data-go=\"board\" aria-label=\"Classement\">" + ico("trophy") + "</button>"
    + "</div>";
  screen.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => open(b.getAttribute("data-go"))));
  document.getElementById("goFight").addEventListener("click", () => open("pre"));
}

function stat(icon, value) {
  return "<div class=\"row\"><span class=\"ico\">" + I[icon] + "</span><b>" + value + "</b></div>";
}

function back() {
  return "<button type=\"button\" id=\"back\" aria-label=\"Retour\">" + ico("arrow") + "</button>";
}

function flash(html) {
  screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">" + html + "</p>");
}

function renderInv() {
  title.textContent = "SAC";
  badge.textContent = String((state.hero.inventory || []).length);
  const h = state.hero;
  recomputeVitals(h);
  setMode("cols inv");
  const slots = SLOTS.map((slot) => {
    const it = h.equipped[slot];
    const n = it ? ((it.lines && it.lines[0] && it.lines[0].value) || it.level || 1) : "·";
    return "<button class=\"slot" + (it ? "" : " tone-soft") + "\" data-unequip=\"" + slot + "\" type=\"button\" aria-label=\"" + esc(SLOT_LABEL[slot]) + "\">" + ico(SLOT_ICO[slot] || "bag") + "<b>" + n + "</b></button>";
  }).join("");
  const bag = (h.inventory || []).map((it) => {
    const line = (it.lines && it.lines[0]) || null;
    const n = line ? line.value : (it.level || 1);
    return "<button class=\"slot\" data-equip=\"" + esc(it.id) + "\" type=\"button\" aria-label=\"" + esc(it.name) + "\">" + ico(SLOT_ICO[it.slot] || "bag") + "<b>" + n + "</b></button>";
  }).join("") || "<p class=\"muted\">" + ico("bag") + " 0</p>";
  screen.innerHTML = "<div class=\"grid2 slots\">" + slots + "</div><div><div class=\"grid2 slots\">" + bag + "</div><div class=\"actions icon-actions\">" + back() + "</div></div>";
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-unequip]").forEach((b) => b.addEventListener("click", () => {
    unequip(h, b.getAttribute("data-unequip")); save(); renderInv();
  }));
  screen.querySelectorAll("[data-equip]").forEach((b) => b.addEventListener("click", () => {
    equip(h, b.getAttribute("data-equip")); save(); renderInv();
  }));
}

function renderHeal() {
  title.textContent = "PV";
  badge.textContent = state.hero.pv + "/" + state.hero.pvMax;
  const h = state.hero;
  const tiers = [["mediocre", "t1", 1], ["bon", "t2", 2], ["tresbon", "t3", 3]];
  const cards = tiers.map(([id, cls, n]) => {
    const price = healPrice(h, id);
    let drops = "";
    for (let i = 0; i < n; i++) drops += "●";
    return "<button class='tier " + cls + "' type=\"button\" data-heal=\"" + id + "\" aria-label=\"" + n + "\"><b>" + drops + "</b><b>" + price + "</b></button>";
  }).join("");
  setMode("cols heal");
  screen.innerHTML = "<section class=\"panel\"><h2>" + ico("heart") + " " + h.pv + "/" + h.pvMax + "</h2>" + bars(h.pv, h.pvMax, 16) + "<p class='pill tone-acc'>" + I.coin + "<b>" + h.gold + "</b></p></section><div class=\"actions\">" + cards + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-heal]").forEach((b) => b.addEventListener("click", () => {
    const res = applyHeal(h, b.getAttribute("data-heal"), nextRng());
    save();
    renderHeal();
    if (!res.ok) flash(res.reason === "kamas" ? I.coin + " 0" : I.heart);
    else flash("+" + res.amount + " " + I.heart);
  }));
}

function offerIcon(o) {
  if (o.kind === "potion") return "flask";
  if (o.kind === "material") {
    const m = MATERIALS.find((x) => x.id === o.ref);
    if (!m) return "gem";
    if (m.family === "Plumes") return "feather";
    if (m.family === "Tissus") return "cloth";
    return "ingot";
  }
  return SLOT_ICO[(o.item && o.item.slot) || "arme"] || "sword";
}

function renderShop() {
  title.textContent = "K";
  badge.textContent = String(state.hero.gold);
  if (!state.shop || !state.shop.length) refreshShop(state, nextRng());
  const h = state.hero;
  const flee = fleePrice(h);
  const offers = (state.shop || []).filter((o) => !o.sold && o.kind !== "potion").map((o) => {
    return "<button type=\"button\" data-buy=\"" + esc(o.id) + "\" aria-label=\"" + esc(o.name) + "\">" + ico(offerIcon(o)) + "<b>" + o.price + "</b></button>";
  }).join("");
  setMode("shop");
  screen.innerHTML = "<p class='pill tone-acc'>" + I.coin + "<b>" + h.gold + "</b></p><div class=\"offer-grid\">" + offers + "</div><div class=\"actions icon-actions\"><button type=\"button\" id=\"buyFlee\" aria-label=\"Fiole de fuite\">" + ico("flask") + "<b>" + (flee == null ? "·" : flee) + "</b></button><button type=\"button\" id=\"reroll\" aria-label=\"Rafraîchir\">" + ico("refresh") + "</button>" + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
  document.getElementById("reroll").onclick = () => { refreshShop(state, nextRng()); save(); renderShop(); };
  document.getElementById("buyFlee").onclick = () => {
    const price = fleePrice(h);
    if (price == null || h.gold < price) return;
    h.gold -= price;
    h.fleeCharges = (h.fleeCharges | 0) + 1;
    save(); renderShop();
  };
  screen.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => {
    buy(state, b.getAttribute("data-buy"));
    equipBest(h);
    save(); renderShop();
  }));
}

function renderCraft() {
  title.textContent = "AT";
  badge.textContent = String(state.meta.craftLevel);
  const h = state.hero;
  const owned = MATERIALS.filter((m) => (h.materials[m.id] | 0) > 0);
  const known = owned.map((m) => {
    const k = knownMaterial(state.meta, m.id);
    const icon = m.family === "Plumes" ? "feather" : m.family === "Tissus" ? "cloth" : "ingot";
    const hint = !k || !k.known ? "·" : (k.vague ? "~" : (k.amount != null ? k.amount : ""));
    const tone = m.family === "Métaux" ? " tone-acc" : "";
    return "<button type=\"button\" class=\"" + tone + "\" data-mat=\"" + m.id + "\" aria-label=\"" + esc(m.name) + "\">" + ico(icon) + "<b>" + h.materials[m.id] + "</b><b>" + hint + "</b></button>";
  }).join("") || "<p class=\"muted\">" + ico("ingot") + " 0</p>";
  const slots = ["coiffe", "cape", "arme", "bottes", "ceinture", "bouclier", "amulette"].map((s) => "<button type=\"button\" data-slot=\"" + s + "\" aria-label=\"" + esc(SLOT_LABEL[s]) + "\">" + ico(SLOT_ICO[s]) + "</button>").join("");
  setMode("cols craft");
  screen.innerHTML = "<div><p class='pill'>" + I.hammer + "<b>" + state.meta.craftLevel + "/50</b></p><div class=\"chips\" id=\"mats\">" + known + "</div></div>"
    + "<div><div class=\"chips\" id=\"slots\">" + slots + "</div><div class=\"actions icon-actions\"><button class=\"primary\" type=\"button\" id=\"doCraft\" aria-label=\"Assembler\">" + ico("hammer") + "</button>" + back() + "</div></div>";
  const picked = new Set();
  let slot = "coiffe";
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-mat]").forEach((b) => b.addEventListener("click", () => {
    const id = b.getAttribute("data-mat");
    if (picked.has(id)) picked.delete(id); else picked.add(id);
    b.classList.toggle("on", picked.has(id));
  }));
  screen.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => {
    slot = b.getAttribute("data-slot");
    screen.querySelectorAll("[data-slot]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  const first = screen.querySelector("[data-slot]");
  if (first) first.classList.add("on");
  document.getElementById("doCraft").onclick = () => {
    const res = craft(state, slot, [...picked], nextRng());
    save();
    renderCraft();
    flash(res.ok ? I.check : "×");
  };
}

function renderForge() {
  title.textContent = "FG";
  badge.textContent = String(state.meta.forgeLevel);
  const h = state.hero;
  const items = (h.inventory || []).concat(Object.values(h.equipped || {}));
  const runes = Object.keys(h.runes || {}).filter((s) => h.runes[s] > 0);
  const itemBtns = items.map((it) => "<button type=\"button\" data-item=\"" + esc(it.id) + "\" aria-label=\"" + esc(it.name) + "\">" + ico(SLOT_ICO[it.slot] || "sword") + "</button>").join("") || "<p class=\"muted\">0</p>";
  const runeBtns = runes.map((s) => "<button type=\"button\" data-rune=\"" + s + "\" aria-label=\"" + esc(STAT_LABEL[s] || s) + "\">" + ico(STAT_ICO[s] || "spark") + "<b>" + h.runes[s] + "</b></button>").join("") || "<p class=\"muted\">" + ico("spark") + " 0</p>";
  const crushers = (h.inventory || []).map((it) => "<button type=\"button\" data-crush=\"" + esc(it.id) + "\" aria-label=\"" + esc(it.name) + "\">" + ico("ingot") + "</button>").join("");
  setMode("forge");
  screen.innerHTML = "<p class='pill'>" + I.anvil + "<b>" + state.meta.forgeLevel + "/50</b></p>"
    + "<div class=\"chips\" id=\"items\">" + itemBtns + "</div><div class=\"chips\" id=\"runes\">" + runeBtns + "</div>"
    + "<div class=\"actions icon-actions\"><button class=\"primary\" type=\"button\" id=\"doForge\" aria-label=\"Rune\">" + ico("spark") + "</button>" + crushers + back() + "</div>";
  let itemId = items[0] && items[0].id;
  let rune = runes[0] || null;
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-item]").forEach((b) => b.addEventListener("click", () => { itemId = b.getAttribute("data-item"); screen.querySelectorAll("[data-item]").forEach((x) => x.classList.toggle("on", x === b)); }));
  screen.querySelectorAll("[data-rune]").forEach((b) => b.addEventListener("click", () => { rune = b.getAttribute("data-rune"); screen.querySelectorAll("[data-rune]").forEach((x) => x.classList.toggle("on", x === b)); }));
  const fi = screen.querySelector("[data-item]"); if (fi) fi.classList.add("on");
  const fr = screen.querySelector("[data-rune]"); if (fr) fr.classList.add("on");
  document.getElementById("doForge").onclick = () => {
    if (!itemId || !rune) return;
    const res = forge(state, itemId, rune, nextRng());
    save();
    renderForge();
    flash(res.outcome === "success" ? I.check : res.outcome === "neutral" ? "·" : "×");
  };
  screen.querySelectorAll("[data-crush]").forEach((b) => b.addEventListener("click", () => {
    const res = crush(state, b.getAttribute("data-crush"), nextRng());
    save();
    renderForge();
    flash(res.runes && res.runes.length ? I.spark : "·");
  }));
}

function renderBoard() {
  title.textContent = "TOP";
  badge.textContent = String((state.meta.board || []).length);
  const rows = (state.meta.board || []).map((e, i) => "<div class=\"row\"><span>" + (i + 1) + " " + esc(e.name) + "</span><b>" + e.level + " " + esc(e.grade || "") + "</b></div>").join("") || "<p class=\"muted\">" + ico("trophy") + " 0</p>";
  setMode("board");
  screen.innerHTML = "<section class=\"panel\"><div class=\"kicker ar\">الحكمة</div>" + rows + "<p class='meters'><span class='pill'>" + I.hammer + "<b>" + state.meta.craftLevel + "</b></span><span class='pill'>" + I.anvil + "<b>" + state.meta.forgeLevel + "</b></span></p></section><div class=\"actions icon-actions\">" + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
}

function renderPre() {
  title.textContent = "VS";
  badge.textContent = String((state.hero.companions || []).length);
  const boxes = CHALLENGES.map((c) => {
    const icon = c.id === "immobile" ? "pin" : c.id === "sansSoin" ? "noheal" : "star";
    const mark = c.id === "cinqTours" ? "<b>5</b>" : ico(icon);
    return "<button type=\"button\" data-ch=\"" + c.id + "\" aria-label=\"" + esc(c.name) + "\">" + mark + "</button>";
  }).join("");
  const comps = (state.hero.companions || []).length;
  setMode("cols pre");
  screen.innerHTML = "<section class=\"panel\"><p class='pill'>" + I.people + "<b>" + comps + "</b></p></section>"
    + "<div><div class=\"actions icon-actions\"><button class=\"primary\" type=\"button\" id=\"duel\" aria-label=\"Duel 1v1\">" + ico("person") + "<b>1</b></button><button type=\"button\" id=\"team\" aria-label=\"Équipe\">" + ico("people") + "</button>" + boxes + back() + "</div></div>";
  const picked = new Set();
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-ch]").forEach((b) => b.addEventListener("click", () => {
    const id = b.getAttribute("data-ch");
    if (picked.has(id)) picked.delete(id); else picked.add(id);
    b.classList.toggle("on", picked.has(id));
  }));
  document.getElementById("duel").onclick = () => launch("1v1", [...picked]);
  document.getElementById("team").onclick = () => launch("equipe", [...picked]);
}

function packUnit(u) {
  return {
    name: u.name, level: u.level, pv: u.pv, pvMax: u.pvMax,
    paMax: u.paMax, pmMax: u.pmMax, po: u.po | 0,
    stats: u.stats, res: u.res, spells: u.spells, layers: u.layers || [],
    items: u.items || [], c: u.c, r: u.r, side: u.side,
  };
}

function launch(mode, challenges) {
  equipBest(state.hero);
  recomputeVitals(state.hero);
  const r = nextRng();
  const enc = buildEncounter(state, mode, r, catalog);
  const units = unitsFromEncounter(state.hero, enc);
  const payload = {
    mode: enc.mode,
    size: enc.size,
    challenges,
    player: packUnit(units.allies[0]),
    allies: units.allies.slice(1).map(packUnit),
    foes: units.foes.map(packUnit),
    foeItems: enc.foes.reduce((arr, f) => arr.concat(f.items || []), []),
    foeLevels: enc.foes.map((f) => f.level),
    gold: state.hero.gold | 0,
    fleeCharges: state.hero.fleeCharges | 0,
  };
  try {
    localStorage.setItem(FIGHT, JSON.stringify(payload));
    localStorage.removeItem(RESULT);
  } catch (_e) {}
  save();
  showLoad(enc.mode + " · niveaux " + enc.levelSum, () => { location.href = "fantasy-combat.html"; });
}

function renderResult(settled) {
  if (!settled) { renderHome(); return; }
  if (settled.dead) {
    title.textContent = "×";
    badge.textContent = "0";
    const e = settled.entry || {};
    setMode("result");
    screen.innerHTML = "<section class=\"panel\"><div class=\"kicker ar\">النور</div><h2>" + ico("skull") + " " + esc(e.name || "") + "</h2><p class='meters'><span class='pill'><b>" + (e.level || 1) + "</b></span><span class='pill tone-acc'><b>" + esc(e.grade || "") + "</b></span><span class='pill'><b>" + (e.fights || 0) + "</b></span></p></section><div class=\"actions icon-actions\"><button class=\"primary\" type=\"button\" id=\"cont\" aria-label=\"Continuer\">" + ico("go") + "</button></div>";
    document.getElementById("cont").onclick = () => renderHome("Nouveau personnage : " + state.hero.name + ".");
    return;
  }
  if (settled.fled) {
    renderHome("Fuite. " + (settled.paid ? settled.paid + " kamas." : "0"));
    return;
  }
  const comp = settled.companion;
  let extra = "";
  if (comp) {
    extra = "<section class=\"panel\"><h2>" + esc(comp.companion.name) + "</h2><p class='pill'>" + I.person + "<b>" + comp.companion.level + " " + (comp.accepted ? "✓" : "×") + " " + comp.chance + "</b></p></section>";
    if (comp.accepted) recruit(state.hero, comp.companion);
  }
  title.textContent = settled.victory ? "✓" : "=";
  badge.textContent = settled.grade || gradeOf(settled.style || 0);
  setMode("result");
  screen.innerHTML = "<section class=\"panel\"><h2>" + (settled.victory ? I.trophy : "=") + "</h2><p class='meters'><span class='pill'>" + I.star + "<b>+" + (settled.xp || 0) + "</b></span><span class='pill tone-acc'>" + I.coin + "<b>+" + (settled.gold || 0) + "</b></span>" + (settled.levels && settled.levels.length ? "<span class='pill'><b>" + state.hero.level + "</b></span>" : "") + "<span class='pill tone-acc'><b>" + esc(settled.grade || "") + "</b></span>" + (settled.drops && settled.drops.length ? "<span class='pill'>" + I.bag + "<b>" + settled.drops.length + "</b></span>" : "") + "</p></section>" + extra + "<div class=\"actions icon-actions\"><button class=\"primary\" type=\"button\" id=\"cont\" aria-label=\"Continuer\">" + ico("go") + "</button></div>";
  save();
  document.getElementById("cont").onclick = () => renderHome();
}

function open(id) {
  showLoad(id === "pre" ? "Briefing" : "Sync", () => {
    if (id === "inv") renderInv();
    else if (id === "heal") renderHeal();
    else if (id === "shop") renderShop();
    else if (id === "craft") renderCraft();
    else if (id === "forge") renderForge();
    else if (id === "board") renderBoard();
    else if (id === "pre") renderPre();
    else renderHome();
  });
}

function consumeResult() {
  let raw = null;
  try { raw = localStorage.getItem(RESULT); } catch (_e) {}
  if (!raw) return null;
  try { localStorage.removeItem(RESULT); localStorage.removeItem(FIGHT); } catch (_e) {}
  const report = JSON.parse(raw);
  state._catalog = catalog;
  if (report.fled) {
    const fled = useFlee(state.hero);
    if (!fled.ok) return { ok: false, fled: false, unpaid: true };
    report.paid = fled.paid || 0;
  }
  const settled = settleFight(state, report, nextRng());
  save();
  return settled;
}

async function boot() {
  try {
    const res = await fetch("data/generated-spells.json", { cache: "no-store" });
    if (res.ok) catalog = prepareCatalog(await res.json());
  } catch (_e) {}
  if (!catalog.length) catalog = prepareCatalog([]);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SAVE) || "null"); } catch (_e) {}
  if (saved && saved.hero && saved.meta) {
    state = saved;
    state._catalog = catalog;
    recomputeVitals(state.hero);
  } else {
    state = createState((Date.now() ^ (Math.random() * 1e9)) >>> 0, catalog);
    state._catalog = catalog;
    save();
  }
  showLoad("Initialisation du personnage", () => {
    const settled = consumeResult();
    if (settled && settled.unpaid) renderHome("Fuite impossible : pas assez de kamas.");
    else if (settled) renderResult(settled);
    else renderHome();
  });
}

document.querySelectorAll('a[href="fantasy-combat.html"]').forEach((a) => {
  a.addEventListener("click", () => { try { localStorage.removeItem(FIGHT); } catch (_e) {} });
});

boot();
