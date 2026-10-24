import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const context = { Math: Math, String: String };
createContext(context);
runInContext(readFileSync(new URL("../js/cast-feel.js", import.meta.url), "utf8"), context);
const F = context.CastFeel;

describe("rythme des sorts", () => {
  it("sépare anticipation, impact et retour", () => {
    assert.ok(F.ANTICIPATE >= 0.2 && F.ANTICIPATE <= 0.3);
    assert.ok(F.IMPACT >= 0.05 && F.IMPACT <= 0.1);
    assert.ok(F.RECOVER >= 0.3 && F.RECOVER <= 0.5);
    assert.equal(F.LINGER, 0.5);
    const early = F.castColumn(0.05, 15);
    const impact = F.castColumn(F.ANTICIPATE + 0.01, 15);
    const back = F.castColumn(F.ANTICIPATE + F.IMPACT + 0.05, 15);
    const idle = F.castColumn(F.BODY, 15);
    assert.equal(early.phase, "anticipate");
    assert.equal(early.smear, false);
    assert.equal(impact.phase, "impact");
    assert.equal(impact.smear, true);
    assert.equal(impact.col, 6);
    assert.ok(impact.col > early.col + 1);
    assert.equal(back.phase, "recover");
    assert.equal(back.smear, false);
    assert.equal(idle.phase, "idle");
    assert.equal(idle.idle, true);
  });

  it("classe dash, bond, invocation et frappe", () => {
    assert.equal(F.motionKind({ effect: "roulade", anim: "Rolling" }), "dash");
    assert.equal(F.motionKind({ anim: "AttackRun" }), "leap");
    assert.equal(F.motionKind({ effect: "glyph", type: "damage" }), "summon");
    assert.equal(F.motionKind({ effect: "summon", type: "summon" }), "summon");
    assert.equal(F.motionKind({ anim: "Attack1", effect: "" }), "strike");
    assert.equal(F.motionKind({ effect: "push", anim: "Kick" }), "strike");
  });

  it("fait glisser un recul tout droit et un dash lent puis vite", () => {
    assert.equal(F.travel("knock", 0.5), 0.5);
    const a = F.travel("dash", 0.1);
    const b = F.travel("dash", 0.4);
    assert.ok(b > a * 4);
    assert.ok(F.leapLift(0.5) > F.leapLift(0.1));
    assert.ok(F.landSquash(0.94).y < 1);
    assert.ok(F.landSquash(0.2).y === 1);
  });

  it("affiche les chiffres en rouge, bleu et vert, dispersés", () => {
    assert.deepEqual(Array.from(F.NUM.damage), [210, 48, 42]);
    assert.deepEqual(Array.from(F.NUM.shield), [58, 120, 210]);
    assert.deepEqual(Array.from(F.NUM.heal), [46, 154, 85]);
    const born = F.numberMotion(0.02, 0);
    const held = F.numberMotion(0.2, 0);
    const gone = F.numberMotion(0.8, 0);
    assert.ok(born.scale < held.scale);
    assert.equal(held.alive, true);
    assert.equal(gone.alive, false);
    const multi = F.numberMotion(0.2, 2);
    assert.ok(Math.abs(multi.x) > 4);
    assert.notDeepEqual(F.elementColor("feu"), F.elementColor("eau"));
  });

  it("garde le corps entre 1,5 et 2 tuiles", () => {
    const scale = F.tileScale(28, 40);
    const tiles = (40 * scale) / 28;
    assert.ok(tiles >= 1.5 && tiles <= 2);
  });

  it("laisse le grimoire des trois sorts tel quel", () => {
    const user = JSON.parse(readFileSync(new URL("../data/user-spells.json", import.meta.url), "utf8"));
    assert.deepEqual(user.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
    assert.equal(user[0].evoConfig["1:Brise-Os"].anim, "Attack2");
    assert.equal(user[0].evoConfig["1:Brise-Os"].fps, 12);
    assert.equal(user[0].steps[0].anim, "Attack1");
  });
});
