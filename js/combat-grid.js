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

  /**
   * Cible auto.
   * 0 attaquable → le plus proche, hors de portée.
   * 1 attaquable → celui-là.
   * plusieurs → PV actuels les plus bas, puis le plus proche.
   * preferId ne gagne que s’il est encore attaquable.
   */
  function pickTarget(cands, opts) {
    const list = cands || [];
    const prefer = opts && opts.preferId != null ? opts.preferId : null;
    if (prefer != null) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === prefer && list[i].attackable) return { id: list[i].id, reach: true };
      }
    }
    const ok = [];
    for (let i = 0; i < list.length; i++) if (list[i].attackable) ok.push(list[i]);
    ok.sort(function (a, b) {
      return (a.hp - b.hp) || (a.dist - b.dist) || String(a.id).localeCompare(String(b.id));
    });
    if (ok.length) return { id: ok[0].id, reach: true };
    if (!list.length) return null;
    const all = list.slice().sort(function (a, b) {
      return (a.dist - b.dist) || (a.hp - b.hp) || String(a.id).localeCompare(String(b.id));
    });
    return { id: all[0].id, reach: false };
  }

  function orderedTargets(cands, origin) {
    const pool = [];
    const rest = [];
    for (let i = 0; i < (cands || []).length; i++) {
      if (cands[i].attackable) pool.push(cands[i]);
      else rest.push(cands[i]);
    }
    const list = (pool.length ? pool : rest).slice();
    const ox = origin ? origin.c | 0 : 0;
    const oy = origin ? origin.r | 0 : 0;
    list.sort(function (a, b) {
      const aa = Math.atan2(a.r - oy, a.c - ox);
      const bb = Math.atan2(b.r - oy, b.c - ox);
      if (aa !== bb) return aa - bb;
      return (a.dist - b.dist) || String(a.id).localeCompare(String(b.id));
    });
    return list;
  }

  function cycleTarget(cands, currentId, dir, origin) {
    const list = orderedTargets(cands, origin);
    if (!list.length) return null;
    let i = -1;
    for (let n = 0; n < list.length; n++) if (list[n].id === currentId) i = n;
    const step = dir < 0 ? -1 : 1;
    if (i < 0) i = 0;
    else i = (i + step + list.length) % list.length;
    return { id: list[i].id, reach: !!list[i].attackable };
  }

  /** Plus proche cible valide dans un demi-plan (haut / bas du pavé). */
  function nearestDir(cands, origin, dir) {
    const pool = [];
    const rest = [];
    for (let i = 0; i < (cands || []).length; i++) {
      if (cands[i].attackable) pool.push(cands[i]);
      else rest.push(cands[i]);
    }
    const list = pool.length ? pool : rest;
    const ox = origin ? origin.c | 0 : 0;
    const oy = origin ? origin.r | 0 : 0;
    const dc0 = dir ? dir.dc | 0 : 0;
    const dr0 = dir ? dir.dr | 0 : 0;
    let best = null;
    let score = Infinity;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const dc = (c.c | 0) - ox;
      const dr = (c.r | 0) - oy;
      const dot = dc * dc0 + dr * dr0;
      if (dot <= 0) continue;
      const d = Math.abs(dc) + Math.abs(dr);
      const s = d * 100 - dot;
      if (s < score || (s === score && best && String(c.id).localeCompare(String(best.id)) < 0)) {
        score = s;
        best = c;
      }
    }
    if (!best) return null;
    return { id: best.id, reach: !!best.attackable };
  }

  /**
   * Poussée en ligne. Le bonus de choc = cases restantes × 4
   * si un obstacle, un combattant ou le bord arrête la poussée.
   */
  function pushOutcome(from, foe, cells, blocked) {
    let c = foe.c | 0;
    let r = foe.r | 0;
    let dc = Math.sign(c - (from.c | 0));
    let dr = Math.sign(r - (from.r | 0));
    if (dc === 0 && dr === 0) { dc = 0; dr = 1; }
    const n = Math.max(0, cells | 0);
    let moved = 0;
    for (let i = 0; i < n; i++) {
      if (!blocked(c + dc, r + dr)) { c += dc; r += dr; moved++; continue; }
      if (dc && dr) {
        if (!blocked(c + dc, r)) { c += dc; moved++; continue; }
        if (!blocked(c, r + dr)) { r += dr; moved++; continue; }
      }
      break;
    }
    const left = n - moved;
    return { moved: moved, bonus: left > 0 ? left * 4 : 0, c: c, r: r };
  }

  /**
   * Meilleur déplacement + attaque strictement meilleur que la case actuelle.
   * PM restants, coût de tacle à la sortie, PA du sort conservés, obstacles évités.
   */
  function suggestPlacement(spec) {
    if (!spec || !spec.from) return null;
    const from = spec.from;
    const pm = spec.pm | 0;
    const pa = spec.pa | 0;
    const cost = spec.cost | 0;
    const grid = spec.grid | 0;
    const foes = spec.foes || [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const startK = (from.c | 0) + "," + (from.r | 0);
    const best = {};
    best[startK] = { spent: 0, pa: 0, prev: null };
    const q = [{ c: from.c | 0, r: from.r | 0, spent: 0, pa: 0 }];
    while (q.length) {
      q.sort(function (a, b) { return a.spent - b.spent || a.pa - b.pa; });
      const cur = q.shift();
      const ck = cur.c + "," + cur.r;
      const known = best[ck];
      if (!known || known.spent !== cur.spent || known.pa !== cur.pa) continue;
      const price = spec.tackle(cur.c, cur.r) || { pm: 1, pa: 0 };
      if (pm < cur.spent + (price.pm | 0)) continue;
      if (pa < cur.pa + (price.pa | 0) + cost) continue;
      for (let d = 0; d < 4; d++) {
        const nc = cur.c + dirs[d][0];
        const nr = cur.r + dirs[d][1];
        if (nc < 0 || nr < 0 || nc >= grid || nr >= grid) continue;
        if (spec.blocked(nc, nr)) continue;
        const spent = cur.spent + (price.pm | 0);
        const npa = cur.pa + (price.pa | 0);
        if (spent > pm || pa < npa + cost) continue;
        const k = nc + "," + nr;
        const prev = best[k];
        if (prev && (prev.spent < spent || (prev.spent === spent && prev.pa <= npa))) continue;
        best[k] = { spent: spent, pa: npa, prev: ck };
        q.push({ c: nc, r: nr, spent: spent, pa: npa });
      }
    }
    const current = spec.current | 0;
    const currentHp = spec.currentHp == null ? 1e9 : spec.currentHp;
    let win = null;
    const keys = Object.keys(best);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === startK) continue;
      const info = best[k];
      if (pa - info.pa < cost) continue;
      const parts = k.split(",");
      const cell = { c: parts[0] | 0, r: parts[1] | 0 };
      let local = null;
      for (let f = 0; f < foes.length; f++) {
        const foe = foes[f];
        if (!spec.hits(cell, foe)) continue;
        const dmg = spec.damage(cell, foe) | 0;
        if (dmg <= 0) continue;
        const hp = foe.hp | 0;
        if (!local || dmg > local.dmg || (dmg === local.dmg && hp < local.hp)) local = { dmg: dmg, hp: hp, foe: foe };
      }
      if (!local) continue;
      const beats = local.dmg > current || (local.dmg >= current && local.hp < currentHp);
      if (!beats) continue;
      if (!win || local.dmg > win.dmg || (local.dmg === win.dmg && local.hp < win.hp) || (local.dmg === win.dmg && local.hp === win.hp && info.spent < win.spent)) {
        win = { dmg: local.dmg, hp: local.hp, foe: local.foe, spent: info.spent, key: k, cell: cell };
      }
    }
    if (!win) return null;
    const path = [];
    let k = win.key;
    const guard = keys.length + 2;
    for (let n = 0; k && n < guard; n++) {
      const parts = k.split(",");
      path.unshift({ c: parts[0] | 0, r: parts[1] | 0 });
      k = best[k] ? best[k].prev : null;
    }
    return { path: path, dest: win.cell, foeId: win.foe.id, damage: win.dmg };
  }

  const api = {
    manhattan: manhattan,
    lineAligned: lineAligned,
    losClear: losClear,
    tackleCost: tackleCost,
    spellReach: spellReach,
    fairBlocks: fairBlocks,
    pickTarget: pickTarget,
    cycleTarget: cycleTarget,
    nearestDir: nearestDir,
    pushOutcome: pushOutcome,
    suggestPlacement: suggestPlacement,
  };
  root.CombatGrid = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
