# Tiles de map

## `hand-drawn/` — Hand-Drawn Isometric Dungeon Assets

| | |
|--|--|
| Auteur | Mark Gosbell |
| Licence | **CC0** |
| Source | https://markgosbell.itch.io/hand-drawn-isometric-dungeon-assets |
| Zip | `Hand-Drawn-Assets.rar` (Dropbox / itch) |

Pack d’accessoires iso dessinés à la main (murs, piliers, caisses, sols briques…).  
Les PNG du jeu sont **recadrés** (canvas 500×500 → bbox opaque) pour alléger le rendu.

### Usage dans NEURO-CORE

- Module `MapArt` dans `neuro-core-sprite.html`
- Sol : `floor_a`…`floor_d` (briques)
- Obstacles : murs / piliers / caisses (barrel, chest, cube…)
- Toggle : ⚙ SPRITE → **MAP ART: ON/OFF** (`localStorage` `neuro.mapArt`)

Template de carte associé : **« Donjon (hand-drawn) »** dans `MAP_TEMPLATES`.
