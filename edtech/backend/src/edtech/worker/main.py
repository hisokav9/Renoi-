"""Celery worker entry point.

    celery -A edtech.worker.main worker -Q default,ingest,ai,media --concurrency 4
    celery -A edtech.worker.main beat

Each prefork child process owns one asyncio event loop and one resource container, created lazily
on first use (connections are never shared across forks).
"""

from __future__ import annotations

import asyncio
import os
import secrets
import socket
import uuid
from dataclasses import dataclass
from typing import Any

from celery import signals

from edtech.container import Container
from edtech.core.logging import configure_logging, get_logger
from edtech.infra.queue import RUN_JOB_TASK, CeleryDispatcher, Queue
from edtech.modules.jobs.runner import JobRunner
from edtech.settings import get_settings
from edtech.worker.celery_app import REAP_TASK, create_celery_app

settings = get_settings()
app = create_celery_app(settings)
log = get_logger("edtech.worker")


@signals.setup_logging.connect
def _setup_logging(**_kwargs: Any) -> None:
    configure_logging(settings.log_level, json=settings.log_json)


@dataclass
class _Runtime:
    pid: int
    loop: asyncio.AbstractEventLoop
    container: Container
    runner: JobRunner


_runtime: _Runtime | None = None


def get_runtime() -> _Runtime:
    global _runtime  # noqa: PLW0603 - one runtime per process by design
    if _runtime is None or _runtime.pid != os.getpid():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        container = Container.build(settings, worker=True, dispatcher=CeleryDispatcher(app))
        worker_id = f"{socket.gethostname()}:{os.getpid()}:{secrets.token_hex(3)}"
        runner = JobRunner(
            db=container.db,
            registry=container.registry,
            dispatcher=container.dispatcher,
            settings=settings,
            storage=container.storage,
            worker_id=worker_id,
        )
        _runtime = _Runtime(os.getpid(), loop, container, runner)
        log.info("worker_runtime_started", worker_id=worker_id)
    return _runtime


@signals.worker_process_shutdown.connect
def _shutdown(**_kwargs: Any) -> None:
    if _runtime is not None and _runtime.pid == os.getpid():
        _runtime.loop.run_until_complete(_runtime.container.aclose())


def _queue_of(delivery_info: dict[str, Any] | None) -> Queue | None:
    routing_key = (delivery_info or {}).get("routing_key")
    if not isinstance(routing_key, str):
        return None
    try:
        return Queue(routing_key)
    except ValueError:
        return None


@app.task(name=RUN_JOB_TASK, bind=True)
def run_job(self: Any, job_id: str) -> str:
    runtime = get_runtime()
    outcome = runtime.loop.run_until_complete(
        runtime.runner.run(uuid.UUID(job_id), worker_queue=_queue_of(self.request.delivery_info))
    )
    return outcome.value


@app.task(name=REAP_TASK)
def reap_jobs() -> int:
    runtime = get_runtime()
    return runtime.loop.run_until_complete(runtime.runner.reap())
