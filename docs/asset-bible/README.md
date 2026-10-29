# Asset Bible — creator-pers0na

Kit pour faire produire par n'importe quelle IA de chat (AI Studio/Gemini, ChatGPT, DeepSeek, Claude) des sprites prêts à intégrer, sans improvisation.

| Fichier | Contenu |
|---|---|
| `ASSET_BIBLE.md` | **La bible** : format, directions, 30 anims (fps/frames), calques, nommage, palettes, style, interdits, mouvement secondaire, armes/VFX/évolutions, intégration, checklist. |
| `PROMPTS.md` | Gabarits FR copier-coller (équipement, coiffure, morphologie, animation, arme+VFX, évolution) + quelle IA utiliser. |
| `anchors.json` | Ancres par anim × direction × frame (tête, cou, torse, bassin, mains, pieds, grip/pointe d'arme). |
| `template/generator_template.py` | Générateur Pillow+numpy autonome ; l'IA n'édite que 3 zones ; valide automatiquement. |
| `reference/NakedBody/` | Les 30 sheets du corps (alignement pixel). |
| `reference/bodyparts/` | Cartes de segmentation (1 head, 2 torso, 3 arm, 4 hands, 5 legs, 6 feet). |
| `reference/contact_*.png` | Planches étiquetées (30 anims × 8 directions ; toutes les frames en vue S ; panoplies composées). |
| `reference/palette_swatch.png` | Nuancier hex. |
| `reference/examples/` | Exemples Kintsugi, Féminin, Pulpeuse, armes élémentaires Melee26–30, HeadMeraHair, atlas VFX. |
| `tools/` | Scripts de régénération des ancres et planches (besoin du repo + scipy). |
| `out/ChestExemple/` | Sortie de test du template (30 anims, VALIDATION OK). |

Démarrage rapide : `python3 template/generator_template.py --quick` puis sans `--quick`.
Valider un dossier existant : `python3 template/generator_template.py --check chemin/MonDossier`.
