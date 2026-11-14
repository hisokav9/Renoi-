# Fada Royale — v0.9.1

Battle royale 100 % Niger en 3D (three.js), jouable dans le navigateur sur PC et téléphone.
20 joueurs (toi + 19 bots), taxi-brousse volant, harmattan qui se resserre, construction en banco.

## Lancer le jeu

Le jeu utilise des modules JavaScript : il faut l'ouvrir via un petit serveur web (un double-clic sur `index.html` ne marche pas).

```bash
cd fada-royale
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Options dans l'adresse :
- `?stats=1` : affiche FPS, temps de calcul, appels de dessin, triangles.
- `?touch=1` / `?touch=0` : force les commandes tactiles ou clavier/souris.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Tout le jeu (HTML, CSS, code) |
| `assets/` | Modèles 3D des persos et des armes, animations (encodés en JS) |
| `lib/three/` | three.js r160 (licence MIT), hébergé avec le jeu |

## v0.9.1 — corrections

Audit complet de la v0.9 : lecture de tout le code, parties complètes simulées en accéléré (aucune erreur, aucune position invalide, la partie se termine bien), tests des actions (tir, armes, lunette, construction, édition, soins, paramètres, fin de partie, rejouer) sur PC et sur téléphone en mode paysage (iPhone 13, et un petit Android type Galaxy S8 pour l'affichage). Tests faits dans un navigateur simulé : à confirmer sur un vrai téléphone.

**Affichage mobile**
- Le haut du menu (« Ton skin » et le haut des persos) était coupé sur les téléphones en paysage, sans pouvoir défiler jusque-là. Corrigé.
- Le bouton 🏃 sprint cachait la 6e case d'arme (et deux cases sur les petits Android). La barre de vie et les armes sont maintenant centrées dans la place libre.
- Dans le taxi-brousse, le bouton SAUTER recouvrait la vie et le bouclier. Il est remonté sur les petits écrans.

**Démarrage**
- three.js venait d'un CDN (jsdelivr) : sans ce site, écran de chargement bloqué pour toujours. Il est maintenant dans `lib/`, le jeu démarre même hors ligne.
- Si le démarrage échoue quand même, un message l'explique au lieu d'un chargement infini.

**Jeu**
- PC portables à écran tactile : ils recevaient les commandes de téléphone (boutons à l'écran, qualité basse). Le mode tactile n'est plus choisi que si l'écran tactile est le pointeur principal.
- Ctrl sert à s'accroupir, et Ctrl+W ferme l'onglet : le navigateur demande maintenant confirmation avant de quitter une partie en cours.
- Une pile de butin ramassée en partie disparaissait entièrement (ex. 3 kilishi par terre avec 4 sur toi : 1 pris, 2 perdus). Le reste reste maintenant par terre.
- Un joueur éliminé pendant qu'il mangeait son kilishi regagnait 25 PV après sa mort ; il pouvait aussi encore manger, recharger ou échanger une arme. Corrigé.
- Le recul des armes pouvait pousser la visée au-delà de la limite haute. Corrigé.
- Le son (vent de l'harmattan) continuait pendant la pause et quand l'onglet ou l'appli passait en arrière-plan. Il se coupe maintenant.
- Après un TOP 1 dans la tempête finale, l'harmattan continuait de blesser (et pouvait éliminer) le gagnant derrière l'écran de victoire. Corrigé.

## Pistes pour la v1.0

1. **Licences des modèles 3D** : le MP5 et le fusil à pompe sont sous licence CC BY-NC (pas d'usage commercial), et le sniper, la Minimi et le Colt n'ont pas d'auteur crédité. À remplacer ou à compléter avant toute diffusion publique ou usage commercial.
2. **Performances sur téléphone** : mesurer sur un vrai téléphone d'entrée/milieu de gamme avec `?stats=1`, puis selon les chiffres : mode « très basse qualité », moins de bots animés au loin, ombres simplifiées.
3. **Poids du téléchargement** : les modèles sont stockés en texte base64 (≈ 2,7 Mo). En fichiers `.glb` normaux, environ 25 % de moins à télécharger et un démarrage plus rapide.
4. **Bots** : dans les simulations, 6 à 7 bots sur 19 sont éliminés dans la première minute et les bots construisent peu. Possibles : niveaux de difficulté, bots qui montent des rampes et se soignent mieux.
5. **Sons** : actuellement synthétisés ; de vrais enregistrements (tirs, pas, ambiance) changeraient beaucoup l'ambiance.
