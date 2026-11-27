"""Country-specific pedagogical and regulatory parameters.

Every entry carries its provenance (``source``) and a ``verified`` flag: catalog data must be
validated against official ministry documents before being presented as authoritative.
"""

from __future__ import annotations

import uuid
from enum import StrEnum

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from edtech.infra.db import Base, JsonDict, Timestamps, UUIDPrimaryKey


class Cycle(StrEnum):
    PRIMARY = "primary"
    LOWER_SECONDARY = "lower_secondary"
    UPPER_SECONDARY = "upper_secondary"
    HIGHER = "higher"


class Country(Timestamps, Base):
    __tablename__ = "countries"

    code: Mapped[str] = mapped_column(String(2), primary_key=True)  # ISO 3166-1 alpha-2
    names: Mapped[JsonDict]
    default_locale: Mapped[str] = mapped_column(String(8))
    locales: Mapped[list[str]]
    currency: Mapped[str] = mapped_column(String(3))
    timezone: Mapped[str] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(default=False)
    # Paramètres réglementaires et commerciaux (durée de conservation, crédits offerts...).
    settings: Mapped[JsonDict] = mapped_column(default=dict)


class CurriculumProgram(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "curriculum_programs"
    __table_args__ = (UniqueConstraint("country_code", "code"),)

    country_code: Mapped[str] = mapped_column(ForeignKey("countries.code"), index=True)
    code: Mapped[str] = mapped_column(String(64))
    names: Mapped[JsonDict]
    academic_year: Mapped[str | None] = mapped_column(String(16))
    source: Mapped[str | None] = mapped_column(String(500))
    verified: Mapped[bool] = mapped_column(default=False)
    active: Mapped[bool] = mapped_column(default=True)


class GradeLevel(UUIDPrimaryKey, Base):
    __tablename__ = "grade_levels"
    __table_args__ = (UniqueConstraint("program_id", "code"),)

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("curriculum_programs.id", ondelete="CASCADE"), index=True
    )
    cycle: Mapped[str] = mapped_column(String(32))
    code: Mapped[str] = mapped_column(String(32))
    names: Mapped[JsonDict]
    position: Mapped[int]


class Series(UUIDPrimaryKey, Base):
    __tablename__ = "series"
    __table_args__ = (UniqueConstraint("program_id", "code"),)

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("curriculum_programs.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(32))
    names: Mapped[JsonDict]
    grade_codes: Mapped[list[str]]
    verified: Mapped[bool] = mapped_column(default=False)


class Subject(UUIDPrimaryKey, Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("program_id", "code"),)

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("curriculum_programs.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(32))
    names: Mapped[JsonDict]
