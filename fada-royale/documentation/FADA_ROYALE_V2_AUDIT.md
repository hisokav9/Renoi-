# Fada Royale — Audit v2.0 (arsenal, construction, HUD, graphismes, carte, bots)

Point de départ : v1.7 (commit `720c7a2`, sauvegarde avant modification). Audit fait en lisant le code et à partir des mesures des versions précédentes.

## 1. Ressources reçues

| Ressource | Ce que c'est vraiment | Utilisation |
|---|---|---|
| 5 images d'armes | Rendus officiels de Fortnite (Epic Games) | **Références de catégorie seulement** : on ne copie ni l'image ni le dessin. Aucune n'est un modèle 3D. |
| « La vidéo fournie » (personnages, poses, emotes) | **Pas reçue avec cette demande.** Les seules vidéos de la conversation sont 5 vidéos BuildNow GG (v1.4, construction) | Rien n'en a été tiré pour les emotes ; je ne prétends pas l'avoir analysée |

Les 5 catégories et ce qui existe dans le jeu :

| Catégorie demandée | Modèle 3D dans le jeu | Décision |
|---|---|---|
| 1. Fusil d'assaut noir, chargeur courbé | `fusil-arme.glb` (fusil d'assaut, chargeur courbé, v1.2) | Gardé |
| 2. Arme tactique noire à canon long | aucun | **Nouvelle arme** : pompe tactique (semi-automatique) |
| 3. Fusil tactique beige | aucun | **Nouvelle arme** : fusil tactique (tir précis semi-automatique) |
| 4. Fusil de précision avec lunette | `sniper-arme.glb` (v1.2) | Gardé |
| 5. Fusil à pompe, crosse et poignée en bois | `pompe-arme.glb` (v1.2) | Gardé |

**Honnêteté sur les modèles** : les armes du jeu (v1.2) sont des modèles « 2.5D » : la silhouette de l'image découpée, extrudée et arrondie (≈ 4 cm d'épaisseur). C'est une vraie géométrie, pas une image plane, mais pas un modèle complet en volume. Pour les 2 nouvelles armes, il n'y a ni image originale ni modèle : elles sont **modélisées dans le code** (pièces en volume : boîtiers, canons, chargeur, crosse, poignée), ce qui est une vraie 3D légère et originale. Un modèle plus détaillé demanderait un outil « image → 3D » ; le seul disponible ici (Higgsfield) **consomme des crédits payants : pas utilisé sans accord**.

## 2. Arsenal (mission « Weapon System 2.0 »)

| Fonction | Existe | À améliorer | À créer |
|---|---|---|---|
| Catalogue de statistiques | `WEAP` dans `index.html` (dégâts, cadence, chargeur, recharge, dispersion, portée, dégâts aux pièces, recul, tête) | Sortir dans un module unique | Mode de tir, type de munitions, raretés possibles par arme |
| Raretés (5 couleurs) | `RAR_COL` gris → or ; **une seule rareté fixe par type d'arme** | Orange pour légendaire | Variantes de rareté par arme (stats, couleur au sol, dans l'inventaire) |
| Munitions | **Une seule réserve commune** (300) | — | 4 types (légères, moyennes, lourdes, cartouches), plafonds, caisses typées |
| Inventaire | Daba + 5 cases, échange avec une arme au sol (E / bouton) | Rareté et réserve affichées par case | Lâcher une arme (en gardant ses balles), arme lâchée récupérable |
| Prise en main, changement, rechargements | v1.7 : table de prise par catégorie, étuis, chorégraphies par arme | Ajouter les 2 nouvelles armes | Mode de tir semi-automatique |
| Armes au sol | Modèle qui tourne + faisceau de la couleur de la rareté | Anneau au sol, nom et rareté affichés | — |
| Bots | Armes au hasard pondéré, préférence par rareté | Compatibles avec raretés et munitions | — |
| Emotes | Lobby : geste de repos (manger/boire) | — | Emotes simples (pas de clips de danse dans le projet : poses construites à la main) |

## 3. Gameplay (mission « 2.0 »)

