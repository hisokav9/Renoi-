"""Credit ledger operations.

Rules:
* every operation locks the account row (``SELECT ... FOR UPDATE``), so concurrent debits can never
  overdraw it;
* every operation has an idempotency key (unique in the journal): replaying it returns the original
  transaction instead of applying it twice;
* functions never commit — they join the caller's transaction, so a job and its credit reservation
  are created atomically.
"""

from __future__ import annotations

import uuid
from collections.abc import Sequence

import structlog
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.errors import ConflictError, InsufficientCreditsError
from edtech.core.ids import uuid7
from edtech.core.metrics import CREDIT_OPERATIONS
from edtech.modules.credits.models import CreditAccount, CreditKind, CreditTransaction

log = structlog.stdlib.get_logger(__name__)


async def _lock_account(session: AsyncSession, user_id: uuid.UUID) -> CreditAccount:
    await session.execute(
        insert(CreditAccount)
        .values(id=uuid7(), user_id=user_id, balance=0, reserved=0)
        .on_conflict_do_nothing(index_elements=[CreditAccount.user_id])
    )
    stmt = (
        select(CreditAccount)
        .where(CreditAccount.user_id == user_id)
        .with_for_update()
        # The row may already be in the identity map with stale values: force a refresh.
        .execution_options(populate_existing=True)
    )
    return (await session.execute(stmt)).scalar_one()


async def _find(session: AsyncSession, idempotency_key: str) -> CreditTransaction | None:
    stmt = select(CreditTransaction).where(CreditTransaction.idempotency_key == idempotency_key)
    return (await session.execute(stmt)).scalar_one_or_none()


async def _apply(
    session: AsyncSession,
    account: CreditAccount,
    *,
    kind: CreditKind,
    amount: int,
    reserved_delta: int,
    idempotency_key: str,
    job_id: uuid.UUID | None = None,
    reason: str | None = None,
    actor_user_id: uuid.UUID | None = None,
) -> CreditTransaction:
    new_balance = account.balance + amount
    new_reserved = account.reserved + reserved_delta
    if new_balance < 0:
        raise InsufficientCreditsError(
            "Solde de crédits insuffisant", extra={"balance": account.balance}
        )
    if new_reserved < 0:
        raise ConflictError("Réserve de crédits incohérente")
    account.balance = new_balance
    account.reserved = new_reserved
    transaction = CreditTransaction(
        account_id=account.id,
        kind=kind,
        amount=amount,
        reserved_delta=reserved_delta,
        balance_after=new_balance,
        reserved_after=new_reserved,
        job_id=job_id,
        reason=reason,
        idempotency_key=idempotency_key,
        actor_user_id=actor_user_id,
    )
    session.add(transaction)
    await session.flush()
    CREDIT_OPERATIONS.labels(kind.value).inc()
    return transaction


async def find_transaction(session: AsyncSession, idempotency_key: str) -> CreditTransaction | None:
    return await _find(session, idempotency_key)


async def get_account(session: AsyncSession, user_id: uuid.UUID) -> CreditAccount | None:
    stmt = select(CreditAccount).where(CreditAccount.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def grant(
    session: AsyncSession,
    user_id: uuid.UUID,
    amount: int,
    *,
    idempotency_key: str,
    reason: str,
    actor_user_id: uuid.UUID | None = None,
    kind: CreditKind = CreditKind.GRANT,
) -> CreditTransaction:
    """Add (or, for ``ADJUST`` with a negative amount, remove) available credits."""
    if kind not in (CreditKind.GRANT, CreditKind.PURCHASE, CreditKind.ADJUST):
        raise ValueError(f"Type d'opération non autorisé : {kind}")
    if amount == 0 or (amount < 0 and kind != CreditKind.ADJUST):
        raise ValueError("Montant invalide")
    account = await _lock_account(session, user_id)
    if existing := await _find(session, idempotency_key):
        return existing
    return await _apply(
        session,
        account,
        kind=kind,
        amount=amount,
        reserved_delta=0,
        idempotency_key=idempotency_key,
        reason=reason,
        actor_user_id=actor_user_id,
    )


async def reserve(
    session: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID, amount: int
) -> CreditTransaction:
    if amount <= 0:
        raise ValueError("Montant invalide")
    account = await _lock_account(session, user_id)
    if existing := await _find(session, f"reserve:{job_id}"):
        return existing
    return await _apply(
        session,
        account,
        kind=CreditKind.RESERVE,
        amount=-amount,
        reserved_delta=amount,
        idempotency_key=f"reserve:{job_id}",
        job_id=job_id,
    )


async def _settle(
    session: AsyncSession,
    user_id: uuid.UUID,
    job_id: uuid.UUID,
    kind: CreditKind,
    reason: str | None,
) -> CreditTransaction | None:
    account = await _lock_account(session, user_id)
    reservation = await _find(session, f"reserve:{job_id}")
    if reservation is None:
        return None  # traitement gratuit : rien à régler
    if existing := await _find(session, f"{kind.value}:{job_id}"):
        return existing
    other = CreditKind.RELEASE if kind == CreditKind.CAPTURE else CreditKind.CAPTURE
    if await _find(session, f"{other.value}:{job_id}"):
        log.warning("credit_settlement_conflict", job_id=str(job_id), requested=kind.value)
        return None
    held = reservation.reserved_delta
    return await _apply(
        session,
        account,
        kind=kind,
        amount=held if kind == CreditKind.RELEASE else 0,
        reserved_delta=-held,
        idempotency_key=f"{kind.value}:{job_id}",
        job_id=job_id,
        reason=reason,
    )


async def capture(
    session: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID
) -> CreditTransaction | None:
    """Consume the credits reserved for a job that succeeded."""
    return await _settle(session, user_id, job_id, CreditKind.CAPTURE, None)


async def release(
    session: AsyncSession, user_id: uuid.UUID, job_id: uuid.UUID, *, reason: str
) -> CreditTransaction | None:
    """Refund the credits reserved for a job that failed or was cancelled."""
    return await _settle(session, user_id, job_id, CreditKind.RELEASE, reason)


async def list_transactions(
    session: AsyncSession, user_id: uuid.UUID, *, limit: int = 50, offset: int = 0
) -> Sequence[CreditTransaction]:
    stmt = (
        select(CreditTransaction)
        .join(CreditAccount, CreditAccount.id == CreditTransaction.account_id)
        .where(CreditAccount.user_id == user_id)
        .order_by(CreditTransaction.created_at.desc(), CreditTransaction.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return (await session.execute(stmt)).scalars().all()
