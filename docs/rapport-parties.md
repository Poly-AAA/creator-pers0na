# Rapport de parties

Mesure actuelle, après réécriture du grimoire (`docs/rapport-grimoire.md`). Lancée par `PROBE_RUNS=2500 PROBE_LATE=80 node scripts/probe-curve.js`. Les 10 000 parties précédentes (0,6 % d’arrivées, niveau moyen 11,14) décrivent les règles d’avant cette réécriture.

## Parties de niveau 1 vers 50

| Indicateur | Valeur |
| --- | --- |
| Parties | 2500 |
| Durée du calcul | 37458 ms |
| Niveau moyen à l’arrêt | 16,03 |
| Arrivées au niveau 50 | 25 (1,00 %) |
| Heures modélisées des arrivées | 11,61 |

Répartition :

- 50 : 25 (1,0 %)
- 1–7 : 626 (25,0 %)
- 8–20 : 1180 (47,2 %)
- 21–34 : 480 (19,2 %)
- 35–49 : 189 (7,6 %)

## Bande 40-50

Sonde de 80 duels par case, dans le même passage. Le personnage est mis au niveau indiqué. Nu : aucun objet. Milieu : deux passages boutique. Complet : quarante passages boutique, puis le meilleur objet par emplacement. L’adversaire est une rencontre 1v1 à ce niveau.

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 40 | 2,5 % (2/80) | 22,5 % (18/80) | 83,8 % (67/80) |
| 45 | 0,0 % (0/80) | 15,0 % (12/80) | 82,5 % (66/80) |
| 49 | 1,3 % (1/80) | 10,0 % (8/80) | 70,0 % (56/80) |

À niveau 45, le stuff complet gagne 66 duels sur 80. La mesure précédente, sur l’ancien grimoire, en gagnait 54 sur 60 (90 %). Au niveau 49, le complet reste à 56/80, proche des 43/60 d’alors. Au niveau 40, le complet est à 67/80, proche des 49/60 d’alors. Sans équipement, la bande reste presque fermée.

L’XP est multipliée par 5 à partir du niveau 36. Une arrivée modélisée dure 11,61 heures, contre 15,30 heures sur l’ancienne mesure.

La partie simulée rachète une pièce de boutique quand elle est meilleure que celle portée, en gardant de quoi se soigner. Le prix d’une pièce est `8 + niveau × 2,4 × nombre de lignes`.

Constantes de combat : érosion 0,1, fuite 0,6, avantage du meneur ×1,85, garde ×0,64. L’avantage retombe à 0,55 au niveau 36, 0,32 au niveau 40, 0,24 au niveau 44 et 0,18 au niveau 48. Qualité d’équipement des adversaires : 0,18 puis 0,30, 0,42, 0,88, 1,84, 1,90 et 2,05.
