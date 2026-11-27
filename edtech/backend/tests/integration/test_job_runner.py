from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select, update

from edtech.container import Container
from edtech.core.errors import ConflictError, InsufficientCreditsError
from edtech.infra.queue import InMemoryDispatcher, Queue
from edtech.modules.credits.models import CreditAccount
from edtech.modules.jobs import service as jobs
from edtech.modules.jobs.models import Job, JobEvent, JobStatus
from edtech.modules.jobs.pipeline import (
    PipelineRegistry,
    StageContext,
    StageFailed,
    StageNeedsInput,
    StageResult,
    StageRetryable,
    StageSpec,
    TraceEntry,
)
from edtech.modules.jobs.runner import JobNotifier, JobRunner, RunOutcome
from tests.conftest import create_user


class RecordingNotifier(JobNotifier):
    def __init__(self) -> None:
        self.statuses: list[str] = []

    async def job_updated(self, job: Job) -> None:
        self.statuses.append(job.status)


def make_runner(
    container: Container, notifier: JobNotifier | None = None, worker: str = "w1"
) -> JobRunner:
    runner = JobRunner(
        db=container.db,
        registry=container.registry,
        dispatcher=container.dispatcher,
        settings=container.settings,
        storage=container.storage,
        worker_id=worker,
    )
    if notifier is not None:
        runner.notifier = notifier
    return runner


async def ok_stage(ctx: StageContext) -> StageResult:
    previous = sorted(ctx.outputs)
    return StageResult(
        output={"stage": ctx.stage, "seen": previous},
        trace=[TraceEntry(stage=ctx.stage, provider="fake", model="m-1", version="2026-11")],
        events=[("custom_metric", {"pages": 1})],
    )


async def new_job(container: Container, kind: str, cost: int = 2, max_attempts: int = 3) -> Job:
    user = await create_user(container)
    async with container.db.session() as s:
        return await jobs.create_job(
            s,
            container.dispatcher,
            container.registry,
            user_id=user.id,
            kind=kind,
            source="api",
            input={"mode": "text"},
            credits_cost=cost,
            max_attempts=max_attempts,
        )


async def load(container: Container, job_id: uuid.UUID) -> Job:
    async with container.db.session() as s:
        job = await s.get(Job, job_id)
        assert job is not None
        return job


async def events(container: Container, job_id: uuid.UUID) -> list[str]:
    async with container.db.session() as s:
        return [e.event for e in await jobs.list_events(s, job_id)]


async def balance(container: Container, user_id: uuid.UUID) -> tuple[int, int]:
    async with container.db.session() as s:
        acc = (
            await s.execute(select(CreditAccount).where(CreditAccount.user_id == user_id))
        ).scalar_one()
        return acc.balance, acc.reserved


