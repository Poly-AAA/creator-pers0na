# Rapport de parties

Échantillon produit par `scripts/campaign.js`. Ce n’est pas le volume intégral du cahier (100 000 combats par passe, 1 à 5 millions de self-play, 10 000 parties, 5 passes).

## Parties de niveau 1 vers 50

| Indicateur | Valeur |
| --- | --- |
| Parties | 240 |
| Durée du calcul | 8168 ms |
| Niveau moyen à l’arrêt | 13.01 |
| Combats moyens | 36.2 |
| Victoires moyennes | 33.8 |
| Fuites moyennes | 1.5 |
| Heures modélisées moyennes | 2.61 |
| Arrivées au niveau 50 | 12 (5.0 %) |
| Heures modélisées des arrivées | 14.50 |

Répartition des morts (ou arrivée) :

- 50 : 12 (5.0 %)
- 1-7 : 101 (42.1 %)
- 8-20 : 98 (40.8 %)
- 21-34 : 24 (10.0 %)
- 35-49 : 5 (2.1 %)

## Duels 1v1 par tranche de niveau

Duels : 2400 en 1720 ms. Le personnage est nu (pas d’équipement) : la chute de victoires après le niveau 20 mesure la difficulté sans stuff. Victoires globales : 35.0 %. Tours moyens : 11.65. Secondes moyennes : 268. Style moyen : 104.

| Tranche | Duels | Victoires | Secondes moyennes |
| --- | --- | --- | --- |
| 1-7 | 420 | 91.7 % | 215 |
| 8-20 | 780 | 47.1 % | 274 |
| 21-34 | 840 | 8.6 % | 280 |
| 35-49 | 360 | 4.7 % | 291 |

## Équipes

Échantillons : 80 en 235 ms. Le joueur est nu au niveau 1, donc les grandes équipes sont très dures.

- 10v10 : n=13, victoires 61.5 %, tours 7.5, secondes 303
- 2v2 : n=29, victoires 86.2 %, tours 9.1, secondes 227
- 3v3 : n=26, victoires 69.2 %, tours 9.3, secondes 246
- 5v5 : n=12, victoires 91.7 %, tours 9.7, secondes 281

## Courbe d’XP

XP des niveaux 40 à 49 : 118018. Récompense d’un duel au niveau 40 (×1,8) : environ 3123. Combats théoriques pour cette bande si chaque combat est gagné : 38.

Constantes : érosion 0.1, fuite 0.6, drop 0.1, dégâts ×0.155, avantage joueur ×1.58, garde ×0.72.
