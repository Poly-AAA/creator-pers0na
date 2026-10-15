/**
 * Sorts du laboratoire de sprites.
 * Ils ne remplacent pas Coup brut, Coup de pied ni Roulade.
 * Le poing cumulatif ajoute un pas par évolution choisie.
 */
export const RIG_SPELLS = [
  {
    id: "pas_rig",
    name: "Pas",
    lab: true,
    chain: "move",
    cost: 2,
    range: 1,
    dmg: [0, 0],
    type: "buff",
    effect: "step",
    anim: "Slide",
    aoe: 0,
    animSeq: [],
    desc: "Un pas qui se pose au centre de la case.",
    steps: [{ anim: "Slide", rig: "step", move: "Idle", slash: "None", effect: "None", delay: 0, fps: 16, hitTarget: false }],
    evoConfig: {
      "1:Allonge": { enabled: true, anim: "Slide", rig: "step", slash: "None", effect: "None", fps: 16, delay: 0, hand: "R" },
      "1:Court": { enabled: false, anim: "Walk", rig: "step", slash: "None", effect: "None", fps: 15, delay: 0, hand: "L" },
    },
  },
  {
    id: "volte_rig",
    name: "Volte",
    lab: true,
    chain: "move",
    cost: 3,
    range: 1,
    dmg: [0, 0],
    type: "buff",
    effect: "roll",
    anim: "Rolling",
    aoe: 0,
    animSeq: [],
    desc: "Roulade du rig : départ et arrivée au centre de la case.",
    steps: [{ anim: "Rolling", rig: "roll", move: "Idle", slash: "None", effect: "None", delay: 0, fps: 17, hitTarget: false }],
    evoConfig: {
      "1:Serree": { enabled: true, anim: "Rolling", rig: "roll", slash: "None", effect: "None", fps: 17, delay: 0 },
      "1:Longue": { enabled: false, anim: "Slide", rig: "roll", slash: "None", effect: "None", fps: 15, delay: 0 },
    },
  },
  {
    id: "bond_rig",
    name: "Bond",
    lab: true,
    chain: "move",
    cost: 3,
    range: 2,
    dmg: [0, 0],
    type: "buff",
    effect: "leap",
    anim: "AttackRun",
    aoe: 0,
    animSeq: [],
    desc: "Bond qui retombe au centre de la case.",
    steps: [{ anim: "AttackRun", rig: "leap", move: "Idle", slash: "None", effect: "None", delay: 0, fps: 16, hitTarget: false }],
    evoConfig: {
      "1:Court": { enabled: true, anim: "AttackRun", rig: "leap", slash: "None", effect: "None", fps: 16, delay: 0 },
      "1:Haut": { enabled: false, anim: "AttackRun2", rig: "leap", slash: "None", effect: "None", fps: 15, delay: 0 },
    },
  },
  {
    id: "poing_rig",
    name: "Poing",
    lab: true,
    chain: "append",
    cost: 2,
    range: 1,
    dmg: [6, 10],
    type: "damage",
    effect: "",
    anim: "Attack1",
    aoe: 0,
    animSeq: [],
    desc: "Jab gauche. Chaque évolution choisie ajoute un pas.",
    steps: [{ anim: "Attack1", rig: "jabL", hand: "L", move: "Idle", slash: "None", effect: "None", delay: 0, fps: 17, hitTarget: true }],
    evoConfig: {
      "1:Direct": { enabled: true, anim: "Attack2", rig: "crossR", hand: "R", slash: "None", effect: "None", fps: 16, delay: 0, family: "hit" },
      "1:Feinte": { enabled: false, anim: "Attack3", rig: "jabL", hand: "L", slash: "None", effect: "None", fps: 17, delay: 0, family: "hit" },
      "1:Crochet": { enabled: false, anim: "Attack6", rig: "hookR", hand: "R", slash: "None", effect: "None", fps: 15, delay: 0, family: "hit" },
      "2:Repousse": { enabled: true, anim: "Attack4", rig: "pushR", hand: "R", slash: "None", effect: "None", fps: 14, delay: 0, family: "knockback", push: 1 },
      "2:Poings de feu": { enabled: false, anim: "Special1", rig: "guard", hand: "B", slash: "None", effect: "Effect1", fps: 15, delay: 0, family: "buff", element: "fire", turns: 3 },
      "2:Onde": { enabled: false, anim: "Attack5", rig: "jabR", hand: "R", slash: "Slash1", effect: "None", fps: 16, delay: 0, family: "projectile", fx: "shock" },
      "3:Zone": { enabled: false, anim: "Attack6", rig: "slam", hand: "B", slash: "None", effect: "Effect1", fps: 14, delay: 0, family: "area", aoe: 1 },
      "3:Brulure": { enabled: false, anim: "Special1", rig: "jabL", hand: "L", slash: "None", effect: "Effect2", fps: 12, delay: 0, family: "dot", element: "fire", turns: 3 },
      "3:Foudre": { enabled: false, anim: "Special1", rig: "jabR", hand: "R", slash: "None", effect: "Effect3", fps: 15, delay: 0, family: "buff", element: "lightning", turns: 2 },
    },
  },
];

const PROTECTED = new Set(["punch", "coup_de_pied", "roulade"]);

export function isProtectedSpell(spell) {
  return !!(spell && PROTECTED.has(spell.id));
}

function stepOf(entry, fallbackHand) {
  return {
    anim: entry.anim || "Attack1",
    rig: entry.rig || "jabL",
    hand: entry.hand || fallbackHand || "R",
    delay: entry.delay != null ? entry.delay : 0,
    fps: entry.fps != null ? entry.fps : 16,
    slash: entry.slash || "None",
    effect: entry.effect || "None",
    hitTarget: entry.hitTarget != null ? !!entry.hitTarget : true,
    family: entry.family || "",
    element: entry.element || "",
    turns: entry.turns | 0,
    fx: entry.fx || "",
    push: entry.push | 0,
    aoe: entry.aoe | 0,
  };
}

/**
 * Chaîne lisible par l'éditeur : pas de base, puis un pas par évolution choisie.
 * Un seul élément à la fois : le dernier buff remplace le précédent.
 */
export function resolveChain(spell, picks) {
  if (!spell || spell.chain !== "append") {
    const only = (spell && spell.steps) || [];
    return { steps: only.map((s) => stepOf(s, s.hand)), element: "", turns: 0 };
  }
  const steps = (spell.steps || []).map((s) => stepOf(s, s.hand));
  const chosen = Array.isArray(picks) && picks.length
    ? picks.map((p) => {
      const key = p.tier + ":" + p.name;
      return spell.evoConfig && spell.evoConfig[key];
    }).filter(Boolean)
    : Object.keys(spell.evoConfig || {}).sort().map((k) => spell.evoConfig[k]).filter((e) => e && e.enabled);
  let element = "";
  let turns = 0;
  chosen.forEach((ed) => {
    const step = stepOf(ed, "R");
    if (ed.element) {
      element = ed.element;
      turns = ed.turns | 0;
      step.element = element;
    }
    steps.push(step);
  });
  return { steps, element, turns };
}

export function fxForElement(element, hand) {
  if (element === "fire") return [{ kind: "fire", hand: hand || "R" }, { kind: "fire", hand: hand === "L" ? "R" : "L" }];
  if (element === "ice") return [{ kind: "ice", hand: hand || "R" }];
  if (element === "lightning") return [{ kind: "lightning", hand: hand || "R" }];
  return [];
}
