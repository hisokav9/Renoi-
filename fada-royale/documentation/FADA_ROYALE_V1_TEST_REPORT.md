# Fada Royale — Rapport de tests

# v2.0.1

Mêmes conditions que les versions précédentes : Chromium sans écran, rendu logiciel (SwiftShader), réseau externe coupé, boucle du jeu figée et avancée image par image par les tests. **Aucun test sur un vrai téléphone** : les FPS sur Android ne sont pas garantis.

Batterie complète (35 tests) lancée sur le code de la v2.0.1, puis les tests du lobby relancés après l'intégration du panorama : **tous passent, aucune erreur de page** (détails plus bas).

## Nouveaux tests

| Test | Ce qui est vérifié | Résultat |
|---|---|---|
| `air_eau.cjs` — chute | Saut à 600 m : pose, vitesse, piqué, ouverture | Corps à 82° (à plat ventre), 40 m/s ; en poussant : 55 m/s, corps à 99°, 14,8 m/s vers l'avant ; ouverture automatique à 43 m du sol ; SAUT à 297 m : le parapente s'ouvre |
| `air_eau.cjs` — parapente | Sans toucher, virage, atterrissage | 7,5 m/s vers l'avant sans clavier, descente 4,7 m/s ; virage 1,57 rad/s (plafond 1,6) ; voile inclinée de 0,15 rad, perso de 0,35 ; descente au contact 2,8 m/s ; au sol en courant à 3,5 m/s, voile rangée |
| `air_eau.cjs` — nage | Joueur posé dans le fleuve | Hanches 0,14 m sous la surface, tête 0,13 m hors de l'eau, corps à 64° ; arme cachée ; 2,9 m/s, 3,9 en sprint ; 0 tir, 0 pièce posée, pas d'emote |
| `air_eau.cjs` — sortie et bots | Nager jusqu'à la berge ; un bot dans l'eau face au joueur | Sorti en 2 s, arme ressortie, au sol ; le bot a nagé 59 images sans tirer, puis a tiré 4 fois une fois sorti |
| `lieu_camera.cjs` — lieu | 40 s à longer le bord de Zinder (entre 0,85 et 0,99 fois son rayon), écran 800 × 480 | 1 seule affiche du nom |
| `lieu_camera.cjs` — caméra | Perso dos au mur d'une maison | Loin des murs : opaque ; caméra à 0,37 m : opacité 0,23 ; bot avec le même perso : opaque ; après : opaque |
| `lieu_camera.cjs` — textes | Tailles calculées par le navigateur à 800 × 480 | Munitions des cases 11 px, nom de l'arme 12 px, compteurs 11 px |

## Panorama du lobby

| Vérification | Résultat |
|---|---|
| `lobbytest.cjs` (ordinateur, téléphone en paysage, téléphone en portrait) : accueil, persos, boutique (tenues, planeurs, armes), missions, événements, profil, modes, partie, fin, entraînement | Passent sur ordinateur, téléphone en paysage et en portrait, aucune erreur de page |
| Captures (accueil, boutique avec le planeur : la caméra recule et lève les yeux, panneaux ouverts : le perso se décale) | Aucun bord ni trou du panorama visible ; le minaret reste dans le cadre au téléphone en paysage |
| Sans le fichier image | L'ancienne cour fermée (mur, minaret 3D) est construite ; seule erreur : le fichier introuvable (404) |
| Appels de dessin du lobby (une image) | 224 → 43 ; objets 400 → 68 ; triangles 28 206 → 27 050 |

## Durée des parties (`partie.cjs`, bots seuls, joueur spectateur)

| Bots | Parties | Durées (s) | Moyenne |
|---|---|---|---|
| 19 (normaux) | 2 | 1 094 · 1 003 | 1 048 s (17,5 min) |
| 39 (mélangés) | 3 | 1 050 · 884 · 1 152 | 1 029 s (17,1 min) |
| 49 (mélangés) | 4 | 1 025 · 1 096 · 874 · 1 027 | 1 006 s (16,8 min) |
| 59 (mélangés) | 2 | 1 114 · 1 023 | 1 068 s (17,8 min) |

**9 parties sur 11 entre 15 et 20 min ; 2 un peu en dessous** (874 s et 884 s, soit 14,6 et 14,7 min). Aucun bot mort sans arme.

`combat.cjs` (joueur piloté par le test, 39 bots) : parties de 18 min et 17,7 min ; le joueur élimine 8 puis 11 bots, est tué par un bot à 1 min 31 dans la 1re, meurt dans la tempête à 14 min 22 (rang 5) dans la 2e. Les 21 lieux visités à pied, une maison ouverte avec E et visitée dans chaque nouveau lieu qui en a.

## Performances (`perf_mobile.cjs`, processeur ralenti ×4, pas un vrai téléphone)

Calcul du jeu (logique + animation des persos, sans le rendu), en ms par image (entre parenthèses : 95 % des images en dessous) :

| Situation | v2.0 | v2.0.1 |
|---|---|---|
| Ville, 1 min après l'atterrissage, 29 bots | 5,5 (8,2) | 5,1 (9,7) |
| Même chose, 39 bots | 4,2 (7,5) | 6,8 (9,7) |
| Même chose, 59 bots | 10,9 (16,1) | 9,6 (14,7) |
| Pire cas, tous les bots autour du joueur (29 / 39 / 59 réglés) | 11,3 · 14,3 · 19,8 | 11,8 · 14,4 · 20,3 |
| En tirant, selon l'arme (Entraînement) | 3,1 à 4,7 | 2,8 à 6,1 |
| Lancement de la 1re partie (19 / 29 / 39 / 59 bots) | 0,43 · 0,5 · 0,8 · 0,79 s | 0,56 · 0,45 · 0,8 · 0,93 s |

Les écarts vont dans les deux sens (39 bots plus lent, 59 bots plus rapide) : ils dépendent de l'endroit où les bots ont atterri, tiré au sort à chaque partie. La chute, le parapente et la nage ne coûtent que pour les persos concernés (la nage remplace le déplacement au sol, elle ne s'y ajoute pas).

## Non-régression

Passent sans changement : `arsenal`, `construction2`, `graphismes`, `bots`, `emotes`, `partie` (×4 réglages), `combat`, `perf_mobile`, `prise` (110 situations), `changement`, `construction`, `tactile`, `build`, `support`, `houses`, `cover`, `fixes2`, `ddatest` (0 différence), `decals`, `sim`, `flows` (ordinateur et téléphone), `lobbytest` (ordinateur et téléphone), `hud`, `animtest` (Boss et Guerrière), `decor`, `profiles`.

- `flows.cjs` sur ordinateur s'est arrêté une fois sur un délai de capture d'écran dépassé (30 s), ses vérifications étant déjà passées : d'autres captures tournaient en même temps sur la machine. Relancé seul : il passe.
- `cover.cjs` : 10 bots sur 12 se mettent à couvert et y restent, comme en v2.0.

## APK 2.0.1

