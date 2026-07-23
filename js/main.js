/**
 * NEURO-CORE — harness moteur graphique (viewport portrait + anims de test).
 */
import {
  VIEW_W,
  VIEW_H,
  TIME_SCALE,
  ZOOM_MIN,
  ZOOM_MAX,
} from "./constants.js";
import { BODY_SLIDER_DEFS, defaultBodyCustom } from "./morph.js";
import { orientationFromDelta, ORIENT } from "./orientation.js";
import { gridToWorld } from "./grid.js";
import { createCamera } from "./camera.js";
import { createClock } from "./clock.js";
import { createAnimator, CLIPS, comboWindowMs } from "./animation.js";
import { createSpellRunner, getSpell } from "./spells.js";
import { renderScene } from "./renderer.js";

const svg = document.getElementById("scene");
const info = document.getElementById("info");

const state = {
  morph: "standard",
  body: defaultBodyCustom(),
  pants: "in",
  torso: "tunic",
  hat: "none",
  pantsColor: "#4a6741",
  torsoColor: "#8b5a2b",
  hatColor: "#3d2b1f",
  showAnchors: false,
  weapon: "sword",
  gridSize: 6,
};

const actors = [
  {
    id: "hero",
    col: 2,
    row: 3,
    morphId: "standard",
    orient: ORIENT.front,
    pants: "in",
    pantsColor: "#4a6741",
    torso: "tunic",
    torsoColor: "#8b5a2b",
    hat: "none",
    weapon: "sword",
  },
  {
    id: "foe",
    col: 4,
    row: 2,
    morphId: "heavy",
    orient: ORIENT.sideLeft,
    pants: "over",
    pantsColor: "#3a3028",
    torso: "tunic",
    torsoColor: "#5a4030",
    hat: "cap",
    hatColor: "#2E2E30",
    weapon: "staff",
  },
];

const camera = createCamera();
camera.frameActors(actors);

const clock = createClock({ timeScale: TIME_SCALE });
const spells = createSpellRunner();
const poses = {};

let moving = null; // { actorId, fromCol, fromRow, toCol, toRow, clip }

function syncActorVisualProps(actor) {
  if (actor.id !== "hero") return;
  actor.morphId = state.morph;
  actor.pants = state.pants;
  actor.pantsColor = state.pantsColor;
  actor.torso = state.torso;
  actor.torsoColor = state.torsoColor;
  actor.hat = state.hat;
  actor.hatColor = state.hatColor;
  actor.weapon = state.weapon;
}

function hero() {
  return actors.find((a) => a.id === "hero");
}

function foe() {
  return actors.find((a) => a.id === "foe");
}

function spellCtxFor(actor) {
  const world = gridToWorld(actor.col, actor.row);
  // Ancres simplifiées pour FX (centre / pieds suffisent au harness)
  return {
    anchors: { handR: { x: 0.25, y: -0.5 }, handL: { x: -0.25, y: -0.5 } },
    worldX: world.x,
    worldY: world.y,
    unit: 96 / 1.9,
    col: actor.col,
    row: actor.row,
    gridToWorld,
  };
}

const animator = createAnimator((hook, clipId) => {
  const h = hero();
  if (hook === "onHit") {
    clock.triggerHitStop();
    clock.openComboWindow(CLIPS[clipId].duration);
    const spellId = clipId === "cast" ? "healAura" : clipId === "attack" ? "slash" : "quake";
    const spell = getSpell(spellId);
    if (spell) spells.trigger(spellId, spellCtxFor(h), clock.scaledTime);
    info.textContent = `Hook ${hook} · ${spellId} · combo ${Math.round(comboWindowMs(clipId))}ms`;
  } else if (hook === "onStep" || hook === "onDashEnd") {
    if (moving && moving.actorId === h.id) {
      h.col = moving.toCol;
      h.row = moving.toRow;
      delete h.fromCol;
      delete h.fromRow;
      moving = null;
      camera.frameActors([h, foe()]);
    }
  } else {
    info.textContent = `Hook ${hook} (${clipId})`;
  }
});

animator.play("idle");

function playClip(id) {
  animator.play(id);
  if (id === "attack" || id === "cast") {
    camera.frameActors([hero(), foe()]);
  }
  info.textContent = `Anim: ${id} (${CLIPS[id].duration}ms) · timeScale ${TIME_SCALE}`;
}

function tryMove(dCol, dRow, clip = "walk") {
  const h = hero();
  const nc = h.col + dCol;
  const nr = h.row + dRow;
  if (nc < 0 || nr < 0 || nc >= state.gridSize || nr >= state.gridSize) {
    info.textContent = "Hors grille";
    return;
  }
  h.orient = orientationFromDelta(dCol, dRow);
  moving = {
    actorId: h.id,
    fromCol: h.col,
    fromRow: h.row,
    toCol: nc,
    toRow: nr,
  };
  h.fromCol = h.col;
  h.fromRow = h.row;
  h.col = nc;
  h.row = nr;
  playClip(clip);
}

