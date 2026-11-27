from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from edtech.core.i18n import SUPPORTED_LOCALES


class ExplanationLevel(StrEnum):
    SIMPLE = "simple"
    STANDARD = "standard"
    DETAILED = "detailed"


class CorrectionMode(StrEnum):
    TEXT = "text"
    AUDIO = "audio"
    VIDEO = "video"


class UserPreferences(BaseModel):
    """Pedagogical preferences stored in ``users.preferences``."""

    model_config = ConfigDict(extra="ignore")

    explanation_level: ExplanationLevel = ExplanationLevel.STANDARD
    default_mode: CorrectionMode = CorrectionMode.TEXT


LocaleCode = Literal[SUPPORTED_LOCALES]  # type: ignore[valid-type]


class ProfileUpdate(BaseModel):
    """Partial update: only the fields actually sent are applied (``model_fields_set``)."""

    model_config = ConfigDict(extra="forbid")

    locale: LocaleCode | None = None
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    program_id: uuid.UUID | None = None
    grade_level_id: uuid.UUID | None = None
    series_id: uuid.UUID | None = None
    preferences: UserPreferences | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    status: str
    locale: str
    country_code: str | None
    program_id: uuid.UUID | None
    grade_level_id: uuid.UUID | None
    series_id: uuid.UUID | None
    preferences: UserPreferences
    onboarded_at: datetime | None
    created_at: datetime
