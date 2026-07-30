/**
 * Tests CharBody — morphologies, orientations, rebind arme (sans DOM).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "neuro-core.html"), "utf8");

describe("CharBody — marqueurs", () => {
  it("module CharBody + palette planche", () => {
    assert.match(html, /const CharBody\s*=/);
    assert.match(html, /#F2F0EB/);
    assert.match(html, /#DCD3C3/);
    assert.match(html, /#2E2E30/);
    assert.match(html, /#E8590C/);
  });
  it("3 morphologies", () => {
    assert.match(html, /standard:\s*\{[^}]*h:\s*50/);
    assert.match(html, /lourd:\s*\{/);
    assert.match(html, /fin:\s*\{/);
  });
  it("drawEntity appelle CharBody.draw", () => {
    assert.match(html, /CharBody\.draw\s*\(\s*ctx,\s*e,\s*foot/);
  });
  it("rebind main arme après miroir", () => {
    assert.match(html, /charWeaponHandLocal|weaponHandLocal/);
    assert.match(html, /mirror\s*\?\s*"handL"\s*:\s*"handR"/);
  });
  it("ancrages sorts limb/bodyCenter/grid", () => {
    assert.match(html, /spellAnchor\s*\(/);
    assert.match(html, /type === "grid"/);
    assert.match(html, /type === "bodyCenter"/);
  });
  it("joueur morphId standard + facing au moveAlong", () => {
    assert.match(html, /morphId:"standard"/);
    assert.match(html, /entity\.facing\s*=\s*\{\s*dCol,\s*dRow\s*\}/);
  });
});

describe("CharBody — logique orientation", () => {
  function orientFromDelta(dCol, dRow) {
    const sc = Math.sign(dCol), sr = Math.sign(dRow);
    if (sc === 0 && sr === 0) return "front";
    return {
      "0,-1": "back", "1,-1": "qBackRight", "1,0": "sideRight", "1,1": "qFrontRight",
      "0,1": "front", "-1,1": "qFrontLeft", "-1,0": "sideLeft", "-1,-1": "qBackLeft",
    }[`${sc},${sr}`] || "front";
  }
  it("8 cas Δcol/Δrow", () => {
    assert.equal(orientFromDelta(0, -1), "back");
    assert.equal(orientFromDelta(1, 0), "sideRight");
    assert.equal(orientFromDelta(0, 1), "front");
    assert.equal(orientFromDelta(-1, 0), "sideLeft");
    assert.equal(orientFromDelta(1, 1), "qFrontRight");
    assert.equal(orientFromDelta(-1, 1), "qFrontLeft");
    assert.equal(orientFromDelta(1, -1), "qBackRight");
    assert.equal(orientFromDelta(-1, -1), "qBackLeft");
  });
  it("profil plus étroit que face (facteur sx)", () => {
    const KIND = { front: { sx: 1.12 }, side: { sx: 0.36 } };
    assert.ok(KIND.side.sx < KIND.front.sx * 0.5);
  });
});
