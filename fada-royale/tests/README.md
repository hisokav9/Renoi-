# Tests automatiques de Fada Royale

Ces scripts pilotent le jeu dans un navigateur sans écran (Playwright + Chromium) grâce à l'objet de débogage `window.FR` exposé par `index.html`. Ils servent à vérifier une modification sans avoir à jouer à la main.

## Préparer

```bash
npm i -D playwright          # une seule fois (fournit Chromium : npx playwright install chromium)
cd fada-royale
python3 -m http.server 8000  # dans un autre terminal
```

Tous les scripts prennent l'adresse du jeu en premier argument : `http://localhost:8000/index.html`.

## Les scripts

| Script | Ce qu'il vérifie | Exemple |
|---|---|---|
| `animtest.cjs` | **Banc d'animation** : 14 situations (course, sprint, cercle, caméra rapide, visée, tir, saut, glissade, arrêt, changement d'arme, daba…) ; mesure la dérive du buste, les sauts du buste et des bras d'une image à l'autre, la norme des quaternions | `node tests/animtest.cjs URL boss /tmp/out 0` puis `guerriere` |
| `skiptest.cjs` | Même banc + nombre d'images où le mixeur three.js n'écrit pas un os (cause du bug du buste qui tournait) | `node tests/skiptest.cjs URL boss /tmp/out 0` |
| `sim.cjs` | Parties complètes en accéléré (bots) : erreurs, positions invalides, fin de partie | `node tests/sim.cjs URL x 3` |
| `flows.cjs` | Tir, armes, lunette, construction, édition, soins, pause, fin de partie, rejouer, retour | `node tests/flows.cjs URL x /tmp/out desktop` (ou `mobile`) |
| `lobbytest.cjs` | Lobby : persos, boutique, missions, événements, profil, pseudo, modes, JOUER, fin de partie et récompenses, retour, entraînement | `node tests/lobbytest.cjs URL /tmp/out desktop` (`mobile`, `portrait`) |
| `fixes2.cjs` | Corrections v0.9.1 : reste des piles de butin, pas de soin après la mort, tempête après le TOP 1 | `node tests/fixes2.cjs URL` |
| `ddatest.cjs` | Rayons par la grille de collisions = mêmes résultats que le test de toutes les boîtes | `node tests/ddatest.cjs URL` |
| `decals.cjs` | Impacts sur les murs et lumière du coup de feu | `node tests/decals.cjs URL` |
| `tris.cjs` | Répartition des triangles par catégorie (persos, décor, terrain, végétation…) | `node tests/tris.cjs URL br` |
| `profiles.cjs` | Appels de dessin et triangles des profils Basse / Moyenne / Haute, dans la même partie au même endroit | `node tests/profiles.cjs URL` |
| `probe.cjs` | Durée de chaque image dans le lobby et au lancement (repère les saccades) | `node tests/probe.cjs URL` |

## Limites

Les tests tournent avec un rendu logiciel (SwiftShader) : les **durées de rendu** ne reflètent pas un vrai téléphone (la compilation des shaders et la lecture de pixels y sont beaucoup plus lentes). Les vérifications de logique (animations, collisions, parties, interface) sont, elles, exactes. Les performances réelles doivent être confirmées sur un appareil Android (option `?stats=1`).
