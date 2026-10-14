/**
 * Boucle portrait du roguelite : personnage immédiat, menus, départ en combat.
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

function showLoad(text, then) {
  title.textContent = "SYNC";
  badge.textContent = "MAGI";
  screen.innerHTML = "<div class=\"load\"><div class=\"kicker ar\">التزامن</div><h1>MAGI</h1><p class=\"muted\">" + esc(text) + "</p><div class=\"track\"><i></i></div></div>";
  setTimeout(then, 420);
}

function heroLine() {
  const h = state.hero;
  recomputeVitals(h);
  const eff = h.eff || effectiveStats(h);
  return { h, eff };
}

function renderHome(note) {
  const { h, eff } = heroLine();
  title.textContent = h.name;
  badge.textContent = "NIV " + h.level;
  const spells = unlockedSpells(h).map((s) => esc(s.name)).join(" · ");
  const next = (h.dna.gains || []).find((g) => g.level === h.level + 1);
  screen.innerHTML = ""
    + (note ? "<p class=\"float-note\">" + note + "</p>" : "")
    + "<section class=\"panel\"><div class=\"kicker\">Personnage · dé " + h.gene + " · " + esc(h.geneLabel || geneLabel(h.gene)) + "</div>"
    + "<h2>PV " + h.pv + " / " + h.pvMax + "</h2>"
    + bars(h.pv, h.pvMax, 16)
    + "<p class=\"muted\">PA " + eff.pa + " · PM " + eff.pm + (eff.po ? " · PO +" + eff.po : "") + " · " + h.gold + " kamas</p>"
    + "<p class=\"muted\">XP " + h.xp + " / " + xpNeed(h.level) + " · style " + gradeOf(h.styleBest) + " (" + h.styleBest + ")</p>"
    + "<p class=\"muted\">" + esc(spells || "Aucun sort") + "</p>"
    + (next ? "<p class=\"muted\">Prochain gain : +" + next.amount + " " + esc(STAT_LABEL[next.stat] || next.stat) + "</p>" : "")
    + "</section>"
    + "<div class=\"statgrid\">"
    + stat("Vitalité", eff.vit) + stat("Force", eff.force) + stat("Intelligence", eff.intel) + stat("Chance", eff.chance)
    + stat("Agilité", eff.agi) + stat("Sagesse", eff.sage) + stat("Initiative", eff.ini)
    + "</div>"
    + "<div class=\"actions\">"
    + "<button class=\"primary\" id=\"goFight\" type=\"button\">Combattre</button>"
    + "<button type=\"button\" data-go=\"inv\">Inventaire</button>"
    + "<button type=\"button\" data-go=\"heal\">Soins</button>"
    + "<button type=\"button\" data-go=\"shop\">Boutique</button>"
    + "<button type=\"button\" data-go=\"craft\">Artisanat</button>"
    + "<button type=\"button\" data-go=\"forge\">Forgemagie</button>"
    + "<button type=\"button\" data-go=\"board\">Classement</button>"
    + "</div>";
  screen.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => open(b.getAttribute("data-go"))));
  document.getElementById("goFight").addEventListener("click", () => open("pre"));
}

function stat(label, value) {
  return "<div class=\"row\"><span class=\"muted\">" + esc(label) + "</span><b>" + value + "</b></div>";
}

function back(fn) {
  return "<button type=\"button\" id=\"back\">Retour</button>";
}

function renderInv() {
  title.textContent = "SAC";
  badge.textContent = "INV";
  const h = state.hero;
  recomputeVitals(h);
  const slots = SLOTS.map((slot) => {
    const it = h.equipped[slot];
    return "<button class=\"slot\" data-unequip=\"" + slot + "\" type=\"button\"><b>" + esc(SLOT_LABEL[slot]) + "</b><span>" + (it ? esc(it.name) : "vide") + "</span></button>";
  }).join("");
  const bag = (h.inventory || []).map((it) => "<button class=\"slot\" data-equip=\"" + esc(it.id) + "\" type=\"button\"><b>" + esc(it.name) + "</b><span>" + esc(SLOT_LABEL[it.slot] || it.slot) + " · " + (it.lines || []).map((l) => (STAT_LABEL[l.stat] || l.stat) + " " + l.value).join(", ") + "</span></button>").join("") || "<p class=\"muted\">Le sac est vide.</p>";
  screen.innerHTML = "<div class=\"grid2\">" + slots + "</div><h2 class=\"kicker\">Sac</h2><div class=\"list\">" + bag + "</div><div class=\"actions\">" + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-unequip]").forEach((b) => b.addEventListener("click", () => {
    unequip(h, b.getAttribute("data-unequip")); save(); renderInv();
  }));
  screen.querySelectorAll("[data-equip]").forEach((b) => b.addEventListener("click", () => {
    equip(h, b.getAttribute("data-equip")); save(); renderInv();
  }));
}

function renderHeal() {
  title.textContent = "SOINS";
  badge.textContent = "PV";
  const h = state.hero;
  const tiers = [
    ["mediocre", "Médiocre", "peu cher, montant au hasard"],
    ["bon", "Bon", "soin moyen, parfois moins, rarement double"],
    ["tresbon", "Très bon", "cher, grande chance d’un gros soin"],
  ];
  const cards = tiers.map(([id, name, desc]) => {
    const price = healPrice(h, id);
    return "<button type=\"button\" data-heal=\"" + id + "\"><span><b>" + name + "</b><br><span class=\"muted\">" + desc + "</span></span><b>" + price + "</b></button>";
  }).join("");
  screen.innerHTML = "<section class=\"panel\"><h2>PV " + h.pv + " / " + h.pvMax + "</h2>" + bars(h.pv, h.pvMax, 16) + "<p class=\"muted\">" + h.gold + " kamas. Les bons soins restent difficiles à payer.</p></section><div class=\"actions\">" + cards + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
  screen.querySelectorAll("[data-heal]").forEach((b) => b.addEventListener("click", () => {
    const res = applyHeal(h, b.getAttribute("data-heal"), nextRng());
    save();
    renderHeal();
    if (!res.ok) screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">" + (res.reason === "kamas" ? "Pas assez de kamas." : "Déjà au maximum.") + "</p>");
    else screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">+" + res.amount + " PV</p>");
  }));
}

function renderShop() {
  title.textContent = "BOUTIQUE";
  badge.textContent = "KAMAS";
  if (!state.shop || !state.shop.length) refreshShop(state, nextRng());
  const h = state.hero;
  const flee = fleePrice(h);
  const offers = (state.shop || []).filter((o) => !o.sold).map((o) => {
    return "<div class=\"offer\"><div><b>" + esc(o.name) + "</b><div class=\"muted\">" + o.price + " kamas" + (o.kind === "material" ? " · matière" : "") + "</div></div><button type=\"button\" data-buy=\"" + esc(o.id) + "\">Acheter</button></div>";
  }).join("");
  screen.innerHTML = "<p class=\"muted\">" + h.gold + " kamas · fiole de fuite " + (flee == null ? "indisponible" : flee + " (60 %)") + "</p><div class=\"list\">" + offers + "</div><div class=\"actions\"><button type=\"button\" id=\"buyFlee\">Fiole de fuite</button><button type=\"button\" id=\"reroll\">Rafraîchir</button>" + back() + "</div>";
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
  title.textContent = "ATELIER";
  badge.textContent = "NIV " + state.meta.craftLevel;
  const h = state.hero;
  const owned = MATERIALS.filter((m) => (h.materials[m.id] | 0) > 0);
  const known = owned.map((m) => {
    const k = knownMaterial(state.meta, m.id);
    const hint = !k || !k.known ? "inconnu" : (k.vague ? "piste" : (STAT_LABEL[k.stat] || k.stat) + (k.amount != null ? " " + k.amount : ""));
    return "<button type=\"button\" data-mat=\"" + m.id + "\">" + esc(m.name) + " ×" + h.materials[m.id] + "<br><span class=\"muted\">" + esc(hint) + "</span></button>";
  }).join("") || "<p class=\"muted\">Aucune matière. La boutique en vend.</p>";
  const slots = ["coiffe", "cape", "arme", "bottes", "ceinture", "bouclier", "amulette"].map((s) => "<button type=\"button\" data-slot=\"" + s + "\">" + esc(SLOT_LABEL[s]) + "</button>").join("");
  screen.innerHTML = "<p class=\"muted\">Artisanat " + state.meta.craftLevel + "/50. Plus de matières, plus de stats, plus d’échecs. Les stats sont bornées par le niveau du personnage.</p>"
    + "<div class=\"kicker\">Matières</div><div class=\"chips\" id=\"mats\">" + known + "</div>"
    + "<div class=\"kicker\">Emplacement</div><div class=\"chips\" id=\"slots\">" + slots + "</div>"
    + "<div class=\"actions\"><button class=\"primary\" type=\"button\" id=\"doCraft\">Assembler</button>" + back() + "</div>";
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
    const msg = res.ok ? "Réussi." : (res.reason === "échec" ? "Échec : les matières sont perdues." : "Échec.");
    renderCraft();
    screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">" + msg + "</p>");
  };
}

function renderForge() {
  title.textContent = "FORGE";
  badge.textContent = "NIV " + state.meta.forgeLevel;
  const h = state.hero;
  const items = (h.inventory || []).concat(Object.values(h.equipped || {}));
  const runes = Object.keys(h.runes || {}).filter((s) => h.runes[s] > 0);
  const itemBtns = items.map((it) => "<button type=\"button\" data-item=\"" + esc(it.id) + "\">" + esc(it.name) + "</button>").join("") || "<p class=\"muted\">Aucun objet.</p>";
  const runeBtns = runes.map((s) => "<button type=\"button\" data-rune=\"" + s + "\">" + esc(STAT_LABEL[s] || s) + " ×" + h.runes[s] + "</button>").join("") || "<p class=\"muted\">Aucune rune. Le broyage en donne très peu.</p>";
  const crushers = (h.inventory || []).map((it) => "<button type=\"button\" data-crush=\"" + esc(it.id) + "\">Broyer " + esc(it.name) + "</button>").join("");
  screen.innerHTML = "<p class=\"muted\">Forgemagie " + state.meta.forgeLevel + "/50. Une rune peut passer, échouer, ou faire baisser une autre ligne.</p>"
    + "<div class=\"chips\" id=\"items\">" + itemBtns + "</div><div class=\"chips\" id=\"runes\">" + runeBtns + "</div>"
    + "<div class=\"actions\"><button class=\"primary\" type=\"button\" id=\"doForge\">Appliquer la rune</button>" + crushers + back() + "</div>";
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
    const word = res.outcome === "success" ? "Rune posée." : res.outcome === "neutral" ? "Rien ne change." : "La rune n’a pas tenu.";
    screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">" + word + "</p>");
  };
  screen.querySelectorAll("[data-crush]").forEach((b) => b.addEventListener("click", () => {
    const res = crush(state, b.getAttribute("data-crush"), nextRng());
    save();
    renderForge();
    screen.insertAdjacentHTML("afterbegin", "<p class=\"float-note\">" + (res.runes && res.runes.length ? "Rune obtenue." : "Poussière. Rien.") + "</p>");
  }));
}

function renderBoard() {
  title.textContent = "TABLEAU";
  badge.textContent = "TOP";
  const rows = (state.meta.board || []).map((e, i) => "<div class=\"row\"><span>" + (i + 1) + " " + esc(e.name) + "</span><b>N" + e.level + " · " + esc(e.grade || "") + "</b></div>").join("") || "<p class=\"muted\">Aucune chute pour l’instant.</p>";
  screen.innerHTML = "<section class=\"panel\"><div class=\"kicker ar\">الحكمة</div><h2>Meilleurs personnages</h2>" + rows + "<p class=\"muted\">Métiers : artisanat " + state.meta.craftLevel + " · forgemagie " + state.meta.forgeLevel + ". Ils restent après la mort.</p></section><div class=\"actions\">" + back() + "</div>";
  document.getElementById("back").onclick = () => renderHome();
}

function renderPre() {
  title.textContent = "COMBAT";
  badge.textContent = "CHOIX";
  const boxes = CHALLENGES.map((c) => "<button type=\"button\" data-ch=\"" + c.id + "\">" + esc(c.name) + "<br><span class=\"muted\">" + esc(c.desc) + "</span></button>").join("");
  const comps = (state.hero.companions || []).length;
  screen.innerHTML = "<section class=\"panel\"><h2>Avant le combat</h2><p class=\"muted\">Pas de choix de difficulté. L’équipe, si tu la prends, a une taille tirée au sort. Compagnons : " + comps + ".</p></section>"
    + "<div class=\"actions\"><button class=\"primary\" type=\"button\" id=\"duel\">Duel 1v1</button><button type=\"button\" id=\"team\">Équipe</button></div>"
    + "<div class=\"kicker\">Défis (bonus d’XP et de butin)</div><div class=\"chips\">" + boxes + "</div>"
    + "<div class=\"actions\">" + back() + "</div>";
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
    title.textContent = "CHUTE";
    badge.textContent = "FIN";
    const e = settled.entry || {};
    screen.innerHTML = "<section class=\"panel\"><div class=\"kicker ar\">النور</div><h2>" + esc(e.name || "") + " est tombé</h2><p>Niveau " + (e.level || 1) + " · style " + esc(e.grade || "") + " · " + (e.fights || 0) + " combats.</p><p class=\"muted\">Tout est perdu, sauf les métiers et ce que tu as appris des matières. Un nouveau personnage est déjà là.</p></section><div class=\"actions\"><button class=\"primary\" type=\"button\" id=\"cont\">Continuer</button></div>";
    document.getElementById("cont").onclick = () => renderHome("Nouveau personnage : " + esc(state.hero.name) + ".");
    return;
  }
  if (settled.fled) {
    renderHome("Fuite. " + (settled.paid ? settled.paid + " kamas." : "Aucune autre perte."));
    return;
  }
  const comp = settled.companion;
  let extra = "";
  if (comp) {
    extra = "<section class=\"panel\"><h2>" + esc(comp.companion.name) + "</h2><p class=\"muted\">Niveau " + comp.companion.level + " · " + (comp.accepted ? "accepte de te suivre (" + comp.chance + " %)." : "refuse (" + comp.chance + " %).") + "</p></section>";
    if (comp.accepted) recruit(state.hero, comp.companion);
  }
  title.textContent = "BILAN";
  badge.textContent = settled.grade || gradeOf(settled.style || 0);
  screen.innerHTML = "<section class=\"panel\"><h2>" + (settled.victory ? "Victoire" : "Match nul") + "</h2><p>+" + (settled.xp || 0) + " XP · +" + (settled.gold || 0) + " kamas" + (settled.levels && settled.levels.length ? " · niveau " + state.hero.level : "") + "</p><p class=\"muted\">Style " + (settled.style || 0) + " · " + esc(settled.grade || "") + (settled.drops && settled.drops.length ? " · butin " + settled.drops.length : "") + "</p></section>" + extra + "<div class=\"actions\"><button class=\"primary\" type=\"button\" id=\"cont\">Continuer</button></div>";
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
