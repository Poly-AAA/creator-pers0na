import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  composeSpell,
  applyUpgrade,
  validateSpell,
  generateCatalog,
  auditAndFix,
  simulateFight,
  trainPolicies,
  effectiveStats,
  mulberry32,
  balanceSpell,
} from "../js/spellcraft.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("composition animation + effet + amélioration", () => {
  it("produit un sort au format du jeu", () => {
    const { spell, ok } = composeSpell({
      animId: "attack",
      effectId: "impact",
      upgradeIds: ["surcharge", "poussee"],
    });
    assert.equal(ok, true);
    assert.equal(spell.type, "damage");
    assert.equal(spell.anim, "attack");
    assert.equal(spell.effect, "push");
    assert.equal(spell.school, "Cinétique");
    assert.ok(Array.isArray(spell.dmg));
    assert.equal(spell.bakedEvo.dmg, 4);
    assert.equal(spell.bakedEvo.push, 1);
    assert.equal(spell.generated, true);
  });

  it("refuse une amélioration incompatible", () => {
    const { ok, errors } = composeSpell({
      animId: "strafeL",
      effectId: "soin",
      upgradeIds: ["surcharge"],
    });
    assert.equal(ok, false);
    assert.ok(errors.some((e) => /incompatible/.test(e)));
  });

  it("applyUpgrade empile le même champ que le grimoire", () => {
    const { spell } = composeSpell({ animId: "attack2", effectId: "entaille" });
    const res = applyUpgrade(spell, "allonge");
    assert.equal(res.ok, true);
    assert.equal(spell.bakedEvo.range, 1);
    const st = effectiveStats(spell);
    assert.equal(st.range, spell.range + 1);
  });
});

describe("validation et équilibrage", () => {
  it("écarte un sort aux dégâts absurdes", () => {
    const broken = {
      id: "gen_broken",
      name: "Cassé",
      school: "Cinétique",
      cost: 1,
      range: 1,
      type: "damage",
      dmg: [80, 120],
      anim: "attack",
      fx: "entaille",
      bakedEvo: {},
      generated: true,
    };
    const check = validateSpell(broken);
    assert.equal(check.ok, false);
    const fixed = balanceSpell(broken);
    assert.equal(validateSpell(fixed).ok, true);
    assert.ok(effectiveStats(fixed).perCost <= 7.2);
  });

  it("le catalogue généré ne contient que des sorts valides", () => {
    const { spells, discarded } = generateCatalog({ seed: 3, maxUpgrades: 1 });
    assert.ok(spells.length >= 20);
    for (const s of spells) assert.equal(validateSpell(s).ok, true, s.id);
    const audited = auditAndFix(spells, { fights: 2, seed: 1 });
    for (const s of audited.spells) assert.equal(validateSpell(s).ok, true, s.id);
    assert.ok(Array.isArray(discarded));
  });
});

describe("combats simulés et entraînement", () => {
  it("un duel se termine avec un vainqueur", () => {
    const a = composeSpell({ animId: "attack", effectId: "entaille" }).spell;
    const b = composeSpell({ animId: "strafeR", effectId: "arc" }).spell;
    const r = simulateFight([a], [b], mulberry32(5));
    assert.equal(r.invalid, false);
    assert.ok(["A", "B", "draw"].includes(r.winner));
    assert.ok(r.rounds >= 1);
    assert.ok(r.castsA + r.castsB > 0);
  });

  it("l'auto-affrontement améliore ou stabilise une politique", () => {
    const { spells } = generateCatalog({ seed: 9, maxUpgrades: 0 });
    const trained = trainPolicies({ catalog: spells, generations: 2, population: 4, fights: 2, seed: 4 });
    assert.ok(trained.best);
    assert.equal(trained.history.length, 2);
    assert.ok(trained.history[1].bestFitness >= trained.history[0].meanFitness * 0.5);
    assert.ok(trained.best.damage > 0);
  });
});

describe("intégration dans le jeu", () => {
  const html = readFileSync(join(root, "neuro-core.html"), "utf8");

  it("n'expose que les trois modes sur le hub", () => {
    assert.match(html, /id:"combat"/);
    assert.match(html, /id:"chargen"/);
    assert.match(html, /id:"spells"/);
    assert.match(html, /id:"random"/);
    assert.match(html, /mode === "aleatoire"/);
    assert.match(html, /hash === "combat"/);
    assert.match(html, /ÉDITEUR DE SORTS/);
    assert.doesNotMatch(html, /name:"BUREAU LOCAL"/);
    assert.doesNotMatch(html, /name:"NEURONET"/);
    assert.doesNotMatch(html, /name:"INGÉNIEURS"/);
  });

  it("charge le catalogue et l'animation du sort", () => {
    assert.match(html, /installGeneratedSpells/);
    assert.match(html, /GENERATED_SPELLS/);
    assert.match(html, /spellCastAnim/);
    assert.match(html, /bakedEvo/);
    assert.match(html, /id="spellEditorOverlay"/);
  });
});
