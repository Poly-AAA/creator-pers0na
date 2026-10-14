import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

import {
  ALL_ANIMS,
  combineAnimations,
  applyUpgrades,
  generateCatalog,
  validateSpell,
  balanceCatalog,
  simulateDuel,
  trainPolicy,
  damagePerCost,
  EVO_TREES,
} from "../js/spell-lab.js";

describe("format de sort", () => {
  it("chaîne des animations connues du jeu", () => {
    const steps = combineAnimations(["Attack1", "Kick", "Special1"], { slash: "Slash1", effect: "Effect2", fps: 16 });
    assert.equal(steps.length, 3);
    steps.forEach((st) => {
      assert.ok(ALL_ANIMS.includes(st.anim));
      assert.equal(typeof st.fps, "number");
      assert.ok(st.fps >= 1 && st.fps <= 30);
    });
    assert.equal(steps[0].slash, "Slash1");
    assert.equal(steps[2].hitTarget, true);
  });

  it("applique une évolution du catalogue et coche son anim", () => {
    const spell = {
      id: "gen_test",
      name: "Test",
      cost: 3,
      range: 1,
      dmg: [8, 10],
      type: "damage",
      effect: "",
      evoArchetype: "punch",
      steps: combineAnimations(["Attack1"]),
    };
    applyUpgrades(spell, [
      { tier: 1, name: "Brise-Os" },
      { tier: 2, name: "Double Impact" },
    ]);
    assert.deepEqual(spell.dmg, [12, 14]);
    assert.equal(spell.evoConfig["1:Brise-Os"].enabled, true);
    assert.equal(spell.evoConfig["1:Brise-Os"].anim, "Attack2");
    assert.equal(spell.evoConfig["2:Double Impact"].enabled, true);
    assert.equal(spell.evoConfig["1:Boxeur"].enabled, false);
    assert.ok(EVO_TREES.punch);
  });
});

describe("générateur", () => {
  it("produit un catalogue valide et rejouable", () => {
    const a = generateCatalog({ seed: 7, count: 36 });
    const b = generateCatalog({ seed: 7, count: 36 });
    assert.equal(a.length, 36);
    assert.equal(a[0].id, b[0].id);
    assert.equal(a[0].name, b[0].name);
    a.forEach((spell) => {
      const res = validateSpell(spell);
      assert.equal(res.ok, true, res.errors.join(", "));
      assert.ok(spell.steps.length >= 1);
      assert.ok(spell.evoConfig && Object.keys(spell.evoConfig).length >= 3);
      assert.ok(spell.upgrades.length >= 1);
    });
    const equipped = a.filter((s) => s.equipped);
    assert.ok(equipped.length >= 3);
  });
});

describe("équilibrage", () => {
  it("écarte un sort de dégâts illisible et garde les sorts sains", () => {
    const broken = { id: "bad", name: "Cassé", type: "damage", cost: 2, range: 1, dmg: [0, 0], steps: [{ anim: "PasUneAnim" }] };
    const healthy = generateCatalog({ seed: 3, count: 8 });
    const result = balanceCatalog([broken, ...healthy], { fights: 4 });
    assert.ok(result.discarded.some((d) => d.id === "bad"));
    assert.ok(result.spells.length >= 8);
    result.spells.filter((s) => s.type === "damage").forEach((s) => {
      const dpc = damagePerCost(s);
      assert.ok(dpc >= 1.5 && dpc <= 12, s.id + " " + dpc);
    });
  });

  it("termine un duel", () => {
    const spells = generateCatalog({ seed: 9, count: 4 });
    const duel = simulateDuel(spells.slice(0, 2), spells.slice(2), { seed: 1 });
    assert.ok(["a", "b", "draw"].includes(duel.winner));
    assert.equal(typeof duel.a.dealt, "number");
  });
});

describe("entraînement", () => {
  it("améliore la politique contre celle de départ", () => {
    const spells = generateCatalog({ seed: 11, count: 24 });
    const trained = trainPolicy(spells, { generations: 4, games: 1, seed: 5 });
    assert.ok(trained.loadouts.length >= 4);
    assert.ok(trained.trainedGames > 0);
    assert.equal(trained.improved, true);
    assert.ok(trained.trainedWinRate > 0.52);
  });
});

describe("fichiers du jeu", () => {
  it("le grimoire versionné est un tableau de sorts valides", () => {
    assert.equal(existsSync("data/generated-spells.json"), true);
    const spells = JSON.parse(readFileSync("data/generated-spells.json", "utf8"));
    assert.ok(spells.length >= 24);
    spells.forEach((s) => {
      const res = validateSpell(s);
      assert.equal(res.ok, true, (s && s.id) + " " + res.errors.join(", "));
    });
  });

  it("la politique d’IA est présente", () => {
    const policy = JSON.parse(readFileSync("data/ai-policy.json", "utf8"));
    assert.ok(policy.weights && typeof policy.weights === "object");
    assert.ok(Array.isArray(policy.loadouts) && policy.loadouts.length >= 4);
    assert.ok(policy.trainedWinRate > 0.52);
  });
});