| Vérification | Résultat |
|---|---|
| Signature | v2 vérifiée ; certificat `3DB2BF18C0ABE4BE…`, **le même que les versions précédentes** : s'installe par-dessus la 2.0 |
| Manifeste | `versionCode` 20, `versionName` 2.0.1 |
| Contenu | Jeu complet dans `assets/www` (panorama du lobby compris, identique au fichier du dépôt) ; ni tests, ni documentation, ni clé |
| Simulation de la WebView Android (APK décompressé, même adresse `https://appassets.androidplatform.net` que sur le téléphone, commandes tactiles) | 80 fichiers servis, aucun introuvable, lobby avec le panorama affiché, partie lancée (taxi-brousse), aucune erreur JavaScript |
| Taille | 12,2 Mo (2.0 : 11,8 Mo ; le panorama pèse 0,36 Mo) |

# v2.0

Mêmes conditions que les versions précédentes : Chromium sans écran, rendu logiciel (SwiftShader), réseau externe coupé, boucle du jeu figée et avancée image par image par les tests. **Aucun test sur un vrai téléphone** (pas d'appareil ni d'émulateur Android ici) : les tests « téléphone » émulent un Pixel 7 (écran, toucher) et, pour les mesures de calcul, ralentissent le processeur ×4 (`perf_mobile.cjs`, la même approximation que Lighthouse). **Les FPS sur Android ne sont pas garantis** ; le rendu (GPU) n'est pas mesurable ici.

Batterie complète lancée sur le code final (34 tests), puis relancée pour les tests touchés par les derniers réglages : **tous passent**, aucune erreur de page. Deux tests (`construction2`, `tactile`) se sont révélés fragiles après le déplacement d'arbres et de rochers dans la brousse (correctif des maisons) : le jeu n'avait pas changé ; les tests ont été corrigés (voir « Corrections des tests ») puis relancés.

## Mission « Weapon System 2.0 » — 13 tests demandés

| # | Test demandé | Test | Résultat |
|---|---|---|---|
| 1 | Équiper chacune des cinq armes | `arsenal.cjs` (8 armes), `prise.cjs` | Les 8 armes s'équipent, modèle visible en main ; 5 catégories demandées : fusil d'assaut, pompe tactique, fusil tactique, sniper, pompe |
| 2 | Passer rapidement d'une arme à l'autre | `changement.cjs` | 10 changements en 1 s : l'arme affichée = l'arme choisie ; paires d'armes : jamais deux armes visibles, aucun saut isolé de la main |
| 3 | Tirer avec chaque catégorie | `arsenal.cjs` | Les 8 armes tirent ; automatiques en rafale (mitraillette 7 tirs en 20 images), semi-automatiques un coup par clic |
| 4 | Recharger chaque arme | `arsenal.cjs` | Chargeur plein après rechargement pour les 8 armes ; durées 1,8 à 4 s ; pompes cartouche par cartouche |
| 5 | Consommation des munitions | `arsenal.cjs` | Le tir vide le chargeur, pas la réserve ; le rechargement prend dans le bon type (légères, moyennes, lourdes, cartouches), les autres types ne bougent pas ; caisse de 10 lourdes ramassée avec 55 en poche : 60 (plafond), 5 restent au sol |
| 6 | Ramasser une arme au sol | `arsenal.cjs` | Fusil tactique épique (chargeur 7) ramassé : case 2, rareté épique, chargeur 7 |
| 7 | Abandonner une arme | `arsenal.cjs` | Touche G : case vide, arme au sol avec sa rareté et son chargeur, daba en main ; reprise ensuite à l'identique |
| 8 | Remplacer une arme dans l'inventaire | `arsenal.cjs` | Inventaire plein : la pompe tactique légendaire remplace le sniper en main (case 5), le sniper tombe au sol avec sa rareté et ses 3 balles |
| 9 | Les cinq niveaux de rareté | `arsenal.cjs` | Faisceau et anneau au sol gris / vert / bleu / violet / orange ; dégâts par balle du fusil d'assaut sur un mannequin : 22 / 23,5 / 25 / 26,5 / 28 |
| 10 | Prise en main pendant la course | `prise.cjs` | 110 situations bonnes (Boss et Guerrière × 9 armes × repos, course, sprint, combat, visée, rechargement, coups de daba) |
| 11 | Prise en main pendant la visée | `prise.cjs` | Canon vers l'avant (1,00) en visée pour toutes les armes, mains à leur point d'appui |
| 12 | Animations de changement d'arme | `changement.cjs`, `animtest.cjs` | Rangement à l'étui puis sortie ; demi-tour 0,17 s ; tir 0,53 s après l'appui ; sortie de sprint 0,2 s ; changement en l'air terminé à la réception |
| 13 | Performances sur mobile | `perf_mobile.cjs` | Processeur ralenti ×4 (pas un vrai téléphone) : 3,1 à 4,7 ms de calcul par image en tirant selon l'arme (Entraînement) — voir « Performances » |

## Mission « 2.0 Gameplay » — 17 tests demandés

| # | Test demandé | Test | Résultat |
|---|---|---|---|
| 1 | Dix murs à la suite sans interruption | `construction2.cjs` | 10 murs en 1,2 s, doigt jamais levé |
| 2 | Enchaîner murs, sols, rampes et cônes | `construction.cjs`, `construction2.cjs` | Mur, rampe, sol, toit à la suite (matérialisation, instances) ; en combat : tir, mur, tir, rampe, tir, mur, tir, sol |
| 3 | Changer de pièce pendant la construction | `construction2.cjs` | Doigt sur MUR puis RAMPE sans lever : la pièce suivante est une rampe, on reste en construction |
| 4 | Mode simple / avancé | `construction2.cjs`, `build.cjs` | Simple : TOURNER caché, rotation bloquée, sol posé à la place voisine si la case est prise ; avancé : TOURNER visible, rotation 1 |
| 5 | Construire vite pendant un combat | `construction2.cjs`, `tactile.cjs` | 4 tirs et 4 pièces enchaînés ; en courant avec 3 doigts : 2 pièces, 5,7 m parcourus, caméra tournée |
| 6 | Nouveaux PV des constructions | `construction2.cjs` | Mur 300 PV (avant 150), rampe / sol / toit 280 (avant 140) ; pour détruire un mur fini : 10 balles de fusil d'assaut, 3 coups de pompe, 5 de sniper, 5 de daba |
| 7 | Modifier et détruire les structures | `construction.cjs`, `support.cjs` | Porte, fenêtre, demi-mur, rampe éditée ; destruction : 0 collision restante ; tour de 20 pièces qui s'effondre quand on casse le bas |
| 8 | Déplacer les boutons du HUD | `graphismes.cjs` | Au doigt dans l'éditeur : TIRER déplacé de 120 px, agrandi à 130 %, opacité 60 % ; SAUT masqué (visible en transparence dans l'éditeur) |
| 9 | Redémarrer et vérifier la sauvegarde du HUD | `graphismes.cjs` | Page rechargée : TIRER à la même place, même taille et opacité ; SAUT toujours masqué ; disposition « Personnalisée » ; dispositions Compacte / Construction / Classique / Personnalisée appliquées |
| 10 | Changer les profils graphiques | `graphismes.cjs`, `profiles.cjs` | Au même endroit : 94 / 102 / 199 / 207 appels de dessin (Très faible → Élevé) ; ombres, sol, effets, végétation du profil Personnalisé vérifiés un par un |
| 11 | Limites FPS disponibles | `graphismes.cjs` | Écran mesuré 60 Hz → limites proposées 30, 45, 60, aucune ; porte de limite sur 2 s d'images : 30,5 / 45,5 / 60 à 60 Hz et 30,5 / 45,5 / 60,5 / 90,5 / 120 à 120 Hz. Mesure réelle impossible ici : le navigateur de test ne dépasse pas 24 images/s |
| 12 | Explorer toute la nouvelle carte | `combat.cjs`, `bots.cjs` | Les 21 lieux visités à pied : nom affiché, sol sous les pieds, aucun NaN ; une maison de chaque nouveau lieu ouverte avec E et visitée ; les 48 portes des nouveaux lieux s'ouvrent |
| 13 | Navigation des bots | `partie.cjs`, `houses.cjs`, `cover.cjs` | Parties entières : 3 à 7 morts dans la tempête sur 40 à 60 joueurs (le reste rejoint la zone), aucun bot mort sans arme ; bots entrés dans une maison par la porte en ≈ 4 s ; 11 bots sur 12 à couvert |
| 14 | Combats entre bots et joueur | `combat.cjs`, `bots.cjs` | 2 parties complètes, joueur piloté par le test (visée imparfaite, 0,5 s de réaction) contre 39 bots : il élimine 11 puis 4 bots, est tué par un bot ou par la tempête ; duels (6 par niveau, 2 exécutions) : précision 25,9 / 26,7 / 32,9 % puis 25,9 / 29,3 / 37,6 %, premier tir après 1,46 / 1,16 / 0,60 s puis 1,44 / 1,14 / 0,72 s (débutant / normal / avancé) |
| 15 | Partie complète | `partie.cjs`, `combat.cjs`, `sim.cjs` | Toutes les parties lancées sont allées au bout (dernier survivant), 0 erreur, 0 NaN |
| 16 | Durée de 15 à 20 minutes | `partie.cjs`, `combat.cjs` | Réglage final, 21 parties entières : **toutes entre 15 et 20 min** (907 à 1 153 s). 49 bots mélangés (6 parties) : 971 à 1 153 s, moyenne 17,3 min ; 39 (4) : 958 à 1 080 s, 17,1 min ; 59 (4) : 958 à 1 066 s, 16,8 min ; 19 normaux (3) : 1 008 à 1 047 s, 17,2 min ; 39 débutants (2) : 17,9 min ; 39 avancés (2) : 907 et 1 119 s. Avec le joueur (`combat.cjs`, 39 bots) : 17,5 et 18,2 min. Avant les derniers réglages (zones de tempête plus larges), 1 partie sur 3 descendait à 13,5-14,5 min |
| 17 | Performances sur Android | `perf_mobile.cjs`, `bots.cjs` | Pas de téléphone ici : processeur ralenti ×4 — voir « Performances ». FPS non garantis |

