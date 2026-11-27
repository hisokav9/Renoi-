# Déploiement, retour arrière et exploitation

> État : procédure rédigée et image vérifiée (construction, migrations, démarrage, sondes), mais
> **aucun environnement de staging ni de production n'existe encore**. Le premier déploiement
> staging est la prochaine étape d'exploitation (voir la feuille de route).

## Environnements

| | Développement | Staging | Production |
|---|---|---|---|
| `EDTECH_ENVIRONMENT` | `development` | `staging` | `production` |
| Données | locales, jetables | anonymisées ou synthétiques | réelles |
| Bot Telegram | bot de test | **bot distinct** (ex. `…_staging_bot`) | bot officiel |
| Stockage | disque local ou MinIO | bucket dédié | bucket dédié, versionné |
| Documentation `/docs` | oui | oui | non |

Staging et production refusent de démarrer avec une configuration dangereuse (secret JWT par
défaut, stockage local, URL publique non HTTPS, `/metrics` non protégé, bot sans secret de
webhook).

## Infrastructure cible

**Hébergeur retenu : Render.** Procédure pas à pas : [deploiement-render.md](deploiement-render.md).
Le reste de ce document décrit les principes, valables quel que soit l'hébergeur.

Services managés, sans Kubernetes au lancement ([ADR 0001](adr/0001-monolithe-modulaire.md)).
N'importe quel fournisseur offrant des conteneurs managés convient ; critères : région proche des
serveurs Telegram et des utilisateurs (Europe de l'Ouest), PostgreSQL managé avec sauvegardes
point-in-time, Redis managé, stockage S3 avec chiffrement, gestionnaire de secrets.

| Processus | Commande | Instances |
|---|---|---|
| API | commande par défaut de l'image (`uvicorn … --proxy-headers`) | ≥ 2, derrière l'équilibreur HTTPS |
| Worker | `celery -A edtech.worker.main worker -Q default,ingest --concurrency 4` | ≥ 1 par file, à l'échelle |
| Worker IA | `celery -A edtech.worker.main worker -Q ai --concurrency 8` | à partir de la phase 3 |
| Worker média | `celery -A edtech.worker.main worker -Q media --concurrency 1` | à partir de la phase 5 (CPU) |
| Beat | `celery -A edtech.worker.main beat -s /tmp/celerybeat-schedule` | **exactement 1** |
| Migrations | `alembic upgrade head` | tâche ponctuelle à chaque version |

Sondes : vivacité `GET /health/live`, disponibilité `GET /health/ready` (base, Redis, stockage).
L'image définit un `HEALTHCHECK` HTTP pour l'API : le désactiver pour les workers et beat (comme
dans `docker-compose.yml`), qui n'écoutent pas de port.

## Livraison d'une version

1. La CI (`.github/workflows/edtech-backend.yml`) passe : ruff, mypy strict, tests sur
   PostgreSQL et Redis réels (couverture ≥ 80 %), construction de l'image, test de démarrage.
2. Construire et pousser l'image avec un tag immuable : `edtech-backend:<sha du commit>`
   (`--build-arg APP_VERSION=<sha>`). Ne jamais déployer `latest`.
3. **Staging** :
   1. lancer la tâche de migration avec la nouvelle image ;
   2. déployer API, workers et beat avec la nouvelle image ;
   3. vérifier `GET /health/ready` (le champ `version` doit être le nouveau sha) ;
   4. recette manuelle avec le bot de staging : `/start`, inscription, compte, historique, aide,
      assistance ; vérifier les journaux (aucune erreur) et les métriques.
4. **Production** : mêmes étapes avec la même image (pas de reconstruction), de préférence en
   déploiement progressif si la plateforme le permet. Puis `edtech telegram-webhook-info` :
   `pending_update_count` doit redescendre à 0 et `last_error_message` être vide.

### Règle des migrations : « étendre puis contracter »

Pendant un déploiement, l'ancienne et la nouvelle version tournent en même temps. Chaque
migration doit donc être compatible avec la version précédente du code :

- ajouter une colonne : nullable ou avec valeur par défaut ;
- renommer/supprimer une colonne : en deux versions (1. le code n'utilise plus l'ancienne
  colonne ; 2. une version suivante la supprime) ;
- index sur grosse table : `CREATE INDEX CONCURRENTLY` (migration hors transaction).

Cette règle rend le retour arrière du code possible **sans** toucher à la base.

## Retour arrière

1. Redéployer l'image précédente (tag du sha précédent) pour l'API, les workers et beat. Les
   traitements en cours sont repris automatiquement (bail + récupération) ; aucun crédit n'est
   perdu (réservations libérées ou consommées une seule fois).
2. Vérifier `GET /health/ready` (`version` = ancien sha) et le webhook Telegram.
3. Ne revenir en arrière sur le schéma (`alembic downgrade <révision>`) que si la migration
   elle-même est en cause, après sauvegarde, et seulement si elle est réversible sans perte.
   Sinon, corriger par une nouvelle migration.
4. Si le bot est en cause et ne peut pas être corrigé vite : `edtech telegram-delete-webhook`
   coupe l'arrivée des messages (Telegram les conserve 24 h) ; `edtech telegram-set-webhook` les
   rétablit.

## Sauvegardes

- PostgreSQL : sauvegardes automatiques chiffrées du service managé avec restauration
  point-in-time (rétention ≥ 14 jours), plus un export logique quotidien vers un autre compte ou
  une autre région. **Tester une restauration chaque trimestre** et consigner la durée.
- Stockage objet : versionnement activé, règle de cycle de vie alignée sur la politique de
  conservation (les documents d'élèves ne doivent pas survivre à leur durée de conservation dans
  les sauvegardes au-delà du délai annoncé).
- Redis : rien à sauvegarder (données reconstructibles).

## Surveillance

- **Erreurs** : Sentry (`EDTECH_SENTRY_DSN`), configuré pour ne transmettre aucune donnée
  personnelle (ni utilisateur, ni corps de requête, ni variables locales).
- **Métriques** (`GET /metrics`, jeton `EDTECH_METRICS_TOKEN`) : requêtes HTTP par route et
  statut, latences, mises à jour Telegram par type et résultat, durée des étapes, traitements
  terminés par statut, opérations de crédits.
- **Alertes recommandées** : taux de 5xx > 1 % sur 5 min ; latence p95 du webhook > 2 s ;
  `edtech_telegram_updates_total{outcome="error"}` en hausse ; traitements `failed` en hausse ;
  `/health/ready` en échec ; `pending_update_count` du webhook > 100.
- **Journaux** : JSON sur la sortie standard, avec `request_id`, `user_id` (identifiant interne)
  et `job_id` ; aucune donnée personnelle (masquage automatique).
- **Coûts** : chaque étape enregistre sa durée ; à partir de la phase 3, jetons et coût des appels
  aux modèles seront enregistrés dans `jobs.trace` pour suivre le coût par correction.

## Premier déploiement (check-list)

- [ ] Créer les ressources managées (PostgreSQL 16, Redis 7, bucket S3 chiffré et versionné).
- [ ] Créer les secrets : `EDTECH_JWT_SECRET` (≥ 32 caractères aléatoires),
      `EDTECH_TELEGRAM_BOT_TOKEN`, `EDTECH_TELEGRAM_WEBHOOK_SECRET`, `EDTECH_METRICS_TOKEN`,
      identifiants S3, `EDTECH_SENTRY_DSN`.
- [ ] Lancer `alembic upgrade head` puis `edtech seed`.
- [ ] Déployer API, worker, beat ; vérifier `/health/ready`.
- [ ] `edtech telegram-set-webhook` puis `edtech telegram-webhook-info`.
- [ ] Écrire au bot, puis `edtech set-role --telegram-id <votre id> --role admin`.
- [ ] Brancher les alertes et tester une restauration de sauvegarde.
