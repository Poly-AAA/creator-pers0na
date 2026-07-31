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
