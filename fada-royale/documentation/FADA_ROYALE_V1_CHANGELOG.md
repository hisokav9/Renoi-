# Fada Royale — Journal des modifications

# v2.0.1 — Chute libre, parapente, nage, panorama du lobby, corrections vues dans une vidéo de jeu

Base : v2.0 (commit `19f4c30`). Demandes : les problèmes vus dans deux vidéos de jeu enregistrées sur ton téléphone (écran 800 × 480, 50 joueurs), améliorer la descente en parachute, le vol en parapente, ajouter la nage, puis le prompt d'un panorama pour le lobby ; ensuite, l'intégration de l'image générée avec ce prompt.

**Limites, dites tout de suite :**
- **Aucun test sur un vrai téléphone** (ni appareil ni émulateur ici) : les FPS sur Android ne sont **pas garantis**.
- Le panorama reçu fait **1774 × 887 pixels** : net au téléphone, un peu doux sur un grand écran d'ordinateur. Une version de 4096 pixels de large ou plus le rendrait plus net (même fichier à remplacer, aucun code à toucher).
- Sur 11 parties entières entre bots (19 à 59 bots), **2 ont duré un peu moins de 15 min** (874 s et 884 s) ; les 9 autres entre 15,9 et 19,2 min.

## 1. Corrections vues dans la vidéo

| Problème vu | Correction |
|---|---|
| Le nom du lieu clignotait en longeant le bord d'une ville (l'affiche se relançait à chaque passage de la limite) | Le lieu en cours « colle » un peu au-delà de sa limite (rayon × 1,05 pour une ville, 9 m de plus pour le fleuve) ; pas d'affiche pour la brousse ni pour un lieu déjà annoncé il y a moins de 25 s ; l'affiche ne bloque plus les doigts et descend sous les compteurs au téléphone |
| Textes trop petits sur un écran 800 × 480 | Munitions des cases 11 px (gras), compteurs 11 à 13 px, nom de l'arme 12 px sur un fond sombre |
| Caméra collée au perso quand il est dos à un mur : on ne voyait plus rien | Le perso devient transparent quand la caméra est à moins de 1,4 m (jusqu'à 23 % d'opacité), puis redevient opaque. Ses matériaux sont copiés pour lui seul : les bots qui ont le même perso ne changent pas |
| Le fusil tactique beige se confondait avec le sable | Beige plus soutenu (`src/core/weapon-models.js`) |

Ce qui était voulu et n'a pas été changé : les boules brunes sont des jarres en terre, les plaques sur les murs sont des poutres (torons) du style d'Agadez.

## 2. Chute libre (`FLY` dans `index.html`)

- Le perso tombe **à plat ventre** (corps à 82°), à 40 m/s ; **pousser vers l'avant = piqué** : 55 m/s, corps tête la première, plus de vitesse vers l'avant ; déplacement horizontal jusqu'à 15 m/s ; bras écartés ; filets d'air autour de lui.
- **SAUT ouvre le parapente plus tôt** (à plus de 12 m du sol) ; sinon ouverture automatique à 44 m. Les bots ouvrent chacun à une hauteur différente (36 à 52 m).

## 3. Parapente

- Il **avance toujours** (7,5 m/s sans toucher à rien, jusqu'à 11,5 en poussant), descend de 4,6 m/s (6,2 en poussant).
- **Virages progressifs** (1,6 rad/s au plus) : la voile et le perso s'inclinent dans le virage, la main du côté du virage tire le frein.
- **Arrondi avant de se poser** (sous 4,5 m) : la descente ralentit à moins de 3 m/s et le perso se pose en courant (il garde 70 % de sa vitesse au moment du contact).

## 4. Nage

- Dans plus de 1,25 m d'eau (fleuve, lac), le perso **flotte** (hanches juste sous la surface, tête hors de l'eau) et **nage le crawl** (bras qui tournent, battements de jambes, éclaboussures) : 3 m/s, 3,9 m/s en sprint.
- **Pas de tir, de construction, d'objet ni d'emote dans l'eau** (message « PAS EN NAGEANT ») ; l'arme est rangée et ressort sur la berge.
- Les bots nagent aussi, sans tirer ; la caméra reste au-dessus de l'eau.

