# NEURO CORE

RPG tactique. Trois fonctions :

1. **Combat** — arène, sorts, fin de tour.
2. **Créateur** — morphologie dans le jeu, et planches modulaires (`character-creator-fantasy.html`).
3. **Éditeur de sorts** — assembler une animation, un effet et des améliorations. Les sorts générés utilisent le même format que le combat (`SPELL_DEFS` + `bakedEvo`, lu par le grimoire).

## Jouer

```bash
python3 -m http.server 8765
```

Ouvre [http://localhost:8765/neuro-core.html](http://localhost:8765/neuro-core.html).

Depuis l’accueil : **Combat**, **Créateur** ou **Éditeur de sorts**.

Le créateur de planches est aussi accessible directement : `character-creator-fantasy.html`.

## Générer des sorts

Le générateur reprend les animations du pack de combat (Attack1 à Attack4, course, strafes), les effets (dégâts, poussée, drain de PA, soin, bouclier) et les améliorations (dégâts, portée, coût, poussée, drain, perçage, soin, bouclier — les mêmes champs que les évolutions du jeu).

```bash
npm run generate
```

Écrit `data/generated-spells.json`, `data/generated-spells.js` (chargé par le jeu) et `data/spellcraft-browser.js`. Les sorts invalides sont écartés, les autres sont ramenés vers environ 4 à 7 dégâts moyens par PA.

## Équilibrer et tester

Combats simulés, sans navigateur : dégâts par coût, duels contre un sort médian, ajustement ou mise à l’écart.

```bash
npm run balance
```

Rapport : `docs/rapport-equilibrage.md`.

## Entraîner l’IA

Auto-affrontement sur des loadouts variés. Une politique (poids : dégâts, poussée, drain, soin, kite, économie de PA) est mutée pendant quelques générations. Le jeu charge `data/ai-policy.js` : l’IA ennemie s’en sert pour noter ses sorts.

```bash
npm run train
```

Rapport : `docs/rapport-ia.md`.

## Tests

```bash
npm test
```
