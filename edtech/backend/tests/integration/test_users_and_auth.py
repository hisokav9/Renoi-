from __future__ import annotations

import asyncio
import hashlib
import hmac
import time

import pytest
from sqlalchemy import func, select

from edtech.container import Container
from edtech.core.errors import UnauthorizedError
from edtech.modules.audit.models import AuditLog
from edtech.modules.auth import service as auth
from edtech.modules.auth.telegram import TelegramIdentity
from edtech.modules.curriculum import service as curriculum
from edtech.modules.curriculum.models import GradeLevel, Series
from edtech.modules.curriculum.service import InvalidSelectionError
from edtech.modules.users import service as users
from edtech.modules.users.models import AuthIdentity, User, UserStatus
from edtech.modules.users.schemas import ProfileUpdate
from tests.conftest import BOT_TOKEN, create_user


async def test_registration_is_idempotent_under_concurrency(container: Container) -> None:
    async def register() -> object:
        async with container.db.session() as s:
            user, _ = await users.register_telegram_user(
                s, container.settings, telegram_id=777, language_code="en-GB"
            )
            return user.id

    ids = await asyncio.gather(*(register() for _ in range(5)))
    assert len(set(ids)) == 1
    async with container.db.session() as s:
        assert (await s.execute(select(func.count()).select_from(User))).scalar_one() == 1
        user = await s.get(User, ids[0])
        assert user is not None
        assert user.locale == "en"
        actions = (await s.execute(select(AuditLog.action))).scalars().all()
        assert actions == ["user.registered"]


async def _grade(container: Container, code: str) -> GradeLevel:
    async with container.db.session() as s:
        program = await curriculum.default_program(s, "NE")
        assert program is not None
        grades = await curriculum.list_grades(s, program.id)
        return next(g for g in grades if g.code == code)


async def _series(container: Container, code: str) -> Series:
    async with container.db.session() as s:
        program = await curriculum.default_program(s, "NE")
        assert program is not None
        return next(x for x in await curriculum.list_series(s, program.id) if x.code == code)


@pytest.mark.usefixtures("seeded")
async def test_profile_update_validates_the_school_selection(container: Container) -> None:
    user_id = (await create_user(container)).id
    tle, cm2 = await _grade(container, "TLE"), await _grade(container, "CM2")
    series_c = await _series(container, "C")
    async with container.db.session() as s:
        user = await s.get(User, user_id)
        assert user is not None
        await users.update_profile(
            s,
            user,
            ProfileUpdate(
                country_code="ne",
                program_id=tle.program_id,
                grade_level_id=tle.id,
                series_id=series_c.id,
            ),
        )
        assert (user.country_code, user.series_id) == ("NE", series_c.id)

        with pytest.raises(InvalidSelectionError, match="Série"):
            await users.update_profile(
                s, user, ProfileUpdate(grade_level_id=cm2.id, series_id=series_c.id)
            )
        await s.rollback()

        # Changer de classe sans préciser la série la réinitialise.
        user = await s.get(User, user_id)
        assert user is not None
        await users.update_profile(s, user, ProfileUpdate(grade_level_id=cm2.id))
        assert user.series_id is None
        with pytest.raises(InvalidSelectionError, match="Pays"):
            await users.update_profile(s, user, ProfileUpdate(country_code="FR"))


async def test_delete_account_erases_personal_data(container: Container) -> None:
    user = await create_user(container)
    async with container.db.session() as s:
        db_user = await s.get(User, user.id)
        assert db_user is not None
        await auth.issue_tokens(s, container.settings, db_user)
        await s.commit()
        await users.delete_account(s, db_user, actor_user_id=db_user.id)
    async with container.db.session() as s:
        deleted = await s.get(User, user.id)
        assert deleted is not None
        assert deleted.status == UserStatus.DELETED
        assert deleted.deleted_at is not None
        identities = (await s.execute(select(AuthIdentity))).scalars().all()
        assert identities == []


async def test_refresh_rotation_and_reuse_detection(container: Container) -> None:
    async with container.db.session() as s:
        pair = await auth.login_with_telegram(
            s, container.settings, TelegramIdentity(telegram_id=4242)
        )
    async with container.db.session() as s:
        rotated = await auth.rotate(s, container.settings, pair.refresh_token)
    assert rotated.refresh_token != pair.refresh_token
    async with container.db.session() as s:
        with pytest.raises(UnauthorizedError):
            await auth.rotate(s, container.settings, pair.refresh_token)  # réutilisation
    async with container.db.session() as s:
        with pytest.raises(UnauthorizedError):
            await auth.rotate(s, container.settings, rotated.refresh_token)  # famille révoquée


def _widget(telegram_id: int) -> dict[str, str]:
    data = {"id": str(telegram_id), "first_name": "Awa", "auth_date": str(int(time.time()))}
    check = "\n".join(f"{k}={data[k]}" for k in sorted(data))
    secret = hashlib.sha256(BOT_TOKEN.encode()).digest()
    data["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return data


async def test_auth_api_flow(client, container: Container) -> None:  # type: ignore[no-untyped-def]
    response = await client.post("/api/v1/auth/telegram/widget", json=_widget(99))
    assert response.status_code == 200, response.text
    tokens = response.json()
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    me = await client.get("/api/v1/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["role"] == "student"

    bad = await client.post("/api/v1/auth/telegram/widget", json={**_widget(99), "id": "100"})
    assert bad.status_code == 401
    assert bad.headers["content-type"].startswith("application/problem+json")

    refreshed = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 200
    logout = await client.post(
        "/api/v1/auth/logout", json={"refresh_token": refreshed.json()["refresh_token"]}
    )
    assert logout.status_code == 204
    again = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refreshed.json()["refresh_token"]}
    )
    assert again.status_code == 401


async def test_auth_api_is_rate_limited(client, container: Container) -> None:  # type: ignore[no-untyped-def]
    container.settings.rate_limit_auth_per_minute = 2
    try:
        codes = [
            (
                await client.post("/api/v1/auth/refresh", json={"refresh_token": "x" * 30})
            ).status_code
            for _ in range(3)
        ]
    finally:
        container.settings.rate_limit_auth_per_minute = 1000
    assert codes == [401, 401, 429]
