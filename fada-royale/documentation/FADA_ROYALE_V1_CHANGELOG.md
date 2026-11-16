# Fada Royale — Journal des modifications

# v1.7 — Armes en main, changement d'arme, construction

Base : v1.6.1 (commit `a418d73`, sauvegarde avant modification). Demande : « mission 1.7 » (prise des armes et du sabre, changement d'arme, construction à la Fortnite, animations, caméra, contrôles tactiles, Android). Audit préalable : `FADA_ROYALE_V17_AUDIT.md`. Mesures : `FADA_ROYALE_V1_TEST_REPORT.md`.
**Le « sabre » de la demande est la daba** : il n'y a pas de sabre dans le jeu, la daba est l'arme de mêlée (case RÉCOLTE).

## 1. Prise en main des armes

| | |
|---|---|
| **Bug A1 — daba qui flotte** | La paume était 17 cm au-delà du bout du manche (mesuré). Cause : décalage de 0,3 m dans le calcul de la prise (`dabaOff`). La daba n'est plus collée à l'os de la main : elle est tenue comme les autres armes (cadre de prise + main droite placée sur le manche par IK). Paume sur le manche dans toutes les situations (test `prise.cjs`). |
| **Bug A2 — coup de daba vers l'arrière** | Pendant le coup, la pointe de la daba pointait vers l'arrière (−0,6 à −1,0). Coup refait : levée du bras au-dessus de l'épaule droite (daba en arrière), puis frappe vers l'avant et le bas ; à l'impact le manche est à l'horizontale et la lame tombe sur la cible (pointe vers l'avant : 0,7 au moment du coup, 0,83 juste après ; avant : −0,6 à −1,0). Le buste accompagne (léger recul puis penché). |
| **Bug A3 — dégâts de la daba à l'appui** | Les dégâts tombaient avant le geste. Ils tombent maintenant au moment où la lame frappe (0,27 à 0,3 s après l'appui). |
| **Bug A4 — armes invisibles** | Depuis la caméra de jeu (derrière l'épaule), le revolver et les armes longues étaient cachés par le corps. Les armes sont tenues à partir de l'articulation de l'épaule droite : armes longues épaulées (crosse au creux de l'épaule, mesurée sur chaque modèle), un peu sur la droite et parallèles à la visée (la perspective les fait pointer vers le réticule), buste de profil comme un vrai tireur. On voit la crosse et le boîtier en combat, l'arme à côté de la tête en visée. |
| **Système de prise commun (A5)** | Table par catégorie (`HOLD` dans `src/core/weapon-handling.js`) : arme basse (exploration), combat, visée, sprint ; pour chacune : position par rapport à l'épaule, inclinaison, part de la visée suivie, torsion du buste, position de l'arme. Par arme (`GRIP`) : catégorie, nombre de mains, catégorie de changement. Points d'appui des mains mesurés sur chaque modèle (`ANCH`, calés par `src/core/weapons.js`). |
| **Bras courts (Guerrière)** | Ses bras font 0,41 m (épaule → poignet), le Boss 0,52 m : sa main gauche flottait sous le garde-main. Chaque main est ramenée à la portée réelle de son bras : la main gauche glisse sur le garde-main vers la poignée, et si même la poignée est trop loin l'arme se rapproche d'elle (15 cm au plus) ; si la poignée est hors de portée de la main droite, l'arme recule vers l'épaule. |
| **Coude** | Quand la main passe au-dessus de l'épaule (coup de daba, arme rangée dans le dos), le coude ne bascule plus d'un coup (plan du coude adapté à la hauteur de la main, lissé). |
| **Fichiers** | `index.html` : `animRealAnim()` (bloc de l'arme, IK des mains), `armReach()`, `buttOf()`, `ensureWeapon()`, `meleeHit()`, `fireGun()` ; `src/core/weapon-handling.js` (nouveau) |

## 2. Changement d'arme

| | |
|---|---|
| **Avant** | L'arme changeait à mi-chemin dans une pose « rangée » flottante ; un second changement repartait de zéro. |
| **Étapes** | 1) l'arme en main part à son étui (armes longues dans le dos derrière l'épaule droite, canon en haut ; revolver et daba à la hanche) ; 2) si l'étui de la nouvelle arme est ailleurs, la main vide y va (transition du bras, 0,14 s) ; 3) la nouvelle arme sort de son étui ; 4) elle monte en position ; la main gauche lâche au début et revient à la fin. Durées par catégorie (rangement / sortie) : revolver 0,12 / 0,2 s, armes longues 0,16 / 0,26, sniper 0,18 / 0,32, mitrailleuse 0,24 / 0,4, daba 0,12 / 0,18. Changement complet : 0,43 à 0,7 s selon les armes. |
| **Interruption** | Redemander l'arme qu'on range la fait ressortir depuis où elle est (0,17 s au lieu de 0,5) ; changer encore pendant la sortie range l'arme depuis sa position. On peut tirer dès la fin de la sortie (85 %). |
| **Bug — bots bloqués** | Le temps de changement n'était décompté que dans l'animation : un bot non dessiné (loin de la caméra) qui changeait d'arme ne pouvait plus jamais tirer. Le décompte est maintenant dans la logique (`updateTimers`). |
| **Sortie du sprint** | Le premier tir attend que l'arme remonte (0,16 s ; avant, la balle partait arme en travers). |
| **Arme basse** | Contre un mur ou un obstacle à moins d'une longueur d'arme, l'arme s'abaisse (le canon ne traverse plus les murs). En glissade, l'arme reste devant soi. Au tir, le canon se relève selon le recul de l'arme. |
| **Rechargement** | Les chorégraphies existantes (v1.1) gardées et vérifiées avec la nouvelle prise (mains sur l'arme à mi-rechargement : test `prise.cjs`). |
| **Fichiers** | `index.html` : `beginSwitch()`, `updateSwitch()`, `swRemain()`, `updateTimers()`, `playerFire()`, `updatePlayer()`, `animRealAnim()` ; `src/core/weapon-handling.js` (`SWITCH_T`, `STOW`, `SW_ARM`) |

## 3. Construction

| | |
|---|---|
| **Fantôme** | Il suit déjà la direction de la caméra, et l'inclinaison choisit le niveau (au-dessus, devant, sous les pieds), comme dans les jeux du genre : la pièce va dans la case voisine que l'on regarde. On n'a pas ajouté de pose « au loin » : elle aurait cassé les règles de montée rapide (v1.4, v1.5) testées par `build.cjs` et `support.cjs`. Fantôme rouge si la place est prise, si quelqu'un est dans le passage, si la pièce serait enterrée ou ne tiendrait sur rien (existant). |
| **Rotation** | Touche R en construction (le rechargement reste sur R hors construction), bouton TOURNER sur téléphone : quart de tour de la rampe ou du mur. |
| **Matérialisation** | Contour lumineux des arêtes qui s'efface pendant la pose, poussière à la base, éclair et petit son à la fin (en plus de la pièce qui grandit et se remplit, existant). |
| **Impacts** | La pièce touchée tremble (≈ 3 % pendant 0,14 s) puis retrouve exactement sa place ; plus d'éclats, son d'impact ; l'assombrissement selon les points de vie existait. |
| **Édition** | Raccourcis PORTE, FENÊTRE, DEMI-MUR (boutons à gauche du réticule, touches 1 à 3) ; les rampes s'éditent (choisir les cases du côté qui monte : la rampe se retourne). Murs 3×3 et sols 2×2 : existants. Valider, annuler, réinitialiser : existants. |
| **Destruction** | Vérifiée : plus aucune collision ni dessin à la place d'une pièce détruite (mur entier et mur édité), on passe à travers ; effondrement de ce qui ne tient plus (v1.5). |
| **Mémoire** | La matière propre à chaque pièce est libérée quand la pièce terminée passe en instance (recréée si on l'édite). |
| **Bug trouvé pendant les tests** | Ce changement faisait planter REJOUER (« dispose » sur une matière déjà libérée) : la partie suivante gardait des pièces. Corrigé dans `clearMatch()` (test `flows.cjs`). |
| **Fichiers** | `index.html` : `buildDir()`, `rotateBuild()`, `createPiece()`, `dropOutline()`, `pinstAdd()`, `damagePiece()`, `wobblePiece()`, `editPreset()`, `rampSetDir()`, `startEdit()`, `confirmEdit()`, `hoverTile()`, `updateEdit()`, `clearMatch()` |

## 4. Caméra, contrôles, Android

| | |
|---|---|
| **Caméra** | En combat, un peu plus près (3,5 m au lieu de 3,9) et plus sur l'épaule (0,82 m) : l'arme se voit. Collisions par 3 rayons (au lieu d'un) : la caméra se rapproche tout de suite d'un obstacle et revient en douceur (avant : elle sautait). |
| **Tactile** | Bouton ÉCHANGE (arme précédente) à droite des cases d'arme. Commandes testées à plusieurs doigts en même temps (`tactile.cjs`). |
| **Mémoire** | `addRot()` (≈ 10 à 15 appels par perso et par image) ne crée plus d'objet à chaque appel. |
| **Code** | Réglages de prise, d'étuis, de changement d'arme et du coup de daba regroupés dans `src/core/weapon-handling.js` ; doublon `warmGPU` retiré de `window.FR`. |

## 5. Divers

- Version 1.7 : titre, logo du lobby, nouveautés, `AndroidManifest.xml` (versionCode 18).
- `documentation/PROMPTS_ASSETS.md` : prompts de 5 armes originales (sniper lourd, fusil d'assaut bullpup, fusil de précision, deux pompes) reprenant les familles des images envoyées, sans reprendre leur dessin.
- Nouveaux tests : `prise.cjs`, `changement.cjs`, `construction.cjs`, `tactile.cjs`.

---

# v1.6.1 — Seulement le décor cohérent avec le jeu

Demande du propriétaire : « ceux qui ne sont pas cohérents au jeu, comme la carte, ne les utilise pas ».

| | |
|---|---|
| **Vérification** | Pour chacune des 13 images de ville, une vue du jeu au même endroit a été mise à côté de l'image du bandeau. Animaux, arbres, rochers, sols et ciel avaient déjà été placés selon les zones du jeu ; la carte du pack n'a jamais été utilisée (ni dans le jeu, ni dans l'APK, ni dans le dépôt). |
| **Gardées (9)** | Agadez (mosquée, dromadaires), Ténéré (dunes, acacia seul), Kouré (girafes), Arlit (chevalement de la mine), Zinder (vieux Birni), Maradi (marché), Ayorou (marché au bord du fleuve), Dosso (arbre à palabres), Parc du W (baobabs, éléphants). |
| **Retirées (4 images, 5 zones)** | Niamey : pont suspendu à grandes tours, celui du jeu est plat. Tahoua : grandes falaises, la ville du jeu est plate. Tillabéri : rizières vertes, absentes du jeu. Diffa et lac Tchad : marais de roseaux, le lac du jeu est bordé de palmiers. Ces zones ont de nouveau le bandeau en texte seul (comme en v1.5) ; les 4 images sont supprimées du jeu et de l'APK. |
| **Fichiers** | `index.html` : `ZONE_PIC` ; `assets/images/lieux/` |
| **Divers** | Version 1.6.1 (versionCode 17) : s'installe par-dessus la 1.6. |

---

# v1.6 — Décor réaliste (pack du propriétaire)

Base : v1.5 (APK 1.5). Matière : `fada-royale-modele-glb-29mo.zip`, un pack d'images et de modèles 3D généré par le propriétaire du jeu à partir des fiches de `documentation/PROMPTS_DECOR.md` (sols, ciels, panoramas de villes, carte, 11 animaux, 6 arbres, 23 rochers et reliefs). Les fichiers ont été ouverts et mesurés (taille, triangles, textures), pas exécutés. On a pris ce qui rend bien dans le jeu et dans le budget d'un téléphone ; le reste est expliqué au §7.
Mesures : nouveau test `tests/decor.cjs`, détail dans `FADA_ROYALE_V1_TEST_REPORT.md`.

## 1. Sols

| | |
|---|---|
| **Avant** | Une couleur par sommet du terrain (sable, latérite, herbe… selon la zone) et une seule texture de détail pour tout le terrain. |
| **Maintenant** | 6 textures photo du pack mélangées selon l'endroit : sable fin (partout par défaut), dunes ridées (Ténéré), latérite rouge (villes du sud), herbe sèche (savane du sud, Kouré, Parc W, berges du fleuve), gravier (Aïr, mine d'Arlit), terre craquelée (bord du lac, fonds de mares). Le mélange est calculé une fois par sommet (`groundSplat()`, mêmes zones que `groundColor()`), les transitions sont douces. |
| **Couleurs** | Chaque texture garde son détail mais sa couleur moyenne (mesurée) est rapprochée de la couleur de la zone, plus ou moins selon le sol : l'Aïr reste rouge-brun et rocheux, Agadez ocre, l'herbe verdit près de l'eau. |
| **Coût** | Seules les textures qui comptent à un endroit sont lues (1 à 3 en général). Le niveau de mipmap est calculé une fois par pixel puis `textureLod` : moitié moins cher que `textureGrad` (filtrage anisotrope), pour un sol à peine plus flou au loin (comparaison d'images faite). |
| **Qualité** | Moyenne et Haute. Basse garde le sol de la v1.5. Les 6 textures (2 Mo) se chargent après l'affichage du lobby : le démarrage n'attend pas. |
| **Fichiers** | `index.html` : `groundSplat()`, `makeSplatMat()`, `applyTerrainMat()`, `loadSols()` ; `assets/textures/sols/` |

## 2. Ciel

| | |
|---|---|
| **Avant** | Dégradé de couleur calculé. |
| **Maintenant** | Photo du ciel du Sahel (pack) sur un dôme ; pendant la tempête, le ciel d'harmattan (poussière) apparaît en fondu. Le bas des deux images a été fondu dans la couleur du brouillard (`#ecd7b4`, brouillard du jeu réglé sur cette couleur) : plus de trait entre le ciel et l'horizon. Le dégradé reste derrière pour le dessous de l'horizon. |
| **Fichiers** | `index.html` : bloc `SKY_DOME` / `SKY_STORM`, `update()` (fondu de tempête) ; `assets/decor/ciels/` |

## 3. Arrivée dans une ville

Le bandeau du nom de la zone montre maintenant une image de la ville (13 panoramas du pack, réduits à 1 024 px) : fleuve à Niamey, mosquée d'Agadez, dunes du Ténéré, marché de Maradi, girafes de Kouré, pirogues d'Ayorou, falaises de Tahoua, baobabs du Parc W, rizières de Tillabéri… Le nom est écrit dans l'image (avant, il chevauchait le viseur). Images chargées au début de la partie. Fichiers : `index.html` (`ZONE_PIC`, `preloadZonePics()`, `showZone()`) ; `assets/images/lieux/`.

## 4. Animaux

| | |
|---|---|
| **Quoi** | 51 animaux de 11 espèces, placés près de leurs villes : girafes à Kouré (elles remplacent les girafes en blocs), dromadaires (dont 2 sellés) à Agadez et dans le Ténéré, zébus à Dosso et Tahoua, chèvres à Maradi et Zinder, moutons à Tillabéri et Dosso, ânes à Niamey et Zinder, pintades à Dosso et Maradi, éléphants au Parc W, hippopotames dans le fleuve à Ayorou, 2 vautours qui tournent dans le ciel. |
| **Vie** | Les modèles du pack n'ont pas de squelette (ils ne peuvent pas marcher) : ils se retournent lentement de temps en temps, les hippos flottent, les vautours planent en cercle. |
| **Placement** | Hors des maisons, de l'eau (sauf hippos), des pentes, à 3,5 m les uns des autres ; même placement à chaque partie. Les gros animaux sur terre (girafe, dromadaire, zébu, éléphant, âne) sont des obstacles ; chèvres, moutons et pintades se traversent. |
| **Coût** | Dessinés seulement à portée (Basse 90 m, Moyenne 140, Haute 220 ; petits animaux à 60 % de cette distance). |
| **Fichiers** | `index.html` : `AMB_PLAN`, `loadAmbient()`, `placeAmbient()`, `ambSpot()`, `updateAmbient()` ; `assets/decor/animaux/` |

## 5. Arbres

- **Palmiers doum et dattiers** du pack (un sur deux) à la place des palmiers en blocs : lac, fleuve, oasis.
- **Neems** dans les villes (un acacia sur deux dans les villes) et **karités** dans le sud (un acacia sur trois hors des villes, au sud).
- Ce sont des « plans croisés » (images avec transparence) : 6 triangles par arbre, tous les arbres d'une espèce en un seul dessin. Les appels de dessin baissent en ville (Kouré : 69 → 28 en Basse).
- Fichiers : `index.html` : `loadPackTrees()`, `placePackTrees()` ; `assets/decor/arbres/`

## 6. Rochers

Les 125 rochers restent des blocs simples au loin ; près du joueur (Moyenne 70 m, Haute 110 m, Basse jamais), ils deviennent un des 5 rochers de granite du pack (3 500 triangles), mis à la taille du bloc (même collision). Mise à jour 3 fois par seconde. Fichiers : `index.html` : `loadPackRocks()`, `initPackRocks()`, `updatePackRocks()`, `Q.rockNear` ; `assets/decor/rochers/`.

## 7. Ce qu'on n'a pas pris (et pourquoi)

| Fichier du pack | Raison |
|---|---|
| `acacia.glb`, `baobab.glb` | Relief tiré d'une seule image : beau de face, mais une plaque de 1 à 3 m d'épaisseur vu de côté. Les acacias et baobabs du jeu (en volume) restent. |
| `carte-region.glb` | Belle carte, mais elle ne suit pas notre carte (fleuve décalé, lac mal placé) : elle tromperait le joueur sur la mini-carte. |
| Piles de rochers, strates de grès, termitières, cailloux | Même problème de relief d'une seule image (plaques de 7 cm à 1 m) ; 4 500 à 7 200 triangles chacun pour des objets nombreux. |

## 8. Divers

- Version 1.6 : titre, logo du lobby, nouveautés, `AndroidManifest.xml` (versionCode 16), crédits (« Décor (v1.6) »).
- Le décor du pack (sols, animaux, arbres, rochers) se charge 0,8 s après l'affichage du lobby : l'arrivée au menu prend le même temps qu'en v1.5.
- `window.FR` expose aussi `TERRAIN_MAT0`, `setQuality` et `warmGPU` (pour les tests).
- APK : 12,2 Mo (4,4 Mo en v1.5) : 41 fichiers de décor (8,9 Mo).

---

# v1.5 — Idées reprises de l'autre version, mur dans le vide

Base : v1.4 (APK 1.4). Matière : une autre version du jeu créée par le propriétaire (`Fada_Royale_4.html`, ~7 000 lignes, three.js r128), à lire pour « prendre tout ce qui améliore notre jeu, le mouvement des personnages, comment on met les constructions », et un bug : « quand on met genre 5 rampes, quand je mets un mur, le mur se met dans l'air ».
Le fichier a été lu (pas exécuté). On reprend des idées et des réglages, pas le code tel quel : les deux jeux n'ont ni le même moteur de rendu (r128 / r160), ni les mêmes persos (squelettes procéduraux / modèles animés), ni la même grille de construction.
Mesures : nouveau test `tests/support.cjs`, détail dans `FADA_ROYALE_V1_TEST_REPORT.md`.

## 1. Bug : le mur dans le vide après plusieurs rampes

| | |
|---|---|
| **Reproduit** | 5 rampes, on monte jusqu'à la dernière, puis MUR : sur la v1.4, le mur se pose une case plus loin que le bout de la rampe et 4 m plus haut, sans rien dessous (« dans le vide »). Même chose dans la moitié basse de la rampe. |
| **Cause** | La règle de la v1.4 « en montée, le mur va au bout de la rampe suivante » s'appliquait même quand il n'y avait pas de rampe suivante. |
| **Fichier** | `index.html` : `computePlacement()`, `wallAt()`, `plBox()`, `qBox()`, `boxTouch()`, `boxGrounded()`, `plAttached()` (nouveaux), `placementProblem()`, `tryBuild()` |
| **Correction** | Une pièce « tient » si elle touche le terrain, le décor (maison, mur, rocher…) ou une autre pièce. En montée, le mur ne va au bout de la rampe suivante que si elle est là ; sinon il se pose **au bout de la rampe où l'on est** : au-dessus de son bord quand on est dans le haut de la rampe, dessous quand on est dans le bas. Une pièce qui ne tient sur rien (en plein saut, au-dessus du vide) est refusée : fantôme rouge et message « RIEN POUR LA TENIR ». |
| **Résultat** | Haut et bas de la dernière rampe : mur au bout de la rampe, il tient. Mur demandé à 14 m en plein air : refusé. |

## 2. Construction : idées reprises de l'autre version

| | |
|---|---|
| **Appui mémorisé** | Un appui sur une pièce reste en mémoire 0,35 s : si la case visée est prise, la pièce se pose dès qu'une case libre est visée ; en montée, un MUR appuyé avant la RAMPE attend la rampe (0,3 s) au lieu de se poser devant et de bloquer. La montée marche dans les deux ordres d'appui. |
| **Effondrement** | Après une destruction, tout ce qui n'est plus relié au sol (terrain ou décor), de pièce en pièce, s'écroule morceau par morceau (`scheduleIntegrity()`, `checkIntegrity()`, `updateCollapse()`). Casser le bas d'une tour la fait tomber ; une construction voisine posée au sol reste debout. Pas de vérification à la pose (la règle du §1 suffit), ni quand on efface ses constructions. |
| **Fantôme lisible** | Contour blanc sur la pièce à poser (lisible sur le sable clair au soleil). |

## 3. Déplacements : idées reprises de l'autre version

| | |
|---|---|
| **Orientation** | Comme dans l'autre version : le perso regarde toujours où vise la caméra et ses jambes suivent la marche (pas chassés à gauche et à droite, marche arrière sans se retourner, diagonales). Le système de jambes existait déjà pour le combat ; il sert maintenant tout le temps. Sprint vers l'avant (diagonales comprises). Réglable : Paramètres › Contrôles › « Le perso regarde toujours où vise la caméra » (désactivé : il se tourne vers où il court, comme en v1.4). |
| **Saut tolérant** | On peut encore sauter 0,12 s après avoir quitté un bord (fin de rampe, bord de toit), et un appui de saut fait 0,15 s avant d'atterrir est gardé (le perso saute à la réception). |
| **Caméra** | Petite plongée à la réception d'un saut. (Notre caméra avait déjà ce que fait l'autre version : épaule, recul contre les murs, hauteur qui rattrape les marches en douceur, champ de vision plus large en sprint.) |
| **Fichiers** | `index.html` : `updatePlayer()`, `moveChar()`, `updateCamera()`, `SET_DEF.faceCam`, onglet Contrôles |

## 4. Ce qu'on n'a pas repris (pour l'instant)

Motos kabou-kabou, grenade à souffle, points faibles à la pioche, forges d'amélioration, caisses à fouiller, raretés d'armes, touches modifiables, rotation des rampes. Ce sont de bonnes idées mais elles changent le jeu au-delà de la demande (déplacements et constructions) ; elles sont notées dans la feuille de route.

## 5. Divers

- Version 1.5 : titre, logo du lobby, nouveautés, `AndroidManifest.xml` (versionCode 15).
- `tests/build.cjs` : chaque essai part d'un endroit dégagé, au milieu d'une case (avant : positions relatives au test précédent, un essai pouvait tomber contre une maison).

---

# v1.4 — Construction rapide

Base : v1.3 (APK 1.3). Demande : « j'arrive pas à faire des solo build comme ça dans notre jeu » avec 20 captures d'un autre jeu de construction (accueil, modes, HUD, réglages) et 5 vidéos (construction rapide en courant, modifications de murs). On reprend les mécaniques du genre (pose rapide, pose en continu, édition au relâchement, réglages), pas l'apparence, les noms ni les cartes de ce jeu : Fada Royale garde son style.
Mesures : nouveau test `tests/build.cjs` (téléphone, vrais boutons tactiles), détail dans `FADA_ROYALE_V1_TEST_REPORT.md`.

## 1. Pourquoi on n'arrivait pas à construire vite

| | |
|---|---|
| **Constat 1** | Sur téléphone, poser une pièce demandait 3 appuis : BÂTIR, puis la pièce (boutons texte cachés hors construction), puis POSER. |
| **Constat 2 (le vrai blocage)** | La technique de base (en avançant : rampe, mur, rampe, mur…) bloquait le perso sur place : le mur se posait au bord de la case du joueur, c'est-à-dire **devant le bas de la rampe**. Mesuré sur la v1.3 avec le même schéma (mode construction, POSER gardé, rampe et mur en alternance) : **+0,2 m en 10 s**. |
| **Constat 3** | Sur un coin de case (c'était le cas au départ de l'Entraînement), le premier mur se posait dans le perso et était refusé (« QUELQU'UN EST DANS LE PASSAGE »). |
| **Constat 4** | Chaque pièce construite coûtait 1 à 2 appels de dessin : 160 pièces = 339 appels au lieu de 98 en Basse (téléphone qui rame vite en construction solo). |

## 2. Les 4 pièces toujours à l'écran

| | |
|---|---|
| **Fichiers** | `index.html` : barre `#pick` (icônes `i-pwall`, `i-pramp`, `i-pfloor`, `i-pcone`), `pieceDown()`, `pieceUp()`, `refreshBuildUI()`, `updateHUD()`, gestion tactile (`touchmove`, `touchEnd`), clavier |
| **Correction** | MUR, RAMPE, SOL, TOIT sont affichés en permanence en haut à droite quand on est au sol. **Un appui pose la pièce tout de suite** (on passe en construction tout seul). **Doigt gardé : pose en continu**, une nouvelle pièce dès que la case visée change (on avance, on tourne). Le doigt posé sur une pièce oriente aussi la caméra, comme TIRER. Toucher son arme fait revenir au combat. Délai minimal entre deux pièces du joueur : 0,05 s (0,09 s avant). La barre se déplace et se redimensionne dans l'éditeur de HUD. |
| **Clavier** | Q mur, V rampe, Z sol, G toit (en AZERTY : A et W pour Q et Z), ou F1 à F4 ; B construction / arme ; clic gardé = pose en continu. G ne sert plus à basculer en construction. |
| **Réglage** | Paramètres › Construction › « Toucher une pièce la pose tout de suite » (activé par défaut). Désactivé : toucher une pièce la choisit, POSER la pose. |

## 3. Placement pour monter

| | |
|---|---|
| **Fichier** | `index.html` : `computePlacement()`, `rampUnder()` (nouveau) |
| **Correction** | En montée (sur sa rampe, face à la pente) ou juste devant une rampe qui monte dans le même sens, **le mur va au bout de la rampe de devant** : il la protège sans barrer le passage. En l'air (saut d'une rampe à l'autre), la rampe de la case où l'on est sert de repère : la pièce suivante va au bon niveau. Collé contre la ligne d'un mur (moins de 0,5 m), le mur va à la ligne suivante au lieu d'être refusé. Départ de l'Entraînement au milieu d'une case. |
| **Résultat** | Même schéma qu'en v1.3 : +58 m en 10 s (v1.3 : +0,2 m). Avec les boutons : +60,7 m en 10 s, 16 rampes et 16 murs, jamais bloqué. |

## 4. Édition plus rapide

| | |
|---|---|
| **Fichier** | `index.html` : `startEdit()`, `cancelEdit()`, `updateEdit()` |
| **Correction** | **Valider en relâchant** : on garde CASE (ou le clic), on glisse sur les cases, on relâche, c'est validé (réglable). Après l'édition, on revient en construction si on y était. ÉDITER trouve aussi son mur quand on le regarde en biais (avant : « VISE TON MUR OU TON SOL » si on n'était pas bien en face). |

## 5. Entraînement, réglages, divers

| | |
|---|---|
| **Entraînement** | Le banco affiche ∞ (il était déjà illimité mais affichait 500) et n'est plus décompté. Menu pause : **Effacer mes constructions** (sans explosion ni bruit pour chaque pièce). |
| **Paramètres › Construction** (nouvel onglet) | Pose au toucher, validation de l'édition au relâchement, sensibilité de la caméra en construction et en édition (×0,5 à ×2), conseils. |
| **Paramètres › Graphismes** | Limite d'images par seconde : 30, 60 ou aucune (30 = moins de chauffe et de batterie). |
| **Invite de rebord** | Elle chevauchait les barres de vie sur téléphone (vu sur la capture de la v1.3) : placée au-dessus du bouton « prendre / porte ». Texte : « SAUT : se hisser » ou « SAUT : attraper le rebord ». |

## 6. Pièces dessinées en instances

| | |
|---|---|
| **Fichier** | `index.html` : `PINST`, `pinstAdd()`, `pinstColor()`, `pinstRemove()`, `pinstClear()`, boucle des pièces, `destroyPiece()`, `applyTiles()`, `warmGPU()` |
| **Correction** | Une pièce terminée et non éditée rejoint un groupe d'instances par type : un appel de dessin pour tous les panneaux d'un type et un pour leurs cadres, quel que soit le nombre de pièces (jusqu'à 700 par type, au-delà la pièce garde son objet). Les dégâts (teinte plus sombre) et l'éclair de touche passent par la couleur de l'instance. Une pièce en construction (transparente) ou éditée garde son propre objet. La préparation GPU couvre aussi les pièces (transparentes, fantômes, instances, ombres). |
| **Mesure** | Même vue, Basse : 34 appels sans pièce, **40 avec 160 pièces** (339 avant pour 160 pièces dans le premier relevé). Programmes GPU créés à la première pose et quand les pièces passent en instances : 0. |
| **Bug trouvé** | La préparation GPU libérait les matières de test à la fin, ce qui supprimait aussi les shaders préparés : elles sont gardées. |

## 7. Divers

- Version 1.4 : titre, logo du lobby, nouveautés, `AndroidManifest.xml` (versionCode 14).
- `tests/flows.cjs` : l'étape d'édition revient face au premier mur (face à une rampe, le mur irait maintenant au bout de la rampe, hors de portée d'édition).

---

# v1.3

Base : v1.2 (commit `b1d9df5`, APK 1.2). Demandes : « quand je tourne la caméra, que le personnage tourne avec », « l'escalade doit se faire toujours au bord des murs des maisons, il ne faut pas qu'il grimpe », plus les problèmes que j'avais listés et que tu as validés (« vas-y attaque ça ») : à-coup à la première sortie d'une arme, trop d'appels de dessin en Basse, portes, rebords de toit, bots qui ne se cachent pas.
Mesures : scripts de `tests/` (nouveau : `cover.cjs` ; `houses.cjs` complété), détail dans `FADA_ROYALE_V1_TEST_REPORT.md`.

## 1. Le perso se tourne avec la caméra

| | |
|---|---|
| **Problème** | À l'arrêt, le perso gardait son orientation quand on tournait la caméra : on voyait son flanc ou son visage. |
| **Fichier** | `index.html` : `updatePlayer()` (orientation), `animRealAnim()` |
| **Correction** | À l'arrêt, le perso suit l'angle de la caméra (rotation amortie, environ 0,3 s pour un demi-tour). En combat il reste face à la visée, en déplacement il court vers où il va (comme en v1.1). Quand il pivote sur place, les jambes font quelques pas au lieu de glisser. |
| **Test** | `houses.cjs` 3d : caméra tournée de 92° à l'arrêt, écart restant après 1 s : 0°. |

## 2. Se hisser seulement sur un rebord (plus de grimpe)

| | |
|---|---|
| **Problème** | Depuis la v1.1, le perso grimpait le long des façades jusqu'au toit. |
| **Fichier** | `index.html` : bloc « se hisser sur un rebord » (`wallAhead()`, `canMantle()`, `startMantle()`, `updateMantle()`, `tryMantle()`, `mantleHands()`), invite `updateClimbHint()`, aide ; supprimés : `updateClimb()`, `CLIMB_UP`, `CLIMB_LAT`, état `climb` |
| **Correction** | Le perso saisit le **bord** d'un muret, d'un mur ou d'un toit quand ses mains l'atteignent, puis se hisse dessus. Au sol : saut face à un rebord de 0,6 à 2,35 m. En l'air (saut, chute) : en allant vers le mur, dès que le rebord est à portée de main (2,35 m au-dessus des pieds), donc jusqu'à environ 3,6 m en sautant. Plus haut, rien ne se passe : il faut l'escalier. L'invite affiche « se hisser » ou « sauter puis se hisser ». |
| **Test** | `houses.cjs` 3 (mur de maison de 5,9 m : il ne grimpe plus, reste au sol), 3c (rebord à 2,53 m saisi en sautant), 4 (muret franchi). |
| **Limite** | Les bots ne se hissent pas (ils contournent ou passent par les escaliers et les portes). |

## 3. Plus d'à-coup à la première sortie d'une arme

| | |
|---|---|
| **Problème** | La première fois qu'une arme, un objet (kilishi, thé) ou une texture apparaissait, le téléphone devait préparer ses shaders et ses textures pendant la partie : image figée (écran noir constaté avec le pompe). |
| **Fichier** | `index.html` : `warmGPU()` (nouveau), passée au lobby comme `precompile` ; `src/lobby/lobby.js` l'appelle au lancement d'une partie, pendant l'écran de transition |
| **Correction** | Toutes les armes, pièces et objets sont préparés une fois hors écran pendant l'écran de transition (shaders compilés, textures envoyées à la carte graphique), avant que la partie s'affiche. |
| **Test** | Nombre de programmes GPU compilés à la première sortie de chacune des 6 armes : 0 (tous préparés avant). |

## 4. Moins d'appels de dessin en Basse

| | |
|---|---|
| **Fichier** | `index.html` : `Q` (nouveaux réglages `chestVis`, `itemVis`, `giraffe`), `updateChests()`, `updateItems()`, `updateGiraffes()`, `updateTracers()`, `CHEST_GEO`, `buildBus()` |
| **Correction** | Coffres, butin au sol et girafes ne sont plus dessinés au-delà d'une distance qui dépend de la qualité (Basse : 65 m, 60 m, 90 m ; Moyenne : 100, 90, 140 ; Haute : 150, 110, 220). Traçantes cachées quand elles sont éteintes (elles étaient dessinées vides). Coffre en un seul objet (corps et couvercle fusionnés). Taxi-brousse fusionné en 3 objets. |
| **Mesure** | Même endroit, 10 bots proches, 4 directions de caméra, Basse : 166 à 323 appels avant, 75 à 105 après. |

## 5. Portes et toits

| | |
|---|---|
| **Fichier** | `index.html` : `buildHouseShell()` (battant), `buildDoors()`, `doorMatrix()`, `resetDoors()`, `setDoor()`, `updateDoors()`, `doorNear()`, `interact()`, `botOpen()`, `addHouse()` (rebords de toit), HUD `#take`, icône `i-door` |
| **Correction** | Les portes des 100 maisons ouvertes sont de vrais battants : fermées au début de la partie, elles bloquent le passage et les balles. Touche **E** ou bouton **OUVRIR LA PORTE** quand on est devant (l'arme au sol reste prioritaire). Ouverture animée (0,3 s) avec un petit bruit de porte (synthétisé). Une porte ne se referme pas sur quelqu'un (« LA PORTE EST BLOQUÉE »). Les bots ouvrent les portes pour entrer et sortir. Toutes les portes sont dessinées en un seul appel. Les parapets des toits (0,5 m) ont maintenant une collision : ils arrêtent les balles et servent d'abri sur le toit (on les enjambe toujours), et c'est sur eux que les mains se posent quand on se hisse sur un toit. |
| **Test** | `houses.cjs` 1 (porte fermée au départ, elle bloque, s'ouvre avec E, on entre), 5 (12 bots sur 12 entrent par la porte). |
| **Limite** | Les bots laissent les portes ouvertes derrière eux. |

## 6. Bots qui se mettent à couvert

| | |
|---|---|
| **Fichier** | `index.html` : `findCover()`, `pathBlocked()` (nouveaux), `botThink()`, `updateBot()`, `hasLOS()`, `Char.reset()` |
| **Correction** | Quand un bot recharge, se soigne, ou vient d'être touché avec peu de vie, il cherche un obstacle à moins de 16 m qui le cache de sa cible (muret, mur, rocher…) : derrière l'obstacle ou au ras de ses coins, sur le même niveau, pas dans une autre maison, avec un chemin libre (il contourne l'obstacle par le coin le plus court). Il y court en visant sa cible, s'accroupit derrière un abri bas, puis ressort au bout de 2,5 à 4,5 s quand il n'en a plus besoin. S'il est coincé plus d'une seconde, il abandonne cet abri et en cherche un autre. Sans abri autour, il ne recherche pas avant 1,2 s (économie de calcul). |
| **Ligne de vue** | Elle vise maintenant le torse (1,2 m debout, 0,75 m accroupi) : derrière un muret, un perso accroupi n'est plus repéré, même si le haut de sa tête dépasse. Ça vaut aussi pour toi. |
| **Bug trouvé** | La recherche d'obstacles réutilisait la liste de la grille de collisions pendant que les tests de place et de chemin la réécrivaient : la plupart des abris étaient sautés sans raison. La liste est maintenant copiée. |
| **Test** | `cover.cjs` : bot qui recharge face au joueur à 3 m d'un muret : 11 sur 12 puis 9 sur 10 (deux lancements) se cachent en 0,1 à 2,5 s et restent cachés au moins 60 % du temps restant. Ceux qui restent à découvert n'ont pas trouvé d'abri à portée. Au premier essai, avant les corrections : 4 sur 10. |

## 7. Divers

- Version 1.3 : titre, logo du lobby, nouveautés du lobby, `AndroidManifest.xml` (versionCode 13).
- Test du lobby : pseudo de test neutre (« Testeur »).

---

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
