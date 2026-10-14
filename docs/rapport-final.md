# Rapport final

## Ce qui est en place

Le roguelite se joue dans le navigateur, en portrait.

- Génération immédiate du personnage, ADN sur 50 niveaux, dé 8.
- Combat visuel branché sur l’arène existante : croix isométrique, carte en haut, sorts en bas, bouton Fin de tour. Fuite, chrono de 30 s, érosion, nombres flottants, zoom au pincement, glisser pour déplacer la carte.
- Équipes : l’ennemi principal est animé, les autres combattants sont des pions qui agissent vite.
- Sorts superposés squelette et spectre (repassage teinté des sprites déjà là), glyphes et pièges (dégâts de zone), invocation d’ossement.
- Inventaire, trois soins, boutique, fiole de fuite, artisanat, forgemagie, classement, compagnons, mort et nouveau personnage.
- Métiers et connaissance des matières conservés après la mort. Butin fabriqué borné par le niveau.

## Chiffres de l’échantillon

Source : `docs/rapport-parties.md` (240 parties, 2 400 duels nus, 80 combats d’équipe).

- 42 % des parties meurent avant le niveau 8.
- 41 % meurent entre 8 et 20, 10 % entre 21 et 34, 2 % entre 35 et 49.
- 5 % atteignent le niveau 50, en environ 14,5 heures modélisées.
- Un duel nu de bas niveau dure environ 3 à 4 minutes modélisées (215 s en moyenne sur les niveaux 1 à 7) et se gagne à 92 %.
- Sans équipement, les duels au-delà du niveau 35 se gagnent à environ 5 %.
- La bande 40–50 demande environ 38 victoires si chaque combat rapporte le bonus de fin de courbe.

Ces chiffres viennent d’une politique automatique prudente (soins, fuite si le rapport de puissance est bas, équipement du meilleur objet). Ce n’est pas un joueur humain.

## Ce qui reste

Le volume demandé au cahier n’a pas été exécuté en entier dans cette passe :

- 100 000 combats par passe d’équilibrage, cinq passes : non. L’échantillon fait 2 400 duels et 240 parties. La commande est dans le README.
- 1 à 5 millions de combats d’entraînement, avec arrêt après 3 générations sans progrès : non. `npm run train` reste le petit entraînement déjà versionné (`docs/rapport-ia.md`).
- 10 000 parties complètes : non. 240 parties ont été jouées par la simulation.
- Suite Playwright sur quatre téléphones, rejouée après chaque changement d’interface : non automatisée dans `npm test`. L’interface a été vérifiée dans un navigateur sur un viewport portrait ; les quatre émulations dédiées restent à brancher.
- Captures systématiques de chaque sort généré dans un combat headless : les sorts spéciaux sont simulés et dessinés (superposition, glyphe, piège, invocation). Il n’y a pas une image par sort du grimoire.
- Les 10v10 ne jouent pas chaque sprite avec l’animation complète du duel : un ennemi est animé, les autres sont des pions, pour garder une durée raisonnable.
- La difficulté entre 35 et 50 tue les personnages nus. Un personnage déjà très équipé, dans la simulation, passe encore cette bande s’il n’a pas perdu avant. Le pic de fin de courbe est donc plus doux que le cahier pour les builds complètes.
