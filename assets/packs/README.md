# Packs d’assets externes (référence)

Packs téléchargés via tes liens Dropbox.  
Le jeu (`neuro-core-sprite.html`) peut basculer **Thug** / **Knight** / **x180 Fantasy** / **Mannequin Idle** via ⚙ SPRITE → PACK.

## 1) `survivor-hd-bike/` — Character HD Survivor + moto

| | |
|--|--|
| Source zip | `FREE-Character-HD-Survivor-W-Bike.zip` |
| Planches | 23 PNG, chacune **1792×1024**, fond transparent |
| Contenu typique | Idle / Walk / Run / Attack / Die / Strafe / **RideIdle** / **RideRun** (moto) |

Anims présentes :
`Idle`, `Idle2`, `Idle3`, `Walk`, `Run`, `CrouchIdle`, `CrouchRun`,  
`Attack1`–`Attack4`, `RunAttack`, `StrafeLeft`, `StrafeRight`,  
`StrafeLeftAttack`, `StrafeRightAttack`, `RunBackwards`, `RunBackwardsAttack`,  
`TakeDamage`, `Taunt`, `Die`, **`RideIdle`**, **`RideRun`**

Grille probable (à confirmer au découpage) :
- **8 directions × 8 frames** → case **224×128**  
  (format fréquent CraftPix top-down)

## 2) `thug-16bit-outlined/` — Character 16-bit Thug (outlined)

| | |
|--|--|
| Source zip | `FREE-Character-16-bit-Thug-Outlined.zip` |
| Planches | 21 PNG, chacune **512×512**, fond transparent |
| Style | Pixel 16-bit, contour |

Mêmes familles d’anims que ci-dessus (sans les sheets moto `Ride*`).

Grille probable :
- **8×8** cases de **64×64**  
  ou **8×4** de **64×128** (à confirmer)

## 3) `knight-2d/` — 2D Character Knight (Shadowless)

| | |
|--|--|
| Source zip | `2D-Character-Knight.zip` |
| Planches | 29 PNG Shadowless, chacune **960×512** |
| Grille | **15×8** cellules **64×64** (15 frames × 8 directions) |
| Mapping jeu | Idle / Walk / Run / **Melee2** (attaques) / TakeDamage / Die |

Dossier prêt : `assets/packs/knight-2d/`.  
Calibrage : `planche-orientations.html?pack=knight`.

## 4) `x180p/` — UPDATE x180p Spritesheets (Fantasy baked)

| | |
|--|--|
| Source zip | `UPDATE_x180p_Spritesheets.zip` (Dropbox) |
| Format source | Dossiers anim×arme → **16 fichiers** `Body_000`…`Body_337` (pas atlas CraftPix) |
| Planches jeu | Sheets **stitchées** 8 dirs × N frames, cellules **180×180** |
| Anims | Idle(16) / Walk(24) / Run(20) / Melee(24) / CastSpell(24) / TakeDamage(16) / Die(30) |
| Mapping | `DIR_ROW = [0,1,2,3,4,5,6,7]` (ligne = index jeu, verrouillé) |

Dossier prêt : `assets/packs/x180p/` (pack jeu **`x180`**, défaut).  
Calibrage : `planche-orientations.html?pack=x180`.

## 5) `mannequin-idle/` — Breathing Idle + Walk (PixelLab 8-dir)

| | |
|--|--|
| Source | Dropbox `Idle_breathing-idle_*.gif` (8 dirs) + Walk GIFs |
| Format source | `src/idle/*.gif` (4f) + `src/walk/*.gif` (6f) |
| Planche Idle | **736×1472** = 4 frames × 8 dirs, cellules **184×184** (@30 fps) |
| Planche Walk | **1104×1472** = 6 frames × 8 dirs |
| Contenu | Idle breathing + **Walk** ; Run = Walk placeholder |
| Mapping | `DIR_ROW = [0,1,2,3,4,5,6,7]` — SE = miroir SW (Idle + Walk) |
| QA | Chauve, nu, mannequin ; Idle 8 dirs complets ; Walk 6+West+SE mirroir |

Dossier prêt : `assets/packs/mannequin-idle/` (pack jeu **`mannequin`**).  
Aperçu : `mannequin-idle/preview.html`  
**Calibrage vues (recommandé)** : `mannequin-idle/calibrage-vues.html` — pour chaque image, choisir Face / Profil / Dos… → sauve `neuro.dirRow.mannequin`.

## Fichier source (orientations validées)

Le fichier modifié avec le mapping verrouillé est versionné à la racine :

- `neuro-core-sprite.html` — **même fichier** (Sprite + `DIR_ROW` validé, mêlée/distance)
- `controle-croise-animations.html` — contrôle croisé des 6 anims (même `DIR_ROW`)

`neuro-core.html` (V3.4.8) reprend le même `DIR_ROW` dans `PackSprites`.

## Mapping directions (V3.4 validé)

Index logique = `atan2(Δcol, Δrow) / 45°` (0 = face / Δrow+1 … 4 = dos / Δrow−1).

```
DIR_ROW = [3, 2, 1, 0, 7, 6, 5, 4]   // ligne = (3 - index) mod 8
```

| Index | Orient | Δcol,Δrow | Ligne sheet |
|------:|--------|-----------|------------:|
| 0 | face | 0,+1 | 3 |
| 1 | ¾ face-droit | +1,+1 | 2 |
| 2 | profil droit | +1,0 | 1 |
| 3 | ¾ dos-droit | +1,−1 | 0 |
| 4 | dos | 0,−1 | 7 |
| 5 | ¾ dos-gauche | −1,−1 | 6 |
| 6 | profil gauche | −1,0 | 5 |
| 7 | ¾ face-gauche | −1,+1 | 4 |

**Une seule table** pour Idle / Walk / Attack / Hit / Die (contrôle croisé).

## Outils

- **`planche-orientations.html`** — outil simple Marche + Tir : choisir une direction, ajuster la ligne (−/+), sauver dans `localStorage` (`neuro.dirRow`). Le jeu recharge via ⚙ SPRITE → Reload DIR_ROW.
- `controle-croise-animations.html` — les 6 anims côte à côte, même `DIR_ROW` (référence validée)
- `mappeur-vues.html` — annoter rangée ↔ vue si un nouveau pack diverge
- `calibrage-vues.html` — calibrage par case grille (Δcol/Δrow)

## Différence avec ECHO (notre pipeline)

| Packs Dropbox | Notre ECHO |
|---------------|------------|
| Planches complètes (perso déjà dessiné) | Corps base + calques équipement |
| Top-down / 8 dirs dans la sheet | Iso NEURO-CORE + facing |
| Moto incluse (Survivor) | Pas de véhicule encore |
| Style pack du store | Style planche NEURO (`#F2F0EB`…) |

Ces packs servent de **référence / option d’essai**, pas comme remplacement automatique d’ECHO tant qu’on n’a pas tranché.

## Licence

Packs marqués **FREE** sur la source d’origine — vérifier le README / licence de l’auteur avant usage commercial. Les zip d’origine sont aussi dans ce dossier.
