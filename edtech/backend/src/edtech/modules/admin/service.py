"""Platform indicators for the back office (bot /admin, future dashboard)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.modules.credits.models import CreditAccount
from edtech.modules.jobs.models import Job
from edtech.modules.support.models import SupportTicket, TicketStatus
from edtech.modules.users.models import User, UserStatus


@dataclass(frozen=True, slots=True)
class PlatformStats:
    users: int
    onboarded: int
    new_24h: int
    new_7d: int
    active_7d: int
    open_tickets: int
    credits_available: int
    jobs_7d: dict[str, int] = field(default_factory=dict)


async def platform_stats(session: AsyncSession, *, now: datetime | None = None) -> PlatformStats:
    now = now or datetime.now(UTC)
    day, week = now - timedelta(days=1), now - timedelta(days=7)
    alive = User.status != UserStatus.DELETED
    users_row = (
        await session.execute(
            select(
                func.count().filter(alive),
                func.count().filter(alive, User.onboarded_at.is_not(None)),
                func.count().filter(alive, User.created_at >= day),
                func.count().filter(alive, User.created_at >= week),
                func.count().filter(alive, User.last_seen_at >= week),
            ).select_from(User)
        )
    ).one()
    open_tickets = (
        await session.execute(
            select(func.count())
            .select_from(SupportTicket)
            .where(SupportTicket.status == TicketStatus.OPEN)
        )
    ).scalar_one()
    credits_available = (
        await session.execute(select(func.coalesce(func.sum(CreditAccount.balance), 0)))
    ).scalar_one()
    jobs = (
        await session.execute(
            select(Job.status, func.count()).where(Job.created_at >= week).group_by(Job.status)
        )
    ).all()
    return PlatformStats(
        users=int(users_row[0]),
        onboarded=int(users_row[1]),
        new_24h=int(users_row[2]),
        new_7d=int(users_row[3]),
        active_7d=int(users_row[4]),
        open_tickets=int(open_tickets),
        credits_available=int(credits_available),
        jobs_7d={status: int(count) for status, count in jobs},
    )
