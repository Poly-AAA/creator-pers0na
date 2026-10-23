/**
 * Portée, ligne de vue et tacle du combat.
 * Manhattan = diamant. La case cible ne bloque pas la vue.
 * Le tacle est déterministe : il dépend de l’agilité, sans dé.
 */
(function (root) {
  function manhattan(a, b) {
    return Math.abs((a.c | 0) - (b.c | 0)) + Math.abs((a.r | 0) - (b.r | 0));
  }

  function lineAligned(a, b) {
    const dc = (a.c | 0) - (b.c | 0);
    const dr = (a.r | 0) - (b.r | 0);
    return dc === 0 || dr === 0 || Math.abs(dc) === Math.abs(dr);
  }

  function losClear(c0, r0, c1, r1, blocked) {
    c0 |= 0; r0 |= 0; c1 |= 0; r1 |= 0;
    if (c0 === c1 && r0 === r1) return true;
    const dx = c1 - c0;
    const dy = r1 - r0;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx + ady <= 1) return true;
    if (adx === 1 && ady === 1) return true;
    const sx = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const sy = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    let x = c0;
    let y = r0;
    let err = adx - ady;
    const guard = adx + ady + 4;
    for (let n = 0; n < guard; n++) {
      const e2 = err * 2;
      const stepX = sx !== 0 && e2 > -ady;
      const stepY = sy !== 0 && e2 < adx;
      if (stepX && stepY) {
        const nx = x + sx;
        const ny = y + sy;
        if (nx === c1 && ny === r1) return true;
        const wx = x + sx;
        const wy = y;
        const vx = x;
        const vy = y + sy;
        if (((wx !== c1 || wy !== r1) && blocked(wx, wy)) || ((vx !== c1 || vy !== r1) && blocked(vx, vy))) return false;
        if (blocked(nx, ny)) return false;
        err = err - ady + adx;
        x = nx;
        y = ny;
        continue;
      }
      if (stepX) { err -= ady; x += sx; }
      else { err += adx; y += sy; }
      if (x === c1 && y === r1) return true;
      if (blocked(x, y)) return false;
    }
    return false;
  }

  function tackleCost(myAgi, foeAgis) {
    const foes = (foeAgis || []).map((n) => n | 0).filter((n) => n > 0);
    if (!foes.length) return { pm: 1, pa: 0, hold: 0 };
    const foe = Math.max.apply(null, foes);
    const mine = Math.max(1, myAgi | 0);
    const hold = foe / (foe + mine);
    const extra = hold < 0.34 ? 0 : hold < 0.67 ? 1 : 2;
    return { pm: 1 + extra, pa: hold >= 0.75 ? 1 : 0, hold: hold };
  }

  function spellReach(spell, from, to, blocked) {
    const dc = (to.c | 0) - (from.c | 0);
    const dr = (to.r | 0) - (from.r | 0);
    const d = Math.abs(dc) + Math.abs(dr);
    const max = Math.max(0, spell.max | 0);
    const min = Math.max(0, spell.min | 0);
    if (d < min || d > max) return "out";
    if (spell.line && !(dc === 0 || dr === 0 || Math.abs(dc) === Math.abs(dr))) return "out";
    if (spell.los && blocked && !losClear(from.c, from.r, to.c, to.r, blocked)) return "blocked";
    return "ok";
  }

  function fairBlocks(rng, grid, opens, count) {
    const g = grid | 0;
    const open = new Set((opens || []).map((p) => (p.c | 0) + "," + (p.r | 0)));
    const want = Math.max(0, count | 0);
    const cells = [];
    for (let c = 0; c < g; c++) {
      for (let r = 0; r < g; r++) {
        const k = c + "," + r;
        if (!open.has(k)) cells.push({ c: c, r: r });
      }
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = cells[i];
      cells[i] = cells[j];
      cells[j] = t;
    }
    const blocks = [];
    const blocked = new Set();
    const starts = (opens || []).filter((p) => p.goal);
    const home = (opens || []).find((p) => p.home) || (opens && opens[0]) || null;
    function reaches() {
      if (!home || !starts.length) return true;
      const seen = new Set([(home.c | 0) + "," + (home.r | 0)]);
      const q = [{ c: home.c | 0, r: home.r | 0 }];
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (q.length) {
        const cur = q.shift();
        for (let i = 0; i < starts.length; i++) {
          if (cur.c === (starts[i].c | 0) && cur.r === (starts[i].r | 0)) return true;
        }
        for (let d = 0; d < 4; d++) {
          const nc = cur.c + dirs[d][0];
          const nr = cur.r + dirs[d][1];
          if (nc < 0 || nr < 0 || nc >= g || nr >= g) continue;
          const k = nc + "," + nr;
          if (seen.has(k) || blocked.has(k)) continue;
          seen.add(k);
          q.push({ c: nc, r: nr });
        }
      }
      return false;
    }
    for (let i = 0; i < cells.length && blocks.length < want; i++) {
      const cell = cells[i];
      const k = cell.c + "," + cell.r;
      blocked.add(k);
      if (reaches()) blocks.push({ c: cell.c, r: cell.r });
      else blocked.delete(k);
    }
    return blocks;
  }

  const api = { manhattan: manhattan, lineAligned: lineAligned, losClear: losClear, tackleCost: tackleCost, spellReach: spellReach, fairBlocks: fairBlocks };
  root.CombatGrid = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