## 5. Panorama du lobby (`src/lobby/lobby.js`, `assets/images/lobby-panorama.jpg`)

- Prompt fourni (`PROMPTS_ASSETS.md` § 1 quater). Sur les 2 images reçues, la **2e** est utilisée (caravane sur la dune, minaret d'Agadez hérissé de torons). Un **pylône de télécommunication** visible à droite (élément moderne, à éviter d'après le prompt) a été effacé ; rien d'autre n'est retouché.
- L'image n'est pas un vrai 360° (ses bords gauche et droit ne se raccordent pas) et la caméra du lobby regarde toujours devant elle : elle est posée sur un **arc de cylindre de 120° derrière l'estrade**, horizon de l'image à hauteur des yeux. Les bords et le haut se fondent dans l'ancien ciel dégradé, qui reste derrière.
- Avec l'image, le lobby s'ouvre sur le paysage : le **mur de la cour, le minaret 3D, les palmiers 3D et les dunes ne sont plus construits** (le panorama les montre déjà). L'estrade, le service à thé, l'étal en wax, la poussière et les rayons de lumière restent. Le sol 3D se fond dans le sable de l'image ; le halo du soleil est posé sur le soleil de l'image.
- Effet de bord mesuré : **224 → 43 appels de dessin** dans le lobby (400 → 68 objets).
- L'image est chargée avec les autres ressources (derrière l'écran de chargement). **Sans le fichier, l'ancienne cour fermée revient** (vérifié).
- Réglages regroupés dans `PANORAMA` (`src/lobby/lobby.js`) : largeur de l'arc, point placé devant la caméra, ligne d'horizon, soleil, fondu du sol. Pour changer d'image : remplacer le fichier (rapport 2:1, horizon au milieu) et, si besoin, ces réglages.

## 6. Version

Lobby et titre « v2.0.1 » ; Android `versionCode` 20, `versionName` 2.0.1 ; APK signé avec la même clé que les versions précédentes.

# v2.0 — Arsenal, construction, graphismes, HUD, grande carte, 60 joueurs

Base : v1.7 (commit `720c7a2`, sauvegarde avant modification). Demandes : « Weapon System 2.0 » (arsenal) et « 2.0 Gameplay Overhaul ». Audit préalable : `FADA_ROYALE_V2_AUDIT.md`. Travail en 5 étapes vérifiées, une par commit (`3c3c427`, `a1bd202`, `7fe7598`, `16bd9a2`, `351773f`).

**Ce qui n'a pas été fait ou pas pu l'être**, dit tout de suite :
- Les 5 images d'armes reçues sont des rendus officiels de Fortnite : elles ont servi à choisir des **catégories** d'armes, rien n'en est copié (ni image, ni forme).
- « La vidéo fournie » pour les emotes **n'a pas été reçue** avec la demande : les emotes ne s'en inspirent pas.
- Aucun clip de danse ou d'emote n'existe dans le projet : les 4 emotes sont construites à la main sur le squelette.
- Les 2 nouvelles armes sont **modélisées dans le code** (vraies pièces en volume) ; un modèle plus détaillé demanderait un outil « image → 3D » payant (Higgsfield, crédits) : **pas utilisé sans ton accord**.
- **Aucun test sur un vrai téléphone** (pas d'appareil ni d'émulateur ici) : les mesures de calcul sont faites dans un navigateur sans écran ; les FPS sur Android ne sont **pas garantis**.

## 1. Arsenal (`src/core/arsenal.js`, nouveau)

