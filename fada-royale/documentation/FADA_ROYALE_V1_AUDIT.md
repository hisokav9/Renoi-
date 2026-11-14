# Fada Royale — Audit v1.0 (étape 1)

Point de départ : v0.9.1 (commit `23c9f46`, branche `claude/new-session-v5020g`). Ce commit sert de sauvegarde : tout peut être restauré avec `git checkout 23c9f46 -- fada-royale`.

## 1. Structure du projet

| Fichier | Contenu |
|---|---|
| `index.html` | Tout le jeu : CSS, HUD, monde, persos, armes, physique, IA, audio, menu, paramètres (≈ 2 150 lignes, un seul module JS) |
| `assets/c_boss.js`, `c_guerriere.js` | Persos réalistes : fichiers GLB (compression meshopt) encodés en base64 dans un module JS |
| `assets/anim_boss.js`, `anim_guerriere.js` | 17 animations par perso (Universal Animation Library, Quaternius, CC0) déjà adaptées à chaque squelette : quaternions en Int16, position du bassin en Int16 |
| `assets/w_*.js` | 6 armes : GLB en base64 |
| `lib/three/` | three.js r160 (depuis la v0.9.1) |

### Chargement
`loadAssets()` importe les 10 modules en parallèle, décode le base64, passe les GLB à `GLTFLoader.parseAsync` (`prepAsset`) et les animations à `decodeAnims`. Un fichier qui échoue est ignoré : le jeu se replie sur les persos en blocs (`buildChar`).

