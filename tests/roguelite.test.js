import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateCatalog } from "../js/spell-lab.js";
import {
  createHero, createState, xpNeed, geneLabel, effectiveStats, recomputeVitals,
  prepareCatalog, unlockedSpells, healPrice, applyHeal, fleePrice, useFlee,
  syncHeroSpells, isHandmadeSpell,
  craft, crush, forge, equip, gainXp, buildEncounter, unitsFromEncounter,
  simulateBattle, settleFight, simulateRun, gradeOf, BALANCE, mulberry32,
} from "../js/roguelite.js";

const catalog = prepareCatalog(generateCatalog({ seed: 3, count: 24 }));

describe("ADN", () => {
  it("niveau 1 : stats à 5, 6 PA, 3 PM, 50 PV, nu", () => {
    const h = createHero(11, catalog);
    assert.equal(h.level, 1);
    assert.equal(h.base.vit, 5);
    assert.equal(h.base.force, 5);
    assert.equal(h.base.intel, 5);
    assert.equal(h.base.chance, 5);
    assert.equal(h.base.agi, 5);
    assert.equal(h.base.sage, 5);
    assert.equal(h.base.ini, 5);
    assert.equal(h.pvMax, 50);
    assert.equal(h.pv, 50);
    assert.equal(h.paMax, 6);
    assert.equal(h.pmMax, 3);
    assert.equal(Object.keys(h.equipped).length, 0);
    assert.equal(h.dna.gains.length, 50);
    assert.equal(h.dna.gains[0].amount, 0);
    assert.ok(h.spells.length >= 6);
    const on = unlockedSpells(h);
    assert.equal(on.length, 3);
  });

  it("le kit joué ne garde que les sorts faits main", () => {
    const user = prepareCatalog(JSON.parse(readFileSync("data/user-spells.json", "utf8")));
    assert.deepEqual(user.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
    const h = createHero(11, user);
    assert.deepEqual(h.spells.map((s) => s.id), ["punch", "roulade", "coup_de_pied"]);
    assert.equal(unlockedSpells(h).length, 3);
    assert.ok(h.spells.every((s) => isHandmadeSpell(s)));
    const dirty = createHero(11, catalog);
    dirty.spells.push({ id: "gen_999", name: "Laid", generated: true, type: "damage", cost: 2, range: 1, dmg: [1, 2], unlock: 1 });
    assert.equal(syncHeroSpells(dirty, user), true);
    assert.deepEqual(dirty.spells.map((s) => s.id), ["punch", "roulade", "coup_de_pied"]);
    const extra = user.concat([{ id: "eclat", name: "Éclat", type: "damage", cost: 3, range: 2, dmg: [4, 6], element: "feu" }]);
    const grown = createHero(4, prepareCatalog(extra));
    assert.deepEqual(grown.spells.map((s) => s.id), ["punch", "roulade", "coup_de_pied", "eclat"]);
    assert.equal(grown.spells.find((s) => s.id === "eclat").unlock, 5);
    assert.equal(unlockedSpells(grown).length, 3);
  });

  it("le dé 8 change le palier et un 8 a de meilleurs gains", () => {
    let weak = 0; let perfect = 0; let plus4 = [0, 0];
    for (let i = 0; i < 80; i++) {
      const h = createHero(1000 + i, catalog);
      assert.ok(h.gene >= 1 && h.gene <= 8);
      assert.equal(h.geneLabel, geneLabel(h.gene));
      const fours = h.dna.gains.filter((g) => g.amount === 4).length;
      if (h.gene <= 2) { weak++; plus4[0] += fours; }
      if (h.gene === 8) { perfect++; plus4[1] += fours; assert.ok(h.elements.length >= 1); }
    }
    assert.ok(weak > 5 && perfect > 3);
    const avgWeak = plus4[0] / weak;
    const avgPerfect = plus4[1] / perfect;
    assert.ok(avgPerfect > avgWeak + 8, avgPerfect + " vs " + avgWeak);
  });

  it("les gains d’ADN s’appliquent en montant de niveau", () => {
    const h = createHero(42, catalog);
    const before = h.base.force + h.base.intel + h.base.chance + h.base.agi + h.base.vit + h.base.sage + h.base.ini;
    gainXp(h, xpNeed(1));
    assert.equal(h.level, 2);
    const after = h.base.force + h.base.intel + h.base.chance + h.base.agi + h.base.vit + h.base.sage + h.base.ini;
    assert.equal(after - before, h.dna.gains[1].amount);
    assert.equal(h.pvMax, 55 + Math.max(0, effectiveStats(h).vit - 5));
  });
});

describe("économie et métiers", () => {
  it("soigne selon trois prix et la fuite coûte environ 60 %", () => {
    const h = createHero(7, catalog);
    h.gold = 100;
    h.pv = 10;
    const cheap = healPrice(h, "mediocre");
    const mid = healPrice(h, "bon");
    const rich = healPrice(h, "tresbon");
    assert.ok(cheap < mid && mid < rich);
    const a = applyHeal(h, "mediocre", () => 0.5);
    assert.equal(a.ok, true);
    assert.ok(h.pv > 10);
    assert.equal(h.gold, 100 - cheap);
    h.gold = 100;
    assert.equal(fleePrice(h), 60);
    const f = useFlee(h);
    assert.equal(f.ok, true);
    assert.equal(h.gold, 40);
  });

  it("la mort garde les métiers et la connaissance, pas le butin", () => {
    const state = createState(9, catalog);
    state._catalog = catalog;
    state.hero.gold = 50;
    state.hero.materials.fer = 2;
    state.hero.inventory.push({ id: "x", name: "X", slot: "arme", lines: [{ stat: "force", value: 3 }], maxLines: 6 });
    const made = craft(state, "coiffe", ["fer", "fer"], () => 0.99);
    assert.equal(made.ok, true);
    assert.ok(state.meta.knowledge.fer.samples >= 1);
    const craftLv = state.meta.craftLevel;
    state.hero.fights = 3;
    state.hero.level = 4;
    const end = settleFight(state, { winner: "b", playerAlive: false, style: 10, kills: 0, foeItems: [] }, () => 0.2);
    assert.equal(end.dead, true);
    assert.equal(state.meta.craftLevel, craftLv);
    assert.ok(state.meta.knowledge.fer.samples >= 1);
    assert.equal(state.hero.level, 1);
    assert.equal(state.hero.gold <= 8, true);
    assert.equal(state.meta.board.length, 1);
    assert.equal(state.meta.board[0].level, 4);
  });

  it("le broyage donne peu de runes, la forgemagie peut échouer", () => {
    const state = createState(3, catalog);
    const rng = mulberry32(2026);
    let runes = 0;
    let tries = 0;
    for (let i = 0; i < 240; i++) {
      state.hero.inventory.push({
        id: "c" + i, name: "C", slot: "arme", lines: [
          { stat: "force", value: 10 }, { stat: "vit", value: 8 },
        ], maxLines: 6,
      });
      const res = crush(state, "c" + i, rng);
      tries += 2;
      runes += res.runes.length;
    }
    const rate = runes / tries;
    assert.ok(rate < 0.12, "taux " + rate);
    assert.ok(rate > 0, "taux " + rate);
    state.hero.runes.force = 3;
    state.hero.inventory.push({ id: "forge", name: "F", slot: "arme", lines: [{ stat: "vit", value: 12 }], maxLines: 6 });
    const out = forge(state, "forge", "force", () => 0.01);
    assert.equal(out.ok, true);
    assert.equal(state.hero.runes.force, 2);
  });

  it("un objet fabriqué au niveau 1 reste faible", () => {
    const state = createState(21, catalog);
    state.hero.materials.kobalte = 1;
    state.hero.materials.quartz = 1;
    const res = craft(state, "arme", ["kobalte", "quartz"], () => 0.2);
    assert.equal(res.ok, true);
    const statSum = res.item.lines.reduce((s, l) => s + l.value, 0);
    assert.ok(statSum < 12, statSum);
    assert.ok(res.item.maxLines > res.item.lines.length);
  });
});

describe("combats", () => {
  it("égalise à peu près la somme des niveaux", () => {
    const state = createState(5, catalog);
    state._catalog = catalog;
    gainXp(state.hero, 5000);
    const enc = buildEncounter(state, "equipe", () => 0.3, catalog);
    const allySum = state.hero.level + enc.allies.reduce((s, a) => s + a.level, 0);
    const foeSum = enc.foes.reduce((s, a) => s + a.level, 0);
    assert.equal(enc.allies.length + 1, enc.foes.length);
    assert.ok(Math.abs(allySum - foeSum) <= enc.foes.length * 3 + 2, allySum + " vs " + foeSum);
  });

  it("termine un duel et une victoire donne de l’XP", () => {
    const state = createState(8, catalog);
    state._catalog = catalog;
    const enc = buildEncounter(state, "1v1", () => 0.4, catalog);
    const units = unitsFromEncounter(state.hero, enc);
    const battle = simulateBattle(units.allies, units.foes, { seed: 4 });
    assert.ok(["a", "b", "draw"].includes(battle.winner));
    assert.ok(battle.turns >= 1);
    assert.ok(gradeOf(battle.style));
    battle.foeLevels = [1];
    battle.foeItems = [];
    battle.challenges = ["cinqTours"];
    if (battle.winner === "a" && battle.playerAlive) {
      const before = state.hero.level;
      const settled = settleFight(state, battle, () => 0.5);
      assert.equal(settled.victory, true);
      assert.ok(settled.xp > 0);
      assert.ok(state.hero.level >= before);
    }
  });

  it("la courbe d’XP accélère", () => {
    assert.ok(xpNeed(40) > xpNeed(10) * 3);
    assert.ok(xpNeed(49) > xpNeed(40));
  });

  it("une partie courte se termine", () => {
    const trace = simulateRun(99, catalog, { maxFights: 12, stopAt50: true });
    assert.ok(trace.fights >= 1);
    assert.ok(trace.reached >= 1);
    assert.equal(trace.craftLevel >= 1, true);
  });
});

describe("aucun symbole religieux", () => {
  it("le moteur et l’accueil n’utilisent pas ces symboles", () => {
    const files = ["js/roguelite.js", "index.html", "css/skin-d.css"].map((f) => {
      try { return readFileSync(f, "utf8"); } catch (_e) { return ""; }
    }).join("\n");
    assert.equal(/sephiroth|kether|malkuth|lilith/i.test(files), false);
  });
});

describe("résistances", () => {
  it("plafonne à 50 %", () => {
    const h = createHero(2, catalog);
    h.inventory.push({
      id: "r", name: "R", slot: "cape", lines: [{ stat: "resFeu", value: 80 }], maxLines: 6,
    });
    equip(h, "r");
    recomputeVitals(h);
    assert.ok(h.eff.res.feu <= BALANCE.resistCap + 1e-9);
    assert.ok(Math.abs(h.eff.res.feu - 0.5) < 1e-9);
  });
});
