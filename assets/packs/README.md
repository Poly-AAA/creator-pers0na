# Packs d’assets externes (référence)

Packs téléchargés via tes liens Dropbox (2026-07-31).  
**Pas encore branchés dans le combat** — stockés ici pour analyse / integration future.

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
