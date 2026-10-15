/**
 * Contrôles visuels du rig : ancre, cadre, trous, prises, boucles.
 * Pas de simulation de partie.
 */
import { readFileSync } from "node:fs";
import {
  DIRS, listClips, clipInfo, samplePose, jointDelta, blendPose, footMid,
  sampleMount, toScreen, ANCHOR,
} from "./sprite-rig.js";
import {
  renderActor, countHoles, opaqueCount, hashFrame, nearJoint, MAT,
  HAIR, UNDER, MID, ARMOR, OUTER, HEADS, HANDS, FEET, BELTS, WEAPONS,
  sheet,
} from "./sprite-draw.js";
import { RIG_SPELLS, resolveChain, isProtectedSpell } from "./sprite-spells.js";

const SPECIES = ["male", "female", "sylphe", "skeleton", "specter"];
const FAMILY = {
  sword: "sword", dagger: "dagger", bow: "bow", staff: "staff",
  pistol: "pistol", rifle: "rifle", future: "future", hold: "sword",
};

function push(issues, ok, msg) {
  if (!ok) issues.push(msg);
}

function planted(joints) {
  const f = joints.feet;
  return Math.hypot(f.x - ANCHOR, f.y - ANCHOR);
}

export function auditAll() {
  const issues = [];
  const user = JSON.parse(readFileSync("data/user-spells.json", "utf8"));
  push(issues, user.map((s) => s.id).join() === "punch,coup_de_pied,roulade", "le grimoire écrit a changé");
  const brut = user[0];
  push(issues, brut.evoConfig["1:Brise-Os"].anim === "Attack2" && brut.evoConfig["1:Brise-Os"].fps === 12, "Brise-Os");
  push(issues, brut.evoConfig["1:Rapide"].enabled === false && brut.evoConfig["1:Rapide"].anim === "Kick", "Rapide");
  push(issues, brut.evoConfig["2:Double Impact"].slash === "Slash2" && brut.evoConfig["2:Double Impact"].enabled === false, "Double Impact");
  push(issues, user.every((s) => !s.lab), "un sort de labo est dans le grimoire");
  RIG_SPELLS.forEach((s) => push(issues, !isProtectedSpell(s) && s.lab, "sort labo mal marqué " + s.id));

  const chain = resolveChain(RIG_SPELLS.find((s) => s.id === "poing_rig"), [
    { tier: 1, name: "Direct" },
    { tier: 2, name: "Repousse" },
    { tier: 3, name: "Foudre" },
  ]);
  push(issues, chain.steps.map((s) => s.rig).join() === "jabL,crossR,pushR,jabR", "chaîne poing " + chain.steps.map((s) => s.rig).join());
  push(issues, chain.steps[0].hand === "L" && chain.steps[1].hand === "R", "mains de la chaîne");
  push(issues, chain.element === "lightning" && chain.turns === 2, "un seul élément");
  const fireThen = resolveChain(RIG_SPELLS.find((s) => s.id === "poing_rig"), [
    { tier: 2, name: "Poings de feu" },
    { tier: 3, name: "Foudre" },
  ]);
  push(issues, fireThen.element === "lightning", "la foudre doit remplacer le feu");
  chain.steps.forEach((s) => {
    push(issues, s.delay === 0 && s.fps >= 12 && s.fps <= 17, "fps/delay " + s.rig);
  });

  const jab = samplePose("jabL", 3, 0);
  const cross = samplePose("crossR", 3, 0);
  push(issues, jab.handL.z > jab.handR.z + 6, "jab gauche n'avance pas la main gauche");
  push(issues, cross.handR.z > samplePose("idle", 0, 0).handR.z + 4, "direct droit");
  push(issues, jointDelta(samplePose("jabL", 0, 0), samplePose("jabL", 7, 0)) < 0.2, "le jab ne revient pas à la garde");
  push(issues, jointDelta(blendPose(samplePose("jabL", 7, 0), samplePose("crossR", 0, 0), 0), samplePose("jabL", 7, 0)) < 0.05, "transition");
  push(issues, jointDelta(samplePose("jabL", 7, 0), samplePose("crossR", 0, 0)) < 1.5, "raccord de combo");

  for (const name of listClips()) {
    const info = clipInfo(name);
    push(issues, info.fps >= 12 && info.fps <= 17, name + " fps " + info.fps);
    let prev = null;
    let maxStep = 0;
    for (let f = 0; f < info.frames; f++) {
      const pose = info.mount ? null : samplePose(name, f, 0);
      if (pose && prev) maxStep = Math.max(maxStep, jointDelta(prev, pose));
      if (pose) prev = pose;
    }
    if (!info.mount && info.loop) {
      const wrap = jointDelta(samplePose(name, info.frames - 1, 0), samplePose(name, 0, 0));
      push(issues, wrap <= maxStep + 0.75, name + " boucle saute " + wrap.toFixed(2) + " > " + maxStep.toFixed(2));
    }
    if (!info.mount) push(issues, maxStep < 16, name + " pas trop grand " + maxStep.toFixed(2));
  }
  for (let v = 0; v < 4; v++) {
    const info = clipInfo("idle");
    const wrap = jointDelta(samplePose("idle", info.frames - 1, v), samplePose("idle", 0, v));
    push(issues, wrap < 2.5, "idle variante " + v + " boucle " + wrap.toFixed(2));
  }

  for (const species of SPECIES) {
    for (const dir of DIRS) {
      for (const name of listClips()) {
        const info = clipInfo(name);
        if (info.mount) continue;
        const weapon = FAMILY[info.family] || "none";
        for (let frame = 0; frame < info.frames; frame++) {
          const spec = {
            species, dir, anim: name, frame, variant: 0,
            hair: species === "skeleton" ? "bald" : "short",
            weapon, wind: 1,
            equip: { feet: "boots", belt: "belt" },
          };
          const r = renderActor(spec);
          const tag = species + " " + dir + " " + name + "#" + frame;
          push(issues, r.clipped === 0, tag + " sort du cadre");
          push(issues, countHoles(r.mat) === 0, tag + " trous " + countHoles(r.mat));
          push(issues, opaqueCount(r.mat) > 350, tag + " trop peu de pixels");
          const plant = planted(r.joints);
          const end = frame === 0 || frame === info.frames - 1;
          if ((name === "idle" || name === "hold" || name === "hit" || info.attack || info.family) && end) {
            push(issues, plant < 1.25, tag + " pieds " + plant.toFixed(2));
          }
          if (info.move && frame === info.frames - 1) {
            push(issues, plant < 1.25, tag + " n'atterrit pas " + plant.toFixed(2));
          }
          if (weapon !== "none") {
            const id = weapon === "bow" || weapon === "staff" ? MAT.wood : MAT.metal;
            const dist = nearJoint(r.mat, r.joints, "handR", id);
            push(issues, dist < 3.5, tag + " arme loin de la main " + dist.toFixed(2));
          }
          if (frame === 0) {
            const again = renderActor(spec);
            push(issues, hashFrame(again.rgba) === hashFrame(r.rgba), tag + " rendu instable");
          }
        }
      }
    }
  }

  for (const dir of DIRS) {
    for (const anim of ["mountIdle", "mountWalk", "mountRun"]) {
      const info = clipInfo(anim);
      for (let frame = 0; frame < info.frames; frame++) {
        const r = renderActor({ species: "male", dir, mount: anim, frame, hair: "short" });
        const tag = "monture " + dir + " " + anim + "#" + frame;
        push(issues, r.clipped === 0 && countHoles(r.mat) === 0, tag);
        if (frame === 0 || frame === info.frames - 1) {
          const hooves = ["hoofFL", "hoofFR", "hoofBL", "hoofBR"].map((k) => r.mount[k]);
          const mid = {
            x: (hooves[0].x + hooves[1].x + hooves[2].x + hooves[3].x) / 4,
            y: (hooves[0].y + hooves[1].y + hooves[2].y + hooves[3].y) / 4,
            z: (hooves[0].z + hooves[1].z + hooves[2].z + hooves[3].z) / 4,
          };
          const s = toScreen(mid, dir);
          push(issues, Math.hypot(s.x - ANCHOR, s.y - ANCHOR) < 2.5, tag + " sabots " + s.x.toFixed(1) + "," + s.y.toFixed(1));
        }
      }
    }
  }

  for (const dir of DIRS) {
    const covered = renderActor({
      species: "male", dir, anim: "idle", frame: 0, hair: "bald",
      equip: { armor: "plate", head: "none" },
    });
    let metal = 0;
    let skin = 0;
    for (let i = 0; i < covered.mat.length; i++) {
      if (covered.mat[i] === MAT.metal) metal++;
      if (covered.mat[i] === MAT.skin) skin++;
    }
    push(issues, metal > 40 && skin > 40, dir + " plaque sans peau visible ou sans métal");
  }

  const calm = renderActor({ species: "female", dir: "SE", anim: "idle", frame: 2, hair: "long", wind: 0, equip: { outer: "cape" } });
  const strong = renderActor({ species: "female", dir: "SE", anim: "idle", frame: 2, hair: "long", wind: 2, equip: { outer: "cape" } });
  let diff = 0;
  for (let i = 0; i < calm.rgba.length; i += 4) {
    if (calm.rgba[i] !== strong.rgba[i] || calm.rgba[i + 3] !== strong.rgba[i + 3]) diff++;
  }
  push(issues, diff > 20, "le vent ne déplace pas la cape (" + diff + ")");

  const slots = { under: UNDER, mid: MID, armor: ARMOR, outer: OUTER, head: HEADS, hands: HANDS, feet: FEET, belt: BELTS };
  for (const dir of DIRS) {
    for (const [slot, values] of Object.entries(slots)) {
      for (const value of values) {
        const equip = { [slot]: value };
        const r = renderActor({ species: "male", dir, anim: "idle", frame: 0, hair: "short", equip, weapon: "none" });
        push(issues, r.clipped === 0 && countHoles(r.mat) === 0, "pièce " + slot + "=" + value + " " + dir);
      }
    }
    for (const weapon of WEAPONS) {
      if (weapon === "none") continue;
      const r = renderActor({ species: "female", dir, anim: "hold", frame: 0, hair: "crop", weapon });
      const id = weapon === "bow" || weapon === "staff" ? MAT.wood : MAT.metal;
      push(issues, nearJoint(r.mat, r.joints, "handR", id) < 3.5, "prise " + weapon + " " + dir);
    }
  }

  const hashes = {};
  const canon = [
    ["male-se", { species: "male", dir: "SE", anim: "idle", frame: 0, hair: "short" }],
    ["female-front", { species: "female", dir: "front", anim: "idle", frame: 1, hair: "tied", face: "soft" }],
    ["sylphe-sw", { species: "sylphe", dir: "SW", anim: "walk", frame: 2, hair: "crop" }],
    ["skeleton", { species: "skeleton", dir: "NE", anim: "idle", frame: 0, hair: "bald" }],
    ["cape", { species: "male", dir: "NW", anim: "idle", frame: 4, hair: "long", wind: 2, equip: { outer: "cape" } }],
    ["sword", { species: "male", dir: "SE", anim: "sword", frame: 3, weapon: "sword" }],
  ];
  for (const [id, spec] of canon) hashes[id] = hashFrame(renderActor(spec).rgba);

  return { issues, hashes };
}

