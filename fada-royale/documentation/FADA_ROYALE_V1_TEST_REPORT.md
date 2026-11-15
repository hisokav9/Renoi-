# Fada Royale — Rapport de tests

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