async def test_successful_pipeline_records_everything(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    registry.register(
        "demo",
        [
            StageSpec("extract", ok_stage),
            StageSpec("solve", ok_stage),
            StageSpec("deliver", ok_stage),
        ],
    )
    job = await new_job(container, "demo", cost=2)
    assert dispatcher.dispatched == [(job.id, Queue.DEFAULT, 0)]
    assert await balance(container, job.user_id) == (3, 2)

    notifier = RecordingNotifier()
    outcome = await make_runner(container, notifier).run(job.id)

    assert outcome == RunOutcome.SUCCEEDED
    done = await load(container, job.id)
    assert done.status == JobStatus.SUCCEEDED
    assert done.completed_stages == ["extract", "solve", "deliver"]
    assert done.outputs["deliver"]["seen"] == ["extract", "solve"]
    assert [t["model"] for t in done.trace] == ["m-1"] * 3
    assert done.lease_owner is None
    assert done.finished_at is not None
    assert await balance(container, job.user_id) == (3, 0)  # crédits consommés
    assert notifier.statuses == ["succeeded"]
    journal = await events(container, job.id)
    assert journal[0] == "job_created"
    assert journal.count("stage_completed") == 3
    assert journal[-1] == "job_succeeded"
    async with container.db.session() as s:
        completed = (
            (await s.execute(select(JobEvent).where(JobEvent.event == "stage_completed")))
            .scalars()
            .all()
        )
        assert all(e.duration_ms is not None for e in completed)


async def test_permanent_failure_refunds_credits(
    container: Container, registry: PipelineRegistry
) -> None:
    async def unreadable(_ctx: StageContext) -> StageResult:
        raise StageFailed("unreadable_document", "Image illisible", data={"blur": 0.9})

    registry.register("demo", [StageSpec("extract", unreadable)])
    job = await new_job(container, "demo", cost=2)
    notifier = RecordingNotifier()
    assert await make_runner(container, notifier).run(job.id) == RunOutcome.FAILED
    failed = await load(container, job.id)
    assert (failed.status, failed.error_code) == (JobStatus.FAILED, "unreadable_document")
    assert await balance(container, job.user_id) == (5, 0)  # remboursé
    assert notifier.statuses == ["failed"]


async def test_transient_errors_are_retried_then_refunded(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    calls = {"n": 0}

    async def flaky(_ctx: StageContext) -> StageResult:
        calls["n"] += 1
        raise StageRetryable("provider timeout")

    registry.register("demo", [StageSpec("solve", flaky, queue=Queue.AI)])
    job = await new_job(container, "demo", cost=1, max_attempts=3)
    runner = make_runner(container)

    assert await runner.run(job.id) == RunOutcome.RETRY_SCHEDULED
    queued = await load(container, job.id)
    assert (queued.status, queued.attempt, queued.queue) == (JobStatus.QUEUED, 1, "ai")
    assert dispatcher.dispatched[-1] == (job.id, Queue.AI, 10.0)

    assert await runner.run(job.id) == RunOutcome.RETRY_SCHEDULED
    assert dispatcher.dispatched[-1][2] == 20.0
    assert await runner.run(job.id) == RunOutcome.FAILED
    failed = await load(container, job.id)
    assert (failed.error_code, failed.attempt) == ("max_attempts_exceeded", 3)
    assert calls["n"] == 3
    assert await balance(container, job.user_id) == (5, 0)


async def test_unexpected_exception_and_timeout_are_transient(
    container: Container, registry: PipelineRegistry
) -> None:
    async def bug(_ctx: StageContext) -> StageResult:
        raise KeyError("oops")

    async def slow(_ctx: StageContext) -> StageResult:
        await asyncio.sleep(5)
        return StageResult()

    registry.register("bug", [StageSpec("a", bug)])
    registry.register("slow", [StageSpec("a", slow, timeout_seconds=0.05)])
    for kind, error_type in (("bug", "KeyError"), ("slow", "TimeoutError")):
        job = await new_job(container, kind)
        assert await make_runner(container).run(job.id) == RunOutcome.RETRY_SCHEDULED
        async with container.db.session() as s:
            retry = (
                await s.execute(
                    select(JobEvent).where(
                        JobEvent.job_id == job.id, JobEvent.event == "retry_scheduled"
                    )
                )
            ).scalar_one()
        assert retry.data["error_type"] == error_type


async def test_clarification_pauses_then_resumes(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    async def ask(ctx: StageContext) -> StageResult:
        answer = (ctx.input.get("answers") or {}).get(ctx.stage)
        if answer is None:
            raise StageNeedsInput("clarify_unit", params={"value": "12"})
        return StageResult(output={"unit": answer["unit"]})

    registry.register("demo", [StageSpec("extract", ok_stage), StageSpec("classify", ask)])
    job = await new_job(container, "demo", cost=1)
    runner = make_runner(container)
    assert await runner.run(job.id) == RunOutcome.AWAITING_INPUT
    waiting = await load(container, job.id)
    assert waiting.status == JobStatus.AWAITING_INPUT
    assert waiting.outputs["_awaiting_input"]["question_key"] == "clarify_unit"
    assert await balance(container, job.user_id) == (4, 1)  # toujours réservés

    async with container.db.session() as s:
        await jobs.provide_input(s, dispatcher, job.id, answer={"unit": "cm"})
    assert await runner.run(job.id) == RunOutcome.SUCCEEDED
    done = await load(container, job.id)
    assert done.outputs["classify"] == {"unit": "cm"}
    assert "_awaiting_input" not in done.outputs
    assert done.completed_stages == ["extract", "classify"]


async def test_stages_hand_off_between_worker_pools(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    registry.register(
        "demo",
        [
            StageSpec("receive", ok_stage, queue=Queue.INGEST),
            StageSpec("solve", ok_stage, queue=Queue.AI),
            StageSpec("render", ok_stage, queue=Queue.MEDIA),
        ],
    )
    job = await new_job(container, "demo")
    assert dispatcher.dispatched[-1][1] == Queue.INGEST
    runner = make_runner(container)
    assert await runner.run(job.id, worker_queue=Queue.INGEST) == RunOutcome.HANDED_OFF
    assert dispatcher.dispatched[-1][:2] == (job.id, Queue.AI)
    assert await runner.run(job.id, worker_queue=Queue.AI) == RunOutcome.HANDED_OFF
    assert await runner.run(job.id, worker_queue=Queue.MEDIA) == RunOutcome.SUCCEEDED
    done = await load(container, job.id)
    assert done.completed_stages == ["receive", "solve", "render"]
    assert done.attempt == 0  # changer de file n'est pas un nouvel essai


async def test_duplicate_delivery_is_skipped_while_leased(
    container: Container, registry: PipelineRegistry
) -> None:
    started, release = asyncio.Event(), asyncio.Event()

    async def blocking(_ctx: StageContext) -> StageResult:
        started.set()
        await release.wait()
        return StageResult()

    registry.register("demo", [StageSpec("a", blocking)])
    job = await new_job(container, "demo")
    first = asyncio.create_task(make_runner(container, worker="w1").run(job.id))
    await started.wait()
    assert await make_runner(container, worker="w2").run(job.id) == RunOutcome.SKIPPED
    release.set()
    assert await first == RunOutcome.SUCCEEDED
    # Un message tardif sur un traitement terminé est ignoré.
    assert await make_runner(container, worker="w3").run(job.id) == RunOutcome.SKIPPED


async def test_expired_lease_is_taken_over_and_counted(
    container: Container, registry: PipelineRegistry
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage), StageSpec("b", ok_stage)])
    job = await new_job(container, "demo")
    async with container.db.session() as s:
        await s.execute(
            update(Job)
            .where(Job.id == job.id)
            .values(
                status=JobStatus.RUNNING,
                lease_owner="dead-worker",
                lease_expires_at=datetime.now(UTC) - timedelta(seconds=1),
                completed_stages=["a"],
            )
        )
        await s.commit()
    assert await make_runner(container).run(job.id) == RunOutcome.SUCCEEDED
    done = await load(container, job.id)
    assert done.attempt == 1
    assert done.completed_stages == ["a", "b"]  # reprise à la première étape non terminée


async def test_lost_lease_cancels_the_stage_without_writing(
    container: Container, registry: PipelineRegistry
) -> None:
    container.settings.job_lease_seconds = 0.3  # type: ignore[assignment]
    stolen = asyncio.Event()

    async def long_stage(_ctx: StageContext) -> StageResult:
        stolen.set()
        await asyncio.sleep(10)
        return StageResult(output={"never": True})

    registry.register("demo", [StageSpec("a", long_stage)])
    job = await new_job(container, "demo")
    try:
        task = asyncio.create_task(make_runner(container).run(job.id))
        await stolen.wait()
        async with container.db.session() as s:
            await s.execute(update(Job).where(Job.id == job.id).values(lease_owner="other"))
            await s.commit()
        assert await asyncio.wait_for(task, 5) == RunOutcome.LEASE_LOST
    finally:
        container.settings.job_lease_seconds = 30
    job_after = await load(container, job.id)
    assert job_after.outputs == {}
    assert job_after.status == JobStatus.RUNNING  # l'autre travailleur est responsable


async def test_heartbeat_extends_the_lease(
    container: Container, registry: PipelineRegistry
) -> None:
    container.settings.job_lease_seconds = 0.3  # type: ignore[assignment]
    expirations: list[datetime] = []

    async def watch(ctx: StageContext) -> StageResult:
        for _ in range(3):
            await asyncio.sleep(0.25)
            async with ctx.db.session() as s:
                job = await s.get(Job, ctx.job_id)
                assert job is not None
                assert job.lease_expires_at is not None
                expirations.append(job.lease_expires_at)
        return StageResult()

    registry.register("demo", [StageSpec("a", watch)])
    job = await new_job(container, "demo")
    try:
        assert await make_runner(container).run(job.id) == RunOutcome.SUCCEEDED
    finally:
        container.settings.job_lease_seconds = 30
    assert expirations == sorted(expirations)
    assert expirations[0] < expirations[-1]


async def test_unknown_pipeline_fails_and_refunds(
    container: Container, registry: PipelineRegistry
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage)])
    job = await new_job(container, "demo", cost=3)
    registry._pipelines.clear()
    assert await make_runner(container).run(job.id) == RunOutcome.FAILED
    assert (await load(container, job.id)).error_code == "unknown_pipeline"
    assert await balance(container, job.user_id) == (5, 0)


