# Fada Royale — v1.2

Battle royale du Sahel en 3D (three.js), jouable dans le navigateur sur PC et téléphone.
20 joueurs (toi + 19 bots), taxi-brousse volant, harmattan qui se resserre, construction en banco, carte du Niger de 480 m de côté.

## Version Android (APK)

`android/` construit une application Android (WebView plein écran, jeu inclus, fonctionne hors ligne) : `python3 android/build_apk.py`. Détails, installation et clé de signature : `android/README.md`.

## Lancer le jeu

Le jeu utilise des modules JavaScript : il faut l'ouvrir via un petit serveur web (un double-clic sur `index.html` ne marche pas).

```bash
cd fada-royale
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Options dans l'adresse :
- `?stats=1` : affiche FPS, temps de calcul, appels de dessin, triangles (utile pour mesurer sur un téléphone).
- `?touch=1` / `?touch=0` : force les commandes tactiles ou clavier/souris.

## Ce qu'il y a dedans

- **Nouveau en v1.2** : armes créées pour le jeu (fusil d'assaut, mitraillette, pompe, sniper, mitrailleuse, daba ; chargeurs réels au rechargement), persos Touareg, Garde du W et Commerçante construits sur les corps 3D animés, textures de sol, banco, enduit et wax tirées des images du jeu, service à thé dans le lobby, illustration sur l'écran de chargement.
- **v1.1** : maisons ouvertes (on entre par la porte, butin et coffres à l'intérieur, étage avec escalier dans les maisons hautes), escalade (se hisser sur un rebord, grimper aux murs), rechargement propre à chaque arme (chargeur, barillet, bande, cartouche par cartouche), culasse et pompe animées, revolver à une main hors combat, kilishi et thé animés, parapente qui s'ouvre au-dessus de la tête, personnage qui se tourne vers où il va, HUD refait (icônes dessinées pour le jeu, silhouettes des armes, boussole), polices incluses (plus besoin d'Internet).

- **Lobby 3D** : perso en vedette sur une estrade sahélienne, modes de jeu (Battle Royale, Entraînement), personnages, boutique locale (tenues, planeurs, cadres), missions du jour et de la semaine, profil avec statistiques réelles. Tout est enregistré sur l'appareil ; les cauris se gagnent en jouant, aucun achat réel.
- **Carte** : Niamey et le pont Kennedy, Agadez (fort et Grande Mosquée), Zinder, Maradi, Dosso, Kouré, Ténéré, Arlit (mine d'uranium), Ayorou, Tahoua, Diffa et le lac Tchad, Parc du W, Tillabéri, massif de l'Aïr, fleuve Niger.
- **Qualité** Basse / Moyenne / Haute (Paramètres › Graphismes) : chaque profil change la résolution, les ombres, la distance de vue et le niveau de détail.

## Contenu du dossier

| Chemin | Rôle |
|---|---|
| `index.html` | Le jeu (monde, persos, armes, physique, IA, HUD, paramètres) |
| `src/lobby/` | Lobby 3D et ses menus (`lobby.js`, `lobby.css`) |
| `src/core/profile.js` | Profil local : pseudo, statistiques, niveau, cauris, missions, boutique |
| `src/core/weapons.js` | Calage des armes 3D : poignée, canon à l'horizontale, points d'appui des mains |
| `assets/armes/`, `assets/objets/` | Modèles 3D des armes, chargeurs, kilishi, verre de thé, théière (GLB) |
| `assets/textures/`, `assets/images/` | Textures (sol, banco, enduit, wax) et illustration de l'écran de chargement |
| `src/fonts/` | Polices Bungee et Rubik (licence SIL OFL), hébergées avec le jeu |
| `assets/` | Modèles 3D des persos et des armes, animations |
| `lib/three/` | three.js r160 (licence MIT), hébergé avec le jeu |
| `android/` | Application Android : activité WebView, construction de l'APK sans SDK, signature |
| `tests/` | Tests automatiques (animations, parties, lobby, collisions, profils) — voir `tests/README.md` |
| `documentation/` | Audit, journal des modifications, rapport de tests, feuille de route de la v1.0 |

## Documentation

- `documentation/FADA_ROYALE_V1_CHANGELOG.md` commence par la v1.1 (maisons, escalade, armes, animations, HUD), puis la v1.0.
- `documentation/PROMPTS_ASSETS.md` : prompts pour générer les modèles 3D et images qui manquent (armes sans problème de licence, accessoires, persos, textures).

- `documentation/FADA_ROYALE_V1_AUDIT.md` : structure du projet, diagnostic du bug du buste qui tournait à 360° (cause démontrée), risques, plan de tests.
- `documentation/FADA_ROYALE_V1_CHANGELOG.md` : chaque modification (problème, cause, fichiers, correction, test, résultat, ce qui reste).
- `documentation/FADA_ROYALE_V1_TEST_REPORT.md` : résultats mesurés et conditions de validation.
- `documentation/FADA_ROYALE_V1_ROADMAP.md` : la suite, par priorité.

## À savoir

- **Licences** : depuis la v1.2, les armes sont des modèles créés pour le jeu ; seul le revolver (Colt) reste un modèle importé sans auteur crédité, à remplacer avant toute diffusion commerciale (voir la feuille de route).
- **Performances** : testées dans un navigateur à rendu logiciel, pas encore sur un vrai téléphone Android. Faire une mesure avec `?stats=1`.
