"""User accounts and their external identities.

Data minimisation (many users are minors): we store no name, username, phone number or e-mail.
A Telegram account is linked through its numeric id only; the first name shown in messages is
read from each incoming update and never persisted.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from edtech.infra.db import Base, JsonDict, Timestamps, UUIDPrimaryKey


class UserRole(StrEnum):
    STUDENT = "student"
    TEACHER = "teacher"
    SCHOOL_ADMIN = "school_admin"
    REVIEWER = "reviewer"  # révision humaine des corrections complexes
    SUPPORT = "support"
    ADMIN = "admin"


class UserStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class AuthProvider(StrEnum):
    TELEGRAM = "telegram"


class User(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "users"

    role: Mapped[str] = mapped_column(String(32), default=UserRole.STUDENT)
    status: Mapped[str] = mapped_column(String(16), default=UserStatus.ACTIVE, index=True)
    locale: Mapped[str] = mapped_column(String(8), default="fr")
    country_code: Mapped[str | None] = mapped_column(
        ForeignKey("countries.code", ondelete="SET NULL")
    )
    program_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("curriculum_programs.id", ondelete="SET NULL")
    )
    grade_level_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("grade_levels.id", ondelete="SET NULL")
    )
    series_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("series.id", ondelete="SET NULL")
    )
    preferences: Mapped[JsonDict] = mapped_column(default=dict)
    onboarded_at: Mapped[datetime | None]
    last_seen_at: Mapped[datetime | None]
    deleted_at: Mapped[datetime | None]

    @property
    def is_active(self) -> bool:
        return self.status == UserStatus.ACTIVE


class AuthIdentity(UUIDPrimaryKey, Timestamps, Base):
    """Link between a user and an external login (Telegram today; e-mail, Google later)."""

    __tablename__ = "auth_identities"
    __table_args__ = (UniqueConstraint("provider", "subject"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    provider: Mapped[str] = mapped_column(String(32))
    subject: Mapped[str] = mapped_column(String(128))
    last_used_at: Mapped[datetime | None]
