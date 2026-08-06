# Inventaire — Character Creator Fantasy V1.3 (SmallScaleInt)

Source Dropbox (achat) — 3 fichiers, ~1,24 Go compressé.

| Fichier | Taille | Nature |
|---------|--------|--------|
| `Stand-alone Character creator - 2D Fantasy V1.3.zip` | ~800 Mo | App Windows Unity + **3888 spritesheets PNG** modulaires |
| `CharacterCreatorFantasy-2026-v.1.3.unitypackage` | ~435 Mo | Projet Unity (anims `.anim`, controllers, mêmes sheets) |
| `Knight Demo character.zip` | ~35 Mo | Démo Knight déjà composée (3 qualités × 24 anims) |

## Format technique (utile pour le web)

- Planches modulaires : **1920×1024** = **15 frames × 8 dirs**, cellules **128×128**
- Knight 16-bit : **960×512** = 15×8 @ **64×64**
- Knight HD / HD Flat : **1920×1024** @ 128×128
- Ordre dirs (convention pack) : à calibrer comme x180 / mannequin (`DIR_ROW`)

## 30 animations par couche

`Idle` `Idle2` `Idle3` `Idle4` · `Walk` · `Run` `RunBackwards` · `StrafeLeft` `StrafeRight` ·  
`CrouchIdle` `CrouchRun` · `Attack1`…`Attack6` · `AttackRun` `AttackRun2` · `Kick` ·  
`Special1` · `TakeDamage` · `Die` · `Taunt` · `Slide` `Rolling` ·  
`RideIdle` `RideRun` `RideIdleAttack1` `RideRunAttack1`

## Couches modulaires (132 dossiers, Stand-alone + Unity)

| Famille | Variantes |
|---------|-----------|
| NakedBody | 3 |
| Head | 23 |
| Chest | 19 |
| Legs | 9 |
| Hands | 4 |
| Shoes | 5 |
| Belt | 2 |
| Bag | 7 |
| Melee | 25 |
| Ranged | 7 |
| Magic | 3 |
| Shield | 7 |
| Offhand | 2 |
| Mount | 5 |
| Effect / Slash / GunFire | 5+2+3 |
| Shadow | 1 |

## Déjà dans le repo (lié)

- Pack jeu `knight-2d/` / `x180p/` (sous-ensemble / autre export)
- `CharCreator` dans `neuro-core-sprite.html` : slots **placeholders** (teintes), pas encore branché sur ces sheets modulaires
- Doc : `docs/analyse-character-creator-modern.md`

## Intégration web (état)

- Pack repo : `assets/packs/fantasy-cc/` — **30 anims × ~132 dossiers** (~519 Mo PNG)
- Compositeur standalone : `character-creator-fantasy.html`
- `CharCreator` dans `neuro-core-sprite.html` compose les vraies couches (ordre Unity + policies row)
- FPS défaut **14** (potard 1–30 conservé) + teinte couleur par slot
- Catalogue : `assets/packs/fantasy-cc/catalog.json`

**Ne pas** versionner le `.unitypackage` ni l’exe Stand-alone dans git.

Combat : le bake sheet runtime n’est pas encore branché — le combat garde le pack jeu + teinte effet.
