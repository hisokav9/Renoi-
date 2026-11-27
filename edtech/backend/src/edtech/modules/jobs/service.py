"""Job creation and user-driven transitions (cancel, answer a clarification)."""

from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.errors import ConflictError, NotFoundError
from edtech.core.ids import uuid7
from edtech.infra.queue import JobDispatcher, Queue
from edtech.modules.credits import service as credits
from edtech.modules.jobs.models import (
    ALLOWED_TRANSITIONS,
    EventLevel,
    Job,
    JobEvent,
    JobStatus,
)
from edtech.modules.jobs.pipeline import PipelineRegistry

log = structlog.stdlib.get_logger(__name__)


def check_transition(current: str, target: JobStatus) -> None:
    if target not in ALLOWED_TRANSITIONS[JobStatus(current)]:
        raise ConflictError(f"Transition interdite : {current} → {target.value}")


def add_event(
    session: AsyncSession,
    job_id: uuid.UUID,
    event: str,
    *,
    stage: str | None = None,
    level: EventLevel = EventLevel.INFO,
    data: dict[str, Any] | None = None,
    duration_ms: int | None = None,
) -> None:
    session.add(
        JobEvent(
            job_id=job_id,
            event=event,
            stage=stage,
            level=level,
            data=data or {},
            duration_ms=duration_ms,
        )
    )


async def create_job(
    session: AsyncSession,
    dispatcher: JobDispatcher,
    registry: PipelineRegistry,
    *,
    user_id: uuid.UUID,
    kind: str,
    source: str,
    input: dict[str, Any],
    credits_cost: int = 0,
    max_attempts: int = 3,
) -> Job:
    """Create a job, reserve its credits atomically, then dispatch it. Commits.

    If dispatching fails after the commit, the job stays ``queued`` and the reaper dispatches it.
    """
    stages = registry.get(kind)
    job = Job(
        id=uuid7(),
        user_id=user_id,
        kind=kind,
        source=source,
        status=JobStatus.QUEUED,
        queue=stages[0].queue.value,
        stages=[s.name for s in stages],
        completed_stages=[],
        input=input,
        outputs={},
        trace=[],
        credits_cost=credits_cost,
        max_attempts=max_attempts,
    )
    session.add(job)
    await session.flush()
    if credits_cost > 0:
        await credits.reserve(session, user_id, job.id, credits_cost)
    add_event(session, job.id, "job_created", data={"kind": kind, "credits_cost": credits_cost})
    await session.commit()
    try:
        await dispatcher.dispatch(job.id, queue=Queue(job.queue))
    except Exception:
        log.exception("job_dispatch_failed", job_id=str(job.id))
    return job


async def get_job(session: AsyncSession, job_id: uuid.UUID) -> Job:
    job = await session.get(Job, job_id)
    if job is None:
        raise NotFoundError("Traitement introuvable")
    return job


async def list_user_jobs(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int = 20, offset: int = 0
) -> tuple[Sequence[Job], int]:
    base = select(Job).where(Job.user_id == user_id)
    total = (await session.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await session.execute(
            base.order_by(Job.created_at.desc(), Job.id.desc()).limit(limit).offset(offset)
        )
    ).scalars()
    return rows.all(), int(total)


async def list_events(session: AsyncSession, job_id: uuid.UUID) -> Sequence[JobEvent]:
    stmt = select(JobEvent).where(JobEvent.job_id == job_id).order_by(JobEvent.id)
    return (await session.execute(stmt)).scalars().all()


async def _lock(session: AsyncSession, job_id: uuid.UUID) -> Job | None:
    """Lock the job row and reload it: the session may hold a stale copy (identity map)."""
    stmt = (
        select(Job)
        .where(Job.id == job_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def cancel_job(session: AsyncSession, job_id: uuid.UUID, *, reason: str) -> Job:
    """Cancel a job that is not being processed, refunding its credits. Commits."""
    job = await _lock(session, job_id)
    if job is None:
        raise NotFoundError("Traitement introuvable")
    check_transition(job.status, JobStatus.CANCELLED)
    job.status = JobStatus.CANCELLED
    job.finished_at = datetime.now(UTC)
    await credits.release(session, job.user_id, job.id, reason=f"Annulation : {reason}")
    add_event(session, job.id, "job_cancelled", data={"reason": reason})
    await session.commit()
    return job


async def provide_input(
    session: AsyncSession,
    dispatcher: JobDispatcher,
    job_id: uuid.UUID,
    *,
    answer: dict[str, Any],
) -> Job:
    """Resume a job waiting for a clarification. Commits then dispatches."""
    job = await _lock(session, job_id)
    if job is None:
        raise NotFoundError("Traitement introuvable")
    check_transition(job.status, JobStatus.QUEUED)
    awaiting = dict(job.outputs.get("_awaiting_input") or {})
    stage = awaiting.get("stage", "unknown")
    answers = dict(job.input.get("answers") or {})
    answers[stage] = answer
    job.input = {**job.input, "answers": answers}
    job.outputs = {k: v for k, v in job.outputs.items() if k != "_awaiting_input"}
    job.status = JobStatus.QUEUED
    add_event(session, job.id, "input_received", stage=stage)
    await session.commit()
    await dispatcher.dispatch(job.id, queue=Queue(job.queue))
    return job
