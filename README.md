# NEURO-CORE — Moteur de Personnage Modulaire Isométrique

Prototype HTML/CSS/JS pur pour un tactical RPG (style Dofus) : grille isométrique 2:1, 3 morphologies, système de superposition d'équipements.

Ouvre `index.html` dans un navigateur pour tester.

## Phase 0 — Fondations ✅

- Grille isométrique 2:1 cliquable
- 3 morphologies : **Lourd**, **Standard**, **Fin**
- Point de pivot au sol (centre de case)
- Sélecteur de morphologie + curseurs grille

## Phase 1 — Superposition (Z-Index) ✅

### Calques SVG (du bas vers le haut)

1. `legBack` — jambes arrière-plan (+ pantalon jambe arrière)
2. `armBack` — bras arrière-plan
3. `torso` — corps / torse (+ ceinture pantalon, haut)
4. `head` — tête (+ chapeau)
5. `armFront` — bras premier plan
6. `legFront` — jambes premier plan (+ pantalon jambe avant)
7. `anchors` — points d'ancrage (debug)
8. `meta` — pivot + étiquette

### Points d'ancrage

`head`, `neck`, `shoulderL/R`, `waistL/R`, `hip`, `handL/R`, `footL/R`, `pivot` — adaptés à chaque morphologie via `getAnchors(m)`.

### Équipements test

| Slot | Options | Notes |
|------|---------|-------|
| Pantalon | Aucun / **IN** / **OVER** | IN = ourlet cheville ; OVER = plus large, recouvre la cheville |
| Haut | Aucun / Tunique | Calque `torso` |
| Chapeau | Aucun / Casquette | Calque `head` |

Couleurs ajustables via inputs color. Toggle pour afficher/masquer les ancres.

### Étendre le système

1. Ajouter un profil dans l'équipement (ex. `buildBoots(m, w, color)`)
2. L'injecter dans le calque anatomique correct dans `createCharacter()`
3. Ajouter un sélecteur UI + entrée dans `state`

Les dimensions passent toujours par le profil `MORPHS[id]` (`pantsScaleX`, `torsoScaleX`, etc.) pour s'adapter aux 3 morphologies.

## Roadmap

- **Phase 2** — 8 rotations isométriques (45°)
- **Phase 3** — Bibliothèque d'équipements + presets
- **Phase 4** — Animations (idle / marche / course) + analyse vidéo
- **Phase 5** — Intégration map (déplacement, combat)
- **Phase 6** — Vectorisation & génération auto
- **Phase 7** — Thèmes / époques
