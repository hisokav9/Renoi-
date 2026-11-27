"""Celery configuration (broker only: job state lives in PostgreSQL)."""

from __future__ import annotations

from celery import Celery
from kombu.entity import Queue as KombuQueue

from edtech.infra.queue import Queue
from edtech.settings import Settings

REAP_TASK = "edtech.jobs.reap"


def create_celery_app(settings: Settings) -> Celery:
    app = Celery("edtech", broker=settings.effective_broker_url)
    app.conf.update(
        task_default_queue=Queue.DEFAULT.value,
        task_queues=[KombuQueue(q.value, routing_key=q.value) for q in Queue],
        task_serializer="json",
        accept_content=["json"],
        task_ignore_result=True,
        # Un message n'est acquitté qu'après exécution : un travailleur qui meurt ne perd rien.
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        worker_prefetch_multiplier=1,
        # Doit dépasser la durée maximale d'un traitement (rendu vidéo), sinon Redis redistribue
        # le message ; le bail en base rend de toute façon les doublons inoffensifs.
        broker_transport_options={"visibility_timeout": 4 * 3600},
        broker_connection_retry_on_startup=True,
        worker_hijack_root_logger=False,
        timezone="UTC",
        beat_schedule={"reap-jobs": {"task": REAP_TASK, "schedule": 60.0}},
    )
    return app
