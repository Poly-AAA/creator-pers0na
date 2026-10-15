# Rapport final

## Sur le téléphone

Le lien public est dans `docs/previews/live-links.json`. La page unique (accueil, combat, créateur, éditeur) est en paysage, HTTPS, avec les sprites jsDelivr au commit `f2e5a50`. Litterbox garde le fichier environ 72 heures.

## Combat

La carte isométrique couvre tout l’écran. Ordre du tour, chrono, score de style, PV / PA / PM, sorts, fin de tour, fuite et croix flottent par-dessus, sur un fond semi-transparent. La croix est en losange : les quatre flèches suivent les axes des tuiles (nord-est, sud-est, sud-ouest, nord-ouest), le centre lance le sort. Le pincement zoome, le glisser déplace la carte. En portrait, une icône demande de tourner le téléphone.

## Menus

Chaque écran du hub (accueil, sac, soins, boutique, atelier, forge, classement, avant-combat) tient dans le paysage des quatre téléphones, sans défilement. Les actions, les stats, les emplacements, les trois soins, la fiole et la boutique sont des icônes, des nombres et des couleurs. Le français restant est dans les noms propres, les lettres de style, et les `aria-label`.

Le mode sombre utilise plusieurs anthracites (`#141618`, `#23272C`, `#2C3036`, `#3E444C`), l’orange `#EA7020`, le beige `#C9BBA8` `#F6F1E8` et le blanc. La bascule est une icône, mémorisée pour l’accueil et le combat.

## IA et grimoire

Self-play : 1 500 000 combats, arrêt après trois générations sans gain de plus de 0,5 point. Génération retenue : la 2, à 67,68 %. Politique à l’écran : soin sous 74,8 % des PV, kiting, cible la plus proche. `trainedWinRate` reste 0,644.

Les 52 sorts de dégâts du fichier tiennent la bande 35–70 %. Salve sombre est passée de 8–10 à 8–12, Frappe lunaire de 6–8 à 6–7. Le contrôle suivant, 1 389 duels par sort, est à 0 hors bande.

## Parties

10 000 parties en 145 002 ms, après ces deux corrections. Niveau moyen 15,92. Arrivées au niveau 50 : 69 (0,69 %), en 11,46 heures modélisées. Répartition : 1–7 : 2 493 (24,9 %), 8–20 : 4 843 (48,4 %), 21–34 : 1 833 (18,3 %), 35–49 : 762 (7,6 %).

Sonde de 60 duels :

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 35 | 50/60 (83,3 %) | 60/60 | 60/60 |
| 40 | 1/60 (1,7 %) | 11/60 (18,3 %) | 52/60 (86,7 %) |
| 45 | 1/60 (1,7 %) | 7/60 (11,7 %) | 54/60 (90,0 %) |
| 49 | 2/60 (3,3 %) | 10/60 (16,7 %) | 47/60 (78,3 %) |

Le stuff complet au niveau 45 reste à 54/60. Au niveau 49 il est à 47/60. Sans stuff, la bande 40-49 reste presque perdue. Le niveau 50 concerne 69 parties sur 10 000.

## Ce qui reste

Le créateur de personnage et l’éditeur de sorts gardent leurs propres panneaux, plus denses que les menus du hub. Les noms des évolutions de sort, quand le voile s’ouvre, restent écrits.
