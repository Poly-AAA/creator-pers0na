# Rapport de parties

Volume intégral des parties, lancé par `node scripts/volume.js`. Les duels d’équilibrage et le self-play sont dans `docs/rapport-volumes.md`.

## Parties de niveau 1 vers 50

| Indicateur | Valeur |
| --- | --- |
| Parties | 10000 |
| Durée du calcul | 103478 ms |
| Niveau moyen à l’arrêt | 11.14 |
| Combats moyens | 30.0 |
| Victoires moyennes | 27.8 |
| Fuites moyennes | 1.1 |
| Heures modélisées moyennes | 2.41 |
| Arrivées au niveau 50 | 60 (0.6 %) |
| Heures modélisées des arrivées | 15.30 |

Répartition des morts (ou arrivée) :

- 50 : 60 (0.6 %)
- 1-7 : 5403 (54.0 %)
- 8-20 : 3012 (30.1 %)
- 21-34 : 874 (8.7 %)
- 35-49 : 651 (6.5 %)

## Bande 40-50

Sonde de 60 duels par case, lancée dans le même passage. Le personnage est mis au niveau indiqué. Nu : aucun objet. Milieu : quelques achats en boutique. Complet : quarante passages boutique puis le meilleur objet par emplacement. L’adversaire est celui d’une rencontre 1v1 à ce niveau (six pièces à partir de 40, qualité 1,74 puis 1,96 et 2,02). L’avantage du meneur retombe à 0,24 à partir du niveau 40.

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 35 | 6.7 % (4/60) | 68.3 % (41/60) | 98.3 % (59/60) |
| 40 | 0.0 % (0/60) | 25.0 % (15/60) | 81.7 % (49/60) |
| 45 | 0.0 % (0/60) | 11.7 % (7/60) | 90.0 % (54/60) |
| 49 | 3.3 % (2/60) | 16.7 % (10/60) | 71.7 % (43/60) |

XP des niveaux 40 à 49 : 118018. Récompense d’un duel au niveau 40 (×1,8) : environ 3123. Combats théoriques si chaque combat est gagné : 38.

Constantes : érosion 0.1, fuite 0.6, drop 0.1, dégâts ×0.155, avantage joueur ×1.58, garde ×0.72.