| | |
|---|---|
| **Catalogue unique** | Toutes les valeurs des armes (dégâts, tête, cadence, chargeur, recharge, dispersion, portée, dégâts aux constructions, recul, mode de tir, munitions, raretés possibles, réglages des bots) sont dans un seul fichier ; `index.html` les lit, rien n'est recopié ailleurs. |
| **5 raretés par arme** | Commun (gris), Peu commun (vert), Rare (bleu), Épique (violet), Légendaire (orange). Chaque arme a une rareté de base (valeurs du tableau) et une plage de raretés possibles. Un cran au-dessus : +6 % de dégâts (aussi aux constructions), −6 % de temps de rechargement, −5 % de dispersion. Rareté visible : faisceau et anneau au sol, cadre de la case, nom de l'arme. |
| **4 types de munitions** | Légères, moyennes, lourdes, cartouches (avant : une réserve commune de 300). Plafonds, caisses typées au sol (bande de couleur), caisses ramassées jusqu'au plafond, le reste reste au sol. |
| **Inventaire** | Ramasser (rareté et chargeur gardés), **lâcher** (touche G, bouton LÂCHER), reprendre, **remplacer** l'arme en main quand les 5 cases sont pleines (E / bouton) ; même arme de meilleure rareté = l'ancienne est remplacée et posée au sol. Cases : couleur de rareté, chargeur / réserve. |
| **Modes de tir** | Automatique (garder le doigt) ou semi-automatique (un coup par clic à la souris ; au doigt, garder appuyé retire à la cadence de l'arme). |
| **2 nouvelles armes** | **Fusil tactique** beige (semi-automatique, précis, munitions moyennes) et **pompe tactique** noire à canon long (semi-automatique, munitions de pompe). Modèles construits dans le code (`src/core/weapon-models.js`) : boîtiers, canons, chargeur, crosse, poignée, garde-main, en volume, matières PBR partagées, 3 à 4 appels de dessin par arme. Prise en main, étuis, rechargements et sons branchés sur les systèmes v1.7. |
| **Butin** | Armes au sol avec rareté tirée au sort (les coffres font mieux), souvent avec leurs munitions ; éliminations : caisses du type des armes du perso. |
| **Bots** | Compatibles : dégâts selon la rareté de leur arme, choix d'arme selon la rareté et la distance. |

Catalogue (valeurs de `src/core/arsenal.js`) :

| Arme | Mode | Munitions | Dégâts | Tête | Cadence (tirs/s) | Chargeur | Recharge (s) | Portée (m) | Dégâts aux constructions | Raretés possibles |
|---|---|---|---|---|---|---|---|---|---|---|
| Revolver | semi-auto | légères | 40 | ×2 | 2.4 | 6 | 2 | 140 | 35 | Commun → Rare |
| Mitraillette | automatique | légères | 14 | ×1.6 | 13.3 | 30 | 1.8 | 85 | 16 | Commun → Épique |
| Fusil d'assaut | automatique | moyennes | 25 | ×1.6 | 7.7 | 30 | 1.9 | 170 | 30 | Commun → Légendaire |
| Fusil tactique | semi-auto | moyennes | 36 | ×2 | 4.2 | 20 | 2 | 220 | 34 | Peu commun → Légendaire |
| Pompe | semi-auto | Cartouches | 11 × 9 plombs | ×1.5 | 1.2 | 5 | 2.2 | 55 | 12 | Commun → Épique |
| Pompe tactique | semi-auto | Cartouches | 8.5 × 8 plombs | ×1.5 | 2.9 | 8 | 2.4 | 50 | 10 | Peu commun → Légendaire |
| Mitrailleuse | automatique | moyennes | 22 | ×1.5 | 10.0 | 80 | 4 | 150 | 34 | Rare → Légendaire |
| Sniper | semi-auto | lourdes | 95 | ×2.5 | 0.7 | 5 | 2.8 | 450 | 70 | Rare → Légendaire |

Dégâts par balle (ou par plomb) selon la rareté (les valeurs du tableau sont celles de la rareté de base, en gras) :

| Arme | Commun | Peu commun | Rare | Épique | Légendaire |
|---|---|---|---|---|---|
| Revolver | 37.6 / 2.12 s | **40.0 / 2.00 s** | 42.4 / 1.88 s | — | — |
| Mitraillette | 13.2 / 1.91 s | **14.0 / 1.80 s** | 14.8 / 1.69 s | 15.7 / 1.58 s | — |
| Fusil d'assaut | 22.0 / 2.13 s | 23.5 / 2.01 s | **25.0 / 1.90 s** | 26.5 / 1.79 s | 28.0 / 1.67 s |
| Fusil tactique | — | 31.7 / 2.24 s | 33.8 / 2.12 s | **36.0 / 2.00 s** | 38.2 / 1.88 s |
| Pompe | 9.7 / 2.46 s | 10.3 / 2.33 s | **11.0 / 2.20 s** | 11.7 / 2.07 s | — |
| Pompe tactique | — | 8.0 / 2.54 s | **8.5 / 2.40 s** | 9.0 / 2.26 s | 9.5 / 2.11 s |
| Mitrailleuse | — | — | 20.7 / 4.24 s | **22.0 / 4.00 s** | 23.3 / 3.76 s |
| Sniper | — | — | 83.6 / 3.14 s | 89.3 / 2.97 s | **95.0 / 2.80 s** |

Munitions :

| Type | Plafond transporté | Caisse au sol | Armes |
|---|---|---|---|
| Munitions légères | 360 | 30 | Revolver, Mitraillette |
| Munitions moyennes | 300 | 30 | Fusil d'assaut, Fusil tactique, Mitrailleuse |
| Munitions lourdes | 60 | 6 | Sniper |
| Cartouches | 60 | 10 | Pompe, Pompe tactique |

Modèles 3D des armes : revolver, mitraillette, fusil d'assaut, pompe, sniper, mitrailleuse et daba = modèles « 2.5D » de la v1.2 (silhouette découpée, extrudée et arrondie, ≈ 4 cm d'épaisseur : vraie géométrie, pas une image plane) ; fusil tactique et pompe tactique = modélisés en volume dans le code (v2.0). Aucun modèle n'est copié d'un autre jeu.

