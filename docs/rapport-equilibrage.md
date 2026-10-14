# Rapport d'équilibrage des sorts générés

Généré le 2026-10-14. Les duels sont des combats simulés (sans navigateur) qui réutilisent les formules de dégâts du jeu : dé entre le minimum et le maximum, plus 20 % de la puissance, moins 40 % de la résistance, pondéré par le perçage.

## Volume

- Sorts avant audit : **168**
- Sorts après audit : **168** (126 dégâts, 21 soins, 21 boucliers)
- Écartés car invalides : **0**
- Ajustés selon le taux de victoire : **87**

## Dégâts par point d'action

| | Avant | Après |
| --- | --- | --- |
| Moyenne | 4.1 | 4.03 |
| Minimum | 4 | 4 |
| Maximum | 6 | 5 |

La bande visée pour un sort de dégâts est d'environ 4 à 7,2 points de dégâts moyens par PA.

## Sorts les plus gagnants (duel contre le sort médian)

| Sort | École | Dégâts/coût | Victoires vs médian |
| --- | --- | --- | --- |
| Entaille · Attack1 | Cinétique | 4 | 100 % |
| Entaille · Attack1 (Perçage) | Cinétique | 4 | 100 % |
| Entaille · Attack1 (Poussée, Allonge) | Cinétique | 4 | 100 % |
| Impact · Attack1 (Drain neural, Économe) | Cinétique | 4 | 100 % |
| Arc · Attack1 | Électrique | 4 | 100 % |
| Arc · Attack1 (Drain neural) | Électrique | 4 | 100 % |
| Arc · Attack1 (Drain neural, Poussée) | Électrique | 4 | 100 % |
| Parasite · Attack1 (Économe) | Neuro | 4 | 100 % |

## Sorts les moins gagnants

| Sort | École | Dégâts/coût | Victoires vs médian |
| --- | --- | --- | --- |
| Parasite · Attack2 (Frappe lourde) | Neuro | 4 | 13 % |
| Brûlure · Strafe droite | Thermique | 4.13 | 25 % |
| Parasite · Attack3 | Neuro | 4 | 25 % |
| Parasite · Attack1 | Neuro | 4 | 25 % |
| Parasite · Course-attaque | Neuro | 4 | 38 % |
| Brûlure · Course-attaque (Drain neural, Frappe lourde) | Thermique | 4.13 | 38 % |
| Brûlure · Course-attaque (Surcharge) | Thermique | 4.13 | 38 % |
| Parasite · Attack4 (Drain neural) | Neuro | 4 | 38 % |

## Ajustements

