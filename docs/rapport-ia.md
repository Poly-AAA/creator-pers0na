# Rapport d’entraînement de l’IA

Des kits de sorts différents s’affrontent. La politique de départ choisit souvent au hasard (`noise` élevé) et soigne peu. Chaque génération propose un mutant et une variante plus posée (moins de hasard, plus de soin et de kiting). On garde la variante seulement si elle gagne davantage contre la politique de départ.

## Résultat

| | Taux de victoire |
| --- | --- |
| Politique de départ (miroir) | 50 % |
| Politique entraînée contre la départ | 64 % (58/90) |
| Progression | oui |

Paramètres retenus : hasard 0.19, soin 1.15, kiting 1.16, contrôle 0.94.

## Générations

- Génération 1 — 53 % contre la départ
- Génération 2 — 53 % contre la départ
- Génération 3 — 57 % contre la départ · retenue
- Génération 4 — 57 % contre la départ
- Génération 5 — 60 % contre la départ · retenue
- Génération 6 — 72 % contre la départ · retenue

## Kits

- **Brute** : gen_001, gen_002, gen_009
- **Tireur** : gen_004, gen_005, gen_011
- **Pyromancien** : gen_007, gen_004, gen_009
- **Duelliste** : gen_001, gen_011, gen_009
- **Clerc** : gen_013, gen_015, gen_004
- **Harceleur** : gen_011, gen_001, gen_004

Le combat charge `data/ai-policy.json` pour pondérer les sorts de l’adversaire. L’entraînement lui-même reste une commande à part (`npm run train`) : le navigateur ne relance pas la recherche.
