import {
  TILE_W,
  TILE_H,
  VIEW_W,
  VIEW_H,
  CHAR_H,
  MORPH_UNIT,
  PALETTE,
} from "./constants.js";
import { gridToWorld, sortActorsByDepth } from "./grid.js";
import { resolveMorph, defaultBodyCustom } from "./morph.js";
import { projectRig, getAnchors, layerOrderFor, bodyTransform } from "./rig.js";
import { placeWeaponLocal } from "./equipment.js";
import {
  buildLegBack,
  buildLegFront,
  buildArmBack,
  buildArmFront,
  buildTorso,
  buildHead,
  buildPantsLeg,
  buildPantsWaist,
  buildTunic,
  buildCap,
} from "./body.js";
import { el, createPath, createEllipse } from "./svg.js";

/**
 * Dessine la grille iso (taille de case fixe — zoom caméra séparé).
 */
export function drawGrid(parent, gridSize) {
  const g = el("g", { class: "tiles" });
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const { x: cx, y: cy } = gridToWorld(col, row);
      const hw = TILE_W / 2;
      const hh = TILE_H / 2;
      const d = `M ${cx} ${cy - hh} L ${cx + hw} ${cy} L ${cx} ${cy + hh} L ${cx - hw} ${cy} Z`;
      const shade = (row + col) % 2 === 0 ? "light" : "dark";
      const fill = shade === "light" ? PALETTE.tileLight : PALETTE.tileDark;
      const tile = createPath(d, fill, PALETTE.ink, 1.2);
      tile.classList.add("tile", shade);
      tile.dataset.row = row;
      tile.dataset.col = col;
      g.appendChild(tile);
    }
  }
  parent.appendChild(g);
  return g;
}

function buildWeaponNodes(placed, unit) {
  if (!placed) return [];
  const nodes = [];
  const deg = (placed.rotation * 180) / Math.PI;
  const g = el("g", {
    class: "weapon",
    transform: `translate(${placed.x * unit}, ${placed.y * unit}) rotate(${deg})`,
    "data-hand-local": placed.handLocal,
    "data-hand-screen": placed.mount.primaryHand,
  });
  g.appendChild(
    createPath(placed.localPath, placed.color, PALETTE.ink, 1.2)
  );
  if (placed.guard) {
    g.appendChild(
      el("path", {
        d: placed.guard,
        fill: "none",
        stroke: PALETTE.ink,
        "stroke-width": 2,
      })
    );
  }
  nodes.push(g);
  return nodes;
}

function buildAnchorMarkers(anchors, unit) {
  const nodes = [];
  const colors = {
    head: "#ff6b6b",
    neck: "#ffa07a",
    shoulderL: "#6fd8c8",
    shoulderR: "#6fd8c8",
    elbowL: "#34d399",
    elbowR: "#34d399",
    waistL: "#f0c040",
    waistR: "#f0c040",
    hip: "#f0c040",
    bodyCenter: "#E8590C",
    gluteL: "#fb923c",
    gluteR: "#fb923c",
    handL: "#a78bfa",
    handR: "#a78bfa",
    footL: "#60a5fa",
    footR: "#60a5fa",
    pivot: "#ff0044",
  };
  for (const [name, pos] of Object.entries(anchors)) {
    const r = name === "pivot" ? 0.035 * unit : 0.026 * unit;
    const e = createEllipse(
      pos.x * unit,
      pos.y * unit,
      r,
      r,
      colors[name] || "#fff",
      "#000",
      1
    );
    e.setAttribute("opacity", "0.85");
    e.dataset.anchor = name;
    nodes.push(e);
  }
  return nodes;
}

/**
 * Assemble un personnage SVG (pivot pieds).
 */
