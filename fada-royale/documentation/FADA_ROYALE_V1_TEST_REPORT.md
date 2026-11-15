# Fada Royale — Rapport de tests

# v1.1

Mesuré sur la version finale v1.1, mêmes conditions que la v1.0 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé). Les nouveaux tests figent la boucle du jeu et avancent image par image. Ces tests ne mesurent pas la vitesse sur un vrai téléphone.

## Non-régression (scripts de la v1.0, tous relancés)

| Test | Résultat v1.1 |
|---|---|
| `animtest.cjs` Boss (14 situations) | Aucune dérive : rotation cumulée de la poitrine entre −20° et +26° ; saut du buste ≤ 18° par image ; bras ≤ 36° (course puis saut) ; aucun NaN, quaternions normés |
| `animtest.cjs` Guerrière | Rotation cumulée entre −10° et +25° ; buste ≤ 17° par image ; bras ≤ 38° (daba en courant) ; aucun NaN |
| `skiptest.cjs` Boss | Mêmes valeurs ; les os que three.js n'écrit pas (Spine…) ne provoquent plus de dérive |
| `sim.cjs` (3 parties) | 0 erreur ; fin en 271, 303 et 309 s avec 1 survivant |
| `flows.cjs` ordinateur et téléphone | Tir, rechargement, lunette, construction (3 pièces), édition, kilishi (75 PV), pause, fin de partie, rejouer, retour au lobby : tout passe |
| `lobbytest.cjs` ordinateur et téléphone | Perso et pseudo enregistrés, mode indisponible refusé, partie lancée, récompenses (+118 XP, +11 cauris), retour, entraînement (5 armes, 500 banco, 8 mannequins), quitter |
| `fixes2.cjs` | TOP 1 : le gagnant ne prend plus de dégâts de tempête (100 PV avant et après) |
| `ddatest.cjs` | 3 000 rayons, 0 différence entre la grille et le test de toutes les boîtes (2 023 boîtes de collision, 24 ms au lieu de 63) |
| `decals.cjs` | Impacts visibles et lumière du coup de feu active en Moyenne |

## Nouveautés v1.1

