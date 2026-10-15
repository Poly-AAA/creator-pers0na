# Rapport final

## Sur le téléphone

[https://litter.catbox.moe/wi99au.html](https://litter.catbox.moe/wi99au.html)

Page unique (accueil, combat, créateur, éditeur), en paysage, HTTPS. Déposée le 15 octobre 2026 à 00:45 UTC, elle reste en ligne environ 72 heures, jusqu’au 18 octobre 2026 à 00:45 UTC. Les sprites sont servis par jsDelivr au commit `f2e5a50`. Un contrôle Playwright en 932×430 ouvre l’accueil, lance un duel, affiche la croix directionnelle (5 touches) et le bouton Fin du tour, sans erreur de page.

## Ce qui est en place

Le combat se joue téléphone à l’horizontale, sur la grille de la maquette D : ordre du tour en haut à gauche, plateau isométrique au centre, chrono et score de style en haut à droite, PV / PA / PM en bas à gauche, barre de sorts au centre bas, Fin du tour et Fuir en bas à droite. Le cadran hexagonal de gauche (Champ A.T.) est remplacé par une grande croix directionnelle, dans le même trait. Le cadran de droite, avec التزامن, reste visible, plus petit sous 460 px de haut pour laisser les boutons à l’écran. Les zones sûres (encoche, bords) sont prises en compte. Le pincement zoome, le glisser déplace la carte. En portrait, l’écran demande de tourner le téléphone.

- Génération immédiate du personnage, ADN sur 50 niveaux, dé 8.
- Équipes de 2v2 à 10v10 : chaque allié et chaque adversaire est un sprite avec équipement visible.
- Sorts superposés squelette et spectre, glyphes et pièges, invocation d’ossement.
- Inventaire, trois soins, boutique, fiole de fuite, artisanat, forgemagie, classement, compagnons, mort et nouveau personnage.
- Métiers et connaissance des matières conservés après la mort.
- Les 52 sorts de dégâts du grimoire tiennent la bande 35–70 % sur deux échantillons de 280 duels (`docs/rapport-grimoire.md`). Le fichier `data/generated-spells.json` est réécrit.
- L’IA à l’écran suit la politique de self-play retenue : soin sous 68,4 % des PV, kiting, cible la plus proche.

## Volumes

Les cinq passes d’équilibrage (5 × 100 008) et le self-play (1 500 000 combats, politique à 88,06 %) restent ceux de `docs/rapport-volumes.md`. Ils datent d’avant la réécriture du fichier de sorts.

Parties actuelles, 2 500, en 37 458 ms. Niveau moyen 16,03. Arrivées au niveau 50 : 25 (1,00 %), en 11,61 heures modélisées. Répartition : 1–7 : 626 (25,0 %), 8–20 : 1 180 (47,2 %), 21–34 : 480 (19,2 %), 35–49 : 189 (7,6 %).

Playwright, paysage, aucun écart : Android 640×360, Android 915×412, iPhone SE 667×375, iPhone 932×430. Hub, 2v2, 5v5, 10v10, pincement. 72 captures dans `docs/previews/sorts/`.

## Bande 40-50

Sonde de 80 duels par case.

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 40 | 2/80 (2,5 %) | 18/80 (22,5 %) | 67/80 (83,8 %) |
| 45 | 0/80 | 12/80 (15,0 %) | 66/80 (82,5 %) |
| 49 | 1/80 (1,3 %) | 8/80 (10,0 %) | 56/80 (70,0 %) |

Au niveau 45, le stuff complet passe de 54/60 (90 %) à 66/80 (82,5 %). Au niveau 49 il reste autour de 70 % (56/80, auparavant 43/60). Au niveau 40 il reste autour de 84 % (67/80, auparavant 49/60). Sans stuff, le duel est presque perdu.

## Ce qui reste

- Les 10 000 parties du cahier n’ont pas été relancées avec le grimoire réécrit. Le chiffre actuel est l’échantillon de 2 500.
- Le self-play n’a pas été relancé. La politique déjà retenue (1 500 000 combats) est celle du combat à l’écran.
- Le niveau 50 reste une longue partie (11,61 heures modélisées pour celles qui y arrivent) et concerne 1 partie simulée sur 100.
