/**
 * ATELIER DIY — état & parcours
 * Flux : Vêtement → Matériel/technique → Studio vectoriel → Pipeline technique → Visu
 */
(function () {
  "use strict";

  var GARMENTS = [
    { id: "tee", n: "T-shirt", hint: "Coton / jersey, face & dos" },
    { id: "sweat", n: "Sweat", hint: "Molleton, face large" },
    { id: "hoodie", n: "Hoodie", hint: "Capuche + poche" },
    { id: "tote", n: "Tote bag", hint: "Canvas, recto" },
    { id: "pants", n: "Pantalon", hint: "Cuisse / poche / ourlet" },
    { id: "patch", n: "Patch", hint: "Écusson à coudre / coller" }
  ];

  var MATERIALS = [
    { id: "frames", n: "Cadres sérigraphie", hint: "Écrans + racle + encre textile", tech: ["serigraphie"] },
    { id: "printer", n: "Imprimante laser / jet", hint: "Films / transferts / cyanotype", tech: ["serigraphie", "cyanotype", "transfert"] },
    { id: "emb-machine", n: "Machine à broder", hint: "Fichier machine + fil", tech: ["broderie"] },
    { id: "emb-hand", n: "Broderie main", hint: "Canevas, points guidés", tech: ["broderie"] },
    { id: "outsource-emb", n: "Faire broder ailleurs", hint: "Export patch / digitizing", tech: ["broderie"] },
    { id: "cyanotype", n: "Chimie cyanotype", hint: "Sensible UV, tissus naturels", tech: ["cyanotype"] },
    { id: "iron", n: "Fer / presse chaleur", hint: "Transfert, puff, finishing", tech: ["transfert", "serigraphie"] },
    { id: "nothing", n: "Presque rien", hint: "On te guide avec le minimum DIY", tech: ["serigraphie", "broderie", "cyanotype"] }
  ];

  var TECHS = [
    {
      id: "serigraphie",
      n: "Sérigraphie / typons",
      hint: "Séparation, trame, films d’insolation — Atelier typons",
      href: "../atelier.html",
      ready: true
    },
    {
      id: "broderie",
      n: "Broderie",
      hint: "Sens des points, patch, machine ou main (bientôt)",
      href: "#",
      ready: false
    },
    {
      id: "cyanotype",
      n: "Cyanotype",
      hint: "Négatif UV, temps d’expo, tissus (bientôt)",
      href: "#",
      ready: false
    },
    {
      id: "transfert",
      n: "Transfert / pressage",
      hint: "Miroir, couches, presse (bientôt)",
      href: "#",
      ready: false
    }
  ];

  var STEPS = ["garment", "kit", "studio", "tech", "visu"];

  var state = {
    step: "garment",
    garment: "tee",
    materials: {},
    design: { layers: [], sel: -1 },
    tech: null
  };

  try {
    var saved = JSON.parse(localStorage.getItem("atelier-diy-v1") || "null");
    if (saved && typeof saved === "object") {
      state.garment = saved.garment || state.garment;
      state.materials = saved.materials || {};
      state.tech = saved.tech || null;
    }
  } catch (e) {}

  function save() {
    try {
      localStorage.setItem(
        "atelier-diy-v1",
        JSON.stringify({
          garment: state.garment,
          materials: state.materials,
          tech: state.tech
        })
      );
    } catch (e) {}
  }

  function $(id) {
    return document.getElementById(id);
  }

  function go(step) {
    state.step = step;
    STEPS.forEach(function (s) {
      var panel = $("panel-" + s);
      var pill = $("pill-" + s);
      if (panel) panel.classList.toggle("on", s === step);
      if (pill) {
        pill.classList.toggle("on", s === step);
        var idx = STEPS.indexOf(s);
        var cur = STEPS.indexOf(step);
        pill.classList.toggle("done", idx < cur);
      }
    });
    var back = $("btn-back");
    var next = $("btn-next");
    if (back) back.disabled = step === "garment";
    if (next) {
      next.textContent =
        step === "tech" ? "Ouvrir la technique" : step === "visu" ? "Revenir au studio" : "Continuer";
    }
    if (step === "studio") Studio.render();
    if (step === "tech") renderTech();
    if (step === "visu") renderVisu();
    save();
    window.scrollTo(0, 0);
  }

  function nextStep() {
    var i = STEPS.indexOf(state.step);
    if (state.step === "tech") {
      openTech();
      return;
    }
    if (state.step === "visu") {
      go("studio");
      return;
    }
    if (i < STEPS.length - 1) go(STEPS[i + 1]);
  }

  function prevStep() {
    var i = STEPS.indexOf(state.step);
    if (i > 0) go(STEPS[i - 1]);
  }

  function renderGarments() {
    var box = $("garment-grid");
    if (!box) return;
    box.innerHTML = "";
    GARMENTS.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "card" + (state.garment === g.id ? " on" : "");
      b.innerHTML = "<b>" + g.n + "</b><small>" + g.hint + "</small>";
      b.addEventListener("click", function () {
        state.garment = g.id;
        save();
        renderGarments();
      });
      box.appendChild(b);
    });
  }

  function renderKit() {
    var box = $("kit-list");
    if (!box) return;
    box.innerHTML = "";
    MATERIALS.forEach(function (m) {
      var lab = document.createElement("label");
      lab.className = "check" + (state.materials[m.id] ? " on" : "");
      lab.innerHTML =
        '<input type="checkbox"' +
        (state.materials[m.id] ? " checked" : "") +
        '><span class="t"><b>' +
        m.n +
        "</b><small>" +
        m.hint +
        "</small></span>";
      var inp = lab.querySelector("input");
      inp.addEventListener("change", function () {
        if (inp.checked) state.materials[m.id] = true;
        else delete state.materials[m.id];
        save();
        lab.classList.toggle("on", inp.checked);
        renderTech();
      });
      box.appendChild(lab);
    });
  }

  function suggestedTechs() {
    var ids = {};
    var keys = Object.keys(state.materials);
    if (!keys.length) {
      TECHS.forEach(function (t) {
        ids[t.id] = true;
      });
      return ids;
    }
    keys.forEach(function (mid) {
      var m = MATERIALS.filter(function (x) {
        return x.id === mid;
      })[0];
      if (!m) return;
      m.tech.forEach(function (t) {
        ids[t] = true;
      });
    });
    return ids;
  }

  function renderTech() {
    var box = $("tech-grid");
    if (!box) return;
    var sug = suggestedTechs();
    box.innerHTML = "";
    TECHS.forEach(function (t) {
      if (!sug[t.id]) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "card" + (state.tech === t.id ? " on" : "");
      b.innerHTML =
        "<b>" +
        t.n +
        "</b><small>" +
        t.hint +
        "</small>" +
        (t.ready
          ? '<small style="color:var(--ok);margin-top:8px">Disponible</small>'
          : '<small style="margin-top:8px">Bientôt</small>');
      b.addEventListener("click", function () {
        state.tech = t.id;
        save();
        renderTech();
      });
      box.appendChild(b);
    });
    if (!box.children.length) {
      box.innerHTML = '<p class="hint">Coche du matériel pour voir les techniques adaptées.</p>';
    }
  }

  function openTech() {
    var t = TECHS.filter(function (x) {
      return x.id === state.tech;
    })[0];
    if (!t) {
      alert("Choisis une technique.");
      return;
    }
    if (!t.ready) {
      alert(t.n + " arrive bientôt. Pour l’instant ouvre Sérigraphie / typons.");
      return;
    }
    // Passe le contexte au module typons
    try {
      sessionStorage.setItem(
        "atelier-diy-handoff",
        JSON.stringify({
          garment: state.garment,
          materials: state.materials,
          tech: state.tech,
          svg: Studio.exportSVG()
        })
      );
    } catch (e) {}
    location.href = t.href + "?from=diy&garment=" + encodeURIComponent(state.garment);
  }

  function renderVisu() {
    var g = GARMENTS.filter(function (x) {
      return x.id === state.garment;
    })[0];
    var el = $("visu-summary");
    if (!el) return;
    el.innerHTML =
      "<p class=\"badge\">Prévisualisation</p>" +
      "<p>Pièce : <b>" +
      (g ? g.n : state.garment) +
      "</b></p>" +
      "<p class=\"muted\">Les templates photo réalistes (t-shirt, sweat, pantalon…) se branchent ici — même pipeline que le rendu Photo de l’Atelier typons (displace + multiply).</p>" +
      "<p class=\"muted\">En attendant, exporte ton SVG du studio et ouvre la technique choisie.</p>";
  }

  /* ---------- Studio SVG MVP ---------- */
  var Studio = {
    ns: "http://www.w3.org/2000/svg",
    svg: null,
    idseq: 1,

    init: function () {
      this.svg = document.createElementNS(this.ns, "svg");
      this.svg.setAttribute("viewBox", "0 0 1000 1200");
      this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      var board = $("board");
      board.innerHTML = "";
      board.appendChild(this.svg);
      this.drawGarmentGuide();
      if (!state.design.layers.length) {
        this.addText("ATELIER DIY", 500, 420, 72);
      } else {
        this.rebuild();
      }
      this.bindBoard();
      this.renderLayers();
    },

    drawGarmentGuide: function () {
      var g = document.createElementNS(this.ns, "g");
      g.setAttribute("data-guide", "1");
      g.setAttribute("pointer-events", "none");
      var path = document.createElementNS(this.ns, "path");
      // Silhouette guide simple (tee)
      path.setAttribute(
        "d",
        "M400 40 C500 90 600 40 600 40 L720 70 L980 280 L860 420 L780 360 L780 1120 L220 1120 L220 360 L140 420 L20 280 L280 70 Z"
      );
      path.setAttribute("fill", "#2a2420");
      path.setAttribute("stroke", "#ffb02e");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-dasharray", "8 8");
      path.setAttribute("opacity", "0.85");
      g.appendChild(path);
      this.svg.appendChild(g);
    },

    uid: function () {
      return "l" + this.idseq++;
    },

    addText: function (str, x, y, size) {
      var id = this.uid();
      var t = document.createElementNS(this.ns, "text");
      t.setAttribute("id", id);
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-family", "Archivo Black, sans-serif");
      t.setAttribute("font-size", size || 64);
      t.setAttribute("fill", "#ece5da");
      t.textContent = str;
      this.svg.appendChild(t);
      state.design.layers.push({ id: id, type: "text", name: str.slice(0, 24) });
      state.design.sel = state.design.layers.length - 1;
      this.renderLayers();
      this.highlight();
    },

    addRect: function () {
      var id = this.uid();
      var r = document.createElementNS(this.ns, "rect");
      r.setAttribute("id", id);
      r.setAttribute("x", 350);
      r.setAttribute("y", 480);
      r.setAttribute("width", 300);
      r.setAttribute("height", 180);
      r.setAttribute("fill", "none");
      r.setAttribute("stroke", "#ffb02e");
      r.setAttribute("stroke-width", "10");
      this.svg.appendChild(r);
      state.design.layers.push({ id: id, type: "shape", name: "Rectangle" });
      state.design.sel = state.design.layers.length - 1;
      this.renderLayers();
      this.highlight();
    },

    addCircle: function () {
      var id = this.uid();
      var c = document.createElementNS(this.ns, "circle");
      c.setAttribute("id", id);
      c.setAttribute("cx", 500);
      c.setAttribute("cy", 560);
      c.setAttribute("r", 120);
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "#ece5da");
      c.setAttribute("stroke-width", "12");
      this.svg.appendChild(c);
      state.design.layers.push({ id: id, type: "shape", name: "Cercle" });
      state.design.sel = state.design.layers.length - 1;
      this.renderLayers();
      this.highlight();
    },

    addImageFile: function (file) {
      if (!file) return;
      var self = this;
      var fr = new FileReader();
      fr.onload = function () {
        var id = self.uid();
        var img = document.createElementNS(self.ns, "image");
        img.setAttribute("id", id);
        img.setAttribute("href", fr.result);
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", fr.result);
        img.setAttribute("x", 300);
        img.setAttribute("y", 400);
        img.setAttribute("width", 400);
        img.setAttribute("height", 400);
        img.setAttribute("preserveAspectRatio", "xMidYMid meet");
        self.svg.appendChild(img);
        state.design.layers.push({ id: id, type: "image", name: file.name || "Image" });
        state.design.sel = state.design.layers.length - 1;
        self.renderLayers();
        self.highlight();
      };
      fr.readAsDataURL(file);
    },

    rebuild: function () {
      /* layers already in DOM after refresh — for persistence later */
    },

    render: function () {
      if (!this.svg) this.init();
      this.renderLayers();
      this.highlight();
    },

    renderLayers: function () {
      var box = $("layer-list");
      if (!box) return;
      box.innerHTML = "";
      state.design.layers.forEach(function (L, i) {
        var row = document.createElement("div");
        row.className = "layer" + (i === state.design.sel ? " on" : "");
        row.innerHTML = "<span>" + L.name + '</span><code>' + L.type + "</code>";
        row.addEventListener("click", function () {
          state.design.sel = i;
          Studio.renderLayers();
          Studio.highlight();
        });
        box.appendChild(row);
      });
      if (!state.design.layers.length) {
        box.innerHTML = '<p class="hint">Aucun calque — ajoute du texte, une forme ou une image.</p>';
      }
    },

    highlight: function () {
      if (!this.svg) return;
      Array.prototype.forEach.call(this.svg.querySelectorAll("[id]"), function (n) {
        n.classList.remove("sel");
      });
      var L = state.design.layers[state.design.sel];
      if (!L) return;
      var node = this.svg.getElementById(L.id);
      if (node) node.classList.add("sel");
    },

    deleteSel: function () {
      var L = state.design.layers[state.design.sel];
      if (!L) return;
      var node = this.svg.getElementById(L.id);
      if (node) node.parentNode.removeChild(node);
      state.design.layers.splice(state.design.sel, 1);
      state.design.sel = Math.min(state.design.sel, state.design.layers.length - 1);
      this.renderLayers();
      this.highlight();
    },

    editText: function () {
      var L = state.design.layers[state.design.sel];
      if (!L || L.type !== "text") {
        var txt = prompt("Texte à ajouter", "DIY");
        if (txt) this.addText(txt, 500, 500, 64);
        return;
      }
      var node = this.svg.getElementById(L.id);
      var next = prompt("Modifier le texte", node.textContent);
      if (next == null) return;
      node.textContent = next;
      L.name = next.slice(0, 24);
      this.renderLayers();
    },

    bindBoard: function () {
      var self = this;
      var drag = null;
      this.svg.addEventListener("pointerdown", function (e) {
        var t = e.target;
        if (!t || !t.id || t.getAttribute("data-guide")) return;
        var idx = -1;
        state.design.layers.forEach(function (L, i) {
          if (L.id === t.id) idx = i;
        });
        if (idx < 0) return;
        state.design.sel = idx;
        self.renderLayers();
        self.highlight();
        var pt = self.clientToSvg(e.clientX, e.clientY);
        drag = { id: t.id, ox: pt.x, oy: pt.y, node: t };
        self.svg.setPointerCapture(e.pointerId);
      });
      this.svg.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var pt = self.clientToSvg(e.clientX, e.clientY);
        var dx = pt.x - drag.ox;
        var dy = pt.y - drag.oy;
        drag.ox = pt.x;
        drag.oy = pt.y;
        var n = drag.node;
        if (n.tagName === "text" || n.tagName === "image" || n.tagName === "rect") {
          n.setAttribute("x", parseFloat(n.getAttribute("x") || 0) + dx);
          n.setAttribute("y", parseFloat(n.getAttribute("y") || 0) + dy);
        } else if (n.tagName === "circle") {
          n.setAttribute("cx", parseFloat(n.getAttribute("cx") || 0) + dx);
          n.setAttribute("cy", parseFloat(n.getAttribute("cy") || 0) + dy);
        }
      });
      ["pointerup", "pointercancel"].forEach(function (ev) {
        self.svg.addEventListener(ev, function () {
          drag = null;
        });
      });
    },

    clientToSvg: function (cx, cy) {
      var pt = this.svg.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      var m = this.svg.getScreenCTM().inverse();
      var p = pt.matrixTransform(m);
      return { x: p.x, y: p.y };
    },

    exportSVG: function () {
      if (!this.svg) return "";
      var clone = this.svg.cloneNode(true);
      var guide = clone.querySelector("[data-guide]");
      if (guide) guide.parentNode.removeChild(guide);
      return new XMLSerializer().serializeToString(clone);
    },

    downloadSVG: function () {
      var data = this.exportSVG();
      var blob = new Blob([data], { type: "image/svg+xml" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "atelier-diy.svg";
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  function bind() {
    renderGarments();
    renderKit();
    renderTech();

    $("btn-back").addEventListener("click", prevStep);
    $("btn-next").addEventListener("click", nextStep);
    STEPS.forEach(function (s) {
      var pill = $("pill-" + s);
      if (pill)
        pill.addEventListener("click", function () {
          go(s);
        });
    });

    $("tool-text").addEventListener("click", function () {
      Studio.editText();
    });
    $("tool-rect").addEventListener("click", function () {
      Studio.addRect();
    });
    $("tool-circle").addEventListener("click", function () {
      Studio.addCircle();
    });
    $("tool-image").addEventListener("click", function () {
      $("file-image").click();
    });
    $("file-image").addEventListener("change", function (e) {
      Studio.addImageFile(e.target.files[0]);
      e.target.value = "";
    });
    $("tool-del").addEventListener("click", function () {
      Studio.deleteSel();
    });
    $("tool-svg").addEventListener("click", function () {
      Studio.downloadSVG();
    });
    $("font-file").addEventListener("change", function (e) {
      var f = e.target.files[0];
      e.target.value = "";
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        var name = "UserFont" + Date.now();
        var face = new FontFace(name, fr.result);
        face.load().then(function (loaded) {
          document.fonts.add(loaded);
          var L = state.design.layers[state.design.sel];
          if (L && L.type === "text") {
            var node = Studio.svg.getElementById(L.id);
            if (node) node.setAttribute("font-family", name);
          }
          alert("Police ajoutée : " + f.name + ". Sélectionne un texte pour l’appliquer.");
        }).catch(function () {
          alert("Police illisible. Essaie un .ttf / .otf / .woff.");
        });
      };
      fr.readAsArrayBuffer(f);
    });
    $("tool-font").addEventListener("click", function () {
      $("font-file").click();
    });

    go(state.step === "studio" ? "studio" : "garment");
  }

  window.AtelierDIY = { state: state, go: go, Studio: Studio, TECHS: TECHS };
  document.addEventListener("DOMContentLoaded", bind);
})();
