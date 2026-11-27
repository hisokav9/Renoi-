from __future__ import annotations

import asyncio

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import select

from edtech.container import Container
from edtech.core.errors import InsufficientCreditsError
from edtech.core.ids import uuid7
from edtech.models import Base
from edtech.modules.credits import service as credits
from edtech.modules.credits.models import CreditAccount, CreditTransaction
from tests.conftest import alembic_config, create_user


async def test_migrations_match_models(container: Container) -> None:
    async with container.db.engine.connect() as conn:
        diff = await conn.run_sync(
            lambda sync: compare_metadata(MigrationContext.configure(sync), Base.metadata)
        )
    assert diff == [], f"Migration manquante : {diff}"


async def test_migrations_downgrade_and_upgrade(container: Container) -> None:
    cfg = alembic_config(container.settings.database_url)
    await container.db.dispose()
    await asyncio.to_thread(command.downgrade, cfg, "base")
    await asyncio.to_thread(command.upgrade, cfg, "head")


async def _balance(container: Container, user_id: object) -> tuple[int, int]:
    async with container.db.session() as s:
        account = (
            await s.execute(select(CreditAccount).where(CreditAccount.user_id == user_id))
        ).scalar_one()
        return account.balance, account.reserved


async def test_signup_grant_is_recorded(container: Container) -> None:
    user = await create_user(container)
    assert await _balance(container, user.id) == (5, 0)


async def test_grant_is_idempotent(container: Container) -> None:
    user = await create_user(container)
    async with container.db.session() as s:
        first = await credits.grant(s, user.id, 3, idempotency_key="promo-1", reason="Promo")
        second = await credits.grant(s, user.id, 3, idempotency_key="promo-1", reason="Promo")
        await s.commit()
    assert first.id == second.id
    assert await _balance(container, user.id) == (8, 0)


async def test_reserve_capture_and_release(container: Container) -> None:
    user = await create_user(container)
    ok_job, failed_job = uuid7(), uuid7()
    async with container.db.session() as s:
        await credits.reserve(s, user.id, ok_job, 2)
        await credits.reserve(s, user.id, failed_job, 1)
        await s.commit()
    assert await _balance(container, user.id) == (2, 3)

    async with container.db.session() as s:
        await credits.capture(s, user.id, ok_job)
        refund = await credits.release(s, user.id, failed_job, reason="échec")
        # Rejouer ou contredire un règlement ne change rien.
        await credits.capture(s, user.id, ok_job)
        assert await credits.release(s, user.id, ok_job, reason="trop tard") is None
        assert await credits.capture(s, user.id, failed_job) is None
        await s.commit()
    assert refund is not None
    assert refund.amount == 1
    assert await _balance(container, user.id) == (3, 0)

    async with container.db.session() as s:
        assert await credits.capture(s, user.id, uuid7()) is None  # traitement gratuit
        history = await credits.list_transactions(s, user.id)
    kinds = [t.kind for t in history]
    assert sorted(kinds) == ["capture", "grant", "release", "reserve", "reserve"]


async def test_cannot_overdraw(container: Container) -> None:
    user = await create_user(container)
    async with container.db.session() as s:
        with pytest.raises(InsufficientCreditsError):
            await credits.reserve(s, user.id, uuid7(), 6)
        await s.rollback()
    assert await _balance(container, user.id) == (5, 0)


async def test_concurrent_reservations_never_overdraw(container: Container) -> None:
    user = await create_user(container)

    async def attempt() -> bool:
        async with container.db.session() as s:
            try:
                await credits.reserve(s, user.id, uuid7(), 3)
                await s.commit()
                return True
            except InsufficientCreditsError:
                await s.rollback()
                return False

    results = await asyncio.gather(*(attempt() for _ in range(4)))
    assert results.count(True) == 1
    assert await _balance(container, user.id) == (2, 3)
    async with container.db.session() as s:
        rows = (await s.execute(select(CreditTransaction))).scalars().all()
    assert len(rows) == 2  # bienvenue + une seule réservation


async def test_grant_rejects_invalid_amounts(container: Container) -> None:
    user = await create_user(container)
    async with container.db.session() as s:
        with pytest.raises(ValueError, match="Montant"):
            await credits.grant(s, user.id, -1, idempotency_key="k1", reason="x")
        with pytest.raises(ValueError, match="non autorisé"):
            await credits.grant(s, user.id, 1, idempotency_key="k2", reason="x", kind="reserve")  # type: ignore[arg-type]
