# Plateforme EdTech IA (nom commercial à définir)

Plateforme qui lit, corrige et explique des exercices scolaires (photo, PDF, sujet complet) avec
une correction structurée, de l'audio et de la vidéo pédagogique. Marché initial : Niger.

Ce dossier contient le **backend** (monolithe modulaire FastAPI + workers asynchrones). Le cahier
des charges complet est découpé en phases ; voir [la feuille de route](docs/feuille-de-route.md).

| Phase | Contenu | État |
|---|---|---|
| 0 | Fondations et architecture | ✅ livrée |
| 1 | Bot Telegram et gestion des utilisateurs | ✅ livrée (hors paiements, phase 7) |
| 2 | Réception et lecture des épreuves | à faire |
| 3 → 8 | Correction, vérification, audio/vidéo, bibliothèque, monétisation, web | à faire |

## Ce qui fonctionne aujourd'hui

- **Bot Telegram** : `/start`, inscription guidée (langue → pays → niveau → classe → série),
  menu principal, compte et crédits, historique, préférences, aide, assistance, suppression de
  compte. Textes en français et en anglais.
- **Administration dans le bot** (`/admin`, réservé à l'équipe) : statistiques, réponse aux
  tickets d'assistance, ajout de crédits.
- **API REST v1** : connexion Telegram (widget web et Mini App), jetons d'accès + rafraîchissement
  avec rotation, profil, crédits, traitements, catalogue pédagogique, administration.
- **Moteur de traitements** : chaque traitement a un identifiant unique, un état, un journal
  d'exécution, la trace des modèles utilisés, des essais automatiques et un **remboursement
  automatique des crédits en cas d'échec**. Il est prêt à recevoir les étapes du pipeline de
  correction (phases 2 à 5).
- **Crédits** : grand livre avec réservation / consommation / remboursement, idempotent et sûr en
  cas d'accès concurrents.
- **Catalogue pédagogique par pays** : Niger en brouillon (à valider par un pédagogue).
- **Sécurité** : contrôle d'accès par rôles, journal d'audit, limites anti-abus, journaux sans
  données personnelles, configuration de production vérifiée au démarrage.
- **Exploitation** : image Docker non-root, Compose, migrations Alembic, sondes de santé,
  métriques Prometheus, Sentry, intégration continue.

## Démarrer en local

Prérequis : Python 3.12+, [uv](https://docs.astral.sh/uv/), Docker.

```bash
cd edtech/backend
cp .env.example .env
make services     # PostgreSQL, Redis, MinIO (docker compose)
make install      # dépendances
make migrate      # schéma de base de données
make seed         # catalogue pédagogique (Niger)
make run          # API sur http://localhost:8000 (documentation : /docs)
make worker       # dans un autre terminal
make beat         # tâches périodiques (récupération des traitements bloqués)
```

Ou toute la pile en conteneurs : `docker compose up --build` (depuis `edtech/`).

Pour brancher un vrai bot Telegram : [docs/telegram.md](docs/telegram.md).

## Vérifier

```bash
make check        # ruff + mypy strict + tests (PostgreSQL et Redis réels requis)
make cov          # couverture
```

## Organisation du code

```
backend/
  src/edtech/
    settings.py           configuration (variables EDTECH_*)
    main.py               application FastAPI
    container.py          ressources partagées (BDD, Redis, stockage, file, Telegram)
    core/                 erreurs, journaux, sécurité, i18n, limites, métriques
    infra/                base de données, stockage objet, file de tâches
    modules/              un dossier par domaine métier
      users/ auth/ credits/ curriculum/ jobs/ telegram/ support/ audit/
    api/routes/           routes HTTP versionnées (/api/v1)
    worker/               workers Celery et tâches périodiques
    locales/              textes affichés (fr, en)
    cli.py                commandes d'exploitation (edtech --help)
  migrations/             migrations Alembic
  tests/                  tests unitaires et d'intégration
docs/                     architecture, décisions (ADR), déploiement, sécurité
```

## Documentation

- [Architecture](docs/architecture.md)
- [Décisions d'architecture (ADR)](docs/adr/)
- [Configuration](docs/configuration.md)
- [Déploiement et retour arrière](docs/deploiement.md) · [sur Render](docs/deploiement-render.md)
- [Sécurité et confidentialité](docs/securite.md)
- [Bot Telegram](docs/telegram.md)
- [Feuille de route](docs/feuille-de-route.md)
- [Comparatif des fournisseurs d'IA](docs/comparatif-fournisseurs-ia.md)
