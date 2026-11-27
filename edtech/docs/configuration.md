# Configuration

Toutes les variables sont préfixées par `EDTECH_` (définition : `src/edtech/settings.py`). En
développement, elles peuvent être placées dans `backend/.env` (modèle : `.env.example`). En
staging et production, elles viennent du gestionnaire de secrets de l'hébergeur.

🔒 = secret (jamais dans le dépôt ni dans les journaux). ⚠️ = obligatoire hors développement.

## Général

| Variable | Défaut | Rôle |
|---|---|---|
| `ENVIRONMENT` | `development` | `development`, `test`, `staging`, `production`. Staging et production appliquent les contrôles de sécurité au démarrage. |
| `APP_VERSION` | `0.1.0` | Version affichée par `/health/ready` (l'image la fixe au sha du commit). |
| `LOG_LEVEL` | `INFO` | Niveau des journaux. |
| `LOG_JSON` | `true` | Journaux JSON (mettre `false` en local pour un affichage lisible). |
| `PUBLIC_BASE_URL` | — | URL HTTPS publique de l'API (webhook Telegram). Sur Render : `RENDER_EXTERNAL_URL`, fixée par `render.yaml`. |
| `CORS_ALLOWED_ORIGINS` | `[]` | Origines autorisées pour le futur site web (liste JSON). |

## Données

| Variable | Défaut | Rôle |
|---|---|---|
| `DATABASE_URL` 🔒⚠️ | base locale | `postgresql+asyncpg://…` ; les formes `postgres://` et `postgresql://` des bases managées sont converties automatiquement. |
| `DATABASE_POOL_SIZE` / `DATABASE_MAX_OVERFLOW` | `10` / `10` | Connexions par processus API. |
| `REDIS_URL` 🔒⚠️ | `redis://localhost:6379/0` | Cache, limites, état du bot. |
| `BROKER_URL` 🔒 | = `REDIS_URL` | Broker Celery si distinct. |
| `STORAGE_BACKEND` ⚠️ | `local` | `local` (développement uniquement), `s3`, ou `disabled` (aucun fichier stocké : accepté hors développement tant que `FEATURE_CORRECTIONS_ENABLED=false`). |
| `STORAGE_LOCAL_PATH` | `./var/storage` | Dossier du stockage local. |
| `S3_BUCKET` ⚠️, `S3_ENDPOINT_URL`, `S3_REGION` | — | Bucket S3 ou compatible (R2, Scaleway, OVH, MinIO…). |
| `S3_ACCESS_KEY_ID` 🔒, `S3_SECRET_ACCESS_KEY` 🔒 | — | Laisser vide pour utiliser le rôle de l'hébergeur. |

## Sécurité

| Variable | Défaut | Rôle |
|---|---|---|
| `JWT_SECRET` 🔒⚠️ | valeur de développement | Signature des jetons d'accès (32 caractères minimum). |
| `JWT_ISSUER` | `edtech-api` | Émetteur des jetons. |
| `JWT_ACCESS_TTL_SECONDS` | `900` | Durée des jetons d'accès. |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Durée des sessions. |
| `METRICS_TOKEN` 🔒⚠️ | — | Jeton exigé par `GET /metrics`. |
| `RATE_LIMIT_TELEGRAM_PER_MINUTE` | `30` | Messages par minute et par utilisateur Telegram. |
| `RATE_LIMIT_AUTH_PER_MINUTE` | `20` | Appels d'authentification par minute et par IP. |

## Telegram

| Variable | Défaut | Rôle |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` 🔒 | — | Jeton BotFather. Vide = bot désactivé. |
| `TELEGRAM_WEBHOOK_SECRET` 🔒⚠️ | — | Secret du webhook (obligatoire si un bot est configuré hors développement). N'importe quel format : la valeur transmise à Telegram en est dérivée (empreinte SHA-256). |
| `TELEGRAM_BOT_USERNAME` | — | Identifiant du bot. |
| `TELEGRAM_LOGIN_MAX_AGE_SECONDS` | `86400` | Fraîcheur maximale d'une connexion Telegram (web). |
| `SUPPORT_CHAT_ID` | — | Groupe Telegram qui reçoit les tickets d'assistance. Sans groupe, l'équipe (rôles `support` et `admin`) est prévenue en message privé. |
| `ADMIN_TELEGRAM_IDS` | — | Identifiants Telegram promus administrateurs à leur prochain message (`123` ou `123,456`). Ne rétrograde jamais personne. |

## Règles métier et traitements

| Variable | Défaut | Rôle |
|---|---|---|
| `DEFAULT_LOCALE` | `fr` | Langue par défaut. |
| `SIGNUP_FREE_CREDITS` | `5` | Crédits offerts à l'inscription. |
| `FEATURE_CORRECTIONS_ENABLED` | `false` | Ouvre la correction dans le bot (à activer quand le pipeline est livré). |
| `JOB_LEASE_SECONDS` | `300` | Durée du bail d'un worker (prolongé automatiquement). |
| `JOB_MAX_ATTEMPTS` | `3` | Essais maximum d'un traitement. |
| `JOB_REQUEUE_AFTER_SECONDS` | `120` | Délai avant qu'un traitement en attente soit renvoyé en file. |

## Hébergement

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` (sans préfixe) | `8000` | Port d'écoute de l'API dans le conteneur (fourni par l'hébergeur). |

## Observabilité

| Variable | Défaut | Rôle |
|---|---|---|
| `SENTRY_DSN` 🔒 | — | Active Sentry (sans données personnelles). |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.0` | Échantillonnage des traces de performance. |
