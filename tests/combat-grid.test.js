import { createContext, runInContext } from "node:vm";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function loadGrid() {
  const sandbox = { Math: Math, Number: Number, Object: Object, String: String, Array: Array };
  sandbox.globalThis = sandbox;
  runInContext(readFileSync("js/combat-grid.js", "utf8"), createContext(sandbox));
  return sandbox.CombatGrid;
}

const grid = loadGrid();

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pathExists(blocks, home, goal, size) {
  const wall = new Set(blocks.map((p) => p.c + "," + p.r));
  const seen = new Set([home.c + "," + home.r]);
  const q = [{ c: home.c, r: home.r }];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) {
    const cur = q.shift();
    if (cur.c === goal.c && cur.r === goal.r) return true;
    for (const [dc, dr] of dirs) {
      const nc = cur.c + dc;
      const nr = cur.r + dr;
      if (nc < 0 || nr < 0 || nc >= size || nr >= size) continue;
      const k = nc + "," + nr;
      if (seen.has(k) || wall.has(k)) continue;
      seen.add(k);
      q.push({ c: nc, r: nr });
    }
  }
  return false;
}

describe("grille de combat", () => {
  it("la portée est un diamant de Manhattan, avec minimum, ligne et vue", () => {
    assert.equal(grid.manhattan({ c: 0, r: 0 }, { c: 2, r: 1 }), 3);
    assert.equal(grid.lineAligned({ c: 1, r: 1 }, { c: 1, r: 4 }), true);
    assert.equal(grid.lineAligned({ c: 0, r: 0 }, { c: 3, r: 3 }), true);
    assert.equal(grid.lineAligned({ c: 0, r: 0 }, { c: 2, r: 1 }), false);
    const melee = { min: 1, max: 1, line: false, los: true };
    assert.equal(grid.spellReach(melee, { c: 4, r: 4 }, { c: 4, r: 5 }, () => false), "ok");
    assert.equal(grid.spellReach(melee, { c: 4, r: 4 }, { c: 4, r: 4 }, () => false), "out");
    assert.equal(grid.spellReach(melee, { c: 4, r: 4 }, { c: 6, r: 4 }, () => false), "out");
    const line = { min: 1, max: 4, line: true, los: false };
    assert.equal(grid.spellReach(line, { c: 0, r: 0 }, { c: 2, r: 2 }, () => false), "ok");
    assert.equal(grid.spellReach(line, { c: 0, r: 0 }, { c: 2, r: 1 }, () => false), "out");
  });

  it("la ligne de vue ignore la case cible et bloque un obstacle entre les deux", () => {
    const wall = (c, r) => c === 1 && r === 0;
    assert.equal(grid.losClear(0, 0, 2, 0, wall), false);
    assert.equal(grid.losClear(0, 0, 1, 0, wall), true);
    assert.equal(grid.losClear(0, 0, 2, 0, () => false), true);
    const spell = { min: 1, max: 3, line: false, los: true };
    assert.equal(grid.spellReach(spell, { c: 0, r: 0 }, { c: 2, r: 0 }, wall), "blocked");
    assert.equal(grid.spellReach(spell, { c: 0, r: 0 }, { c: 2, r: 0 }, () => false), "ok");
    assert.equal(grid.losClear(0, 0, 2, 2, (c, r) => c === 1 && r === 0), false);
  });

  it("quitter un ennemi adjacent coûte des PM, et des PA si l’agilité est dominée", () => {
    const none = grid.tackleCost(10, []);
    assert.equal(none.pm, 1);
    assert.equal(none.pa, 0);
    assert.equal(none.hold, 0);
    const even = grid.tackleCost(10, [10]);
    assert.equal(even.pm, 2);
    assert.equal(even.pa, 0);
    const stuck = grid.tackleCost(10, [40]);
    assert.equal(stuck.pm, 3);
    assert.equal(stuck.pa, 1);
    assert.ok(stuck.hold >= 0.75);
    const free = grid.tackleCost(40, [10]);
    assert.equal(free.pm, 1);
    assert.equal(free.pa, 0);
    const best = grid.tackleCost(10, [4, 40]);
    assert.equal(best.pm, stuck.pm);
  });

  it("les obstacles laissent un chemin entre les deux camps", () => {
    const home = { c: 1, r: 4, home: true };
    const foe = { c: 8, r: 4, goal: true };
    const blocks = grid.fairBlocks(mulberry32(7), 10, [home, foe, { c: 8, r: 5, goal: true }], 10);
    assert.ok(blocks.length >= 6 && blocks.length <= 12);
    const keys = new Set(blocks.map((p) => p.c + "," + p.r));
    assert.equal(keys.has("1,4"), false);
    assert.equal(keys.has("8,4"), false);
    assert.equal(pathExists(blocks, home, foe, 10), true);
  });

  it("les trois sorts gardent leurs animations et reçoivent portée et vue", () => {
    const spells = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
    const punch = spells.find((s) => s.id === "punch");
    const kick = spells.find((s) => s.id === "coup_de_pied");
    const roll = spells.find((s) => s.id === "roulade");
    assert.equal(punch.minRange, 1);
    assert.equal(punch.range, 1);
    assert.equal(punch.los, true);
    assert.equal(punch.line, false);
    assert.equal(punch.steps[0].anim, "Attack1");
    assert.equal(punch.steps[0].fps, 17);
    assert.equal(punch.evoConfig["1:Brise-Os"].anim, "Attack2");
    assert.equal(punch.evoConfig["1:Brise-Os"].fps, 12);
    assert.equal(kick.minRange, 1);
    assert.equal(kick.los, true);
    assert.equal(kick.steps[0].anim, "Kick");
    assert.equal(kick.steps[0].fps, 15);
    assert.equal(roll.minRange, 0);
    assert.equal(roll.los, false);
    assert.equal(roll.range, 2);
    assert.equal(roll.steps[0].anim, "Rolling");
    assert.equal(roll.steps[0].fps, 17);
    assert.equal(roll.evoConfig["1:Boxeur"].anim, "Rolling");
  });

  it("verrouille le PV le plus bas, puis le plus proche, et garde la dernière cible valide", () => {
    const foes = [
      { id: "haut", c: 2, r: 0, hp: 30, attackable: true, dist: 2 },
      { id: "bas", c: 4, r: 0, hp: 8, attackable: true, dist: 4 },
      { id: "seul-loin", c: 8, r: 0, hp: 1, attackable: false, dist: 8 },
    ];
    assert.equal(grid.pickTarget(foes).id, "bas");
    assert.equal(grid.pickTarget([foes[0], foes[2]]).id, "haut");
    assert.equal(grid.pickTarget([foes[2]]).reach, false);
    assert.equal(grid.pickTarget([foes[2]]).id, "seul-loin");
    const tie = [
      { id: "loin", c: 5, r: 0, hp: 10, attackable: true, dist: 5 },
      { id: "pres", c: 1, r: 0, hp: 10, attackable: true, dist: 1 },
    ];
    assert.equal(grid.pickTarget(tie).id, "pres");
    assert.equal(grid.pickTarget(foes, { preferId: "haut" }).id, "haut");
    assert.equal(grid.pickTarget(foes, { preferId: "seul-loin" }).id, "bas");
  });

  it("le pavé fait défiler les cibles et choisit la plus proche dans l’axe", () => {
    const foes = [
      { id: "ouest", c: 0, r: 2, hp: 20, attackable: true, dist: 2 },
      { id: "est", c: 4, r: 2, hp: 20, attackable: true, dist: 2 },
      { id: "nord", c: 2, r: 0, hp: 9, attackable: true, dist: 2 },
    ];
    const origin = { c: 2, r: 2 };
    const next = grid.cycleTarget(foes, "ouest", 1, origin);
    const prev = grid.cycleTarget(foes, "ouest", -1, origin);
    assert.notEqual(next.id, "ouest");
    assert.notEqual(prev.id, "ouest");
    assert.equal(grid.nearestDir(foes, origin, { dc: 0, dr: -1 }).id, "nord");
    assert.equal(grid.nearestDir(foes, origin, { dc: 1, dr: 0 }).id, "est");
    assert.equal(grid.nearestDir(foes, { c: 2, r: 0 }, { dc: 0, dr: -1 }), null);
  });

  it("la poussée dans un obstacle ajoute 4 dégâts par case restante", () => {
    const wall = (c) => c === 3;
    const hit = grid.pushOutcome({ c: 0, r: 0 }, { c: 1, r: 0 }, 1, (c) => wall(c));
    assert.equal(hit.moved, 1);
    assert.equal(hit.bonus, 0);
    const crash = grid.pushOutcome({ c: 0, r: 0 }, { c: 2, r: 0 }, 1, (c) => wall(c));
    assert.equal(crash.moved, 0);
    assert.equal(crash.bonus, 4);
    const far = grid.pushOutcome({ c: 0, r: 0 }, { c: 1, r: 0 }, 3, (c) => c === 3);
    assert.equal(far.moved, 1);
    assert.equal(far.bonus, 8);
    const edge = grid.pushOutcome({ c: 0, r: 0 }, { c: 0, r: 1 }, 1, (c, r) => r > 1);
    assert.equal(edge.moved, 0);
    assert.equal(edge.bonus, 4);
  });

  it("propose un déplacement seulement s’il frappe plus fort que la case actuelle", () => {
    const foes = [
      { id: "gros", c: 0, r: 1, hp: 40 },
      { id: "faible", c: 4, r: 0, hp: 6 },
    ];
    const rock = (c, r) => c === 5 && r === 0;
    const body = (c, r) => (c === 0 && r === 1) || rock(c, r);
    const melee = (cell, foe) => Math.abs(cell.c - foe.c) + Math.abs(cell.r - foe.r) === 1;
    const damage = (cell, foe) => {
      if (!melee(cell, foe)) return 0;
      const crash = foe.id === "faible" && cell.c === 3 && cell.r === 0;
      return crash ? 14 : 10;
    };
    const better = grid.suggestPlacement({
      from: { c: 0, r: 0 }, pm: 3, pa: 6, cost: 2, grid: 8,
      blocked: body,
      tackle: () => ({ pm: 1, pa: 0 }),
      foes, hits: melee, damage,
      current: 10, currentHp: 40,
    });
    assert.ok(better);
    assert.equal(better.foeId, "faible");
    assert.equal(better.damage, 14);
    assert.equal(better.dest.c, 3);
    assert.equal(better.dest.r, 0);
    assert.equal(better.path[0].c, 0);
    assert.equal(better.path[better.path.length - 1].c, 3);
    const same = grid.suggestPlacement({
      from: { c: 0, r: 0 }, pm: 3, pa: 6, cost: 2, grid: 8,
      blocked: body,
      tackle: () => ({ pm: 1, pa: 0 }),
      foes, hits: melee, damage: () => 10,
      current: 10, currentHp: 6,
    });
    assert.equal(same, null);
    const tackled = grid.suggestPlacement({
      from: { c: 0, r: 0 }, pm: 2, pa: 6, cost: 2, grid: 8,
      blocked: body,
      tackle: (c, r) => (c === 0 && r === 0 ? { pm: 3, pa: 0 } : { pm: 1, pa: 0 }),
      foes, hits: melee, damage,
      current: 10, currentHp: 40,
    });
    assert.equal(tackled, null);
    const poor = grid.suggestPlacement({
      from: { c: 0, r: 0 }, pm: 3, pa: 4, cost: 4, grid: 8,
      blocked: body,
      tackle: () => ({ pm: 1, pa: 1 }),
      foes, hits: melee, damage,
      current: 0, currentHp: 99,
    });
    assert.equal(poor, null);
  });
});
