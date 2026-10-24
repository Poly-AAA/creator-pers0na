import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

function html(name) {
  return readFileSync(name, "utf8");
}

describe("trois écrans", () => {
  it("l’accueil pointe vers le créateur, le combat et l’éditeur", () => {
    const index = html("index.html");
    assert.match(index, /character-creator-fantasy\.html/);
    assert.match(index, /fantasy-combat\.html/);
    assert.match(index, /spell-editor\.html/);
    assert.doesNotMatch(index, /neuro-core/);
  });

  it("le combat, l’éditeur et le créateur se renvoient l’un vers l’autre", () => {
    const combat = html("fantasy-combat.html");
    const editor = html("spell-editor.html");
    const creator = html("character-creator-fantasy.html");
    assert.match(combat, /spell-editor\.html/);
    assert.match(combat, /character-creator-fantasy\.html/);
    assert.match(editor, /fantasy-combat\.html/);
    assert.match(editor, /character-creator-fantasy\.html/);
    assert.match(creator, /fantasy-combat\.html/);
    assert.match(creator, /spell-editor\.html/);
    assert.match(combat, /user-spells\.json/);
    assert.doesNotMatch(combat, /generated-spells\.json/);
    assert.match(combat, /ai-policy\.json/);
    assert.match(editor, /btnGrimoire/);
    assert.doesNotMatch(combat, /fantasy-weapon-anim\.html/);
    assert.doesNotMatch(combat, /fantasy-dir-calibrate\.html/);
  });

  it("neuro-core et les autres écrans ne sont plus là", () => {
    for (const name of [
      "neuro-core.html",
      "neuro-core-sprite.html",
      "moteur-graphique.html",
      "hat-place.html",
      "axe-place.html",
      "fantasy-weapon-anim.html",
      "fantasy-dir-calibrate.html",
      "fantasy-cc-layout-editor.html",
      "layout-gameboy-editor.html",
      "arena-anim-test.html",
    ]) {
      assert.equal(existsSync(name), false, name);
    }
  });
});
