from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.modules.support.models import SupportTicket, TicketStatus

MAX_MESSAGE_LENGTH = 2000


async def open_ticket(
    session: AsyncSession, *, user_id: uuid.UUID, channel: str, message: str
) -> SupportTicket:
    ticket = SupportTicket(
        user_id=user_id, channel=channel, message=message.strip()[:MAX_MESSAGE_LENGTH]
    )
    session.add(ticket)
    await session.commit()
    return ticket


async def list_tickets(
    session: AsyncSession, *, status: TicketStatus | None = TicketStatus.OPEN, limit: int = 50
) -> Sequence[SupportTicket]:
    stmt = select(SupportTicket).order_by(SupportTicket.created_at.desc()).limit(limit)
    if status is not None:
        stmt = stmt.where(SupportTicket.status == status)
    return (await session.execute(stmt)).scalars().all()
