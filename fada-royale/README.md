# Fada Royale — v1.0

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

- **Lobby 3D** : perso en vedette sur une estrade sahélienne, modes de jeu (Battle Royale, Entraînement), personnages, boutique locale (tenues, planeurs, cadres), missions du jour et de la semaine, profil avec statistiques réelles. Tout est enregistré sur l'appareil ; les cauris se gagnent en jouant, aucun achat réel.
- **Carte** : Niamey et le pont Kennedy, Agadez (fort et Grande Mosquée), Zinder, Maradi, Dosso, Kouré, Ténéré, Arlit (mine d'uranium), Ayorou, Tahoua, Diffa et le lac Tchad, Parc du W, Tillabéri, massif de l'Aïr, fleuve Niger.
- **Qualité** Basse / Moyenne / Haute (⚙️ › Graphismes) : chaque profil change la résolution, les ombres, la distance de vue et le niveau de détail.

## Contenu du dossier

| Chemin | Rôle |
|---|---|
| `index.html` | Le jeu (monde, persos, armes, physique, IA, HUD, paramètres) |
| `src/lobby/` | Lobby 3D et ses menus (`lobby.js`, `lobby.css`) |
| `src/core/profile.js` | Profil local : pseudo, statistiques, niveau, cauris, missions, boutique |
| `assets/` | Modèles 3D des persos et des armes, animations |
| `lib/three/` | three.js r160 (licence MIT), hébergé avec le jeu |
| `android/` | Application Android : activité WebView, construction de l'APK sans SDK, signature |
| `tests/` | Tests automatiques (animations, parties, lobby, collisions, profils) — voir `tests/README.md` |
| `documentation/` | Audit, journal des modifications, rapport de tests, feuille de route de la v1.0 |

## Documentation v1.0

- `documentation/FADA_ROYALE_V1_AUDIT.md` : structure du projet, diagnostic du bug du buste qui tournait à 360° (cause démontrée), risques, plan de tests.
- `documentation/FADA_ROYALE_V1_CHANGELOG.md` : chaque modification (problème, cause, fichiers, correction, test, résultat, ce qui reste).
- `documentation/FADA_ROYALE_V1_TEST_REPORT.md` : résultats mesurés et conditions de validation.
- `documentation/FADA_ROYALE_V1_ROADMAP.md` : la suite, par priorité.

## À savoir

- **Licences** : le MP5 et le fusil à pompe sont sous licence CC BY-NC (pas d'usage commercial) ; sniper, Minimi et Colt sans auteur crédité. À régler avant toute diffusion commerciale (voir la feuille de route).
- **Performances** : testées dans un navigateur à rendu logiciel, pas encore sur un vrai téléphone Android. Faire une mesure avec `?stats=1`.
