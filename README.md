# NEURO-CORE — Moteur de Personnage Modulaire Isométrique

Prototype HTML/CSS/JS pur pour un tactical RPG (style Dofus) : grille isométrique 2:1, 3 morphologies, système de superposition d'équipements.

Ouvre `index.html` dans un navigateur pour tester.

## Phase 0 — Fondations ✅

- Grille isométrique 2:1 cliquable
- 3 morphologies : **Lourd**, **Standard**, **Fin**
- Point de pivot au sol (centre de case)
- Sélecteur de morphologie + curseurs grille

## Phase 1 — Superposition (Z-Index) + tronçons custom ✅

### Calques SVG (du bas vers le haut)

1. `legBack` — jambes arrière-plan (+ pantalon jambe arrière)
2. `armBack` — bras arrière-plan
3. `torso` — corps / torse (+ ceinture pantalon, haut)
4. `head` — tête (+ chapeau)
5. `armFront` — bras premier plan
6. `legFront` — jambes premier plan (+ pantalon jambe avant)
7. `anchors` — points d'ancrage (debug)
8. `meta` — pivot + étiquette

### Customisation par tronçon

La morphologie (Lourd / Standard / Fin) est un **preset de base**.  
`resolveMorph(morphId, body)` fusionne ce preset avec les réglages indépendants :

| Tronçon | Clé | Effet |
|---------|-----|--------|
| Cou | `neck` | largeur du cou |
| Épaules Ø | `shoulderWidth` | écartement des épaules |
| Haut épaules | `shoulderCap` | volume deltoïde |
| Biceps | `biceps` | bras supérieur |
| Coudes | `elbow` | grosseur de l'articulation |
| Avant-bras | `forearm` | bras inférieur |
| Poitrine Ø | `chestSize` | volume pecs / seins |
| Forme poitrine | `chestShape` | `flat` / `pec` / `soft` / `full` |
| Ventre | `belly` | bombé abdominal |
| Taille | `waist` | largeur taille |
| Hanches | `hips` | largeur hanches |
| Fesses | `glutes` | volume fessier |
| Cuisses | `thigh` | épaisseur cuisse |
| Mollets | `calf` | épaisseur mollet |

Les équipements et ancres lisent **uniquement** le profil résolu — ils suivent automatiquement les tronçons.

### Points d'ancrage

`head`, `neck`, `shoulderL/R`, `elbowL/R`, `waistL/R`, `hip`, `gluteL/R`, `handL/R`, `footL/R`, `pivot`.

### Équipements test

| Slot | Options | Notes |
|------|---------|-------|
| Pantalon | Aucun / **IN** / **OVER** | IN = ourlet cheville ; OVER = plus large, recouvre la cheville |
| Haut | Aucun / Tunique | Calque `torso` (suit le ventre) |
| Chapeau | Aucun / Casquette | Calque `head` |

### Étendre le système

**Nouvel équipement :** `buildXxx(m, w, color)` → injecter dans le calque → UI + `state`.

**Nouveau tronçon :** ajouter une entrée dans `BODY_SLIDER_DEFS`, l'appliquer dans `resolveMorph()`, puis l'utiliser dans le builder anatomique concerné.

## Roadmap

- **Phase 2** — 8 rotations isométriques (45°)
- **Phase 3** — Bibliothèque d'équipements + presets
- **Phase 4** — Animations (idle / marche / course) + analyse vidéo
- **Phase 5** — Intégration map (déplacement, combat)
- **Phase 6** — Vectorisation & génération auto
- **Phase 7** — Thèmes / époques
