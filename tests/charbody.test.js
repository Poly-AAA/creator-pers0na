/**
 * Tests CharBody / CharGen — morphos, pièces, mapping équipement, camps.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "neuro-core.html"), "utf8");

function extractCharGenRuntime() {
  const start = html.indexOf("const CHAR_PAL = {");
  const end = html.indexOf("\nconst Render = {", start);
  assert.ok(start > 0 && end > start, "CharGen/CharBody block");
  const code = html.slice(start, end);
  const sandbox = {
    MetaProgress: { data: { echo: { name: "ECHO-01", look: null } }, save() {} },
    isAlly: (e) => e && e.side === "ally",
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(code + "\n;this.CharGen=CharGen;this.CharBody=CharBody;this.CHAR_PAL=CHAR_PAL;", sandbox);
  return sandbox;
}

describe("CharBody — marqueurs", () => {
  it("module CharBody + CharGen + palette planche", () => {
    assert.match(html, /const CharBody\s*=/);
    assert.match(html, /const CharGen\s*=/);
    assert.match(html, /#F2F0EB/);
    assert.match(html, /#DCD3C3/);
    assert.match(html, /#2E2E30/);
    assert.match(html, /#E8590C/);
  });
  it("3 morphologies", () => {
    assert.match(html, /standard:\s*\{[^}]*h:\s*50/);
    assert.match(html, /lourd:\s*\{/);
    assert.match(html, /fin:\s*\{/);
  });
  it("drawEntity appelle CharBody.draw", () => {
    assert.match(html, /CharBody\.draw\s*\(\s*ctx,\s*e,\s*foot/);
  });
  it("rebind main arme après miroir", () => {
    assert.match(html, /charWeaponHandLocal|weaponHandLocal/);
    assert.match(html, /mirror\s*\?\s*"handL"\s*:\s*"handR"/);
  });
  it("ancrages sorts limb/bodyCenter/grid", () => {
    assert.match(html, /spellAnchor\s*\(/);
    assert.match(html, /type === "grid"/);
    assert.match(html, /type === "bodyCenter"/);
  });
  it("joueur morphId + facing au moveAlong", () => {
    assert.match(html, /morphId/);
    assert.match(html, /entity\.facing\s*=\s*\{\s*dCol,\s*dRow\s*\}/);
  });
  it("anneau de camp + catalogue pièces", () => {
    assert.match(html, /drawFactionRing/);
    assert.match(html, /CHAR_WEAPON_CATALOG/);
    assert.match(html, /CHAR_ARMOR_CATALOG/);
    assert.match(html, /CHAR_HELM_CATALOG/);
  });
  it("UI générateur présent", () => {
    assert.match(html, /chargenOverlay/);
    assert.match(html, /UI\.charGen/);
    assert.match(html, /GÉNÉRATEUR/);
  });
});

describe("CharBody — logique orientation", () => {
  function orientFromDelta(dCol, dRow) {
    const sc = Math.sign(dCol), sr = Math.sign(dRow);
    if (sc === 0 && sr === 0) return "front";
    return {
      "0,-1": "back", "1,-1": "qBackRight", "1,0": "sideRight", "1,1": "qFrontRight",
      "0,1": "front", "-1,1": "qFrontLeft", "-1,0": "sideLeft", "-1,-1": "qBackLeft",
    }[`${sc},${sr}`] || "front";
  }
  it("8 cas Δcol/Δrow", () => {
    assert.equal(orientFromDelta(0, -1), "back");
    assert.equal(orientFromDelta(1, 0), "sideRight");
    assert.equal(orientFromDelta(0, 1), "front");
    assert.equal(orientFromDelta(-1, 0), "sideLeft");
    assert.equal(orientFromDelta(1, 1), "qFrontRight");
    assert.equal(orientFromDelta(-1, 1), "qFrontLeft");
    assert.equal(orientFromDelta(1, -1), "qBackRight");
    assert.equal(orientFromDelta(-1, -1), "qBackLeft");
  });
  it("profil plus étroit que face (facteur sx)", () => {
    const KIND = { front: { sx: 1.12 }, side: { sx: 0.36 } };
    assert.ok(KIND.side.sx < KIND.front.sx * 0.5);
  });
});

describe("CharGen — mapping & presets", () => {
  const rt = extractCharGenRuntime();
  const { CharGen } = rt;

  it("mappe templates d'armes vers des ids distincts", () => {
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Pistolet Magnétique" }), "pistol");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Fusil Cinétique" }), "rifle");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Lance Thermique" }), "lance");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Neuro Blaster" }), "blaster");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Harpon d'Ancrage" }), "harpoon");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Disrupteur EMP" }), "emp");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Brouilleur Cinétique" }), "kinetic");
    assert.equal(CharGen.weaponFromItem({ type:"weapon", base:"Canon de Précision" }), "scope");
  });

  it("mappe armures / implants vers des ids distincts", () => {
    assert.equal(CharGen.armorFromItem({ type:"armor", base:"Armure Légère" }), "light");
    assert.equal(CharGen.armorFromItem({ type:"armor", base:"Armure Lourde" }), "heavy");
    assert.equal(CharGen.armorFromItem({ type:"armor", base:"Voile de Phase" }), "phase");
    assert.equal(CharGen.armorFromItem({ type:"armor", base:"Crampons Magnétiques" }), "magnetic");
    assert.equal(CharGen.helmFromItem({ type:"implant", base:"Amplificateur Neuro" }), "cortical");
    assert.equal(CharGen.helmFromItem({ type:"implant", base:"Nœud Gravitationnel" }), "gravity");
    assert.equal(CharGen.helmFromItem({ type:"implant", base:"Propulseurs Furtifs" }), "thruster");
  });

  it("presets crew distincts (arme/casque)", () => {
    const s = CharGen.resolve({ isCrew:true, crewRole:"melee", side:"ally", glow:"#3ce08a" });
    const r = CharGen.resolve({ isCrew:true, crewRole:"ranged", side:"ally", glow:"#27e0ff" });
    const h = CharGen.resolve({ isCrew:true, crewRole:"healer", side:"ally", glow:"#ffd23c" });
    assert.equal(s.helm, "soldier");
    assert.equal(r.weapon, "rifle");
    assert.equal(h.weapon, "staff");
    assert.equal(h.helm, "medic");
    assert.notEqual(s.weapon, r.weapon);
  });

  it("presets ennemis selon archétype", () => {
    const brute = CharGen.resolve({ side:"foe", archetype:"brute", tactic:"melee", morphId:"lourd" });
    const gun = CharGen.resolve({ side:"foe", archetype:"gunner", tactic:"kiter", morphId:"fin" });
    assert.equal(brute.armor, "heavy");
    assert.equal(gun.weapon, "rifle");
    assert.notEqual(brute.armor, gun.armor);
  });

  it("équipement joueur prime sur look sauvegardé", () => {
    const e = {
      isPlayer:true, side:"ally",
      equip:{ weapon:{ type:"weapon", base:"Pistolet Magnétique" }, armor:null, implant:null },
      look:{ morphId:"fin", weapon:"sword", armor:"heavy", helm:"boss" },
    };
    const k = CharGen.resolve(e);
    assert.equal(k.weapon, "pistol");
    assert.equal(k.armor, "heavy"); // pas d'armor équipée → look
    assert.equal(k.helm, "boss");
    assert.equal(k.morphId, "fin");
  });

  it("catalogue : plusieurs armes / armures / casques", () => {
    assert.ok(Object.keys(CharGen.WEAPONS).length >= 10);
    assert.ok(Object.keys(CharGen.ARMORS).length >= 5);
    assert.ok(Object.keys(CharGen.HELMS).length >= 10);
  });
});
