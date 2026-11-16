# Fada Royale — v2.0

Battle royale du Sahel en 3D (three.js), jouable dans le navigateur sur PC et téléphone.
20 à 60 joueurs (toi + 19 à 59 bots, réglable), taxi-brousse volant, harmattan qui se resserre en 18 min, construction en banco, carte du Niger de 680 m de côté et 21 lieux.

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

- **Nouveau en v2.0** : arsenal (8 armes, 5 raretés par arme, 4 types de munitions, lâcher / reprendre / remplacer, fusil tactique et pompe tactique modélisés dans le code), construction en continu avec mode SIMPLE ou AVANCÉ et constructions deux fois plus solides, 5 profils graphiques et limite d'images selon l'écran, HUD personnalisable (taille, opacité, masquer, dispositions Classique / Compacte / Construction / Personnalisée), carte agrandie avec 8 nouveaux lieux, parties de 15 à 20 min, 19 à 59 bots en 3 niveaux, emotes (salut, bravo, victoire, danse).
- **v1.7 (armes en main, construction)** : armes épaulées à droite et visibles derrière le perso (arme basse, combat, visée, sprint, abaissée contre un mur), daba tenue par le manche avec un vrai coup par-dessus l'épaule, changement d'arme en étapes (étui dans le dos ou à la hanche) et bouton ÉCHANGE, sortie de sprint avant le tir, rotation des pièces (R / TOURNER), matérialisation et tremblement des pièces, raccourcis PORTE / FENÊTRE / DEMI-MUR et édition des rampes, caméra plus proche en combat. Audit : `documentation/FADA_ROYALE_V17_AUDIT.md`.
- **v1.6 (décor réaliste)** : sols photo mélangés selon les zones (sable, dunes ridées, latérite, herbe sèche, gravier de l'Aïr, terre craquelée), vrai ciel du Sahel et ciel d'harmattan pendant la tempête, image de la ville à l'arrivée dans 9 zones (v1.6.1 : seulement celles qui ressemblent au jeu), 51 animaux (girafes, dromadaires, zébus, chèvres, moutons, ânes, pintades, éléphants, hippos, vautours), palmiers doum et dattiers, neems et karités, rochers de granite. Tiré d'un pack généré à partir de `documentation/PROMPTS_DECOR.md`.
- **v1.5** : plus de mur dans le vide en haut des rampes (une pièce doit tenir sur quelque chose), effondrement de ce qui n'est plus relié au sol, appui de construction mémorisé (mur et rampe dans n'importe quel ordre), perso toujours face à la caméra avec les jambes vers la marche (réglable), saut tolérant au bord et juste avant d'atterrir. Idées reprises d'une autre version du jeu.
- **v1.4 (construction rapide)** : les 4 pièces toujours à l'écran (appui = pose, doigt gardé = pose en continu), le mur se place au bout de la rampe pour monter vite, édition validée en relâchant, banco illimité et effacement des constructions à l'Entraînement, onglet de réglages Construction, limite d'images, pièces dessinées en instances (fluide avec des centaines de pièces).
- **v1.3** : le perso se tourne avec la caméra même à l'arrêt ; plus de grimpe le long des murs, on se hisse seulement sur un rebord à portée de main (muret, mur, toit) ; portes de maisons qui s'ouvrent et se ferment (E ou bouton OUVRIR LA PORTE), ouvertes aussi par les bots ; bots qui se mettent à couvert pour recharger ou se soigner ; plus d'à-coup à la première sortie d'une arme, moins d'appels de dessin en Basse.
- **v1.2** : armes créées pour le jeu (fusil d'assaut, mitraillette, pompe, sniper, mitrailleuse, daba ; chargeurs réels au rechargement), persos Touareg, Garde du W et Commerçante construits sur les corps 3D animés, textures de sol, banco, enduit et wax tirées des images du jeu, service à thé dans le lobby, illustration sur l'écran de chargement.
- **v1.1** : maisons ouvertes (on entre par la porte, butin et coffres à l'intérieur, étage avec escalier dans les maisons hautes), escalade (se hisser sur un rebord, grimper aux murs ; remplacée en v1.3 par « se hisser » seulement), rechargement propre à chaque arme (chargeur, barillet, bande, cartouche par cartouche), culasse et pompe animées, revolver à une main hors combat, kilishi et thé animés, parapente qui s'ouvre au-dessus de la tête, personnage qui se tourne vers où il va, HUD refait (icônes dessinées pour le jeu, silhouettes des armes, boussole), polices incluses (plus besoin d'Internet).

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
| `src/core/weapon-handling.js` | v1.7 : prise des armes par catégorie, étuis, durées de changement d'arme, coup de daba |
| `src/core/arsenal.js` | v2.0 : catalogue des armes (statistiques, raretés, munitions, butin) |
| `src/core/weapon-models.js` | v2.0 : fusil tactique et pompe tactique modélisés dans le code |
| `src/core/building.js` | v2.0 : PV, temps de pose et coût des constructions |
| `src/core/match.js` | v2.0 : taille de la carte, phases de la tempête, nombre et niveaux des bots |
| `assets/armes/`, `assets/objets/` | Modèles 3D des armes, chargeurs, kilishi, verre de thé, théière (GLB) |
| `assets/textures/`, `assets/images/` | Textures (sol, banco, enduit, wax), illustration de l'écran de chargement ; v1.6 : 6 sols (`textures/sols/`), panoramas des villes (`images/lieux/`) |
| `assets/decor/` | v1.6 : ciels, animaux, arbres et rochers du pack de décor (GLB, JPG) |
| `src/fonts/` | Polices Bungee et Rubik (licence SIL OFL), hébergées avec le jeu |
| `assets/` | Modèles 3D des persos et des armes, animations |
| `lib/three/` | three.js r160 (licence MIT), hébergé avec le jeu |
| `android/` | Application Android : activité WebView, construction de l'APK sans SDK, signature |
| `tests/` | Tests automatiques (animations, parties, lobby, collisions, profils) — voir `tests/README.md` |
| `documentation/` | Audit, journal des modifications, rapport de tests, feuille de route de la v1.0 |

## Documentation

- `documentation/FADA_ROYALE_V2_AUDIT.md` : audit de la v2.0 et résultats.
- `documentation/FADA_ROYALE_V1_CHANGELOG.md` commence par la v2.0 (arsenal, construction, graphismes, HUD, carte, bots, emotes), puis la v1.7 (armes en main, construction), puis la v1.6 (décor réaliste), la v1.5 (mur dans le vide, idées de l'autre version), la v1.4 (construction rapide), puis la v1.3 (caméra, se hisser, portes, couvert des bots, fluidité), la v1.2, la v1.1 et la v1.0.
- `documentation/PROMPTS_ASSETS.md` : prompts pour générer les modèles 3D et images qui manquent (armes sans problème de licence, accessoires, persos, textures).
- `documentation/PROMPTS_DECOR.md` : prompts pour un décor réaliste (kits de maisons, arbres, animaux, rochers, sols, ciel, carte illustrée, bannières des villes) ; `documentation/guides/` : vue du ciel de la vraie carte, avec et sans noms.

- `documentation/FADA_ROYALE_V1_AUDIT.md` : structure du projet, diagnostic du bug du buste qui tournait à 360° (cause démontrée), risques, plan de tests.
- `documentation/FADA_ROYALE_V1_CHANGELOG.md` : chaque modification (problème, cause, fichiers, correction, test, résultat, ce qui reste).
- `documentation/FADA_ROYALE_V1_TEST_REPORT.md` : résultats mesurés et conditions de validation.
- `documentation/FADA_ROYALE_V1_ROADMAP.md` : la suite, par priorité.

## À savoir

- **Licences** : depuis la v1.2, les armes sont des modèles créés pour le jeu ; seul le revolver (Colt) reste un modèle importé sans auteur crédité, à remplacer avant toute diffusion commerciale (voir la feuille de route).
- **Performances** : testées dans un navigateur à rendu logiciel, pas encore sur un vrai téléphone Android. Faire une mesure avec `?stats=1`.
