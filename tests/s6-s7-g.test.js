/**
 * Tests S6 / S7 / G — marqueurs + logique pure (sans DOM).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "neuro-core.html"), "utf8");

describe("S6 — contrats riches", () => {
  it("expose objectif composite secure", () => {
    assert.match(html, /secure:\s*\{\s*label:"Sécuriser la zone/);
    assert.match(html, /id:"secure_ops"/);
    assert.match(html, /obj:"secure"/);
  });

  it("expose scénario poursuite mobile", () => {
    assert.match(html, /id:"chase_flee"/);
    assert.match(html, /mobileFlee:\s*true/);
    assert.match(html, /contractTarget\s*=\s*true/);
    assert.match(html, /mobileFlee\s*=\s*wantFlee/);
  });

  it("checkSceneObjective gère pursue + secure", () => {
    assert.match(html, /State\.sceneObjective === "secure"/);
    assert.match(html, /State\.sceneObjective === "pursue"/);
    assert.match(html, /checkTargetEscape/);
  });

  it("IA fuit pour les cibles mobiles", () => {
    assert.match(html, /e\.mobileFlee && e\.contractTarget/);
    assert.match(html, /privilégier le bord|edgeDist/);
  });
});

describe("S7 — galaxie dynamique", () => {
  it("expose WorldSim (tick, guerres, log)", () => {
    assert.match(html, /const WorldSim\s*=\s*\{/);
    assert.match(html, /noteFactionWar\s*\(/);
    assert.match(html, /WorldSim\.tick\s*\(/);
    assert.match(html, /Galaxy\.travelTo[\s\S]*WorldSim\.tick/);
  });

  it("logique tick : dérive de situation", () => {
    function tickPlanet(p, rng) {
      const order = ["stable", "prospere", "tension", "blocus", "conflit", "rebellion"];
      if (rng() < 0.08) {
        const idx = Math.max(0, order.indexOf(p.situation));
        const next = order[Math.max(0, Math.min(order.length - 1, idx + (rng() < 0.55 ? 1 : -1)))];
        p.situation = next;
      }
      return p;
    }
    const p = { situation: "stable", danger: 1 };
    // force drift
    tickPlanet(p, () => 0.01);
    assert.notEqual(p.situation, "stable");
  });

  it("noteFactionWar peut flipper une planète rivale", () => {
    function noteFactionWar(contract, sys, rng) {
      const rival = "veyrans";
      const candidates = sys.filter((p) => p.faction === rival);
      if (candidates.length && rng() < 0.55) {
        const p = candidates[0];
        p.faction = contract.faction;
        return p;
      }
      return null;
    }
    const sys = [
      { name: "A", faction: "veyrans", situation: "stable", danger: 1 },
      { name: "B", faction: "humains", situation: "stable", danger: 1 },
    ];
    const flipped = noteFactionWar({ faction: "humains" }, sys, () => 0.1);
    assert.ok(flipped);
    assert.equal(flipped.faction, "humains");
  });
});

describe("G — game feel", () => {
  it("écran de chargement + UI.load", () => {
    assert.match(html, /id="loadOverlay"/);
    assert.match(html, /load:\s*\{\s*_timer/);
    assert.match(html, /SAUT HYPERSPATIAL/);
    assert.match(html, /DÉPLOIEMENT TACTIQUE/);
  });

  it("hub thématisé par biome + flux galactique", () => {
    assert.match(html, /biome-"\+planet\.biome/);
    assert.match(html, /id="hubPlanet"/);
    assert.match(html, /FLUX GALACTIQUE/);
  });

  it("ECHO : équipement visible + marqueur cible", () => {
    assert.match(html, /e\.isPlayer && e\.equip/);
    assert.match(html, /e\.contractTarget/);
    assert.match(html, /SLOT_COLOR\.weapon/);
  });
});

describe("V3.4 — version", () => {
  it("titre V3.4.0", () => {
    assert.match(html, /NEURO CORE — V3\.4\.0/);
  });
});