## Bots : avant / après

`partie.cjs` : parties entières entre bots, le joueur regarde (FR.spectate).

| | Avant (v1.7) | v2.0 |
|---|---|---|
| Nombre | 19 (20 joueurs) | 19 à 59 réglables ; par défaut 49 / 39 / 29 |
| Carte | 480 m | 680 m |
| Durée d'une partie (19 bots) | 4,1 min (232 à 264 s) | 17,2 min (1 008 à 1 047 s) ; 39 bots 17,1 min ; 49 bots 17,3 min ; 59 bots 16,8 min |
| Morts dans la tempête | 1 sur 19 | 4,3 sur 19 ; 5,5 sur 49 (partent à temps malgré une carte 2 × plus grande) |
| Précision des tirs | 27,8 % | ≈ 30 % en partie ; en duel : 25,9 % (débutants), 26,7 à 29,3 % (normaux), 32,9 à 37,6 % (avancés) |
| Distance des combats | 18 m | 17 m |
| Vie médiane d'un bot | 164 s (19 bots) | 550 s (19 bots) ; 167 s (49 bots) |
| Par niveau (39 bots) | — | débutants : précision 27,6 %, 148 constructions, vie médiane 217 s ; avancés : 32,8 %, 236 constructions, 160 s |
| Constructions par partie | 109 (19 bots) | 113 (19 bots) ; 266 (49 bots) |
| Bots morts sans arme | 0 | 0 |

## Performances

Calcul du jeu (logique + animation des persos, sans le rendu) :

| Situation | Mesure |
|---|---|
| Navigateur de test, tous les bots au sol dans un rayon de 150 m du joueur (`bots.cjs`) | 19 bots 2,1 ms · 39 bots 3,4 ms · 49 bots 4,8 ms · 59 bots 4,0 ms par image |
| Parties entières, au sol (`partie.cjs`) | 19 bots 0,8 ms · 49 bots 1,7 ms par image en moyenne (v1.7, 19 bots : 1,2 ms) |
| Processeur ralenti ×4, ville, 1 min après l'atterrissage (`perf_mobile.cjs`) | 29 bots 5,5 ms (95 % des images sous 8,2) · 39 bots 4,2 ms (7,5) · 59 bots 10,9 ms (16,1) |
| Processeur ralenti ×4, pire cas (tous les bots autour du joueur) | 29 bots 11,3 ms (16,3) · 38 bots 14,3 ms (21,8) · 55 bots 19,8 ms (28,6) |
| Processeur ralenti ×4, lancement de la 1re partie (persos créés) | 19 bots 0,43 s · 29 bots 0,5 s · 39 bots 0,8 s · 59 bots 0,79 s ; parties suivantes 0,06 à 0,09 s |

Une image dure 33 ms à 30 images/s et 16,7 ms à 60 : avec 59 bots tous proches, le calcul seul prend presque tout le budget d'un téléphone moyen. D'où les valeurs par défaut : 39 bots au téléphone, 29 sur un téléphone modeste, 49 sur ordinateur.

