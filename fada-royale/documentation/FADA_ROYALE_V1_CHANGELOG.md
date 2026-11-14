# Fada Royale — Journal des modifications v1.0

Base : v0.9.1 (commit `23c9f46`). Étapes livrées dans l'ordre demandé, chacune dans son propre commit :
`11f3fea` animations · `047f13a` lobby · `47571fe` carte, décors, profils graphiques, combat, IA.
Les mesures citées viennent des tests de `tests/` (détail dans `FADA_ROYALE_V1_TEST_REPORT.md`).

---

## 1. Animations : le buste ne tourne plus à 360° en courant

| | |
|---|---|
| **Problème** | En courant (surtout en pas chassé, en cercle, caméra qui tourne, en visant ou en tirant), le haut du corps tournait sur lui-même en boucle. Bras tordus en glissade et en saut. |
| **Cause** | three.js (`PropertyMixer.apply`) ne réécrit un os que si le résultat de l'animation a changé depuis l'image précédente. L'os `Spine` est immobile dans les 17 clips des deux persos : il n'était jamais réécrit, et la contre-rotation du buste (`addRot`) s'additionnait à chaque image. Même mécanisme pour l'IK des bras quand `Arm` ou les épaules sont immobiles (glissade, saut). Détail et mesures : `FADA_ROYALE_V1_AUDIT.md`. |
| **Fichier** | `index.html` : `mixPose()`, `ikArmW()`, `animRealAnim()`, `newAnState()` |
| **Correction** | Pose animée mémorisée après `mixer.update` et remise dans les os avant le suivant : chaque image repart de la pose animée. Poids de l'IK en fondu (arme ↔ daba, soins, construction) et cibles des mains en fondu au changement d'arme. Stabilisation du balancement du buste arme en main. Fondu d'entrée des gestes daba et coup reçu. Aucune retouche désactivée. |
| **Test** | Banc `tests/animtest.cjs` : 14 situations × 2 persos. |
| **Résultat** | Rotation cumulée de la poitrine : jusqu'à 2 625° avant → 42° au pire après (amplitude normale du mouvement, sans dérive). Saut du buste : 154° → 16° par image au pire. Saut des bras : 141° → 32°. Balancement du buste arme en main : ±36° → ±12°. |
| **Reste** | Changement d'arme : saut de bras de ~30° quand la nouvelle arme apparaît (transition voulue, plus brutal qu'un vrai jeu). Pas d'animation de victoire (aucun clip disponible). |

## 2. Lobby 3D

| | |
|---|---|
| **Problème** | L'accueil était un panneau HTML au-dessus du monde filmé de loin : pas de perso en vedette, pas de profil, pas de modes. |
| **Fichiers** | `src/lobby/lobby.js`, `src/lobby/lobby.css` (nouveaux), `src/core/profile.js` (nouveau), `index.html` (intégration, mode Entraînement, enregistrement des parties) |
| **Correction** | Scène dédiée (estrade en terre cuite cerclée d'or et de néon cyan, murs de banco décorés, minaret d'Agadez, auvent en wax, palmiers, poussière, rayons de lumière, éclairage clé chaude + contre-jour cyan). Perso choisi au centre, animation d'attente + geste du thé, rotation au doigt, zoom. Menus : Accueil, Personnages, Boutique (Personnages, Tenues, Planeurs, Cadres, aperçu des Armes), Missions (jour/semaine), Événements, Profil. Panneau des modes : **Battle Royale** et **Entraînement** jouables, Duo / Escouade / En ligne marqués « En développement ». Un seul renderer, modèles déjà chargés réutilisés (cache de 6 présentations). |
| **Données** | Profil local (`fr_profile`) : pseudo, perso, tenues, planeur, cadre, statistiques réelles des parties de Battle Royale terminées, XP / niveau, cauris (monnaie de jeu gagnée en jouant, aucun achat réel), missions. Reprise automatique du pseudo et du perso de la v0.9. |
| **Test** | `tests/lobbytest.cjs` sur ordinateur, iPhone paysage, Pixel portrait. |
| **Résultat** | Navigation complète, perso et pseudo enregistrés, mode indisponible refusé avec message, partie lancée avec le bon perso, récompenses calculées à partir des vraies stats (+118 XP = 40 + 2 élims × 30 + 180 dégâts / 10), retour au lobby, entraînement, quitter sans compter la partie. |
| **Reste** | Pas d'animation de victoire, pas d'événements réels (affiché honnêtement), apparences d'armes non disponibles. Les stats repartent de zéro (rien n'était enregistré avant). |

## 3. Mode Entraînement

| | |
|---|---|
| **Fichier** | `index.html` : `setupTraining()`, `spawnDummy()`, `updateTraining()`, `killChar()`, `updateBot()` |
| **Correction** | 5 armes, banco et munitions illimités, 8 mannequins qui se relèvent après 3 s, pas de tempête ni de taxi-brousse, pas de stats enregistrées. |
| **Test / résultat** | `lobbytest.cjs` : mode `train`, 5 armes, 500 banco, 8 mannequins, tempête désactivée. |

## 4. Tenues des bots

| | |
|---|---|
| **Problème** | Les variantes de bots teintaient tout le corps de la Guerrière, peau comprise (peaux bleutées ou rosées). |
| **Correction** | `applyOutfit()` ne recolore que le haut et le bas (`Outfit_Top/Bottom`, `Tops/Bottoms`). Les mêmes couleurs servent de tenues au joueur (boutique). |

