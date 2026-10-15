# Rapport final

## Réactions

Jeu : [https://litter.catbox.moe/5u9ipz.html](https://litter.catbox.moe/5u9ipz.html)

Éditeur : [https://litter.catbox.moe/8526ac.html](https://litter.catbox.moe/8526ac.html)

Lecteur : [https://litter.catbox.moe/uz8e8j.html](https://litter.catbox.moe/uz8e8j.html)

Déposés le 15 octobre 2026 à 05:46 UTC. Ils restent en ligne environ 72 heures, jusqu’au 18 octobre 2026 vers 05:46 UTC.

Chaque coup et chaque soin déclenche une réaction sur la cible, à l’image d’impact (0,26 s). Le corps, la tête, le torse, les jambes, les chaussures, l’arme et le bouclier jouent la même feuille. Sauf le K.O., la pose revient à l’attente.

- Direct : sursaut léger. Crochet : grand choc. Uppercut : décollage. Coup de pied ou poussée : glissade et poussière.
- Quatre directions iso, de face ou de dos.
- Feu : flammes et recul. Glace : teinte bleue, ralenti. Foudre : tremblement et étincelles. Explosion : souffle.
- Les tics de brûlure et les surcoups rejouent un sursaut.
- Soin, égide et gain : lueur, légère levée, chiffre vert, bleu ou neutre.
- Parade, esquive, et K.O. qui reste au sol.

Le contrôle couvre les 16 réactions, les 8 approches, les couches d’équipement et toutes les chaînes du poing. Pas de simulation.

## Combos du poing

Jeu : [https://litter.catbox.moe/9c6uem.html](https://litter.catbox.moe/9c6uem.html)

Éditeur : [https://litter.catbox.moe/mm58hb.html](https://litter.catbox.moe/mm58hb.html)

Lecteur des chaînes : [https://litter.catbox.moe/fq4nt6.html](https://litter.catbox.moe/fq4nt6.html)

Déposés le 15 octobre 2026 à 05:37 UTC. Ils restent en ligne environ 72 heures, jusqu’au 18 octobre 2026 vers 05:37 UTC.

Les évolutions de Coup brut sont des listes de blocs. Chaque bloc part et finit sur la garde, donc l’enchaînement ne saute pas. Le joueur choisit une évolution par palier, et les choix s’ajoutent.

Blocs : direct gauche, direct droit, crochet, uppercut, grand coup de pied, genou, dash, bond. Finitions : explosion, onde, projectile. Voiles : feu, glace, foudre, sur les poings (et le pied si le coup est un coup de pied). Effets : recul d’une case, coups multiples, brûlure.

- Double coup : direct gauche, puis direct droit.
- Repousse : ces deux directs, puis un grand coup de pied qui recule d’une case.
- Feu : les poings s’allument. La finition devient une explosion, ou un uppercut, selon le choix.

Les animations, vitesses et effets déjà écrits (Brise-Os, Boxeur, Rapide, Uppercut, Percutant, Double Impact) restent en place. Le palier 3 ajoute Brasier, Montante et Éclairs. Coup de pied et Roulade gardent deux paliers. L’éditeur montre les blocs de chaque évolution. Le contrôle parcourt les 40 chaînes atteignables. Pas de simulation.

## Rythme des animations

Jeu : [https://litter.catbox.moe/mv50p7.html](https://litter.catbox.moe/mv50p7.html)

Lecteur du rythme : [https://litter.catbox.moe/zirm0w.html](https://litter.catbox.moe/zirm0w.html)

Déposés le 15 octobre 2026 à 05:23 UTC. Ils restent en ligne environ 72 heures, jusqu’au 18 octobre 2026 vers 05:23 UTC.

La caméra reste isométrique 2:1, fixe. Le corps fait 1,75 tuile de haut (entre 1,5 et 2), debout sur une case. Chaque sort suit le même rythme : anticipation 0,26 s, pieds plantés, aura de l’élément ; impact 0,08 s, sans images intermédiaires, avec un filé ; retour 0,40 s avec un léger dépassement ; puis l’attente qui respire. Les effets restent encore 0,50 s. Un nouveau sort peut partir pendant ce temps : l’ancien coup ne s’applique plus.

- Frappe : hanches, épaules et pieds dans la feuille d’origine, éclat radial et étincelles.
- Dash : le corps se penche, traverse les cases, une traînée cache le glissement.
- Bond : accroupi, arc, écrasement à l’arrivée, poussière.
- Recul : la cible glisse tout droit, avec une traînée de poussière.
- Invocation : une arme apparaît au-dessus de la cible et frappe, avec une onde au sol.

Les couleurs suivent l’élément. Les chiffres arrivent sur l’image d’impact : rouge pour les dégâts, bleu pour le bouclier, vert pour le soin. Ils grossissent, restent, montent et disparaissent. Plusieurs coups se dispersent. Coup brut, Coup de pied et Roulade gardent leurs animations et leurs évolutions. Pas de simulation.

## Poses d'attente

Lecteur : [https://litter.catbox.moe/0lvlyt.html](https://litter.catbox.moe/0lvlyt.html)

Déposé le 15 octobre 2026 à 05:13 UTC. Il reste en ligne environ 72 heures, jusqu'au 18 octobre 2026 vers 05:13 UTC. La page contient les feuilles d'origine. Elle ouvre sur Lecture. Le bouton passe de la pose à l'original. Les trente animations et les huit directions restent dans la liste.

Trois boucles de 11 images, à 15 images/s (environ 0,73 s). Le corps est la pose Idle tenue : il ne change pas d'image. La main, la mèche, l'accessoire et une petite lueur bougent. L'image 11 est identique à l'image 0.

- Lecture : livre dans la main gauche, page qui suit la main, lueur sur le chapeau.
- Sac : sacoche à droite, qui se soulève d'un pixel, avec une boucle lumineuse.
- Bijou : gemme sous le col, éclat qui oscille, lueur sur le chapeau.

Contrôle : 3 poses × 8 directions. Pieds inchangés, boucle fermée, accessoire, lueur et mèche présents. Planches : `docs/previews/sprites/variante/idle-Lecture.png`, `idle-Sac.png`, `idle-Bijou.png`. Playwright en paysage sur 640×360, 667×375, 915×412 et 932×430 : pas de défilement, 33 entrées, le bouton change les pixels, aucune erreur de page. Coup brut, Coup de pied et Roulade ne sont pas modifiés. Pas de simulation.

## Preuve : une variante sur les sprites d'origine

Lecteur précédent, sans ces poses : [https://litter.catbox.moe/jtqdn4.html](https://litter.catbox.moe/jtqdn4.html)

Déposé le 15 octobre 2026 à 05:00 UTC. Il reste en ligne environ 72 heures, jusqu'au 18 octobre 2026 vers 05:00 UTC. La page contient les feuilles d'origine (corps nu et ancre de tête). Le bouton passe de la variante à l'original. Les trente animations et les huit directions y sont.

La variante est unique. Elle est peinte sur `NakedBody`, image par image. L'ancre est la couche `Head1`, déjà calée par le pack sur chaque image :

- Corps : peau cuivrée, torse élargi d'un pixel de chaque côté. Les pieds, sur les cinq dernières lignes de la silhouette, gardent exactement les mêmes pixels.
- Visage : yeux et bouche, uniquement sur des pixels du corps, sous le crâne.
- Coupe : frange courte et deux mèches, parties des pixels de `Head1`.

Contrôle : 30 animations × 8 directions × 15 images = 3 600 images. Aucun écart de pieds, le visage reste sur le corps, la frange reste près du crâne. Les planches sont dans `docs/previews/sprites/variante/` (une feuille par animation, plus `apercu-idle.png`). Les trois sorts du grimoire ne sont pas modifiés. Pas de simulation.

## Sur le téléphone

Jeu : [https://litter.catbox.moe/k6gu1b.html](https://litter.catbox.moe/k6gu1b.html)

Créateur et lecteur d’animations : [https://litter.catbox.moe/4tcwn4.html](https://litter.catbox.moe/4tcwn4.html)

Éditeur de sorts : [https://litter.catbox.moe/ndulaw.html](https://litter.catbox.moe/ndulaw.html)

Les trois pages sont en HTTPS. Déposées le 15 octobre 2026 entre 04:25 et 04:28 UTC, elles restent en ligne environ 72 heures, jusqu’au 18 octobre 2026 vers 04:28 UTC. Les sprites de l’arène sont servis par jsDelivr au commit `f2e5a50`. Le jeu reste une page unique. Le créateur est une page à part : dé, couches, directions, animations. L’éditeur direct garde Coup brut, Coup de pied et Roulade, et ajoute les sorts du rig sans les écrire dans `data/user-spells.json`.

Un contrôle Playwright en 932×430 ouvre l’accueil (Lame-08), lance un duel contre Cendre-60, dont les sorts affichés sont Coup brut, Roulade et Coup de pied. La croix a 5 touches, le bouton de fin de tour est là, sans erreur de page. Sur l’éditeur public, Coup brut garde Brise-Os, Boxeur, Rapide, Percutant, Double Impact et Uppercut. Poing ajoute Direct, Feinte, Crochet, Repousse, Poings de feu, Onde, Zone, Brûlure et Foudre. Le créateur public lance le jab gauche à 17 images/s.

Les liens `dtdr8x.html`, `a20zvc.html`, `br5br3.html`, `bbd7yv.html`, `32x6tn.html`, `s7ah3p.html`, `wi99au.html`, `r4jcgz.html` et `r00zh6.html` sont d’anciens builds.

## Rig de personnage

Un squelette commun (tête, cou, épaules, mains gauche et droite, dos, hanches, pieds) sert au mâle, à la femelle, au sylphe, au squelette et au spectre. Les pieds se posent au centre du cadre de 192 px. Le personnage debout mesure 96 px. Quatre directions isométriques et une vue de face. Les pièces déclarent une couche (corps, sous-couche, milieu, armure, extérieur, accessoires, arme) et se teintent par zone. La cape, le manteau, les cheveux longs, l’écharpe et la sacoche suivent le vent sur trois niveaux. L’ombre est une couche au sol.

Les clips tournent entre 12 et 17 images/s, délai 0 : repos (10 images, 4 postures), marche 8, course 8, glisse 6, coup reçu 4, mort 12, familles d’armes, monture, invocation. Pas, volte et bond retombent au centre de la case dans les quatre directions. Le sort Poing (`poing_rig`) part d’un jab gauche ; chaque évolution choisie ajoute un pas (direct droit, repousse, puis foudre par exemple). Un seul élément reste actif. Ces sorts sont marqués `lab` et ne remplacent pas le kit de l’arène.

Le contrôle `node scripts/sprite-check.js` passe sur chaque espèce, direction, clip et image : ancre, cadre, trous, prise de l’arme, boucles. Taille mesurée : 96 px. Les planches sont dans `docs/previews/sprites/`. Le créateur public, en 640×360, 667×375, 915×412 et 932×430, ne défile pas. Le dé change le personnage, le poing joue `jabL` à 17 images/s.

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
