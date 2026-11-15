# Fada Royale — Feuille de route (mise à jour v1.6)

Classée par priorité. Chaque point dit pourquoi il compte et ce qu'il demande. Les points réglés sont indiqués avec leur version.

## Priorité 1 — à faire avant une diffusion publique

1. **Mesurer sur de vrais téléphones Android** (entrée de gamme, milieu de gamme). Ouvrir le jeu avec `?stats=1`, noter FPS, temps de rendu, appels de dessin, triangles en Basse / Moyenne / Haute, au lobby, à l'atterrissage et en fin de partie. Les tests actuels utilisent un rendu logiciel : ils valident la logique, pas la vitesse réelle. (v1.3 : à-coup de la première arme supprimé, Basse ramenée à 75–105 appels de dessin à l'endroit mesuré ; à confirmer sur téléphone.) v1.6 : le décor réaliste coûte +8 % en Basse, +16 % en Moyenne, +26 % en Haute (rendu logiciel) ; vérifier sur téléphone que la Moyenne reste fluide, sinon réduire la portée des animaux ou passer le nouveau sol en Haute seulement.
2. **Licences des modèles 3D** : réglé en v1.2 pour le fusil, la mitraillette, le pompe, le sniper, la mitrailleuse et la daba (modèles créés pour le jeu). **Reste le revolver** (Colt, auteur non crédité) : il faut une image du revolver barillet fermé (prompt dans `PROMPTS_ASSETS.md`). Anciennement : MP5 et fusil à pompe sous CC BY-NC (pas d'usage commercial) ; sniper, Minimi et Colt sans auteur crédité. À remplacer par des modèles CC0 / CC BY ou faits maison avant tout usage commercial ou lien avec Renoi Studio. Les prompts de génération sont prêts dans `PROMPTS_ASSETS.md` (avec pièces séparées pour animer le vrai chargeur).
3. **Poids des persos** : la Guerrière fait ≈ 21 000 triangles, le Boss ≈ 12 000 ; 20 persos proches = jusqu'à 290 000 triangles même en Basse. Préparer des versions allégées (LOD de maillage : ≈ 3 000 à 5 000 triangles) avec un outil comme gltf-transform `simplify`, chargées pour les bots lointains.

## Priorité 2 — qualité de jeu

4. **IA** : monter à l'étage des maisons (v1.1 : ils entrent par la porte mais restent au rez-de-chaussée), se hisser sur les rebords comme le joueur (v1.3 : le joueur seulement), utilisation des rampes et des escaliers de toit, ~~se mettre à couvert derrière les murets~~ (fait en v1.3 : pour recharger, se soigner ou quand ils sont touchés ; reste : tirer en sortant de l'abri, fermer les portes derrière eux), niveaux de difficulté (facile / normal / difficile) choisis dans le lobby, variété de comportements (prudent, agressif).
5. **Combat** : ~~animations de rechargement par arme~~ (fait en v1.1), recul visuel de l'arme plus marqué, impacts sur les constructions, sons enregistrés au lieu de sons synthétisés.
6. **Construction** : v1.4 : pièces toujours à l'écran, pose au toucher et en continu, mur au bout de la rampe pour monter, édition au relâchement, pièces en instances. Reste : visée de la grille au regard (comme les jeux du genre, au lieu de « case du joueur + direction »), virages à 90° en montant (enchaînement mur / sol / rampe en tournant), rotation des rampes, édition des rampes et des toits, modes d'entraînement à la construction (duel en boîte, parcours chronométré), touches modifiables et manette, aperçu fantôme plus lisible au soleil, sons de pose par matériau.
7. **Animation de victoire** dans le lobby après un TOP 1 (aucun clip disponible : en ajouter un depuis une bibliothèque CC0).
8. ~~**Transitions d'armes**~~ : rangement puis sortie animés en v1.1.
8 ter. **Idées de l'autre version (`Fada_Royale_4.html`) pas encore reprises** : motos kabou-kabou, grenade à souffle (projette sans blesser), points faibles à la pioche (récolte plus rapide), forges d'amélioration d'armes, caisses à fouiller, raretés d'armes, touches modifiables, rotation des rampes. v1.5 a repris : appui de construction mémorisé, effondrement, contour du fantôme, perso face à la caméra avec jambes vers la marche, saut tolérant.
8 bis. **Maisons** : vraies fenêtres (ouvertures qui laissent passer la lumière et les balles), ~~portes qui s'ouvrent et se ferment~~ (fait en v1.3), meubles qui servent de couvert, portes qu'on peut casser.

## Priorité 3 — contenu et lobby

8 quater. **Décor (suite du pack v1.6)** : v1.6 a pris les 6 sols, les 2 ciels, 13 panoramas de villes, 11 animaux, 4 arbres et 5 rochers. À refaire pour pouvoir les utiliser : (a) la **carte** illustrée, régénérée en partant de `documentation/guides/carte_guide_sans_texte.jpg` pour qu'elle suive notre carte, puis mise sur la mini-carte ; (b) des **animaux en vrai volume avec squelette** et des clips (marche, broute) pour qu'ils se déplacent ; (c) un **acacia** et un **baobab** en volume (ceux du pack sont des plaques vus de côté) ; (d) piles de rochers, grès et termitières en volume, allégés (< 2 000 triangles). Aussi : maisons du pack (prompts prêts dans `PROMPTS_DECOR.md`, pas encore générées).

9. **Mode Entraînement enrichi** : parcours de construction, cibles mobiles, chronomètre.
10. **Événements** : défis à durée limitée calculés en local (comme les missions) une fois le système éprouvé.
11. **Apparences d'armes** dans la boutique (couleurs, motifs wax) — l'emplacement existe déjà.
12. **Nouveaux persos** : v1.2 : Touareg, Garde du W et Commerçante sont des costumes sur les corps du Boss et de la Guerrière. Pour des silhouettes vraiment différentes, il faut de vrais modèles 3D avec squelette (modèle 3D complet, pas « 2.5D ») ; prévoir l'adaptation de l'animation à leur squelette (correspondance des os, poses de repos).

## Priorité 4 — architecture

13. **Découpage progressif d'`index.html`** (≈ 2 400 lignes) dans `src/`, système par système, en gardant les tests verts à chaque étape. Ordre conseillé : `world/` (terrain, villes, végétation), `building/`, `combat/`, `enemies/` (IA), `audio/`, `interface/` (HUD, paramètres). Le lobby (`src/lobby/`) et le profil (`src/core/`) montrent déjà le principe : un module, une interface explicite.
14. **Modèles en fichiers `.glb`** au lieu du base64 dans du JS : ≈ 25 % de téléchargement en moins, décodage plus rapide.
15. ~~**Polices auto-hébergées**~~ : fait en v1.1 (`src/fonts/`).

## Hors de portée sans serveur

- Duo / Escouade / En ligne : demandent un serveur de jeu temps réel (synchronisation, anti-triche). Affichés « En développement » dans le lobby.
- Boutique en ligne, comptes, classements : aujourd'hui tout est local à l'appareil, par choix.
