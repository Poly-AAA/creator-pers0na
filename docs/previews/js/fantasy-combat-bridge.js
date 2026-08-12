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
   * - baseSpell = signature d’archétype
   * - attacks = [base, …effets du pool] (max 4, déterministe)
   * - anim = anim préférée
   */
  function loadoutForWeapon(folder) {
    const f = folder || "None";
    const arch = archetypeFor(f);
    const base = arch.base;
    const extras = uniqueStable(arch.pool, f, 3, [base]);
    const attacks = [base].concat(extras).slice(0, 4);
    const anim = pickStable(arch.anims, f, "anim") || arch.anims[0] || "Attack1";
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

  /** Compat : ancienne forme { spell, anim }. */
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
   * Enrichit les 3 choix d’évo :
   * index 0 = meilleure efficacité (stats), spectacle 1 (anim basique)
   * index 2 = moins bonne efficacité, spectacle 3 (belle anim)
   */
  function decorateEvoChoices(choices) {
    if (!choices || !choices.length) return choices;
    return choices.map((ev, i) => {
      const spectacle = Math.min(3, i + 1);
      const power = Math.max(1, 4 - spectacle);
      const anim = EVO_SPECTACLE_ANIMS[spectacle - 1] || "Attack1";
      const fx = EVO_SPECTACLE_FX[spectacle - 1];
      const tag =
        spectacle === 1
          ? "⚡ Efficace · anim simple"
          : spectacle === 2
            ? "◆ Équilibré"
            : "✦ Style · anim spectaculaire";
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

  /** Anim sheet fantasy pour un sort (évo > arme > défaut type). */
  function castAnimFor(def, st) {
    if (st && st.evo && st.evo.anim) return st.evo.anim;
    const State = global.State;
    if (State && State._weaponSpell === (def && def.id) && State._weaponAnim) return State._weaponAnim;
    if (!def) return "Attack1";
    if (def.id === "punch") return "Attack2";
    if (def.type === "heal" || def.type === "shield") return "Special1";
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
    applySpellSkin,
    archetypeFor,
    loadoutForWeapon,
    attackIdsForWeapon,
    weaponEntry,
    currentWeaponFolder,
    syncWeaponSpell,
    decorateEvoChoices,
    castAnimFor,
    toSpriteKey,
    resolveSpellId,
  };
})(typeof window !== "undefined" ? window : globalThis);
