/**
 * Carrière du combat seul : le même personnage entre les duels.
 * Les chiffres viennent de roguelite.js. Cet écran ne fait que les montrer.
 */
(function (root) {
  var KEY = "roguelite.career";
  var R = root.Roguelite;
  var state = null;
  var holding = false;
  var mode = "sac";
  var picked = null;
  var mats = [];

  function bridge() { return root.__careerBridge; }
  function nextRng() {
    state.meta.tick = ((state.meta.tick | 0) + 1) >>> 0;
    return R.mulberry32((state.hero.seed ^ (state.meta.tick * 997)) >>> 0);
  }
  function save() {
    var cat = state._catalog;
    delete state._catalog;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_e) {}
    state._catalog = cat;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
    });
  }
  function catalog() {
    var b = bridge();
    var list = (b && b.spells) ? b.spells() : [];
    return R.prepareCatalog(list);
  }
  function load() {
    var cat = catalog();
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (_e) {}
    if (raw) {
      try { state = JSON.parse(raw); } catch (_e) { state = null; }
    }
    if (!state || !state.hero) {
      var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      state = R.createState(seed, cat);
    }
    state._catalog = cat;
    R.syncHeroSpells(state.hero, cat);
    R.recomputeVitals(state.hero);
    if (!state.shop) R.refreshShop(state, nextRng());
    save();
  }

  function report(kind) {
    var G = bridge().G;
    var rl = G.rl || {};
    return {
      winner: kind === "win" ? "a" : "b",
      playerAlive: kind !== "defeat",
      playerPv: G.player.pv | 0,
      turns: rl.turns | 0 || 1,
      seconds: rl.t0 ? Math.max(1, Math.round((Date.now() - rl.t0) / 1000)) : 30,
      style: bridge().rlStyle(),
      kills: rl.kills | 0,
      healed: rl.healed | 0,
      shielded: rl.shielded | 0,
      combos: rl.combos | 0,
      fastTurns: (rl.turns | 0) <= 6 ? 1 : 0,
      playerMoved: !!rl.moved,
      challenges: [],
      foeItems: (G.roguelite && G.roguelite.foeItems) || [],
      foeLevels: (G.roguelite && G.roguelite.foeLevels) || [],
      fled: false,
    };
  }

  function launch() {
    var b = bridge();
    var G = b.G;
    holding = false;
    G._careerDone = false;
    G.awaitingNext = false;
    G.busy = false;
    G.turn = "player";
    var enc = R.buildEncounter(state, "1v1", nextRng(), state._catalog);
    var units = R.unitsFromEncounter(state.hero, enc);
    var player = units.allies[0];
    var foes = units.foes;
    b.rlApply({
      mode: "1v1",
      size: 1,
      challenges: [],
      player: player,
      allies: units.allies.slice(1),
      foes: foes,
      foeItems: foes.reduce(function (arr, f) { return arr.concat(f.items || []); }, []),
      foeLevels: enc.foes.map(function (f) { return f.level | 0; }),
      gold: state.hero.gold | 0,
      fleeCharges: state.hero.fleeCharges | 0,
    });
    G.player.pv = state.hero.pv;
    G.player.pvMax = state.hero.pvMax;
    var folders = [];
    (G.player.gearLayers || []).forEach(function (L) { if (L && L.folder) folders.push(L.folder); });
    (G.roster || []).forEach(function (u) {
      (u.layers || []).forEach(function (L) { if (L && L.folder) folders.push(L.folder); });
    });
    try { b.warmFolders(folders, { mounted: false }); } catch (_e) {}
    try { b.playAnim(G.player, "Idle"); } catch (_e) {}
    try { b.playAnim(G.enemy, "Idle"); } catch (_e) {}
    b.beginPlayerTurn();
    b.renderSpells();
    b.hud();
    b.setStatus(state.hero.name + " · " + state.hero.level);
    var camp = b.el("camp");
    if (camp) camp.hidden = true;
  }

  function rest() {
    if (!state) { boot(); return; }
    holding = true;
    var G = bridge().G;
    G.turn = "over";
    G.busy = false;
    render();
  }

  function finish(kind) {
    var b = bridge();
    var G = b.G;
    if (holding || G._careerDone) return;
    G._careerDone = true;
    G.turn = "over";
    G.busy = false;
    var settled;
    if (kind === "flee") {
      var fled = R.useFlee(state.hero);
      if (!fled.ok) {
        G._careerDone = false;
        G.turn = "player";
        b.setStatus("Fuite impossible");
        return;
      }
      settled = R.settleFight(state, {
        fled: true, paid: fled.paid || 0, winner: "draw", style: 0, playerAlive: true,
      }, nextRng());
    } else {
      settled = R.settleFight(state, report(kind), nextRng());
    }
    if (settled && settled.companion && settled.companion.accepted) {
      R.recruit(state.hero, settled.companion.companion);
    }
    state._notice = settled;
    R.recomputeVitals(state.hero);
    save();
    holding = true;
    render();
  }

  function lineText(it) {
    return (it.lines || []).map(function (ln) {
      return (R.STAT_LABEL[ln.stat] || ln.stat) + " " + ln.value;
    }).join(" · ");
  }
  function statRow() {
    var e = state.hero.eff || R.effectiveStats(state.hero);
    var keys = ["vit", "force", "intel", "chance", "agi", "sage", "ini"];
    return keys.map(function (k) {
      return "<b aria-label='" + esc(R.STAT_LABEL[k]) + "'>" + e[k] + "</b>";
    }).join("");
  }
  function gearFolder(it) {
    var look = it && R.lookOf ? R.lookOf(it) : null;
    return look ? look.folder : "";
  }
  function gearIcon(it) {
    var folder = gearFolder(it);
    if (!folder) return "";
    var tint = (R.lookOf(it) || {}).tint || "";
    return "<canvas class='gear-ico' width='32' height='32' data-folder='" + esc(folder) + "' data-tint='" + esc(tint) + "'></canvas>";
  }
  function slotButtons() {
    return R.SLOTS.map(function (slot) {
      var it = state.hero.equipped && state.hero.equipped[slot];
      var mark = it ? "on" : "";
      var face = it && gearFolder(it) ? gearIcon(it) : (it ? it.level : "·");
      return "<button type='button' class='" + mark + "' data-unequip='" + slot + "' aria-label='" + esc(R.SLOT_LABEL[slot]) + (it ? " " + it.name : "") + "'>" + face + "</button>";
    }).join("");
  }
  function itemButtons(attr) {
    var bag = state.hero.inventory || [];
    if (!bag.length) return "<p>0</p>";
    return bag.map(function (it) {
      return "<button type='button' data-" + attr + "='" + esc(it.id) + "' aria-label='" + esc(it.name) + " " + esc(lineText(it)) + "'>" + gearIcon(it) + "<b>" + it.level + "</b></button>";
    }).join("");
  }
  function runeButtons() {
    var keys = Object.keys(state.hero.runes || {}).filter(function (k) { return state.hero.runes[k] > 0; });
    if (!keys.length) return "<p>0</p>";
    return keys.map(function (k) {
      return "<button type='button' data-rune='" + k + "' aria-label='" + esc(R.STAT_LABEL[k] || k) + "'><b>" + state.hero.runes[k] + "</b></button>";
    }).join("");
  }
  function matButtons() {
    var have = state.hero.materials || {};
    var list = R.MATERIALS.filter(function (m) { return (have[m.id] || 0) > 0; });
    if (!list.length) return "<p>0</p>";
    return list.map(function (m) {
      var on = mats.indexOf(m.id) >= 0 ? " on" : "";
      return "<button type='button' class='" + on + "' data-mat='" + m.id + "' aria-label='" + esc(m.name) + "'><b>" + have[m.id] + "</b></button>";
    }).join("");
  }
  function shopButtons() {
    var rows = (state.shop || []).filter(function (o) { return !o.sold; });
    if (!rows.length) return "<p>0</p>";
    return rows.map(function (o) {
      return "<button type='button' data-buy='" + esc(o.id) + "' aria-label='" + esc(o.name) + "'>" + gearIcon(o.item) + "<b>" + o.price + "</b></button>";
    }).join("");
  }
  function notice() {
    var n = state._notice;
    if (!n) return "";
    if (n.crushed) return "<p>" + n.crushed.length + "</p>";
    if (n.fled) return "<p>Fuite " + (n.paid || 0) + "</p>";
    if (n.dead) return "<p>× " + esc(n.entry && n.entry.name) + " " + ((n.entry && n.entry.level) || "") + " · " + esc(n.next || state.hero.name) + "</p>";
    var bits = [];
    if (n.xp) bits.push("+" + n.xp);
    if (n.gold) bits.push("+" + n.gold);
    if (n.levels && n.levels.length) bits.push(state.hero.level);
    if (n.drops && n.drops.length) bits.push(n.drops.length);
    return bits.length ? "<p>" + bits.join(" · ") + "</p>" : "";
  }
  function body() {
    if (mode === "soin") {
      return ["mediocre", "bon", "parfait"].map(function (tier) {
        return "<button type='button' data-heal='" + tier + "' aria-label='" + tier + "'><b>" + R.healPrice(state.hero, tier) + "</b></button>";
      }).join("");
    }
    if (mode === "marche") return shopButtons();
    if (mode === "bris") return itemButtons("crush");
    if (mode === "forge") return itemButtons("item") + runeButtons();
    if (mode === "atelier") {
      return R.SLOTS.map(function (slot) {
        return "<button type='button' data-slot='" + slot + "' aria-label='" + esc(R.SLOT_LABEL[slot]) + "'></button>";
      }).join("") + matButtons() + "<button type='button' id='campCraft' aria-label='Assembler'></button>";
    }
    return slotButtons() + itemButtons("equip");
  }
  function render() {
    var b = bridge();
    var camp = b.el("camp");
    if (!camp) return;
    var h = state.hero;
    var need = R.xpNeed(h.level);
    var modes = [
      ["sac", "Sac", "S"],
      ["bris", "Bris", "×"],
      ["forge", "Forge", "◆"],
      ["atelier", "Atelier", "+"],
      ["soin", "Soin", "♥"],
      ["marche", "Marché", "●"],
    ];
    camp.hidden = false;
    camp.innerHTML = ""
      + "<header><b>" + esc(h.name) + "</b><b aria-label='Niveau'>" + h.level + "</b><b aria-label='Gène " + esc(h.geneLabel) + "'>" + h.gene + "</b><b aria-label='Kamas'>" + (h.gold | 0) + "</b><b aria-label='Points de vie'>" + h.pv + "/" + h.pvMax + "</b></header>"
      + notice()
      + "<div class='camp-stats' aria-label='Caractéristiques'>" + statRow() + "<span aria-label='Expérience'>" + h.xp + "/" + need + "</span><span aria-label='PA'>" + h.paMax + "</span><span aria-label='PM'>" + h.pmMax + "</span></div>"
      + "<div class='camp-modes'>" + modes.map(function (m) {
        return "<button type='button' data-mode='" + m[0] + "' class='" + (mode === m[0] ? "on" : "") + "' aria-label='" + m[1] + "'>" + m[2] + "</button>";
      }).join("") + "<button type='button' id='campFight' aria-label='Combattre'>▶</button></div>"
      + "<div class='camp-body'>" + body() + "</div>";
    camp.onclick = onClick;
    paintIcons(camp);
  }
  var iconImg = {};
  function paintIcons(root) {
    var base = "";
    try { base = bridge().spriteBase || ""; } catch (_e) { base = ""; }
    if (base && base.charAt(base.length - 1) !== "/") base += "/";
    root.querySelectorAll("canvas.gear-ico").forEach(function (cv) {
      var folder = cv.getAttribute("data-folder");
      var tint = cv.getAttribute("data-tint") || "";
      if (!folder) return;
      var src = base + "spritesheets/" + folder + "/Idle.png";
      var known = iconImg[src];
      if (known && known.complete && known.naturalWidth) { blitIcon(cv, known, tint); return; }
      if (!known) {
        known = new Image();
        known.crossOrigin = "anonymous";
        iconImg[src] = known;
        known.addEventListener("load", function () {
          document.querySelectorAll("canvas.gear-ico[data-folder='" + folder + "']").forEach(function (el) {
            blitIcon(el, known, el.getAttribute("data-tint") || "");
          });
        });
        known.src = src;
      }
    });
  }
  var iconDone = {};
  function blitIcon(cv, img, tint) {
    var key = (img.src || "") + "|" + (tint || "");
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (iconDone[key]) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(iconDone[key], 0, 0, cv.width, cv.height);
      return;
    }
    var fw = 128;
    var fh = 128;
    var rows = Math.max(1, Math.floor(img.height / fh));
    var cols = Math.max(1, Math.floor(img.width / fw));
    var scratch = blitIcon.scratch || (blitIcon.scratch = document.createElement("canvas"));
    scratch.width = fw;
    scratch.height = fh;
    var sx = scratch.getContext("2d");
    var box = null;
    var bestN = 0;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        sx.clearRect(0, 0, fw, fh);
        sx.drawImage(img, col * fw, row * fh, fw, fh, 0, 0, fw, fh);
        var data;
        try { data = sx.getImageData(0, 0, fw, fh).data; } catch (_e) { data = null; }
        if (!data) {
          paintTint(cv, img, 0, row * fh, fw, fh, tint);
          return;
        }
        var minx = fw;
        var miny = fh;
        var maxx = -1;
        var maxy = -1;
        var n = 0;
        for (var y = 0; y < fh; y++) {
          for (var x = 0; x < fw; x++) {
            if (data[(y * fw + x) * 4 + 3] < 24) continue;
            n++;
            if (x < minx) minx = x;
            if (y < miny) miny = y;
            if (x > maxx) maxx = x;
            if (y > maxy) maxy = y;
          }
        }
        if (n > bestN) {
          bestN = n;
          box = { minx: minx, miny: miny, w: maxx - minx + 1, h: maxy - miny + 1, col: col, row: row };
        }
      }
    }
    if (!box) return;
    sx.clearRect(0, 0, fw, fh);
    sx.drawImage(img, box.col * fw, box.row * fh, fw, fh, 0, 0, fw, fh);
    var chip = document.createElement("canvas");
    chip.width = box.w;
    chip.height = box.h;
    var cx = chip.getContext("2d");
    cx.drawImage(scratch, box.minx, box.miny, box.w, box.h, 0, 0, box.w, box.h);
    if (tint) {
      cx.globalCompositeOperation = "multiply";
      cx.fillStyle = tint;
      cx.fillRect(0, 0, box.w, box.h);
      cx.globalCompositeOperation = "destination-in";
      cx.drawImage(scratch, box.minx, box.miny, box.w, box.h, 0, 0, box.w, box.h);
    }
    ctx.clearRect(0, 0, cv.width, cv.height);
    var scale = Math.min((cv.width - 2) / box.w, (cv.height - 2) / box.h);
    var dw = Math.max(1, Math.round(box.w * scale));
    var dh = Math.max(1, Math.round(box.h * scale));
    ctx.drawImage(chip, 0, 0, box.w, box.h, Math.floor((cv.width - dw) / 2), Math.floor((cv.height - dh) / 2), dw, dh);
    var saved = document.createElement("canvas");
    saved.width = cv.width;
    saved.height = cv.height;
    saved.getContext("2d").drawImage(cv, 0, 0);
    iconDone[key] = saved;
  }
  function paintTint(cv, img, sx0, sy0, sw, sh, tint) {
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, sx0, sy0, sw, sh, 0, 0, cv.width, cv.height);
    if (!tint) return;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(img, sx0, sy0, sw, sh, 0, 0, cv.width, cv.height);
  }
  function onClick(ev) {
    var t = ev.target.closest("button");
    if (!t) return;
    if (t.id === "campFight") { state._notice = null; save(); launch(); return; }
    if (t.dataset.mode) { mode = t.dataset.mode; mats = []; picked = null; render(); return; }
    if (t.dataset.unequip) { R.unequip(state.hero, t.dataset.unequip); save(); render(); return; }
    if (t.dataset.equip) { R.equip(state.hero, t.dataset.equip); save(); render(); return; }
    if (t.dataset.crush) {
      var crushed = R.crush(state, t.dataset.crush, nextRng());
      state._notice = { crushed: crushed.runes || [] };
      save();
      render();
      return;
    }
    if (t.dataset.item) { picked = t.dataset.item; return; }
    if (t.dataset.rune && picked) {
      R.forge(state, picked, t.dataset.rune, nextRng());
      picked = null;
      save();
      render();
      return;
    }
    if (t.dataset.mat) {
      var id = t.dataset.mat;
      var i = mats.indexOf(id);
      if (i >= 0) mats.splice(i, 1);
      else if (mats.length < 4) mats.push(id);
      render();
      return;
    }
    if (t.dataset.slot) { picked = t.dataset.slot; return; }
    if (t.id === "campCraft" && picked) {
      R.craft(state, picked, mats.slice(), nextRng());
      mats = [];
      picked = null;
      save();
      render();
      return;
    }
    if (t.dataset.heal) {
      R.applyHeal(state.hero, t.dataset.heal, nextRng());
      save();
      render();
      return;
    }
    if (t.dataset.buy) {
      R.buy(state, t.dataset.buy);
      save();
      render();
    }
  }

  function boot() {
    if (!root.__CAREER || !R) return;
    load();
    launch();
  }

  root.CombatCareer = {
    boot: boot,
    finish: finish,
    rest: rest,
    isHolding: function () { return holding; },
    render: render,
    snapshot: function () {
      return state && {
        name: state.hero.name,
        level: state.hero.level,
        gene: state.hero.gene,
        holding: holding,
      };
    },
  };
})(window);
