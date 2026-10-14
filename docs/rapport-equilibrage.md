# Rapport d’équilibrage des sorts

Duels simulés sur une grille 10×10 (distance de Chebyshev, comme le combat).
Chaque sort de dégâts est testé **avec Coup brut** contre deux Coup brut.
Un sort sans effet en sonde est réparé une fois, puis écarté s’il ne fait toujours rien.
Les dégâts sont ramenés vers **3,6 à 7,2 dégâts moyens par PA** (double frappe comprise), puis ajustés selon le taux de victoire.

## Bilan

| Mesure | Valeur |
| --- | --- |
| Sorts en entrée | 72 |
| Conservés | 72 |
| Écartés | 0 |
| Réparés | 0 |
| Dégâts moyens / PA | 4.56 |
| Taux de victoire moyen (dégâts) | 50 % |

## Rôles conservés

- aoe : 10
- control : 8
- heal : 8
- melee : 15
- mobility : 8
- ranged : 15
- shield : 8

## Encore très polarisés

Ces sorts restent sous 5 % ou au-dessus de 95 % de victoires après trois ajustements. Ils sont conservés : la sonde confirme qu’ils agissent, mais leur effet (poussée, double frappe, contrôle) pèse plus que les dégâts bruts.

- Frappe magique (`gen_001`) — 0 % · 6.25 dégâts/PA
- Uppercut calme (`gen_003`) — 100 % · 7.00 dégâts/PA
- Rayon magique (`gen_004`) — 100 % · 5.00 dégâts/PA
- Uppercut sombre (`gen_033`) — 0 % · 6.00 dégâts/PA
- Estoc sombre (`gen_034`) — 0 % · 6.13 dégâts/PA
- Morsure magique (`gen_035`) — 100 % · 7.00 dégâts/PA
- Onde lunaire (`gen_039`) — 100 % · 4.17 dégâts/PA
- Frappe lunaire (`gen_049`) — 100 % · 4.50 dégâts/PA
- Uppercut calme 51 (`gen_051`) — 100 % · 7.00 dégâts/PA
- Frappe funeste (`gen_067`) — 100 % · 5.67 dégâts/PA

## Ajustements

- `gen_001` — nerf victoires (88%)
- `gen_001` — buff victoires (0%)
- `gen_001` — nerf victoires (88%)
- `gen_002` — nerf victoires (100%)
- `gen_002` — nerf victoires (100%)
- `gen_002` — nerf victoires (75%)
- `gen_003` — buff victoires (25%)
- `gen_003` — nerf victoires (75%)
- `gen_003` — buff victoires (13%)
- `gen_004` — nerf ratio (7.33 → 7.33)
- `gen_004` — nerf victoires (100%)
- `gen_004` — nerf victoires (100%)
- `gen_004` — nerf victoires (100%)
- `gen_005` — buff victoires (0%)
- `gen_006` — nerf victoires (100%)
- `gen_006` — nerf victoires (100%)
- `gen_006` — nerf victoires (88%)
- `gen_008` — buff ratio (3.00 → 3.63)
- `gen_008` — buff victoires (0%)
- `gen_009` — buff ratio (2.75 → 3.63)
- `gen_009` — buff victoires (0%)
- `gen_009` — buff victoires (25%)
- `gen_010` — buff ratio (2.00 → 3.60)
- `gen_010` — buff victoires (25%)
- `gen_010` — buff victoires (25%)
- `gen_010` — buff victoires (0%)
- `gen_012` — buff ratio (2.50 → 3.67)
- `gen_017` — nerf victoires (75%)
- `gen_017` — buff victoires (0%)
- `gen_017` — nerf victoires (88%)
- `gen_018` — buff victoires (13%)
- `gen_018` — buff victoires (0%)
- `gen_019` — buff victoires (0%)
- `gen_019` — buff victoires (0%)
- `gen_020` — nerf victoires (100%)
- `gen_021` — nerf victoires (100%)
- `gen_021` — nerf victoires (88%)
- `gen_021` — nerf victoires (75%)
- `gen_022` — buff victoires (25%)
- `gen_024` — buff ratio (3.00 → 3.63)
- … 89 autres ajustements

Fichier mis à jour : `data/generated-spells.json`.
