"""Job execution engine (runs inside workers).

Guarantees:
* **single executor** — a worker must hold the job's *lease* to run a stage or write a result.
  The lease is extended by a heartbeat while a stage runs; if it is lost (worker paused, network
  partition), the stage is cancelled and nothing is written;
* **resumable** — completed stages are recorded one by one; a retried job restarts at the first
  incomplete stage;
* **fair billing** — credits are captured only on success and refunded on any failure;
* **observable** — every transition is written to ``job_events`` with durations.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from contextlib import suppress
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any, Protocol

import structlog
from sqlalchemy import and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.metrics import JOB_STAGE_DURATION, JOBS_FINISHED
from edtech.infra.db import Database
from edtech.infra.queue import JobDispatcher, Queue
from edtech.infra.storage import ObjectStorage
from edtech.modules.credits import service as credits
from edtech.modules.jobs.models import EventLevel, Job, JobStatus
from edtech.modules.jobs.pipeline import (
    PipelineRegistry,
    StageContext,
    StageFailed,
    StageNeedsInput,
    StageResult,
    StageSpec,
)
from edtech.modules.jobs.service import add_event, check_transition
from edtech.settings import Settings

log = structlog.stdlib.get_logger(__name__)

_MAX_ERROR_TEXT = 500
_MAX_RETRY_DELAY_SECONDS = 600


class RunOutcome(StrEnum):
    SKIPPED = "skipped"  # déjà pris en charge, terminé ou introuvable
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    RETRY_SCHEDULED = "retry_scheduled"
    AWAITING_INPUT = "awaiting_input"
    HANDED_OFF = "handed_off"  # étape suivante sur une autre file
    LEASE_LOST = "lease_lost"


class JobNotifier(Protocol):
    """Informs the user (Telegram, web push...) when a job ends or needs input."""

    async def job_updated(self, job: Job) -> None: ...


class NullNotifier:
    async def job_updated(self, job: Job) -> None:
        return None


def retry_delay(attempt: int) -> float:
    return float(min(10 * 2 ** max(attempt - 1, 0), _MAX_RETRY_DELAY_SECONDS))


@dataclass
class JobRunner:
    db: Database
    registry: PipelineRegistry
    dispatcher: JobDispatcher
    settings: Settings
    storage: ObjectStorage
    worker_id: str
    notifier: JobNotifier = field(default_factory=NullNotifier)

    @property
    def _lease(self) -> timedelta:
        return timedelta(seconds=self.settings.job_lease_seconds)

    # --- Entry points --------------------------------------------------------------------------

    async def run(self, job_id: uuid.UUID, *, worker_queue: Queue | None = None) -> RunOutcome:
        structlog.contextvars.bind_contextvars(job_id=str(job_id))
        try:
            return await self._run(job_id, worker_queue)
        finally:
            structlog.contextvars.unbind_contextvars("job_id")

    async def reap(self) -> int:
        """Re-dispatch jobs whose message was lost or whose worker died. Returns the count."""
        to_dispatch: list[tuple[uuid.UUID, Queue]] = []
        async with self.db.session() as s:
            stale_threshold = func.now() - timedelta(
                seconds=self.settings.job_requeue_after_seconds
            )
            stmt = (
                select(Job)
                .where(
                    or_(
                        and_(Job.status == JobStatus.QUEUED, Job.updated_at < stale_threshold),
                        and_(Job.status == JobStatus.RUNNING, Job.lease_expires_at < func.now()),
                    )
                )
                .order_by(Job.updated_at)
                .limit(500)
                .with_for_update(skip_locked=True)
            )
            for job in (await s.execute(stmt)).scalars():
                if job.status == JobStatus.RUNNING:
                    # Travailleur disparu : l'essai est perdu, le traitement repart en file.
                    add_event(
                        s,
                        job.id,
                        "worker_lost",
                        level=EventLevel.WARNING,
                        data={"worker": job.lease_owner, "stage": job.current_stage},
                    )
                    job.status = JobStatus.QUEUED
                    job.attempt += 1
                    self._release_lease(job)
                job.updated_at = datetime.now(UTC)
                add_event(s, job.id, "reaper_redispatched")
                to_dispatch.append((job.id, Queue(job.queue)))
            await s.commit()
        for job_id, queue in to_dispatch:
            await self.dispatcher.dispatch(job_id, queue=queue)
        if to_dispatch:
            log.info("jobs_reaped", count=len(to_dispatch))
        return len(to_dispatch)

    # --- Orchestration -------------------------------------------------------------------------

    async def _run(self, job_id: uuid.UUID, worker_queue: Queue | None) -> RunOutcome:
        job = await self._acquire(job_id)
        if job is None:
            return RunOutcome.SKIPPED
        if job.attempt >= job.max_attempts:
            return await self._fail(job_id, "max_attempts_exceeded", "Nombre d'essais dépassé")
        try:
            stages = self.registry.get(job.kind)
        except LookupError:
            return await self._fail(job_id, "unknown_pipeline", "Type de traitement inconnu")
        for spec in stages:
            if spec.name in job.completed_stages:
                continue
            if worker_queue is not None and spec.queue != worker_queue:
                return await self._handoff(job_id, spec.queue)
            outcome, updated = await self._run_stage(job, spec)
            if outcome is not None:
                return outcome
            assert updated is not None  # noqa: S101 - invariant: no outcome means stage saved
            job = updated
        return await self._succeed(job_id)

    async def _run_stage(  # noqa: PLR0911 - one return per outcome reads best
        self, job: Job, spec: StageSpec
    ) -> tuple[RunOutcome | None, Job | None]:
        if not await self._mark_stage_started(job.id, spec.name):
            return RunOutcome.LEASE_LOST, None
        ctx = StageContext(
            job_id=job.id,
            user_id=job.user_id,
            kind=job.kind,
            stage=spec.name,
            attempt=job.attempt,
            input=job.input,
            outputs=job.outputs,
            settings=self.settings,
            db=self.db,
            storage=self.storage,
        )
        lease_lost = asyncio.Event()
        start = time.perf_counter()
        try:
            result = await self._with_heartbeat(
                job.id, lease_lost, asyncio.wait_for(spec.handler(ctx), spec.timeout_seconds)
            )
        except asyncio.CancelledError:
            if lease_lost.is_set():
                log.warning("job_lease_lost", stage=spec.name)
                return RunOutcome.LEASE_LOST, None
            raise
        except StageFailed as exc:
            self._observe(spec.name, "failed", start)
            outcome = await self._fail(
                job.id, exc.code, exc.message, stage=spec.name, data=exc.data
            )
            return outcome, None
        except StageNeedsInput as exc:
            self._observe(spec.name, "needs_input", start)
            return await self._await_input(job.id, spec.name, exc), None
        except Exception as exc:  # transitoire : délai dépassé, réseau, erreur inattendue
            self._observe(spec.name, "error", start)
            log.warning("job_stage_error", stage=spec.name, exc_info=True)
            return await self._retry_or_fail(job.id, spec, exc), None
        duration_ms = int((time.perf_counter() - start) * 1000)
        self._observe(spec.name, "ok", start)
        updated = await self._complete_stage(job.id, spec.name, result, duration_ms)
        if updated is None:
            return RunOutcome.LEASE_LOST, None
        return None, updated

    # --- Lease ---------------------------------------------------------------------------------

    async def _acquire(self, job_id: uuid.UUID) -> Job | None:
        lease_expired = and_(Job.status == JobStatus.RUNNING, Job.lease_expires_at < func.now())
        stmt = (
            update(Job)
            .where(Job.id == job_id, or_(Job.status == JobStatus.QUEUED, lease_expired))
            .values(
                status=JobStatus.RUNNING,
                lease_owner=self.worker_id,
                lease_expires_at=func.now() + self._lease,
                # Reprendre un traitement dont le travailleur a disparu compte comme un essai.
                attempt=Job.attempt + case((Job.status == JobStatus.RUNNING, 1), else_=0),
                started_at=func.coalesce(Job.started_at, func.now()),
            )
            .returning(Job)
        )
        async with self.db.session() as s:
            job = (await s.execute(stmt)).scalar_one_or_none()
            if job is not None:
                add_event(
                    s,
                    job.id,
                    "attempt_started",
                    data={"attempt": job.attempt, "worker": self.worker_id},
                )
            await s.commit()
        return job

    async def _owned(self, s: AsyncSession, job_id: uuid.UUID) -> Job | None:
        stmt = (
            select(Job)
            .where(
                Job.id == job_id,
                Job.status == JobStatus.RUNNING,
                Job.lease_owner == self.worker_id,
            )
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        return (await s.execute(stmt)).scalar_one_or_none()

    async def _extend_lease(self, job_id: uuid.UUID) -> bool:
        stmt = (
            update(Job)
            .where(
                Job.id == job_id,
                Job.status == JobStatus.RUNNING,
                Job.lease_owner == self.worker_id,
            )
            .values(lease_expires_at=func.now() + self._lease)
        )
        async with self.db.session() as s:
            result = await s.execute(stmt)
            await s.commit()
        return bool(getattr(result, "rowcount", 0) == 1)

    async def _heartbeat(
        self, job_id: uuid.UUID, task: asyncio.Future[Any], lease_lost: asyncio.Event
    ) -> None:
        interval = max(self.settings.job_lease_seconds / 3, 0.05)
        while not task.done():
            await asyncio.sleep(interval)
            if task.done():
                return
            try:
                extended = await self._extend_lease(job_id)
            except Exception:
                log.warning("job_heartbeat_error", exc_info=True)
                continue
            if not extended:
                lease_lost.set()
                task.cancel()
                return

    async def _with_heartbeat(
        self, job_id: uuid.UUID, lease_lost: asyncio.Event, coro: Any
    ) -> StageResult:
        task: asyncio.Future[StageResult] = asyncio.ensure_future(coro)
        heartbeat = asyncio.create_task(self._heartbeat(job_id, task, lease_lost))
        try:
            return await task
        finally:
            heartbeat.cancel()
            with suppress(asyncio.CancelledError):
                await heartbeat

    @staticmethod
    def _release_lease(job: Job) -> None:
        job.lease_owner = None
        job.lease_expires_at = None
        job.current_stage = None

    # --- Transitions ---------------------------------------------------------------------------

    async def _mark_stage_started(self, job_id: uuid.UUID, stage: str) -> bool:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return False
            job.current_stage = stage
            add_event(s, job_id, "stage_started", stage=stage)
            await s.commit()
        return True

    async def _complete_stage(
        self, job_id: uuid.UUID, stage: str, result: StageResult, duration_ms: int
    ) -> Job | None:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return None
            job.completed_stages = [*job.completed_stages, stage]
            job.outputs = {**job.outputs, stage: result.output}
            job.trace = [*job.trace, *(entry.as_dict() for entry in result.trace)]
            job.current_stage = None
            job.lease_expires_at = datetime.now(UTC) + self._lease
            for event, data in result.events:
                add_event(s, job_id, event, stage=stage, data=data)
            add_event(s, job_id, "stage_completed", stage=stage, duration_ms=duration_ms)
            await s.commit()
            return job

    async def _succeed(self, job_id: uuid.UUID) -> RunOutcome:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return RunOutcome.LEASE_LOST
            job.status = JobStatus.SUCCEEDED
            job.finished_at = datetime.now(UTC)
            self._release_lease(job)
            await credits.capture(s, job.user_id, job.id)
            add_event(s, job_id, "job_succeeded")
            await s.commit()
        JOBS_FINISHED.labels(job.kind, JobStatus.SUCCEEDED.value).inc()
        await self._notify(job)
        return RunOutcome.SUCCEEDED

    async def _fail_locked(
        self,
        s: AsyncSession,
        job: Job,
        code: str,
        message: str,
        *,
        stage: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> None:
        check_transition(job.status, JobStatus.FAILED)
        job.status = JobStatus.FAILED
        job.error_code = code
        job.error_message = message[:_MAX_ERROR_TEXT]
        job.finished_at = datetime.now(UTC)
        self._release_lease(job)
        await credits.release(s, job.user_id, job.id, reason=f"Échec du traitement ({code})")
        add_event(
            s,
            job.id,
            "job_failed",
            stage=stage,
            level=EventLevel.ERROR,
            data={"code": code, **(data or {})},
        )

    async def _fail(
        self,
        job_id: uuid.UUID,
        code: str,
        message: str,
        *,
        stage: str | None = None,
        data: dict[str, Any] | None = None,
    ) -> RunOutcome:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return RunOutcome.LEASE_LOST
            await self._fail_locked(s, job, code, message, stage=stage, data=data)
            await s.commit()
        JOBS_FINISHED.labels(job.kind, JobStatus.FAILED.value).inc()
        await self._notify(job)
        return RunOutcome.FAILED

    async def _retry_or_fail(
        self, job_id: uuid.UUID, spec: StageSpec, exc: BaseException
    ) -> RunOutcome:
        error = {
            "error_type": type(exc).__name__,
            "error": str(exc)[:_MAX_ERROR_TEXT],
        }
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return RunOutcome.LEASE_LOST
            job.attempt += 1
            if job.attempt >= job.max_attempts:
                await self._fail_locked(
                    s,
                    job,
                    "max_attempts_exceeded",
                    "Le traitement a échoué après plusieurs essais.",
                    stage=spec.name,
                    data=error,
                )
                await s.commit()
                JOBS_FINISHED.labels(job.kind, JobStatus.FAILED.value).inc()
                await self._notify(job)
                return RunOutcome.FAILED
            job.status = JobStatus.QUEUED
            job.queue = spec.queue.value
            self._release_lease(job)
            delay = retry_delay(job.attempt)
            add_event(
                s,
                job_id,
                "retry_scheduled",
                stage=spec.name,
                level=EventLevel.WARNING,
                data={**error, "attempt": job.attempt, "delay_seconds": delay},
            )
            await s.commit()
        await self.dispatcher.dispatch(job_id, queue=spec.queue, delay_seconds=delay)
        return RunOutcome.RETRY_SCHEDULED

    async def _await_input(self, job_id: uuid.UUID, stage: str, exc: StageNeedsInput) -> RunOutcome:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return RunOutcome.LEASE_LOST
            job.status = JobStatus.AWAITING_INPUT
            job.outputs = {
                **job.outputs,
                "_awaiting_input": {
                    "stage": stage,
                    "question_key": exc.question_key,
                    "params": exc.params,
                },
            }
            self._release_lease(job)
            add_event(
                s, job_id, "awaiting_input", stage=stage, data={"question_key": exc.question_key}
            )
            await s.commit()
        await self._notify(job)
        return RunOutcome.AWAITING_INPUT

    async def _handoff(self, job_id: uuid.UUID, queue: Queue) -> RunOutcome:
        async with self.db.session() as s:
            job = await self._owned(s, job_id)
            if job is None:
                return RunOutcome.LEASE_LOST
            job.status = JobStatus.QUEUED
            job.queue = queue.value
            self._release_lease(job)
            add_event(s, job_id, "handed_off", data={"queue": queue.value})
            await s.commit()
        await self.dispatcher.dispatch(job_id, queue=queue)
        return RunOutcome.HANDED_OFF

    # --- Helpers -------------------------------------------------------------------------------

    @staticmethod
    def _observe(stage: str, outcome: str, start: float) -> None:
        JOB_STAGE_DURATION.labels(stage, outcome).observe(time.perf_counter() - start)

    async def _notify(self, job: Job) -> None:
        try:
            await self.notifier.job_updated(job)
        except Exception:
            log.exception("job_notification_failed")
