# Arène — roguelite PvP

Le jeu s’ouvre sur un personnage déjà généré. Il n’y a pas de menu de titre. Une défaite efface le personnage, l’or et l’inventaire. Les niveaux d’artisanat, de forgemagie, et ce que tu as appris des matières restent.

Ouvre l’accueil, ou lance :

```bash
npm start
```

Puis va sur http://localhost:8765/ . Le combat est prévu en paysage, du petit téléphone (640×360) au grand (932×430). En portrait, l’écran demande de tourner le téléphone.

La page unique pour un téléphone, sans serveur, se construit avec `npm run phone` (`/tmp/arene-phone.html`). Le lien public du moment est dans `docs/previews/live-links.json`.

## Boucle

- **ADN** tiré sur un dé 8, écrit pour les 50 niveaux. Niveau 1 : nu, toutes les stats à 5, 6 PA, 3 PM, 50 PV.
- **Combat** au choix : duel, ou équipe dont la taille est tirée (2v2, 3v3, 5v5, 10v10). Pas de réglage de difficulté. Érosion d’environ 10 %. Tour limité à 30 secondes. La carte se pince pour zoomer et se fait glisser.
- **Style**, défis optionnels, butin rare sur les ennemis tombés, compagnons qui acceptent ou refusent.
- **Soins** en trois gammes. La fiole de fuite coûte environ 60 % des kamas du moment.
- **Boutique, artisanat, forgemagie.** Les stats d’un objet fabriqué sont bornées par le niveau du personnage. Le broyage donne très peu de runes.
- **Classement** des meilleurs personnages (niveau, style, combats).

Les trois ateliers restent accessibles en bas de l’accueil : [créateur](character-creator-fantasy.html), [combat libre](fantasy-combat.html), [éditeur de sorts](spell-editor.html). Le combat libre n’efface pas le personnage.

## Générer, équilibrer, entraîner

```bash
npm test
npm run generate
npm run balance
npm run train
npm run campaign
```

`npm run campaign` écrit un échantillon dans `docs/rapport-parties.md`. Le volume du cahier (cinq passes d’environ 100 000 combats, self-play, 10 000 parties) est `npm run volume`. La suite paysage sur quatre téléphones et les captures de sorts est `npm run ergo`.

Les rapports chiffrés sont dans `docs/`.

## Habillage

Variante D, fond sable `#FAF7F0`, encre `#2F3133`, orange `#EA7020`. Pas de symbole religieux. Les mots arabes affichés sont des indications de synchro, de lumière et de sagesse.