### Chaîne d'animation d'un perso réaliste
1. `buildRealChar()` clone le squelette (`SkeletonUtils.clone`), choisit pour chaque os de `RIGB` le plus haut de sa pile (le rig de la Guerrière empile jusqu'à 5 os du même nom, ex. `mixamorigHead_4 → _3 → _2 → _1 → Head`), crée un `AnimationMixer` et une action par clip (toutes jouées, poids 0, temps piloté à la main).
2. Chaque image, `animRealAnim()` :
   - calcule les poids des couches (déplacement, saut, glissade, atterrissage) et le temps de chaque clip ;
   - ajoute les gestes du haut du corps (`hit_ub`, `consume_ub`, `chop_ub`) ;
   - appelle `mixer.update(0)` qui écrit la pose mélangée dans les os ;
   - **puis modifie directement les os** : `addRot()` sur Hips/Spine/Spine1/Spine2 (jambes tournées vers la direction de course, buste contre-tourné vers la visée), `addRot()` sur Spine1/Spine2/Neck/Head (visée haut/bas), `ikArm()` → `aimBone()` sur Arm/ForeArm (mains sur l'arme).
3. `animReal()` (sans clips) et `animChar()` (persos en blocs) sont des chemins de secours ; ils repartent de la pose de repos à chaque image et ne sont pas concernés par le bug.

## 2. Bug critique : le haut du corps tourne à 360°

### Mesure
Banc de test automatique : le joueur est piloté (touches, caméra, tir, visée) dans 14 situations ; à chaque image on mesure l'orientation de la poitrine (`Spine2`) par rapport au perso, et la direction des bras dans le repère de la poitrine. Résultats v0.9.1 (rotation cumulée de la poitrine) :

| Situation | Boss | Guerrière |
|---|---|---|
| Course en ligne droite (2 s) | −36° | −35° |
| Course en cercle (4 s) | −664° | −642° |
| Caméra qui tourne vite (3 s) | −1 717° | −1 739° |
| Course en visant (2,5 s) | −2 624° | −2 625° |
| Course en tirant (2,5 s) | +2 352° | +2 365° |
| Daba en courant (2,5 s) | −1 757° | −1 794° |

Les quaternions restent normalisés (écart < 0,0001) et sans NaN : ce n'est pas une erreur numérique, c'est une rotation qui s'additionne d'une image à l'autre.

### Hypothèses écartées (vérifiées)
- *Corrections appliquées sur des os non animés* : faux, les 20 os choisis par `buildRealChar` sont exactement ceux visés par les clips, pour les deux persos.
- *Os en double de la Guerrière* : l'os animé est toujours le plus haut de sa pile, les doublons en dessous suivent ; `unifySkeleton` n'est pas en cause.
- *Décodage Int16 / quaternions non normalisés* : écart de norme < 0,0001.

### Cause exacte (démontrée)
Deux éléments combinés :

1. **Optimisation de three.js** — `PropertyMixer.apply()` (three r160, `src/animation/PropertyMixer.js`) n'écrit la valeur dans l'os **que si elle a changé depuis l'image précédente** (`if (buffer[i] !== buffer[i + stride]) binding.setValue(...)`). Si le résultat de l'animation est identique, l'os garde la valeur qu'il avait.
2. **L'os `Spine` est immobile dans les 17 clips** (vérifié dans `anim_boss.js` et `anim_guerriere.js` : clés toutes identiques ; seule la mort de la Guerrière le bouge). Son résultat d'animation ne change donc jamais et le mixeur ne le réécrit jamais (mesuré : 116/120, 150/150, 240/240 images ignorées).

Or `animRealAnim()` applique chaque image `addRot(B.Spine, _UP, -an.legYaw*0.45)` en supposant que le mixeur a remis l'os à sa pose animée. Comme ce n'est pas le cas, la rotation de l'image précédente reste et la nouvelle s'y ajoute : à 60 images/s avec `legYaw` ≈ 0,5 rad (pas chassé, course en diagonale, caméra qui tourne, visée), le buste prend ≈ 13° par image, soit plus d'un tour par seconde. En ligne droite `legYaw` ≈ 0 : presque invisible, d'où le bug « pendant les déplacements rapides ».

Le même mécanisme touche les bras : `RightArm` est immobile dans `sloop` (glissade), les épaules et les mains dans plusieurs clips, et des clips à temps bloqué (`jstart`, `jland`, `roll`, `hit_ub`) donnent des images identiques ; `ikArm()` s'additionne alors sur `Arm`/`ForeArm` → bras tordus pendant les glissades et les sauts (sauts de 100° à 150° d'une image à l'autre mesurés).

### Fonctions et fichiers concernés
- `index.html` → `animRealAnim()` (application des corrections), `addRot()`, `aimBone()`/`ikArm()` (s'appliquent sur la valeur courante de l'os), `buildRealChar()` (création du mixeur).
- `assets/anim_*.js` : données correctes, l'os immobile est un fait du rig source, pas une erreur.
- Non concernés : `boneRot()` et `animReal()` (repartent de `rest.L0`), `animChar()`, `unifySkeleton()`, `prepAsset()`, `updatePlayer()`.

### Correction proposée
Chaque image doit repartir de la pose animée « pure », quoi que fasse le mixeur :
1. juste après `mixer.update(0)`, mémoriser le quaternion de chaque os piloté (pose animée, avant toute retouche) ;
2. à l'image suivante, **avant** `mixer.update(0)`, remettre ces valeurs dans les os. Si le mixeur réécrit l'os, rien ne change ; s'il l'ignore, l'os a déjà la bonne valeur ;
3. les retouches (`addRot`, IK) s'appliquent alors toujours sur une base propre et ne peuvent plus s'accumuler.

Cette correction ne dépend pas d'un détail interne de three.js (pas de modification de la bibliothèque) et ne désactive aucune retouche : contre-rotation du buste, visée et IK restent actives.

Améliorations associées (transitions) : fondu du poids de l'IK quand on passe arme ↔ daba / construction / soin, et fondu des cibles de mains au changement d'arme, pour supprimer les sauts de bras mesurés à 140°.

### Risques de régression
| Risque | Parade |
|---|---|
| Une retouche qui comptait (sans le vouloir) sur l'accumulation | Aucune : toutes sont pensées comme des décalages par rapport à la pose animée |
| Coût CPU (20 copies de quaternions par perso et par image) | Négligeable (≈ 0,01 ms) ; les bots lointains restent mis à jour une image sur trois |
| Branche « mort » : mêmes os ignorés | La remise en pose est faite avant les deux appels à `mixer.update` |
| Persos en blocs / sans clips | Chemins séparés, non modifiés |

### Plan de tests
Les 14 situations demandées, pour Boss et Guerrière, avec le banc de mesure ci-dessus. Critères : rotation cumulée de la poitrine bornée (pas de dérive : < 90° en fin de scénario par rapport au début), aucun saut de plus de 35° d'une image à l'autre hors changement de direction volontaire, bras sans saut > 60°, quaternions normalisés, aucune erreur. Puis captures d'écran en course de côté, en cercle et en tirant.

## 3. Menu actuel et contraintes pour le lobby
- Le menu est un panneau HTML (`#menu`) au-dessus du monde de jeu filmé en orbite (`updateCamera` en état `menu`). Un seul `WebGLRenderer`, une seule scène.
- `startMatch()` crée le joueur et les 19 bots **au premier lancement** (`buildRealChar` pour chacun), réinitialise tout, lance le taxi-brousse. `goMenu()` revient au menu.
- `buildSkinMenu()` / `chosenSkin` / `localStorage` (`fr_skin`, `fr_name`, `fr_set`, `fr_q`) gèrent le perso, le pseudo et les réglages.
- Contraintes : un seul contexte WebGL sur mobile (ne pas en créer un deuxième pour le lobby), réutiliser `ASSETS` (déjà chargés) pour le perso du lobby, ne pas faire tourner la simulation du monde pendant le lobby.

## 4. Autres risques et dettes relevés
- Tout le code est dans un seul fichier : les nouvelles parties (lobby, profil) iront dans des modules séparés (`src/`).
- Licences : MP5 et fusil à pompe en CC BY-NC ; sniper, Minimi, Colt sans auteur crédité.
- `rayCast` parcourt toutes les collisions (≈ 340) : correct aujourd'hui, à surveiller si la carte grandit.
- Pas de statistiques de joueur enregistrées : le profil partira de zéro (pas de valeurs inventées).