Optimisations mesurées au profileur (59 bots) : le ramassage des bots coûtait 8 % du calcul (chaque bot testait tous les objets à chaque image) → une image sur 3 ; coffres → une image sur 3 ; flottement des objets non affichés supprimé ; bots lointains (au-delà de 2 × la distance d'animation complète) animés une image sur 6.

## Non-régression (tests des versions précédentes)

| Test | Résultat |
|---|---|
| `prise.cjs` | 110 situations bonnes (9 armes dont les 2 nouvelles) |
| `changement.cjs`, `construction.cjs`, `tactile.cjs`, `build.cjs`, `support.cjs` | Tout est bon (montée mur + rampe : 60,9 m en 10 s, identique ; 56 m en 9 s dans les deux ordres) |
| `houses.cjs` | Porte fermée qui bloque, E, escalier, rebord, muret ; bots entrés en ≈ 4 s |
| `cover.cjs` | 11 bots sur 12 à couvert |
| `fixes2.cjs`, `ddatest.cjs`, `decals.cjs` | TOP 1 sans dégâts de tempête après la victoire ; 0 différence sur 3 000 rayons (3 967 collisions) ; 10 impacts pour 10 balles |
| `sim.cjs` | 2 parties de 6 min (limite du test) : 0 erreur, 0 NaN |
| `flows.cjs` ordinateur et téléphone | Tir, rechargement, lunette, construction, édition, soin, pause, fin de partie, rejouer, retour |
| `lobbytest.cjs` ordinateur et téléphone | Persos, boutique, missions, pseudo, modes, JOUER, fin et récompenses, retour, Entraînement ; lancement 13,9 s (49 bots, rendu logiciel) et 4,6 s (29 bots) |
| `hud.cjs` | Captures ordinateur et téléphone : « 30 en vie / 30 », bouton des emotes, nouveaux lieux sur la mini-carte |
| `animtest.cjs` Boss et Guerrière | 14 situations, aucun NaN, quaternions normés. Comparé à la v1.7 dans le même environnement : mêmes sauts du buste image par image (ex. 12,0° / 12,2°) ; les écarts du banc viennent du point d'atterrissage (taxi-brousse au hasard) |
| `decor.cjs`, `profiles.cjs` | Aucun programme GPU compilé en partie ; Basse 103, Moyenne 199, Haute 213 appels de dessin |

## APK 2.0

| Vérification | Résultat |
|---|---|
| Construction (`python3 android/build_apk.py`) | `android/dist/FadaRoyale-2.0.apk`, 11,8 Mo, signature v2 vérifiée |
| Clé de signature | Empreinte du certificat `3DB2BF18C0ABE4BE…`, la même que la v1.7 : s'installe par-dessus |
| Version | versionName 2.0 (versionCode 19) |
| Contenu | Nouveaux modules présents (`src/core/arsenal.js`, `weapon-models.js`, `building.js`, `match.js`), réglage final de la tempête ; ni clé ni tests dans l'APK |
| Jeu de l'APK hors ligne (WebView simulée, Pixel 7) | 79 fichiers servis, aucun introuvable, aucune erreur JavaScript ; lobby « v2.0 », JOUER → taxi-brousse |

## Corrections des tests (pas du jeu)

- `construction2.cjs` : ne revisait pas le mur entre deux tirs ; le recul faisait passer les tirs au-dessus du mur selon l'endroit choisi. Il revise maintenant avant chaque tir (comme un joueur).
- `tactile.cjs` : le joueur partait d'un point quelconque de la grille de construction et n'avait pas toujours le temps de changer de case ; il part d'une case sur terrain plat et court 2 s au lieu de 1,3.
- `combat.cjs` : la limite de durée était de 70 s au lieu de 70 min, la visée du joueur piloté était parfaite ; corrigés avant les mesures.
- `bots.cjs` : duel à un endroit tiré au hasard (une dune pouvait cacher la cible) et trop court ; 6 duels sur un terrain dégagé connu.

## Bugs du jeu trouvés par les tests v2.0 et corrigés

- Maisons des nouveaux lieux posées sur une dune ou un rocher : seuil de porte trop haut pour l'ouvrir (Bilma, Termit) → maisons seulement sur un terrain assez plat ; les 48 portes s'ouvrent.
- Parties trop courtes au début (13 à 14 min) : la partie se joue quand les derniers survivants se croisent → zones intermédiaires plus larges, bots prudents en fin de partie, dégâts entre bots ×0,45.

## Ce qui reste

- Précision : débutant et normal sont parfois proches au fusil d'assaut à 22 m (25,9 contre 26,7 à 29,3 % selon l'exécution), parce qu'un tir « raté » touche encore souvent à cette distance ; élargir l'écart des tirs ratés selon le niveau. Le délai du premier tir, lui, sépare nettement les niveaux.
- Mesures sur de vrais téléphones Android (rendu et FPS).
- Termit n'a pas de maison (terrain trop pentu partout) : un replat à aménager si tu veux des maisons dans le massif.


# v1.7

Mêmes conditions que la v1.6 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée). **Pas de test sur un vrai téléphone** : aucun appareil ni émulateur Android dans l'environnement. Les tests tactiles envoient de vrais événements tactiles multi-doigts par le protocole de Chrome (Pixel 7 paysage simulé).

## Tests obligatoires de la mission

| Scénario demandé | Test | Résultat |
|---|---|---|
| Équiper le sabre (la daba) et effectuer plusieurs attaques | `changement.cjs` §9, `prise.cjs` | 4 coups sur 4 touchent un mannequin placé sous le réticule ; dégâts 0,3 s après l'appui (au moment où la lame frappe) ; main sur le manche pendant tout le coup ; pointe vers l'arrière à la levée (−0,43), vers l'avant au coup (0,7) et après (0,83) |
| Changer rapidement entre toutes les armes | `changement.cjs` §1-3 | 10 changements en 1 s : pas de blocage, l'arme affichée = l'arme choisie ; 5 paires d'armes : jamais deux armes visibles, aucun saut isolé de la main (geste le plus rapide 4,6 à 7,4 m/s), échange à l'étui (0,47 à 0,65 m de la position de tir) ; demi-tour repris depuis la pose (0,17 s au lieu de 0,5) |
| Passer de la course au tir | `changement.cjs` §5, `animtest.cjs` | Premier tir 0,2 s après l'appui en sprint (le temps que l'arme remonte) ; « course en tirant » : buste ≤ 4° par image, aucun NaN |
| Construire quatre structures successivement | `construction.cjs` §1 | Mur, rampe, sol, toit posés à la suite ; contour de matérialisation pendant la pose, retiré à la fin ; 4 pièces passées en instance, 4 matières libérées |
| Modifier un mur | `construction.cjs` §3, `build.cjs` | PORTE : cases 1 et 4 retirées, 7 collisions, on passe ; FENÊTRE : case 4 ; DEMI-MUR : cases 6, 7, 8 ; édition au doigt (v1.4) identique |
| Détruire une construction | `construction.cjs` §5-6, `support.cjs` | 0 collision restante (mur entier et mur édité), on passe, instance retirée ; impact : la pièce tremble puis revient exactement ; effondrement d'une tour identique à la v1.5 |
| Sauter pendant un changement d'arme | `changement.cjs` §6 | Changement commencé en l'air, terminé, revolver en main à la réception |
| Utiliser les contrôles tactiles simultanément | `tactile.cjs` | 3 doigts (joystick + viser + TIRER) : +4,2 m, caméra tournée de 0,36 rad, 6 balles ; doigts levés dans le désordre : chaque commande s'arrête seule ; construction en courant : 2 pièces, +5,1 m, caméra tournée ; changement d'arme en courant (+4,4 m) puis ÉCHANGE : retour au fusil |
| Effectuer une partie complète sans crash | `sim.cjs` | 3 parties complètes sur le code final (fin à 257, 301 et 311 s) : 0 erreur, 0 NaN |

## Prise en main (`prise.cjs`, nouveau) : 86 situations mesurées

Boss et Guerrière × 7 armes × repos, course, sprint, combat, visée, rechargement (daba : repos, course, sprint, 4 moments du coup).

