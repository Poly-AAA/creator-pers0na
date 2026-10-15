/**
 * Planches de la variante sur chaque animation d'origine.
 *   node scripts/variant-sheets.js
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decodePNG, encodePNG } from "../js/sprite-png.js";
import {
  ANIMS, COLS, ROWS, FRAME, applyVariant, sliceFrame, blitFrame, frameDrift,
} from "../js/sheet-variant.js";

const root = "assets/packs/fantasy-cc/spritesheets";
const outDir = "docs/previews/sprites/variante";
mkdirSync(outDir, { recursive: true });

const issues = [];
for (const anim of ANIMS) {
  const body = decodePNG(readFileSync(root + "/NakedBody/" + anim + ".png"));
  const head = decodePNG(readFileSync(root + "/Head1/" + anim + ".png"));
  const sheet = new Uint8Array(body.w * body.h * 4);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const b = sliceFrame(body.rgba, body.w, col, row);
      const h = sliceFrame(head.rgba, head.w, col, row);
      const v = applyVariant(b, h);
      const drift = frameDrift(b, h, v);
      if (drift.length) issues.push(anim + " " + row + " " + col + " " + drift[0]);
      blitFrame(sheet, body.w, v, col, row);
    }
  }
  writeFileSync(outDir + "/" + anim + ".png", encodePNG(sheet, body.w, body.h));
}

const idleB = decodePNG(readFileSync(root + "/NakedBody/Idle.png"));
const idleH = decodePNG(readFileSync(root + "/Head1/Idle.png"));
const z = 3;
const apercu = new Uint8Array(COLS * FRAME * z * 2 * FRAME * z * 4);
function stamp(frame, col, line) {
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < FRAME; x++) {
      const s = (y * FRAME + x) * 4;
      for (let dy = 0; dy < z; dy++) {
        for (let dx = 0; dx < z; dx++) {
          const X = col * FRAME * z + x * z + dx;
          const Y = line * FRAME * z + y * z + dy;
          const d = (Y * COLS * FRAME * z + X) * 4;
          apercu[d] = frame[s];
          apercu[d + 1] = frame[s + 1];
          apercu[d + 2] = frame[s + 2];
          apercu[d + 3] = frame[s + 3];
        }
      }
    }
  }
}
for (let row = 0; row < ROWS; row++) {
  const b = sliceFrame(idleB.rgba, idleB.w, 0, row);
  stamp(b, row, 0);
  stamp(applyVariant(b, sliceFrame(idleH.rgba, idleH.w, 0, row)), row, 1);
}
writeFileSync(outDir + "/apercu-idle.png", encodePNG(apercu, COLS * FRAME * z, 2 * FRAME * z));

console.log(issues.length ? issues.slice(0, 12).join("\n") : "variante ok, " + ANIMS.length + " planches");
if (issues.length) process.exit(1);
