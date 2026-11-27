"""Session management: access/refresh token issuance, rotation and revocation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.errors import ForbiddenError, UnauthorizedError
from edtech.core.ids import uuid7
from edtech.core.security import create_access_token, generate_refresh_token, hash_token
from edtech.modules.auth.models import RefreshToken
from edtech.modules.auth.telegram import TelegramIdentity
from edtech.modules.users import service as users
from edtech.modules.users.models import User
from edtech.settings import Settings

log = structlog.stdlib.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class TokenPair:
    access_token: str
    access_expires_at: datetime
    refresh_token: str
    refresh_expires_at: datetime


async def issue_tokens(
    session: AsyncSession, settings: Settings, user: User, *, family_id: object = None
) -> tuple[TokenPair, RefreshToken]:
    """Create a token pair. Does not commit."""
    now = datetime.now(UTC)
    access, access_exp = create_access_token(settings, user_id=user.id, role=user.role, now=now)
    raw = generate_refresh_token()
    refresh = RefreshToken(
        id=uuid7(),
        user_id=user.id,
        family_id=family_id or uuid7(),
        token_hash=hash_token(raw),
        expires_at=now + timedelta(days=settings.refresh_token_ttl_days),
    )
    session.add(refresh)
    await session.flush()
    return TokenPair(access, access_exp, raw, refresh.expires_at), refresh


async def login_with_telegram(
    session: AsyncSession, settings: Settings, identity: TelegramIdentity
) -> TokenPair:
    user, _ = await users.register_telegram_user(
        session, settings, telegram_id=identity.telegram_id, language_code=identity.language_code
    )
    if not user.is_active:
        raise ForbiddenError("Compte désactivé")
    pair, _ = await issue_tokens(session, settings, user)
    await session.commit()
    return pair


async def _revoke_family(session: AsyncSession, family_id: object) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )


async def rotate(session: AsyncSession, settings: Settings, raw_refresh_token: str) -> TokenPair:
    """Exchange a refresh token for a new pair. Reusing a rotated token revokes its family."""
    stmt = (
        select(RefreshToken)
        .where(RefreshToken.token_hash == hash_token(raw_refresh_token))
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    current = (await session.execute(stmt)).scalar_one_or_none()
    if current is None:
        raise UnauthorizedError("Session invalide")
    now = datetime.now(UTC)
    if current.revoked_at is not None:
        log.warning("refresh_token_reuse_detected", user_id=str(current.user_id))
        await _revoke_family(session, current.family_id)
        await session.commit()
        raise UnauthorizedError("Session invalide")
    if current.expires_at <= now:
        raise UnauthorizedError("Session expirée")
    user = await session.get(User, current.user_id)
    if user is None or not user.is_active:
        raise UnauthorizedError("Session invalide")
    pair, new = await issue_tokens(session, settings, user, family_id=current.family_id)
    current.revoked_at = now
    current.replaced_by_id = new.id
    await session.commit()
    return pair


async def logout(session: AsyncSession, raw_refresh_token: str) -> None:
    stmt = select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_refresh_token))
    current = (await session.execute(stmt)).scalar_one_or_none()
    if current is not None:
        await _revoke_family(session, current.family_id)
        await session.commit()
