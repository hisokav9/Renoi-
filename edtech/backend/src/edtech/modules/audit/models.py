from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Identity, String, func
from sqlalchemy.orm import Mapped, mapped_column

from edtech.infra.db import Base, JsonDict


class AuditLog(Base):
    """Who did what to whom. Written for every privileged or personal-data operation."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), index=True)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
    action: Mapped[str] = mapped_column(String(64))
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[str] = mapped_column(String(64))
    data: Mapped[JsonDict] = mapped_column(default=dict)
