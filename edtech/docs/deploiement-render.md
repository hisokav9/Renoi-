# Déployer sur Render

Le fichier [`render.yaml`](../../render.yaml) (à la racine du dépôt) décrit toute
l'infrastructure : Render la crée en une fois (« Blueprint »). Tout se fait depuis le tableau de
bord Render, y compris sur téléphone. Aucun terminal n'est nécessaire.

## Ce qui est créé

| Ressource | Rôle | Offre | Prix mensuel* |
|---|---|---|---|
| `edtech-api` (web, Docker) | Webhook Telegram, API, sondes de santé | `0.5c-512mb` | 7 $ |
| `edtech-worker` (background worker) | Traitements asynchrones + tâches périodiques | `0.5c-512mb` | 7 $ |
| `edtech-db` (PostgreSQL 16) | Base de données, disque de 5 Go | `0.1c-256mb` | 6 $ + 1,50 $ (disque) |
| `edtech-redis` (Key Value) | Files de tâches, limites anti-abus | `256mb` | 10 $ |
| **Total** | | | **≈ 31,50 $** |

\* Tarifs lus sur render.com/pricing le 27/11/2026, hors taxes, espace de travail « Hobby » (0 $).
Les offres gratuites ne conviennent pas : le service web s'endort après 15 min sans trafic, la
base gratuite expire après 30 jours, et ni la commande de pré-déploiement ni les workers ne sont
disponibles.

Tout est en **région Frankfurt**. La base et Redis n'acceptent que les connexions venant des
services Render (`ipAllowList: []`).

## Ce que le Blueprint règle automatiquement

- **Secrets générés par Render** : `EDTECH_JWT_SECRET`, `EDTECH_TELEGRAM_WEBHOOK_SECRET` et
  `EDTECH_METRICS_TOKEN`. Personne n'a besoin de les connaître.
- **Avant chaque version**, la commande `edtech release` applique les migrations, met à jour le
  catalogue pédagogique, puis déclare le webhook et les commandes du bot auprès de Telegram. Si
  elle échoue, Render ne bascule pas sur la nouvelle version.
- **Déploiement automatique** à chaque modification de `edtech/backend/`, mais seulement si la CI
  GitHub est verte (`autoDeployTrigger: checksPass`).
- **Mise en service** : la nouvelle version ne reçoit du trafic qu'une fois `/health/ready` OK.
- **Premier administrateur** : les comptes Telegram listés dans `EDTECH_ADMIN_TELEGRAM_IDS`
  deviennent administrateurs à leur premier message au bot.
- **Stockage de fichiers désactivé** (`EDTECH_STORAGE_BACKEND=disabled`) : rien n'est stocké tant
  que la correction n'est pas ouverte. La phase 2 ajoutera un stockage S3 (Render n'en propose
  pas ; Cloudflare R2 par exemple). La configuration refuse d'activer la correction sans S3.

## Mise en route (≈ 15 minutes)

1. **Nouveau jeton du bot.** Dans @BotFather : `/mybots` → EdTech → *API Token* → *Revoke
   current token*. Notez le nouveau jeton : il ira uniquement dans Render.
2. **Compte Render.** Sur [dashboard.render.com](https://dashboard.render.com), inscrivez-vous
   avec **GitHub** et autorisez l'accès au dépôt `hisokav9/Renoi-`. Ajoutez une carte bancaire
   (*Billing*).
3. **Blueprint.** *New* → *Blueprint* → choisissez le dépôt `Renoi-` et la branche qui contient
   `render.yaml` (normalement `main`). Render affiche les 4 ressources et le groupe
   `edtech-shared`.
4. **Deux valeurs à saisir :**
   - `EDTECH_TELEGRAM_BOT_TOKEN` : le nouveau jeton de l'étape 1 ;
   - `EDTECH_ADMIN_TELEGRAM_IDS` : votre identifiant Telegram (un nombre ; plusieurs
     identifiants séparés par des virgules).
5. **Valider** (*Deploy Blueprint*). La première construction prend environ 5 à 10 minutes.
6. **Vérifier :**
   - `edtech-api` → *Logs* : les lignes `1/3`, `2/3`, `3/3 Webhook Telegram…` du pré-déploiement ;
   - l'adresse du service (`https://edtech-api….onrender.com`) suivie de `/health/ready` doit
     afficher `"status":"ok"` ;
   - dans Telegram : `/start` puis `/admin`.

## Au quotidien

- **Journaux** : chaque service → *Logs* (au format JSON, sans données personnelles).
- **Revenir à la version précédente** : `edtech-api` → *Events* → déploiement précédent →
  *Rollback*. Faire de même pour `edtech-worker`. Les migrations sont écrites pour rester
  compatibles avec la version précédente (voir [deploiement.md](deploiement.md)).
- **Sauvegardes** : PostgreSQL payant inclut la restauration à un instant donné (3 jours en
  « Hobby », 7 jours en « Pro ») : `edtech-db` → *Recovery*. Faire aussi un export régulier.
- **Ajouter un administrateur** : ajoutez son identifiant Telegram dans
  `EDTECH_ADMIN_TELEGRAM_IDS` (`edtech-api` → *Environment*), puis redéployez.
- **Changer le jeton du bot** : modifiez `EDTECH_TELEGRAM_BOT_TOKEN` dans `edtech-api` puis
  redéployez. Le pré-déploiement redéclare le webhook avec le nouveau jeton.
- **Montée en charge** : augmentez l'offre (`plan`) ou le nombre d'instances de `edtech-api` ;
  ajoutez des workers dédiés par file quand les traitements arriveront (phases 2 à 5). Le worker
  contient aussi beat (`--beat`) : il doit rester à **une seule instance**. Au-delà, créez un
  service beat séparé.

## Environnement de test (staging)

Le Blueprint actuel crée la **production**. Pour un staging, dupliquez `render.yaml` avec
d'autres noms de ressources (`edtech-staging-…`), un **bot Telegram de test** et la branche de
votre choix.