function redraw() {
  syncActorVisualProps(hero());
  const poseMap = { ...poses };
  const sample = animator.sample();
  poseMap.hero = sample || { bobY: 0, swayX: 0 };
  if (moving) {
    poseMap.hero = {
      ...poseMap.hero,
      moveProgress: sample?.moveProgress ?? 1,
    };
    // Pendant le move, createCharacter interpole from→to ; from* sur l'acteur
  }
  poseMap.foe = { bobY: Math.sin(clock.scaledTime / 800) * 0.01, swayX: 0 };

  renderScene(svg, {
    camera,
    gridSize: state.gridSize,
    actors,
    body: state.body,
    showAnchors: state.showAnchors,
    poses: poseMap,
    spellFx: spells.active,
    scaledTime: clock.scaledTime,
  });

  // Rebind tile clicks after innerHTML clear
  svg.querySelectorAll(".tile").forEach((tile) => {
    tile.style.cursor = "pointer";
    tile.addEventListener("click", () => {
      const col = parseInt(tile.dataset.col, 10);
      const row = parseInt(tile.dataset.row, 10);
      const h = hero();
      const dCol = Math.sign(col - h.col);
      const dRow = Math.sign(row - h.row);
      if (dCol === 0 && dRow === 0) return;
      // Un pas cardinal/diagonal vers la case
      tryMove(dCol, dRow, "walk");
    });
  });
}

let last = performance.now();
function frame(now) {
  const realDt = Math.min(64, now - last);
  last = now;
  const { scaledDt, scaledTime } = clock.tick(realDt);
  const pose = animator.update(scaledDt);
  if (pose) poses.hero = pose;
  if (!animator.current) {
    animator.play("idle");
  }
  spells.update(scaledTime);
  redraw();
  requestAnimationFrame(frame);
}

/* ---------- UI bindings ---------- */
function buildBodySlidersUI() {
  const host = document.getElementById("bodySliders");
  if (!host) return;
  host.innerHTML = "";
  for (const def of BODY_SLIDER_DEFS) {
    const row = document.createElement("div");
    row.className = "slider-row";
    const lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = def.label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = def.min;
    input.max = def.max;
    input.step = def.step;
    input.value = state.body[def.key];
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = Number(state.body[def.key]).toFixed(2);
    input.addEventListener("input", () => {
      const v = parseFloat(input.value);
      state.body[def.key] = v;
      num.textContent = v.toFixed(2);
    });
    row.appendChild(lab);
    row.appendChild(input);
    row.appendChild(num);
    host.appendChild(row);
  }
}

function bindGroup(containerId, datasetKey, stateKey, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll(".ctrl-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".ctrl-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state[stateKey] = btn.dataset[datasetKey];
      if (onChange) onChange(state[stateKey]);
    });
  });
}

bindGroup("morphSelector", "morph", "morph");
bindGroup("pantsSelector", "pants", "pants");
bindGroup("torsoSelector", "torso", "torso");
bindGroup("hatSelector", "hat", "hat");
bindGroup("weaponSelector", "weapon", "weapon");

document.querySelectorAll("#chestShapeSelector .ctrl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#chestShapeSelector .ctrl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.body.chestShape = btn.dataset.chest;
  });
});

document.getElementById("resetBody")?.addEventListener("click", () => {
  state.body = defaultBodyCustom();
  buildBodySlidersUI();
  info.textContent = "Tronçons réinitialisés";
});

document.getElementById("anchorToggle")?.querySelectorAll(".ctrl-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("anchorToggle").querySelectorAll(".ctrl-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.showAnchors = btn.dataset.anchors === "on";
  });
});

document.getElementById("pantsColor")?.addEventListener("input", (e) => {
  state.pantsColor = e.target.value;
});
document.getElementById("torsoColor")?.addEventListener("input", (e) => {
  state.torsoColor = e.target.value;
});
document.getElementById("hatColor")?.addEventListener("input", (e) => {
  state.hatColor = e.target.value;
});

document.querySelectorAll("[data-anim]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.anim;
    if (id === "walk") tryMove(1, 0, "walk");
    else if (id === "dash") tryMove(0, -1, "dash");
    else playClip(id);
  });
});

document.getElementById("zoomIn")?.addEventListener("click", () => {
  camera.zoomBy(1.15);
  camera.frameActors([hero(), foe()]);
});
document.getElementById("zoomOut")?.addEventListener("click", () => {
  camera.zoomBy(1 / 1.15);
});
document.getElementById("frameBoth")?.addEventListener("click", () => {
  camera.frameActors([hero(), foe()]);
  info.textContent = `Recadrage · zoom ${camera.zoom.toFixed(2)}×`;
});

/* Pan tactile */
let panning = null;
svg.addEventListener("pointerdown", (e) => {
  if (e.target.closest?.(".tile")) return;
  panning = { id: e.pointerId, x: e.clientX, y: e.clientY };
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener("pointermove", (e) => {
  if (!panning || panning.id !== e.pointerId) return;
  const dx = e.clientX - panning.x;
  const dy = e.clientY - panning.y;
  panning.x = e.clientX;
  panning.y = e.clientY;
  const rect = svg.getBoundingClientRect();
  const sx = VIEW_W / rect.width;
  const sy = VIEW_H / rect.height;
  camera.pan(dx * sx, dy * sy);
});
svg.addEventListener("pointerup", (e) => {
  if (panning?.id === e.pointerId) panning = null;
});
svg.addEventListener("pointercancel", () => {
  panning = null;
});

/* Pinch zoom */
let pinch = null;
svg.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      pinch = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom: camera.zoom,
      };
    }
  },
  { passive: true }
);
svg.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && pinch) {
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      camera.setZoom(pinch.zoom * (dist / pinch.dist));
    }
  },
  { passive: true }
);
svg.addEventListener("touchend", () => {
  if (pinch) pinch = null;
});

buildBodySlidersUI();
info.textContent = `Moteur · ${VIEW_W}×${VIEW_H} · timeScale ${TIME_SCALE} · zoom ${ZOOM_MIN}–${ZOOM_MAX}×`;
requestAnimationFrame(frame);
