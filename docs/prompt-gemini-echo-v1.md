# Prompt Gemini — ECHO v1 (zéro liberté)

**But :** générer le **premier personnage** (ECHO, morphologie Standard) sans que Gemini invente style, taille, palette, tenue, arme ou cadrage.

**Règle :** coller le bloc `PROMPT À COPIER` tel quel.  
Joindre **obligatoirement** une image de référence palette / planche (même si c’est un simple rectangle avec les 4 couleurs). Sans image jointe, Gemini peut encore dériver le style → ce n’est plus “zéro liberté”.

**Décisions déjà figées (NEURO-CORE) :**
- Frame : **128×128** px
- Vue : isométrique **2:1** (~30°)
- Case sol jeu : **64×32** (le perso n’est pas la case ; il se pose dessus)
- Directions : **8**
- Palette stricte : `#F2F0EB` `#DCD3C3` `#2E2E30` `#E8590C`
- Pivot : **entre les pieds**, centre-bas de la frame
- Méthode habits v1 : **A** (perso déjà habillé + arme dans l’image)
- Zoom jeu : pixels nets, pas de flou

---

## Ce que Gemini n’a PAS le droit de choisir

| Domaine | Valeur imposée |
|---------|----------------|
| Résolution | 128×128 exactement |
| Fond | Transparent (alpha), aucun sol, aucune ombre portée floue |
| Style | Pixel art net, 1 pixel = 1 carré, contour `#2E2E30` 1 px |
| Couleurs | Uniquement les 4 hex ci-dessus (aucune autre) |
| Morpho | Standard (voir mesures) |
| Identité | ECHO — mercenaire tactique, silhouette adulte neutre |
| Tenue | Combinaison tactique crème + bandeau poitrine orange + bas anthracite |
| Tête | Crâne crème, **visière anthracite** horizontale, lueur orange dans la visière |
| Arme | **Épée courte** main droite (1 main), lame beige, garde anthracite, pommeau orange |
| Armure | Aucune plaque lourde ; léger harnais anthracite sur torse |
| Casque | Aucun |
| Pose v1 | Idle, face caméra (direction **front**) |
| Ombre | Aucune sous les pieds (le jeu la dessine) |
| Texte / UI | Aucun |

---

## Mesures exactes dans la frame 128×128

```
Frame           : 128 × 128 px
Hauteur perso   : 100 px (pieds → sommet tête)
Largeur épaules : 42 px
Diamètre tête   : 22 px
Pieds           : centre horizontal (x = 64), semelles à y = 124
(centre-bas = pivot ; 4 px de marge sous les pieds)
Bandeau orange  : 2 px de haut, centré sur le torse
Visière         : bande 16×6 px sur le visage, lueur orange 10×3 px dedans
Épée            : longueur lame 28 px, largeur max 5 px, tenue main droite
```

### Les 8 directions (noms moteur — ne pas renommer)

Quand on demandera la sheet complète (après le 1er frame) :

| Id | Sens |
|----|------|
| `front` | face caméra |
| `qFrontRight` | ¾ avant droite |
| `sideRight` | profil droite |
| `qBackRight` | ¾ arrière droite |
| `back` | dos |
| `qBackLeft` | ¾ arrière gauche |
| `sideLeft` | profil gauche |
| `qFrontLeft` | ¾ avant gauche |

Pour **cette** génération v1 : **uniquement** `front` idle.

---

## PROMPT À COPIER (Gemini — image)

> Joindre en pièce jointe : swatch / planche avec exactement `#F2F0EB` `#DCD3C3` `#2E2E30` `#E8590C`.