| Fonction | Existe | Limite | Plan |
|---|---|---|---|
| Construction continue | v1.4 : pièce posée au toucher, doigt gardé = pose en continu ; le fantôme reste en construction | Fantôme bleu (demandé : vert) | Vert / rouge ; test « 10 murs à la suite » |
| Sélection rapide | 4 boutons de pièces toujours visibles | — | Garder |
| Mode simple / avancé | Réglages séparés (pose au toucher, validation au relâchement) | Pas de choix global | Paramètre MODE DE CONSTRUCTION qui règle le même système |
| PV des constructions | Mur 150, autres 140 ; dégâts par arme | Détruites vite | Table centralisée (PV, temps de pose, dégâts par type d'attaque), PV environ doublés, testés |
| Personnalisation du HUD | Éditeur : déplacer, taille par bouton ; opacité et taille globales | Pas de dispositions toutes faites, pas d'opacité / masquage par élément | Dispositions prédéfinies, opacité et masquage par élément |
| Graphismes | 3 profils (Basse, Moyenne, Haute), résolution, distance, limite 30 / 60 | — | 5 profils (Très faible → Élevé + Personnalisé), réglages séparés, limite 30 / 45 / 60 / 90 / 120 selon l'écran mesuré |
| Carte | 480 m de côté, 14 villes et zones | — | Agrandir avec de nouvelles zones autour de l'existant |
| Durée de partie | ≈ 5 min (fin à 257-311 s en simulation) | Bien en dessous de 15-20 min | Phases de tempête centralisées et allongées |
| Bots | 19 (20 joueurs), IA : butin, zone, combat, couvert, portes | Nombre fixe | Nombre réglable, profils débutant / normal / avancé, performances mesurées |

## 4. Plan d'exécution (priorités)

1. Arsenal : catalogue central, raretés par arme, munitions typées, lâcher / ramasser / remplacer, HUD.
2. Les 2 nouvelles armes (modèles construits dans le code), modes de tir, présentation au sol.
3. Construction : fantôme vert / rouge, PV centralisés, mode simple / avancé.
4. Graphismes et FPS, personnalisation du HUD.
5. Carte agrandie, tempête pour 15-20 min, plus de bots et profils.
6. Emotes simples.
7. Tests (les deux listes demandées), documentation, APK.

## 5. Résultats (fin de la v2.0)

| Point de l'audit | Fait | Mesure / test |
|---|---|---|
| Catalogue de statistiques | `src/core/arsenal.js`, seule source des valeurs | `arsenal.cjs` |
| Raretés par arme | 5 raretés, plage par arme, effet sur dégâts / rechargement / dispersion, couleurs au sol, dans l'inventaire | `arsenal.cjs` : 22 / 23,5 / 25 / 26,5 / 28 de dégâts par balle (fusil d'assaut, commun → légendaire) |
| Munitions | 4 types, plafonds, caisses typées | `arsenal.cjs` |
| Inventaire | Lâcher (G / LÂCHER), reprendre, remplacer ; rareté et chargeur gardés | `arsenal.cjs` |
| 5 catégories demandées | 3 gardées (fusil d'assaut, sniper, pompe), 2 nouvelles modélisées dans le code (fusil tactique, pompe tactique) | `arsenal.cjs`, `prise.cjs` (9 armes) |
| Emotes | 4 gestes construits à la main (pas de clip, vidéo non reçue) | `emotes.cjs` |
| Construction continue, fantôme vert / rouge, simple / avancé, PV | Faits, réglages dans `src/core/building.js` | `construction2.cjs`, `construction.cjs`, `build.cjs`, `support.cjs` |
| Graphismes | 5 profils, réglages séparés, anticrénelage au redémarrage, limite d'images selon l'écran | `graphismes.cjs` |
| HUD | Opacité, masquage, dispositions Classique / Compacte / Construction / Personnalisée | `graphismes.cjs` |
| Carte | 680 m de côté, 8 nouveaux lieux (21 au total), 48 maisons ouvertes dans les nouveaux lieux | `bots.cjs`, `combat.cjs` |
| Durée de partie | Tempête de 19 min 20 s (7 phases), réglages dans `src/core/match.js` | `partie.cjs` : 21 parties entre 15,1 et 19,2 min |
| Bots | 19 à 59 réglables, 3 niveaux + mélangés, IA (zone, pillage, fin de partie, profils) | `bots.cjs`, `partie.cjs`, `combat.cjs` |

Détail des chiffres et des tests : `FADA_ROYALE_V1_TEST_REPORT.md` (section v2.0).
