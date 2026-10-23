import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createHero, createState, finishDeath, crush, prepareCatalog,
  gainXp, xpNeed, recomputeVitals, effectiveStats, mulberry32,
  createItem, layersForHero, lookOf, gearCatalog, equip,
} from "../js/roguelite.js";

const spells = JSON.parse(readFileSync("data/user-spells.json", "utf8"));

describe("carrière", () => {
  it("un personnage neuf tire un gène et des stats de base", () => {
    const hero = createHero(42, prepareCatalog(spells));
    assert.ok(hero.gene >= 1 && hero.gene <= 8);
    assert.equal(hero.level, 1);
    assert.equal(hero.base.force, 5);
    assert.ok(hero.pvMax >= 50);
    assert.ok(hero.spells.some((s) => s.id === "punch"));
    const eff = effectiveStats(hero);
    assert.equal(eff.pa, 6);
    assert.equal(eff.pm, 3);
  });

  it("la mort inscrit l’ancien et crée un autre personnage", () => {
    const catalog = prepareCatalog(spells);
    const state = createState(7, catalog);
    state._catalog = catalog;
    const first = state.hero.name;
    const firstId = state.hero.id;
    state.hero.level = 4;
    const settled = finishDeath(state, { style: 10 });
    assert.equal(settled.dead, true);
    assert.equal(settled.entry.name, first);
    assert.notEqual(state.hero.id, firstId);
    assert.equal(state.hero.level, 1);
    assert.ok(state.hero.gene >= 1 && state.hero.gene <= 8);
    assert.equal(state.meta.board[0].name, first);
  });

  it("le bris retire la pièce et peut rendre une rune", () => {
    const state = createState(9, prepareCatalog(spells));
    const rng = mulberry32(1);
    const item = {
      id: "piece",
      slot: "arme",
      level: 3,
      lines: [{ stat: "force", value: 4, min: 1, max: 8 }],
      maxLines: 6,
    };
    state.hero.inventory.push(item);
    let saw = false;
    for (let i = 0; i < 400 && !saw; i++) {
      state.hero.inventory.push(Object.assign({}, item, { id: "piece" + i, lines: item.lines.map((l) => Object.assign({}, l)) }));
      const res = crush(state, "piece" + i, rng);
      assert.equal(res.ok, true);
      if (res.runes.length) saw = true;
    }
    assert.equal(saw, true);
    assert.ok(xpNeed(1) >= 40);
    const leveled = createHero(3, prepareCatalog(spells));
    const gained = gainXp(leveled, xpNeed(1));
    assert.deepEqual(gained, [2]);
    recomputeVitals(leveled);
    assert.ok(leveled.pvMax >= 55);
  });

  it("le combat seul garde le camp et n’envoie pas à l’éditeur", () => {
    const html = readFileSync("fantasy-combat.html", "utf8");
    const career = readFileSync("js/combat-career.js", "utf8");
    assert.match(html, /id="camp"/);
    assert.match(html, /CombatCareer\.finish/);
    assert.match(html, /aria-label="Portrait"/);
    assert.match(html, /orientation:landscape/);
    assert.doesNotMatch(html, /aria-label="Paysage"/);
    assert.doesNotMatch(html, /orientation:portrait\) and \(max-width:900px\)/);
    assert.match(html, /function hurtId/);
    assert.match(career, /finishDeath|settleFight/);
    assert.match(career, /crush\(/);
    assert.doesNotMatch(career, /spell-editor/);
    assert.equal(html.includes("makeItem"), false);
    assert.match(career, /data-fight='1v1'/);
    assert.match(career, /state\.challenges/);
    assert.match(html, /35000/);
    assert.match(html, /btnRecenter/);
    assert.match(html, /combat-grid\.js/);
    assert.match(html, /id="aimCancel"/);
    assert.doesNotMatch(html, /className = "xaim"/);
    assert.match(html, /#dpad\.aim/);
    assert.match(career, /gear-ico/);
    assert.match(career, /lookOf/);
    assert.match(html, /spriteBase/);
  });

  it("chaque tenue du pack a des stats et la même pièce une fois équipée", () => {
    const pieces = gearCatalog();
    assert.ok(pieces.length > 80);
    ["Head1", "Chest1", "Legs1", "Shoes1", "Belt1", "Hands1", "Shield1", "Bag1", "Melee1", "Magic1", "Ranged1"].forEach((folder) => {
      assert.ok(pieces.some((p) => p.folder === folder), folder);
    });
    const a = createItem(mulberry32(1), { slot: "coiffe", folder: "Head12", level: 4, quality: 1 });
    const b = createItem(mulberry32(9), { slot: "coiffe", folder: "Head12", level: 4, quality: 1 });
    assert.equal(a.folder, "Head12");
    assert.equal(a.layer, "head");
    assert.deepEqual(a.lines.map((l) => l.stat + ":" + l.value), b.lines.map((l) => l.stat + ":" + l.value));
    assert.equal(lookOf(a).folder, "Head12");
    const hero = createHero(4, prepareCatalog(spells));
    const worn = hero.inventory.find((it) => it.slot === "torse");
    equip(hero, worn.id);
    const layers = layersForHero(hero);
    const chest = layers.find((l) => l.layer === "chest");
    assert.equal(chest.folder, worn.folder);
    assert.equal(chest.tint, lookOf(worn).tint);
    assert.ok(layers.some((l) => l.folder === "NakedBody"));
  });
});
