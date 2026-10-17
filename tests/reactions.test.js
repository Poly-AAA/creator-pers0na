import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import test from "node:test";

function loadAll() {
  const sandbox = { window: {}, Math, Number, Object, String, Array };
  const context = createContext(sandbox);
  runInContext(readFileSync("js/reactions.js", "utf8"), context);
  runInContext(readFileSync("js/combo-blocks.js", "utf8"), context);
  runInContext(readFileSync("js/cast-feel.js", "utf8"), context);
  sandbox.window.CastFeel = sandbox.CastFeel;
  return sandbox.window;
}

test("réactions calées sur l'impact et retour à l'attente", () => {
  const win = loadAll();
  const Reactions = win.Reactions;
  const Combo = win.Combo;
  assert.equal(Reactions.IMPACT_MS, win.CastFeel.IMPACT_AT_MS);

  Object.keys(Reactions.REACTIONS).forEach((id) => {
    const spec = Reactions.compose(id);
    assert.equal(Reactions.issues(spec).length, 0, id + " " + Reactions.issues(spec).join(","));
    const end = Reactions.sample(spec, spec.returnMs / 1000, 0);
    if (spec.poseOut === "garde") {
      assert.equal(end.x, 0, id + " x");
      assert.equal(end.y, 0, id + " y");
    }
  });
  const ko = Reactions.compose("ko");
  const down = Reactions.sample(ko, ko.returnMs / 1000, 0);
  assert.notEqual(down.y, 0);
  assert.equal(ko.hold, true);

  const cases = Reactions.facingCases();
  assert.equal(cases.length, 8);
  Reactions.ISO.forEach((iso) => {
    const front = Reactions.sheetDir("front", iso.dir);
    const back = Reactions.sheetDir("back", iso.dir);
    assert.notEqual(front, back, iso.id);
    assert.ok(front >= 0 && front < 8 && back >= 0 && back < 8);
  });

  assert.equal(Reactions.auditBlocks(Combo.BLOCKS).length, 0);
  assert.equal(Combo.BLOCKS.jabL.reaction, "flinch");
  assert.equal(Combo.BLOCKS.hook.reaction, "stagger");
  assert.equal(Combo.BLOCKS.uppercut.reaction, "launch");
  assert.equal(Combo.BLOCKS.bigKick.reaction, "knockback");
  assert.equal(Combo.BLOCKS.explosion.reaction, "blast");

  const spells = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
  const punch = JSON.parse(JSON.stringify(spells.find((s) => s.id === "punch")));
  Combo.stamp(punch);
  Object.keys(punch.evoConfig).forEach((key) => {
    assert.ok(punch.evoConfig[key].reaction, key);
  });
  assert.equal(punch.evoConfig["1:Brise-Os"].anim, "Attack2");
  assert.equal(punch.evoConfig["1:Brise-Os"].fps, 12);

  Combo.reachable(punch).forEach((picks) => {
    const chain = Combo.resolveCombo(punch, picks);
    chain.steps.forEach((step, index) => {
      if (!step.reaction) return;
      const spec = Reactions.compose(step.reaction, { elementFx: step.elementFx });
      assert.equal(Reactions.issues(spec).length, 0, picks.map((p) => p.name).join(">") + " " + step.id);
      assert.equal(spec.impactMs, Reactions.IMPACT_MS);
      assert.ok(spec.returnMs <= Reactions.BODY_MS);
      if (index > 0) assert.equal(chain.steps[index - 1].poseOut, step.poseIn);
    });
  });

  const heavy = Combo.resolveCombo(punch, [{ tier: 1, name: "Brise-Os" }]);
  assert.equal(heavy.steps[0].reaction, "stagger");
  const boom = Combo.resolveCombo(punch, [{ tier: 1, name: "Boxeur" }, { tier: 3, name: "Brasier" }]);
  assert.equal(boom.steps[boom.steps.length - 1].reaction, "blast");
  assert.equal(boom.steps[boom.steps.length - 1].elementFx, "burn");
  const upper = Combo.resolveCombo(punch, [{ tier: 2, name: "Uppercut" }, { tier: 3, name: "Montante" }]);
  assert.equal(upper.steps[upper.steps.length - 1].reaction, "launch");
  assert.equal(upper.steps[upper.steps.length - 1].elementFx, "burn");
  const bolts = Combo.resolveCombo(punch, [{ tier: 3, name: "Éclairs" }]);
  assert.equal(bolts.turns, 3);
  assert.equal(bolts.steps[0].elementFx, "shock");
  const multi = Combo.resolveCombo(punch, [{ tier: 2, name: "Double Impact" }]);
  assert.equal(multi.hits, 2);
  assert.equal(multi.steps[multi.steps.length - 1].reaction, "multi");

  const burned = Reactions.compose("flinch", { elementFx: "burn" });
  assert.equal(burned.flames, true);
  const ice = Reactions.sample(Reactions.compose("frozen"), 0.1, 0);
  assert.equal(ice.tint, "eau");
  assert.equal(ice.slowed, true);
  const spark = Reactions.compose("shock");
  assert.equal(spark.sparks, true);

  assert.equal(Reactions.forSpell({ type: "heal", heal: [4, 8] }), "heal");
  assert.equal(Reactions.forSpell({ type: "shield", id: "bouclier" }), "shield");
  assert.equal(Reactions.forSpell({ type: "buff" }), "buff");
  assert.equal(Reactions.forSpell({ effect: "push", type: "damage", dmg: [4, 8] }), "knockback");
  assert.equal(Reactions.forSpell({ id: "roulade", effect: "roulade" }), "");
  assert.equal(Reactions.get("heal").number, "heal");
  assert.equal(Reactions.get("shield").number, "shield");
  assert.equal(Reactions.get("buff").glow, "neutre");

  Reactions.GEAR.forEach((folder) => {
    ["Idle", "TakeDamage", "Die"].forEach((anim) => {
      const path = "assets/packs/fantasy-cc/spritesheets/" + folder + "/" + anim + ".png";
      assert.equal(existsSync(path), true, path);
    });
  });
});
