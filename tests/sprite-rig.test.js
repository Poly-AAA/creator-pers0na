import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isHandmadeSpell, prepareCatalog } from "../js/roguelite.js";
import { renderActor, hashFrame } from "../js/sprite-draw.js";
import { RIG_SPELLS, resolveChain } from "../js/sprite-spells.js";
import { DIRS, ANCHOR } from "../js/sprite-rig.js";

describe("rig de sprites", () => {
  it("laisse le grimoire écrit intact et hors du kit", () => {
    const user = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
    assert.deepEqual(user.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
    assert.equal(user[0].evoConfig["1:Brise-Os"].anim, "Attack2");
    assert.equal(user[0].evoConfig["1:Rapide"].enabled, false);
    assert.equal(user[0].steps[0].fps, 17);
    const file = JSON.parse(readFileSync("data/rig-spells.json", "utf8"));
    assert.deepEqual(file.map((s) => s.id), RIG_SPELLS.map((s) => s.id));
    const kit = prepareCatalog(user.concat(RIG_SPELLS));
    assert.deepEqual(kit.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
    assert.equal(isHandmadeSpell(RIG_SPELLS[3]), false);
  });

  it("ajoute un pas de poing par évolution, avec une main et un seul élément", () => {
    const spell = RIG_SPELLS.find((s) => s.id === "poing_rig");
    const chain = resolveChain(spell, [
      { tier: 1, name: "Direct" },
      { tier: 2, name: "Repousse" },
      { tier: 3, name: "Foudre" },
    ]);
    assert.deepEqual(chain.steps.map((s) => s.rig), ["jabL", "crossR", "pushR", "jabR"]);
    assert.deepEqual(chain.steps.map((s) => s.hand), ["L", "R", "R", "R"]);
    assert.equal(chain.element, "lightning");
    assert.ok(chain.steps.every((s) => s.delay === 0 && s.fps >= 12 && s.fps <= 17));
    for (const dir of DIRS) {
      const end = renderActor({ species: "male", dir, anim: "leap", frame: 7, hair: "short" });
      const d = Math.hypot(end.joints.feet.x - ANCHOR, end.joints.feet.y - ANCHOR);
      assert.ok(d < 1.25, dir + " " + d);
    }
  });

  it("reproduit les images de référence du rig", () => {
    const baseline = JSON.parse(readFileSync("docs/previews/sprites/baseline.json", "utf8"));
    const samples = {
      "male-se": { species: "male", dir: "SE", anim: "idle", frame: 0, hair: "short" },
      "female-front": { species: "female", dir: "front", anim: "idle", frame: 1, hair: "tied", face: "soft" },
      "sword": { species: "male", dir: "SE", anim: "sword", frame: 3, weapon: "sword" },
    };
    for (const [id, spec] of Object.entries(samples)) {
      assert.equal(hashFrame(renderActor(spec).rgba), baseline.hashes[id], id);
    }
  });
});
