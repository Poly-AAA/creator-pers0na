# Prompt Gemini — ECHO v1 (zéro liberté) + animation

**But :** générer le **premier personnage** (ECHO, morphologie Standard) puis l’**animer**, sans que Gemini invente style, taille, palette, tenue, arme, cadrage, ni nombre de frames.

**Pipeline figé :**
1. **Still lock** → 1 frame idle `front` (identité visuelle verrouillée)
2. **8 dirs idle** → même perso, 1 frame par direction
3. **Animer** → sheets walk / attack / hit (mêmes règles, pivot identique)
4. **Incorporation** → je branche les PNG dans NEURO-CORE

**Règle :** coller les blocs `PROMPT` tels quels.  
Joindre **obligatoirement** le swatch palette. Dès l’étape 2+, joindre aussi le **still `front` validé** comme référence identité (Gemini ne doit pas redessiner un autre perso).

**Décisions déjà figées (NEURO-CORE) :**
- Frame : **128×128** px
- Vue : isométrique **2:1** (~30°)
- Case sol jeu : **64×32**
- Directions : **8**
- Palette : `#F2F0EB` `#DCD3C3` `#2E2E30` `#E8590C`
- Pivot : **entre les pieds**, centre-bas de **chaque** frame (identique sur toute l’anim)
- Méthode habits v1 : **A** (perso déjà habillé + arme dans chaque frame)
- Zoom : pixels nets, pas de flou
- Animation : **oui** (prévue dès le départ — pas un perso statique définitif)

---

## Ce que Gemini n’a PAS le droit de choisir

| Domaine | Valeur imposée |
|---------|----------------|
| Résolution | 128×128 exactement **par frame** |
| Fond | Transparent ; aucune ombre portée |
| Style | Pixel art net, contour `#2E2E30` 1 px |
| Couleurs | Uniquement les 4 hex |
| Morpho / tenue / arme | Identiques au still lock (aucune dérive) |
| Pivot | x=64, semelles y=124 sur **toutes** les frames |
| Anims autorisées v1 | `idle`, `walk`, `attack`, `hit` **seulement** |
| Frames / anim | voir tableau ci-dessous (nombres fixes) |
| Ordre sheet | lignes = frames, colonnes = 8 directions **ou** 1 PNG par frame (voir naming) |

---

## Mesures exactes (toutes frames)

```
Frame           : 128 × 128 px
Hauteur perso   : 100 px (pieds → sommet tête) — idle ; walk peut monter/descendre ±2 px max
Largeur épaules : 42 px (idle / face) ; profil plus étroit OK mais même volume
Diamètre tête   : 22 px
Pieds           : centre horizontal x = 64, semelles à y = 124
Bandeau orange  : 2 px de haut, toujours visible
Visière         : 16×6 px + lueur orange 10×3 px
Épée            : lame 28 px, largeur max 5 px, main droite (sauf frames attack où l’arc est défini)
```

### 8 directions (noms moteur — ne pas renommer)

| Id | Sens |
|----|------|
| `front` | face caméra |
| `qFrontRight` | ¾ avant droite |
| `sideRight` | profil droite |
| `qBackRight` | ¾ arrière droite |
| `back` | dos |
| `qBackLeft` | ¾ arrière gauche |
| `sideLeft` | profil gauche |
| `qFrontLeft` | ¾ avant gauche |

### Animations v1 (nombres **imposés**)

| Anim | Frames | Boucle | Contenu imposé |
|------|--------|--------|----------------|
| `idle` | **4** | oui | Respiration / micro-shift poids ; arme au repos ; **pas** de pas |
| `walk` | **8** | oui | Cycle de marche complet ; 1 pas L + 1 pas R ; arme suit le corps |
| `attack` | **6** | non | Anticipation → frappe épée → recover ; même épée |
| `hit` | **3** | non | Recul léger + flash possible en `#F2F0EB` uniquement (pas de rouge hors palette) |

**Interdit v1 :** run, death, cast, dash, reload, emotes, autre anim non listée.

### Timing cible (pour moi côté jeu — Gemini n’a pas à “deviner” la vitesse)

| Anim | Durée boucle / clip | FPS logique |
|------|---------------------|-------------|
| idle | 800 ms | 5 fps (4 frames) |
| walk | 640 ms | 12.5 fps ≈ 8 frames |
| attack | 420 ms | ~14 fps (6 frames) |
| hit | 240 ms | 12.5 fps (3 frames) |

---

## Étape 0 — PROMPT STILL LOCK (1 image)

