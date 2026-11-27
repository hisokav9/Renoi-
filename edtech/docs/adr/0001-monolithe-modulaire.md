# ADR 0001 — Monolithe modulaire et services managés

- Statut : accepté
- Date : 2026-11-27

## Contexte

Le cahier des charges demande une architecture évolutive, extractible en microservices, sans
imposer Kubernetes au lancement. L'équipe est réduite et le trafic initial (Niger) est inconnu.

## Décision

- Une seule base de code Python (FastAPI), découpée en modules métier indépendants
  (`modules/<domaine>`), déployée comme **une image** utilisée par trois types de processus : API,
  workers (un groupe par file) et beat.
- Les modules ne se parlent que via leurs services ; aucune requête SQL ne traverse un module.
- Hébergement sur des **conteneurs managés** (type Cloud Run, ECS Fargate, Fly.io, Scaleway
  Serverless Containers…) avec PostgreSQL, Redis et stockage S3 managés.

## Conséquences

- Un seul déploiement, une seule base, des transactions simples (ex. créer un traitement et
  réserver ses crédits atomiquement).
- Les traitements lourds (IA, vidéo) sont isolés dans des workers dimensionnés séparément.
- À réévaluer quand un module a des besoins d'échelle ou de cycle de vie propres (probablement le
  studio vidéo) : il sera extrait derrière la file existante, sans changer l'API.
