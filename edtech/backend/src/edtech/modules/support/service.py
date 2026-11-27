from __future__ import annotations

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.modules.audit import service as audit
from edtech.modules.support.models import SupportTicket, TicketStatus

MAX_MESSAGE_LENGTH = 2000


def ticket_reference(ticket_id: uuid.UUID) -> str:
    """Short reference shown to students and staff (last 8 hex digits of the id)."""
    return str(ticket_id)[-8:].upper()


async def open_ticket(
    session: AsyncSession, *, user_id: uuid.UUID, channel: str, message: str
) -> SupportTicket:
    ticket = SupportTicket(
        user_id=user_id, channel=channel, message=message.strip()[:MAX_MESSAGE_LENGTH]
    )
    session.add(ticket)
    await session.commit()
    return ticket


async def get_ticket(session: AsyncSession, ticket_id: uuid.UUID) -> SupportTicket | None:
    return await session.get(SupportTicket, ticket_id)


async def list_tickets(
    session: AsyncSession,
    *,
    status: TicketStatus | None = TicketStatus.OPEN,
    limit: int = 50,
    offset: int = 0,
) -> Sequence[SupportTicket]:
    stmt = select(SupportTicket).order_by(SupportTicket.created_at.desc()).limit(limit)
    if status is not None:
        stmt = stmt.where(SupportTicket.status == status)
    return (await session.execute(stmt.offset(offset))).scalars().all()


async def count_tickets(session: AsyncSession, *, status: TicketStatus = TicketStatus.OPEN) -> int:
    stmt = select(func.count()).select_from(SupportTicket).where(SupportTicket.status == status)
    return int((await session.execute(stmt)).scalar_one())


async def answer_ticket(
    session: AsyncSession, ticket: SupportTicket, *, reply: str, actor_user_id: uuid.UUID
) -> SupportTicket:
    """Record the reply already delivered to the student and close the ticket. Commits."""
    ticket.reply = reply.strip()[:MAX_MESSAGE_LENGTH]
    ticket.replied_by = actor_user_id
    ticket.replied_at = datetime.now(UTC)
    ticket.status = TicketStatus.CLOSED
    audit.record(
        session,
        actor_user_id=actor_user_id,
        action="support.answered",
        target_type="support_ticket",
        target_id=ticket.id,
    )
    await session.commit()
    return ticket


async def close_ticket(
    session: AsyncSession, ticket: SupportTicket, *, actor_user_id: uuid.UUID
) -> SupportTicket:
    ticket.status = TicketStatus.CLOSED
    audit.record(
        session,
        actor_user_id=actor_user_id,
        action="support.closed",
        target_type="support_ticket",
        target_id=ticket.id,
    )
    await session.commit()
    return ticket