> Joindre : swatch 4 couleurs.

```text
Tu génères UNE seule image. Tu n’inventes RIEN. Tu obéis ligne par ligne.

TÂCHE
- Personnage de jeu vidéo nommé ECHO (premier perso NEURO-CORE).
- Cette image est le STILL LOCK : référence identité pour toutes les animations suivantes.
- Une frame idle, direction front (face caméra), pose neutre.
- Sortie : PNG 128×128, fond 100% transparent.

TECHNIQUE (strict)
- Pixel art net uniquement.
- Aucun flou, aucun anti-aliasing, aucun dégradé lisse, aucune photo, aucune 3D réaliste.
- Chaque pixel est un carré net.
- Contour des formes : exactement 1 px, couleur #2E2E30.
- Caméra : isométrique 2:1 (angle ~30°), tactique iso top-down.
- Ne pas dessiner de case de sol, grille, ombre portée, halo, particules, texte, logo, UI.

PALETTE (strict — INTERDIT d’ajouter une 5e couleur)
- #F2F0EB = crème (corps / zones claires)
- #DCD3C3 = beige (volumes / lame)
- #2E2E30 = anthracite (contours, visière, bas, harnais, garde)
- #E8590C = orange (bandeau torse, lueur visière, pommeau)

MESURES (strict)
- Canvas : 128×128 px.
- Hauteur personnage : 100 px (semelles → sommet crâne).
- Épaules : 42 px. Tête : diamètre 22 px.
- Pivot : entre les pieds, x=64, semelles y=124 (marge bas 4 px).

IDENTITÉ
- Morphologie STANDARD. Silhouette adulte neutre.
- Crâne court crème, pas de casque séparé, pas de cheveux longs, pas de barbe.
- Visière anthracite 16×6 px + lueur orange 10×3 px.
- Combinaison crème, volumes beige, bas anthracite ~6 px, bandeau orange 2×24 px, harnais léger 2 sangles.
- Épée courte main DROITE : lame beige 28×5, garde anthracite, pommeau orange.

POSE
- Idle debout, poids égal, bras le long du corps, épée au repos.
- Orientation FRONT uniquement.
- Pas de spritesheet, pas d’animation multi-frames dans CETTE image.

INTERDITS
- Autre couleur, autre taille, fond non transparent, ombre au sol, cape, casque, décor, 2e perso.

SORTIE
- 1 PNG : echo_standard_idle_front_f0_128.png
```

Valider : 128×128, 4 couleurs max, pivot, tenue, arme. **Sinon on ne passe pas à l’anim.**

---

## Étape 1 — 8 directions idle (1 frame chacune, frame f0)

Même prompt que le still, en changeant **seulement** :
- joindre le still validé ;
- `Orientation : <id>` ;
- nom : `echo_standard_idle_<id>_f0_128.png` ;
- phrase ajoutée : `STRICTEMENT le même personnage que l’image de référence jointe (même pixels de style, même tenue, même arme).`

Pack :

```
echo_standard_idle_front_f0_128.png
echo_standard_idle_qFrontRight_f0_128.png
echo_standard_idle_sideRight_f0_128.png
echo_standard_idle_qBackRight_f0_128.png
echo_standard_idle_back_f0_128.png
echo_standard_idle_qBackLeft_f0_128.png
echo_standard_idle_sideLeft_f0_128.png
echo_standard_idle_qFrontLeft_f0_128.png
```

---

## Étape 2 — PROMPT ANIMATION (après still + 8 dirs f0 validés)

> Joindre : swatch + still `front` + la frame `f0` de la direction demandée.  
> Une requête = **une** anim × **une** direction (8 frames walk max dans une sheet horizontale, ou PNG séparés).

### Option recommandée pour Gemini : PNG séparés (moins d’erreurs de grille)

