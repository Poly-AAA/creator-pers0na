# Rapport final

## Sur le téléphone

[https://litter.catbox.moe/bbd7yv.html](https://litter.catbox.moe/bbd7yv.html)

Page unique (accueil, combat, créateur, éditeur), en paysage, HTTPS. Déposée le 15 octobre 2026 à 03:57 UTC, elle reste en ligne environ 72 heures, jusqu’au 18 octobre 2026 à 03:57 UTC. Les sprites sont servis par jsDelivr au commit `f2e5a50`. Un contrôle Playwright en 932×430 ouvre l’accueil (Ocre-53), lance un duel contre Sable-21, dont les sorts affichés sont Coup brut, Roulade et Coup de pied. La croix a 5 touches, le bouton de fin de tour est là, sans erreur de page.

Les liens `32x6tn.html`, `s7ah3p.html`, `wi99au.html`, `r4jcgz.html` et `r00zh6.html` sont d’anciens builds.

## Sorts

Un sort peut partir pendant que l’animation du précédent joue encore. Les points d’action sont retirés tout de suite. Le coup arrive au même moment dans l’animation qu’avant : la durée des feuilles ne change pas. La dernière animation lancée reste à l’écran ; les coups déjà payés tombent quand même. La roulade place le personnage dès le début du glissé, pour que le sort suivant parte de la case d’arrivée.

Le grimoire généré n’est plus chargé. Le jeu ne connaît que les sorts de l’éditeur : Coup brut (`punch`), Coup de pied (`coup_de_pied`), Roulade (`roulade`), avec les pas et les évolutions de `docs/previews/spells-backup.json` sur la branche `cursor/strict-regen-idle-66c0`, plus ceux créés ensuite dans l’éditeur. Ces trois-là sont débloqués au niveau 1. Un sort d’éditeur supplémentaire se débloque à 5, puis 15, 30, 40 et 45. Les anciens sorts `gen_*` et `ov_*` sont retirés de la sauvegarde locale au chargement. Le générateur reste dans `js/spell-lab.js`. `npm run generate` ne réécrit `data/generated-spells.json` que si `SPELL_GENERATE=1`.

Playwright, combat libre : deux clics sur Coup brut pendant que la première animation Attack1 joue encore. Les PA passent de 6 à 4, puis à 2, avant que les dégâts tombent. Après l’animation, les PV de l’ennemi passent de 46 à 26. La barre ne montre que punch, coup de pied et roulade. Suite paysage : aucun écart, 3 captures de sorts.

Chaque sort garde toutes ses évolutions, y compris celles dont la case est décochée. Pour Coup brut : Brise-Os joue Attack2 à 12 images/s, Boxeur Attack6 à 17, Uppercut Special1 avec Effect1 à 17, Percutant Attack6 à 14. Rapide (Kick, 14) et Double Impact (Attack5 + Slash2, 17) restent proposés au choix, au palier 1 puis au palier 2. Le coup de base, sans évolution choisie, reste la séquence écrite (Attack1 à 17 pour Coup brut). Le calibrage des armes de `docs/previews/weapon-anim.json` est celui déjà en jeu (Melee10 = Kick, Ranged2 = AttackRun2, Offhand1 = Taunt, sacs en Special1 ou Attack3/Attack4).

## Combat

La carte isométrique couvre tout l’écran. Ordre du tour, chrono, score de style, PV / PA / PM, sorts, fin de tour, fuite et croix flottent par-dessus, sur un fond semi-transparent. La croix est en losange. Le pincement zoome, le glisser déplace la carte.

## Menus

Chaque écran du hub tient dans le paysage des quatre téléphones, sans défilement. Les actions sont des icônes, des nombres et des couleurs. Le mode sombre reprend les anthracites, l’orange, le beige et le blanc. La bascule est une icône.

## Volumes, mesurés sur l’ancien grimoire

Ces chiffres n’ont pas été relancés après le retrait des sorts générés. Ils décrivent le grimoire de 72 sorts, pas les trois sorts faits main.

Self-play : 1 500 000 combats, arrêt après trois générations sans gain de plus de 0,5 point. Génération retenue : la 2, à 67,68 %. Politique à l’écran : soin sous 74,8 % des PV, kiting, cible la plus proche. `trainedWinRate` reste 0,644.

10 000 parties en 145 002 ms. Niveau moyen 15,92. Arrivées au niveau 50 : 69 (0,69 %), en 11,46 heures modélisées. Répartition : 1–7 : 2 493 (24,9 %), 8–20 : 4 843 (48,4 %), 21–34 : 1 833 (18,3 %), 35–49 : 762 (7,6 %).

Sonde de 60 duels :

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 35 | 50/60 (83,3 %) | 60/60 | 60/60 |
| 40 | 1/60 (1,7 %) | 11/60 (18,3 %) | 52/60 (86,7 %) |
| 45 | 1/60 (1,7 %) | 7/60 (11,7 %) | 54/60 (90,0 %) |
| 49 | 2/60 (3,3 %) | 10/60 (16,7 %) | 47/60 (78,3 %) |

Le stuff complet au niveau 45 reste à 54/60. Au niveau 49 il est à 47/60. Sans stuff, la bande 40-49 reste presque perdue.

## Ce qui reste

Le créateur de personnage et l’éditeur de sorts gardent leurs propres panneaux, plus denses que les menus du hub. Les noms des évolutions de sort, quand le voile s’ouvre, restent écrits. La ligne d’état du combat cite encore le nom du sort.