- **gen_attack_entaille_base** : affaibli (taux 100 %)
- **gen_attack_entaille_percage** : affaibli (taux 100 %)
- **gen_attack_entaille_poussee_allonge** : affaibli (taux 100 %)
- **gen_attack_impact_percage** : affaibli (taux 100 %)
- **gen_attack_impact_drain_econome** : affaibli (taux 100 %)
- **gen_attack_arc_base** : affaibli (taux 100 %)
- **gen_attack_arc_drain** : affaibli (taux 100 %)
- **gen_attack_arc_drain_poussee** : affaibli (taux 100 %)
- **gen_attack_parasite_econome** : affaibli (taux 100 %)
- **gen_attack_onde_base** : affaibli (taux 100 %)
- **gen_attack_onde_poussee** : affaibli (taux 100 %)
- **gen_attack_onde_surcharge_drain** : affaibli (taux 100 %)
- **gen_attack2_entaille_base** : affaibli (taux 100 %)
- **gen_attack2_entaille_drain** : affaibli (taux 100 %)
- **gen_attack2_entaille_percage_econome** : affaibli (taux 100 %)
- **gen_attack2_impact_base** : affaibli (taux 90 %)
- **gen_attack2_impact_poussee** : affaibli (taux 100 %)
- **gen_attack2_impact_drain_allonge** : affaibli (taux 90 %)
- **gen_attack2_arc_base** : affaibli (taux 100 %)
- **gen_attack2_arc_drain** : affaibli (taux 100 %)
- **gen_attack2_arc_econome_allonge** : affaibli (taux 100 %)
- **gen_attack2_onde_base** : affaibli (taux 100 %)
- **gen_attack2_onde_percage** : affaibli (taux 100 %)
- **gen_attack2_onde_drain_surcharge** : affaibli (taux 100 %)
- **gen_attack3_entaille_base** : affaibli (taux 100 %)
- **gen_attack3_entaille_allonge** : affaibli (taux 100 %)
- **gen_attack3_entaille_surcharge_drain** : affaibli (taux 100 %)
- **gen_attack3_impact_drain** : affaibli (taux 100 %)
- **gen_attack3_impact_surcharge_allonge** : affaibli (taux 100 %)
- **gen_attack3_arc_base** : affaibli (taux 100 %)
- **gen_attack3_arc_frappe** : affaibli (taux 100 %)
- **gen_attack3_arc_drain_econome** : affaibli (taux 100 %)
- **gen_attack3_parasite_surcharge_econome** : affaibli (taux 100 %)
- **gen_attack3_onde_base** : affaibli (taux 100 %)
- **gen_attack3_onde_poussee** : affaibli (taux 100 %)
- **gen_attack3_onde_drain_surcharge** : affaibli (taux 100 %)
- **gen_attack4_entaille_base** : affaibli (taux 100 %)
- **gen_attack4_entaille_drain** : affaibli (taux 100 %)
- **gen_attack4_entaille_drain_percage** : affaibli (taux 100 %)
- **gen_attack4_impact_econome** : affaibli (taux 100 %)
- **gen_attack4_impact_allonge_poussee** : affaibli (taux 100 %)
- **gen_attack4_arc_base** : affaibli (taux 100 %)
- **gen_attack4_arc_percage** : affaibli (taux 100 %)
- **gen_attack4_arc_percage_surcharge** : affaibli (taux 100 %)
- **gen_attack4_brulure_allonge** : affaibli (taux 90 %)
- **gen_attack4_parasite_base** : affaibli (taux 90 %)
- **gen_attack4_onde_base** : affaibli (taux 100 %)
- **gen_attack4_onde_surcharge** : affaibli (taux 100 %)
- **gen_attack4_onde_poussee_drain** : affaibli (taux 100 %)
- **gen_runAttack_entaille_base** : affaibli (taux 100 %)
- **gen_runAttack_entaille_surcharge** : affaibli (taux 100 %)
- **gen_runAttack_entaille_frappe_allonge** : affaibli (taux 100 %)
- **gen_runAttack_impact_base** : affaibli (taux 90 %)
- **gen_runAttack_impact_poussee** : affaibli (taux 100 %)
- **gen_runAttack_impact_percage_surcharge** : affaibli (taux 100 %)
- **gen_runAttack_arc_base** : affaibli (taux 100 %)
- **gen_runAttack_arc_drain** : affaibli (taux 100 %)
- **gen_runAttack_arc_econome_surcharge** : affaibli (taux 100 %)
- **gen_runAttack_parasite_econome** : affaibli (taux 100 %)
- **gen_runAttack_onde_base** : affaibli (taux 100 %)
- **gen_runAttack_onde_percage** : affaibli (taux 100 %)
- **gen_runAttack_onde_drain_percage** : affaibli (taux 100 %)
- **gen_strafeL_entaille_base** : affaibli (taux 100 %)
- **gen_strafeL_entaille_allonge** : affaibli (taux 100 %)
- **gen_strafeL_entaille_frappe_econome** : affaibli (taux 100 %)
- **gen_strafeL_impact_econome** : affaibli (taux 100 %)
- **gen_strafeL_impact_econome_percage** : affaibli (taux 100 %)
- **gen_strafeL_arc_base** : affaibli (taux 100 %)
- **gen_strafeL_arc_poussee** : affaibli (taux 100 %)
- **gen_strafeL_arc_econome_poussee** : affaibli (taux 100 %)
- **gen_strafeL_brulure_econome_poussee** : affaibli (taux 100 %)
- **gen_strafeL_onde_base** : affaibli (taux 100 %)
- **gen_strafeL_onde_allonge** : affaibli (taux 100 %)
- **gen_strafeL_onde_frappe_poussee** : affaibli (taux 100 %)
- **gen_strafeR_entaille_base** : affaibli (taux 100 %)
- **gen_strafeR_entaille_drain** : affaibli (taux 100 %)
- **gen_strafeR_entaille_econome_drain** : affaibli (taux 100 %)
- **gen_strafeR_impact_poussee** : affaibli (taux 100 %)
- **gen_strafeR_impact_poussee_drain** : affaibli (taux 100 %)
- **gen_strafeR_arc_base** : affaibli (taux 100 %)
- **gen_strafeR_arc_frappe** : affaibli (taux 100 %)
- **gen_strafeR_arc_drain_surcharge** : affaibli (taux 100 %)
- **gen_strafeR_brulure_percage_poussee** : affaibli (taux 90 %)
- **gen_strafeR_parasite_econome_drain** : affaibli (taux 100 %)
- **gen_strafeR_onde_base** : affaibli (taux 100 %)
- **gen_strafeR_onde_drain** : affaibli (taux 100 %)
- **gen_strafeR_onde_poussee_frappe** : affaibli (taux 100 %)


