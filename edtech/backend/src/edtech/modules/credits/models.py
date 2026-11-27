"""Credit ledger.

``credit_accounts`` holds the current balances; ``credit_transactions`` is the append-only journal
from which they can be rebuilt. ``balance`` is what the user can spend; ``reserved`` is held for
running jobs (captured on success, released — i.e. refunded — on technical failure).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import CheckConstraint, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from edtech.core.ids import uuid7
from edtech.infra.db import Base, Timestamps, UUIDPrimaryKey


class CreditKind(StrEnum):
    GRANT = "grant"  # crédits offerts (inscription, geste commercial)
    PURCHASE = "purchase"  # achat (phase 7)
    RESERVE = "reserve"  # mise en réserve au lancement d'un traitement
    CAPTURE = "capture"  # consommation définitive après succès
    RELEASE = "release"  # remboursement automatique après échec technique
    ADJUST = "adjust"  # correction manuelle par un administrateur


class CreditAccount(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "credit_accounts"
    __table_args__ = (
        CheckConstraint("balance >= 0", name="balance_non_negative"),
        CheckConstraint("reserved >= 0", name="reserved_non_negative"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    balance: Mapped[int] = mapped_column(default=0)
    reserved: Mapped[int] = mapped_column(default=0)


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("credit_accounts.id"), index=True)
    kind: Mapped[str] = mapped_column(String(16))
    amount: Mapped[int]  # variation du solde disponible (signée)
    reserved_delta: Mapped[int] = mapped_column(default=0)
    balance_after: Mapped[int]
    reserved_after: Mapped[int]
    job_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
    reason: Mapped[str | None] = mapped_column(String(200))
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True)
    actor_user_id: Mapped[uuid.UUID | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
