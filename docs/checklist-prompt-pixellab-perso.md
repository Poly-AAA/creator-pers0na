# Checklist prompt PixelLab — personnage (rien à inventer)

**Règle :** chaque case doit être remplie depuis une **mesure** ou un **choix écrit**.  
Si une case est vide → on ne génère pas encore.

**Exemples joints :** _non reçus / non mesurés pour l’instant_ → cases STYLE à compléter après analyse des images.

---

## A. Ce qu’on a déjà (moteur NEURO-CORE) — ne pas contredire

| Info | Valeur connue |
|------|----------------|
| Vue | Isométrique 2:1 (~30°) |
| Case sol | 64 × 32 px |
| Viewport jeu | 390 × 844 (portrait smartphone) |
| Zoom | 0,75× – 2×, **sans flou** (pixels nets) |
| Orientation | 8 directions, liées au déplacement grille |
| Palette jeu (UI / fond) | `#F2F0EB` `#DCD3C3` `#2E2E30` accent `#E8590C` |
| Pivot | centre-bas entre les pieds |

> La taille **exacte d’une frame perso** (ex. 64×64) doit venir de PixelLab + de tes exemples, pas inventée ici.

---

## B. Liste à donner pour un prompt PixelLab “parfait du 1er coup”

### 1) Technique (obligatoire)

- [ ] Taille d’**une frame** (largeur × hauteur en px)
- [ ] Nombre de **directions** : 4 ou **8** (recommandé : 8)
- [ ] Fond : **transparent**
- [ ] Style rendu : **pixel art net** (pas de flou, pas d’anti-aliasing)
- [ ] Angle de caméra : **isométrique / top-down iso** (même que les exemples)
- [ ] Point de contact au sol : **pieds au centre-bas de la frame**

### 2) Style (obligatoire — depuis tes exemples images)

À remplir **seulement après mesure / description fidèle** des exemples :

- [ ] Type de trait (contour noir 1 px ? couleur ?)
- [ ] Niveau de détail (simple / moyen / dense)
- [ ] Palette **exacte** (liste des couleurs hex si possible)
- [ ] Proportions (tête/corps, largeur épaules…)
- [ ] Ambiance (cartoon, semi-réaliste pixel, soft…)
- [ ] Ce qu’il **ne faut pas** (interdit : photoréaliste, 3D lisse, etc.)

### 3) Identité du personnage (obligatoire)

- [ ] Genre / silhouette (homme, femme, androgyne, autre)
- [ ] Âge approximatif (enfant / adulte / âgé)
- [ ] Morphologie : **lourd / standard / fin** (comme NEURO-CORE)
- [ ] Couleur de peau (hex ou nom précis depuis palette)
- [ ] Cheveux : coupe + couleur
- [ ] Visage : yeux, barbe ou non, etc. (détails visibles dans les exemples)

### 4) Animations voulues (obligatoire)

Cocher ce qu’on veut générer (sinon PixelLab choisit au hasard) :

- [ ] Idle (boucle)
- [ ] Marche
- [ ] Course (si besoin)
- [ ] Attaque
- [ ] Cast / sort
- [ ] Touché
- [ ] Dash
- [ ] Mort (optionnel)

Pour chaque anim :

- [ ] Nombre de frames **si PixelLab l’impose / si tu le fixes**
- [ ] Les 8 directions pour **chaque** anim : oui/non

### 5) Habits & équipements — choix de méthode (obligatoire)

Il faut **choisir une méthode** (voir section C) :

- [ ] Méthode **A** : perso complet “tout cousu” (habit fixe dans la sheet)
- [ ] Méthode **B** : base nue/sous-vêtements + **calques** d’habits/armes
- [ ] Méthode **C** : plusieurs versions complètes (une sheet par tenue)

Puis préciser :

- [ ] Tenue de départ (haut, bas, chaussures, chapeau)
- [ ] Arme visible en permanence ? (oui/non) — laquelle
- [ ] Arme 1 main ou 2 mains
- [ ] Équipements qui doivent **toujours** se voir (liste)
- [ ] Équipements changeables plus tard (liste)

