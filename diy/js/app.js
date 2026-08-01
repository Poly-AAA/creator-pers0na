/**
 * ATELIER DIY — hub de routage technique
 * Pas d'éditeur vectoriel complet : import + orientation vers outils autonomes.
 */
(function () {
  "use strict";

  var GARMENTS = [
    { id: "tee", n: "T-shirt", hint: "Coton / jersey" },
    { id: "sweat", n: "Sweat", hint: "Molleton" },
    { id: "hoodie", n: "Hoodie", hint: "Capuche + poche" },
    { id: "tote", n: "Tote bag", hint: "Canvas" },
    { id: "pants", n: "Pantalon", hint: "Cuisse / poche" },
    { id: "patch", n: "Patch", hint: "Écusson" }
  ];

  var MATERIALS = [
    { id: "frames", n: "Cadres sérigraphie", hint: "Écrans + racle + encre", tech: ["serigraphie"] },
    { id: "printer", n: "Imprimante", hint: "Films / cyanotype / transfert", tech: ["serigraphie", "cyanotype", "transfert"] },
    { id: "cyanotype", n: "Chimie cyanotype", hint: "UV + tissus naturels", tech: ["cyanotype"] },
    { id: "iron", n: "Fer / presse", hint: "Transfert, finishing", tech: ["transfert", "serigraphie"] },
    { id: "cutter", n: "Découpe / ciseaux", hint: "Patch, appliqué", tech: ["patch"] },
    { id: "emb-machine", n: "Machine à broder", hint: "Plus tard → Ink/Stitch", tech: ["broderie"] },
    { id: "emb-hand", n: "Broderie main", hint: "Plus tard → guide de points", tech: ["broderie"] },
    { id: "nothing", n: "Presque rien", hint: "On montre quand même les sorties utiles", tech: ["serigraphie", "cyanotype", "patch"] }
  ];

  var TECHS = [
    {
      id: "serigraphie",
      n: "Typons sérigraphie",
      hint: "Trame, séparation, films — outil autonome",
      href: "../atelier.html",
      ready: true
    },
    {
      id: "cyanotype",
      n: "Cyanotype",
      hint: "Négatif haute densité, 1 canal + inversion",
      href: "cyanotype.html",
      ready: true
    },
    {
      id: "patch",
      n: "Patch / découpe",
      hint: "Contour + marge merrow (bientôt)",
      href: "#",
      ready: false
    },
    {
      id: "broderie",
      n: "Broderie",
      hint: "SVG Ink/Stitch — en dernier",
      href: "#",
      ready: false
    },
    {
      id: "transfert",
      n: "Transfert",
      hint: "Miroir + densité (bientôt)",
      href: "#",
      ready: false
    }
  ];

  var STEPS = ["garment", "kit", "import", "tech"];

  var state = {
    step: "garment",
    garment: "tee",
    materials: {},
    tech: "serigraphie",
    file: null // { name, type, dataUrl, w, h }
  };

  try {
    var saved = JSON.parse(localStorage.getItem("atelier-diy-hub-v2") || "null");
    if (saved) {
      state.garment = saved.garment || state.garment;
      state.materials = saved.materials || {};
      state.tech = saved.tech || state.tech;
    }
  } catch (e) {}

  function save() {
    try {
      localStorage.setItem(
        "atelier-diy-hub-v2",
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
        pill.classList.toggle("done", STEPS.indexOf(s) < STEPS.indexOf(step));
      }
    });
    $("btn-back").disabled = step === "garment";
    $("btn-next").textContent = step === "tech" ? "Ouvrir l’outil" : "Continuer";
    if (step === "tech") renderTech();
    save();
    window.scrollTo(0, 0);
  }

  function nextStep() {
    if (state.step === "tech") return openTech();
    var i = STEPS.indexOf(state.step);
    if (i < STEPS.length - 1) go(STEPS[i + 1]);
  }

  function prevStep() {
    var i = STEPS.indexOf(state.step);
    if (i > 0) go(STEPS[i - 1]);
  }

  function renderGarments() {
    var box = $("garment-grid");
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
        lab.classList.toggle("on", inp.checked);
        save();
      });
      box.appendChild(lab);
    });
  }

  function suggested() {
    var ids = {};
    var keys = Object.keys(state.materials);
    if (!keys.length) {
      // défaut utile sans kit : typons + cyanotype
      ids.serigraphie = true;
      ids.cyanotype = true;
      if (state.garment === "patch") ids.patch = true;
      return ids;
    }
    keys.forEach(function (mid) {
      var m = MATERIALS.filter(function (x) {
        return x.id === mid;
      })[0];
      if (m) m.tech.forEach(function (t) {
        ids[t] = true;
      });
    });
    if (state.garment === "patch") ids.patch = true;
    return ids;
  }

  function renderTech() {
    var box = $("tech-grid");
    var sug = suggested();
    box.innerHTML = "";
    TECHS.forEach(function (t) {
      if (!sug[t.id] && t.ready) {
        // toujours montrer les outils prêts, même hors suggestion
      } else if (!sug[t.id] && !t.ready) {
        return;
      }
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
          ? '<small class="ok">Outil autonome</small>'
          : '<small>Plus tard</small>');
      b.addEventListener("click", function () {
        state.tech = t.id;
        save();
        renderTech();
      });
      box.appendChild(b);
    });
  }

  function handoffPayload() {
    return {
      garment: state.garment,
      materials: state.materials,
      tech: state.tech,
      file: state.file
        ? { name: state.file.name, type: state.file.type, dataUrl: state.file.dataUrl }
        : null
    };
  }

  function openTech() {
    var t = TECHS.filter(function (x) {
      return x.id === state.tech;
    })[0];
    if (!t) {
      alert("Choisis une sortie.");
      return;
    }
    if (!t.ready) {
      alert(t.n + " n’est pas encore un outil autonome. Ouvre Typons ou Cyanotype.");
      return;
    }
    try {
      sessionStorage.setItem("atelier-diy-handoff", JSON.stringify(handoffPayload()));
    } catch (e) {}
    location.href = t.href + "?from=diy&garment=" + encodeURIComponent(state.garment);
  }

  function setImport(file, dataUrl, w, h) {
    state.file = { name: file.name, type: file.type || "image/*", dataUrl: dataUrl, w: w, h: h };
    $("import-preview").hidden = false;
    $("import-img").src = dataUrl;
    $("import-meta").textContent =
      file.name + " · " + (w && h ? w + "×" + h + " px · " : "") + Math.round((dataUrl.length * 3) / 4 / 1024) + " Ko";
  }

  function clearImport() {
    state.file = null;
    $("import-preview").hidden = true;
    $("import-img").removeAttribute("src");
    $("import-meta").textContent = "—";
  }

  function loadFile(file) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      var dataUrl = fr.result;
      if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) {
        // Prévisualisation SVG via blob image
        var img = new Image();
        img.onload = function () {
          setImport(file, dataUrl, img.naturalWidth || 0, img.naturalHeight || 0);
        };
        img.onerror = function () {
          setImport(file, dataUrl, 0, 0);
        };
        img.src = dataUrl;
        return;
      }
      var img = new Image();
      img.onload = function () {
        setImport(file, dataUrl, img.naturalWidth, img.naturalHeight);
      };
      img.onerror = function () {
        alert("Fichier illisible.");
      };
      img.src = dataUrl;
    };
    fr.readAsDataURL(file);
  }

  function bind() {
    renderGarments();
    renderKit();
    renderTech();

    $("btn-back").addEventListener("click", prevStep);
    $("btn-next").addEventListener("click", nextStep);
    STEPS.forEach(function (s) {
      $("pill-" + s).addEventListener("click", function () {
        go(s);
      });
    });

    $("btn-import").addEventListener("click", function () {
      $("file-import").click();
    });
    $("file-import").addEventListener("change", function (e) {
      loadFile(e.target.files[0]);
      e.target.value = "";
    });
    $("btn-clear-import").addEventListener("click", clearImport);

    go("garment");
  }

  window.AtelierDIY = { state: state, go: go, TECHS: TECHS };
  document.addEventListener("DOMContentLoaded", bind);
})();
