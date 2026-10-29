# PROMPTS — gabarits copier-coller (FR)

Remplace uniquement les `<…>`. Chaque prompt commence par le même **BLOC CONTRAT** : ne le raccourcis pas, c'est lui qui empêche l'IA d'improviser.

---

## A. Quelle IA gratuite utiliser, et comment lui donner le kit

| IA | Contexte | Exécute du Python ? | Usage conseillé |
|---|---|---|---|
| **Google AI Studio (Gemini, gratuit)** | très grand (≈1 M tokens) | **oui** (activer *Code execution* dans les réglages) | **Meilleur choix** : lit toute la bible + images, lance le template, vérifie. |
| **ChatGPT gratuit** | moyen | oui (analyse de données, **quota limité**) | Bien si tu lances `--quick` d'abord (Idle/Walk/Attack1), puis le reste. |
| **DeepSeek** | moyen | **non** (écrit le code, ne l'exécute pas) | Lui faire écrire seulement les ZONES ÉDITABLES ; tu exécutes toi-même `python3 template/generator_template.py`. |
| **Claude (gratuit)** | grand | analyse de fichiers selon offre ; sinon comme DeepSeek | Bon pour relire le code des zones et la checklist. |

Comment donner le kit :
1. **Upload du zip** `asset-bible.zip` (le plus fiable : contient bible, ancres, NakedBody, bodyparts, template, exemples). Dire à l'IA : « décompresse et travaille dans `asset-bible/` ».
2. **Liens raw GitHub** (le repo `Poly-AAA/creator-pers0na` est public, branche `main`) pour ce qui y est déjà poussé, ex. :
   `https://raw.githubusercontent.com/Poly-AAA/creator-pers0na/main/assets/packs/fantasy-cc/catalog.json`
   `https://raw.githubusercontent.com/Poly-AAA/creator-pers0na/main/assets/packs/fantasy-cc/spritesheets/NakedBody/Idle.png`
   `https://raw.githubusercontent.com/Poly-AAA/creator-pers0na/main/scripts/build-kintsugi-panoply.py`
   ⚠ Au 29/10/2026, les dossiers `*Feminine*` et `build-feminine-panoply.py` ne sont **pas encore poussés** sur GitHub (404) → utilise le zip. Si tu pousses `asset-bible/` dans le repo (ex. `docs/asset-bible/`), les liens deviennent `https://raw.githubusercontent.com/Poly-AAA/creator-pers0na/main/docs/asset-bible/ASSET_BIBLE.md`, etc.
3. Les IA de chat ne savent pas toujours ouvrir des liens : en cas de doute, **colle le texte de `ASSET_BIBLE.md`** et **joins les images** (contact sheet + exemples).
4. Sandbox limitée : `python3 template/generator_template.py --quick` (3 anims) puis `--anims Run,Attack2,…` par lots.

---

## B. BLOC CONTRAT (à mettre en tête de CHAQUE prompt)

```
Tu es l'artiste technique pixel-art du jeu mobile creator-pers0na (style Merakintsugi).
CONTRAT — à respecter à la lettre :
1. Lis d'abord ENTIÈREMENT asset-bible/ASSET_BIBLE.md, puis anchors.json (meta), reference/contact_*.png,
   reference/palette_swatch.png et les exemples reference/examples/<…>. Résume en 5 lignes les règles qui
   s'appliquent à cette tâche AVANT de produire quoi que ce soit.
2. Tu utilises UNIQUEMENT template/generator_template.py. Tu ne modifies QUE ses blocs
   "ZONE ÉDITABLE 1/2/3". Le moteur, le cel-shading, le contour #1C154D et la validation sont figés.
3. Tu EXÉCUTES le script (si tu peux exécuter du code) : d'abord --quick, puis toutes les anims.
   Si tu ne peux pas exécuter, tu le dis clairement et tu me donnes uniquement les zones éditables complètes.
4. Sorties : out/<DOSSIER>/<Anim>.png pour les 30 anims (noms EXACTS du §3), 1920x1024 RGBA,
   15 colonnes x 8 lignes de 128x128, row 0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE, aligné pixel sur NakedBody.
5. Auto-contrôle : le script doit afficher "VALIDATION OK". Sinon tu corriges les zones éditables et tu relances
   (max 5 essais), puis tu me montres out/report_<DOSSIER>.json et out/preview_<DOSSIER>.png.
   Tu recopies ensuite la checklist §12 cochée ligne par ligne.
6. INTERDIT : visage (yeux/bouche), corps découvert, anti-aliasing / alpha partiel, couleur hors palette,
   >3 tons par matériau, recentrage/redimensionnement, nouvelle anim/direction/slot non demandés,
   modification de fichiers existants du jeu, de catalog.json ou du HTML.
7. Si une information manque ou est ambiguë : tu t'ARRÊTES et tu poses UNE question précise. Tu n'inventes pas.
8. Livraison : un zip out/<DOSSIER>.zip + le bloc de code d'intégration (§11) en TEXTE, sans l'appliquer.
```

---

## C. Équipement / panoplie (une pièce par exécution)

```
<BLOC CONTRAT>

TÂCHE : créer la pièce « <nom FR, ex. Tunique de l'Aube> » de la panoplie « <NomSet> ».
- Slot jeu : <coiffe|cape|torse|jambes|bottes|ceinture|gants|bouclier>   (gants → dossier Hands<NomSet>)
- DOSSIER : <Partie><NomSet>   (ex. ChestAube)
- Palette (3 tons par matériau, hex exacts) :
    <matériau1> : <#L> <#M> <#D>
    <matériau2> : <#L> <#M> <#D>
- Forme : <description courte et mesurable : ex. "tunique couvrant 100 % torse+manches, col 2 px or,
  ceinture 1 px à 62 % du torse, pan avant 2 px avec rebond retardé 1 frame">
- Référence visuelle : reference/examples/<ChestFeminine ou ChestKintsugi>/Idle.png (style, PAS couleurs Kintsugi)
- Mouvement secondaire : <aucun | pan/buste/hanches ±1 px retard 1 frame (F.lag)>
Pour une panoplie complète : répète ce prompt pièce par pièce (même palette), dans l'ordre
bottes → jambes → torse → gants → cape → coiffe, et vérifie l'aperçu composé à chaque étape.
Fournis à la fin l'item factory make<NomSet>PanoplyItems() (modèle §11, stats ∈ SLOT_STATS) en texte.
```

## D. Coiffure animée (cheveux / coiffe)

```
<BLOC CONTRAT>

TÂCHE : coiffure « <nom> », slot coiffe, DOSSIER Head<NomSet>  (ou Hair<NomSet> si coupe portée SOUS une coiffe).
- Palette cheveux : <#L> <#M> <#D>   (défaut : cuivre #F4A96A #C8613F #85323A)
- Forme : calotte = parts["head"] sauf la zone visage (pas d'yeux, pas de bouche, aucun trait) ;
  <queue haute / mèches / longueur en px>.
- Mouvement secondaire OBLIGATOIRE : les mèches suivent la tête avec 1 frame de retard
  (F.P["head_center"] vs F.A["head_center"], F.lag("head_center", axis=0, clamp=2)) ; traînée opposée au
  déplacement (TRAIL §9) ; la queue reste côté nuque (F.back_side()), jamais devant le visage ;
  rows N (6) : cheveux visibles de dos ; rows S (2) : rien sur le visage.
- Débord max : MAX_OUTSET["coiffe"] = 14 px. Pas de contour sur les pixels du torse si la mèche passe devant.
Référence : reference/examples/HeadFeminine/ et HeadMeraHair/.
```

## E. Modification corporelle (variante de silhouette)

```
<BLOC CONTRAT>

TÂCHE : variante corporelle « <nom, ex. Athlétique> » appliquée AUX VÊTEMENTS (on ne modifie jamais NakedBody).
- Base : panoplie <NomSet> existante ; nouveaux DOSSIERS <Partie><NomSet><Variante> (ex. ChestFeminineAthletique).
- Profils en px par ligne, exactement comme VARIANTS de build-feminine-panoply.py :
    bust_side=<[..]> bust_34=<[..]> hip_side_back=<[..]> hip_front=<[..]> thigh=<0|1> waist_cinch=<bool> bounce=<bool>
- Ajouts uniquement HORS du corps (pixels transparents de NakedBody) ; la tenue reste couvrante.
- Rebond : ±1 px vertical, retard 1 frame (F.lag("chest"/"pelvis", axis=1, clamp=1)) si bounce=true.
- Garder la palette du set d'origine.
```

## F. Nouvelle animation

```
<BLOC CONTRAT>

TÂCHE : proposer l'animation « <NomAnim> » (<description>).
ATTENTION : une animation = une nouvelle sheet NakedBody + TOUTES les pièces. Le template ne sait PAS créer
de pose. Donc :
1. Tu choisis d'abord l'anim existante la plus proche parmi les 30 (justifie avec la contact sheet
   reference/contact_frames_S.png) et tu proposes une RÉUTILISATION (sous-plage de frames, fps, ordre),
   format REACTIONS : { sheet:"<Anim>", frames:[…], fps:<n>, returnMs:<n> }. C'est la solution par défaut.
2. Seulement si je réponds "nouvelle sheet" : tu produis NakedBody<NomAnim> 1920x1024 en recomposant des frames
   existantes (copie de cellules entières, pas de redessin), 15 frames x 8 rows dans l'ordre §2, puis tu
   régénères chaque pièce avec le template (--anims <NomAnim>) après avoir recalculé anchors/bodyparts avec
   tools/extract_anchors.py.
Pas de nouvelle direction, pas de taille de cellule différente.
```

## G. Arme + VFX élémentaire

```
<BLOC CONTRAT>

TÂCHE : arme « <nom FR> », élément <Feu|Eau|Terre|Air>, DOSSIER Melee<NN> (prochain libre : Melee31).
- Base de pose (grip/alignement) : Melee<k> existant (<catégorie : Lance=Melee21, Hache/Faux=Melee17,
  Marteau=Melee10, Dague=Melee1, Épée=Melee2>). Dérivation cellule par cellule comme build_elem_weapons.py :
  lum>=128 → tête/lame, <128 → manche ; axe manche→lame ; accessoire procédural <prongs|hook|heavy|katar|autre décrit>.
- Palette élément (§6) core/edge/dark + outline élément ; 2 tons posterisés + manche sombre ; alpha 0/255.
- Ancres : weapon_grip / weapon_tip (anchors.json) pour contrôler que le grip reste dans la main.
- VFX : atlas PNG, 8 lignes = octants (0=E, sens horaire), colonnes = frames, cellule carrée <cell> px,
  2 tons (core/edge), pixels 2x2, 1 drawImage/frame ; métadonnées {cell, frames, reach} en JSON.
- Code (en texte) : WEAPON_ARCHETYPE, WEAPON_DB (anim, fps, hitDelay, dmg, element…), BAKED_WEAPON_ANIM,
  KINTSUGI_NAMES, GEAR_DEF, exception tint /^Melee(2[6-9]|3[0-1])$/, item via mk(...) comme makeElementalWeaponItems.
Pour une arme, utilise SLOT="arme" dans la ZONE 1 ; le template valide alors taille/alpha/palette/contour/bord.
```

## H. Évolution de sort (paliers I / II ★ / III ★★)

```
<BLOC CONTRAT>

TÂCHE : évolution visuelle du sort « <id_sort> » (élément <…>).
Règles fixes du jeu (ne pas changer) : I au 1er lancer ; II ★ au 2e (+4 dégâts) ; III ★★ au 3e (+10 dégâts
+ poussée 1 case) ; hit-stop 65 ms (85 ms en III) ; échelle smear 1+(tier-1)*0.22.
Livrables :
- 2 atlas : <nom>_t2.png et <nom>_t3.png (8 lignes octants x frames, cellule carrée), 2 tons posterisés de la
  palette élément, alpha 0/255, III = II + contre-slash + braises cuits dans le même strip (1 drawImage/frame).
- Métadonnées : { "t2": {cell, frames, reach}, "t3": {cell, frames, reach} }.
- 1 entrée de config dans la liste existante adaptée (BLUE_FLAME_SLASH_USES | FIRE_BUFF_USES |
  FIRE_CHAIN_USES | FIRE_DASH_USES) : { spells:["<id_sort>"], minTier:2, weapon:/<regex>/? }.
- Aucun nouveau moteur de rendu ; aucune autre valeur de gameplay modifiée.
Auto-contrôle : tailles = cell*frames x cell*8, alpha 0/255, ≤ 3 couleurs + transparent par atlas,
lisible à 1x, cohérent avec reference/examples/vfx/blueflame_t2.png / t3.png.
```
