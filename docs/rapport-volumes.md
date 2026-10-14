# Rapport des volumes

Chiffres mesurés par `scripts/volume.js`. Les dégâts ajustés pendant l’équilibrage ne sont pas réécrits dans `data/generated-spells.json`.

## Équilibrage

5 passes, 100008 combats chacune (72 sorts du grimoire × 1389 duels, donc au moins 1 000 combats par sort et par passe). Durée totale : 34257 ms.

| Passe | Combats | Victoires du sort testé | Ajustements | Durée |
| --- | --- | --- | --- | --- |
| 1 | 100008 | 63.4 % | 46 | 6835 ms |
| 2 | 100008 | 63.9 % | 42 | 6887 ms |
| 3 | 100008 | 65.8 % | 43 | 6715 ms |
| 4 | 100008 | 62.5 % | 43 | 6929 ms |
| 5 | 100008 | 66.1 % | 41 | 6890 ms |

Règle, en mémoire seulement : un sort de dégâts au-dessus de 58 % voit ses dégâts ×0,92 ; en dessous de 42 %, ×1,08. Le coup de référence adverse est un coup fixe 8-12.

Sorts de dégâts encore sous 35 % ou au-dessus de 70 % après la passe 5 :

- Frappe magique (`gen_001`) — 100.0 % · dégâts ×0,92
- Uppercut calme (`gen_003`) — 100.0 % · dégâts ×0,92
- Dard rapide (`gen_005`) — 74.8 % · dégâts ×0,92
- Orbe fragile (`gen_008`) — 25.0 % · dégâts ×1,08
- Maléfice sombre (`gen_009`) — 84.2 % · dégâts ×0,92
- Emprise magique (`gen_010`) — 26.4 % · dégâts ×1,08
- Morsure runique (`gen_017`) — 100.0 % · dégâts ×0,92
- Talon solaire (`gen_018`) — 99.7 % · dégâts ×0,92
- Frappe solaire (`gen_019`) — 86.6 % · dégâts ×0,92
- Tempête funeste (`gen_023`) — 86.3 % · dégâts ×0,92
- Fournaise funeste (`gen_024`) — 73.3 % · dégâts ×0,92
- Estoc sombre (`gen_034`) — 70.6 % · dégâts ×0,92
- Morsure magique (`gen_035`) — 100.0 % · dégâts ×0,92
- Salve sombre (`gen_036`) — 26.9 % · dégâts ×1,08
- Trait fragile (`gen_037`) — 72.3 % · dégâts ×0,92
- Nuée rouge (`gen_040`) — 15.3 % · dégâts ×1,08
- Répulsion rouge (`gen_041`) — 72.1 % · dégâts ×0,92
- Lien solaire (`gen_042`) — 25.6 % · dégâts ×1,08
- Glissade fragile (`gen_044`) — 72.0 % · dégâts ×0,92
- Frappe lunaire (`gen_049`) — 70.8 % · dégâts ×0,92
- Entaille lunaire (`gen_050`) — 73.9 % · dégâts ×0,92
- Uppercut calme 51 (`gen_051`) — 100.0 % · dégâts ×0,92
- Rayon funeste (`gen_052`) — 25.7 % · dégâts ×1,08
- Dard sombre (`gen_053`) — 82.9 % · dégâts ×0,92
- Brasier runique (`gen_055`) — 23.0 % · dégâts ×1,08
- Emprise rapide (`gen_058`) — 73.7 % · dégâts ×0,92
- Talon calme (`gen_066`) — 100.0 % · dégâts ×0,92
- Frappe funeste (`gen_067`) — 99.9 % · dégâts ×0,92
- Éclair calme (`gen_068`) — 72.9 % · dégâts ×0,92
- Flèche funeste (`gen_069`) — 71.4 % · dégâts ×0,92
- Tempête solaire (`gen_071`) — 73.3 % · dégâts ×0,92
- Fournaise funeste 72 (`gen_072`) — 87.3 % · dégâts ×0,92

## Self-play

Formats par génération : 1v1 100000, 2v2 50000, 3v3 40000, 5v5 35000, 10v10 25000 (250000 combats). Arrêt après 3 générations sans gain de plus de 0,5 point contre le champion, une fois 1000000 combats atteints. Plafond 5000000.

| | Valeur |
| --- | --- |
| Combats | 1500000 |
| Durée | 727799 ms |
| Générations | 6 |
| Politique retenue | soin sous 0.684, kiting oui, cible nearest |

- Génération 0 (miroir) — 49.89 % sur 250000 combats. 1v1 49.9%, 2v2 50.0%, 3v3 50.0%, 5v5 49.7%, 10v10 49.9%
- Génération 1 (mutant) — 20.40 % sur 250000 combats. 1v1 28.9%, 2v2 8.6%, 3v3 5.1%, 5v5 30.2%, 10v10 20.9%
- Génération 2 (mutant) — 88.06 % sur 250000 combats · retenue. 1v1 98.3%, 2v2 57.0%, 3v3 87.3%, 5v5 100.0%, 10v10 93.9%
- Génération 3 (mutant) — 10.74 % sur 250000 combats. 1v1 26.6%, 2v2 0.4%, 3v3 0.0%, 5v5 0.0%, 10v10 0.0%
- Génération 4 (mutant) — 54.76 % sur 250000 combats. 1v1 53.9%, 2v2 56.8%, 3v3 53.8%, 5v5 52.2%, 10v10 59.4%
- Génération 5 (mutant) — 27.02 % sur 250000 combats. 1v1 59.7%, 2v2 15.7%, 3v3 0.0%, 5v5 0.0%, 10v10 0.0%

Le fichier `data/ai-policy.json` du combat libre n’est pas remplacé : il sert encore à pondérer les sorts. Cette politique de self-play est celle du simulateur (`_policy` sur l’unité).

## Parties

10000 parties en 103478 ms. Arrivées au niveau 50 : 60 (0.6 %). Détail dans `docs/rapport-parties.md`.
