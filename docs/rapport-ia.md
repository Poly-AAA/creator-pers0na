# Rapport d'entraînement de l'IA

Entraînement par auto-affrontement (pas de modèle externe). Chaque politique note les sorts avec des poids : dégâts, poussée, drain de PA, soin, kite, économie de PA. Les meilleures sont conservées et mutées.

- Générations : **6**
- Population : **8**
- Duels par individu et par génération : **6**
- Taux de victoire du meilleur contre la politique de départ (échantillon fixe) : **67 %**

## Poids retenus

| Dégâts | Poussée | Drain | Soin | Kite | Économie |
| --- | --- | --- | --- | --- | --- |
| 1.89 | 9.97 | 7.91 | 1.84 | 0.75 | 0.31 |

## Historique

| Génération | Meilleure fitness | Taux de victoire | Fitness moyenne |
| --- | --- | --- | --- |
| 1 | 1.093 | 83 % | 0.688 |
| 2 | 0.924 | 67 % | 0.771 |
| 3 | 1.234 | 100 % | 0.783 |
| 4 | 1.075 | 83 % | 0.712 |
| 5 | 0.677 | 50 % | 0.492 |
| 6 | 0.862 | 67 % | 0.577 |

Le jeu charge `data/ai-policy.js`. L'IA des ennemis multiplie le score de ses sorts par ces poids (dégâts, poussée, drain).
