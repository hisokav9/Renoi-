# Fada Royale — Journal des modifications

# v1.2

Base : v1.1 (APK 1.1). Matière fournie : 7 armes, 6 pièces détachables, kilishi, verre de thé, théière, matériau banco, 3 persos « 2.5D », 5 images (illustration, rue de village, motif wax, sable, enduit). Demande : « les personnages sont pas terribles, est-ce que tu peux arranger ça ».

## 1. Nouvelles armes (fin du problème de licence)

| | |
|---|---|
| **Problème** | MP5 et fusil à pompe sous licence CC BY-NC (pas d'usage commercial) ; sniper et Minimi sans auteur crédité. |
| **Fichiers** | `src/core/weapons.js` (nouveau), `assets/armes/*.glb` (nouveaux), `index.html` : `loadAssets()`, `prepWeapon()`, `ensureWeapon()`, `muzzle()`, `propObj()`, `dropDebris()`, `showProp()`, crédits ; `tests/armes.html` (nouveau) ; anciens `assets/w_fusil.js`, `w_mitraillette.js`, `w_pompe.js`, `w_sniper.js`, `w_mitrailleuse.js` supprimés |
| **Correction** | Fusil d'assaut, mitraillette, fusil à pompe, sniper, mitrailleuse et daba remplacés par les modèles créés pour le jeu. Ce sont des extrusions arrondies des images : leur boîte englobante correspond au cadre de l'image, donc chaque arme est décrite en % de son image : côté du canon, axe du canon (remis à l’horizontale pour les images de trois quarts : environ 6° pour la mitraillette, 12° pour la mitrailleuse), poignée placée au point de prise commun du jeu, points d'appui des mains (garde-main, chargeur, levier d'armement, culasse, capot, fenêtre de chargement). Les rechargements de la v1.1 utilisent ces points sans changement. Les **vrais chargeurs** (AK, mitraillette, sniper) et la **caisse de munitions** de la mitrailleuse sont tenus en main et tombent au sol. Bouche du canon à la bonne hauteur pour les traçantes. Les silhouettes du HUD se refont seules à partir des nouveaux modèles. |
| **Réglage** | Les textures viennent d'images déjà éclairées : reflet d'environnement réduit (0,25), rugosité 0,85, couleur ×0,8, sinon les armes paraissaient délavées. |
| **Test** | `tests/armes.html` (page de calibrage : ancien modèle en fil de fer, points d'appui en couleur), `reloads.cjs` (planches de rechargement), `hud.cjs`. |
| **Reste** | Revolver : l'image avait le barillet ouvert, le modèle 3D aussi ; on garde l'ancien revolver (auteur à créditer) en attendant une image fermée. Mitrailleuse : bipied déployé (comme sur l'image). Pompe : image en perspective, canon et magasin un peu écartés de profil. |

## 2. Objets, textures, illustration

| | |
|---|---|
| **Fichiers** | `assets/objets/` (kilishi, verre de thé, théière), `assets/textures/` (sol_detail, banco, banco_normal, enduit, wax), `assets/images/chargement.jpg`, `index.html` : `swapTexImage()`, terrain, `PROP_OBJ`, écran de chargement ; `src/lobby/lobby.js` (service à thé) |
| **Correction** | Kilishi et verre de thé 3D dans la main pendant les soins. Sol : texture de détail (sable, cailloux, herbe sèche) répétée tous les 6 m, multipliée par les couleurs de zone, luminosité moyenne compensée. Murs en banco : texture photo + relief (normal map) en Moyenne et Haute. Maisons enduites (Niamey…) : texture d'enduit. Motif wax : remplace le premier motif (parapentes, nattes, auvents, lobby). Lobby : théière et verres sur un tabouret au bord de l'estrade. Écran de chargement : ton illustration (taxi-brousse, parapentes en wax, Agadez). Les textures se chargent en arrière-plan et remplacent l'image des textures dessinées par le code (mêmes objets, donc tous les matériaux suivent). |
| **Pas utilisé** | L'image de la rue de village (fond possible pour une page de magasin ou un écran de fin plus tard) et le mur de test banco (remplacé par la texture sur les vrais murs). |

## 3. Personnages

| | |
|---|---|
| **Constat** | Les 3 persos reçus (garde, Touareg, femme) sont des modèles 2.5D : très beaux de face, mais 22 cm d'épaisseur (une planche vue de profil) et un dos fait de taches de couleur. En vue à la troisième personne on voit surtout le dos de son perso : ils ne sont pas utilisables tels quels. Leur squelette de 17 os n'a pas non plus les os des animations du jeu (épaules, colonne en trois parties). |
| **Fichier** | `index.html` : `SKINS`, `applyCostume()` (nouveau), `buildRealChar()`, `makeModel()`, `buildDisplay()` ; `src/lobby/lobby.js` (pas de recoloration de tenue sur ces persos) |
| **Correction** | Les trois persos sont construits sur les corps 3D animés du jeu, avec costume et accessoires accrochés aux os (ils suivent toutes les animations, armes, rechargements, escalade) : **Le Touareg** (corps du Boss : chèche indigo, turban et voile qui laisse les yeux, tunique bleu ciel, pantalon indigo, peau plus foncée), **Le Garde du W** (nouveau : chapeau de brousse, tenue kaki et olive, jumelles), **La Commerçante** (corps de la Guerrière : foulard noué et tenue en wax avec ton motif). Ils remplacent les anciennes versions en blocs (gardées en secours si les modèles 3D ne se chargent pas) et apparaissent aussi chez les bots. |
| **Reste** | Ce sont des costumes sur deux corps : même silhouette que le Boss ou la Guerrière. Pour des persos exactement comme tes images, il faut de vrais modèles 3D complets avec squelette (voir `PROMPTS_ASSETS.md`) ; le code d'animation devra alors être adapté à leur squelette. |

---

# v1.1

Base : v1.0 (commit `63be089`, APK 1.0). Demande : HUD et boutons refaits sans emoji, parapente qui s'ouvrait de travers, déplacements bizarres à gauche et à droite, maisons dans lesquelles on entre avec du butin, escalade, prise des armes à une ou deux mains, animation propre pour le rechargement de chaque arme, le changement d'arme, le kilishi et le thé.
Mesures : scripts de `tests/` (nouveaux : `houses.cjs`, `housestats.cjs`, `reloads.cjs`, `hud.cjs`), détail dans `FADA_ROYALE_V1_TEST_REPORT.md`.

## 1. Parapente

| | |
|---|---|
| **Problème** | La voile s'ouvrait sur le côté droit du personnage, à la verticale. |
| **Cause** | La voile (un morceau de cylindre) était tournée sur deux axes (`rotation.z = π/2` puis `rotation.y = π/2`) : l'arc finissait sur le côté. |
| **Fichier** | `index.html` : `makeGlider()`, `updateGlider()`, `applyGlider()`, `updateAir()`, `buildChar()`, `buildRealChar()` |
| **Correction** | Nouvelle voile : arc de 2,35 m de rayon au-dessus de la tête (rotation sur un seul axe), dessous plus sombre, 7 nervures, suspentes partant des épaules. Ouverture animée (la voile se déploie avec un léger rebond), inclinaison dans les virages selon la vitesse latérale, mains sur les commandes. Les tissus wax de la boutique s'appliquent toujours. |
| **Test** | Captures de face, de dos et de côté pendant la descente. |

## 2. Déplacements à gauche et à droite

| | |
|---|---|
| **Problème** | En allant à gauche ou à droite, le personnage marchait en crabe (pas chassés) avec les jambes tordues. |
| **Cause** | Le corps faisait toujours face à la caméra : aller sur le côté = pas chassés permanents, même hors combat. |
| **Fichier** | `index.html` : `updatePlayer()`, `animRealAnim()` (orientation des jambes) |
| **Correction** | Hors combat, le personnage se tourne vers où il va (virage progressif, plus doux en sprint). En combat (tir, visée, construction, édition, et 1,2 s après), il fait face à la visée et se déplace en pas chassés ; au premier tir il se tourne aussitôt vers la cible. Rotation des jambes limitée. |

## 3. Prise des armes (une ou deux mains)

| | |
|---|---|
| **Fichier** | `index.html` : tables `GRIP`, `ANCH`, `BODY` ; `animRealAnim()`, `anchorLocal()` |
| **Correction** | Armes longues (fusil, mitraillette, pompe, sniper, Minimi) : toujours à deux mains, main gauche sur le garde-main. Revolver : à une main, canon vers le bas, hors combat ; à deux mains pour viser et tirer. Chaque main vise un point précis de l'arme (poignée, garde-main, chargeur, culasse, barillet…) défini dans le repère de l'arme, donc juste quel que soit le modèle 3D. |

## 4. Rechargement propre à chaque arme, culasse, pompe, changement d'arme

| | |
|---|---|
| **Fichier** | `index.html` : `RELOAD`, `BOLT`, `PUMP`, `sampleChoreo()`, `shellsSample()`, `startReload()`, `updateTimers()`, `beginSwitch()`, `choreoEvent()`, `propMesh()`, `dropDebris()`, `sfxMech()`, `playerFire()`, `botShoot()` |
| **Correction** | Chorégraphies image par image (pose de l'arme + trajet de chaque main + objets + sons) : **fusil d'assaut** (chargeur qui tombe, main à la ceinture, nouveau chargeur, claque, armement) ; **mitraillette** (chargeur droit, armement du levier en haut) ; **revolver** (barillet basculé, 6 douilles éjectées, chargeur rapide, fermeture) ; **sniper** (chargeur, culasse ouverte puis fermée) ; **Minimi** (capot levé, caisse de munitions qui tombe, bande, capot fermé, armement) ; **fusil à pompe** cartouche par cartouche (0,42 s chacune, depuis la ceinture jusqu'à la fenêtre de chargement), tirer interrompt le rechargement s'il reste au moins une cartouche. Après chaque tir : culasse du sniper (0,9 s, douille éjectée) et coup de pompe (0,5 s). **Changement d'arme** : l'ancienne arme est rangée puis la nouvelle sortie (0,32 s pour le revolver à 0,7 s pour la Minimi), on ne tire pas pendant. Les bots font les mêmes gestes. Chargeurs, caisses et douilles tombent au sol et disparaissent. |
| **Correction annexe** | Le coup de daba restait figé : un commentaire avalait la ligne qui fait avancer l'animation (`A.chop_ub.time`). Corrigé. |
| **Test** | `reloads.cjs` : planches de 4 images par geste (Boss et Guerrière), cartouches du pompe comptées une par une. |
| **Résultat** | Pompe vide : 0, 0, 1, 1, 2 cartouches à 0,23 / 0,47 / 0,70 / 0,93 / 1,17 s ; un tir pendant le rechargement l'interrompt (1 cartouche restante). Main gauche sur sa cible à 1 cm près pendant tout le rechargement du fusil (position de la main mesurée contre la cible de l’IK). |

## 5. Kilishi et thé

| | |
|---|---|
| **Fichier** | `index.html` : `USE`, `animRealAnim()` (mouvements de tête), `showProp()` |
| **Correction** | L'arme est rangée. **Kilishi** : la main droite le sort de la poche, trois bouchées (la tête mord, le morceau raccourcit, son de bouchée), puis le range. **Thé** : petit verre tenu du bout des doigts, porté à la bouche, la tête bascule en arrière pour deux gorgées. La main gauche reste libre (pas de soucoupe, comme au grin). |

## 6. Maisons ouvertes

| | |
|---|---|
| **Problème** | Les maisons étaient des blocs pleins : on ne pouvait que monter sur certains toits. |
| **Fichier** | `index.html` : `addHouse()`, `buildHouseShell()` (nouveau), `houseAt()`, `houseNav()`, `aroundHouse()`, `updateBot()` |
| **Correction** | Chaque maison est construite pièce par pièce : murs de 0,3 m, porte praticable (1,4 × 2,45 m) avec encadrement et battant ouvert, sol intérieur, toit sur lequel on marche, marches devant la porte quand le sol est plus haut que le terrain. Les maisons hautes ont un **étage** avec escalier intérieur (7 marches) et garde-corps. Intérieur : natte en wax, lit tara, canari. **Butin** à l'intérieur (rez-de-chaussée et étage), coffres parfois dans la maison ou à l'étage. Sur une pente, la hauteur sous plafond ne dépend plus du terrain et la porte donne vers le haut. **Bots** : pour entrer ou sortir, ils passent par la porte, en contournant la maison par les coins si besoin. |
| **Test** | `houses.cjs`, `housestats.cjs` |
| **Résultat** | 100 maisons ouvertes, dont 23 à étage ; hauteur sous plafond minimale 3,65 m ; plus grande marche devant une porte 0,51 m (on monte jusqu'à 0,6 m) ; entrée par la porte, escalier jusqu'à l'étage (+3,40 m) ; 12 bots sur 12 entrent chercher du butin en partant de derrière la maison (3,7 à 6,0 s). |
| **Reste** | Les fenêtres sont décoratives (pas de vraies ouvertures) ; les bots ne montent pas à l'étage. |

## 7. Escalade

| | |
|---|---|
| **Fichier** | `index.html` : `wallAhead()`, `canMantle()`, `startMantle()`, `tryClimb()`, `updateClimb()`, `updateMantle()`, `climbHands()`, `updatePlayer()` ; murs marqués `climb` (maisons, murets, forts, hangars, salle de prière) |
| **Correction** | Saut face à un rebord de 0,6 à 2,35 m : le personnage s'y **hisse** (mains posées sur le rebord, corps qui monte puis passe par-dessus). Saut face à un mur plus haut : il **grimpe** (2,4 m/s, mains qui alternent), se déplace sur le côté avec le stick, lâche en tirant en arrière ou avec accroupi, se repousse du mur avec saut, et se rétablit en haut sur le toit. Une invite s'affiche quand c'est possible (« SAUT se hisser / escalader »). Le joueur seulement ; les bots ne grimpent pas. |
| **Résultat** | Mur de 5,9 m escaladé puis rétablissement sur le toit (2,4 s) ; muret de 1,1 m franchi. |

## 8. HUD et boutons sans emoji

| | |
|---|---|
| **Problème** | Emojis partout (compteurs, matériaux, boutons tactiles, messages, paramètres) : rendu différent selon le téléphone et aspect « fait à la va-vite ». |
| **Fichier** | `index.html` (CSS du HUD, symboles SVG, `updateHUD()`, `makeWeaponIcons()`, `updateCompass()`, `updateClimbHint()`), `src/fonts/` |
| **Correction** | 28 icônes dessinées pour le jeu (SVG, trait régulier, couleur par le thème) : plus aucun emoji dans le jeu. **Silhouettes des armes** rendues au démarrage à partir des vrais modèles 3D (emplacements, fil des éliminations). **Boussole** en haut. Barres de bouclier et de vie avec icône et valeur, vie en rouge sous 30. Emplacements d'armes : touche, silhouette, munitions (rouge quand le chargeur est presque vide), couleur de rareté, nom de l'arme en main. Banco / kilishi / thé avec icône et touche. Boutons tactiles : icône + légende (TIRER, SAUT, RECH., BÂTIR, ACCR., SPRINT, VISER, ÉDITER) ; le bouton de tir devient POSER en construction et CASE en édition. Invites « Prendre » et « Escalader » avec touches. Panneaux sombres et bordures fines cohérents. **Polices Bungee et Rubik incluses** (licence SIL OFL) : même rendu sans Internet, dans l'APK aussi. |
| **Test** | `hud.cjs` (ordinateur 1280×720 et Pixel 7 paysage), recherche automatique d'emojis dans tous les fichiers du jeu. |
| **Résultat** | 0 emoji dans `index.html`, `src/lobby/`, `src/core/`. |

## 9. Outils de test

`window.__freeze = true` met la boucle temps réel en pause : les tests avancent image par image avec `FR.update`. Sans ça, la boucle continuait pendant les captures (lentes en rendu logiciel) et faussait les images (rechargements terminés trop tôt).

---

# v1.0


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
