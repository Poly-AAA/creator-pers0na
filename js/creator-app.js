import { renderActor, HAIR, FACES, UNDER, MID, ARMOR, OUTER, HEADS, HANDS, FEET, BELTS, WEAPONS } from "./sprite-draw.js";
import { DIRS, listClips, clipInfo } from "./sprite-rig.js";
import { RIG_SPELLS, resolveChain, fxForElement } from "./sprite-spells.js";

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

const state = {
  species: "male",
  dir: "SE",
  anim: "idle",
  frame: 0,
  variant: 0,
  hair: "short",
  face: "calm",
  weapon: "none",
  wind: 0,
  playing: true,
  chain: null,
  chainAt: 0,
  colors: {
    skin: [214, 164, 130],
    hair: [48, 36, 28],
    eye: [42, 78, 92],
    cloth: [58, 62, 72],
    metal: [168, 172, 178],
    leather: [92, 64, 46],
    accent: [234, 112, 32],
    underwear: [186, 176, 166],
  },
  equip: { under: "shirt", mid: "none", armor: "none", outer: "none", head: "none", hands: "none", feet: "boots", belt: "belt" },
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) { return arr[(rng() * arr.length) | 0]; }

function roll() {
  const rng = mulberry32((Date.now() ^ (Math.random() * 1e9)) >>> 0);
  state.species = pick(rng, ["male", "female", "sylphe"]);
  state.hair = pick(rng, HAIR);
  state.face = pick(rng, FACES);
  state.weapon = pick(rng, WEAPONS);
  state.wind = (rng() * 3) | 0;
  state.variant = (rng() * 4) | 0;
  state.colors.skin = pick(rng, [[214, 164, 130], [168, 114, 82], [112, 74, 52], [232, 198, 170]]);
  state.colors.hair = pick(rng, [[28, 24, 22], [92, 58, 36], [186, 154, 96], [70, 78, 92]]);
  state.colors.cloth = pick(rng, [[58, 62, 72], [72, 48, 58], [48, 62, 54], [90, 54, 42]]);
  state.colors.eye = pick(rng, [[42, 78, 92], [92, 58, 36], [48, 64, 42]]);
  state.equip = {
    under: pick(rng, UNDER), mid: pick(rng, MID), armor: pick(rng, ARMOR), outer: pick(rng, OUTER),
    head: pick(rng, HEADS), hands: pick(rng, HANDS), feet: pick(rng, FEET), belt: pick(rng, BELTS),
  };
  paintChips();
}

function spec() {
  const step = state.chain && state.chain.steps[state.chainAt];
  const anim = step ? step.rig : state.anim;
  const fx = [];
  if (step && step.fx) fx.push({ kind: step.fx, hand: step.hand || "R" });
  if (state.chain && state.chain.element) fx.push(...fxForElement(state.chain.element, step && step.hand));
  return {
    species: state.species,
    dir: state.dir,
    anim,
    frame: state.frame,
    variant: state.variant,
    hair: state.hair,
    face: state.face,
    weapon: state.weapon,
    wind: state.wind,
    colors: state.colors,
    equip: state.equip,
    fx,
    mount: anim.indexOf("mount") === 0 ? anim : null,
  };
}

function draw() {
  const r = renderActor(spec());
  const img = new ImageData(new Uint8ClampedArray(r.rgba), r.w, r.h);
  ctx.putImageData(img, 0, 0);
  const step = state.chain && state.chain.steps[state.chainAt];
  const info = clipInfo(step ? step.rig : (state.anim.indexOf("mount") === 0 ? state.anim : state.anim));
  const label = step ? step.rig : state.anim;
  status.textContent = state.species + " · " + state.dir + " · " + label + " · " + info.fps;
}

let acc = 0;
let last = 0;
function tick(t) {
  if (!last) last = t;
  const dt = t - last;
  last = t;
  if (state.playing) {
    const step = state.chain && state.chain.steps[state.chainAt];
    const name = step ? step.rig : state.anim;
    const info = clipInfo(name);
    const fps = step && step.fps ? step.fps : info.fps;
    acc += dt;
    const frameMs = 1000 / fps;
    while (acc >= frameMs) {
      acc -= frameMs;
      state.frame++;
      if (state.frame >= info.frames) {
        state.frame = 0;
        if (state.chain && state.chainAt < state.chain.steps.length - 1) state.chainAt++;
        else if (state.chain && !info.loop) state.chainAt = 0;
      }
    }
    draw();
  }
  requestAnimationFrame(tick);
}

function chip(host, label, on, fn) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.classList.toggle("on", on);
  b.onclick = fn;
  host.appendChild(b);
  return b;
}

function paintChips() {
  const species = document.getElementById("species");
  species.innerHTML = "";
  ["male", "female", "sylphe", "skeleton", "specter"].forEach((id) => {
    chip(species, id === "male" ? "♂" : id === "female" ? "♀" : id === "sylphe" ? "✧" : id === "skeleton" ? "☠" : "◎", state.species === id, () => {
      state.species = id;
      paintChips();
      draw();
    });
  });
  const dirs = document.getElementById("dirs");
  dirs.innerHTML = "";
  DIRS.forEach((d) => chip(dirs, d === "front" ? "□" : d, state.dir === d, () => { state.dir = d; paintChips(); draw(); }));
  const anims = document.getElementById("anims");
  anims.innerHTML = "";
  const choices = ["idle", "walk", "run", "glide", "hit", "death", "step", "roll", "leap", "poing", "sword", "bow", "staff", "pistol", "mountIdle"];
  choices.forEach((id) => chip(anims, id === "poing" ? "👊" : id === "idle" ? "·" : id.slice(0, 3), (state.chain ? id === "poing" : state.anim === id), () => {
    if (id === "poing") {
      state.chain = resolveChain(RIG_SPELLS.find((s) => s.id === "poing_rig"));
      state.chainAt = 0;
      state.anim = "jabL";
    } else {
      state.chain = null;
      state.anim = id;
    }
    state.frame = 0;
    paintChips();
    draw();
  }));
  const slots = document.getElementById("slots");
  slots.innerHTML = "";
  const groups = { hair: HAIR, face: FACES, weapon: WEAPONS, under: UNDER, mid: MID, armor: ARMOR, outer: OUTER, head: HEADS, hands: HANDS, feet: FEET, belt: BELTS };
  Object.entries(groups).forEach(([key, values]) => {
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", key);
    values.forEach((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = key.slice(0, 2) + " " + v;
      sel.appendChild(o);
    });
    const cur = key === "hair" || key === "face" || key === "weapon" ? state[key] : state.equip[key];
    sel.value = cur;
    sel.onchange = () => {
      if (key === "hair" || key === "face" || key === "weapon") state[key] = sel.value;
      else state.equip[key] = sel.value;
      draw();
    };
    slots.appendChild(sel);
  });
  document.getElementById("wind").textContent = ["·", "≈", "≋"][state.wind];
}

document.getElementById("dice").onclick = () => { roll(); draw(); };
document.getElementById("play").onclick = () => { state.playing = !state.playing; document.getElementById("play").textContent = state.playing ? "▶" : "❚❚"; };
document.getElementById("wind").onclick = () => { state.wind = (state.wind + 1) % 3; paintChips(); draw(); };

paintChips();
draw();
requestAnimationFrame(tick);
