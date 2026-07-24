# Analyse exemples — Character Creator 2D Modern (SmallScaleInt)

**Source des captures :** [Character Creator 2D - Modern](https://smallscaleint.itch.io/character-creator-2d-modern) (caleint / smallscaleint.itch.io)  
**Date analyse :** 2026-07-24  
**Règle :** uniquement ce qui est visible sur les captures + la fiche produit. Rien d’inventé.

---

## Ce que montrent tes images (constaté)

| Point | Observé |
|-------|---------|
| Type d’outil | Créateur de persos **modulaire** (assembler pièces), pas un prompt texte type PixelLab |
| Vue | Iso / ¾ vue de dessus (personnages en losange / angle fixe) |
| Style | Pixel art **propre**, contours nets, look “moderne / survie / tactique” |
| Ombre | Petite ombre douce sous les pieds (souvent présente) |
| Équipements | Armes **visibles** (fusil, lance-flammes, pistolet…) quand équipées |
| Variété | Plusieurs silhouettes / tenues / armes sur les visuels promo |
| Export (texte page) | Assemblage UI, swap gear, recolor, preview anims, **export spritesheets PNG** |

---

## Ce que dit la fiche produit (valeurs documentées, pas inventées)

| Paramètre | Valeur officielle |
|-----------|-------------------|
| Directions | **8** |
| Taille frame export | **HD 128×128** **ou** style 16-bit **64×64** (choix dans l’outil v2.0) |
| Anims | **20+** (fiche Unity / itch) |
| Grille sheet (fiche Unity) | **15×8** (frames × directions) pour une sheet d’anim |
| Contour | Option post-process (noir / dégradé) en v2.0 |
| Standalone | Windows (BETA), sans Unity ; sheets dans dossier local |
| Usage annoncé | Top-down / isometric games ; export pour ton propre projet |

> Prix / licence exacte : à lire sur la page d’achat itch au moment de l’achat (non inventés ici).

---

## Réponse à “animable + habits toujours visibles”

Avec **cet** outil (mieux adapté que PixelLab pour ta question habits) :

1. Tu **habilles** le perso dans le créateur (veste, pantalon, arme…).  
2. Tu **prévisualises** les anims.  
3. Tu **exportes** les spritesheets (perso déjà habillé + animé).  
4. Tu me les envoies → je les **incorpore** dans le jeu.

- **Animable** : oui (sheets par anim × 8 directions).  
- **Habits / armes visibles** : oui, ils sont **dans** l’image exportée.  
- **Changer d’habit en jeu** :
  - simple : ré-exporter une autre tenue → nouvelle sheet → je branche (méthode C)  
  - avancé : export de **pièces séparées** (le produit le mentionne) → calques (méthode B), plus de boulot d’alignement

**Recommandation :** méthode **A/C** au début (1 sheet complète par tenue).

---

## Checklist à remplir DANS l’outil (avant export)

À cocher / noter pour chaque perso que tu crées :

### Technique
- [ ] Résolution : **64×64** ou **128×128** (choisir **une** pour tout le jeu)
- [ ] Contour : oui/non (+ type si oui)
- [ ] Ombre sous les pieds : oui/non (identique pour tous)
- [ ] Muzzle flash / FX overlay : oui/non à l’export
- [ ] Nombre de frames par anim (si réglable : noter la valeur exacte)

### Identité
- [ ] Corps / morpho (dans les options du créateur)
- [ ] Cheveux, peau, couleurs (codes si l’outil les affiche)
- [ ] Tenue complète listée
- [ ] Arme équipée (ou aucune)

### Anims à exporter (liste à figer pour NEURO-CORE)
- [ ] Idle
- [ ] Walk / Run
- [ ] Attack (ou équivalent)
- [ ] Hit / Hurt
- [ ] Dash / Roll (si dispo)
- [ ] Death (optionnel)
- [ ] Autres : ___________

### Fichiers pour moi
- [ ] PNG transparent
- [ ] 1 fichier par animation (ou zip clair)
- [ ] Nommage : `perso_tenue_anim.png`
- [ ] Indiquer : 64 ou 128, grille 15×8 si c’est bien celle exportée

---

## Lien avec PixelLab

Tes captures = **pas** PixelLab.  
C’est **Character Creator 2D Modern** → idéal pour **habits + armes + anims** sans prompt texte.

PixelLab reste utile plus tard pour des props / styles custom.  
Pour les **persos jouables modulaires**, cet outil colle mieux à ta demande.

---

## Décisions figées

- **Résolution perso :** **128×128** (HD) pour **tous** les personnages — pas de mélange avec 64×64.
- Recolor habit : dans le créateur avant export (pas de masque pixel après coup en production).
- Méthode habits au début : export sheet complète par tenue (A/C).

## Prochaine étape

1. Tu confirmes : on part sur **ce créateur** (pas PixelLab) pour les persos.  
2. ~~Tu choisis **64×64** ou **128×128** pour tout le jeu.~~ **→ 128×128 choisi.**  
3. Tu exportes 1 perso test (idle + walk) en **128×128** → tu m’envoies le zip.  
4. Je l’incorpore sur la grille iso.