async def test_reaper_redispatches_lost_jobs(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage, queue=Queue.AI)])
    stale = await new_job(container, "demo")
    crashed = await new_job(container, "demo")
    fresh = await new_job(container, "demo")
    old = datetime.now(UTC) - timedelta(hours=1)
    async with container.db.session() as s:
        await s.execute(update(Job).where(Job.id == stale.id).values(updated_at=old))
        await s.execute(
            update(Job)
            .where(Job.id == crashed.id)
            .values(status=JobStatus.RUNNING, lease_owner="dead", lease_expires_at=old)
        )
        await s.commit()
    dispatcher.dispatched.clear()
    assert await make_runner(container).reap() == 2
    assert {d[0] for d in dispatcher.dispatched} == {stale.id, crashed.id}
    assert all(d[1] == Queue.AI for d in dispatcher.dispatched)
    assert fresh.id not in {d[0] for d in dispatcher.dispatched}
    assert await make_runner(container).reap() == 0  # rien de neuf : pas de doublon
    recovered = await load(container, crashed.id)
    assert (recovered.status, recovered.attempt, recovered.lease_owner) == ("queued", 1, None)
    assert (
        await make_runner(container).run(crashed.id, worker_queue=Queue.AI) == RunOutcome.SUCCEEDED
    )


