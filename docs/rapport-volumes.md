# Rapport des volumes

Chiffres mesurés par `scripts/volume.js`. Les dégâts ajustés pendant l’équilibrage ne sont pas réécrits dans `data/generated-spells.json`.

## Équilibrage

5 passes, 100008 combats chacune (72 sorts du grimoire × 1389 duels, donc au moins 1 000 combats par sort et par passe). Durée totale : 28370 ms.

| Passe | Combats | Victoires du sort testé | Ajustements | Durée |
| --- | --- | --- | --- | --- |
| 1 | 100008 | 54.3 % | 14 | 5714 ms |
| 2 | 100008 | 53.6 % | 14 | 5704 ms |
| 3 | 100008 | 59.1 % | 14 | 5655 ms |
| 4 | 100008 | 55.9 % | 13 | 5656 ms |
| 5 | 100008 | 56.5 % | 12 | 5639 ms |

Règle, en mémoire seulement : un sort de dégâts au-dessus de 58 % voit ses dégâts ×0,92 ; en dessous de 42 %, ×1,08. Le coup de référence adverse est un coup fixe 8-12.

Ces dix lignes sont les copies en mémoire à la fin de la passe 5, après les ×0,92 et ×1,08. Elles ne sont pas écrites dans le fichier. Le contrôle du fichier, 1 389 duels par sort, ne laissait dehors que Salve sombre et Frappe lunaire ; les deux ont été corrigées. Nouveau contrôle : 0 sort de dégâts hors de la bande (`docs/rapport-grimoire.md`).

Sorts de dégâts encore sous 35 % ou au-dessus de 70 % sur les copies en mémoire après la passe 5 :

- Entaille rouge (`gen_002`) — 97.1 % · dégâts ×0,92
- Salve funeste (`gen_006`) — 96.1 % · dégâts ×0,92
- Orbe fragile (`gen_008`) — 6.3 % · dégâts ×1,08
- Poussée fragile (`gen_026`) — 0.0 % · dégâts ×1,08
- Salve sombre (`gen_036`) — 96.7 % · dégâts ×0,92
- Lien solaire (`gen_042`) — 7.3 % · dégâts ×1,08
- Frappe lunaire (`gen_049`) — 70.8 % · dégâts ×0,92
- Rayon funeste (`gen_052`) — 96.6 % · dégâts ×0,92
- Salve rouge (`gen_054`) — 25.2 % · dégâts ×1,08
- Rayon solaire 70 (`gen_070`) — 97.0 % · dégâts ×0,92

## Self-play

Formats par génération : 1v1 100000, 2v2 50000, 3v3 40000, 5v5 35000, 10v10 25000 (250000 combats). Arrêt après 3 générations sans gain de plus de 0,5 point contre le champion, une fois 1000000 combats atteints. Plafond 5000000.

| | Valeur |
| --- | --- |
| Combats | 1500000 |
| Durée | 639954 ms |
| Générations | 6 |
| Politique retenue | soin sous 0.748, kiting oui, cible nearest |

- Génération 0 (miroir) — 50.01 % sur 250000 combats. 1v1 50.0%, 2v2 50.2%, 3v3 50.1%, 5v5 49.8%, 10v10 50.0%
- Génération 1 (mutant) — 33.28 % sur 250000 combats. 1v1 49.5%, 2v2 11.9%, 3v3 38.9%, 5v5 3.0%, 10v10 44.4%
- Génération 2 (mutant) — 67.68 % sur 250000 combats · retenue. 1v1 50.3%, 2v2 62.8%, 3v3 92.8%, 5v5 98.7%, 10v10 63.5%
- Génération 3 (mutant) — 19.95 % sur 250000 combats. 1v1 49.8%, 2v2 0.1%, 3v3 0.0%, 5v5 0.0%, 10v10 0.0%
- Génération 4 (mutant) — 60.13 % sur 250000 combats. 1v1 51.5%, 2v2 65.8%, 3v3 69.8%, 5v5 71.1%, 10v10 52.5%
- Génération 5 (mutant) — 33.39 % sur 250000 combats. 1v1 65.1%, 2v2 24.7%, 3v3 14.1%, 5v5 0.9%, 10v10 0.0%

Le bloc `play` de `data/ai-policy.json` reprend cette politique (soin, kiting, cible). Les poids de sorts et `trainedWinRate` (0.644) restent ceux du fichier. Le combat à l’écran lit `play` pour le repli, le kiting et la cible.

## Parties

Relance après la correction des deux sorts, mêmes graines : 10000 parties en 145002 ms. Niveau moyen 15,92. Arrivées au niveau 50 : 69 (0,69 %), en 11,46 heures modélisées. Détail dans `docs/rapport-parties.md`.
