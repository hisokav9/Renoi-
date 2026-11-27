"""Public read access to the country / program / grade / series catalog."""

from __future__ import annotations

import uuid

from fastapi import APIRouter

from edtech.api.deps import SessionDep
from edtech.api.schemas import (
    CountryOut,
    GradeOut,
    ProgramDetailOut,
    ProgramOut,
    SeriesOut,
    SubjectOut,
)
from edtech.core.errors import NotFoundError
from edtech.modules.curriculum import service as curriculum
from edtech.modules.curriculum.models import CurriculumProgram

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/countries", response_model=list[CountryOut])
async def list_countries(session: SessionDep) -> list[CountryOut]:
    return [CountryOut.model_validate(c) for c in await curriculum.list_active_countries(session)]


@router.get("/countries/{code}/programs", response_model=list[ProgramOut])
async def list_programs(code: str, session: SessionDep) -> list[ProgramOut]:
    country = await curriculum.get_country(session, code)
    return [
        ProgramOut.model_validate(p) for p in await curriculum.list_programs(session, country.code)
    ]


@router.get("/programs/{program_id}", response_model=ProgramDetailOut)
async def get_program(program_id: uuid.UUID, session: SessionDep) -> ProgramDetailOut:
    program = await session.get(CurriculumProgram, program_id)
    if program is None or not program.active:
        raise NotFoundError("Programme introuvable")
    return ProgramDetailOut.model_validate(
        {
            **ProgramOut.model_validate(program).model_dump(),
            "grades": [
                GradeOut.model_validate(g)
                for g in await curriculum.list_grades(session, program.id)
            ],
            "series": [
                SeriesOut.model_validate(s)
                for s in await curriculum.list_series(session, program.id)
            ],
            "subjects": [
                SubjectOut.model_validate(s)
                for s in await curriculum.list_subjects(session, program.id)
            ],
        }
    )