### 6) Fichiers à récupérer de PixelLab (pour moi)

- [ ] Sprite sheet(s) PNG transparent
- [ ] Découpage clair : directions × frames (ou JSON / grille indiquée)
- [ ] Nom de fichier stable (ex. `hero_standard_idle_8dir.png`)

---

## C. Animable + habits visibles : comment on fait

### Est-ce que le perso peut être animé ?

**Oui**, si PixelLab exporte des **frames** (idle, walk, etc.) sur **8 directions**.  
Je les incorpore : le jeu lit la sheet et joue l’anim selon le mouvement.

### Habits / équipements toujours visibles — 3 façons

| Méthode | Comment | Avantage | Inconvénient |
|---------|---------|----------|--------------|
| **A — Tout dans l’image** | Tu génères le perso **déjà habillé** + arme | Simple, joli du 1er coup | Changer d’habit = **regénérer** tout |
| **B — Calques** | 1 base (corps) + 1 sheet habit + 1 sheet arme, **mêmes poses / mêmes frames** | On change tunique/arme en jeu | Plus dur : PixelLab doit garder le **même rig** à chaque génération |
| **C — Une tenue = une sheet** | “Version guerrier”, “Version mage”… | Fiable visuellement | Plus de fichiers, pas un vrai dressing pièce par pièce |

**Recommandation pour NEURO-CORE (simple et fiable au début) :**  
→ **Méthode A** pour le premier perso jouable.  
→ Plus tard **méthode C** (2–3 tenues).  
→ **Méthode B** seulement quand le style + les poses sont figés et qu’on peut générer des calques alignés.

> PixelLab “create character” donne surtout un **perso complet animé**, pas un vrai créateur d’habits séparés comme NEURO-CORE SVG.  
> Pour un vrai dressing (pantalon / tunique / casque indépendants), il faudra soit des calques très stricts, soit garder notre système SVG/modulaire à côté.

---

## D. Modèle de prompt PixelLab (à remplir — cases `{{…}}` seulement)

Ne pas envoyer tant que tous les `{{…}}` ne sont pas remplis depuis la checklist / les exemples.

```text
Crée un personnage en pixel art isométrique pour un jeu mobile portrait.

TECHNIQUE (strict, ne rien changer) :
- Format : pixel art net, aucun flou, aucun anti-aliasing
- Fond : transparent
- Caméra : isométrique 2:1 (même angle que les images de référence fournies)
- Directions : {{8}} vues
- Taille d’une frame : {{LARGEURxHAUTEUR}} px
- Pivot : pieds au centre-bas de chaque frame
- Style : STRICTEMENT identique aux images de référence jointes (trait, proportions, palette)

INTERDIT :
- inventer un autre style
- photoréalisme, 3D lisse, dégradés flous
- changer l’échelle ou l’angle
- ajouter des éléments non listés

IDENTITÉ :
- Morphologie : {{lourd|standard|fin}}
- {{détails visage / cheveux / peau — depuis exemples + brief}}

TENUE & ÉQUIPEMENT (méthode {{A|B|C}}) :
- {{liste exacte des vêtements}}
- Arme : {{aucune | nom}} — {{1 main | 2 mains}} — visible en permanence : {{oui|non}}

ANIMATIONS À GÉNÉRER (uniquement celles-ci) :
- {{liste : idle, walk, …}}
- Chaque animation en {{8}} directions
- Frames : {{nombre si fixé, sinon “selon preset PixelLab documenté”}}

SORTIE :
- PNG transparent
- Sprite sheets organisées par animation et direction
- Aucune ombre portée floue sous le personnage sauf si présente dans les références
```

---

## E. Prochaine étape

1. Renvoyer / s’assurer que les **images d’exemple** sont bien jointes (visibles ici).  
2. On remplit la section **STYLE** sans inventer.  
3. Tu choisis **méthode A, B ou C** pour les habits.  
4. On te colle le **prompt PixelLab final** prêt à copier.

**Gemini (ECHO v1) :** prompt zéro liberté prêt → [`prompt-gemini-echo-v1.md`](./prompt-gemini-echo-v1.md).
