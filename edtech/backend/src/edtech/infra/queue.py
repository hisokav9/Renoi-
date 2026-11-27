"""Job dispatch port.

The database is the source of truth for every job (state, journal, lease). The queue only carries
job identifiers, so a lost or duplicated message is harmless: the reaper re-dispatches stale jobs
and the runner's lease makes duplicate deliveries no-ops. See docs/adr/0002-file-de-taches.md.
"""

from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any, Protocol

RUN_JOB_TASK = "edtech.jobs.run"


class Queue(StrEnum):
    """Worker pools. Each queue can be scaled independently."""

    DEFAULT = "default"
    INGEST = "ingest"  # téléchargement, prétraitement, OCR
    AI = "ai"  # résolution, vérification (appels aux modèles)
    MEDIA = "media"  # voix off, animations, encodage vidéo (CPU intensif)


class JobDispatcher(Protocol):
    async def dispatch(
        self, job_id: uuid.UUID, *, queue: Queue = Queue.DEFAULT, delay_seconds: float = 0
    ) -> None: ...


@dataclass
class InMemoryDispatcher:
    """Test double that records dispatches."""

    dispatched: list[tuple[uuid.UUID, Queue, float]] = field(default_factory=list)

    async def dispatch(
        self, job_id: uuid.UUID, *, queue: Queue = Queue.DEFAULT, delay_seconds: float = 0
    ) -> None:
        self.dispatched.append((job_id, queue, delay_seconds))


class CeleryDispatcher:
    def __init__(self, celery_app: Any) -> None:
        self._app = celery_app

    async def dispatch(
        self, job_id: uuid.UUID, *, queue: Queue = Queue.DEFAULT, delay_seconds: float = 0
    ) -> None:
        # kombu publishing is blocking: keep it off the event loop.
        await asyncio.to_thread(
            self._app.send_task,
            RUN_JOB_TASK,
            args=[str(job_id)],
            queue=queue.value,
            countdown=delay_seconds or None,
        )
