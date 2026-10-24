# Écart avec la référence Iop

Clip source : 12 min 48, 480×270, 20 images/s, environ 38 kbit/s. Le débit écrase les petits mouvements du corps. Dans une fenêtre de coup (19,4 s à 22,4 s), seuls deux éclairs dépassent le fond : 19,60 s et 20,10 s. Les durées d’anticipation et de retour viennent du visionnage, pas d’un écart de pixels fiable.

Nos prises viennent du lecteur `feel.html`, horloge réelle, le 15 octobre 2026. Aucun chiffre de difficulté n’a été changé. Pas de simulation. Le code d’animation n’a pas été modifié.

Planches : `docs/previews/anim-iop/`.

## Notes

10 veut dire le même ressenti que le clip. La durée des trois temps est déjà proche. Le saut d’image et les effets plats sont les vrais écarts.

| Critère | Nous | Référence | Note |
| --- | --- | --- | --- |
| Fluidité | 4 images en 260 ms, puis saut de l’image 3 à l’image 6. Les images 4, 5 et 7 ne sont pas lues. L’image 5 est le plus grand écart de la feuille. | Le corps tient une pose plusieurs images (environ 8 à 12 images/s). Les effets bougent plus vite, proche de 20 images/s. | 3 |
| Anticipation, impact, retour | 260 ms, 80 ms, 400 ms. Les effets prévus ensuite : 500 ms. | Environ 250 ms de préparation, un éclair d’impact, 250 à 500 ms de retour. | 8 |
| Traînées et effets | Un fantôme à 35 % pendant les 80 ms d’impact. Le feu des poings est deux carrés de 5 px. | Traînée blanche sur le dash, éclair ou onde au contact, particules qui restent après le corps. | 3 |
| Écrasement, poussière, souffle | L’écrasement ne concerne que le bond, sur les 90 dernières ms. La poussière est une ellipse plate, seulement sur une poussée. L’attente change environ 2 % des pixels d’un coup. | Poussière sous la cible poussée. Les épaules respirent à l’arrêt. | 3 |
| Chiffres | Le nombre naît sur l’image d’impact. Il grossit en 160 ms, monte après 220 ms, disparaît à 740 ms. | Le nombre de dégâts arrive environ un quart de seconde après l’éclair, puis reste près d’une seconde. | 5 |

## Correctifs, du plus utile au plus petit

1. Lire les 15 images de la feuille dans l’ordre. Placer l’image de contact à 260 ms. Ne plus sauter les images 4, 5 et 7. C’est le correctif qui enlève le pop.
2. Remplacer le fantôme unique par trois copies qui s’éteignent en 200 à 400 ms, et un trait dans l’axe du coup. Les laisser jusqu’à la fin des 500 ms déjà écrits dans `LINGER`.
3. Garder 260 / 80 / 400 ms. Les rallonger n’est pas le premier levier.
4. Écrasement d’environ 120 ms à chaque atterrissage, et trois poussières pendant 200 ms. Souffle d’attente : un décalage d’un pixel sur le corps déjà dessiné, en sinus d’environ 1,1 s. Pas une nouvelle feuille.
5. Faire naître le chiffre environ 100 ms après l’impact, et le garder près d’une seconde.

Ces cinq points ne sont pas appliqués.
