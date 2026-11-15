# Fada Royale pour Android (APK)

L'application est une WebView plein écran qui affiche le jeu web. Les fichiers du jeu (`index.html`, `src/`, `assets/`, `lib/`), polices comprises (depuis la v1.1), sont **dans l'APK** : le jeu marche entièrement sans connexion.

- Android 7.0 minimum (API 24), cible Android 14 (API 34)
- Paysage, plein écran immersif, écran qui reste allumé
- Bouton retour : pause en partie, ferme le panneau ouvert dans le lobby, quitte depuis l'accueil
- Profil, réglages et progression gardés dans l'application (effacés si on la désinstalle)

## Installer sur le téléphone

1. Copier `FadaRoyale-1.3.apk` sur le téléphone (ou l'ouvrir depuis le téléchargement).
2. L'ouvrir. Android demande d'autoriser « l'installation d'applis inconnues » pour l'application qui l'ouvre (Fichiers, Chrome…) : accepter.
3. Play Protect peut afficher un avertissement (application qui ne vient pas du Play Store) : « Installer quand même ».

Pour installer une **nouvelle version par-dessus** (sans perdre la progression) : elle doit être signée avec la **même clé** et avoir un `versionCode` plus grand (dans `AndroidManifest.xml`).

## Construire l'APK

```bash
cd fada-royale
python3 android/build_apk.py
```

Il faut Java 17+ et Python 3 avec Pillow. Le script télécharge lui-même ses outils depuis Maven Central (dans `android/.tools/`) et produit `android/dist/FadaRoyale-<version>.apk`.

Le SDK Android officiel n'est pas nécessaire :

| Étape | Outil |
|---|---|
| Compilation Java | `javac` contre `android-all` (classes Android 14, Robolectric) |
| Bytecode Android | `dalvik-dx` (dx d'Android, repackagé) |
| Manifeste et ressources binaires | `tools/apkbin.py` (écrit le format AXML / resources.arsc) |
| Signature | `tools/Signer.java` + `apksig` (bibliothèque de Google) ; schéma v2, vérifié aussitôt |

Les fichiers du jeu sont servis à l'adresse `https://appassets.androidplatform.net/` (adresse interne, jamais envoyée sur le réseau) par `MainActivity.serve()` : les modules JavaScript et le `localStorage` ont besoin d'une vraie origine, ce que `file://` ne fournit pas.

## Clé de signature

Créée au premier lancement dans `android/keystore/` avec son mot de passe (`keystore.properties`). **Elle n'est jamais mise dans git** (le dépôt est public : quelqu'un pourrait signer une fausse mise à jour). Garde-la en lieu sûr : pour reconstruire une version installable par-dessus l'ancienne, remets les deux fichiers dans `android/keystore/` avant de lancer le script.

Pour une publication sur le Play Store, il faudra une clé dédiée et un Android App Bundle (AAB) : à voir le moment venu.

## Vérifications faites (v1.1)

- Signature v2 validée ; **même certificat que la 1.0** (SHA-256 commençant par `3DB2BF18C0ABE4BE`) et `versionCode` 11 : la 1.1 s'installe par-dessus la 1.0 en gardant la progression.
- Jeu extrait de l'APK et servi exactement comme par l'application, hors ligne : 0 fichier manquant, 0 erreur JavaScript, polices du jeu affichées sans Internet.
- Toujours pas testé sur un vrai téléphone.

## Vérifications faites (v1.0)

- Signature v2 validée par `ApkVerifier` (apksig).
- APK relu par androguard : paquet, version, nom, icône (5 densités), activité principale, min/target SDK, permission, thème, signature v2, classes Java compilées.
- Fichiers non compressés alignés sur 4 octets (exigé par Android 11+ pour resources.arsc).
- Le jeu, extrait de l'APK et servi exactement comme le fait l'application (même adresse, mêmes types de fichiers), démarre jusqu'au lancement d'une partie dans un navigateur qui imite un téléphone Android, hors ligne, sans erreur JavaScript.
- **Pas encore testé sur un vrai téléphone** : aucun émulateur Android n'est disponible dans l'environnement de construction.
