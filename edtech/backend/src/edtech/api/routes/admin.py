"""Back-office operations. Every write is recorded in ``audit_logs``."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from edtech.api.deps import SessionDep, require
from edtech.api.schemas import (
    CreditTransactionOut,
    GrantCreditsRequest,
    RoleChangeRequest,
    SupportTicketOut,
)
from edtech.core.errors import AppError, ConflictError, NotFoundError
from edtech.modules.audit import service as audit
from edtech.modules.auth.permissions import Permission
from edtech.modules.credits import service as credits
from edtech.modules.credits.models import CreditKind, CreditTransaction
from edtech.modules.support import service as support
from edtech.modules.support.models import SupportTicket
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserRole, UserStatus
from edtech.modules.users.schemas import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


async def _user(session: SessionDep, user_id: uuid.UUID) -> User:
    user = await session.get(User, user_id)
    if user is None or user.status == UserStatus.DELETED:
        raise NotFoundError("Utilisateur introuvable")
    return user


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    session: SessionDep,
    _actor: Annotated[User, Depends(require(Permission.USERS_READ_ANY))],
) -> User:
    return await _user(session, user_id)


@router.post("/users/{user_id}/credits", response_model=CreditTransactionOut)
async def grant_credits(
    user_id: uuid.UUID,
    body: GrantCreditsRequest,
    session: SessionDep,
    actor: Annotated[User, Depends(require(Permission.CREDITS_GRANT))],
) -> CreditTransaction:
    target = await _user(session, user_id)
    if body.amount == 0:
        raise AppError("Le montant doit être non nul")
    key = f"admin:{body.idempotency_key}"
    if replayed := await credits.find_transaction(session, key):
        return replayed  # requête rejouée : ni nouveau crédit, ni nouvelle entrée d'audit
    kind = CreditKind.GRANT if body.amount > 0 else CreditKind.ADJUST
    transaction = await credits.grant(
        session,
        target.id,
        body.amount,
        idempotency_key=key,
        reason=body.reason,
        actor_user_id=actor.id,
        kind=kind,
    )
    audit.record(
        session,
        actor_user_id=actor.id,
        action="credits.granted",
        target_type="user",
        target_id=target.id,
        data={"amount": body.amount, "transaction_id": str(transaction.id)},
    )
    await session.commit()
    return transaction


@router.put("/users/{user_id}/role", response_model=UserOut)
async def change_role(
    user_id: uuid.UUID,
    body: RoleChangeRequest,
    session: SessionDep,
    actor: Annotated[User, Depends(require(Permission.USERS_MANAGE_ROLES))],
) -> User:
    try:
        role = UserRole(body.role)
    except ValueError as exc:
        raise AppError("Rôle inconnu") from exc
    if user_id == actor.id:
        raise ConflictError("Impossible de modifier son propre rôle")
    target = await _user(session, user_id)
    await users.set_role(session, target, role, actor_user_id=actor.id)
    return target


@router.get("/support/tickets", response_model=list[SupportTicketOut])
async def list_support_tickets(
    session: SessionDep,
    _actor: Annotated[User, Depends(require(Permission.SUPPORT_READ))],
) -> list[SupportTicket]:
    return list(await support.list_tickets(session))