```text
Tu génères UNE seule image. Tu n’inventes RIEN. Tu obéis ligne par ligne.

TÂCHE
- Personnage de jeu vidéo nommé ECHO (premier perso NEURO-CORE).
- Une frame idle, direction front (face caméra).
- Sortie : PNG 128×128, fond 100% transparent.

TECHNIQUE (strict)
- Pixel art net uniquement.
- Aucun flou, aucun anti-aliasing, aucun dégradé lisse, aucune photo, aucune 3D réaliste.
- Chaque pixel est un carré net.
- Contour des formes : exactement 1 px, couleur #2E2E30.
- Caméra : isométrique 2:1 (angle ~30°), même famille que tactique iso top-down.
- Ne pas dessiner de case de sol, de grille, d’ombre portée, de halo, de particules, de texte, de logo, de UI.

PALETTE (strict — INTERDIT d’ajouter une 5e couleur)
- #F2F0EB = crème (corps / zones claires)
- #DCD3C3 = beige (volumes / ombres dures du corps / lame)
- #2E2E30 = anthracite / encre (contours, visière, bas, harnais, garde)
- #E8590C = orange accent (bandeau torse, lueur visière, pommeau)

MESURES DANS LA FRAME (strict)
- Canvas : 128×128 px exactement.
- Hauteur du personnage : 100 px (des semelles au sommet du crâne).
- Largeur d’épaules : 42 px.
- Tête : cercle/ovale diamètre 22 px.
- Pivot : entre les deux pieds, centre horizontal x=64, semelles à y=124 (4 px de marge bas).
- Le personnage occupe le centre ; ne pas le recadrer autrement.

IDENTITÉ / MORPHOLOGIE (strict)
- Morphologie STANDARD (ni lourd, ni fin).
- Silhouette adulte, proportions humaines stylisées pixel, épaules moyennes, taille nette.
- Pas de cheveux longs volumineux ; crâne court / casque-peau crème sans casque séparé.
- Pas de barbe. Pas de cape. Pas de sac. Pas de jetpack.
- Visage : pas d’yeux détaillés séparés — une VISIÈRE anthracite horizontale (16×6 px) avec une lueur orange #E8590C (10×3 px) à l’intérieur.

TENUE (méthode A — déjà habillé, rien d’autre)
- Combinaison / combinaison tactique corps en #F2F0EB.
- Volumes / plis en aplats #DCD3C3 (pas de dégradé).
- Zone bassin / short en #2E2E30 (bande basse ~6 px de haut).
- Bandeau poitrine orange #E8590C : rectangle 2 px de haut, largeur ~24 px, centré.
- Harnais léger anthracite sur le torse (2 sangles fines), pas d’armure lourde, pas d’épaulières.

ARME (strict — visible)
- Épée courte en main DROITE (1 main).
- Lame #DCD3C3, longueur 28 px, largeur max 5 px, pointe vers le haut-avant.
- Garde #2E2E30.
- Pommeau / accent #E8590C.
- Pas d’autre arme, pas de bouclier, pas de fusil.

POSE (strict)
- Idle debout, poids égal sur les deux pieds.
- Orientation : FRONT (face caméra).
- Bras le long du corps ; main droite tient l’épée.
- Pas de course, pas d’attaque, pas d’animation multi-frames dans cette image.

INTERDITS (si tu en fais un, l’image est invalide)
- Ajouter une couleur hors palette.
- Changer la taille 128×128.
- Ajouter un fond non transparent.
- Ajouter une ombre sous les pieds.
- Inventer un casque, une cape, un logo, un animal, un décor.
- Style anime soft, painterly, photoréaliste, low-poly 3D.
- Recadrer le perso hors des mesures.
- Générer plusieurs personnages ou une spritesheet dans CETTE image.

SORTIE
- Exactement 1 fichier PNG 128×128 transparent.
- Nom suggéré : echo_standard_idle_front_128.png
```

---

## Après validation du 1er frame

Quand le `front` idle est bon (mesures + palette OK), **même prompt** en ne changeant que :

1. `Orientation : <id>` (une des 8).
2. Nom de fichier : `echo_standard_idle_<id>_128.png`.

Puis seulement ensuite : walk / attack (mêmes mesures, même tenue, même arme).

### Pack minimal à me renvoyer

```
echo_standard_idle_front_128.png
echo_standard_idle_qFrontRight_128.png
echo_standard_idle_sideRight_128.png
echo_standard_idle_qBackRight_128.png
echo_standard_idle_back_128.png
echo_standard_idle_qBackLeft_128.png
echo_standard_idle_sideLeft_128.png
echo_standard_idle_qFrontLeft_128.png
```

---

## Variante “arme seule” (plus tard, même règles)

Pour générer une arme isolée (équipement précis) :

```text
PNG 64×64, fond transparent, pixel art net, palette uniquement
#F2F0EB #DCD3C3 #2E2E30 #E8590C.
Sujet : UNE épée courte vue isométrique 2:1, lame 40 px, aucun personnage,
aucune ombre, aucun texte. Contour #2E2E30 1 px.
Nom : weapon_sword_128ref.png
```

(Adapter le nom + géométrie pour pistolet / fusil / bâton — un prompt = un item.)

---

## Checklist avant d’envoyer à Gemini

- [ ] Image swatch 4 couleurs jointe
- [ ] Prompt collé **sans** modifier une ligne
- [ ] Demande : **1** image seulement (pas “quelques variantes”)
- [ ] Après réception : vérifier 128×128, transparence, 4 couleurs max, pivot pieds
- [ ] Si une case échoue → ne pas “améliorer au feeling” : renvoyer le même prompt + citer l’erreur

---

## Limite honnête

Même avec ce prompt, Gemini peut **légèrement** dériver (épaisseur de trait, lecture iso).  
La jointure du swatch + le rejet systématique des images hors mesures reste obligatoire.  
Si 2 essais hors spec → on fige une image manuelle / Character Creator Modern plutôt que de laisser Gemini “corriger librement”.
