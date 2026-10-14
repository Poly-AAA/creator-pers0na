# Rapport final

## Ce qui est en place

Le roguelite se joue dans le navigateur, en portrait.

- Génération immédiate du personnage, ADN sur 50 niveaux, dé 8.
- Combat visuel : croix isométrique, carte en haut, sorts en bas, Fin de tour. Fuite, chrono de 30 s, érosion, nombres flottants, zoom au pincement, glisser pour déplacer la carte.
- Équipes de 2v2 à 10v10 : chaque allié et chaque adversaire est un sprite (repos, marche, attaque, dégâts, mort) avec ombre, corps, jambes, torse, arme et tête. Les teintes sont en cache. La caméra cadre toute l’équipe et dézoome au-delà de trois combattants.
- Sorts superposés squelette et spectre, glyphes et pièges, invocation d’ossement.
- Inventaire, trois soins, boutique, fiole de fuite, artisanat, forgemagie, classement, compagnons, mort et nouveau personnage.
- Métiers et connaissance des matières conservés après la mort.

## Volumes mesurés

Source : `docs/rapport-volumes.md`, `docs/rapport-parties.md`, `docs/rapport-ergo.md`.

- Équilibrage : 5 passes × 100 008 combats (72 sorts × 1 389). Durée 34 257 ms. Victoires du sort testé : 63,4 %, 63,9 %, 65,8 %, 62,5 %, 66,1 %. Les dégâts ajustés (±8 % hors de la bande 42–58 %) ne sont pas écrits dans `data/generated-spells.json`.
- Self-play : 1 500 000 combats en 727 799 ms. Chaque génération fait 250 000 combats (1v1 100 000, 2v2 50 000, 3v3 40 000, 5v5 35 000, 10v10 25 000). Arrêt après 3 générations sans gagner 0,5 point de plus que la meilleure. Miroir 49,89 %. Politique retenue : soin sous 68,4 % de PV, kiting, cible la plus proche, 88,06 % contre la politique de départ.
- Parties : 10 000, en 103 478 ms. Niveau moyen 11,14. Arrivées au niveau 50 : 60 (0,6 %), en 15,30 heures modélisées. Morts : 1–7 : 5 403 (54,0 %), 8–20 : 3 012 (30,1 %), 21–34 : 874 (8,7 %), 35–49 : 651 (6,5 %).
- Playwright, portrait, aucun écart : Android 360×640, Android 412×915, iPhone SE 375×667, iPhone 430×932. Hub, 2v2, 5v5, 10v10. 72 captures dans `docs/previews/sorts/`.

## Bande 40-50

Sonde de 60 duels par case, dans le même passage que les 10 000 parties.

| Niveau | Nu | Milieu (quelques achats) | Neuf emplacements |
| --- | --- | --- | --- |
| 35 | 4/60 (6,7 %) | 41/60 (68,3 %) | 59/60 (98,3 %) |
| 40 | 0/60 | 15/60 (25,0 %) | 49/60 (81,7 %) |
| 45 | 0/60 | 7/60 (11,7 %) | 54/60 (90,0 %) |
| 49 | 2/60 (3,3 %) | 10/60 (16,7 %) | 43/60 (71,7 %) |

Sans équipement ou avec un stuff partiel, la bande est très dure. Un stuff de boutique complet la rend jouable. L’XP de 40 à 49 vaut 118 018, soit 38 victoires si chaque duel au niveau 40 rapporte le bonus ×1,8 (environ 3 123). Ce n’est pas le temps d’une partie moyenne : la plupart s’arrêtent avant.

## Ce qui reste

- Le grimoire versionné n’a pas été réécrit. Après cinq passes, 33 sorts de dégâts restent sous 35 % ou au-dessus de 70 % contre un coup fixe 8–12 (liste dans `docs/rapport-volumes.md`). Plusieurs restent à 100 % : baisser les dégâts de 8 % par passe ne suffit pas quand la portée ou les coups multiples décident le duel.
- Au niveau 45, le stuff complet gagne encore 54 duels sur 60. Le mur est net sans bon équipement ; il est encore souple pour un inventaire déjà plein à ce niveau-là.
- La politique de self-play (soin 0,684, kiting, proche) n’est pas celle du combat à l’écran. `data/ai-policy.json` continue de pondérer les sorts de l’adversaire visuel.
- Une arrivée au niveau 50 reste rare (60 parties sur 10 000) et longue (15,3 heures modélisées). Le filtre principal est avant le niveau 20, pas seulement la bande 40–50.
