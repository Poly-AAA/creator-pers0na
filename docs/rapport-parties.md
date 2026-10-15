# Rapport de parties

Les 10 000 parties et la sonde 35-49 ont été relancées après la correction de Salve sombre (`gen_036`, 8–12) et de Frappe lunaire (`gen_049`, 6–7), avec les mêmes graines que `scripts/volume.js`. Les duels d’équilibrage et le self-play sont dans `docs/rapport-volumes.md`.

## Parties de niveau 1 vers 50

| Indicateur | Valeur |
| --- | --- |
| Parties | 10000 |
| Durée du calcul | 145002 ms |
| Niveau moyen à l’arrêt | 15.92 |
| Combats moyens | 42.4 |
| Victoires moyennes | 41.4 |
| Fuites moyennes | 0.0 |
| Heures modélisées moyennes | 3.62 |
| Arrivées au niveau 50 | 69 (0.69 %) |
| Heures modélisées des arrivées | 11.46 |

Répartition des morts (ou arrivée) :

- 50 : 69 (0.69 %)
- 1-7 : 2493 (24.9 %)
- 8-20 : 4843 (48.4 %)
- 21-34 : 1833 (18.3 %)
- 35-49 : 762 (7.6 %)

## Bande 40-50

Sonde de 60 duels par case. Le personnage est mis au niveau indiqué. Nu : aucun objet. Milieu : deux passages boutique. Complet : quarante passages boutique puis le meilleur objet par emplacement. L’adversaire est une rencontre 1v1 du niveau (qualité 1,84 dès 40, 1,90 dès 45, 2,05 dès 48). L’avantage du meneur vaut 0,32 au niveau 40, 0,24 au niveau 44 et 0,18 au niveau 48.

| Niveau | Nu | Milieu | Complet |
| --- | --- | --- | --- |
| 35 | 83.3 % (50/60) | 100.0 % (60/60) | 100.0 % (60/60) |
| 40 | 1.7 % (1/60) | 18.3 % (11/60) | 86.7 % (52/60) |
| 45 | 1.7 % (1/60) | 11.7 % (7/60) | 90.0 % (54/60) |
| 49 | 3.3 % (2/60) | 16.7 % (10/60) | 78.3 % (47/60) |

Au niveau 45 en stuff complet, le taux reste 54/60 (90 %). Au niveau 40 il est 52/60 (86,7 %). Au niveau 49 il est 47/60 (78,3 %). Sans stuff, le duel de 40 à 49 reste presque perdu (1 ou 2 victoires sur 60).

XP des niveaux 40 à 49 : 118018. Récompense d’un duel au niveau 40 (×5 dès le niveau 36) : environ 8675. Combats théoriques si chaque combat est gagné : 14.

Constantes : érosion 0.1, fuite 0.6, drop 0.1, dégâts ×0.155, avantage joueur ×1.85, garde ×0.64.