| Mesure | v1.6.1 | v1.7 |
|---|---|---|
| Daba : paume par rapport au manche | 17 cm au-delà du bout du manche | sur le manche (z −0,04 à 0,04) |
| Daba : pointe pendant le coup | vers l'arrière (−0,6 à −1,0) | levée −0,43, coup 0,7, après 0,83 |
| Guerrière : main gauche sur l'arme | jusqu'à 7 à 12 cm de vide (sa main n'atteint pas le garde-main) | 0 situation au-delà de 3 cm |
| Canon en combat et en visée | — | 1,00 vers l'avant (toutes armes) |
| Arme dans le buste (< 7 cm de l'axe du corps) | — | 0 situation (sprint corrigé : 4 à 6 cm au premier essai) |
| Arme visible depuis la caméra de jeu (images) | non (cachée par le corps) | oui : crosse et boîtier en combat, arme à côté de la tête en visée |

**Défauts trouvés et corrigés pendant les tests**
- Changement d'arme dos ↔ hanche : la main sautait de 37 à 53 cm en une image → étape « transition du bras ».
- Début de changement : passage sans transition de la pose « basse » à la pose « combat » → lissage gardé pendant le changement.
- Glissade avec le revolver : le bras basculait de 80° en une image (épaule à 50 cm du sol, cible de la main sur l'épaule) → arme tenue devant soi en glissade.
- Coup de daba : coude qui basculait au passage au-dessus de l'épaule (59° en une image) → plan du coude adapté et lissé ; descente un peu moins rapide.
- REJOUER après des constructions : erreur et pièces de la partie précédente restées → corrigé (voir journal).
- Deux erreurs d'écriture de ma part (un commentaire qui masquait la fin d'une ligne de code) : le jeu ne se chargeait plus, vu tout de suite par le test de chargement ; toutes les lignes modifiées ont ensuite été relues.

## Banc d'animation (`animtest.cjs`, 14 situations, 60 images/s)

| | Boss : buste / bras (max par image) | Guerrière |
|---|---|---|
| Course, sprint, cercle, caméra rapide, pas chassés, marche arrière, arrêt | 3-5° / 7-14° | 3-4° / 7-14° |
| Course en visant / en tirant | 3-4° / 16-17° | 4° / 13-21° |
| Course puis saut | 5° / 36° | 5° / 36° (identique à la v1.6) |
| Course puis glissade | 10° / 28° | 10° / 30° |
| Changement d'arme en courant | 12° / 30° | 23° / 37° |
| Coups de daba en courant | 7° / 39° | 6° / 37° |

Aucun NaN, quaternions normés partout. Les valeurs de 30 à 39° par image sont des gestes rapides (changement d'arme, coup de daba), sans saut isolé.

## Non-régression

| Test | Résultat v1.7 |
|---|---|
| `build.cjs` | Identique à la v1.4-v1.6 : montée +60,7 m en 10 s, pose en continu, boîte, édition, clavier, Entraînement, 46 appels avec 160 pièces, barre de 4 pièces sans chevauchement |
| `support.cjs` | Identique à la v1.5 |
| `flows.cjs` ordinateur et téléphone | Tout passe (tir, armes, lunette, construction, édition, kilishi 75 PV, pause, fin, rejouer avec 0 pièce restante, retour) |
| `houses.cjs` | Identique (porte, escalier, pas de grimpe, rebord, caméra 0°, muret, 12 bots sur 12 entrent) |
| `lobbytest.cjs` ordinateur et téléphone, `fixes2.cjs`, `ddatest.cjs`, `decals.cjs`, `hud.cjs` | Tout passe ; 0 différence sur 3 000 rayons ; 10 impacts pour 10 balles |
| `cover.cjs` | 10 sur 12 puis 8 sur 10 (la v1.6.1 relancée en même temps : 12 sur 12 ; au rapport v1.6 : 11 sur 12). Le nombre d'essais et le hasard varient d'un lancement à l'autre ; la v1.7 ne touche pas à la recherche d'abri des bots. À surveiller. |
| `decor.cjs` | 0 programme GPU compilé en partie ; mêmes appels et triangles qu'en v1.6 |
| Calcul par image, 20 persos proches (Moyenne) | 3,5 à 5,4 ms (v1.6.1 : 4,7 à 5,2 ms) ; mémoire allouée ≈ 2 Ko par image dans les deux versions (profileur de tas de Chrome) |
| APK 1.7 | Signature v2 vérifiée, même certificat que la 1.0 à 1.6.1 (`3DB2BF18…`), version 1.7 (code 18), 11,8 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 75 fichiers servis, 0 introuvable, 0 erreur JavaScript, partie lancée |

---

# v1.6.1

| Vérification | Résultat |
|---|---|
| Bandeau en arrivant à Niamey, Tahoua, Tillabéri, Diffa, lac Tchad | Texte seul (nom et sous-titre), comme en v1.5 |
| Bandeau à Agadez, Kouré, Parc du W | Image de la ville, nom dans l'image |
| Fichiers introuvables pendant la partie | Aucun |
| Partie complète (`sim.cjs`) | 0 erreur, 0 NaN |
| APK 1.6.1 | Signature v2 vérifiée, même certificat (`3DB2BF18…`), version 1.6.1 (code 17), 11,8 Mo ; 9 images de ville dedans, ni la carte du pack ni les 4 images retirées ; jeu extrait de l'APK, hors ligne : 0 fichier introuvable, 0 erreur JavaScript, partie lancée |

---

# v1.6

Mêmes conditions que la v1.5 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée). Pas de test sur un vrai téléphone. Les temps de rendu en millisecondes viennent du rendu logiciel (processeur) : ils servent à comparer, pas à prédire les images par seconde d'un téléphone.

## Nouveautés (`tests/decor.cjs`, nouveau)

Coût de chaque nouveauté au même endroit (centre d'Agadez, 1280×720, temps médian de 3 images) : on retire une nouveauté à la fois.

| | Basse | Moyenne | Haute |
|---|---|---|---|
| Tout (v1.6) | 310 ms, 34 appels, 248k tri | 528 ms, 37 appels, 324k tri | 564 ms, 40 appels, 350k tri |
| Sans le ciel | 291 ms | 507 ms | 524 ms |
| Sans les arbres du pack | 297 ms | 531 ms | 571 ms |
| Sans les rochers du pack | 299 ms | 524 ms | 541 ms (315k tri) |
| Sans les animaux | 283 ms | 481 ms | 494 ms |
| Avec le sol de la v1.5 | (même sol) | 516 ms | 516 ms |
| Sans aucune nouveauté | 286 ms, 28 appels | 456 ms, 30 appels | 447 ms, 30 appels |
| Programmes GPU compilés en partie (Agadez, Ténéré, Kouré, Parc W, Ayorou, tempête) | +0 partout | +0 partout | +0 partout |

**Ce qu'on en tire**
- Basse : +8 %. Moyenne : +16 %. Haute : +26 %. Les animaux sont la nouveauté la plus chère (≈ 25 à 70 ms ici selon la qualité : 51 modèles de 4 500 à 9 600 triangles, dessinés à portée seulement).
- Premier essai du sol avec `textureGrad` : à l'endroit d'atterrissage du test `flows.cjs` (beaucoup de sol à l'écran), +133 ms en Moyenne et +223 à +287 ms en Haute. Avec le niveau de mipmap calculé une fois et `textureLod` : +65 ms en Moyenne au même endroit ; à Agadez +12 ms en Moyenne et +48 ms en Haute. Comparaison d'images (dunes du Ténéré, Niamey) : le sol est à peine plus flou au loin. Essayé aussi : sans branches (6 textures lues partout) = 2 fois plus cher ; filtrage anisotrope coupé = pas de gain.
- Aucun nouveau shader compilé en cours de partie : les matières des animaux, rochers et ciel de tempête réutilisent des programmes déjà prêts.

**Mesures sur la carte entière** (6 vues fixes : Niamey, Ténéré, Kouré, lac, Aïr, Agadez)

| | Appels de dessin | Triangles | Arrivée au menu |
|---|---|---|---|
| Basse v1.5 | 18 à 69 (Kouré 69) | 219k à 224k | — |
| Basse v1.6 | 20 à 28 | 209k à 254k | — |
| Moyenne v1.5 | 20 à 73 | 285k à 290k | 10,6 à 11,7 s |
| Moyenne v1.6 | 24 à 35 | 286k à 341k | 10,6 à 11,6 s |

Les arbres du pack (plans croisés, une espèce = un dessin) font baisser les appels en ville. L'arrivée au menu ne bouge pas : le décor du pack se charge après l'affichage du lobby (un premier essai qui chargeait les sols avant prenait 1 à 5 s de plus).

**Vérifié en images** (vues fixes avant / après, ordinateur et téléphone) : sols par zone (Ténéré ridé, Aïr rouge-brun et caillouteux, latérite des villes du sud, herbe sèche près de l'eau, terre craquelée au lac), ciel sans trait à l'horizon, ciel d'harmattan pendant la tempête, bandeau de ville avec son image (nom dans l'image, plus sur le viseur), animaux posés au sol hors des maisons, palmiers au lac, karités à Kouré, rochers de granite dans le Ténéré et l'Aïr.

**Problèmes trouvés pendant les tests**
- Rochers du pack invisibles : la sphère englobante d'un groupe de rochers était calculée quand il était encore vide, donc il était toujours jugé hors de l'écran. Corrigé (pas de test hors champ pour ces groupes).
- Aïr beige et Agadez rouge vif au premier essai des sols : les textures écrasaient la couleur des zones. Corrigé (couleur moyenne de chaque texture rapprochée de celle de la zone ; latérite seulement dans les villes du sud).
- Ciel gris au-dessus d'un horizon beige : corrigé (bas des images fondu dans la couleur du brouillard).
- `flows.cjs` sur ordinateur a dépassé une fois le délai de 30 s d'une capture (perso posé sur un toit d'Agadez, vue très chargée, sol `textureGrad`) ; repasse avec le sol actuel.

## Non-régression

| Test | Résultat v1.6 |
|---|---|
| `sim.cjs` | 3 parties complètes : 0 erreur, 0 NaN |
| `flows.cjs` ordinateur et téléphone | Tout passe (construction, édition, kilishi 75 PV, pause, fin, rejouer, retour) |
| `houses.cjs` | Identique (porte, escalier, pas de grimpe, rebord en sautant, caméra 0°, muret, 12 bots sur 12 entrent) |
| `support.cjs` | Identique à la v1.5 (mur au bout de la 5e rampe, montée +56 m dans les deux ordres, effondrement, saut tolérant, pièce refusée dans le vide) |
| `build.cjs` | Identique : montée +60,7 m en 10 s, pose en continu, boîte, édition, Entraînement, 46 appels avec 160 pièces |
| `lobbytest.cjs` ordinateur et téléphone, `fixes2.cjs`, `ddatest.cjs`, `decals.cjs`, `hud.cjs` | Tout passe ; 0 différence sur 3 000 rayons ; 10 impacts pour 10 balles |
| `cover.cjs` | 11 bots sur 12 se mettent à couvert et y restent (v1.5 : 10 sur 11) |
| `animtest.cjs` (Boss) | 14 situations, aucun NaN, quaternions normés |
| APK 1.6 | Signature v2 vérifiée, même certificat que la 1.0 à 1.5 (`3DB2BF18…`), version 1.6 (code 16), 12,2 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 78 fichiers servis, 0 introuvable, 0 erreur JavaScript, partie lancée |

---

# v1.5

Mêmes conditions que la v1.4 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée). Pas de test sur un vrai téléphone.

## Nouveautés (`tests/support.cjs`, nouveau)

| Vérification | v1.4 | v1.5 |
|---|---|---|
| 5 rampes, on monte jusqu'à la dernière (moitié haute), puis MUR | mur une case trop loin et 4 m trop haut, **dans le vide** | mur au bout de la rampe, au-dessus de son bord, il tient |
| Même chose, moitié basse de la dernière rampe | mur une case trop loin, dans le vide | mur au bout de la rampe, sous son bord, il tient |
| Montée en 9 s, RAMPE puis MUR | marchait déjà (+62 m en 10 s, autre mesure) | +56 m, 16 rampes, 14 murs, 0 mur dans le vide |
| Montée en 9 s, MUR puis RAMPE | marchait déjà (+62 m en 10 s, autre mesure) | +56 m, 16 rampes, 15 murs, 0 mur dans le vide |
| Effondrement : tour de 20 pièces, on détruit les 4 du bas | (pas d'effondrement) | 16 pièces debout, puis 2 après 1 s, 0 après 2 s ; la maison de 4 murs posée à côté reste debout (4 / 4) |
| Saut 0,07 s après avoir quitté le haut d'une rampe | ne saute pas | saute |
| Appui de saut 0,1 s avant de toucher le sol (chute de 3 m) | ne saute pas | saute à la réception |
| Mur demandé en plein air à 14 m du sol | posé | refusé : « RIEN POUR LA TENIR » |

**Autres vérifications**
- Pas chassés à droite et à gauche, marche arrière et diagonale avec le perso face à la caméra : captures, jambes orientées vers la marche, buste face à la visée.
- Banc d'animation (`animtest.cjs`, Boss et Guerrière) avec le perso toujours face à la caméra : 14 situations, aucun NaN, quaternions normés, buste ≤ 18° par image, bras ≤ 38°. La rotation cumulée du bassin monte à 73° (changements de direction) et 90° (pas chassés) : ce sont les jambes qui se tournent vers la marche, c'est voulu.

**Problème trouvé pendant les tests**
- `tests/build.cjs` : l'essai « pose en continu » partait d'une position relative à l'essai précédent et tombait contre une maison (perso bloqué, 1 rampe). Chaque essai part maintenant d'un endroit dégagé, au milieu d'une case. Résultats ensuite identiques à la v1.4.

## Non-régression

| Test | Résultat v1.5 |
|---|---|
| `build.cjs` | Identique à la v1.4 : montée +60,7 m en 10 s, pose en continu, boîte, édition au relâchement, réglages, clavier, Entraînement, 42 appels de dessin avec 160 pièces |
| `sim.cjs` | 3 parties complètes (fin à 300, 308 et 308 s) : 0 erreur, 0 NaN (les bots posent leurs murs avec la nouvelle règle de tenue) |
| `flows.cjs` ordinateur et téléphone | Tout passe (construction 4 pièces, édition, kilishi 75 PV, pause, fin, rejouer, retour) |
| `houses.cjs` | Identique (porte, escalier, pas de grimpe, rebord en sautant, caméra 0°, muret, 12 bots sur 12 entrent) |
| `lobbytest.cjs`, `fixes2.cjs`, `ddatest.cjs`, `decals.cjs`, `hud.cjs` | Tout passe ; 0 différence sur 3 000 rayons ; 10 impacts pour 10 balles |
| `cover.cjs` | 10 bots sur 11 se cachent |
| APK 1.5 | Signature v2 vérifiée, même certificat que la 1.0 à 1.4 (`3DB2BF18…`), version 1.5 (code 15), 4,4 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 37 fichiers servis, 0 introuvable, 0 erreur JavaScript, partie lancée |

---

# v1.4

Mêmes conditions que la v1.3 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée). Le nouveau test simule un Pixel 7 en paysage et appuie sur les vrais boutons tactiles. Pas de test sur un vrai téléphone.

## Construction en solo (`tests/build.cjs`, nouveau)

| Vérification | Résultat |
|---|---|
| Barre de pièces | Visible au sol, 4 boutons, dans l'écran, ne chevauche aucun autre bouton |
| Un appui sur MUR | Passe en construction et pose 1 mur |
| Montée mur + rampe en courant (appuis alternés, 10 s) | +4,1 / +10,4 / +16,7 / … / **+60,7 m**, 0 seconde sans monter, 16 rampes et 16 murs |
| Même montée sur la **v1.3** (mode construction, POSER gardé, rampe et mur en alternance) | **+0,2 m en 10 s** : bloqué par le mur posé devant la rampe. Même schéma sur la v1.4 : +58 m |
| Doigt gardé sur RAMPE en avançant 3 s | 7 rampes, +15,9 m ; la pose s'arrête quand on relâche |
| Puis doigt gardé sur SOL 2 s | 4 sols : le perso finit sa rampe puis avance sur un pont à hauteur constante (+22,8 m) |
| Boîte autour de soi (un appui MUR par direction + TOIT) | 4 murs sur les 4 côtés de sa case, toit au-dessus |
| Édition (ÉDITER, CASE gardé, relâché) | Ouverte, validée au relâchement, une case retirée, retour en construction |
| « Poser au toucher » désactivé | L'appui choisit la pièce et passe en construction, 0 pièce posée |
| Clavier | V : construction + rampe ; Q : mur |
| Entraînement | Banco affiché ∞ ; « Effacer mes constructions » visible dans le menu pause : 49 pièces → 0 |
| Appels de dessin (même vue, Basse) | 34 sans pièce, **40 avec 160 pièces terminées** |
| Invite de rebord | Ne chevauche plus les barres de vie |

**Autres mesures**
- Appels de dessin, autre vue (tour de pièces devant le joueur, Basse) : 98 sans pièce ; 160 pièces : **339 avant** les instances, **99 après** ; 235 pièces : 99.
- Programmes GPU créés en partie à la première pose (pièces transparentes) puis quand les pièces passent en instances : 0 (après la préparation GPU de l'écran de transition).

**Problèmes trouvés et corrigés pendant les tests**
- **Premier mur refusé à l'Entraînement** : le joueur apparaissait sur un coin de case, pile sur la ligne du mur. Départ déplacé au milieu d'une case, et un mur qui tomberait dans le perso passe à la ligne suivante.
- **Test de pose en continu sur SOL** : au ras du sol, les sols tombent sous le sable (grille de 4 m) et sont refusés, comme avant. Le test pose donc d'abord des rampes, puis un pont de sols en hauteur.
- **ÉDITER ne trouvait pas un mur vu en biais** (« VISE TON MUR OU TON SOL ») : relevé par `flows.cjs` selon l'endroit d'atterrissage. Corrigé (la pièce la plus proche devant, même de biais).
- **Shaders des pièces préparés puis supprimés** : la préparation GPU libérait ses matières de test, ce qui effaçait aussi les shaders (5 programmes recompilés à la première pose). Corrigé.
- `flows.cjs` : l'étape d'édition posait un mur face à une éventuelle rampe ; avec la v1.4 ce mur va au bout de la rampe, hors de portée. Le test revient face au premier mur.

## Non-régression

| Test | Résultat v1.4 |
|---|---|
| `sim.cjs` | 3 parties complètes (fin à 302, 309 et 249 s) : 0 erreur, 0 NaN |
| `flows.cjs` ordinateur et téléphone | Tout passe : tir, lunette, construction (3 ou 4 pièces selon l'atterrissage), édition, kilishi (75 PV), pause, fin, rejouer, retour. Sur ordinateur, une capture a dépassé 30 s quand trois tests tournaient en même temps ; relancé seul : passe |
| `houses.cjs` | Identique à la v1.3 (porte, escalier, pas de grimpe, rebord en sautant, caméra 0°, muret, 12 bots sur 12 entrent) |
| `animtest.cjs` Boss | 14 situations, aucun NaN, quaternions normés ; rotation cumulée de −19° à +42° ; buste ≤ 18° par image ; bras ≤ 36° |
| `lobbytest.cjs` ordinateur | Tout passe |
| `fixes2.cjs`, `ddatest.cjs`, `decals.cjs` | TOP 1 à 100 PV ; 0 différence sur 3 000 rayons ; 10 impacts pour 10 balles |
| `hud.cjs` | Ordinateur et téléphone : aucune erreur ; barre de pièces en haut à droite |
| `cover.cjs` | 8 bots sur 10 se cachent (11/12 et 9/10 en v1.3 : même variation d'un lancement à l'autre) |
| APK 1.4 | Signature v2 vérifiée, même certificat que la 1.0 à 1.3 (`3DB2BF18…`), version 1.4 (code 14), 4,4 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 37 fichiers servis, 0 introuvable, 0 erreur JavaScript, partie lancée |

---

# v1.3

Mêmes conditions que la v1.2 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée pour les tests image par image). Pas de test sur un vrai téléphone.

## Nouveautés

| Test | Résultat v1.3 |
|---|---|
| `houses.cjs` 1 : porte | Fermée au départ, elle bloque le joueur ; ouverte avec E (`interact`), le joueur entre (sol 2,72 m) |
| `houses.cjs` 3 : mur de maison | Mur de 5,9 m : le perso ne grimpe plus, il reste au sol |
| `houses.cjs` 3c : se hisser en sautant | Rebord à 2,53 m au-dessus du sol : saisi en sautant, le perso finit dessus |
| `houses.cjs` 3d : caméra | Caméra tournée de 92° à l'arrêt : le perso s'aligne, écart restant après 1 s : 0° |
| `houses.cjs` 4 : muret | Franchi (sol 1,2 m → haut du muret 2,3 m) |
| `houses.cjs` 5 : bots et portes | 12 bots sur 12 ouvrent la porte et entrent (3,7 à 5,3 s, départ derrière la maison) |
| `cover.cjs` (nouveau) | Bot qui recharge (4 s) face au joueur à 14 m, à 3 m d'un muret, vu du joueur au départ. Deux lancements : **11 sur 12**, puis **9 sur 10** après les dernières retouches (le nombre d'essais varie : un essai ne compte que si le joueur voit le bot au départ). Premier lancement : 11 sur 12 se cachent (après 0,1 à 1,7 s) et restent cachés au moins 60 % du temps restant (10 d'entre eux : 100 %). Le 12e n'a pas trouvé d'abri à portée et reste à découvert. Abris choisis : 6 hauts, 4 bas (accroupi) ; un bot sans abri choisi s'est retrouvé caché en se déplaçant |
| Préparation GPU | Programmes GPU compilés à la première sortie de chacune des 6 armes (fusil, pompe, sniper, mitraillette, mitrailleuse, daba) : 0 (107 après le lobby, 124 en partie, tous créés avant) |
| Appels de dessin, Basse | Même endroit (Agadez), 10 bots de 8 à 110 m, 4 directions : 75, 86, 80 et 105 appels (166 à 323 mesurés au même endroit avant les changements) |

**Problèmes trouvés et corrigés pendant les tests**
- **Abris ignorés** : au premier essai, 4 bots sur 10 seulement se cachaient. En cherchant pourquoi : `findCover` parcourait la liste renvoyée par la grille de collisions, et les tests de place et de chemin appelés dans la boucle réécrivaient cette même liste. Corrigé (copie de la liste) : 7 sur 11.
- **Bots accroupis comptés comme visibles** : la ligne de vue visait 1,2 m même sur un perso accroupi (sa tête). Elle vise maintenant le torse : 8 sur 10.
- **Bots coincés au coin d'un enclos** : le chemin vérifié était la ligne droite, alors que le bot contourne l'obstacle par un coin. Le chemin réel est vérifié, et un bot qui ne se rapproche plus pendant 1 s change d'abri : 11 sur 11, puis 11 sur 12 avec le test plus strict (rester caché).
- **Mesure des à-coups** : chronométrer le rendu image par image ne marche pas en rendu logiciel. Après environ 65 images, chaque image passe de 3 ms à 430 ms, avec n'importe quelle arme et même sans changer d'arme. C'est le rendu logiciel qui rattrape son retard, pas le jeu. La vérification se fait donc en comptant les shaders compilés (ligne « Préparation GPU »).

## Non-régression

| Test | Résultat v1.3 |
|---|---|
| `animtest.cjs` Boss | 14 situations, aucun NaN, quaternions normés ; rotation cumulée de la poitrine de −15° à +25° ; buste ≤ 18° par image ; bras ≤ 37° |
| `animtest.cjs` Guerrière | Rotation cumulée de −10° à +42° (42° = coups de daba) ; buste ≤ 20° par image ; bras ≤ 39° ; aucun NaN |
| `sim.cjs` | 3 parties complètes : 0 erreur, 0 NaN, fin à 216 s pour la dernière (1 survivant) |
| `flows.cjs` ordinateur et téléphone | Tir, lunette, construction (3 pièces), édition, kilishi (75 PV), pause, fin de partie, rejouer, retour : tout passe. Sur ordinateur, une capture a dépassé 30 s quand trois tests tournaient en même temps ; relancé seul : passe |
| `lobbytest.cjs` ordinateur | Tout passe (persos, pseudo, mode refusé, partie, +118 XP / +11 cauris, entraînement, quitter) |
| `fixes2.cjs` | TOP 1 : 100 PV avant et après |
| `ddatest.cjs` | 3 000 rayons, 0 différence (2 523 boîtes, portes et parapets compris) |
| `decals.cjs` | 10 impacts pour 10 balles, lumière du coup de feu active en Moyenne |
| `housestats.cjs` | 100 maisons ouvertes (23 à étage), hauteur sous plafond ≥ 3,65 m, marche la plus haute 0,51 m |
| `reloads.cjs` | Planches de rechargement refaites ; pompe : cartouches une par une, tir qui interrompt le rechargement |
| `hud.cjs` | Ordinateur et téléphone : aucune erreur |
| `probe.cjs` | Lobby : images de 2 à 5 ms. Lancement : une image longue pendant l'écran de transition (création de la partie et préparation GPU), puis 2 à 138 ms en rendu logiciel |
| `profiles.cjs` | Basse 61 appels, Moyenne 145, Haute 162 à l'endroit d'atterrissage de ce lancement (mesure variable d'un lancement à l'autre, voir v1.2) |
| APK 1.3 | Signature v2 vérifiée, même certificat que la 1.0 et la 1.2 (`3DB2BF18…`), version 1.3 (code 13), 4,4 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 37 fichiers servis, 0 introuvable, 0 erreur JavaScript, lobby « v1.3 » puis partie lancée |

---

# v1.2

Mêmes conditions que la v1.1 (Chromium sans écran, rendu logiciel SwiftShader, réseau externe coupé, boucle figée pour les tests image par image). Pas de test sur un vrai téléphone.

| Test | Résultat v1.2 |
|---|---|
| `animtest.cjs` Boss | 14 situations, aucune dérive ni NaN ; rotation cumulée de la poitrine de −13° à +46° (46° = coups de daba : amplitude du geste, la poitrine reste entre −21° et +46°) ; buste ≤ 20° par image ; bras ≤ 36° |
| `animtest.cjs` Guerrière | Rotation cumulée de −9° à +36° ; buste ≤ 18° par image ; bras ≤ 39° ; aucun NaN |
| `sim.cjs` | 3 parties (fin à 287 s pour la dernière) puis 1 partie après les dernières corrections : 0 erreur, fin à 307 s avec 1 survivant |
| `flows.cjs` ordinateur et téléphone | Tir, rechargement, lunette, construction, édition, kilishi (75 PV), pause, fin de partie, rejouer, retour : tout passe |
| `lobbytest.cjs` ordinateur et téléphone | Tout passe (persos, pseudo, mode refusé, partie, récompenses +118 XP / +11 cauris, entraînement avec les 5 nouvelles armes, quitter) ; après correction, 0 alerte de texture |
| `fixes2.cjs` | TOP 1 : 100 PV avant et après |
| `ddatest.cjs` | 3 000 rayons, 0 différence (2 023 boîtes) |
| `decals.cjs` | Test corrigé : il visait un mur à 120 m (plus de mur à 6 m à cet endroit depuis l'agrandissement de la carte, résultat dépendant de la dispersion) ; il vise maintenant le mur du fond d'une maison à 6 m : 10 impacts pour 10 balles |
| `houses.cjs`, `housestats.cjs` | Identiques à la v1.1 (100 maisons, 23 à étage, 12 bots sur 12 entrent par la porte, escalade et rétablissement) |
| `reloads.cjs` + `hud.cjs` | Nouvelles armes en main, rechargements, vrais chargeurs, caisse de munitions qui tombe, silhouettes des armes dans le HUD |
| `tests/armes.html` | Calage des 6 armes : poignée, garde-main, chargeur, culasse au bon endroit, canons horizontaux |
| Persos (captures face, tête, dos, course) | Touareg, Garde, Commerçante animés et armés ; motif wax photo sur la Commerçante |
| APK 1.2 | Signature v2 vérifiée, même certificat que la 1.0 et la 1.1 (`3DB2BF18…`), version 1.2 (code 12), 4,4 Mo ; jeu extrait de l'APK et servi comme dans l'application, hors ligne : 37 fichiers servis, 0 introuvable, 0 erreur JavaScript |

**Problèmes trouvés et corrigés pendant les tests**
- **Textures photo pas toujours appliquées** (alerte « Offset overflows texture dimensions ») : quand le dessin de 256 px était déjà envoyé à la carte graphique, l'image de 512 px ne pouvait pas le remplacer. Correction : la texture est libérée côté GPU avant le remplacement. Effet visible : la Commerçante porte maintenant le vrai motif wax.
- **Appels de dessin des persos** : chaque pièce d'accessoire était un objet séparé (jusqu'à 7 pour le Touareg). Elles sont fusionnées par matière : Touareg 8 objets (Boss 9), Garde 9, Commerçante 7 (Guerrière 8), compte fait d'après le code.
- **Mesure des profils graphiques** : `profiles.cjs` donne des totaux très variables d'un lancement à l'autre (de 100 à 364 appels en Basse selon l'endroit où atterrit le joueur), même pour la v1.1 : il ne permet pas de comparer deux versions. La comparaison fiable reste celle du décor à vue fixe (v1.1 : mêmes appels qu'en v1.0, +10 % de triangles) ; la v1.2 ne change pas la géométrie du décor, seulement ses textures.

---

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
| Pseudo conservé | « Testeur » dans le profil et dans le stockage local |
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
