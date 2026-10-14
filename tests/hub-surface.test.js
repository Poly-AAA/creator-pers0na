import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("arène", () => {
  it("l’accueil charge le hub et garde les ateliers", () => {
    const index = readFileSync("index.html", "utf8");
    const hub = readFileSync("js/hub.js", "utf8");
    const css = readFileSync("css/skin-d.css", "utf8");
    assert.match(index, /character-creator-fantasy\.html/);
    assert.match(index, /fantasy-combat\.html/);
    assert.match(index, /spell-editor\.html/);
    assert.match(index, /js\/hub\.js/);
    assert.match(hub, /Combattre/);
    assert.match(hub, /Forgemagie/);
    assert.match(hub, /roguelite\.fight/);
    assert.match(css, /#FAF7F0|#faf7f0/i);
    assert.match(css, /#EA7020|#ea7020/i);
    assert.equal(/sephiroth|kether|malkuth|lilith/i.test(index + hub + css), false);
  });

  it("le combat portrait garde la croix, la fuite et le pincement", () => {
    const combat = readFileSync("fantasy-combat.html", "utf8");
    assert.match(combat, /id="dpad"/);
    assert.match(combat, /id="btnEnd"/);
    assert.match(combat, /id="btnFlee"/);
    assert.match(combat, /Fin de tour/);
    assert.match(combat, /rlFinish/);
    assert.match(combat, /pinch/);
    assert.match(combat, /skin-d\.css/);
    assert.match(combat, /squelette/);
    assert.match(combat, /spectre/);
  });
});
