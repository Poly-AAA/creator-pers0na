import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodePNG } from "../js/sprite-png.js";
import {
  ANIMS, COLS, ROWS, applyVariant, sliceFrame, frameDrift, EYE, HAIR,
} from "../js/sheet-variant.js";

function sheet(folder, anim) {
  return decodePNG(readFileSync("assets/packs/fantasy-cc/spritesheets/" + folder + "/" + anim + ".png"));
}

function count(px, rgb) {
  let n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] === rgb[0] && px[i + 1] === rgb[1] && px[i + 2] === rgb[2]) n++;
  }
  return n;
}

describe("variante sur les sprites d'origine", () => {
  it("couvre chaque animation, sans décaler les pieds", () => {
    assert.equal(ANIMS.length, 30);
    for (const anim of ["Idle", "Walk", "Attack1", "Kick", "Rolling", "Special1", "Die"]) {
      const body = sheet("NakedBody", anim);
      const head = sheet("Head1", anim);
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const b = sliceFrame(body.rgba, body.w, col, row);
          const h = sliceFrame(head.rgba, head.w, col, row);
          const v = applyVariant(b, h);
          const drift = frameDrift(b, h, v);
          assert.deepEqual(drift, [], anim + " " + row + " " + col + " " + drift[0]);
        }
      }
    }
  });

  it("montre une frange, un visage et une peau différente au repos", () => {
    const body = sheet("NakedBody", "Idle");
    const head = sheet("Head1", "Idle");
    const b = sliceFrame(body.rgba, body.w, 0, 2);
    const v = applyVariant(b, sliceFrame(head.rgba, head.w, 0, 2));
    assert.ok(count(v, EYE) >= 1);
    assert.ok(count(v, HAIR) >= 8);
    let changed = 0;
    for (let i = 0; i < b.length; i += 4) {
      if (b[i + 3] > 40 && (b[i] !== v[i] || b[i + 1] !== v[i + 1])) changed++;
    }
    assert.ok(changed > 40);
  });

  it("laisse le grimoire des trois sorts tel quel", () => {
    const user = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
    assert.deepEqual(user.map((s) => s.id), ["punch", "coup_de_pied", "roulade"]);
  });
});
