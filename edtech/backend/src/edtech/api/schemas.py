"""Response models of the public API (v1)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Page[T](BaseModel):
    items: list[T]
    total: int
    limit: int
    offset: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # noqa: S105 - not a secret
    expires_at: datetime
    refresh_token: str
    refresh_expires_at: datetime


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=200)


class WebAppLoginRequest(BaseModel):
    init_data: str = Field(min_length=1, max_length=4096)


class CreditTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    amount: int
    reserved_delta: int
    balance_after: int
    job_id: uuid.UUID | None
    reason: str | None
    created_at: datetime


class CreditsOut(BaseModel):
    balance: int
    reserved: int
    transactions: list[CreditTransactionOut]


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: str
    source: str
    status: str
    current_stage: str | None
    stages: list[str]
    completed_stages: list[str]
    attempt: int
    credits_cost: int
    error_code: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class JobEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    stage: str | None
    level: str
    event: str
    duration_ms: int | None


class JobDetailOut(JobOut):
    error_message: str | None
    trace: list[dict[str, Any]]
    events: list[JobEventOut]


class CountryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    names: dict[str, str]
    default_locale: str
    locales: list[str]
    currency: str
    timezone: str


class ProgramOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    country_code: str
    code: str
    names: dict[str, str]
    academic_year: str | None
    source: str | None
    verified: bool


class GradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cycle: str
    code: str
    names: dict[str, str]
    position: int


class SeriesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    names: dict[str, str]
    grade_codes: list[str]
    verified: bool


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    names: dict[str, str]


class ProgramDetailOut(ProgramOut):
    grades: list[GradeOut]
    series: list[SeriesOut]
    subjects: list[SubjectOut]


class GrantCreditsRequest(BaseModel):
    amount: int = Field(ge=-10_000, le=10_000)
    reason: str = Field(min_length=3, max_length=200)
    idempotency_key: str = Field(min_length=8, max_length=100)


class RoleChangeRequest(BaseModel):
    role: str


class SupportTicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    channel: str
    message: str
    status: str
    created_at: datetime
