# Fada Royale — Feuille de route après la v1.0

Classée par priorité. Chaque point dit pourquoi il compte et ce qu'il demande.

## Priorité 1 — à faire avant une diffusion publique

1. **Mesurer sur de vrais téléphones Android** (entrée de gamme, milieu de gamme). Ouvrir le jeu avec `?stats=1`, noter FPS, temps de rendu, appels de dessin, triangles en Basse / Moyenne / Haute, au lobby, à l'atterrissage et en fin de partie. Les tests actuels utilisent un rendu logiciel : ils valident la logique, pas la vitesse réelle.
2. **Licences des modèles 3D** : MP5 et fusil à pompe sous CC BY-NC (pas d'usage commercial) ; sniper, Minimi et Colt sans auteur crédité. À remplacer par des modèles CC0 / CC BY ou faits maison avant tout usage commercial ou lien avec Renoi Studio.
3. **Poids des persos** : la Guerrière fait ≈ 21 000 triangles, le Boss ≈ 12 000 ; 20 persos proches = jusqu'à 290 000 triangles même en Basse. Préparer des versions allégées (LOD de maillage : ≈ 3 000 à 5 000 triangles) avec un outil comme gltf-transform `simplify`, chargées pour les bots lointains.

## Priorité 2 — qualité de jeu

4. **IA** : utilisation des rampes et des escaliers de toit, se mettre à couvert derrière les murets, niveaux de difficulté (facile / normal / difficile) choisis dans le lobby, variété de comportements (prudent, agressif).
5. **Combat** : animations de rechargement par arme (aujourd'hui une seule animation procédurale), recul visuel de l'arme plus marqué, impacts sur les constructions, sons enregistrés au lieu de sons synthétisés.
6. **Construction** : aperçu fantôme plus lisible au soleil, rotation des rampes au doigt, édition des toits (cônes), sons de pose par matériau.
7. **Animation de victoire** dans le lobby après un TOP 1 (aucun clip disponible : en ajouter un depuis une bibliothèque CC0).
8. **Transitions d'armes** : animation de rangement / sortie pour supprimer le petit saut de bras restant.

## Priorité 3 — contenu et lobby

9. **Mode Entraînement enrichi** : parcours de construction, cibles mobiles, chronomètre.
10. **Événements** : défis à durée limitée calculés en local (comme les missions) une fois le système éprouvé.
11. **Apparences d'armes** dans la boutique (couleurs, motifs wax) — l'emplacement existe déjà.
12. **Nouveaux persos** : la boutique et la sélection les accepteront sans changement de structure (ajout dans `SKINS` + fichiers dans `assets/`).

## Priorité 4 — architecture

13. **Découpage progressif d'`index.html`** (≈ 2 400 lignes) dans `src/`, système par système, en gardant les tests verts à chaque étape. Ordre conseillé : `world/` (terrain, villes, végétation), `building/`, `combat/`, `enemies/` (IA), `audio/`, `interface/` (HUD, paramètres). Le lobby (`src/lobby/`) et le profil (`src/core/`) montrent déjà le principe : un module, une interface explicite.
14. **Modèles en fichiers `.glb`** au lieu du base64 dans du JS : ≈ 25 % de téléchargement en moins, décodage plus rapide.
15. **Polices auto-hébergées** (Bungee, Rubik : licence OFL) pour que le lobby garde son identité hors ligne.

## Hors de portée sans serveur

- Duo / Escouade / En ligne : demandent un serveur de jeu temps réel (synchronisation, anti-triche). Affichés « En développement » dans le lobby.
- Boutique en ligne, comptes, classements : aujourd'hui tout est local à l'appareil, par choix.