export function createCharacterNode(actor, options = {}) {
  const {
    body,
    showAnchors = false,
    pose = { bobY: 0, swayX: 0 },
  } = options;

  const morph = resolveMorph(actor.morphId, actor.body || body || defaultBodyCustom());
  const m = projectRig(morph, actor.orient);
  const unit = MORPH_UNIT;
  const world = gridToWorld(actor.col, actor.row);

  // Interpolation marche / dash
  let wx = world.x;
  let wy = world.y;
  if (actor.fromCol != null && pose.moveProgress != null) {
    const from = gridToWorld(actor.fromCol, actor.fromRow);
    const t = pose.moveProgress;
    wx = from.x + (world.x - from.x) * t;
    wy = from.y + (world.y - from.y) * t;
  }

  const root = el("g", {
    class: "character",
    "data-id": actor.id,
    "data-orient": actor.orient,
    transform: `translate(${wx + (pose.swayX || 0) * unit}, ${wy + (pose.bobY || 0) * unit})`,
  });
  root.style.pointerEvents = "none";

  const bodyG = el("g", {
    class: "body-facing",
    transform: bodyTransform(m),
  });
  root.appendChild(bodyG);

  const order = layerOrderFor(actor.orient);
  const layers = {};
  for (const name of order) {
    layers[name] = el("g", { class: `layer layer-${name}`, "data-layer": name });
    bodyG.appendChild(layers[name]);
  }

  const builders = {
    legBack: () => buildLegBack(m, unit),
    legFront: () => buildLegFront(m, unit),
    armBack: () => buildArmBack(m, unit),
    armFront: () => buildArmFront(m, unit),
    torso: () => buildTorso(m, unit),
    head: () => buildHead(m, unit),
  };

  for (const [name, fn] of Object.entries(builders)) {
    if (layers[name]) for (const n of fn()) layers[name].appendChild(n);
  }

  // Équipements vêtements (suivent morph)
  if (actor.pants && actor.pants !== "none") {
    for (const n of buildPantsLeg(m, unit, "back", actor.pants, actor.pantsColor || "#4a6741")) {
      layers.legBack?.appendChild(n);
    }
    for (const n of buildPantsWaist(m, unit, actor.pantsColor || "#4a6741")) {
      layers.torso?.appendChild(n);
    }
    for (const n of buildPantsLeg(m, unit, "front", actor.pants, actor.pantsColor || "#4a6741")) {
      layers.legFront?.appendChild(n);
    }
  }
  if (actor.torso === "tunic") {
    for (const n of buildTunic(m, unit, actor.torsoColor || "#8b5a2b")) {
      layers.torso?.appendChild(n);
    }
  }
  if (actor.hat === "cap") {
    for (const n of buildCap(m, unit, actor.hatColor || "#3d2b1f")) {
      layers.head?.appendChild(n);
    }
  }

  // Arme — taille fixe, ancrée main dominante locale (miroir SVG)
  if (actor.weapon && actor.weapon !== "none") {
    const placed = placeWeaponLocal(m, actor.weapon);
    if (placed && layers.weapon) {
      for (const n of buildWeaponNodes(placed, unit)) layers.weapon.appendChild(n);
    }
  }

  if (showAnchors && layers.anchors) {
    for (const n of buildAnchorMarkers(getAnchors(m), unit)) {
      layers.anchors.appendChild(n);
    }
  }

  if (layers.meta) {
    const pivot = createEllipse(0, 0, 0.03 * unit, 0.03 * unit, "#ff0044", "#ff0044", 1.5);
    pivot.setAttribute("opacity", "0.7");
    layers.meta.appendChild(pivot);
  }

  return root;
}

/**
 * Dessine un FX de sort.
 */
export function drawSpellFx(parent, fx, scaledTime) {
  const life = (scaledTime - fx.bornAt) / (fx.endsAt - fx.bornAt);
  const r = fx.spell.radius * MORPH_UNIT * (0.6 + life * 0.8);
  const opacity = Math.max(0, 1 - life);
  const e = createEllipse(fx.pos.x, fx.pos.y, r, r * 0.55, fx.spell.color, fx.spell.color, 1.5);
  e.setAttribute("opacity", String(opacity * 0.55));
  e.setAttribute("class", `spell-fx aura-${fx.pos.layer}`);
  parent.appendChild(e);
}

/**
 * Rendu complet : fond → caméra → monde (grille + acteurs triés + FX).
 */
export function renderScene(svg, state) {
  const {
    camera,
    gridSize,
    actors,
    body,
    showAnchors,
    poses = {},
    spellFx = [],
    scaledTime = 0,
  } = state;

  svg.setAttribute("viewBox", `0 0 ${VIEW_W} ${VIEW_H}`);
  svg.innerHTML = "";

  // Fond viewport
  const bg = el("rect", {
    x: 0,
    y: 0,
    width: VIEW_W,
    height: VIEW_H,
    fill: PALETTE.bg,
  });
  svg.appendChild(bg);

  const cam = el("g", {
    class: "camera",
    transform: camera.transform(),
  });
  svg.appendChild(cam);

  const world = el("g", { class: "world" });
  cam.appendChild(world);

  drawGrid(world, gridSize);

  const auraBehind = el("g", { class: "aura-behind" });
  const actorsLayer = el("g", { class: "actors" });
  const auraFront = el("g", { class: "aura-front" });
  world.appendChild(auraBehind);
  world.appendChild(actorsLayer);
  world.appendChild(auraFront);

  for (const fx of spellFx) {
    const host = fx.pos.layer === "front" ? auraFront : auraBehind;
    drawSpellFx(host, fx, scaledTime);
  }

  const sorted = sortActorsByDepth(actors);
  for (const actor of sorted) {
    const pose = poses[actor.id] || { bobY: 0, swayX: 0 };
    actorsLayer.appendChild(
      createCharacterNode(actor, { body, showAnchors, pose })
    );
  }

  // HUD tactile bas (zone indicative Select Target)
  const hud = el("g", { class: "touch-hud", transform: `translate(0, ${VIEW_H - 120})` });
  svg.appendChild(hud);
  return { cam, world };
}
