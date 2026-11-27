# ADR 0002 — File de tâches : Celery sur Redis, état en PostgreSQL

- Statut : accepté
- Date : 2026-11-27

## Contexte

Les traitements (OCR, appels aux modèles, rendu vidéo) durent de quelques secondes à plusieurs
minutes, échouent parfois et doivent être traçables (§5 : identifiant, état, journal) et facturés
équitablement (remboursement en cas d'échec technique). Le cahier des charges impose Redis pour
les files.

## Décision

- **Celery** avec Redis comme broker : outil éprouvé, plusieurs files (`default`, `ingest`, `ai`,
  `media`), tâches périodiques (beat), `acks_late` pour ne rien perdre si un worker meurt.
- **PostgreSQL est la source de vérité** : la file ne transporte que l'identifiant du traitement.
  État, étapes terminées, journal, bail et essais sont en base.
- Un **bail** (propriétaire + échéance, prolongé par battement de cœur) garantit qu'un seul worker
  exécute un traitement ; les messages dupliqués ou rejoués sont sans effet.
- Une tâche de **récupération** renvoie en file les traitements perdus.
- Le code métier dépend d'un port (`JobDispatcher`), pas de Celery : changer d'outil ne touche que
  `infra/queue.py` et `worker/`.
- Chaque processus worker possède une boucle asyncio persistante (le code métier est asynchrone).

## Alternatives écartées

- arq / SAQ / Taskiq : natifs asyncio et plus légers, mais moins répandus (arq est en maintenance
  seule). Le port permet d'y passer plus tard si besoin.
- File en PostgreSQL (`SKIP LOCKED`) : élégante (création et mise en file atomiques), mais le
  cahier des charges impose Redis ; la récupération compense l'absence d'atomicité.

## Conséquences

- Le délai de visibilité Redis (4 h) doit rester supérieur à la durée maximale d'un traitement.
- Beat doit tourner en **une seule instance**.
- Les métriques Prometheus des workers nécessiteront le mode multiprocessus (ou un push) : à faire
  avec les premières étapes réelles (phase 2). Les durées d'étapes sont déjà en base
  (`job_events.duration_ms`).