## 5. Carte agrandie et nouveaux lieux

| | |
|---|---|
| **Fichier** | `index.html` : `MAP`, `CITIES`, `terrainH`, `groundColor`, `zoneAt`, génération du monde, minicarte, tempête, taxi-brousse |
| **Correction** | 480 m de côté (360 m avant, +78 % de surface). Aïr en crête au nord d'Agadez (au lieu d'un mur jusqu'au bord). Lac Tchad. 6 nouveaux lieux : **Arlit** (mine d'uranium : fosse, chevalement, hangars, convoyeur, panneaux solaires, pylônes néon), **Ayorou** (marché au bord du fleuve, pirogues), **Tahoua** (château d'eau), **Diffa** (lac, pirogues), **Parc du W** (baobabs, mirador), **Tillabéri** (au bout du pont Kennedy). Tempête (rayon de départ 360 m, cercles plus grands), taxi-brousse (30 s), points d'atterrissage des bots et minicarte adaptés. |
| **Test / résultat** | 5 parties simulées sans erreur ; elles durent de 3 min 43 à 5 min 09 (≈ 3 à 5 min avant). Vues aériennes de chaque lieu vérifiées. |
| **Reste** | La fosse d'Arlit n'a que 3 m de profondeur (plus profonde, elle passait sous le niveau de l'eau du jeu). |

## 6. Maisons, monuments et végétation

| | |
|---|---|
| **Correction** | Grande Mosquée d'Agadez (minaret de 22 m hérissé de torons, salle de prière accessible par un escalier). Maisons : escaliers extérieurs jusqu'au toit (≈ 40 % des maisons basses), volets colorés, canaris, auvents en wax ; murets d'abri dans les villes. Correction d'un bug v0.9 : les fenêtres pouvaient recouvrir la porte. Végétation : acacias à deux étages, baobabs (tronc en bouteille), palmiers doum le long de l'eau, 460 buissons. |
| **Test / résultat** | Vues aériennes et au sol ; parties simulées (les bots et le joueur circulent, aucune erreur). |

## 7. Profils graphiques Basse / Moyenne / Haute

| | |
|---|---|
| **Fichier** | `index.html` : `QP`, `applyQuality()`, `setQuality()`, onglet Graphismes |
| **Correction** | Chaque profil change réellement : résolution max (×1 / ×1,5 / ×2), ombres (aucune / 1024 / 2048 douces), distance de vue (230 / 300 / 400 m), animation des bots lointains, distance d'affichage des persos, particules, faisceaux de butin, lumière de tir, impacts, et niveaux de détail : armes simplifiées et sans cheveux/cils/masque pour les bots lointains, arme au sol sans modèle 3D au loin, buissons et second étage des acacias masqués en Basse, terrain moins dense en Basse. Armes simplifiées fusionnées en une seule pièce (un seul appel de dessin). |
| **Test / résultat** | Triangles « autres » (surtout les armes) en Basse : 154 k → 44 k ; terrain 72 k → 45 k. Voir le rapport de tests. |
| **Reste** | L'anticrénelage ne change pas en cours de jeu (fixé au démarrage : désactivé sur téléphone). **Non mesuré sur un vrai téléphone Android.** |

## 8. Collisions et zones de touche

| | |
|---|---|
| **Correction** | Les rayons (balles, vue des bots, caméra) parcourent la grille de collisions au lieu de tester les 1 022 boîtes. La tête a sa propre zone de touche (en v0.9 les 38 cm du haut sur toute la largeur comptaient comme la tête, épaules comprises). |
| **Test / résultat** | `tests/ddatest.cjs` : 0 différence sur 3 000 rayons. |

## 9. Sensations de tir

| | |
|---|---|
| **Correction** | Lumière du coup de feu (Moyenne/Haute), éclair à taille et rotation variables, douilles éjectées (rouges pour le pompe), impacts sur les murs (pool limité par profil), bruit d'impact. |
| **Test / résultat** | `tests/decals.cjs` : impacts créés sur les murs touchés, lumière présente et active en Moyenne. |

## 10. IA

| | |
|---|---|
| **Correction** | Les bots se soignent aussi quand leur adversaire ne les voit plus (derrière un mur, souvent celui qu'ils viennent de construire), pas seulement sans cible. |
| **Reste** | Le reste de l'IA est inchangé (pas de vraie utilisation des rampes, pas de niveaux de difficulté). |

## 11. Saccades au lobby et au lancement

| | |
|---|---|
| **Problème** | Mesuré : une image de plusieurs secondes (rendu logiciel des tests) à l'arrivée dans le lobby et au lancement. |
| **Cause** | Compilation des shaders à la première apparition d'un objet ; encodage du portrait (`toDataURL`) puis lecture synchrone des pixels du GPU. |
| **Correction** | Shaders du lobby (et de sa variante portrait) et du monde compilés derrière l'écran de chargement / de transition ; premier portrait pris derrière l'écran de chargement, dans une cible 160×160, encodage asynchrone (`toBlob`). |
| **Résultat** | Lobby : plus aucune image longue une fois affiché (2 à 6 ms). |
| **Reste** | Une courte saccade possible quand on change de perso dans le lobby (nouveau portrait). |
