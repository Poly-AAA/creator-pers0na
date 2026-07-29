/**
 * Tests S5b — embuscades voyage (analyse statique + logique pure).
 * Pas de DOM : vérifie le contrat mission-éclair et les marqueurs dans le HTML.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "neuro-core.html"), "utf8");

describe("S5b — marqueurs dans neuro-core.html", () => {
  it("expose makeAmbushContract + launchAmbush", () => {
    assert.match(html, /makeAmbushContract\s*\(/);
    assert.match(html, /launchAmbush\s*\(/);
  });

  it("pirates / chasseurs déclenchent combat:true", () => {
    assert.match(html, /case "pirates":\s*\{\s*out\.combat\s*=\s*true/);
    assert.match(html, /case "chasseurs":\s*\{\s*out\.combat\s*=\s*true/);
  });

  it("scénarios flash 1 scène présents", () => {
    assert.match(html, /id:"ambush_flash"/);
    assert.match(html, /id:"hunter_flash"/);
  });

  it("navigation lance l'embuscade si event.combat", () => {
    assert.match(html, /r\.event\.combat\s*&&\s*r\.event\.ambushKind/);
    assert.match(html, /Galaxy\.launchAmbush/);
  });

  it("newRun force 1 scène pour contract.ambush", () => {
    assert.match(html, /if\s*\(\s*State\.run\.contract\.ambush\s*\)/);
    assert.match(html, /State\.run\.scenes\s*=\s*1/);
  });
});

describe("S5b — logique makeAmbushContract (extrait)", () => {
  function makeAmbushContract(kind, dest, { randi, pick }) {
    const hunters = kind === "chasseurs";
    const typeId = hunters ? "assassinat" : "guerre";
    const scenarioId = hunters ? "hunter_flash" : "ambush_flash";
    const biome = dest && dest.biome ? dest.biome : "station";
    const faction = dest && dest.faction ? dest.faction : pick(["humains"]);
    const bounty = hunters ? randi(100, 160) : randi(70, 120);
    return {
      type: typeId,
      biome,
      faction,
      scenes: 1,
      scenarioId,
      ambush: true,
      ambushKind: kind,
      bounty,
      boss: false,
    };
  }

  it("pirates → guerre / ambush_flash / 1 scène", () => {
    const ct = makeAmbushContract("pirates", { biome: "jungle", faction: "veyrans" }, {
      randi: (a) => a,
      pick: (a) => a[0],
    });
    assert.equal(ct.scenes, 1);
    assert.equal(ct.ambush, true);
    assert.equal(ct.type, "guerre");
    assert.equal(ct.scenarioId, "ambush_flash");
    assert.equal(ct.biome, "jungle");
  });

  it("chasseurs → assassinat / hunter_flash / 1 scène", () => {
    const ct = makeAmbushContract("chasseurs", { biome: "station", faction: "humains" }, {
      randi: (a, b) => b,
      pick: (a) => a[0],
    });
    assert.equal(ct.scenes, 1);
    assert.equal(ct.scenarioId, "hunter_flash");
    assert.equal(ct.type, "assassinat");
    assert.equal(ct.ambushKind, "chasseurs");
  });
});