async def test_cancel_refunds_and_respects_state_machine(
    container: Container, registry: PipelineRegistry
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage)])
    job = await new_job(container, "demo", cost=2)
    async with container.db.session() as s:
        cancelled = await jobs.cancel_job(s, job.id, reason="test")
    assert cancelled.status == JobStatus.CANCELLED
    assert await balance(container, job.user_id) == (5, 0)
    async with container.db.session() as s:
        with pytest.raises(ConflictError):
            await jobs.cancel_job(s, job.id, reason="again")
    assert await make_runner(container).run(job.id) == RunOutcome.SKIPPED


async def test_creating_a_job_without_credits_creates_nothing(
    container: Container, registry: PipelineRegistry, dispatcher: InMemoryDispatcher
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage)])
    user = await create_user(container)
    async with container.db.session() as s:
        with pytest.raises(InsufficientCreditsError):
            await jobs.create_job(
                s,
                dispatcher,
                registry,
                user_id=user.id,
                kind="demo",
                source="api",
                input={},
                credits_cost=50,
            )
        await s.rollback()
        assert (await s.execute(select(Job))).scalars().all() == []
    assert dispatcher.dispatched == []


async def test_cancel_sees_the_latest_status_not_a_stale_copy(
    container: Container, registry: PipelineRegistry
) -> None:
    registry.register("demo", [StageSpec("a", ok_stage)])
    job = await new_job(container, "demo", cost=1)
    async with container.db.session() as api_session:
        loaded = await jobs.get_job(api_session, job.id)  # copie en cache : « queued »
        assert loaded.status == JobStatus.QUEUED
        async with container.db.session() as worker_session:
            await worker_session.execute(
                update(Job).where(Job.id == job.id).values(status=JobStatus.RUNNING)
            )
            await worker_session.commit()
        with pytest.raises(ConflictError):
            await jobs.cancel_job(api_session, job.id, reason="user_request")
    assert (await load(container, job.id)).status == JobStatus.RUNNING
