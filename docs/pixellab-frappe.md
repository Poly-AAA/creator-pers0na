# Frappe pour Pixel Lab

Pixel Lab n’avale pas une vidéo pour la redessiner pixel par pixel. Il anime un sprite déjà en pixels. La vidéo ci-dessous sert à voir le geste. Ce qu’il faut importer, ce sont les 15 images PNG, sans les agrandir.

Fichiers :

- `docs/previews/pixellab/frames/frame-00.png` à `frame-14.png`, 64×64, fond transparent, pixels d’origine (pas d’agrandissement).
- `docs/previews/pixellab/frappe-15.png`, la bande des 15 images.
- `docs/previews/pixellab/frappe-lent.mp4`, les 15 poses à 8 images/s, pour regarder.
- `docs/previews/pixellab/frappe-temps-reel.mp4`, les mêmes 15 poses à 20 images/s (0,75 s).

La feuille est Attack1, ligne ouest. Les pieds restent au même endroit. Images 0 à 3 : préparation. Images 4 à 6 : le poing part et reste tendu. Images 7 à 14 : le bras revient à la garde. L’image 14 est presque l’image 0.

## Réglages

Outil : Animate with skeleton, mode Animation to animation. C’est celui qui suit des images déjà posées. Animate with text ne prend qu’une image et invente le geste : il sert seulement si le squelette rate une image.

- Reference : `frame-00.png`. Set reference sur cette image, pas sur la vidéo.
- Set animation : les 15 PNG, dans l’ordre, frame-00 en premier.
- View : high top-down.
- Direction : west.
- No background : oui.
- Palette : `#B0B0B0`, `#A0A0A0`, `#505050`, `#2F3133`. Huit couleurs au plus.
- Ne pas upscaler avant l’envoi. Si une image a été zoomée, passer par Unzoom.

Générer par blocs, pas les 15 d’un coup. Freeze 1, puis deux images. D’abord 0→3, puis 4→6, puis 7→14. Geler la tête du sprite de référence pour qu’elle ne change pas.

## Champ Action

Coller ce texte tel quel. Il est en anglais : c’est ce que le modèle suit.

```
isometric high top-down fighter facing west, bare gray body, hard pixels, transparent background. Feet stay planted on the same pixels for all frames. Frames 1-4: coil the front shoulder and fist backward, knees barely bend, no hop. Frames 5-7: the front fist punches straight to screen-left, torso leans with the arm, the extended fist holds for one beat, this is the hit. Frames 8-15: the arm returns along the same path to a standing guard, a small overshoot, then still. Last frame matches the first pose. No sword, no cape, no jump, no dust, no magic, no smear, no blur.
```

## Champ négatif

```
sword, weapon, cape, wings, glow, particles, motion blur, antialiasing, soft shading, extra arms, turned-around head, background, floor, text, shadow blob, jump, squash
```

## Si l’outil n’accepte que 4 images

Trois passages, même reference `frame-00.png`, No background, même palette.

1. Action : `coil a punch, feet planted, shoulder back, no hop`. Init : frame-00 et frame-03.
2. Action : `punch to the left, fist fully extended, hold the hit, feet planted`. Init : frame-03 et frame-06.
3. Action : `return the arm to guard, small overshoot, end on the first pose`. Init : frame-06 et frame-14.
