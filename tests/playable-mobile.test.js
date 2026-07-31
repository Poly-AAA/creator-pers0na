/**
 * Tests V3.4.8 — parcours jouable mobile (marqueurs).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "neuro-core.html"), "utf8");

describe("V3.4.8 — jeu jouable mobile", () => {
  it("expose bannière d'objectif", () => {
    assert.match(html, /id="objBanner"/);
    assert.match(html, /updateObjectiveBanner\s*\(/);
  });

  it("hint tour tactile (pas AZERTY seul)", () => {
    assert.match(html, /FIN DE TOUR/);
    assert.match(html, /barre bas/);
  });

  it("premier déploiement safe eliminate", () => {
    assert.match(html, /id:"first_ops"/);
    assert.match(html, /firstRunSafe/);
    assert.match(html, /ascensions\|\|0\) < 1/);
  });

  it("CTA hub Bureau local premier run", () => {
    assert.match(html, /COMMENCER — BUREAU LOCAL/);
  });

  it("version V3.4.8", () => {
    assert.match(html, /NEURO CORE — V3\.4\.8/);
  });
});