## 2. Construction (`src/core/building.js`, nouveau)

| | |
|---|---|
| **Réglages centralisés** | PV, temps de pose, coût, résistance par pièce, et part des dégâts par type d'attaque (balles du joueur, des bots, coups de daba). |
| **PV doublés** | Mur 150 → 300, rampe / sol / toit 140 → 280 (mesuré : 10 balles de fusil d'assaut, 3 coups de pompe, 5 de sniper, 5 coups de daba pour un mur fini). |
| **Pose en continu** | Doigt (ou clic) gardé sur une pièce = pose en continu ; on peut changer de pièce sans lever le doigt (mesuré : 10 murs en 1,1 s). |
| **Fantôme** | Vert quand la pièce peut être posée, rouge sinon (avant : bleu). |
| **Mode SIMPLE / AVANCÉ** | Paramètres › Construction. SIMPLE (par défaut au téléphone) : toucher une pièce la pose, orientation automatique, boutons de pièces plus grands, si la case visée est prise la pièce va à la place libre la plus proche (devant, au-dessus, sous les pieds). AVANCÉ : rotation (R / TOURNER) et tous les réglages fins. Même système de construction dans les deux modes (pas de système parallèle). |

## 3. Graphismes

| | |
|---|---|
| **5 profils** | Très faible (nouveau : sans ombres ni effets, résolution 0,75, 180 m de vue), Faible, Moyen, Élevé, **Personnalisé** (part du profil choisi avant, puis ombres aucune / basses / moyennes / hautes, sol simple / détaillé, effets réduits / moyens / complets, végétation réduite / complète). Mesuré au même endroit : 93, 100, 193 et 199 appels de dessin de Très faible à Élevé. |
| **Premier lancement** | Téléphone modeste (≤ 2 Go de mémoire ou ≤ 4 cœurs) : Très faible ; autre téléphone : Faible ; ordinateur : Élevé. |
| **Anticrénelage** | Réglable, appliqué au prochain lancement (WebGL ne permet pas de le changer en cours de route). |
| **Limite d'images** | 30 / 45 / 60 / 90 / 120 : la fréquence de l'écran est mesurée, seules les limites qu'il peut afficher sont proposées (écran 60 Hz : 30, 45, 60). Limite par accumulateur : 45 sur un écran 60 Hz donne bien 45 (avant : 30). Compteur de FPS déjà présent. |
| **Pas de post-traitement** | Le jeu n'a pas d'effets de post-traitement (flou, bloom) : rien à régler de ce côté. |

## 4. HUD

| | |
|---|---|
| **Éditeur** | En plus de déplacer et redimensionner (v1.1) : **opacité** et **masquage** de chaque élément (le joystick et les paramètres ne se masquent pas), bouton TOURNER et bouton des emotes ajoutés. |
| **Dispositions** | Classique, Compacte (boutons plus petits et plus discrets), Construction (pièces, ÉDITER et BÂTIR plus grands), **Personnalisée** (la tienne, gardée sur le téléphone, retrouvée au redémarrage). Une disposition faite avant la v2.0 devient « Personnalisée ». |
| **Joueurs** | « 37 en vie / 50 » ; Paramètres › Partie donne la répartition des bots de la partie en cours (débutants, normaux, avancés, encore en jeu, éliminés). |

## 5. Carte (680 m de côté au lieu de 480 m, ≈ 2 × la surface)

8 nouveaux lieux autour de l'ancienne carte (qui ne change pas), avec maisons ouvertes (portes, étages, butin dedans), butin et coffres :

| Lieu | Où | Contenu |
|---|---|---|
| Camp militaire | Est | 6 casernes, hangar, 2 miradors, château d'eau, sacs de sable |
| Bilma | Nord-est | Oasis : palmiers dattiers, puits, salines, cases, maisons de banco, au milieu des dunes |
| Malbaza | Sud-est | Cimenterie : 3 silos, 2 hangars, convoyeur, château d'eau, pylônes, logements |
| Djado | Nord | Forteresse en ruine (ksar), maisons de banco, murets, rochers |
| Termit | Nord-ouest | Massif rocheux (collines, 70 gros rochers à récolter, buttes), mirador, butin caché entre les rochers ; pas de maison (trop de pente : voir plus bas) |
| Filingué | Ouest (autre rive) | Village sur une colline : cases, maisons, baobab |
| Gouré | Est | Village des dunes : cases, maisons, palmiers |
| Gaya | Sud | Grand marché : 15 étals, maisons |

Les maisons des nouveaux lieux ne sont posées que sur un terrain assez plat (≤ 0,9 m de dénivelé sous la maison et 2,5 m autour) : sur une dune ou un rocher, le seuil de la porte se retrouvait trop haut pour l'ouvrir (trouvé par `combat.cjs` à Bilma et Termit ; vérifié ensuite : les 48 portes des nouveaux lieux s'ouvrent).

