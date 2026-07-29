# NEURO-CORE — Moteur de Personnage Modulaire Isométrique

Prototype SVG pour un tactical RPG (style Dofus) : grille isométrique 2:1, morphologies, rig 8 orientations **calculées**, caméra séparée, animations de test.

Ouvre `index.html` dans un navigateur (modules ES). Tests : `npm test`.

## Constantes (`js/constants.js`)

| Constante | Valeur |
|-----------|--------|
| Case | 64×32 px (ratio 2:1) |
| Personnage | 96 px |
| Viewport | 390×844 portrait |
| Caméra | iso 30°, zoom 0,75×–2× |
| timeScale | 0,35 |
| hit-stop | 100 ms |
| Palette | `#F2F0EB` `#DCD3C3` `#2E2E30` accent `#E8590C` |

Géométrie : `x = (col − row) × 32`, `y = (col + row) × 16`.  
Le zoom est une couche caméra **séparée** — jamais intégré à la taille de case.

## Orientation ↔ grille

L’orientation affichée se calcule uniquement depuis `(Δcol, Δrow)` (`js/orientation.js`).  
Les 8 vues sont un seul pipeline squelette → projection → `scaleX(-1)` ; **pas** de dessins séparés (la section 3 de la spec est indicative uniquement).

Après miroir, l’arme est rebranchée sur la main opposée (`resolveWeaponHand`).

## Modules

| Fichier | Rôle |
|---------|------|
| `js/constants.js` | Constantes uniques |
| `js/grid.js` | Monde + profondeur `(col+row)`, row, id |
| `js/orientation.js` | Δ → orientation |
| `js/morph.js` | `resolveMorph()` + presets |
| `js/rig.js` | `projectRig`, miroir, calques |
| `js/equipment.js` | Vêtements (suivent morph) + armes taille fixe |
| `js/spells.js` | Ancres limb / bodyCenter / grid + auras |
| `js/clock.js` | timeScale + hit-stop / combo en temps réel |
| `js/animation.js` | idle, walk, attack, cast, hit, dash |
| `js/camera.js` | pan / zoom / `frameActors` |
| `js/renderer.js` | Assemblage SVG |
| `js/main.js` | Harness tactile |

## Morphologie

`resolveMorph(morphId, body)` fusionne preset (Lourd / Standard / Fin) + curseurs tronçons.  
Vêtements suivent la morpho ; armes **jamais** redimensionnées.

## Animations de test

| Clip | Durée |
|------|-------|
| idle | 2 s loop |
| marche | 350 ms / case |
| attaque | 600 ms |
| cast | 700 ms |
| touché | 400 ms |
| dash | 280 ms |

Fenêtre combo = `COMBO_RATIO × durée du clip` (temps réel).

## Tests automatiques

```bash
npm test
```

Vérifie : largeurs profil L/R, `mirror² = id`, table Δ→orient (8 cas), main d’arme post-miroir, profondeur sans égalité non résolue.

## Hors périmètre (cette phase)

Combat complet, ligues, présentateur, loot / méta-jeu.
