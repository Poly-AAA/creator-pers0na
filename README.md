# NEURO-CORE — Moteur de Personnage Modulaire Isométrique

Prototype HTML/CSS/JS pur pour un tactical RPG (style Dofus) : grille isométrique 2:1, 3 morphologies, superposition d'équipements, custom par tronçon, **8 rotations**.

Ouvre `index.html` dans un navigateur pour tester.

## Phase 0 — Fondations ✅

- Grille isométrique 2:1 cliquable
- 3 morphologies : **Lourd**, **Standard**, **Fin**
- Point de pivot au sol (centre de case)
- Sélecteur de morphologie + curseurs grille

## Phase 1 — Superposition + tronçons ✅

Calques SVG, ancres, pantalon IN/OVER, tunique, casquette, sliders par tronçon, formes de poitrine.  
UI en onglets : **Corps · Équipements · Rotation · Grille**.

## Phase 2 — 8 rotations ✅

- 8 directions tous les 45° : SE, S, SO, O, NO, N, NE, E
- Pad directionnel + boutons ↺ / ↻
- `applyFacing()` adapte la silhouette (3/4, face, profil, dos)
- Miroir horizontal pour les directions gauches
- Calques membres inversés + tête sans yeux en vue dos
- Les équipements suivent automatiquement l'angle

## Roadmap

- **Phase 3** — Bibliothèque d'équipements + presets
- **Phase 4** — Animations + analyse vidéo
- **Phase 5** — Intégration map (déplacement, combat)
- **Phase 6** — Vectorisation & génération auto
- **Phase 7** — Thèmes / époques