export function contactSheets() {
  const sheets = {};
  const take = (list) => list.map((spec) => renderActor(spec));
  sheets.directions = sheet(take(DIRS.map((dir) => ({ species: "male", dir, anim: "idle", frame: 0, hair: "short", face: "calm" }))), 5);
  sheets.species = sheet(take(["male", "female", "sylphe", "skeleton", "specter"].map((species) => ({
    species, dir: "SE", anim: "idle", frame: 0, hair: species === "skeleton" ? "bald" : "short",
  }))), 5);
  sheets.idle = sheet(take([0, 1, 2, 3].flatMap((variant) => [0, 3, 5, 8].map((frame) => ({
    species: "male", dir: "SE", anim: "idle", frame, variant, hair: "short",
  })))), 4);
  sheets.walk = sheet(take([0, 1, 2, 3, 4, 5, 6, 7].map((frame) => ({
    species: "male", dir: "SE", anim: "walk", frame, hair: "short",
  }))), 8);
  sheets.poing = sheet(take(["jabL", "jabR", "crossL", "crossR", "hookL", "hookR", "upperL", "upperR", "pushL", "pushR"].map((anim) => ({
    species: "male", dir: "SE", anim, frame: 3, hair: "crop",
  }))), 5);
  sheets.moves = sheet(take(DIRS.filter((d) => d !== "front").flatMap((dir) => ["step", "roll", "leap"].map((anim) => ({
    species: "male", dir, anim, frame: clipInfo(anim).frames - 1, hair: "short",
  })))), 4);
  sheets.wind = sheet(take([0, 1, 2].map((wind) => ({
    species: "female", dir: "SE", anim: "idle", frame: 2, hair: "long", wind, equip: { outer: "cape" },
  }))), 3);
  sheets.armes = sheet(take(WEAPONS.filter((w) => w !== "none").map((weapon) => ({
    species: "male", dir: "SE", anim: "hold", frame: 0, hair: "short", weapon,
  }))), 4);
  const rng = mulberry32(20261015);
  const pick = (arr) => arr[(rng() * arr.length) | 0];
  const randomSpecs = [];
  for (let i = 0; i < 8; i++) {
    randomSpecs.push({
      species: pick(["male", "female", "sylphe"]),
      dir: "SE",
      anim: "idle",
      frame: i % 10,
      hair: pick(HAIR),
      face: pick(["calm", "stern", "soft"]),
      weapon: pick(WEAPONS),
      wind: i % 3,
      colors: {
        skin: pick([[214, 164, 130], [168, 114, 82], [112, 74, 52], [232, 198, 170]]),
        hair: pick([[32, 28, 26], [92, 58, 36], [186, 154, 96], [70, 78, 92]]),
        cloth: pick([[58, 62, 72], [72, 48, 58], [48, 62, 54], [234, 112, 32]]),
        metal: pick([[168, 172, 178], [120, 128, 136], [90, 96, 104]]),
        eye: pick([[42, 78, 92], [92, 58, 36], [40, 48, 40]]),
      },
      equip: {
        under: pick(UNDER), mid: pick(MID), armor: pick(ARMOR), outer: pick(OUTER),
        head: pick(HEADS), hands: pick(HANDS), feet: pick(FEET), belt: pick(BELTS),
      },
    });
  }
  sheets.aleatoire = sheet(take(randomSpecs), 4);
  sheets.summons = sheet(take([
    { species: "skeleton", dir: "SE", anim: "idle", frame: 0, hair: "bald" },
    { species: "specter", dir: "SE", anim: "cast", frame: 3, hair: "bald" },
    { species: "male", dir: "SE", mount: "mountIdle", frame: 0, hair: "short" },
    { species: "female", dir: "front", anim: "idle", frame: 0, hair: "long", face: "soft" },
  ]), 4);
  return sheets;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function actorHeight(spec) {
  const r = renderActor(spec);
  let miny = FRAME;
  let maxy = 0;
  for (let y = 0; y < r.h; y++) {
    for (let x = 0; x < r.w; x++) {
      if (!r.mat[y * r.w + x] || r.mat[y * r.w + x] === MAT.shadow) continue;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
  }
  return maxy - miny + 1;
}

const FRAME = 192;
