/**
 * Sorts — ancrage déclaré ; déclenchement uniquement via keyframes d'anim.
 *
 * Types :
 * - limb : rigide au membre (suit morph + orientation)
 * - bodyCenter : centré corps (ignore morphologie pour la position)
 * - grid : ancré à la grille (ignore orientation du personnage)
 */

export const ANCHOR_LIMB = "limb";
export const ANCHOR_BODY = "bodyCenter";
export const ANCHOR_GRID = "grid";

export const AURA_BEHIND = "behind";
export const AURA_FRONT = "front";

const REGISTRY = new Map();

export function declareSpell(def) {
  if (!def?.id) throw new Error("declareSpell: id requis");
  if (![ANCHOR_LIMB, ANCHOR_BODY, ANCHOR_GRID].includes(def.anchor)) {
    throw new Error(`declareSpell: anchor invalide (${def.anchor})`);
  }
  const spell = {
    id: def.id,
    anchor: def.anchor,
    auraLayer: def.auraLayer === AURA_FRONT ? AURA_FRONT : AURA_BEHIND,
    hook: def.hook || "onHit",
    color: def.color || "#E8590C",
    radius: def.radius ?? 0.35,
    duration: def.duration ?? 400,
  };
  REGISTRY.set(spell.id, spell);
  return spell;
}

export function getSpell(id) {
  return REGISTRY.get(id);
}

export function listSpells() {
  return [...REGISTRY.values()];
}

/**
 * Résout la position monde d'un effet au moment du hook.
 */
export function resolveSpellAnchor(spell, ctx) {
  const { anchors, worldX, worldY, unit, col, row, gridToWorld } = ctx;

  if (spell.anchor === ANCHOR_GRID) {
    const g = gridToWorld(col, row);
    return { x: g.x, y: g.y, layer: spell.auraLayer, ignoreOrient: true, ignoreMorph: true };
  }

  if (spell.anchor === ANCHOR_BODY) {
    // Centre corps : Y fixe relatif hauteur, X=0 — ignore variations morph
    return {
      x: worldX,
      y: worldY + (-0.95) * unit,
      layer: spell.auraLayer,
      ignoreOrient: false,
      ignoreMorph: true,
    };
  }

  // limb — main dominante / tip arme
  const hand = anchors.handR || anchors.handL;
  return {
    x: worldX + hand.x * unit,
    y: worldY + hand.y * unit,
    layer: spell.auraLayer,
    ignoreOrient: false,
    ignoreMorph: false,
  };
}

/**
 * Gestionnaire d'effets actifs (poussés par les hooks d'anim uniquement).
 */
export function createSpellRunner() {
  const active = [];

  return {
    get active() {
      return active;
    },

    /** Appelé depuis la timeline d'animation. */
    trigger(spellId, ctx, scaledTime) {
      const spell = getSpell(spellId);
      if (!spell) return null;
      const pos = resolveSpellAnchor(spell, ctx);
      const fx = {
        id: `${spellId}-${scaledTime}`,
        spellId,
        spell,
        pos,
        bornAt: scaledTime,
        endsAt: scaledTime + spell.duration,
      };
      active.push(fx);
      return fx;
    },

    /** Avance avec scaledDt (même horloge que les anims). */
    update(scaledTime) {
      for (let i = active.length - 1; i >= 0; i--) {
        if (scaledTime >= active[i].endsAt) active.splice(i, 1);
      }
    },
  };
}

// Sorts de test
declareSpell({
  id: "slash",
  anchor: ANCHOR_LIMB,
  auraLayer: AURA_FRONT,
  hook: "onHit",
  color: "#E8590C",
  radius: 0.28,
  duration: 280,
});

declareSpell({
  id: "healAura",
  anchor: ANCHOR_BODY,
  auraLayer: AURA_BEHIND,
  hook: "onHit",
  color: "#6fd8c8",
  radius: 0.55,
  duration: 500,
});

declareSpell({
  id: "quake",
  anchor: ANCHOR_GRID,
  auraLayer: AURA_BEHIND,
  hook: "onHit",
  color: "#E8590C",
  radius: 0.7,
  duration: 450,
});
