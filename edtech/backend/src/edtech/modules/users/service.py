"""User lifecycle: registration, profile, deletion (right to erasure)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

import structlog
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.i18n import normalize_locale
from edtech.modules.audit import service as audit
from edtech.modules.auth.models import RefreshToken
from edtech.modules.credits import service as credits
from edtech.modules.curriculum import service as curriculum
from edtech.modules.jobs.models import Job, JobEvent
from edtech.modules.support.models import SupportTicket
from edtech.modules.users.models import AuthIdentity, AuthProvider, User, UserStatus
from edtech.modules.users.schemas import ProfileUpdate
from edtech.settings import Settings

log = structlog.stdlib.get_logger(__name__)

PROFILE_FIELDS = ("country_code", "program_id", "grade_level_id", "series_id")


async def get_by_identity(
    session: AsyncSession, provider: AuthProvider, subject: str
) -> User | None:
    stmt = (
        select(User)
        .join(AuthIdentity, AuthIdentity.user_id == User.id)
        .where(AuthIdentity.provider == provider, AuthIdentity.subject == subject)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_by_telegram_id(session: AsyncSession, telegram_id: int) -> User | None:
    return await get_by_identity(session, AuthProvider.TELEGRAM, str(telegram_id))


async def register_telegram_user(
    session: AsyncSession, settings: Settings, *, telegram_id: int, language_code: str | None
) -> tuple[User, bool]:
    """Return the user linked to this Telegram account, creating it if needed. Commits.

    Safe under concurrency: if two updates race to create the same account, the unique
    constraint on ``auth_identities`` makes one of them fall back to reading the winner.
    """
    if existing := await get_by_telegram_id(session, telegram_id):
        return existing, False
    user = User(locale=normalize_locale(language_code, settings.default_locale))
    session.add(user)
    try:
        await session.flush()
        session.add(
            AuthIdentity(user_id=user.id, provider=AuthProvider.TELEGRAM, subject=str(telegram_id))
        )
        await session.flush()
    except IntegrityError:
        await session.rollback()
        if existing := await get_by_telegram_id(session, telegram_id):
            return existing, False
        raise
    if settings.signup_free_credits > 0:
        await credits.grant(
            session,
            user.id,
            settings.signup_free_credits,
            idempotency_key=f"signup:{user.id}",
            reason="Crédits de bienvenue",
        )
    audit.record(
        session,
        actor_user_id=user.id,
        action="user.registered",
        target_type="user",
        target_id=user.id,
        data={"provider": AuthProvider.TELEGRAM.value},
    )
    await session.commit()
    log.info("user_registered", user_id=str(user.id), provider="telegram")
    return user, True


async def touch(session: AsyncSession, user: User) -> None:
    """Record activity (at most a few writes per hour per user)."""
    now = datetime.now(UTC)
    if user.last_seen_at is None or (now - user.last_seen_at).total_seconds() > 900:
        user.last_seen_at = now
        await session.commit()


async def update_profile(session: AsyncSession, user: User, changes: ProfileUpdate) -> User:
    """Apply a partial profile update after validating the school selection. Commits."""
    sent = changes.model_fields_set
    if "locale" in sent and changes.locale is not None:
        user.locale = changes.locale
    if "preferences" in sent and changes.preferences is not None:
        user.preferences = changes.preferences.model_dump(mode="json")

    if sent & set(PROFILE_FIELDS):
        target = {f: getattr(user, f) for f in PROFILE_FIELDS}
        for field in PROFILE_FIELDS:
            if field in sent:
                value = getattr(changes, field)
                target[field] = value.upper() if field == "country_code" and value else value
        # Changing a parent level resets the levels below it, unless they were sent too.
        order = list(PROFILE_FIELDS)
        for i, field in enumerate(order):
            if field in sent:
                for child in order[i + 1 :]:
                    if child not in sent:
                        target[child] = None
        await curriculum.validate_selection(session, **target)
        for field, value in target.items():
            setattr(user, field, value)
    await session.commit()
    return user


async def complete_onboarding(session: AsyncSession, user: User) -> None:
    if user.onboarded_at is None:
        user.onboarded_at = datetime.now(UTC)
        await session.commit()


async def set_role(
    session: AsyncSession, user: User, role: str, *, actor_user_id: uuid.UUID | None
) -> None:
    previous = user.role
    user.role = role
    audit.record(
        session,
        actor_user_id=actor_user_id,
        action="user.role_changed",
        target_type="user",
        target_id=user.id,
        data={"from": previous, "to": role},
    )
    await session.commit()


async def delete_account(
    session: AsyncSession, user: User, *, actor_user_id: uuid.UUID | None
) -> None:
    """Erase personal data and unlink logins. Commits.

    The credit ledger is kept (accounting obligation) but only references the anonymised user id.
    Stored documents attached to jobs are purged by the retention worker (phase 2).
    """
    user_id = user.id
    await session.execute(delete(AuthIdentity).where(AuthIdentity.user_id == user_id))
    await session.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
    await session.execute(delete(SupportTicket).where(SupportTicket.user_id == user_id))
    job_ids = select(Job.id).where(Job.user_id == user_id).scalar_subquery()
    await session.execute(update(JobEvent).where(JobEvent.job_id.in_(job_ids)).values(data={}))
    await session.execute(
        update(Job).where(Job.user_id == user_id).values(input={}, outputs={}, error_message=None)
    )
    user.status = UserStatus.DELETED
    user.deleted_at = datetime.now(UTC)
    user.preferences = {}
    for field in PROFILE_FIELDS:
        setattr(user, field, None)
    audit.record(
        session,
        actor_user_id=actor_user_id,
        action="user.deleted",
        target_type="user",
        target_id=user_id,
    )
    await session.commit()
    log.info("user_deleted", user_id=str(user_id))
