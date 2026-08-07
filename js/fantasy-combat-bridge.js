/**
 * Pont Fantasy — sorts thématisés + 1 sort/anim par arme + FX d’évolution
 * (style vs efficacité : meilleur power = anim basique, pire power = anim spectacle)
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
   * Chaque arme fantasy-cc → sort + anim de cast de base.
   * Anim names = sheets fantasy-cc (Attack1…, Kick, Special1…).
   */
  const WEAPON_SPELL = {
    None: { spell: "punch", anim: "Attack2" },
    Melee1: { spell: "punch", anim: "Attack1" },
    Melee2: { spell: "monofil", anim: "Attack2" },
    Melee3: { spell: "impact_cinetique", anim: "Attack3" },
    Melee4: { spell: "dash", anim: "AttackRun" },
    Melee5: { spell: "punch", anim: "Attack4" },
    Melee6: { spell: "monofil", anim: "Attack5" },
    Melee7: { spell: "impact_cinetique", anim: "Attack6" },
    Melee8: { spell: "mine", anim: "Kick" },
    Melee9: { spell: "punch", anim: "Attack1" },
    Melee10: { spell: "monofil", anim: "Attack2" },
    Melee11: { spell: "dash", anim: "AttackRun2" },
    Melee12: { spell: "impact_cinetique", anim: "Attack3" },
    Melee13: { spell: "punch", anim: "Special1" },
    Melee14: { spell: "monofil", anim: "Attack4" },
    Melee15: { spell: "punch", anim: "Kick" },
    Melee16: { spell: "punch", anim: "Attack5" },
    Melee17: { spell: "monofil", anim: "Attack6" },
    Melee18: { spell: "impact_cinetique", anim: "Attack1" },
    Melee19: { spell: "dash", anim: "AttackRun" },
    Melee20: { spell: "mine", anim: "Attack2" },
    Melee21: { spell: "punch", anim: "Attack3" },
    Melee22: { spell: "monofil", anim: "Special1" },
    Melee23: { spell: "impact_cinetique", anim: "Attack4" },
    Melee24: { spell: "punch", anim: "Attack5" },
    Melee25: { spell: "monofil", anim: "Attack6" },
    Ranged1: { spell: "tir_magnetique", anim: "Attack1" },
    Ranged2: { spell: "arc", anim: "Attack2" },
    Ranged3: { spell: "bombe_thermique", anim: "Attack3" },
    Ranged4: { spell: "tir_magnetique", anim: "Attack4" },
    Ranged5: { spell: "impulsion_emp", anim: "Attack5" },
    Ranged6: { spell: "arc", anim: "Attack6" },
    Ranged7: { spell: "sniper", anim: "Attack1" },
    Magic1: { spell: "gravite", anim: "Special1" },
    Magic2: { spell: "parasite", anim: "Attack3" },
    Magic3: { spell: "surchauffe", anim: "Attack5" },
  };

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

  function weaponEntry(folder) {
    return WEAPON_SPELL[folder] || WEAPON_SPELL.None;
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

  /** Débloque + équipe le sort lié à l’arme du look (A1 suite). */
  function syncWeaponSpell() {
    const folder = currentWeaponFolder();
    const entry = weaponEntry(folder);
    const spellId = resolveSpellId(entry);
    const Loadout = global.Loadout;
    const State = global.State;
    if (!Loadout || !State) return { folder, spellId, anim: entry.anim };
    try {
      Loadout.unlock(spellId);
      if (!Loadout.isEquipped(spellId) && Loadout.canEquipMore()) Loadout.equip(spellId);
      else if (!Loadout.isEquipped(spellId) && State.equipped && State.equipped.length) {
        /* remplace le 1er slot si plein */
        State.equipped[0] = spellId;
      }
      State._weaponSpell = spellId;
      State._weaponAnim = entry.anim || "Attack1";
    } catch (_e) {}
    return { folder, spellId, anim: entry.anim };
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
    WEAPON_SPELL,
    applySpellSkin,
    weaponEntry,
    currentWeaponFolder,
    syncWeaponSpell,
    decorateEvoChoices,
    castAnimFor,
    toSpriteKey,
    resolveSpellId,
  };
})(typeof window !== "undefined" ? window : globalThis);
