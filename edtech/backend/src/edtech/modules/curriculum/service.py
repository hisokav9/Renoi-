"""Read access to the curriculum catalog and validation of a user's school profile."""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.errors import AppError, NotFoundError
from edtech.modules.curriculum.models import (
    Country,
    CurriculumProgram,
    GradeLevel,
    Series,
    Subject,
)

DATA_DIR = Path(__file__).parent / "data"


class InvalidSelectionError(AppError):
    status_code = 422
    code = "invalid_curriculum_selection"
    title = "Sélection scolaire invalide"


async def list_active_countries(session: AsyncSession) -> Sequence[Country]:
    stmt = select(Country).where(Country.active.is_(True)).order_by(Country.code)
    return (await session.execute(stmt)).scalars().all()


async def get_country(session: AsyncSession, code: str) -> Country:
    country = await session.get(Country, code.upper())
    if country is None:
        raise NotFoundError("Pays inconnu")
    return country


async def list_programs(session: AsyncSession, country_code: str) -> Sequence[CurriculumProgram]:
    stmt = (
        select(CurriculumProgram)
        .where(
            CurriculumProgram.country_code == country_code.upper(),
            CurriculumProgram.active.is_(True),
        )
        .order_by(CurriculumProgram.code)
    )
    return (await session.execute(stmt)).scalars().all()


async def default_program(session: AsyncSession, country_code: str) -> CurriculumProgram | None:
    """The program to pre-select when a country has exactly one active program."""
    programs = await list_programs(session, country_code)
    return programs[0] if len(programs) == 1 else None


async def list_grades(
    session: AsyncSession, program_id: uuid.UUID, *, cycle: str | None = None
) -> Sequence[GradeLevel]:
    stmt = select(GradeLevel).where(GradeLevel.program_id == program_id)
    if cycle:
        stmt = stmt.where(GradeLevel.cycle == cycle)
    return (await session.execute(stmt.order_by(GradeLevel.position))).scalars().all()


async def list_cycles(session: AsyncSession, program_id: uuid.UUID) -> list[str]:
    grades = await list_grades(session, program_id)
    return list(dict.fromkeys(g.cycle for g in grades))


async def list_series(session: AsyncSession, program_id: uuid.UUID) -> Sequence[Series]:
    stmt = select(Series).where(Series.program_id == program_id).order_by(Series.code)
    return (await session.execute(stmt)).scalars().all()


async def series_for_grade(session: AsyncSession, grade: GradeLevel) -> list[Series]:
    return [s for s in await list_series(session, grade.program_id) if grade.code in s.grade_codes]


async def list_subjects(session: AsyncSession, program_id: uuid.UUID) -> Sequence[Subject]:
    stmt = select(Subject).where(Subject.program_id == program_id).order_by(Subject.code)
    return (await session.execute(stmt)).scalars().all()


async def validate_selection(
    session: AsyncSession,
    *,
    country_code: str | None,
    program_id: uuid.UUID | None,
    grade_level_id: uuid.UUID | None,
    series_id: uuid.UUID | None,
) -> None:
    """Ensure country ⊃ program ⊃ grade ⊃ series are consistent. Raises on mismatch."""
    if country_code is not None:
        country = await session.get(Country, country_code)
        if country is None or not country.active:
            raise InvalidSelectionError("Pays non disponible")
    program = await session.get(CurriculumProgram, program_id) if program_id else None
    if program_id and (program is None or program.country_code != country_code):
        raise InvalidSelectionError("Programme incompatible avec le pays")
    grade = await session.get(GradeLevel, grade_level_id) if grade_level_id else None
    if grade_level_id and (grade is None or program is None or grade.program_id != program.id):
        raise InvalidSelectionError("Classe incompatible avec le programme")
    if series_id:
        series = await session.get(Series, series_id)
        if series is None or grade is None or series.program_id != grade.program_id:
            raise InvalidSelectionError("Série incompatible avec la classe")
        if grade.code not in series.grade_codes:
            raise InvalidSelectionError("Série non proposée pour cette classe")


# --- Seed -----------------------------------------------------------------------------------


def load_seed_file(path: Path) -> dict[str, Any]:
    data: dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8"))
    return data


async def seed_country(session: AsyncSession, data: dict[str, Any]) -> CurriculumProgram:
    """Idempotent upsert of one country file (see ``data/ne.yaml``). Does not commit."""
    c = data["country"]
    country = await session.get(Country, c["code"])
    if country is None:
        country = Country(code=c["code"])
        session.add(country)
    country.names = c["names"]
    country.default_locale = c["default_locale"]
    country.locales = c["locales"]
    country.currency = c["currency"]
    country.timezone = c["timezone"]
    country.active = bool(c.get("active", False))
    country.settings = c.get("settings", {})
    await session.flush()

    p = data["program"]
    program = (
        await session.execute(
            select(CurriculumProgram).where(
                CurriculumProgram.country_code == country.code,
                CurriculumProgram.code == p["code"],
            )
        )
    ).scalar_one_or_none()
    if program is None:
        program = CurriculumProgram(country_code=country.code, code=p["code"])
        session.add(program)
    program.names = p["names"]
    program.academic_year = p.get("academic_year")
    program.source = p.get("source")
    program.verified = bool(p.get("verified", False))
    program.active = bool(p.get("active", True))
    await session.flush()

    existing_grades = {g.code: g for g in await list_grades(session, program.id)}
    for position, g in enumerate(data.get("grades", [])):
        grade = existing_grades.get(g["code"]) or GradeLevel(program_id=program.id, code=g["code"])
        grade.cycle = g["cycle"]
        grade.names = g["names"]
        grade.position = position
        session.add(grade)

    existing_series = {s.code: s for s in await list_series(session, program.id)}
    for s in data.get("series", []):
        series = existing_series.get(s["code"]) or Series(program_id=program.id, code=s["code"])
        series.names = s["names"]
        series.grade_codes = s["grade_codes"]
        series.verified = bool(s.get("verified", False))
        session.add(series)

    existing_subjects = {s.code: s for s in await list_subjects(session, program.id)}
    for s in data.get("subjects", []):
        subject = existing_subjects.get(s["code"]) or Subject(program_id=program.id, code=s["code"])
        subject.names = s["names"]
        session.add(subject)
    await session.flush()
    return program


async def seed_all(session: AsyncSession, data_dir: Path = DATA_DIR) -> list[str]:
    """Load every ``<country>.yaml`` file of ``data_dir``. Does not commit."""

    def _read_all() -> list[dict[str, Any]]:
        return [load_seed_file(path) for path in sorted(data_dir.glob("*.yaml"))]

    seeded = []
    for data in await asyncio.to_thread(_read_all):
        program = await seed_country(session, data)
        seeded.append(program.country_code)
    return seeded
