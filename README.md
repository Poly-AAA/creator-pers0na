# Combat fantasy

Trois écrans, et rien d’autre :

1. [Créateur de personnage](character-creator-fantasy.html)
2. [Combat](fantasy-combat.html)
3. [Éditeur de sorts](spell-editor.html)

Ouvre `index.html` dans le navigateur, ou lance un serveur local :

```bash
npm start
```

Puis va sur http://localhost:8765/

Le grimoire généré se charge tout seul dans l’éditeur et dans le combat (`data/generated-spells.json`). Le bouton **Grimoire** de l’éditeur remplace les sorts `gen_*` par le fichier. Coche **Équipé dans la barre de combat** pour les mettre dans les cinq emplacements à côté de Coup brut. Coup de pied et Roulade restent dans la barre.

L’adversaire pioche un kit selon son rôle (brute, tireur, contrôle…) et pondère ses sorts avec `data/ai-policy.json`.

## Générer des sorts

Les sorts réutilisent le format du jeu : `steps` (animations chaînées, slash, effet, fps) et `evoConfig` (évolutions du catalogue : Brise-Os, Double Impact, Économe, etc.). Les bonus de ces évolutions sont écrits dans le coût, les dégâts, la portée, la poussée ou le soin.

```bash
npm run generate
```

Écrit `data/generated-spells.json`. Variables facultatives : `SPELL_COUNT` (défaut 72) et `SPELL_SEED`.

## Équilibrer

```bash
npm run balance
```

Simule des duels (même distance de Chebyshev que l’arène). Un sort qui ne produit aucun effet est réparé une fois ou écarté. Les dégâts sont ramenés vers 3,6–7,2 points par PA, puis ajustés selon le taux de victoire du sort joué avec Coup brut contre deux Coup brut. Le rapport est dans `docs/rapport-equilibrage.md`.

## Entraîner l’IA

```bash
npm run train
```

Fait s’affronter plusieurs kits (brute, tireur, clerc…). La politique part d’un choix souvent aléatoire. Chaque génération ne garde une variante que si elle gagne plus souvent contre cette politique de départ. Le résultat est `data/ai-policy.json` et `docs/rapport-ia.md`.

## Tests

```bash
npm test
```

## Ce qui reste

- L’IA du combat **utilise** la politique entraînée. Elle ne réapprend pas pendant la partie : relance `npm run train` pour mettre à jour les poids.
- Le choix d’évolution après une victoire, dans le combat, est toujours manuel. Le générateur a déjà appliqué une ou deux évolutions dans les chiffres et dans les cases d’animation.
- Les écrans de calibrage (directions, anims d’arme, placement de chapeau ou de hache) et la version neuro-core ne sont plus dans le jeu. Le combat garde le calibrage de directions par défaut.
