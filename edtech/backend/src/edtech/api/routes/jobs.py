"""Processing jobs: list, detail with execution journal, cancellation."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from edtech.api.deps import SessionDep, require
from edtech.api.schemas import JobDetailOut, JobEventOut, JobOut, Page
from edtech.core.errors import NotFoundError
from edtech.modules.auth.permissions import Permission, has_permission
from edtech.modules.jobs import service as jobs
from edtech.modules.jobs.models import Job
from edtech.modules.users.models import User

router = APIRouter(prefix="/jobs", tags=["jobs"])

JobReader = Annotated[User, Depends(require(Permission.JOBS_READ_OWN))]


async def _visible_job(session: SessionDep, job_id: uuid.UUID, user: User) -> Job:
    job = await jobs.get_job(session, job_id)
    if job.user_id != user.id and not has_permission(user.role, Permission.JOBS_READ_ANY):
        # 404 rather than 403: do not reveal that the job exists.
        raise NotFoundError("Traitement introuvable")
    return job


@router.get("", response_model=Page[JobOut])
async def list_my_jobs(
    user: JobReader,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[JobOut]:
    rows, total = await jobs.list_user_jobs(session, user.id, limit=limit, offset=offset)
    return Page[JobOut](
        items=[JobOut.model_validate(j) for j in rows], total=total, limit=limit, offset=offset
    )


@router.get("/{job_id}", response_model=JobDetailOut)
async def get_job(job_id: uuid.UUID, user: JobReader, session: SessionDep) -> JobDetailOut:
    job = await _visible_job(session, job_id, user)
    events = await jobs.list_events(session, job.id)
    return JobDetailOut.model_validate(
        {
            **JobOut.model_validate(job).model_dump(),
            "error_message": job.error_message,
            "trace": job.trace,
            "events": [JobEventOut.model_validate(e) for e in events],
        }
    )


@router.post("/{job_id}/cancel", response_model=JobOut)
async def cancel_job(job_id: uuid.UUID, user: JobReader, session: SessionDep) -> Job:
    job = await _visible_job(session, job_id, user)
    return await jobs.cancel_job(session, job.id, reason="user_request")
