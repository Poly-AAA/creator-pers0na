import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import test from "node:test";

function loadCombo() {
  const context = createContext({ window: {}, Math, Number, Object, String, Array });
  runInContext(readFileSync("js/combo-blocks.js", "utf8"), context);
  return context.window.Combo;
}

test("chaque chaîne atteignable du poing se pose sans saut de pose", () => {
  const Combo = loadCombo();
  const spells = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
  const punch = spells.find((s) => s.id === "punch");
  assert.equal(punch.evoConfig["1:Brise-Os"].anim, "Attack2");
  assert.equal(punch.evoConfig["1:Brise-Os"].fps, 12);
  assert.equal(punch.evoConfig["1:Boxeur"].anim, "Attack6");
  assert.equal(punch.evoConfig["1:Rapide"].enabled, false);
  assert.equal(punch.evoConfig["2:Double Impact"].slash, "Slash2");
  assert.equal(punch.steps[0].anim, "Attack1");

  const chains = Combo.reachable(punch);
  assert.equal(chains.length, 1 + 3 + 9 + 27);
  chains.forEach((picks) => {
    const chain = Combo.resolveCombo(punch, picks);
    const issues = Combo.chainIssues(chain.steps);
    assert.equal(issues.length, 0, picks.map((p) => p.name).join(" · ") + " " + issues.join(","));
    assert.equal(chain.steps[0].poseIn, "garde");
    assert.equal(chain.steps[chain.steps.length - 1].poseOut, "garde");
  });

  const broken = Combo.chainIssues([
    { id: "a", poseIn: "garde", poseOut: "air" },
    { id: "b", poseIn: "garde", poseOut: "garde" },
  ]);
  assert.ok(broken.length >= 1);

  const double = Combo.resolveCombo(punch, [{ tier: 1, name: "Boxeur" }]);
  assert.equal(double.steps.map((s) => s.id).join(), "jabL,jabR");

  const push = Combo.resolveCombo(punch, [{ tier: 1, name: "Boxeur" }, { tier: 2, name: "Percutant" }]);
  assert.equal(push.steps.map((s) => s.id).join(), "jabL,jabR,bigKick");
  assert.equal(push.push, 1);
  assert.ok(push.effects.includes("knockback"));

  const boom = Combo.resolveCombo(punch, [{ tier: 1, name: "Boxeur" }, { tier: 3, name: "Brasier" }]);
  assert.equal(boom.steps[boom.steps.length - 1].id, "explosion");
  assert.equal(boom.element, "feu");
  assert.equal(boom.overlay.where, "hands");

  const upper = Combo.resolveCombo(punch, [
    { tier: 1, name: "Boxeur" },
    { tier: 2, name: "Uppercut" },
    { tier: 3, name: "Montante" },
  ]);
  assert.equal(upper.steps[upper.steps.length - 1].id, "uppercut");
  assert.equal(upper.element, "feu");
  assert.equal(upper.steps.some((s) => s.id === "explosion"), false);

  const heavy = Combo.resolveCombo(punch, [{ tier: 1, name: "Brise-Os" }]);
  assert.equal(heavy.steps.map((s) => s.id).join(), "jabR");
  assert.equal(heavy.steps[0].fps, 12);

  const ice = Combo.OVERLAYS.ice;
  assert.equal(ice.element, "eau");
  assert.equal(Combo.EFFECTS.dot.turns, 3);
  assert.ok(Combo.BLOCKS.dashIn && Combo.BLOCKS.leapIn && Combo.BLOCKS.knee && Combo.BLOCKS.projectile);
});
