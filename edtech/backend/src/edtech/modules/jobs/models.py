"""Processing jobs: unique id, state and execution journal (cahier des charges §5)."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import BigInteger, ForeignKey, Identity, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from edtech.infra.db import Base, JsonDict, Timestamps, UUIDPrimaryKey


class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    AWAITING_INPUT = "awaiting_input"  # clarification demandée à l'utilisateur
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


TERMINAL_STATUSES = frozenset({JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.CANCELLED})

ALLOWED_TRANSITIONS: dict[JobStatus, frozenset[JobStatus]] = {
    JobStatus.QUEUED: frozenset({JobStatus.RUNNING, JobStatus.CANCELLED, JobStatus.FAILED}),
    JobStatus.RUNNING: frozenset(
        {
            JobStatus.QUEUED,  # nouvelle tentative après erreur transitoire
            JobStatus.RUNNING,  # reprise après expiration du bail (travailleur perdu)
            JobStatus.AWAITING_INPUT,
            JobStatus.SUCCEEDED,
            JobStatus.FAILED,
        }
    ),
    JobStatus.AWAITING_INPUT: frozenset({JobStatus.QUEUED, JobStatus.CANCELLED}),
    JobStatus.SUCCEEDED: frozenset(),
    JobStatus.FAILED: frozenset(),
    JobStatus.CANCELLED: frozenset(),
}


class EventLevel(StrEnum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class Job(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "jobs"
    __table_args__ = (Index("ix_jobs_status_updated_at", "status", "updated_at"),)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32))
    source: Mapped[str] = mapped_column(String(16))  # telegram, api, web...
    status: Mapped[str] = mapped_column(String(16), default=JobStatus.QUEUED)
    queue: Mapped[str] = mapped_column(String(16))
    stages: Mapped[list[str]]
    completed_stages: Mapped[list[str]] = mapped_column(default=list)
    current_stage: Mapped[str | None] = mapped_column(String(64))
    attempt: Mapped[int] = mapped_column(default=0)
    max_attempts: Mapped[int] = mapped_column(default=3)
    input: Mapped[JsonDict] = mapped_column(default=dict)
    outputs: Mapped[JsonDict] = mapped_column(default=dict)
    # Traçabilité : modèles, fournisseurs et versions utilisés à chaque étape.
    trace: Mapped[list[JsonDict]] = mapped_column(default=list)
    credits_cost: Mapped[int] = mapped_column(default=0)
    error_code: Mapped[str | None] = mapped_column(String(64))
    error_message: Mapped[str | None] = mapped_column(Text)
    lease_owner: Mapped[str | None] = mapped_column(String(128))
    lease_expires_at: Mapped[datetime | None]
    started_at: Mapped[datetime | None]
    finished_at: Mapped[datetime | None]


class JobEvent(Base):
    """Append-only execution journal of a job."""

    __tablename__ = "job_events"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    stage: Mapped[str | None] = mapped_column(String(64))
    level: Mapped[str] = mapped_column(String(8), default=EventLevel.INFO)
    event: Mapped[str] = mapped_column(String(64))
    data: Mapped[JsonDict] = mapped_column(default=dict)
    duration_ms: Mapped[int | None]
