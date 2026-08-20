/**
 * Pont Fantasy — archétypes d’armes + pools d’effets stables
 *
 * Modèle :
 *  1. Archétypes fixes (école, portée type, anims, pool d’effets)
 *  2. Chaque sprite d’arme → 1 archétype
 *  3. Effets tirés dans le pool (seed = folder) — même arme = même kit
 *  4. Évo = choix joueur (efficace vs spectacle), pas un 2ᵉ RNG
 */
(function (global) {
  "use strict";

  const SCHOOL_FANTASY = {
    "Cinétique": "Force",
    "Électrique": "Foudre",
    "Thermique": "Feu",
    "Neuro": "Ombre",
    "Gravité": "Arcane",
    "Nanites": "Lumière",
  };

  /** Renommage fantasy des sorts existants (id inchangé pour la save). */
  const SPELL_SKIN = {
    punch: { name: "Coup brut", school: "Force", desc: "Frappe au corps à corps." },
    coup_de_pied: { name: "Coup de pied", school: "Force", desc: "Coup de pied qui repousse." },
    kick: { name: "Coup de pied", school: "Force", desc: "Coup de pied qui repousse." },
    roulade: { name: "Roulade", school: "Force", desc: "Rapproche ou recule selon la distance." },
    monofil: { name: "Lame spectrale", school: "Force", desc: "Entaille magique à courte portée." },
    arc: { name: "Éclair runique", school: "Foudre", desc: "Décharge d’énergie arcane." },
    surchauffe: { name: "Brasier", school: "Feu", desc: "Pic de flammes." },
    parasite: { name: "Maléfice", school: "Ombre", desc: "Drain. Affaiblit la cible." },
    gravite: { name: "Poussée tellurique", school: "Arcane", desc: "Onde qui repousse." },
    nanites: { name: "Soin de lumière", school: "Lumière", desc: "Restaure des PV." },
    drone: { name: "Familier", school: "Lumière", desc: "Invoque un allié autonome." },
    tir_magnetique: { name: "Flèche runique", school: "Force", desc: "Tir longue portée." },
    impact_cinetique: { name: "Frappe du titan", school: "Force", desc: "Impact brutal." },
    bombe_thermique: { name: "Orbe de feu", school: "Feu", desc: "Explosion à distance." },
    lance_flammes: { name: "Souffle de dragon", school: "Feu", desc: "Jet de flammes." },
    impulsion_emp: { name: "Décharge scramble", school: "Foudre", desc: "Étourdit (retire PA)." },
    tempete_tesla: { name: "Tempête céleste", school: "Foudre", desc: "Orage dévastateur." },
    piratage_neural: { name: "Emprise mentale", school: "Ombre", desc: "Trouble la cible." },
    rupture_synaptique: { name: "Brisure d’âme", school: "Ombre", desc: "Surcharge psychique." },
    compression: { name: "Étreinte arcanique", school: "Arcane", desc: "Compression spatiale." },
    distorsion: { name: "Faille", school: "Arcane", desc: "Distorsion lointaine." },
    armure_nanites: { name: "Bouclier sacré", school: "Lumière", desc: "Soin renforcé." },
    reconstruction: { name: "Bénédiction", school: "Lumière", desc: "Grand soin." },
    teleport: { name: "Pas de brume", school: "Arcane", desc: "Téléportation." },
    dash: { name: "Charge du sanglier", school: "Force", desc: "Charge en ligne." },
    swap: { name: "Échange de places", school: "Arcane", desc: "Permute deux positions." },
    gravjump: { name: "Bond céleste", school: "Arcane", desc: "Saut par-dessus obstacles." },
    mine: { name: "Rune piégée", school: "Force", desc: "Piège au sol." },
    turret: { name: "Totem de garde", school: "Lumière", desc: "Totem qui tire." },
    sniper: { name: "Œil de faucon", school: "Lumière", desc: "Familier tireur d’élite." },
    bouclier: { name: "Égide", school: "Lumière", desc: "Bouclier temporaire." },
    overclock: { name: "Ivresse de bataille", school: "Ombre", desc: "Bonus dégâts / mobilité." },
    double: { name: "Sosie", school: "Arcane", desc: "Clone qui charge et tacle l’ennemi." },
    invisibilite: { name: "Voile d’ombre", school: "Ombre", desc: "Devient invisible quelques tours." },
  };

  /**
   * Archétypes : identité fixe + pool d’effets contrôlé.
   * base = sort signature (toujours en slot 1)
   * pool = effets secondaires possibles (tirage stable)
   */
  const ARCHETYPES = {
    bare: {
      id: "bare",
      label: "Mains nues",
      school: "Force",
      base: "punch",
      pool: ["punch", "dash", "mine"],
      anims: ["Attack2", "Kick", "Attack1"],
    },
    blade: {
      id: "blade",
      label: "Lame courte",
      school: "Force",
      base: "monofil",
      pool: ["punch", "monofil", "dash", "mine"],
      anims: ["Attack1", "Attack2", "Attack4", "Special1"],
    },
    greatblade: {
      id: "greatblade",
      label: "Grande arme",
      school: "Force",
      base: "impact_cinetique",
      pool: ["impact_cinetique", "punch", "monofil", "dash"],
      anims: ["Attack3", "Attack5", "Attack6", "Special1"],
    },
    polearm: {
      id: "polearm",
      label: "Arme d’hast",
      school: "Force",
      base: "dash",
      pool: ["dash", "monofil", "impact_cinetique", "mine"],
      anims: ["AttackRun", "AttackRun2", "Attack3", "Kick"],
    },
    trapper: {
      id: "trapper",
      label: "Piégeur",
      school: "Force",
      base: "mine",
      pool: ["mine", "punch", "monofil", "dash"],
      anims: ["Kick", "Attack2", "Attack4", "Special1"],
    },
    bow: {
      id: "bow",
      label: "Arc",
      school: "Force",
      base: "tir_magnetique",
      pool: ["tir_magnetique", "arc", "sniper", "mine"],
      anims: ["Attack1", "Attack2", "Attack4"],
    },
    storm: {
      id: "storm",
      label: "Foudre",
      school: "Foudre",
      base: "arc",
      pool: ["arc", "impulsion_emp", "tir_magnetique", "gravite"],
      anims: ["Attack2", "Attack5", "Attack6", "Special1"],
    },
    fire: {
      id: "fire",
      label: "Feu",
      school: "Feu",
      base: "surchauffe",
      pool: ["surchauffe", "bombe_thermique", "arc", "impact_cinetique"],
      anims: ["Attack3", "Attack5", "Special1"],
    },
    arcane: {
      id: "arcane",
      label: "Arcane",
      school: "Arcane",
      base: "gravite",
      pool: ["gravite", "arc", "parasite", "bombe_thermique"],
      anims: ["Special1", "Attack3", "Attack5"],
    },
    shadow: {
      id: "shadow",
      label: "Ombre",
      school: "Ombre",
      base: "parasite",
      pool: ["parasite", "monofil", "gravite", "mine"],
      anims: ["Attack3", "Special1", "Attack6"],
    },
    marksman: {
      id: "marksman",
      label: "Tireur",
      school: "Lumière",
      base: "sniper",
      pool: ["sniper", "tir_magnetique", "impulsion_emp", "arc"],
      anims: ["Attack1", "Attack4", "Attack5"],
    },
  };

  /** Sprite d’arme → archétype (figé, pas de génération d’équipement). */
  const WEAPON_ARCHETYPE = {
    None: "bare",
    Melee1: "blade",
    Melee2: "blade",
    Melee3: "greatblade",
    Melee4: "polearm",
    Melee5: "blade",
    Melee6: "blade",
    Melee7: "greatblade",
    Melee8: "trapper",
    Melee9: "blade",
    Melee10: "blade",
    Melee11: "polearm",
    Melee12: "greatblade",
    Melee13: "blade",
    Melee14: "blade",
    Melee15: "trapper",
    Melee16: "blade",
    Melee17: "blade",
    Melee18: "greatblade",
    Melee19: "polearm",
    Melee20: "trapper",
    Melee21: "blade",
    Melee22: "blade",
    Melee23: "greatblade",
    Melee24: "blade",
    Melee25: "blade",
    Ranged1: "bow",
    Ranged2: "storm",
    Ranged3: "fire",
    Ranged4: "bow",
    Ranged5: "storm",
    Ranged6: "storm",
    Ranged7: "marksman",
    Magic1: "arcane",
    Magic2: "shadow",
    Magic3: "fire",
  };

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pickStable(arr, seed, salt) {
    if (!arr || !arr.length) return null;
    return arr[hashStr(String(seed) + ":" + String(salt)) % arr.length];
  }

  function uniqueStable(pool, seed, count, reserved) {
    const out = [];
    const used = new Set(reserved || []);
    let i = 0;
    let guard = 0;
    while (out.length < count && guard < pool.length * 4) {
      const id = pickStable(pool, seed, "fx" + i);
      i++;
      guard++;
      if (!id || used.has(id)) continue;
      used.add(id);
      out.push(id);
    }
    /* complète si pool trop petit / collisions */
    for (const id of pool) {
      if (out.length >= count) break;
      if (used.has(id)) continue;
      used.add(id);
      out.push(id);
    }
    return out;
  }

  function archetypeFor(folder) {
    const id = WEAPON_ARCHETYPE[folder] || WEAPON_ARCHETYPE.None;
    return ARCHETYPES[id] || ARCHETYPES.bare;
  }

  /**
   * Kit stable pour une arme :
   * - baseSpell = signature d’archétype (provisoire — sorts hors-arme après)
   * - attacks = [base, …effets du pool]
   * - anim = CHOIX utilisateur (fantasy-weapon-anim.html) sinon suggestion
   */
  const WEAPON_ANIM_KEY = "neuro.fantasyWeaponAnim";
  const WEAPON_ANIM_VER = "weapon-anim-2026-08-12";

  /** Calibrage validé (base) — localStorage peut surcharger pièce par pièce. */
  const BAKED_WEAPON_ANIM = {
    ver: WEAPON_ANIM_VER,
    weapon: {
      Melee1: "Attack1", Melee2: "Attack1", Melee3: "Attack1", Melee4: "Attack1",
      Melee5: "Attack1", Melee6: "Attack1", Melee7: "Attack1", Melee8: "Attack1",
      Melee9: "Attack1", Melee10: "Kick", Melee11: "Attack1", Melee12: "Attack1",
      Melee13: "Attack1", Melee14: "Attack1", Melee15: "Attack1", Melee16: "Attack1",
      Melee17: "Attack1", Melee18: "Attack1", Melee19: "Attack1", Melee20: "Attack1",
      Melee21: "Attack1", Melee22: "Attack1", Melee23: "Attack1", Melee24: "Attack1",
      Melee25: "Attack1",
      Ranged1: "Attack3", Ranged2: "AttackRun2", Ranged3: "Attack3", Ranged4: "Attack3",
      Ranged5: "Attack1", Ranged6: "Attack3", Ranged7: "Attack3",
      Magic1: "Attack5", Magic2: "Attack6", Magic3: "Attack5",
    },
    offhand: {
      Offhand1: "Taunt", Offhand2: "Attack5",
      Shield1: "Attack5", Shield2: "Attack5", Shield3: "Attack5", Shield4: "Attack5",
      Shield5: "Attack5", Shield6: "Attack5", Shield7: "Attack5",
    },
    backpack: {
      Bag1: "Special1", Bag2: "Special1", Bag3: "Attack3", Bag4: "Attack4",
      Bag5: "Attack4", Bag6: "Special1", Bag8: "Attack4",
    },
  };

  function cloneAnimMap(src) {
    return {
      ver: (src && src.ver) || WEAPON_ANIM_VER,
      weapon: Object.assign({}, (src && src.weapon) || {}),
      offhand: Object.assign({}, (src && src.offhand) || {}),
      backpack: Object.assign({}, (src && src.backpack) || {}),
    };
  }

  /** Baked ∪ localStorage (local gagne). */
  function readWeaponAnimMap() {
    const out = cloneAnimMap(BAKED_WEAPON_ANIM);
    try {
      const raw = localStorage.getItem(WEAPON_ANIM_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === "object") {
          Object.assign(out.weapon, o.weapon || {});
          Object.assign(out.offhand, o.offhand || {});
          Object.assign(out.backpack, o.backpack || {});
          if (o.ver) out.ver = o.ver;
        }
      }
    } catch (_e) {}
    return out;
  }

  /** Installe le calibrage validé si absent / ancienne version. */
  function ensureWeaponAnimMap() {
    try {
      const ver = localStorage.getItem(WEAPON_ANIM_KEY + ".ver") || localStorage.getItem("neuro.fantasyWeaponAnim.ver");
      const raw = localStorage.getItem(WEAPON_ANIM_KEY);
      if (ver === WEAPON_ANIM_VER && raw) return readWeaponAnimMap();
      const payload = cloneAnimMap(BAKED_WEAPON_ANIM);
      localStorage.setItem(WEAPON_ANIM_KEY, JSON.stringify(payload));
      localStorage.setItem(WEAPON_ANIM_KEY + ".ver", WEAPON_ANIM_VER);
      localStorage.setItem("neuro.fantasyWeaponAnim.ver", WEAPON_ANIM_VER);
      return payload;
    } catch (_e) {
      return cloneAnimMap(BAKED_WEAPON_ANIM);
    }
  }

  function suggestGearAnim(slot, folder) {
    const name = folder || "None";
    const baked = BAKED_WEAPON_ANIM[slot] && BAKED_WEAPON_ANIM[slot][name];
    if (baked) return baked;
    if (slot === "weapon") {
      if (/^Ranged/i.test(name)) return "Attack3";
      if (/^Magic/i.test(name)) return "Attack5";
      return "Attack1";
    }
    if (slot === "offhand") return "Attack5";
    return "Special1";
  }

  /** Anim de cast : mapping validé (baked / local) sinon suggestion. */
  function animForGear(slot, folder) {
    if (!folder || folder === "None") return suggestGearAnim(slot, folder);
    const m = readWeaponAnimMap();
    if (m && m[slot] && m[slot][folder]) return m[slot][folder];
    return suggestGearAnim(slot, folder);
  }

  function loadoutForWeapon(folder) {
    const f = folder || "None";
    const arch = archetypeFor(f);
    const base = arch.base;
    const extras = uniqueStable(arch.pool, f, 3, [base]);
    const attacks = [base].concat(extras).slice(0, 4);
    const anim = animForGear("weapon", f) || pickStable(arch.anims, f, "anim") || arch.anims[0] || "Attack1";
    return {
      folder: f,
      archetype: arch.id,
      label: arch.label,
      school: arch.school,
      baseSpell: base,
      attacks,
      anim,
    };
  }

  function weaponEntry(folder) {
    const L = loadoutForWeapon(folder);
    return {
      spell: L.baseSpell,
      anim: L.anim,
      archetype: L.archetype,
      label: L.label,
      school: L.school,
      attacks: L.attacks.slice(),
    };
  }

  /** Table legacy dérivée (debug / inspect). */
  const WEAPON_SPELL = {};
  Object.keys(WEAPON_ARCHETYPE).forEach((folder) => {
    const e = weaponEntry(folder);
    WEAPON_SPELL[folder] = { spell: e.spell, anim: e.anim };
  });

  /** Anims d’évolution : index 0 = spectacle basique, 2 = meilleur spectacle (stats inverses). */
  const EVO_SPECTACLE_ANIMS = ["Attack1", "Attack3", "Special1"];
  const EVO_SPECTACLE_FX = [null, "Slash1", "Effect3"];

  function resolveSpellId(entry) {
    if (!entry) return "punch";
    if (entry.spell === "kick_proxy") return entry.spellFallback || "punch";
    return entry.spell || "punch";
  }

  function applySpellSkin(SPELL_DEFS, SCHOOL_COLOR) {
    if (!SPELL_DEFS) return;
    for (const def of SPELL_DEFS) {
      const skin = SPELL_SKIN[def.id];
      if (!skin) {
        if (def.school && SCHOOL_FANTASY[def.school]) def.school = SCHOOL_FANTASY[def.school];
        continue;
      }
      def.name = skin.name;
      def.school = skin.school;
      if (skin.desc) def.desc = skin.desc;
    }
    if (SCHOOL_COLOR) {
      SCHOOL_COLOR["Force"] = SCHOOL_COLOR["Cinétique"] || "#ff8a3c";
      SCHOOL_COLOR["Foudre"] = SCHOOL_COLOR["Électrique"] || "#27e0ff";
      SCHOOL_COLOR["Feu"] = SCHOOL_COLOR["Thermique"] || "#ff3b4e";
      SCHOOL_COLOR["Ombre"] = SCHOOL_COLOR["Neuro"] || "#8b6cf0";
      SCHOOL_COLOR["Arcane"] = SCHOOL_COLOR["Gravité"] || "#be96ff";
      SCHOOL_COLOR["Lumière"] = SCHOOL_COLOR["Nanites"] || "#1fd6b8";
    }
  }

  function currentWeaponFolder() {
    try {
      const CC = global.CharCreator;
      if (CC && CC.look && CC.look.weapon && CC.look.weapon !== "None") return CC.look.weapon;
      const raw = localStorage.getItem("neuro.fantasyLook");
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.look && o.look.weapon && o.look.weapon !== "None") return o.look.weapon;
      }
    } catch (_e) {}
    return "None";
  }

  function attackIdsForWeapon(folder) {
    return loadoutForWeapon(folder || currentWeaponFolder()).attacks.slice();
  }

  function currentLook() {
    try {
      const CC = global.CharCreator;
      if (CC && CC.look) return CC.look;
      const raw = localStorage.getItem("neuro.fantasyLook");
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.look) return o.look;
      }
    } catch (_e) {}
    return {};
  }

  const OFFHAND_SPELL = {
    None: null,
    Offhand1: "bouclier",
    Offhand2: "armure_nanites",
    Shield1: "bouclier",
    Shield2: "bouclier",
    Shield3: "armure_nanites",
    Shield4: "bouclier",
    Shield5: "armure_nanites",
    Shield6: "bouclier",
    Shield7: "armure_nanites",
  };

  const BACKPACK_SPELL = {
    None: null,
    Bag1: "nanites",
    Bag2: "reconstruction",
    Bag3: "gravite",
    Bag4: "mine",
    Bag5: "dash",
    Bag6: "nanites",
    Bag8: "parasite",
  };

  const HERO_SPELL_POOL = ["dash", "mine", "parasite", "double", "invisibilite", "bouclier"];
  const BONUS_A_POOL = ["mine", "impulsion_emp", "tir_magnetique", "double", "monofil"];
  const BONUS_B_POOL = ["surchauffe", "bombe_thermique", "invisibilite", "nanites", "gravite"];

  /** 2 paliers × 3 choix (1 pick / palier) = jusqu’à 2 effets cumulés + anim/FX. */
  const EVO_MAX_TIERS = 2;
  const EVO_CHOICES_PER_TIER = 3;
  const EVO_TIER_LEVELS = [1, 2]; /* paliers fantasy simplifiés */

  function evoAdd(st, field, n) {
    if (!st.evo) st.evo = {};
    st.evo[field] = (st.evo[field] || 0) + n;
  }

  /** Arbres d’évo : chaque choix = effet + anim + FX (cumul effets, dernière anim/FX gagne). */
  const EVO_TREE = {
    punch: {
      1: [
        { name: "Brise-Os", d: "+4 dégâts.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "dmg", 4) },
        { name: "Boxeur", d: "+1 portée.", anim: "Attack1", fx: "Slash1", apply: (st) => evoAdd(st, "range", 1) },
        { name: "Rapide", d: "-1 PA.", anim: "Kick", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Percutant", d: "Repousse +1.", anim: "Attack3", fx: "Slash1", apply: (st) => evoAdd(st, "push", 1) },
        { name: "Double Impact", d: "Frappe 2 fois.", anim: "Attack4", fx: "Slash2", apply: (st) => evoAdd(st, "hits", 1) },
        { name: "Uppercut", d: "+3 dégâts.", anim: "Special1", fx: "Effect1", apply: (st) => evoAdd(st, "dmg", 3) },
      ],
    },
    monofil: {
      1: [
        { name: "Hémorragie", d: "Ignore 50% rés.", anim: "Attack3", fx: "Slash1", apply: (st) => evoAdd(st, "pierce", 0.5) },
        { name: "Chirurgical", d: "+15% crit.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "crit", 0.15) },
        { name: "Allonge", d: "+1 portée.", anim: "Attack5", fx: "Slash2", apply: (st) => evoAdd(st, "range", 1) },
      ],
      2: [
        { name: "Déchirure", d: "Frappe 2 fois.", anim: "Attack6", fx: "Slash2", apply: (st) => evoAdd(st, "hits", 1) },
        { name: "Lame instable", d: "+5 dégâts.", anim: "Special1", fx: "Effect2", apply: (st) => evoAdd(st, "dmg", 5) },
        { name: "Exécution", d: "Ignore rés.", anim: "Attack4", fx: "Effect3", apply: (st) => evoAdd(st, "pierce", 1) },
      ],
    },
    arc: {
      1: [
        { name: "Chaîne", d: "+1 rebond (tag).", anim: "Attack1", fx: "Effect1", apply: (st) => evoAdd(st, "chain", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
        { name: "Saturation", d: "+2 dégâts.", anim: "Attack5", fx: "Effect2", apply: (st) => evoAdd(st, "dmg", 2) },
      ],
      2: [
        { name: "Paralysie", d: "Drain PA.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "drain", 1) },
        { name: "Conducteur", d: "+3 dégâts.", anim: "Attack6", fx: "Effect4", apply: (st) => evoAdd(st, "dmg", 3) },
        { name: "Orage", d: "+1 AoE.", anim: "Attack3", fx: "Effect5", apply: (st) => evoAdd(st, "aoe", 1) },
      ],
    },
    dash: {
      1: [
        { name: "Élan", d: "+2 portée.", anim: "AttackRun", fx: null, apply: (st) => evoAdd(st, "range", 2) },
        { name: "Bélier", d: "+5 dégâts.", anim: "AttackRun2", fx: "Slash1", apply: (st) => evoAdd(st, "dmg", 5) },
        { name: "Percussion", d: "Poussée +1.", anim: "Kick", fx: "Slash2", apply: (st) => evoAdd(st, "push", 1) },
      ],
      2: [
        { name: "Transperçant", d: "+pierce.", anim: "AttackRun2", fx: "Effect1", apply: (st) => evoAdd(st, "pierce", 1) },
        { name: "Onde de choc", d: "+1 AoE.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "aoe", 1) },
        { name: "Relance", d: "+2 dégâts.", anim: "AttackRun", fx: "Slash2", apply: (st) => evoAdd(st, "dmg", 2) },
      ],
    },
    mine: {
      1: [
        { name: "Charge", d: "+6 dégâts.", anim: "Kick", fx: "Effect1", apply: (st) => evoAdd(st, "dmg", 6) },
        { name: "Capteur", d: "+1 portée.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "range", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Attack1", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Zone", d: "+1 AoE.", anim: "Special1", fx: "Effect2", apply: (st) => evoAdd(st, "aoe", 1) },
        { name: "Aimant", d: "+push.", anim: "Attack4", fx: "Effect3", apply: (st) => evoAdd(st, "push", 1) },
        { name: "Immobilise", d: "Tag stun.", anim: "Kick", fx: "Slash1", apply: (st) => evoAdd(st, "cloneStun", 1) },
      ],
    },
    surchauffe: {
      1: [
        { name: "Brûlure", d: "+4 dégâts.", anim: "Attack5", fx: "Effect2", apply: (st) => evoAdd(st, "dmg", 4) },
        { name: "Longue portée", d: "+1 portée.", anim: "Attack3", fx: "Effect1", apply: (st) => evoAdd(st, "range", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Fusion", d: "+5 dégâts.", anim: "Special1", fx: "Effect4", apply: (st) => evoAdd(st, "dmg", 5) },
        { name: "Fournaise", d: "+8 dégâts.", anim: "Attack6", fx: "Effect5", apply: (st) => evoAdd(st, "dmg", 8) },
        { name: "Brasier élargi", d: "+1 AoE.", anim: "Attack5", fx: "Effect3", apply: (st) => evoAdd(st, "aoe", 1) },
      ],
    },
    tir_magnetique: {
      1: [
        { name: "Précision", d: "+3 dégâts.", anim: "Attack1", fx: "Effect1", apply: (st) => evoAdd(st, "dmg", 3) },
        { name: "Recul", d: "Push +1.", anim: "Attack3", fx: "Slash1", apply: (st) => evoAdd(st, "push", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Perforant", d: "+pierce.", anim: "Attack4", fx: "Effect2", apply: (st) => evoAdd(st, "pierce", 1) },
        { name: "Longue vue", d: "+1 portée.", anim: "Attack1", fx: "Effect3", apply: (st) => evoAdd(st, "range", 1) },
        { name: "Salve", d: "2 hits.", anim: "Attack6", fx: "Slash2", apply: (st) => evoAdd(st, "hits", 1) },
      ],
    },
    double: {
      1: [
        { name: "Sosie agile", d: "Clone +1 PM.", anim: "Special1", fx: "Effect1", apply: (st) => evoAdd(st, "clonePm", 1) },
        { name: "Tacle lourd", d: "Clone +4 dmg.", anim: "AttackRun", fx: "Slash1", apply: (st) => evoAdd(st, "cloneDmg", 4) },
        { name: "Économe", d: "-1 PA.", anim: "Attack2", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Jumeau", d: "Clone +HP.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "cloneHp", 10) },
        { name: "Plaquage", d: "Tacle stun.", anim: "AttackRun2", fx: "Slash2", apply: (st) => evoAdd(st, "cloneStun", 1) },
        { name: "Mirage", d: "Clone +HP.", anim: "Taunt", fx: "Effect5", apply: (st) => evoAdd(st, "cloneHp", 20) },
      ],
    },
    invisibilite: {
      1: [
        { name: "Voile long", d: "+1 tour.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "invisTurns", 1) },
        { name: "Pas légers", d: "+1 PM sous voile.", anim: "Attack2", fx: "Effect1", apply: (st) => evoAdd(st, "invisPm", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Idle", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Assassin", d: "+6 dmg sortie voile.", anim: "Attack4", fx: "Slash2", apply: (st) => evoAdd(st, "invisBurst", 6) },
        { name: "Brume", d: "+1 tour.", anim: "Special1", fx: "Effect4", apply: (st) => evoAdd(st, "invisTurns", 1) },
        { name: "Ombre vive", d: "+2 PM sous voile.", anim: "AttackRun", fx: "Effect5", apply: (st) => evoAdd(st, "invisPm", 2) },
      ],
    },
    bouclier: {
      1: [
        { name: "Renfort", d: "+8 soin.", anim: "Special1", fx: "Effect1", apply: (st) => evoAdd(st, "heal", 8) },
        { name: "Économe", d: "-1 PA.", anim: "Attack5", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
        { name: "Durée", d: "+1 tour bouclier.", anim: "Taunt", fx: "Effect2", apply: (st) => evoAdd(st, "shieldTurns", 1) },
      ],
      2: [
        { name: "Égide sacrée", d: "+12 soin.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "heal", 12) },
        { name: "Riposte", d: "Thorns 4.", anim: "Attack3", fx: "Slash1", apply: (st) => evoAdd(st, "thorns", 4) },
        { name: "Rempart", d: "+16 bouclier.", anim: "Attack5", fx: "Effect4", apply: (st) => evoAdd(st, "shield", 16) },
      ],
    },
    nanites: {
      1: [
        { name: "Réparation", d: "+6 soin.", anim: "Special1", fx: "Effect1", apply: (st) => evoAdd(st, "heal", 6) },
        { name: "Diffusion", d: "+1 portée.", anim: "Attack3", fx: "Effect2", apply: (st) => evoAdd(st, "range", 1) },
        { name: "Économe", d: "-1 PA.", anim: "Attack1", fx: null, apply: (st) => evoAdd(st, "cost", -1) },
      ],
      2: [
        { name: "Régénération", d: "+12 soin.", anim: "Special1", fx: "Effect3", apply: (st) => evoAdd(st, "heal", 12) },
        { name: "Surcadence", d: "-1 PA, +5 soin.", anim: "Attack5", fx: "Effect4", apply: (st) => { evoAdd(st, "cost", -1); evoAdd(st, "heal", 5); } },
        { name: "Bénédiction", d: "+8 soin, +1 portée.", anim: "Taunt", fx: "Effect5", apply: (st) => { evoAdd(st, "heal", 8); evoAdd(st, "range", 1); } },
      ],
    },
  };
  /* alias → mêmes arbres */
  EVO_TREE.armure_nanites = EVO_TREE.bouclier;
  EVO_TREE.reconstruction = EVO_TREE.nanites;
  EVO_TREE.impact_cinetique = EVO_TREE.punch;
  EVO_TREE.impulsion_emp = EVO_TREE.arc;
  EVO_TREE.bombe_thermique = EVO_TREE.surchauffe;
  EVO_TREE.gravite = EVO_TREE.dash;
  EVO_TREE.parasite = EVO_TREE.monofil;
  /* Coup de pied / Roulade = mêmes paliers mécaniques que Coup brut */
  EVO_TREE.coup_de_pied = EVO_TREE.punch;
  EVO_TREE.kick = EVO_TREE.punch;
  EVO_TREE.roulade = EVO_TREE.punch;

  function evoChoicesFor(spellId, tier) {
    const tree = EVO_TREE[spellId];
    if (!tree || !tree[tier]) return [];
    return decorateEvoChoices(tree[tier].slice(0, EVO_CHOICES_PER_TIER));
  }

  function nextEvoTier(spellState) {
    const st = spellState || {};
    const taken = (st.tiersTaken || 0) | 0;
    if (taken >= EVO_MAX_TIERS) return null;
    return EVO_TIER_LEVELS[taken];
  }

  const MOUNT_PM = {
    Mount1: 1,
    Mount2: 1,
    Mount3: 2,
    Mount4: 1,
    Mount5: 2,
  };

  function currentMountFolder() {
    try {
      const L = currentLook();
      if (L && L.mount && L.mount !== "None") return L.mount;
    } catch (_e) {}
    return "None";
  }

  function mountPmBonus(folder) {
    const f = folder || currentMountFolder();
    return MOUNT_PM[f] || 0;
  }

  function toRideAnim(anim) {
    if (!anim || anim === "Die" || anim === "TakeDamage") return anim;
    if (anim === "Idle" || anim === "RideIdle") return "RideIdle";
    if (/Walk|Run|Strafe|Crouch|RideRun$/i.test(anim)) return "RideRun";
    if (/AttackRun/i.test(anim)) return "RideRunAttack1";
    if (/Attack|Kick|Special|Taunt/i.test(anim)) return "RideIdleAttack1";
    return anim;
  }

  function lookSeed(look) {
    const L = look || {};
    return [L.head || "", L.body || "", L.chest || "", L.weapon || "", L.offhand || "", L.backpack || "", L.mount || ""].join("|");
  }

  /**
   * Barre de sorts — Coup brut + sorts custom de l’éditeur (slots libres).
   */
  function readCustomSpells() {
    const out = [];
    const tryParse = (raw) => {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) out.push(...arr);
      } catch (_e) {}
    };
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem("neuro.customSpells")) {
        tryParse(localStorage.getItem("neuro.customSpells"));
      }
    } catch (_e) {}
    if (!out.length) {
      try {
        if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("neuro.customSpells")) {
          tryParse(sessionStorage.getItem("neuro.customSpells"));
        }
      } catch (_e) {}
    }
    return out;
  }

  function buildSpellBar(look) {
    const L = look || currentLook();
    const weapon = L.weapon && L.weapon !== "None" ? L.weapon : "None";
    const hasWeapon = weapon !== "None";
    const customs = readCustomSpells().filter(function (s) {
      return s && s.id && s.id !== "punch";
    });
    const slots = [
      {
        slot: "weapon",
        label: "Coup brut",
        spellId: "punch",
        anim: hasWeapon ? animForGear("weapon", weapon) : "Attack2",
        source: weapon,
        locked: false,
      },
    ];
    const names = ["kick", "offhand", "hero", "bonusA", "bonusB"];
    for (let i = 0; i < names.length; i++) {
      const s = customs[i];
      if (s) {
        const step0 = s.steps && s.steps[0];
        slots.push({
          slot: names[i],
          label: String(s.name || "Sort").trim().slice(0, 12) || "Sort",
          spellId: s.id,
          anim: (step0 && step0.anim) || s.anim || "Kick",
          source: "custom",
          locked: false,
        });
      } else {
        slots.push({
          slot: names[i],
          label: "—",
          spellId: null,
          anim: null,
          source: null,
          locked: true,
        });
      }
    }
    return slots;
  }

  function isSelfSpellId(spellId) {
    return (
      spellId === "bouclier" ||
      spellId === "armure_nanites" ||
      spellId === "nanites" ||
      spellId === "reconstruction" ||
      spellId === "overclock" ||
      spellId === "invisibilite" ||
      spellId === "double" ||
      spellId === "roulade"
    );
  }

  /** Débloque + équipe le sort lié à l’arme du look (A1 suite). */
  function syncWeaponSpell() {
    const folder = currentWeaponFolder();
    const entry = weaponEntry(folder);
    const spellId = resolveSpellId(entry);
    const Loadout = global.Loadout;
    const State = global.State;
    if (!Loadout || !State) return { folder, spellId, anim: entry.anim, loadout: loadoutForWeapon(folder) };
    try {
      Loadout.unlock(spellId);
      if (!Loadout.isEquipped(spellId) && Loadout.canEquipMore()) Loadout.equip(spellId);
      else if (!Loadout.isEquipped(spellId) && State.equipped && State.equipped.length) {
        State.equipped[0] = spellId;
      }
      State._weaponSpell = spellId;
      State._weaponAnim = entry.anim || "Attack1";
      State._weaponArchetype = entry.archetype;
      State._weaponAttacks = entry.attacks;
    } catch (_e) {}
    return { folder, spellId, anim: entry.anim, loadout: loadoutForWeapon(folder) };
  }

  /**
   * Enrichit les choix d’évo :
   * - garde anim/fx du choix (sinon fallback spectacle index)
   * - tag lisible Efficace / Équilibré / Style
   */
  function decorateEvoChoices(choices) {
    if (!choices || !choices.length) return choices;
    return choices.map((ev, i) => {
      const spectacle = Math.min(3, i + 1);
      const power = Math.max(1, 4 - spectacle);
      const anim = ev.anim || EVO_SPECTACLE_ANIMS[spectacle - 1] || "Attack1";
      const fx = ev.fx !== undefined ? ev.fx : EVO_SPECTACLE_FX[spectacle - 1];
      const style =
        spectacle === 1 ? "Efficace" : spectacle === 2 ? "Équilibré" : "Spectacle";
      const fxLab = fx ? " · FX " + fx : " · sans FX";
      const tag = style + " · " + anim + fxLab;
      const baseApply = ev.apply;
      return Object.assign({}, ev, {
        spectacle,
        power,
        anim,
        fx,
        d: (ev.d || "") + " · " + tag,
        apply(st) {
          if (typeof baseApply === "function") baseApply(st);
          if (!st.evo) st.evo = {};
          st.evo.anim = anim;
          st.evo.fx = fx;
          st.evo.spectacle = spectacle;
        },
      });
    });
  }

  /** Anim sheet fantasy pour un sort (évo > anim équipement > défaut). */
  function evoCatalogKey(tier, name) {
    return String(tier) + ":" + name;
  }

  function splitEvoFx(fx) {
    if (!fx) return { slash: "None", effect: "None" };
    if (/^Slash/i.test(fx)) return { slash: fx, effect: "None" };
    if (/^Effect/i.test(fx)) return { slash: "None", effect: fx };
    return { slash: "None", effect: "None" };
  }

  function defaultEvoConfigEntry(choice) {
    const fx = splitEvoFx(choice.fx);
    return {
      enabled: false,
      anim: choice.anim || "Attack1",
      slash: fx.slash,
      effect: fx.effect,
      fps: 14,
      delay: 0,
      hitAnim: "TakeDamage",
      hitAnimFps: 14,
    };
  }

  /** Complète evoConfig avec les choix manquants du catalogue EVO_TREE. */
  function ensureEvoConfig(spellId, evoConfig) {
    const tree = EVO_TREE[spellId];
    const out = Object.assign({}, evoConfig || {});
    if (!tree) return out;
    [1, 2].forEach(function (tier) {
      (tree[tier] || []).forEach(function (ch) {
        const k = evoCatalogKey(tier, ch.name);
        if (!out[k]) out[k] = defaultEvoConfigEntry(ch);
        else {
          if (out[k].fps == null) out[k].fps = 14;
          if (out[k].delay == null) out[k].delay = 0;
          if (!out[k].hitAnim) out[k].hitAnim = "TakeDamage";
          if (out[k].hitAnimFps == null) out[k].hitAnimFps = 14;
        }
      });
    });
    return out;
  }

  /** Choix activés dans l’ordre palier 1 → 2. */
  function enabledEvoChoices(spellId, evoConfig) {
    const tree = EVO_TREE[spellId];
    if (!tree || !evoConfig) return [];
    const out = [];
    [1, 2].forEach(function (tier) {
      (tree[tier] || []).forEach(function (ch) {
        const k = evoCatalogKey(tier, ch.name);
        const e = evoConfig[k];
        if (e && e.enabled) out.push({ tier: tier, choice: ch, entry: e });
      });
    });
    return out;
  }

  /** Délai avant + durée complète d’une anim (toutes les frames du sheet). */
  function animStepTiming(step, cols) {
    cols = cols || 15;
    const delay = Math.max(0, step.delay != null ? (step.delay | 0) : 0);
    let fps = step.fps != null ? step.fps : 14;
    if (fps < 1) fps = 14;
    const dur = Math.max(120, Math.round((cols / fps) * 1000));
    return { delay: delay, dur: dur, fps: fps };
  }

  /** Steps pour prévisualisation / chaîne d’anim en combat. */
  function buildEvoAnimSteps(spellId, evoConfig) {
    return enabledEvoChoices(spellId, evoConfig).map(function (item) {
      const ch = item.choice;
      const e = item.entry;
      const step = {
        anim: e.anim || ch.anim || "Attack1",
        delay: e.delay != null ? e.delay : 0,
        fps: e.fps != null ? e.fps : 14,
        slash: e.slash || "None",
        effect: e.effect || "None",
        hitTarget: false,
      };
      const t = animStepTiming(step);
      step.dur = t.dur;
      return step;
    });
  }

  /** Cumule les effets + dernière anim/FX des évolutions activées (mute st). */
  function applyEvoConfig(spellId, evoConfig, st) {
    if (!st) return;
    if (!st.evo) st.evo = {};
    const bonuses = editorEvoBonuses(spellId, evoConfig);
    Object.keys(bonuses).forEach(function (k) {
      st.evo[k] = (st.evo[k] | 0) + (bonuses[k] | 0);
    });
    const enabled = enabledEvoChoices(spellId, evoConfig);
    if (enabled.length) {
      const last = enabled[enabled.length - 1];
      if (last.entry.anim) st.evo.anim = last.entry.anim;
      const slash = last.entry.slash && last.entry.slash !== "None" ? last.entry.slash : null;
      const effect = last.entry.effect && last.entry.effect !== "None" ? last.entry.effect : null;
      st.evo.fx = slash || effect || st.evo.fx || null;
    }
  }

  /** Bonus cumulés sans modifier l’état de combat persisté. */
  function editorEvoBonuses(spellId, evoConfig) {
    const out = {};
    enabledEvoChoices(spellId, evoConfig).forEach(function (item) {
      const fake = { evo: {} };
      try {
        if (typeof item.choice.apply === "function") item.choice.apply(fake);
      } catch (_e) {}
      Object.keys(fake.evo).forEach(function (k) {
        out[k] = (out[k] | 0) + (fake.evo[k] | 0);
      });
    });
    return out;
  }

  function castAnimFor(def, st) {
    if (st && st.evo && st.evo.anim) return st.evo.anim;
    const State = global.State;
    const folder = currentWeaponFolder();
    const entry = weaponEntry(folder);
    if (entry && def && (def.id === entry.spell || (entry.attacks && entry.attacks.indexOf(def.id) >= 0))) {
      return entry.anim || animForGear("weapon", folder);
    }
    if (State && State._weaponSpell === (def && def.id) && State._weaponAnim) return State._weaponAnim;
    if (!def) return "Attack1";
    if (def.id === "punch") return animForGear("weapon", folder);
    if (def.type === "heal" || def.type === "shield" || def.cat === "def" || def.cat === "sup") {
      let off = "None";
      try {
        const raw = localStorage.getItem("neuro.fantasyLook");
        if (raw) {
          const o = JSON.parse(raw);
          if (o && o.look && o.look.offhand) off = o.look.offhand;
        }
      } catch (_e) {}
      return animForGear("offhand", off);
    }
    if (def.range > 2) return "Attack1";
    return "Attack3";
  }

  /** Map anim fantasy → clé Sprite legacy (melee/shoot) pour packs non-fantasy. */
  function toSpriteKey(fantasyAnim) {
    if (!fantasyAnim) return "melee";
    if (/Special|Kick|Attack[456]/i.test(fantasyAnim)) return "melee";
    if (/AttackRun|Attack1/i.test(fantasyAnim)) return "shoot";
    return "melee";
  }

  global.FantasyBridge = {
    SCHOOL_FANTASY,
    SPELL_SKIN,
    ARCHETYPES,
    WEAPON_ARCHETYPE,
    WEAPON_SPELL,
    WEAPON_ANIM_KEY,
    WEAPON_ANIM_VER,
    BAKED_WEAPON_ANIM,
    applySpellSkin,
    archetypeFor,
    loadoutForWeapon,
    attackIdsForWeapon,
    weaponEntry,
    animForGear,
    suggestGearAnim,
    readWeaponAnimMap,
    ensureWeaponAnimMap,
    currentWeaponFolder,
    currentMountFolder,
    mountPmBonus,
    toRideAnim,
    MOUNT_PM,
    currentLook,
    buildSpellBar,
    isSelfSpellId,
    OFFHAND_SPELL,
    BACKPACK_SPELL,
    syncWeaponSpell,
    decorateEvoChoices,
    evoChoicesFor,
    nextEvoTier,
    EVO_TREE,
    EVO_MAX_TIERS,
    EVO_CHOICES_PER_TIER,
    evoCatalogKey,
    splitEvoFx,
    defaultEvoConfigEntry,
    ensureEvoConfig,
    enabledEvoChoices,
    buildEvoAnimSteps,
    animStepTiming,
    applyEvoConfig,
    editorEvoBonuses,
    castAnimFor,
    toSpriteKey,
    resolveSpellId,
  };
})(typeof window !== "undefined" ? window : globalThis);
