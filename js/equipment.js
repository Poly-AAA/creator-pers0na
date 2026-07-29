import { getAnchors, mirrorAnchors } from "./rig.js";
import {
  buildPantsLeg,
  buildPantsWaist,
  buildTunic,
  buildCap,
} from "./body.js";

/** Taille d'arme fixe (unités morph) — ne suit JAMAIS la morphologie. */
export const WEAPON_SIZE = {
  sword: { length: 0.85, width: 0.06 },
  staff: { length: 1.35, width: 0.045 },
};

/**
 * Vêtements : suivent le morph projeté (même m que le corps).
 * Retourne des nœuds SVG à intercaler dans les calques corps.
 */
export function buildClothingLayers(projectedMorph, unit, gear = {}) {
  const m = projectedMorph;
  const out = { legBack: [], legFront: [], torso: [], head: [] };
  const pants = gear.pants || "none";
  const pantsColor = gear.pantsColor || "#4a6741";
  if (pants && pants !== "none") {
    out.legBack.push(...buildPantsLeg(m, unit, "back", pants, pantsColor));
    out.torso.push(...buildPantsWaist(m, unit, pantsColor));
    out.legFront.push(...buildPantsLeg(m, unit, "front", pants, pantsColor));
  }
  if (gear.torso === "tunic") {
    out.torso.push(...buildTunic(m, unit, gear.torsoColor || "#8b5a2b"));
  }
  if (gear.hat === "cap") {
    out.head.push(...buildCap(m, unit, gear.hatColor || "#3d2b1f"));
  }
  return out;
}

/**
 * Main dominante pour l'arme après miroir.
 * Droitier : handR en local. Après scaleX(-1), rebrancher sur handL
 * du groupe mirroir (sinon droitier → gaucher à l'écran).
 *
 * Convention : on travaille en espace local pré-miroir pour le dessin
 * (le SVG scale(-1,1) miroire), donc l'arme reste sur handR en local.
 * Pour les tests / logique monde, `resolveWeaponHand` donne la main
 * sémantique post-miroir.
 */
export function resolveWeaponHand(mirror, dominant = "R") {
  if (dominant === "R") return mirror ? "handL" : "handR";
  return mirror ? "handR" : "handL";
}

/**
 * Ancres utiles pour placer une arme, en tenant compte du miroir.
 * Si mirrored=true, les ancres sont déjà en espace écran (post-miroir).
 */
export function getWeaponMount(projectedMorph, options = {}) {
  const { twoHanded = false, dominant = "R", applyMirrorSwap = true } = options;
  const mirrored = !!projectedMorph.mirror;
  let anchors = getAnchors(projectedMorph);

  // Pour logique « quelle main à l'écran », swap après miroir
  if (applyMirrorSwap && mirrored) {
    anchors = mirrorAnchors(anchors);
  }

  const primary = resolveWeaponHand(mirrored, dominant);
  const secondary = primary === "handR" ? "handL" : "handR";

  const mount = {
    primaryHand: primary,
    secondaryHand: secondary,
    primary: anchors[primary],
    secondary: anchors[secondary],
    mirrored,
    twoHanded,
  };

  if (twoHanded) {
    mount.angle = Math.atan2(
      mount.secondary.y - mount.primary.y,
      mount.secondary.x - mount.primary.x
    );
    mount.mid = {
      x: (mount.primary.x + mount.secondary.x) / 2,
      y: (mount.primary.y + mount.secondary.y) / 2,
    };
  } else {
    // Épée : pointe vers le haut-avant depuis la main
    mount.angle = -Math.PI / 2.6;
    mount.mid = mount.primary;
  }

  return mount;
}

/**
 * Construit la géométrie SVG d'une arme (taille fixe).
 * Dessinée en espace local pré-miroir : toujours ancrée handR local,
 * le scaleX(-1) du parent gère le flip ; mount post-miroir sert aux tests.
 */
export function buildWeaponGeometry(style, color = "#c0a060") {
  const size = WEAPON_SIZE[style];
  if (!size) return null;

  if (style === "sword") {
    const L = size.length;
    const W = size.width;
    return {
      style,
      color,
      twoHanded: false,
      // Path relatif à la main (local, tip up)
      localPath: `M 0 0 L ${W * 0.3} ${-L * 0.15} L ${W * 0.15} ${-L} L ${-W * 0.15} ${-L} L ${-W * 0.3} ${-L * 0.15} Z`,
      guard: `M ${-W * 0.9} ${-L * 0.12} L ${W * 0.9} ${-L * 0.12}`,
      length: L,
      width: W,
    };
  }

  if (style === "staff") {
    const L = size.length;
    const W = size.width;
    return {
      style,
      color,
      twoHanded: true,
      localPath: `M ${-W} ${L * 0.15} L ${W} ${L * 0.15} L ${W * 0.6} ${-L * 0.85} L ${-W * 0.6} ${-L * 0.85} Z`,
      tip: { x: 0, y: -L * 0.85 },
      length: L,
      width: W,
    };
  }

  return null;
}

/**
 * Pose l'arme : position/rotation suivent les ancres ; taille = WEAPON_SIZE.
 * En local pré-miroir on ancre sur handR (dominant droitier).
 */
export function placeWeaponLocal(projectedMorph, style) {
  const geo = buildWeaponGeometry(style);
  if (!geo) return null;
  const anchors = getAnchors(projectedMorph);
  const hand = anchors.handR;
  const other = anchors.handL;

  if (geo.twoHanded) {
    const angle = Math.atan2(other.y - hand.y, other.x - hand.x);
    return {
      ...geo,
      x: hand.x,
      y: hand.y,
      rotation: angle,
      handLocal: "handR",
      mount: getWeaponMount(projectedMorph, { twoHanded: true }),
    };
  }

  return {
    ...geo,
    x: hand.x,
    y: hand.y,
    rotation: -Math.PI / 2.6,
    handLocal: "handR",
    mount: getWeaponMount(projectedMorph, { twoHanded: false }),
  };
}
