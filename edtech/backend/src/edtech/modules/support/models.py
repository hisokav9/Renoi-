from __future__ import annotations

import uuid
from enum import StrEnum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from edtech.infra.db import Base, Timestamps, UUIDPrimaryKey


class TicketStatus(StrEnum):
    OPEN = "open"
    CLOSED = "closed"


class SupportTicket(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "support_tickets"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    channel: Mapped[str] = mapped_column(String(16))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default=TicketStatus.OPEN, index=True)