Brousse (arbres, rochers, buttes, buissons, butin) à la même densité qu'avant sur toute la carte ; fleuve et palmiers sur toute la longueur ; terrain plus fin en Moyen / Élevé (mailles de 3 m) ; taxi-brousse à la même vitesse (traversée de 40 s).

## 6. Tempête et durée des parties (`src/core/match.js`, nouveau)

7 phases au lieu de 5 : zone de départ de 500 m de rayon (toute la carte), puis 280, 190, 125, 70, 32, 12 et 0 m ; dégâts 1 à 12 par seconde ; tempête finie en **19 min 20 s** (avant : ≈ 5 min).

Réglé sur des parties entières mesurées (`tests/partie.cjs`) : une partie se joue quand les derniers survivants se croisent. Avec des zones intermédiaires étroites (160, 95, 52 m), 1 partie sur 3 finissait en 13,5-14,5 min ; avec les zones larges ci-dessus, des bots prudents en fin de partie (ils tiennent leur position et ne vont pas chercher les autres bots au loin) et des dégâts entre bots ×0,45 (le joueur subit les mêmes dégâts qu'avant), **les 21 parties mesurées durent de 15,1 à 19,2 min** (moyennes : 17,2 min avec 19 bots, 17,1 avec 39, 17,3 avec 49, 16,8 avec 59), et 17,5 / 18,2 min avec le joueur.

## 7. Bots

| | Avant (v1.7) | v2.0 |
|---|---|---|
| Nombre | 19 (20 joueurs), fixe | **19 à 59**, réglable (Paramètres › Partie) ; par défaut 49 sur ordinateur, 39 au téléphone, 29 sur un téléphone modeste |
| Niveaux | un seul | **Débutants, Normaux, Avancés, Mélangés** (35 / 45 / 20 %) : précision, délai de réaction, perception, construction quand ils sont touchés, seuil de soin, pas de côté, sauts, marge pour rejoindre la zone, rayon de recherche du butin |
| Zone | partaient 22 s avant que la tempête avance, quelle que soit la distance | partent à temps selon la distance à courir et leur niveau |
| Début de partie | combat dès l'atterrissage | pillent d'abord (perception réduite tant qu'on ne les touche pas, 35 à 70 s) |
| Fin de partie | erraient au hasard dans la zone | à 12 survivants ou moins : tiennent leur position, ou rentrent dans la zone de leur côté ; ne vont pas chercher les autres bots au loin |
| Dégâts entre bots | ×0,55 | ×0,45 (parties plus longues ; dégâts sur le joueur inchangés) |
| Armes | — | distances de combat des 2 nouvelles armes |
| Célébrations | — | emote après une élimination, parfois |

## 8. Emotes

Salut, Bravo, Victoire, Danse : bouton à côté des paramètres (touche J puis 1 à 4 sur ordinateur). Gestes construits à la main (cibles des mains pour l'IK des bras, rotations du buste et des hanches). Arme rangée pendant l'emote ; annulée en bougeant, en tirant, en construisant ou quand on est touché ; Victoire jouée quand on gagne ; les bots célèbrent parfois une élimination.

## 9. Performances

| | |
|---|---|
| **Ramassage des bots** | Chaque bot testait tous les objets de la carte à chaque image (8 % du calcul avec 49 bots) : une image sur 3 par bot. |
| **Coffres** | Ouverture testée une image sur 3 par coffre (au lieu de tous les coffres × tous les persos à chaque image). |
| **Objets au sol** | Le flottement n'est calculé que pour les objets affichés. |
| **Animation** | Les bots au-delà de 2 × la distance d'animation complète ne sont animés qu'une image sur 6 (le temps d'animation reste juste). |
| **Mesures** | Voir le rapport de tests : logique + animation par image selon le nombre de bots. |

## 10. Fichiers

- Nouveaux : `src/core/arsenal.js`, `src/core/weapon-models.js`, `src/core/building.js`, `src/core/match.js` ; tests `arsenal.cjs`, `construction2.cjs`, `graphismes.cjs`, `bots.cjs`, `partie.cjs`, `emotes.cjs`, `combat.cjs` ; `documentation/FADA_ROYALE_V2_AUDIT.md`.
- Modifiés : `index.html` (arsenal, inventaire, butin, HUD, construction, graphismes, éditeur de HUD, carte, tempête, bots, emotes, performances), `src/core/weapon-handling.js` (prise des 2 nouvelles armes), `src/lobby/lobby.js` (v2.0, nouveautés, description du mode), `tests/prise.cjs` (9 armes), `tests/build.cjs` (mode avancé pour un essai), `android/AndroidManifest.xml` (versionCode 19, versionName 2.0), `android/README.md`.

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