| Test | Résultat |
|---|---|
| `housestats.cjs` | 100 maisons ouvertes, dont 23 à étage ; hauteur sous plafond minimale 3,65 m ; aucune maison trop basse ; dénivelé maximal devant une porte 1,07 m ; plus grande marche 0,51 m (on monte jusqu'à 0,6 m) |
| `houses.cjs` : porte | Le joueur entre et se retrouve au niveau du sol intérieur |
| `houses.cjs` : étage | Escalier intérieur : du rez-de-chaussée (1,26 m) à l'étage (4,66 m) |
| `houses.cjs` : escalade | Saut face au mur du fond : escalade, puis rétablissement sur le toit (5,9 m de mur, 2,4 s) |
| `houses.cjs` : muret | Saut face à un muret de 1,1 m : le personnage se hisse dessus |
| `houses.cjs` : bots | 12 bots sur 12, partis de derrière la maison, entrent par la porte chercher le butin (3,7 à 6,0 s) |
| `reloads.cjs` | Planches Boss et Guerrière : rechargement de chaque arme, culasse du sniper, changement d'arme, kilishi, thé ; pompe vide : 0, 0, 1, 1, 2 cartouches à 0,23 / 0,47 / 0,70 / 0,93 / 1,17 s ; tirer pendant le rechargement l'interrompt |
| Main gauche (IK) pendant le rechargement du fusil | À 1 cm près de sa cible (chargeur, ceinture, puits de chargeur) à 10, 30, 50, 70 et 90 % |
| `hud.cjs` | HUD en partie sur ordinateur (1280×720) et Pixel 7 paysage : aucune erreur |
| Recherche d'emojis | 0 dans `index.html`, `src/lobby/`, `src/core/` |
| Coût du décor (même vue au-dessus d'Agadez, Niamey, Zinder, persos cachés) | Basse : 46-47 appels de dessin dans les deux versions, 200 → 221 k triangles ; Moyenne : 61-63 appels (Niamey 111 → 72), 432 → 474 k triangles (+10 %) |
| APK 1.1 | Signature v2 vérifiée, même certificat que la 1.0 (SHA-256 `3DB2BF18…9D2A`), version 1.1 (code 11) ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 23 fichiers servis, 0 introuvable, 0 erreur JavaScript, polices du jeu affichées sans Internet |

**Pas testé** : sur un vrai téléphone Android (aucun émulateur dans l'environnement de construction).

---

# v1.0

Toutes les valeurs ci-dessous ont été mesurées sur la version finale (dernière passe complète après le commit `47571fe`), avec les scripts de `tests/` (voir `tests/README.md` pour les relancer).

**Environnement** : Chromium sans écran (Playwright), rendu WebGL **logiciel** (SwiftShader), jeu servi en local, **tout accès réseau externe coupé** (seule la police Google est tentée et bloquée : le jeu bascule sur les polices du système). Formats testés : ordinateur 1366×768, iPhone 13 en paysage (844×390), Pixel 7 en portrait, Galaxy S8 en paysage (740×360).

**Ce que ces tests ne prouvent pas** : la vitesse sur un vrai téléphone Android. Le rendu logiciel est bien plus lent qu'un GPU pour compiler les shaders et relire des pixels, et bien plus rapide pour rien du tout : les durées de rendu ne sont donc pas représentatives. La logique (animations, collisions, parties, interface, données) est, elle, vérifiée exactement.

---

## 1. Animations — banc des 14 situations (`animtest.cjs`)

Mesures image par image à 60 images/s : rotation de la poitrine par rapport au perso (dérive cumulée et plage), saut maximal de la poitrine et des bras d'une image à l'autre, norme des quaternions.

**Avant (v0.9.1)** — pires valeurs : dérive **−2 625°** (course en visant), **+2 365°** (course en tirant), −1 739° (caméra qui tourne vite), −1 794° (daba) ; saut du buste **154°** par image ; saut des bras **141°**.

**Après (v1.0)** :

| Situation | Boss : dérive / buste / bras | Guerrière : dérive / buste / bras |
|---|---|---|
| Course en ligne droite | −9° / 3° / 4° | −10° / 3° / 6° |
| Changements de direction rapides | 23° / 4° / 5° | 22° / 4° / 9° |
| Sprint | 28° / 4° / 4° | 27° / 4° / 5° |
| Course en cercle (4 s) | −2° / 3° / 3° | −3° / 3° / 7° |
| Caméra qui tourne vite | 18° / 4° / 3° | 18° / 4° / 7° |
| Pas chassés gauche/droite | −5° / 3° / 4° | −5° / 3° / 5° |
| Marche arrière | −7° / 4° / 3° | −6° / 4° / 4° |
| Course en visant | −3° / 3° / 3° | −1° / 3° / 6° |
| Course en tirant | 27° / 4° / 14° | 25° / 4° / 28° |
| Course puis saut | 11° / 5° / 15° | 6° / 5° / 12° |
| Course puis glissade | 31° / 9° / 8° | 38° / 12° / 9° |
| Marche puis arrêt | 0° / 4° / 3° | −3° / 3° / 6° |
| Changement d'arme en courant | 27° / 18° / 32° | 0° / 10° / 29° |
| Daba en courant (coups) | −20° / 10° / 24° | 42° / 7° / 28° |

Les « dérives » restantes (≤ 42°) sont la différence de pose entre le début et la fin du scénario, à l'intérieur de la plage normale du mouvement (−23° à +70°) : il n'y a plus d'accumulation. Quaternions : écart de norme < 0,0001, aucun NaN, pour les 28 cas.

Captures vérifiées : pas chassé (jambes de côté, buste et arme vers l'avant), course en tirant, course en cercle, vues de dos, de côté et de face.

## 2. Parties complètes (`sim.cjs`)

5 parties de Battle Royale simulées en accéléré sur la carte agrandie :

| Partie | Durée de jeu | Fin | Erreurs | Positions invalides |
|---|---|---|---|---|
| 1 | 5 min 09 | 1 survivant (le joueur, invincible pour le test) | 0 | 0 |
| 2 | 4 min 40 | 1 survivant (bot) | 0 | 0 |
| 3 | 3 min 43 | 1 survivant (bot) | 0 | 0 |
| 4 | 3 min 51 | 1 survivant (bot) | 0 | 0 |
| 5 | 4 min 34 | 1 survivant (bot) | 0 | 0 |

## 3. Parcours de jeu (`flows.cjs`) — ordinateur et iPhone

Les deux formats : atterrissage, tir (cadence respectée), changement d'arme, lunette du sniper, construction (3 à 4 pièces posées selon le terrain), édition d'un mur, kilishi (50 → 75 PV), pause avec les paramètres, élimination par la tempête, écran de fin, REJOUER (20 joueurs, constructions effacées), retour au lobby. **Tout passe.**

## 4. Lobby (`lobbytest.cjs`) — ordinateur, iPhone paysage, Pixel portrait

| Vérification | Résultat (les 3 formats) |
|---|---|
| Le lobby s'affiche, perso 3D visible | Oui (captures) |
| Sélection et équipement d'un perso | Guerrière équipée et enregistrée |
| Pseudo conservé | « Samir » dans le profil et dans le stockage local |
| Boutique (tenues, planeurs, armes), missions, événements, profil | Affichés, aperçus 3D sur l'estrade |
| Mode indisponible | Refusé : « Duo : en développement, pas encore jouable. » |
| JOUER → partie | Lancée avec le bon perso et le bon pseudo, HUD affiché, lobby masqué |
| Fin de partie → récompenses | « +118 XP · +11 cauris » (calculé à partir de 2 élims et 180 dégâts) |
| Retour au lobby | Oui, statistiques enregistrées (1 partie, 2 élims, 180 dégâts, meilleur classement #20) |
| Entraînement | 5 armes, 500 banco, 8 mannequins, tempête désactivée |
| Quitter l'entraînement | Retour au lobby, partie non comptée |
| Écran tactile | Captures iPhone et Pixel : menus, panneaux et bouton JOUER utilisables, rien ne se chevauche (après corrections) |

## 5. Corrections v0.9.1 toujours en place (`fixes2.cjs`)

Pile de butin partiellement ramassée : le reste reste par terre ; plus de soin après la mort ; après un TOP 1 dans la tempête finale, le gagnant reste à 100 PV pendant 15 s et l'écran « TOP 1 ! » s'affiche. **OK.**

## 6. Collisions par la grille (`ddatest.cjs`)

3 000 rayons aléatoires autour des 1 022 boîtes de collision (dont 605 touchent une boîte) : **0 différence** avec l'ancienne méthode (tester toutes les boîtes). Temps total : 31,6 ms pour le nouveau rayon complet (terrain compris) contre 77,5 ms pour l'ancien test des boîtes seules.

## 7. Effets de tir (`decals.cjs`)

En qualité Moyenne : impacts créés sur les murs touchés (pas sur le terrain ni sur les constructions, par choix), lumière du coup de feu présente et active. Douilles visibles sur les captures.

## 8. Profils graphiques (`profiles.cjs`, `tris.cjs`)

Même partie, même endroit (Agadez), 10 bots autour du joueur, appels de dessin et triangles d'une image (ombres comprises) :

| Profil | Appels de dessin | Triangles | Ombres | Distance de vue |
|---|---|---|---|---|
| Basse | 115 | 271 k | non | 230 m |
| Moyenne | 196 | 615 k | oui | 300 m |
| Haute | 204 | 622 k | oui (douces) | 400 m |

Répartition en Basse avec les 20 persos proches (pire cas, borne haute avant élimination hors champ) : persos 282 k, décor fusionné 96 k, terrain 45 k (72 k avant), « autres » (surtout les armes) 38 k (154 k avant les niveaux de détail), végétation ≈ 65 k.

## 9. Saccades (`probe.cjs`)

| Moment | Avant correction | Après |
|---|---|---|
| Lobby, une fois affiché | une image de 5,5 à 6,8 s (rendu logiciel) | **aucune image longue** (2 à 3 ms) |
| Lancement d'une partie | image longue à l'écran | image longue **pendant l'écran de transition** (compilation des shaders, création des 20 persos), puis 4 à 17 ms |

## 10. Conditions de validation (partie 9 de la mission)

| Condition | État | Preuve |
|---|---|---|
| Le perso ne tourne plus à 360° en courant | ✅ | §1 |
| Le torse reste stable | ✅ | §1 (±12° arme en main, ±36° avant) |
| Les bras ne se déforment pas | ✅ | §1 (saut ≤ 32°, 141° avant) |
| La visée fonctionne | ✅ | §1 « course en visant », §3 lunette |
| Le sprint fonctionne | ✅ | §1 sprint (vitesse 8,4 m/s mesurée) |
| Les deux persos testés | ✅ | §1 |
| Le lobby s'affiche correctement | ✅ | §4 |
| Le perso 3D est visible | ✅ | §4, captures |
| La sélection des persos fonctionne | ✅ | §4 |
| Le pseudo est conservé | ✅ | §4 |
| Les paramètres sont accessibles | ✅ | bouton ⚙️ du lobby, §3 pause |
| Le bouton JOUER fonctionne | ✅ | §4 |
| Lobby → partie | ✅ | §4 |
| Retour au lobby | ✅ | §3, §4 |
| Interface adaptée au tactile | ✅ (émulation) | §4 iPhone / Pixel ; **à confirmer au doigt sur un vrai téléphone** |
| Aucun écran noir au lancement | ✅ | tous les tests démarrent ; écran d'erreur explicite si un fichier manque (v0.9.1) |
| Aucune erreur JavaScript bloquante | ✅ | 0 erreur sur toutes les passes |
| Aucun chargement infini | ✅ | lobby atteint à chaque test, hors ligne |
| Ressources correctement chargées | ✅ | 2 persos, 6 armes, 2 jeux d'animations |
| Performances acceptables sur Android | ⚠️ **Non vérifié sur appareil réel** | profils et niveaux de détail en place (§8) ; mesure à faire (feuille de route, priorité 1) |
