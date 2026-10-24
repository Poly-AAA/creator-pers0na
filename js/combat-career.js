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
    if (state.fightMode !== "equipe") state.fightMode = "1v1";
    if (!Array.isArray(state.challenges)) state.challenges = [];
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
      challenges: (G.roguelite && G.roguelite.challenges) || [],
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
    var fightMode = state.fightMode === "equipe" ? "equipe" : "1v1";
    var enc = R.buildEncounter(state, fightMode, nextRng(), state._catalog);
    var units = R.unitsFromEncounter(state.hero, enc);
    var player = units.allies[0];
    var foes = units.foes;
    b.rlApply({
      mode: enc.mode,
      size: enc.size,
      challenges: (state.challenges || []).slice(),
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

  function svg(inner, size) {
    var w = size || 14;
    return "<svg viewBox='0 0 16 16' width='" + w + "' height='" + w + "' aria-hidden='true'>" + inner + "</svg>";
  }
  var PATH = {
    heart: "<path fill='currentColor' d='M8 13.4S2.4 9.4 2.4 6.2A2.8 2.8 0 0 1 8 4.8 2.8 2.8 0 0 1 13.6 6.2C13.6 9.4 8 13.4 8 13.4z'/>",
    bolt: "<path fill='currentColor' d='M9 1L4 9h3l-1 6 6-8H9l1-6z'/>",
    boot: "<path fill='currentColor' d='M3 9l2-5h4l1 3h3v2l1 4H3V9z'/>",
    coin: "<circle cx='8' cy='8' r='5.2' fill='none' stroke='currentColor' stroke-width='1.6'/><path fill='currentColor' d='M8 4.2h1.2v7.6H8z'/>",
    star: "<path fill='currentColor' d='M8 1.4l1.5 3.3 3.6.5-2.6 2.5.6 3.6L8 9.7 4.9 11.3l.6-3.6L2.9 5.2l3.6-.5z'/>",
    dice: "<rect x='3' y='3' width='10' height='10' rx='1.4' fill='none' stroke='currentColor' stroke-width='1.4'/><circle cx='6' cy='6' r='.8' fill='currentColor'/><circle cx='10' cy='10' r='.8' fill='currentColor'/>",
    sword: "<path fill='currentColor' d='M11.2 1.2l3.6 3.6-6.2 6.2-1.2-.4-.6 1.8H5.2V11l1.8-.6-.4-1.2 6.2-6.2z'/>",
    spark: "<path fill='currentColor' d='M8 1l1.2 4.2L13.5 6.5 9.2 7.8 8 12 6.8 7.8 2.5 6.5l4.3-1.3z'/>",
    wind: "<path fill='none' stroke='currentColor' stroke-width='1.6' d='M2 5h8M2 8h12M4 11h7'/>",
    eye: "<path fill='currentColor' d='M1.5 8S4 4 8 4s6.5 4 6.5 4S12 12 8 12 1.5 8 1.5 8z'/><circle cx='8' cy='8' r='1.5' fill='var(--bg)'/>",
    shield: "<path fill='currentColor' d='M8 1.4l5 2v4c0 3.1-2 5-5 6.6-3-1.6-5-3.5-5-6.6v-4l5-2z'/>",
    hat: "<path fill='currentColor' d='M3 10l2-5h6l2 5H3zm-1 1.2h12v1.8H2v-1.8z'/>",
    gem: "<path fill='currentColor' d='M8 1.6l5 3.6-5 9.2L3 5.2l5-3.6z'/>",
    cape: "<path fill='currentColor' d='M4 2h8l-1 12H5L4 2z'/>",
    ring: "<circle cx='8' cy='8' r='3.4' fill='none' stroke='currentColor' stroke-width='1.8'/>",
    belt: "<path fill='currentColor' d='M2 6h12v4H2V6zm5 1h2v2H7V7z'/>",
    bag: "<path fill='currentColor' d='M5 6V4.6a3 3 0 0 1 6 0V6h2v8H3V6h2z'/>",
    hammer: "<path fill='currentColor' d='M2 6h7l1-3h4v4h-3L9 13H7L5 7H2V6z'/>",
    anvil: "<path fill='currentColor' d='M2 4h12v3H9v2h4v2H3v-2h4V7H2V4z'/>",
    crack: "<path fill='none' stroke='currentColor' stroke-width='1.6' d='M3 3l10 10M13 3L3 13'/>",
    person: "<circle cx='8' cy='4' r='2.1' fill='currentColor'/><path fill='currentColor' d='M4 14v-2.1C4 9.6 5.7 8.2 8 8.2s4 1.4 4 3.7V14H4z'/>",
    people: "<circle cx='6' cy='4.2' r='1.8' fill='currentColor'/><circle cx='11' cy='5' r='1.4' fill='currentColor'/><path fill='currentColor' d='M2.4 14v-1.8C2.4 10.4 3.8 9.2 6 9.2s3.6 1.2 3.6 3V14H2.4zm6.2 0v-1.5c0-1.3 1.1-2.3 2.6-2.3 1.4 0 2.4 1 2.4 2.3V14H8.6z'/>",
    pin: "<path fill='currentColor' d='M8 1.4a3.6 3.6 0 0 0-3.6 3.6c0 2.6 3.6 7.6 3.6 7.6s3.6-5 3.6-7.6A3.6 3.6 0 0 0 8 1.4z'/>",
    noheal: "<path fill='currentColor' d='M8 13S2.6 9.2 2.6 6.2A2.6 2.6 0 0 1 8 4.8 2.6 2.6 0 0 1 13.4 6.2C13.4 9.2 8 13 8 13z'/><path stroke='currentColor' stroke-width='1.6' d='M3.2 12.4L12.8 3.2'/>",
    go: "<path fill='currentColor' d='M6 2l6 6-6 6V10H1V6h5V2z'/>",
    skull: "<path fill='currentColor' d='M8 2a4.2 4.2 0 0 0-3.2 7v2.2h6.4V9A4.2 4.2 0 0 0 8 2z'/>",
  };
  var STAT_G = { vit: "heart", force: "sword", intel: "spark", chance: "dice", agi: "wind", sage: "eye", ini: "bolt" };
  var SLOT_G = {
    coiffe: "hat", amulette: "gem", cape: "cape", torse: "cape", arme: "sword",
    anneauG: "ring", anneauD: "ring", ceinture: "belt", gants: "bag", bouclier: "shield",
    jambes: "boot", bottes: "boot",
  };
  function gly(name, size) { return svg(PATH[name] || PATH.spark, size); }
  function chip(icon, text, label) {
    return "<b aria-label='" + esc(label) + "'>" + gly(icon) + esc(text) + "</b>";
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
      return chip(STAT_G[k] || "spark", String(e[k]), R.STAT_LABEL[k] || k);
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
      var face = it && gearFolder(it) ? gearIcon(it) : gly(SLOT_G[slot] || "gem");
      return "<button type='button' class='" + mark + "' data-unequip='" + slot + "' aria-label='" + esc(R.SLOT_LABEL[slot]) + (it ? " " + it.name : "") + "'>" + face + "</button>";
    }).join("");
  }
  function itemButtons(attr) {
    var bag = state.hero.inventory || [];
    if (!bag.length) return "<p>0</p>";
    return bag.map(function (it) {
      return "<button type='button' data-" + attr + "='" + esc(it.id) + "' aria-label='" + esc(it.name) + " " + esc(lineText(it)) + "'>" + gearIcon(it) + gly("star") + "<b>" + it.level + "</b></button>";
    }).join("");
  }
  function runeButtons() {
    var keys = Object.keys(state.hero.runes || {}).filter(function (k) { return state.hero.runes[k] > 0; });
    if (!keys.length) return "<p>0</p>";
    return keys.map(function (k) {
      return "<button type='button' data-rune='" + k + "' aria-label='" + esc(R.STAT_LABEL[k] || k) + "'>" + gly(STAT_G[k] || "gem") + "<b>" + state.hero.runes[k] + "</b></button>";
    }).join("");
  }
  function matButtons() {
    var have = state.hero.materials || {};
    var list = R.MATERIALS.filter(function (m) { return (have[m.id] || 0) > 0; });
    if (!list.length) return "<p>0</p>";
    return list.map(function (m) {
      var on = mats.indexOf(m.id) >= 0 ? " on" : "";
      return "<button type='button' class='" + on + "' data-mat='" + m.id + "' aria-label='" + esc(m.name) + "'>" + gly("gem") + "<b>" + have[m.id] + "</b></button>";
    }).join("");
  }
  function shopButtons() {
    var rows = (state.shop || []).filter(function (o) { return !o.sold; });
    if (!rows.length) return "<p>0</p>";
    return rows.map(function (o) {
      return "<button type='button' data-buy='" + esc(o.id) + "' aria-label='" + esc(o.name) + "'>" + gearIcon(o.item) + gly("coin") + "<b>" + o.price + "</b></button>";
    }).join("");
  }
  function notice() {
    var n = state._notice;
    if (!n) return "";
    if (n.crushed) return "<p>" + gly("crack") + n.crushed.length + "</p>";
    if (n.fled) return "<p>" + gly("boot") + (n.paid || 0) + "</p>";
    if (n.dead) return "<p>" + gly("skull") + esc(n.entry && n.entry.name) + " " + ((n.entry && n.entry.level) || "") + " · " + esc(n.next || state.hero.name) + "</p>";
    var bits = [];
    if (n.xp) bits.push(gly("star") + "+" + n.xp);
    if (n.gold) bits.push(gly("coin") + "+" + n.gold);
    if (n.levels && n.levels.length) bits.push(gly("star") + state.hero.level);
    if (n.drops && n.drops.length) bits.push(gly("bag") + n.drops.length);
    if (n.challenges && n.challenges.length) bits.push(gly("pin") + n.challenges.length);
    return bits.length ? "<p>" + bits.join(" ") + "</p>" : "";
  }
  function body() {
    if (mode === "soin") {
      var sizes = { mediocre: 10, bon: 13, parfait: 16 };
      return ["mediocre", "bon", "parfait"].map(function (tier) {
        return "<button type='button' data-heal='" + tier + "' aria-label='" + tier + "'>" + gly("heart", sizes[tier]) + gly("coin") + "<b>" + R.healPrice(state.hero, tier) + "</b></button>";
      }).join("");
    }
    if (mode === "marche") return shopButtons();
    if (mode === "bris") return itemButtons("crush");
    if (mode === "forge") return itemButtons("item") + runeButtons();
    if (mode === "atelier") {
      return R.SLOTS.map(function (slot) {
        return "<button type='button' data-slot='" + slot + "' aria-label='" + esc(R.SLOT_LABEL[slot]) + "'>" + gly(SLOT_G[slot] || "gem") + "</button>";
      }).join("") + matButtons() + "<button type='button' id='campCraft' aria-label='Assembler'>" + gly("hammer") + "</button>";
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
      ["sac", "Sac", "bag"],
      ["bris", "Bris", "crack"],
      ["forge", "Forge", "anvil"],
      ["atelier", "Atelier", "hammer"],
      ["soin", "Soin", "heart"],
      ["marche", "Marché", "coin"],
    ];
    var challenges = state.challenges || [];
    var fight = state.fightMode === "equipe" ? "equipe" : "1v1";
    camp.hidden = false;
    camp.innerHTML = ""
      + "<header><b>" + esc(h.name) + "</b>"
      + chip("star", String(h.level), "Niveau")
      + chip("dice", String(h.gene), "Gène " + (h.geneLabel || ""))
      + chip("coin", String(h.gold | 0), "Kamas")
      + chip("heart", h.pv + "/" + h.pvMax, "Points de vie")
      + "</header>"
      + notice()
      + "<div class='camp-stats' aria-label='Caractéristiques'>" + statRow()
      + "<span aria-label='Expérience'>" + gly("star") + h.xp + "/" + need + "</span>"
      + "<span aria-label='PA'>" + gly("bolt") + h.paMax + "</span>"
      + "<span aria-label='PM'>" + gly("boot") + h.pmMax + "</span></div>"
      + "<div class='camp-modes'>" + modes.map(function (m) {
        return "<button type='button' data-mode='" + m[0] + "' class='" + (mode === m[0] ? "on" : "") + "' aria-label='" + m[1] + "'>" + gly(m[2]) + "</button>";
      }).join("") + "</div>"
      + "<div class='camp-fight'>"
      + "<button type='button' data-fight='1v1' class='" + (fight === "1v1" ? "on" : "") + "' aria-label='Duel'>" + gly("person") + "<b>1</b></button>"
      + "<button type='button' data-fight='equipe' class='" + (fight === "equipe" ? "on" : "") + "' aria-label='Équipe'>" + gly("people") + "</button>"
      + "<button type='button' data-ch='immobile' class='" + (challenges.indexOf("immobile") >= 0 ? "on" : "") + "' aria-label='Sans bouger'>" + gly("pin") + "</button>"
      + "<button type='button' data-ch='cinqTours' class='" + (challenges.indexOf("cinqTours") >= 0 ? "on" : "") + "' aria-label='Cinq tours'><b>5</b></button>"
      + "<button type='button' data-ch='sansSoin' class='" + (challenges.indexOf("sansSoin") >= 0 ? "on" : "") + "' aria-label='Sans soin'>" + gly("noheal") + "</button>"
      + "<button type='button' id='campFight' aria-label='Combattre'>" + gly("go") + "</button>"
      + "</div>"
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
    if (t.dataset.fight) { state.fightMode = t.dataset.fight === "equipe" ? "equipe" : "1v1"; save(); render(); return; }
    if (t.dataset.ch) {
      var id = t.dataset.ch;
      state.challenges = state.challenges || [];
      var at = state.challenges.indexOf(id);
      if (at >= 0) state.challenges.splice(at, 1);
      else state.challenges.push(id);
      save();
      render();
      return;
    }
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