```text
Tu génères une SÉQUENCE d’animation. Tu n’inventes RIEN.

RÉFÉRENCES JOINTES (obligatoires)
- Swatch palette 4 couleurs.
- Still lock ECHO (identité).
- Frame idle f0 de la même direction (pose de départ).

TÂCHE
- Animer ECHO : animation = {{idle|walk|attack|hit}}
- Direction = {{front|qFrontRight|sideRight|qBackRight|back|qBackLeft|sideLeft|qFrontLeft}}
- Nombre de frames EXACT : {{4|8|6|3}} selon le tableau NEURO-CORE
  (idle=4, walk=8, attack=6, hit=3).
- Chaque frame : PNG 128×128, fond transparent.

RÈGLES D’ANIMATION (strict)
- Même personnage, même palette, même tenue, même épée, même pivot x=64 / semelles y=124.
- La silhouette ne grossit / ne rétrécit pas d’une frame à l’autre (±2 px hauteur max).
- Pas d’ombre au sol, pas de FX hors palette, pas de texte.
- idle : micro respiration / transfert de poids ; pieds restent au sol ; pas de pas.
- walk : cycle marche complet 8 frames ; contact sol alterné ; pas de glissade.
- attack : frames 1-2 anticipation, 3-4 frappe (épée avance), 5-6 recover vers pose idle.
- hit : léger recul arrière, bras se contractent ; 3 frames puis revient vers idle.
- Continuity : frame 0 doit coller à l’idle f0 de cette direction ; dernière frame walk boucle avec la 0.

INTERDITS
- Changer la direction au milieu du clip.
- Ajouter une anim non demandée.
- Morphing vers un autre design.
- Spritesheet avec mauvaise grille / frames de tailles différentes.

SORTIE (PNG séparés)
- echo_standard_{{anim}}_{{dir}}_f0_128.png
- echo_standard_{{anim}}_{{dir}}_f1_128.png
- …
jusqu’à f{{N-1}}
```

### Option sheet (si tu préfères une seule image)

Grille **imposée** (pas d’autre) :
- **walk** : 8 frames × 1 direction = bande **1024×128** (frames dans l’ordre f0→f7, gauche → droite)
- **idle** : **512×128** (4 frames)
- **attack** : **768×128** (6 frames)
- **hit** : **384×128** (3 frames)

Nom : `echo_standard_{{anim}}_{{dir}}_strip_128.png`

Ne **pas** demander une sheet 8 directions × N frames à Gemini en un seul coup (trop d’erreurs). Faire **1 direction à la fois**.

---

## Ordre de production (checklist)

**Phase A — Lock**
- [ ] Still `idle/front/f0`
- [ ] 8 dirs idle `f0`

**Phase B — Animer (par direction, commencer par `front`)**
- [ ] `idle` 4 frames × 8 dirs
- [ ] `walk` 8 frames × 8 dirs
- [ ] `attack` 6 frames × 8 dirs
- [ ] `hit` 3 frames × 8 dirs

**Phase C — Jeu**
- [ ] Zip clair + ce naming
- [ ] Je branche lecture sheet / frames dans `neuro-core.html` (remplace CharBody pour ECHO)

Total frames v1 si pack complet :  
`(4+8+6+3) × 8 = 168` PNG (ou strips équivalents).  
On peut livrer d’abord **front seulement** (21 frames) pour tester l’anim en jeu, puis les 7 autres dirs.

---

## Pack minimal “jouable animé” (recommandé en premier)

Assez pour voir ECHO bouger en combat sans attendre 168 fichiers :

```
# idle front
echo_standard_idle_front_f0..f3_128.png
# walk front
echo_standard_walk_front_f0..f7_128.png
# attack front
echo_standard_attack_front_f0..f5_128.png
# hit front
echo_standard_hit_front_f0..f2_128.png
```

Les autres directions : ensuite, **même** prompts, autre `{{dir}}`.

---

## Variante “arme seule” (plus tard)

```text
PNG 64×64, fond transparent, pixel art net, palette uniquement
#F2F0EB #DCD3C3 #2E2E30 #E8590C.
Sujet : UNE épée courte vue isométrique 2:1, lame 40 px, aucun personnage,
aucune ombre, aucun texte. Contour #2E2E30 1 px.
Nom : weapon_sword_ref.png
```

---

## Checklist avant chaque envoi Gemini

- [ ] Swatch 4 couleurs joint
- [ ] Still lock joint (sauf étape 0)
- [ ] Prompt collé sans modifier les chiffres
- [ ] 1 anim × 1 direction par requête
- [ ] Vérifier pivot + palette + nombre de frames avant la requête suivante
- [ ] Si échec : renvoyer le **même** prompt + “frame N a [défaut précis]” — pas de “améliore librement”

---

## Limite honnête

Gemini n’est **pas** idéal pour des sheets multi-dir parfaites.  
Le still lock + 1 direction à la fois + nombres de frames fixes réduit l’invention.  
Si l’anim dérive (autre visage, autre épée) → on bascule sur **Character Creator 2D Modern** (export animé 128×128, 8 dirs) avec la même checklist d’identité, puis j’incorpore.
