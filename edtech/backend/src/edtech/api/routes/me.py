"""The authenticated user's own account."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from edtech.api.deps import SessionDep, require
from edtech.api.schemas import CreditsOut, CreditTransactionOut
from edtech.modules.auth.permissions import Permission
from edtech.modules.credits import service as credits
from edtech.modules.users import service as users
from edtech.modules.users.models import User
from edtech.modules.users.schemas import ProfileUpdate, UserOut

router = APIRouter(prefix="/me", tags=["me"])

ProfileOwner = Annotated[User, Depends(require(Permission.PROFILE_MANAGE_OWN))]


@router.get("", response_model=UserOut)
async def get_me(user: ProfileOwner) -> User:
    return user


@router.patch("", response_model=UserOut)
async def update_me(changes: ProfileUpdate, user: ProfileOwner, session: SessionDep) -> User:
    return await users.update_profile(session, user, changes)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(user: ProfileOwner, session: SessionDep) -> None:
    """Delete the account and erase personal data (right to erasure)."""
    await users.delete_account(session, user, actor_user_id=user.id)


@router.get("/credits", response_model=CreditsOut)
async def my_credits(
    user: ProfileOwner,
    session: SessionDep,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> CreditsOut:
    account = await credits.get_account(session, user.id)
    transactions = await credits.list_transactions(session, user.id, limit=limit, offset=offset)
    return CreditsOut(
        balance=account.balance if account else 0,
        reserved=account.reserved if account else 0,
        transactions=[CreditTransactionOut.model_validate(t) for t in transactions],
    )
