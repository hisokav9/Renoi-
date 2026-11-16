# Fada Royale — Audit technique v1.7 (avant modification)

Point de départ : v1.6.1 (commit `a418d73`, sauvegarde avant les modifications). Audit fait en lisant le code et en mesurant dans le jeu (Chromium sans écran, rendu logiciel, boucle figée), avec des bancs d'images et de mesures écrits pour l'occasion.

## 1. Architecture

| Élément | Où | Remarque |
|---|---|---|
| Moteur | three.js r160 (`lib/three/`), un seul fichier de jeu `index.html` (≈ 3 300 lignes) + modules `src/core/` (profil, calage des armes) et `src/lobby/` | Pas de moteur physique : collisions par boîtes alignées dans une grille (`addSolid`, `gridQuery`, `rayCast`) |
| Persos | 2 modèles squelettés (Boss, Guerrière) + costumes ; animations par clips (`AnimationMixer`, 20 clips Quaternius CC0) mélangées à la main (`animRealAnim`) puis retouches procédurales (jambes, buste, IK des bras) | Repli sans clips (`animReal`) et persos en blocs (`animChar`) : utilisés seulement si les modèles manquent |
| Armes | Modèles « 2.5D » (`assets/armes/*.glb`) calés par `src/core/weapons.js` (point de prise, canon horizontal, points d'appui des mains) ; tenues dans un repère `pivot → hold` devant la poitrine ; les mains rejoignent les points d'appui par IK (`ikArm`) | Tables `GRIP` (prise, durée de changement, pose rangée), `ANCH` (points d'appui), `RELOAD` / `BOLT` / `PUMP` / `USE` (chorégraphies) |
| Daba (arme de mêlée) | Seule arme accrochée à l'os de la main droite (`m.dabaOff`), animée par le clip `chop_ub` | **Il n'y a pas de sabre dans le jeu : l'arme de mêlée est la daba** (case RÉCOLTE). C'est elle qui est traitée comme « le sabre » de la demande. |
| Construction | Grille de 4 m ; `computePlacement` (case du joueur + direction de la caméra + inclinaison), fantôme bleu / rouge, pièce qui grandit et se remplit (1,3 à 1,6 s), pièces terminées en instances (`PINST`), édition par cases (murs 3×3, sols 2×2), effondrement (`checkIntegrity`) | |
| Caméra | Épaule droite (0,72 m), 3,9 m, visée 2,3 m (lunette 1,2 m), collisions par un rayon, champ de vision selon sprint / visée / glissade | |
| Contrôles tactiles | Rôle par doigt (`roles`), joystick dynamique ou fixe, glisser pour viser (aussi depuis TIRER et les pièces), boutons dédiés | |

## 2. Bugs et défauts trouvés

| # | Défaut (mesuré) | Cause | Fichier / fonction | Correction prévue | Risque de régression |
|---|---|---|---|---|---|
| A1 | **Daba qui flotte** : la paume est à 17 cm au-delà du bout du manche (z = 0,31 dans le repère de la daba, manche de −0,55 à 0,14) | `dabaOff` place l'origine de l'arme 0,3 m plus loin que la main, alors que le point de prise (`grip [78,10]`) est déjà au bout du manche | `buildRealChar()` | Calage de la main sur le manche à partir de la géométrie de la daba, comme les autres armes | Faible |
| A2 | **Coup de daba vers l'arrière** : pendant le coup, la pointe de la daba pointe vers l'arrière du perso (−0,6 à −1,0) | Orientation de la daba dans la main calculée une fois au repos, puis le clip `chop_ub` (geste de coup de poing / d'épée court) tourne la main dans l'autre sens | `buildRealChar()`, `animRealAnim()` | Coup de daba refait : levée au-dessus de l'épaule droite puis frappe vers l'avant et le bas, poignet orienté pour que la lame arrive en avant | Moyen (banc d'animation à relancer) |
| A3 | **Dégâts de la daba au moment de l'appui**, alors que le geste frappe ≈ 0,3 s plus tard | `playerFire()` applique le coup tout de suite | `playerFire()` | Coup appliqué au moment de l'impact du geste | Faible (tests de récolte) |
| A4 | **Armes à feu invisibles depuis la caméra de jeu** : revolver, mitraillette, fusil, pompe, sniper, mitrailleuse cachés par le corps en exploration et en combat ; en visée, à peine un bout | Arme tenue au centre, devant la poitrine (`pivot` à 0,12 m), crosse devant le sternum ; la caméra est derrière l'épaule droite | `buildRealChar()` (pivot), `animRealAnim()` (pose) | Armes longues épaulées à droite (crosse au creux de l'épaule), canon vers la mire ; position basse en exploration ; visée remontée à hauteur d'œil | Moyen : IK, rechargements, tests `animtest` |
| A5 | Pas de « système de prise » commun : la prise de la daba est à part (os de la main), les armes à feu dans `GRIP`, `ANCH`, `WEAP.fore` | Ajouts successifs v1.1 → v1.2 | `GRIP`, `ANCH`, `ensureWeapon()` | Une table de prise par arme (classe, mains, épaule, positions et rotations par situation, temps de sortie et de rangement), qui étend `GRIP` au lieu d'un système parallèle | Moyen |
| A6 | Changement d'arme : l'arme change à mi-chemin dans une pose « rangée » flottante ; pas d'étape de main vers l'étui ; pas de durée propre à la mêlée ; tirer est bloqué 85 % du temps du changement, mais un 2e changement pendant le 1er repart de zéro | `beginSwitch()`, `animRealAnim()` | Changement en étapes (baisser, main vers l'étui ou le dos, échange, sortie, montée, prêt) par catégorie ; reprise depuis la pose courante si on rechange | Moyen |
| A7 | Sortie du sprint : le tir part pendant que l'arme est encore en travers (pose de sprint) | Le sprint coupe et le tir part la même image | `updatePlayer()`, `playerFire()` | Courte montée de l'arme (≈ 0,15 s) avant le 1er tir après un sprint | Faible |
| A8 | Pas de position « arme basse » : contre un mur, le canon traverse le mur | Pas de test d'obstacle devant l'arme | `animRealAnim()` | Arme abaissée quand un obstacle est à moins de la longueur de l'arme | Faible |
| B1 | Fantôme de construction : suit la case du joueur et la direction, pas l'endroit visé ; pas de rotation des rampes | `computePlacement()` | Visée plus loin = case suivante (portée 2 cases), touche / bouton de rotation de la rampe | **Élevé** : règles de montée v1.4 / v1.5 (`support.cjs`, `build.cjs`) |
| B2 | Apparition d'une pièce : agrandissement + transparence, sans effet de matérialisation ni poussière | `createPiece()`, boucle des pièces | Contour lumineux qui monte, poussière à la base, son en deux temps, éclair à la fin | Faible (coût à mesurer) |
| B3 | Édition : murs et sols seulement ; pas de rampe ; pas de raccourcis porte / fenêtre | `startEdit()` et suivantes | Rampe éditable (tourner), boutons PORTE / FENÊTRE / ARCHE / DEMI-MUR | Moyen |
| B4 | Impact sur une pièce : éclair et assombrissement seulement | `damagePiece()` | Petit tremblement de la pièce, éclats plus visibles, sons d'impact | Faible |
| B5 | Une matière clonée par pièce, gardée tant que la pièce existe (même dessinée en instance) | `createPiece()` | Libérer la matière quand la pièce passe en instance, la recréer si on l'édite | Faible |
| C1 | **Allocations à chaque image** : `addRot()` crée un quaternion à chaque appel (≈ 10 à 15 appels par perso et par image, 20 persos) | `_apq.clone()` | Quaternion de travail réutilisé | Nul |
| C2 | Caméra : la collision la rapproche d'un coup et la relâche d'un coup (sauts quand un obstacle passe) ; un seul rayon (peut frôler un coin) | `updateCamera()` | 3 rayons, rapprochement immédiat, éloignement en douceur | Faible |
| C3 | Pas de bouton « arme précédente » sur téléphone | — | Bouton d'échange rapide | Faible |
| C4 | Code en double : `animReal()` (≈ 60 lignes) ne sert que si les clips d'animation ne se chargent pas ; doublon `warmGPU` dans `window.FR` | Historique | Garder `animReal` comme secours (documenté) ; retirer le doublon | Nul |

## 3. Outils

| Outil | État ici | Besoin |
|---|---|---|
| GitHub | Connecté (branche `claude/new-session-v5020g`) | Suffisant |
| Playwright + Chromium | Installés | Tous les tests automatiques |
| Chrome DevTools | Pas d'interface, mais le protocole (CDP) est accessible par Playwright : mémoire JavaScript, compteurs | Suffisant pour mesurer les allocations |
| Blender, glTF Transform | **Absents** | Pas indispensables : les modèles ne sont pas changés. Utiles plus tard pour alléger les persos (feuille de route) |
| Android Studio, adb, émulateur | **Absents** | L'APK se construit sans (script maison, signature vérifiée). **Ce qui manque vraiment : un essai sur un vrai téléphone Android** (fluidité, toucher). |

## 4. Plan d'exécution (priorités)

1. Prise en main : daba (A1, A2, A3), table de prise par arme et armes épaulées visibles (A4, A5).
2. Changement d'arme en étapes, sortie de sprint, arme basse (A6, A7, A8).
3. Construction : fantôme qui suit la visée et rotation (B1), matérialisation (B2), édition (B3), impacts (B4), mémoire (B5).
4. Caméra (C2), allocations (C1), contrôles tactiles (C3).
5. Tests : nouveaux scénarios obligatoires + tous les tests existants ; APK.

## 5. Après les corrections (v1.7)

| # | État | Détail |
|---|---|---|
| A1, A2, A3 | Corrigé | Daba tenue par le manche (IK), coup par-dessus l'épaule vers l'avant, dégâts à l'impact (0,3 s) |
| A4, A5 | Corrigé | Prise depuis l'épaule par catégorie (`HOLD`), armes visibles depuis la caméra |
| A6 | Corrigé | Changement en étapes avec étuis et transition du bras ; reprise depuis la pose ; **bug trouvé en route** : bots non dessinés bloqués après un changement d'arme |
| A7, A8 | Corrigé | Montée de l'arme avant le tir en sortie de sprint ; arme abaissée contre un obstacle |
| B1 | En partie | Rotation ajoutée ; pose « au loin » non faite (règles de montée rapide) — voir feuille de route |
| B2, B3, B4, B5 | Corrigé | Matérialisation, raccourcis et édition des rampes, tremblement, mémoire ; **bug introduit puis corrigé** : REJOUER (voir journal) |
| C1, C2, C3 | Corrigé | `addRot`, caméra à 3 rayons, bouton ÉCHANGE |
| C4 | Fait | Doublon retiré ; `animReal` gardé comme secours (sans clips d'animation) |
| A9 (trouvé pendant les mesures) | Corrigé | Main gauche de la Guerrière qui n'atteignait pas l'arme (bras de 0,41 m) |
