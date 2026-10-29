# ASSET BIBLE — creator-pers0na (combat iOS pixel, style Merakintsugi)

> Version kit : 2026-10-29. Sources inspectées (pas devinées) : repo `Poly-AAA/creator-pers0na` (`assets/packs/fantasy-cc/`, `scripts/build-*.py`) et builds `combat-v2.7 … v3.1.1-ios-pixel.html`.
> **Règle d'or pour toute IA : tu n'improvises RIEN hors de ce document.** Si une info manque, tu t'arrêtes et tu poses la question. Tu ne modifies jamais les fichiers existants du jeu : tu produis uniquement de NOUVEAUX PNG (+ les extraits de code d'intégration à coller).

---

## 0. Ordre de lecture pour une IA

1. Ce fichier en entier.
2. `anchors.json` (`meta` d'abord) + `reference/contact_*.png` + `reference/palette_swatch.png`.
3. `template/generator_template.py` (tu ne modifies QUE les 3 zones `ZONE ÉDITABLE`).
4. `PROMPTS.md` pour le gabarit de la tâche.

---

## 1. Format des sheets (non négociable)

| Propriété | Valeur exacte |
|---|---|
| Taille d'une sheet | **1920 × 1024 px**, PNG **RGBA** |
| Grille | **15 colonnes × 8 lignes**, cellules **128 × 128** |
| Colonnes | frames **col 0 … col 14** (15 frames, toutes utilisées par NakedBody dans les 30 anims) |
| Lignes | **8 directions** (voir §2) |
| Alpha | **0 ou 255 uniquement** (aucun pixel semi-transparent) |
| Lissage | aucun : nearest-neighbor, `ctx.imageSmoothingEnabled = false` partout dans le jeu |
| Alignement | **au pixel près sur `NakedBody/<Anim>.png`** même cellule, même position. Aucun recentrage, aucun redimensionnement |
| Échelle | 1 px sprite = 1 px source. Jamais de downscale/upscale d'une sheet livrée |
| Fichier | `<Dossier>/<Anim>.png` (une sheet par animation) |

Position absolue d'un pixel de la frame (row, col) : `X = col*128 + x`, `Y = row*128 + y` avec (x, y) dans la cellule.

## 2. Directions (ordre des lignes)

Source : `assets/packs/fantasy-cc/dir-row.json` (calibré utilisateur, `ver cal-2026-08-12`) + commentaire `FACE` de `build-feminine-panoply.py` + `ROW_LABEL` de `build-head25-hat.py`.

| row | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| direction écran | **E** | **SE** | **S** (face) | **SW** | **W** | **NW** | **N** (dos) | **NE** |
| (fx, fy) écran | (1,0) | (.75,.6) | (0,1) | (-.75,.6) | (-1,0) | (-.75,-.6) | (0,-1) | (.75,-.6) |

`dir-row.json` encode `row → index écran (0=N,1=NE,2=E,…,7=NW)` = `[2,3,4,5,6,7,0,1]` pour toutes les anims listées ; le jeu convertit via `sheetRowForDir(dir, anim)`. **Les sheets restent toujours dans l'ordre row 0=E … row 7=NE.**

## 3. Les 30 animations

Ordre canonique (`catalog.json → anims`). Toutes : 8 rows × 15 cols, frame 0 → 14. `defaultFps` du pack = **14** (éditeur). En combat, `ANIM_CALIBRATION` (build v3.1.1) fixe fps / frames / colonne d'impact :

| # | Anim | Boucle* | fps combat | frames jouées | impactCol | hitDelay ms | Embarquée dans le HTML** |
|---|---|---|---|---|---|---|---|
| 1 | Idle | oui | 11 | 0–14 | 0 | 0 | ✔ |
| 2 | Idle2 | oui | (14) | 0–14 | – | – | – |
| 3 | Idle3 | oui | (14) | 0–14 | – | – | – |
| 4 | Idle4 | oui | (14) | 0–14 | – | – | – |
| 5 | Walk | oui | 16 | 0–14 | 7 | 0 | ✔ |
| 6 | Run | oui | 17 | 0–14 | 7 | 0 | ✔ |
| 7 | RunBackwards | oui | (14) | 0–14 | – | – | – |
| 8 | StrafeLeft | oui | (14) | 0–14 | – | – | – |
| 9 | StrafeRight | oui | (14) | 0–14 | – | – | – |
| 10 | CrouchIdle | oui | (14) | 0–14 | – | – | – |
| 11 | CrouchRun | oui | (14) | 0–14 | – | – | – |
| 12 | Attack1 | non | 19 | 0–14 | 5 | 260 | ✔ |
| 13 | Attack2 | non | 20 | 0–14 | 4 | 200 | ✔ |
| 14 | Attack3 | non | 19 | 0–14 | 6 | 310 | ✔ |
| 15 | Attack4 | non | 18 | 0–14 | 8 | 420 | ✔ |
| 16 | Attack5 | non | 19 | 0–14 | 6 | 310 | ✔ |
| 17 | Attack6 | non | 19 | **0–13** | 5 | 260 | ✔ |
| 18 | AttackRun | oui | 19 | 0–14 | 6 | 310 | ✔ |
| 19 | AttackRun2 | oui | 19 | 0–14 | 7 | 360 | ✔ |
| 20 | Kick | non | 19 | 0–14 | 6 | 310 | ✔ |
| 21 | Special1 | non | 19 | 0–14 | 5 | 260 | ✔ |
| 22 | TakeDamage | non | 20 | **0–13** | 4 | 0 | ✔ |
| 23 | Die | non | 15 | 0–14 | 10 | 0 | ✔ |
| 24 | Taunt | non | 17 | **0–13** | 8 | 300 | ✔ |
| 25 | Slide | non | 20 | 0–14 | 4 | 200 | ✔ |
| 26 | Rolling | non | 20 | 0–14 | 8 | 0 | ✔ |
| 27 | RideIdle | oui | (14) | 0–14 | – | – | ✔ |
| 28 | RideRun | oui | (14) | 0–14 | – | – | ✔ |
| 29 | RideIdleAttack1 | oui | (14) | 0–14 | – | – | ✔ |
| 30 | RideRunAttack1 | oui | (14) | 0–14 | – | – | ✔ |

\* « Boucle » = ensemble `LOOP` de `build-feminine-panoply.py` (sert au mouvement secondaire : la frame précédente de col 0 est col 14).
\*\* Les 22 anims ✔ sont celles embarquées en base64 dans `KINTSUGI_INLINE_SHEETS` (HeadKintsugi, Melee26…). **Livrer les 30**, mais les 22 ✔ sont le minimum obligatoire pour le build iOS.
Les fps entre parenthèses = pas de calibrage combat (fps éditeur 14). Les armes surchargent fps/anim via `WEAPON_DB` (ex. `Melee30: anim "Attack2", fps 21, hitDelay 195`).

Réactions (`REACTIONS`, build v3.1.1) qui réutilisent des sous-plages : `flinch` TakeDamage [0,1,2] 16 fps ; `stagger` [0..5] 12 fps ; `launch` [2..6] ; `knockback` [0..4] ; `frozen` [1,2] 8 fps ; `shock` [0,2,1,3,0] 18 fps ; `ko` Die [0,2,4,6,8,10,12,14] 12 fps (hold) ; `buff/heal/shield` Idle [0]. → **chaque frame doit être lisible isolément**, pas seulement en séquence.

Fallbacks (`resolveSheet`) : les anims d'attaque, TakeDamage et Die n'ont **aucun fallback** → une pièce sans `Attack3.png` disparaît pendant Attack3. Les anims de déplacement retombent sur Idle puis Walk/Run.

## 4. Slots, calques et ordre de dessin (z-order)

### 4.1 Slots du jeu (`SLOTS`) → calque sprite (`GEAR_DEF`)

| slot jeu | calque (`layer`) | familles de dossiers | Visuel ? |
|---|---|---|---|
| coiffe | head | `Head1…25`, `HeadKintsugi`, `HeadMeraHair` | oui |
| amulette | – | – | **non** (pas de calque sprite) |
| cape | backpack | `Bag1…8`, `BackKintsugi` | oui |
| torse | chest | `Chest1…19`, `ChestKintsugi` | oui |
| arme | weapon | `Melee1…30`, `MeleeKintsugi`, `Magic1…3`, `Ranged1…7` | oui |
| anneauG / anneauD | – | – | **non** |
| ceinture | belt | `Belt1…2` | oui |
| gants | gloves | **`Hands1…4`** (dossier = `Hands…`, pas `Gloves`) | oui |
| bouclier | offhand | `Shield1…7`, `Offhand1…2` | oui |
| jambes | legs | `Legs1…9`, `LegsKintsugi` | oui |
| bottes | shoes | `Shoes1…5`, `FeetKintsugi` (préfixe `Feet` accepté) | oui |
| (corps) | body | `NakedBody`, `NakedBody2`, `NakedBody3` | requis |

Hors slots : `Shadow` (ombre au sol), `Slash1/2` et `Effect1…5` (FX), `Mount1…5`.

### 4.2 Ordre de dessin (bas → haut)

`catalog.json → layerOrder` : `shadow, body, shoes, legs, chest, belt, gloves, offhand, weapon, backpack, head, slash, effect, mount`.
Le jeu (`sortEntityLayersForRow` / `layersForRow`, v3.1.1) applique en réalité, par direction :

```
mount → shadow → [cape DERRIÈRE] → body → shoes → legs → chest → belt → gloves
      → [arme/bouclier dans l'ordre de la row] → [cape DEVANT] → hair → head → slash → effect
```

| row (dir) | 0 E | 1 SE | 2 S | 3 SW | 4 W | 5 NW | 6 N | 7 NE |
|---|---|---|---|---|---|---|---|---|
| `weaponAfterShieldRows` (arme dessinée APRÈS bouclier = devant) | true | true | true | false | false | false | false | true |
| `backpackInFrontRows` (cape/sac DEVANT le corps) | true | false | false | false | false | true | true | true |

Conséquences pour le dessin :
- Une **cape** est un seul calque : sur les rows 0,5,6,7 elle passe au-dessus du corps/armure → elle ne doit couvrir que le dos/l'épaule visible ; sur rows 1–4 elle est derrière → elle peut dépasser autour du corps.
- **Cheveux (`Hair*`) sous la coiffe** ; un heaume fermé (`Head10|12|14|16|18|20|22`, `FULL_HELMET_RE`) masque les cheveux.
- Les gants (`Hands*`) sont dessinés AU-DESSUS du torse : pas de contour des gants sur le torse (cf. `outline(img, only_on=~torso & ~sleeve)` dans `render_hands`).
- **Budget mobile : max 3 calques superposés sur un même pixel** (overdraw ≤ 3, règle Technical Artist). Ne pas empiler 4 pièces opaques au même endroit ; un FX = 1 `drawImage` par frame (cf. `drawBlueFlameSlash`).

### 4.3 Teinte (tint)

- Les dossiers du pack d'origine (`Chest3`, `Head7`…) sont en **niveaux de gris** et teintés au runtime (`multiply` + `screen` 20 %, `stampTintedFrame`).
- Les assets Merakintsugi sont **pré-colorés** et ne doivent JAMAIS être teintés : item avec `noTint: true`, et nom de dossier qui finit par `Kintsugi` ou `MeraHair` (regex `/(Kintsugi|MeraHair)$/i`), ou exception explicite (`/^Melee(2[6-9]|30)$/`). **Un nouveau set pré-coloré (ex. `…Feminine`) doit être ajouté à ces regex**, sinon `GEAR_DEF` lui applique une teinte TINTS (§9).

## 5. Nommage des dossiers et fichiers

- Dossier = `<Partie><Set>` en PascalCase, sans espace ni accent : `Head`, `Chest`, `Back`, `Legs`, `Feet`, `Hands`, `Melee`/`Magic`/`Ranged`, `Shield`/`Offhand`, `Belt`, `Hair`. Exemples existants : `HeadKintsugi`, `ChestFeminine`, `HandsFemininePulpeuse`, `HeadMeraHair`.
- Armes numérotées : prochain numéro libre = **`Melee31`** (Melee26–29 éléments v2.9, Melee30 Lame Ardente v3.1).
- Variante d'un set : suffixe accolé (`ChestFeminine` → `ChestFemininePulpeuse`), générée par le même script (`--variant pulpeuse`).
- Fichiers : `<Anim>.png` avec les 30 noms exacts du §3 (casse exacte : `AttackRun2.png`, `RideIdleAttack1.png`).
- Emplacement repo : `assets/packs/fantasy-cc/spritesheets/<Dossier>/<Anim>.png`.
- Le jeu adresse une sheet par la clé `"<Dossier>/<Anim>"`.

## 6. Palettes

Voir `reference/palette_swatch.png`. Toutes les couleurs sont des hex exacts.

- **Contour unique : `#1C154D`** (1 px, 4-voisins, à l'extérieur de la pièce).
- **3 tons par matériau** (clair L / moyen M / sombre D), max 4 matériaux par pièce → ≤ 13 couleurs par sheet (12 + contour).
- Panoplie féminine (référence actuelle) :
  - cheveux cuivre `#F4A96A / #C8613F / #85323A`
  - tissu prune `#C26BB0 / #8A3E95 / #4E2468`
  - or rose `#FFE0B0 / #E7A465 / #A9623F`
  - sarcelle (gants, ruban) `#8CF0D8 / #34B3A0 / #1F6B78`
  - vernis ongles `#FFC2D6 / #FF4F86 / #B0245A`
- Éléments (armes + VFX, `MERAKI_PALETTES` core/edge/dark) :
  - **Feu** `#FFF6E0 / #FF5E2B / #9E1B1B` (outline arme `#3A0A0A`)
  - **Eau** `#F0FBFF / #2EA8FF / #164E87` (outline `#0A2340`)
  - **Terre** `#FFF8DC / #E08E26 / #6B4423` (outline `#2E1C0E`)
  - **Air** `#F7FFFA / #3CE6B0 / #186A5B` (outline `#0A2E27`)
  - lumière `#FFFDF0 / #FACC15 / #A16207`, ombre `#F5F0FF / #A855F7 / #4C1D95`, poussière `MERAKI_DUST` `#F2E8DA / #B09E8E`.
- Exception documentée : les armes élémentaires v2.9 (`build_elem_weapons.py`) ont un contour sombre **par élément** (ci-dessus) au lieu de `#1C154D`. Les nouvelles pièces de vêtement utilisent toujours `#1C154D`.
- Le set Kintsugi (v2.8) est antérieur à la règle : plusieurs contours sombres (`#100C2A`, `#121434`…) et des PNG en mode palette. **Ne pas copier ses couleurs** ; la référence de style est le set Féminin (validé à 100 % par le validateur du template).

## 7. Style Merakintsugi (règles de rendu)

1. **Cel-shading 3 tons par matériau** : M en aplat ; L sur les bords haut/gauche (lumière haut-gauche) ; D sur les bords bas/droite ; les plis/ombres du corps (`luminance NakedBody < 120`) passent en D. (Fonction `cel()` — identique dans le template.)
2. **Contour 1 px `#1C154D`** autour de la pièce (anneau 4-voisins sur pixels transparents). Pas de contour intérieur entre matériaux d'une même pièce.
3. Pas de dégradé, pas de dithering décoratif, pas de pixel isolé « bruit ». Détails (coutures, laçage, broche) = 1 px d'un ton existant.
4. Silhouette issue de la segmentation du corps (`reference/bodyparts`) : la pièce épouse le corps, débord max par slot (template `MAX_OUTSET`) : torse 4 px, jambes 5, gants 2, bottes 2, ceinture 3, coiffe 14, cape 22, bouclier 24.
5. Lecture à 1× sur mobile : volumes simples, contraste L/D fort, pas de détail < 1 px.
6. VFX de sorts : **2 tons posterisés** (core + edge, éventuellement dark), pixels pleins 2×2 (`drawHollowPixelPuff` : pas de 2 px, anneau extérieur = edge, centre = core, trou qui s'ouvre après 30 % de vie, damier 1/2 après 66 %).

## 8. Interdits

- ❌ **Visage : pas d'yeux, pas de bouche, pas de nez** sur les têtes/coiffes (interdit pour l'instant ; le visage viendra en dernier). ⚠ `HeadKintsugi` contient encore 1–2 px « yeux » sarcelle (héritage v2.8) : ne pas reproduire.
- ❌ Tenue non couvrante : **toujours entièrement habillé** (torse + manches couverts à 100 %, jambes couvertes). Le validateur exige ≥ 99 % de couverture des parties du slot.
- ❌ Anti-aliasing, alpha partiel, flou, `imageSmoothing`, redimensionnement bilinéaire.
- ❌ Couleur hors palette déclarée ; plus de 3 tons par matériau.
- ❌ Décaler, recentrer ou rescaler le corps ; dessiner hors de la cellule 128×128 ou toucher son bord.
- ❌ Renommer/modifier un fichier existant (`NakedBody`, `catalog.json`, HTML, scripts). On AJOUTE seulement.
- ❌ Plus de 3 calques superposés sur mobile ; VFX à plus de 2 tons principaux.
- ❌ Inventer une anim, une direction, un slot ou un champ de code qui n'est pas dans ce document.

## 9. Mouvement secondaire

Tous les mouvements secondaires = **retard d'exactement 1 frame** sur le corps (frame précédente : `col-1`, et pour les anims en boucle col 0 ← col 14 ; pour les anims non bouclées col 0 ← col 0).
- **Cheveux / mèches / pans / cape** : suivent la position de la tête (ou du bassin) de la frame précédente ; traînée opposée au déplacement (`TRAIL` : Walk 0.55, Run 1.0, RunBackwards −0.6, CrouchRun 0.7, AttackRun/2 0.9, Slide 0.9, RideRun 0.9, Strafe 0.3). La queue de cheveux reste côté nuque, jamais devant le visage. Chaîne de 8 nœuds, segment 1.9 px (build-feminine).
- **Buste / hanches** : rebond **±1 px vertical**, retard 1 frame (`clip(y_prev − y_cur, −1, 1)`).
- Dans le template : `F.lag("pelvis", axis=1, clamp=1)` (rebond), `F.lag("head_center", axis=0, clamp=2)` (cheveux), `F.P` = ancres de la frame précédente.

## 10. Armes, VFX et évolutions de sorts

### 10.1 Armes
- Une arme est une sheet `Melee<NN>/<Anim>.png` alignée sur NakedBody, **dérivée cellule par cellule d'une arme existante** (même grip/pose) : ex. `Melee26 ← Melee21`, `Melee27 ← Melee17`, `Melee28 ← Melee10`, `Melee29 ← Melee1`. Méthode `build_elem_weapons.py` : pixels lum ≥ 128 = tête/lame, < 128 = manche ; axe manche→lame ; accessoire procédural au bout (pointes, crochet, masse, garde) ; 2 tons posterisés + manche sombre + contour 1 px, alpha 0/255.
- Ancres : `weapon_grip` / `weapon_tip` dans `anchors.json` (référence `Melee2`).
- Code à fournir : `WEAPON_ARCHETYPE` (`blade|greatblade|polearm|trapper|…`), `WEAPON_DB` (`name, cat, anim, fps, hitDelay, cost, minRange, range, dmg, crit, aoe, element, bonus`), `BAKED_WEAPON_ANIM.weapon`, `KINTSUGI_NAMES`, `GEAR_DEF` arme, exception tint, item factory (`makeElementalWeaponItems` pattern).

### 10.2 VFX (atlas pré-rendus)
- Format atlas (`window.BLUE_FLAME_SLASH`, `window.FIRE_FX`) : **lignes = 8 octants d'angle** (0=E, 1=SE, 2=S, … sens horaire écran, `oct = round(angle/45°)`), **colonnes = frames**, cellule carrée `cell` px ; métadonnées `{cell, frames, reach|span|footY, fps?, src}`. Ex. `t2 {cell:80, frames:10, reach:20}`, `t3 {cell:112, frames:13, reach:29}`, `buff {cell:80, frames:11, fps:13.4, footY:64}`. FIRE_FX déclare aussi `iso:[0,26.565,90,153.435,180,206.565,270,333.435]`.
- Exception : les atlas « au sol / sur soi » sans orientation (ex. `fire_buff.png` 880×80 = 11 frames × 1 ligne) n'ont qu'une ligne.
- Pixel art 0/255, 2 tons posterisés, **1 drawImage par frame** (overdraw ≤ 2–3).
- Exemples : `reference/examples/vfx/`.
- Moteur procédural Merakintsugi (code, pas de sprite) : `spawnMerakiCastVfx` → `caster._merakiLunge {t0, dur=hitMs+190, tc, tr, tier, element}` (avancée 0→36 % aller, plateau jusqu'à 58 %, retour) ; `triggerMerakiImpact` → hit-stop `G.hitStopUntil` 65 ms (85 ms tier III), `_hitFreezeUntil` sur cible et lanceur, `target._merakiRecoil {dur 220+35·tier}` ; screen shake 165/210/280 ms amp 3/4/5.5 ; tier III : silhouette fantôme (`_silCv`) + écran assombri 340 ms ; `drawHollowPixelPuff` (poussière/impacts) ; `drawMerakiSmearArc`.

### 10.3 Évolutions de sort (3 paliers)
- `autoEvoTier(sp) = min(3, 1 + nb_lancers)` : **I au 1er lancer**, **II ★ au 2e (+4 dégâts)**, **III ★★ au 3e (+10 dégâts + poussée 1 case)** (`autoEvoBonus`). `spellEvoTier` prend le max avec les paliers choisis ; ennemis : `1 + floor((niveau−1)/3)`.
- `advanceAutoSpellEvolution(sp)` incrémente `G._spellCasts[id]` et affiche « ★ ÉVEILLÉ ! » / « ★★ TRANSCENDANCE ! ».
- Visuel par palier : échelle smear `1 + (tier−1)·0.22` ; II = atlas t2, III = atlas t3 (slash + contre-slash + braises cuits dans le strip). Règles de déclenchement = listes de config `BLUE_FLAME_SLASH_USES`, `FIRE_BUFF_USES`, `FIRE_CHAIN_USES`, `FIRE_DASH_USES` (`{spells, minTier, weapon(regex), weaponCat, minDist, types, event}`).
- Un nouveau VFX d'évolution = **1 atlas par palier** (t2, t3) + 1 entrée dans une liste `*_USES` ; jamais de nouveau moteur.

## 11. Intégration dans le jeu (étapes)

1. Générer les 30 PNG dans `<Dossier>/` avec `template/generator_template.py` → `VALIDATION OK`.
2. Repo : copier le dossier dans `assets/packs/fantasy-cc/spritesheets/<Dossier>/` (commit séparé, ne rien écraser).
3. `catalog.json` (**l'humain** l'édite, pas l'IA) : ajouter `"<Dossier>"` à `slots[id=<layer>].folders` et à `folders`. Ex. :
   ```json
   { "id": "chest", "lab": "Chest", "folders": ["None", "Chest1", "…", "ChestKintsugi", "ChestMonSet"] }
   ```
4. Build HTML (nouvelle version vN+1, jamais en place), même procédure que `patch_v29.py` (chaque remplacement doit matcher exactement 1 fois) :
   - **Embarquer les PNG** : après le premier `</script>`, ajouter
     `<script>Object.assign(window.KINTSUGI_INLINE_SHEETS = window.KINTSUGI_INLINE_SHEETS || {}, {"<Dossier>/<Anim>":"data:image/png;base64,…", …});</script>` (au minimum les 22 anims ✔ du §3 ; si `<Dossier>/Idle` est embarqué, les anims non embarquées ne sont pas cherchées sur le CDN).
   - `KINTSUGI_NAMES` : `"<Dossier>": "Nom FR affiché"`.
   - `GEAR_DEF` : ajouter le dossier en tête de la liste du slot, ex. `["torse", "chest", ["ChestMonSet", "ChestKintsugi"].concat(numFolders("Chest", […]))]`.
   - Pré-coloré → étendre la regex `isKint` (`/(Kintsugi|MeraHair)$/i`) dans la boucle `GEAR_DEF.forEach` ET dans `layersForHero` (`isKintHero`, `nonKint`, `tint = null`).
   - **Item factory** sur le modèle de `makeKintsugiPanoplyItems()` :
     ```js
     function makeMonSetPanoplyItems() {
       return [
         { id: "monset_torse", name: "Tunique …", slot: "torse", layer: "chest", folder: "ChestMonSet",
           level: 5, quality: 1.35, rare: true, set: "monset", noTint: true,
           lines: [{ stat: "vit", value: 24, min: 18, max: 30 }, { stat: "force", value: 10, min: 8, max: 12 }] },
       ];
     }
     ```
     Stats autorisées par slot = `SLOT_STATS` (ex. torse : `vit, force, resTerre`). Puis l'ajouter à l'inventaire comme `grantElementalWeapons` (jamais auto-équipé sans demande).
   - Arme : aussi `WEAPON_ARCHETYPE`, `WEAPON_DB`, `BAKED_WEAPON_ANIM.weapon`.
5. Tester dans le HTML : 8 directions × anims ✔, avec et sans cape/bouclier, sur mobile (≥ 60 fps, pas de clignotement).

## 12. Checklist de validation (à cocher par l'IA AVANT de livrer)

Automatisée par `template/generator_template.py` (`VALIDATION OK` obligatoire) — et à vérifier à l'œil sur `out/preview_<Dossier>.png` :

- [ ] 30 fichiers `<Anim>.png`, noms exacts, dans `<Dossier>/`.
- [ ] Chaque PNG = **1920×1024, RGBA**.
- [ ] **Alpha ∈ {0,255}** (aucun anti-aliasing).
- [ ] Couleurs ⊆ palette déclarée + `#1C154D` ; ≤ 3 tons par matériau.
- [ ] **Contour `#1C154D`** sur ≥ 90 % du bord extérieur de chaque frame (100 % hors zones volontairement non contourées).
- [ ] **Alignement** : aucune frame ne dépasse `MAX_OUTSET[slot]` px hors de la silhouette NakedBody de la MÊME cellule.
- [ ] **Aucun corps découvert** : couverture ≥ 99 % des parties exigées (torse : torso+arm ; jambes : legs ; gants : hands ; bottes : feet).
- [ ] Aucune frame vide quand le corps est visible (vêtements).
- [ ] Rien ne touche le bord de la cellule 128×128.
- [ ] Pas d'yeux/bouche ; tenue couvrante.
- [ ] Mouvement secondaire = retard 1 frame, amplitude ±1 px (buste/hanches) / ±2 px (cheveux).
- [ ] Aperçu vérifié dans les 8 directions (row 0 E … row 7 NE) sur Idle, Walk, Attack1, et superposition correcte selon §4.2.

## 13. Ancres (`anchors.json`)

Extraites par `tools/extract_anchors.py` (reproductible : `python3 tools/extract_anchors.py /chemin/creator-pers0na`). Structure :
```
anims.<Anim>[row] = {row, dir, frames:[15 × {bbox, ground_y, head_top, head_center, neck, chest, pelvis,
                                             hand_l, hand_r, foot_l, foot_r, weapon_grip, weapon_tip}]}
```
- Coordonnées entières dans la cellule (origine haut-gauche). `null` = invisible/non séparable (≈ 4 % des `hand_r`, 5 % des `foot_r` quand mains/pieds se superposent).
- `*_l / *_r` = gauche/droite **écran**, pas anatomique.
- Méthode : segmentation du corps par masques de pièces du pack (Head7, Chest3, Chest9, Legs1, Hands3, Shoes1) intersectés avec NakedBody — exactement comme `build-feminine-panoply.py` —, puis centroïdes/extrémités (détail dans la docstring du script). Arme : intersection de `Melee2` avec les mains.
- `reference/bodyparts/<Anim>.png` : la carte de segmentation (palette : 1 head, 2 torso, 3 arm, 4 hands, 5 legs, 6 feet) — c'est elle que le template utilise pour dessiner.

## 14. Règles d'équipe distillées (agents)

**Technical Artist** (agency-agents `game-development/technical-artist.md` + skill local)
- Budget documenté AVANT production : ici format §1, palette §6, overdraw mobile ≤ 3 calques, 1 drawImage par VFX/frame.
- Atlas plutôt que fichiers isolés (sheets 15×8 ; VFX en atlas octants × frames).
- Valider automatiquement à l'import : pivots/ancres, ordre des calques, taille, alpha (= le validateur du template).
- Ne jamais importer à résolution réduite ; garder la source pixel-exacte.
- Chaque asset relu « en jeu » (aperçu composé sur NakedBody), pas seulement isolé.
- Un spec sheet par type d'asset avant de commencer (= ce document + le prompt).

**Game Designer** (`game-designer.md` + skill local)
- Toute mécanique documentée : but, ressenti, entrées, sorties, cas limites, états d'échec.
- Pas de nombre magique : chaque valeur (dégâts palier, durée hit-stop, fps) a une justification et reste un levier de tuning.
- Ne pas ajouter de complexité sans choix significatif pour le joueur (ex. un VFX d'évolution doit lire « plus fort » d'un coup d'œil).

**Ponytail** (plus petit changement)
- Réutiliser ce qui existe (template, segmentation, listes `*_USES`, item factory) avant d'écrire du neuf.
- Le diff le plus court qui fonctionne : ajouter des fichiers, ne jamais refactorer le jeu.
- Toute nouvelle logique laisse un auto-test (le validateur) ; les raccourcis connus sont commentés `shortcut: <limite>, <quand améliorer>`.

**Codegraph (optionnel)** : pour une IA « code-aware » (Cursor, Claude Code…), `Poly-AAA/codegraph` indexe le repo et permet de retrouver `GEAR_DEF`, `layersForRow`, `spellEvoTier`, etc. Inutile pour une IA de chat simple.

## 15. Dépôts GitHub de référence

| Dépôt | Rôle |
|---|---|
| [Poly-AAA/creator-pers0na](https://github.com/Poly-AAA/creator-pers0na) | Repo du jeu : pack `fantasy-cc`, scripts de génération, pages combat/éditeur (source de vérité). |
| [Poly-AAA/godogen](https://github.com/Poly-AAA/godogen) (fork de htdt/godogen) | Développement de jeu autonome (Godot) avec Claude Code / Codex ; piste de portage moteur. |
| [Poly-AAA/godogen_assets](https://github.com/Poly-AAA/godogen_assets) | Générateurs d'assets locaux gratuits pour godogen (images, 3D, persos riggés/animés, SFX, voix). |
| [Poly-AAA/agency-agents](https://github.com/Poly-AAA/agency-agents) (fork de msitarzewski/agency-agents) | Personas d'agents (Technical Artist, Game Designer…) distillés au §14. |
| [Poly-AAA/codegraph](https://github.com/Poly-AAA/codegraph) (fork de colbymchenry/codegraph) | Graphe de connaissance du code pré-indexé, 100 % local, pour agents code-aware (optionnel). |
| [morluto/rea](https://github.com/morluto/rea) | Rétro-ingénierie par agents (comportement d'app → binaires natifs) ; sert à étudier des jeux de référence. |
| [Arakne/Araknemu](https://github.com/Arakne/Araknemu) | Serveur Dofus simple en Java (référence mécaniques de combat tactique au tour par tour). |
| [Keka-Bron/JondoEmu](https://github.com/Keka-Bron/JondoEmu) | Émulateur Dofus Unity modulaire (référence données/sorts récents). |
| [louisabraham/LaBot](https://github.com/louisabraham/LaBot) | Bot Dofus 2 en Python 3 (référence protocole/données). |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Vocabulaire de design pour agents de code (critique/audit UI, HUD mobile). |

## 16. Versions de build connues
`/workspace/share/combat-v2.7` (VFX Merakintsugi), `v2.8` (panoplie Kintsugi embarquée), `v2.9` (armes élémentaires Melee26–29), `v3.0/3.0.1` (`HeadMeraHair`), `v3.1/3.1.1` (Lame Ardente `Melee30`, FIRE_FX, BLUE_FLAME_SLASH). Ce document est aligné sur **v3.1.1**. Les dossiers `*Feminine*` existent dans le repo mais ne sont **pas encore** branchés dans `GEAR_DEF`/`catalog.json` (aperçus seulement).
