import {
  ANIMS, DIR_LABELS, COLS, ROWS, FRAME, applyVariant, sliceFrame,
} from "./sheet-variant.js";

const CDN = "https://cdn.jsdelivr.net/gh/Poly-AAA/creator-pers0na@f2e5a50/assets/packs/fantasy-cc/spritesheets/";
const view = document.getElementById("view");
const ctx = view.getContext("2d");
const status = document.getElementById("status");
const state = { anim: "Idle", row: 2, frame: 0, variant: true, playing: true, body: null, head: null };

function remote() {
  const host = location.hostname || "";
  return host.includes("catbox") || host.includes("litter");
}

function sheetUrl(folder, anim) {
  const file = folder + "/" + anim + ".png";
  return remote() ? CDN + file : "assets/packs/fantasy-cc/spritesheets/" + file;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
}

function imageData(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

async function loadAnim(name) {
  const [body, head] = await Promise.all([
    loadImage(sheetUrl("NakedBody", name)),
    loadImage(sheetUrl("Head1", name)),
  ]);
  state.body = imageData(body);
  state.head = imageData(head);
  state.anim = name;
  state.frame = 0;
}

function paint() {
  if (!state.body) return;
  const col = state.frame % COLS;
  const body = sliceFrame(state.body.data, state.body.width, col, state.row);
  const frame = state.variant
    ? applyVariant(body, sliceFrame(state.head.data, state.head.width, col, state.row))
    : body;
  const img = new ImageData(new Uint8ClampedArray(frame), FRAME, FRAME);
  ctx.putImageData(img, 0, 0);
  status.textContent = state.anim + " · " + DIR_LABELS[state.row] + " · " + (state.variant ? "variante" : "original");
}

function chips() {
  const anims = document.getElementById("anims");
  anims.innerHTML = "";
  for (const name of ANIMS) {
    const o = document.createElement("option");
    o.value = name;
    o.textContent = name;
    if (name === state.anim) o.selected = true;
    anims.appendChild(o);
  }
  anims.onchange = () => { loadAnim(anims.value).then(paint); chips(); };
  const dirs = document.getElementById("dirs");
  dirs.innerHTML = "";
  DIR_LABELS.forEach((label, row) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.classList.toggle("on", row === state.row);
    b.onclick = () => { state.row = row; paint(); chips(); };
    dirs.appendChild(b);
  });
}

document.getElementById("toggle").onclick = () => {
  state.variant = !state.variant;
  document.getElementById("toggle").classList.toggle("on", state.variant);
  document.getElementById("toggle").textContent = state.variant ? "Variante" : "Original";
  paint();
};
document.getElementById("play").onclick = () => {
  state.playing = !state.playing;
  document.getElementById("play").textContent = state.playing ? "▶" : "❚❚";
};

let acc = 0;
let last = 0;
function tick(t) {
  if (!last) last = t;
  const dt = t - last;
  last = t;
  if (state.playing && state.body) {
    acc += dt;
    while (acc >= 1000 / 14) {
      acc -= 1000 / 14;
      state.frame = (state.frame + 1) % COLS;
      paint();
    }
  }
  requestAnimationFrame(tick);
}

chips();
loadAnim("Idle").then(paint);
requestAnimationFrame(tick);
