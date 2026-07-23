# NEURO-CORE — Charte image référence (à compléter avec les images)

**Statut :** enregistré pour plus tard.  
**Choix :** option A — on part d’images pixel art avec règles très strictes, puis le moteur les lit.

**Décision (2026-07-23) :** on **ne** part **pas** des générateurs type Nexsprite / PixelLab en API.  
Flux retenu : **toi** génères l’image référence (prompt zéro liberté) → **moi** je l’incorpore dans le jeu (tailles, placement, zoom net, props, etc.).

**But :** écrire un prompt **sans aucune liberté** pour générer tout ce qui entre dans le jeu (bâtiments, arbres, armes, effets, etc.), avec zoom map **sans flou** sur smartphone.

---

## Ce qu’on a déjà décidé

1. Pixel art isométrique, toujours les **mêmes** tailles.
2. Chaque pixel du dessin référence doit être **lisible** (carré net ; contour fin autour de chaque pixel OK pour la référence).
3. L’image sert de **modèle de style + tailles**. Le jeu recalcule rotations / placements ; on ne redessine pas 8 vues à la main.
4. Zoom : pas de flou — on agrandit des **carrés nets** (pas d’image étirée floue).

---

## À remplir dès que les images arrivent

| Paramètre | Valeur (à noter depuis l’image) | Pourquoi |
|-----------|----------------------------------|----------|
| Taille d’**1 pixel** art (en px écran) | _à mesurer_ | Base de tout |
| Taille d’**1 case** au sol (largeur × hauteur) | ex. déjà prévu 64×32 | Grille |
| Hauteur d’un **personnage** (en pixels art) | ex. déjà prévu ~96 | Échelle humaine |
| Angle / vue iso | ex. 2:1 / ~30° | Toujours pareil |
| Point de **pieds** (où le perso touche la case) | _à noter_ | Placement |
| **Palette** (liste exacte des couleurs) | _à lister_ | Style unique |
| Contour (épaisseur, couleur) | _à noter_ | Style |
| Taille max d’un **bâtiment** (en cases + px) | _à noter_ | Props |
| Taille typique **arbre / rocher / meuble** | _à noter_ | Props |
| Taille **arme** (ne change pas avec le corps) | _à noter_ | Équipement |
| Style des **effets** (magie, coups) | _à noter_ | FX |
| Fond / sol / bord de map | _à noter_ | Décors |

Constantes moteur déjà en code (à aligner sur les images si besoin) :
- Case 64×32, perso 96, écran 390×844, zoom 0,75×–2×, palette `#F2F0EB` `#DCD3C3` `#2E2E30` `#E8590C`.

---

## Autre chose à définir (checklist)

### Image / graphismes
- [ ] Format fichier : PNG (recommandé), sans compression floue
- [ ] Fond transparent ou fond uni ? (à fixer)
- [ ] Une image = **un objet** (1 arbre, 1 maison…) ou une **grande planche** avec tout ?
- [ ] Nom des fichiers (règle claire : `arbre_01.png`, `maison_auberge.png`…)
- [ ] Que fait-on des **8 directions** : 1 dessin de base + calcul, ou plusieurs images fournies ?
- [ ] Zoom map : paliers autorisés (ex. 1×, 1,5×, 2×) et **jamais** en dessous d’1 pixel art = 1 carré écran flou
- [ ] Contour de grille sur l’image **référence** seulement (oui/non)

### Sons / voix (« format de la voix »)
- [ ] Voix : fichier **MP3** ou **WAV** ou **OGG** ? (smartphone : OGG ou MP3 souvent OK)
- [ ] Une voix = quel usage ? (présentateur, perso, tutoriel…)
- [ ] Langue : français seulement ?
- [ ] Ton : neutre / épique / humoristique ?
- [ ] Durée max d’une réplique (ex. 8 secondes)
- [ ] Volume de référence / silence au début-fin
- [ ] Nom des fichiers voix (ex. `voix_presentateur_intro.ogg`)
- [ ] Sous-titres écrits obligatoires à l’écran ? (recommandé sur téléphone)

### Sons du jeu (pas seulement la voix)
- [ ] Format des bruitages (pas, coup, magie)
- [ ] Musique : format + boucle oui/non

### Gameplay lié aux images
- [ ] Ce qui est **solide** (on ne traverse pas) vs **décor** seulement
- [ ] Taille de la zone cliquable / touchable sur téléphone
- [ ] Ordre devant/derrière (déjà prévu : case plus “basse” = devant)

### Technique smartphone
- [ ] Résolution de travail de la map (largeur × hauteur en cases)
- [ ] Poids max d’une image (pour ne pas ralentir le téléphone)
- [ ] Mode portrait uniquement (déjà 390×844) ou aussi paysage ?

---

## Prompt “zéro liberté” — modèle (à finaliser après les images)

> Tu génères UNIQUEMENT du pixel art isométrique.  
> Interdit : flou, dégradés lisses, photo, 3D réaliste, changer l’angle, changer l’échelle.  
> 1 case sol = [L]×[H] pixels. Personnage = [N] pixels de haut.  
> Chaque pixel art est un carré net [avec contour fin visible].  
> Palette exacte : [liste].  
> Sujet demandé : [bâtiment / arbre / arme / effet].  
> Fond : [transparent / couleur].  
> Aucune autre liberté.

---

## Prochaine étape

1. L’utilisateur envoie les **images de référence** (taille, échelle, style).  
2. On mesure et on remplit ce document.  
3. On fige le prompt final + le format voix.  
4. Ensuite seulement : génération massive (bâtiments, arbres, armes, effets).
