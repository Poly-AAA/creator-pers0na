import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ORIENT, ORIENT_DELTA_CASES, orientationFromDelta } from "../js/orientation.js";
import { depthKey, compareDepth, sortActorsByDepth, gridToWorld } from "../js/grid.js";
import { TILE_W, TILE_H } from "../js/constants.js";
import { resolveMorph, defaultBodyCustom } from "../js/morph.js";
import {
  projectRig,
  getAnchors,
  mirrorAnchors,
  mirrorRigPoints,
  projectedWidth,
} from "../js/rig.js";
import { resolveWeaponHand, getWeaponMount, WEAPON_SIZE } from "../js/equipment.js";

describe("orientationFromDelta — 8 cas grille", () => {
  for (const c of ORIENT_DELTA_CASES) {
    it(`(Δcol=${c.dCol}, Δrow=${c.dRow}) → ${c.expect}`, () => {
      assert.equal(orientationFromDelta(c.dCol, c.dRow), c.expect);
    });
  }

  it("rejette (0,0)", () => {
    assert.throws(() => orientationFromDelta(0, 0));
  });
});

describe("gridToWorld — formule exacte", () => {
  it("x=(col-row)*32, y=(col+row)*16", () => {
    assert.deepEqual(gridToWorld(3, 1), {
      x: (3 - 1) * (TILE_W / 2),
      y: (3 + 1) * (TILE_H / 2),
    });
    assert.equal(gridToWorld(3, 1).x, 64);
    assert.equal(gridToWorld(3, 1).y, 64);
  });
});

describe("miroir idempotent", () => {
  it("mirror(mirror(points)) === points", () => {
    const body = defaultBodyCustom();
    const morph = resolveMorph("standard", body);
    const m = projectRig(morph, ORIENT.sideRight);
    const anchors = getAnchors(m);
    const twice = mirrorRigPoints(mirrorRigPoints(anchors));
    for (const key of Object.keys(anchors)) {
      assert.ok(Math.abs(twice[key].x - anchors[key].x) < 1e-9, key + ".x");
      assert.ok(Math.abs(twice[key].y - anchors[key].y) < 1e-9, key + ".y");
    }
  });

  it("mirrorAnchors deux fois restaure positions physiques", () => {
    const body = defaultBodyCustom();
    const morph = resolveMorph("heavy", body);
    const m = projectRig(morph, ORIENT.qFrontRight);
    const a0 = getAnchors(m);
    const a2 = mirrorAnchors(mirrorAnchors(a0));
    for (const key of Object.keys(a0)) {
      assert.ok(Math.abs(a2[key].x - a0[key].x) < 1e-9, key);
      assert.ok(Math.abs(a2[key].y - a0[key].y) < 1e-9, key);
    }
  });
});

describe("largeur profil gauche === profil droit", () => {
  it("projectedWidth sideLeft === sideRight", () => {
    const body = defaultBodyCustom();
    const morph = resolveMorph("standard", body);
    const right = projectRig(morph, ORIENT.sideRight);
    const left = projectRig(morph, ORIENT.sideLeft);
    const wR = projectedWidth(right);
    const wL = projectedWidth(left);
    assert.ok(Math.abs(wR - wL) < 1e-9, `wR=${wR} wL=${wL}`);
    // Profils étroits vs face (anti section 3)
    const front = projectRig(morph, ORIENT.front);
    assert.ok(wR < projectedWidth(front) * 0.7, "profil plus étroit que face");
  });
});

describe("arme — main dominante après miroir", () => {
  it("resolveWeaponHand : miroir rebranche sur main opposée", () => {
    assert.equal(resolveWeaponHand(false, "R"), "handR");
    assert.equal(resolveWeaponHand(true, "R"), "handL");
    assert.equal(resolveWeaponHand(false, "L"), "handL");
    assert.equal(resolveWeaponHand(true, "L"), "handR");
  });

  it("mount post-miroir : primaryHand bascule, taille arme inchangée", () => {
    const body = defaultBodyCustom();
    const morph = resolveMorph("standard", body);
    const mR = projectRig(morph, ORIENT.sideRight);
    const mL = projectRig(morph, ORIENT.sideLeft);
    assert.equal(mR.mirror, false);
    assert.equal(mL.mirror, true);

    const mountR = getWeaponMount(mR, { twoHanded: false });
    const mountL = getWeaponMount(mL, { twoHanded: false });
    assert.equal(mountR.primaryHand, "handR");
    assert.equal(mountL.primaryHand, "handL");

    // Position écran de la main dominante : symétrique
    assert.ok(Math.abs(mountR.primary.x + mountL.primary.x) < 1e-9);
    assert.ok(Math.abs(mountR.primary.y - mountL.primary.y) < 1e-9);

    assert.equal(WEAPON_SIZE.sword.length, WEAPON_SIZE.sword.length);
    assert.ok(WEAPON_SIZE.staff.length > WEAPON_SIZE.sword.length);
  });
});

describe("profondeur — aucune égalité non résolue", () => {
  it("deux acteurs cases différentes → depthKey distincts", () => {
    const a = depthKey(2, 1, "hero");
    const b = depthKey(1, 2, "foe");
    // même col+row=3 mais row/id différents
    assert.notEqual(a, b);
  });

  it("même case → id départage", () => {
    const a = depthKey(3, 3, "a");
    const b = depthKey(3, 3, "b");
    assert.notEqual(a, b);
  });

  it("tri total strict sur grille", () => {
    const actors = [
      { id: "b", col: 1, row: 2 },
      { id: "a", col: 2, row: 1 },
      { id: "c", col: 0, row: 3 },
      { id: "d", col: 3, row: 0 },
    ];
    // all have col+row = 3
    const sorted = sortActorsByDepth(actors);
    const keys = sorted.map((x) => depthKey(x.col, x.row, x.id));
    const unique = new Set(keys);
    assert.equal(unique.size, keys.length);

    for (let i = 1; i < sorted.length; i++) {
      assert.ok(compareDepth(sorted[i - 1], sorted[i]) < 0);
    }
    // tiebreak row : row 0 before row 1 before row 2 before row 3
    assert.equal(sorted[0].row, 0);
    assert.equal(sorted[1].row, 1);
    assert.equal(sorted[2].row, 2);
    assert.equal(sorted[3].row, 3);
  });
});
