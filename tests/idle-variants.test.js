import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodePNG } from "../js/sprite-png.js";
import { ROWS, sliceFrame } from "../js/sheet-variant.js";
import { IDLE_VARIANTS, IDLE_FRAMES, idleIssues } from "../js/idle-variants.js";

describe("poses d'attente", () => {
  it("boucle 11 images, pieds fixes, main et lueur", () => {
    const body = decodePNG(readFileSync("assets/packs/fantasy-cc/spritesheets/NakedBody/Idle.png"));
    const head = decodePNG(readFileSync("assets/packs/fantasy-cc/spritesheets/Head1/Idle.png"));
    assert.equal(IDLE_FRAMES, 11);
    assert.deepEqual(IDLE_VARIANTS, ["Lecture", "Sac", "Bijou"]);
    for (const kind of IDLE_VARIANTS) {
      for (let row = 0; row < ROWS; row++) {
        const issues = idleIssues(
          kind,
          sliceFrame(body.rgba, body.w, 0, row),
          sliceFrame(head.rgba, head.w, 0, row),
        );
        assert.deepEqual(issues, [], kind + " " + row + " " + issues[0]);
      }
    }
  });

  it("laisse le grimoire des trois sorts tel quel", () => {
    const user = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
    assert.deepEqual(user.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
  });
});
