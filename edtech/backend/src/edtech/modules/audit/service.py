from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from edtech.modules.audit.models import AuditLog


def record(
    session: AsyncSession,
    *,
    actor_user_id: uuid.UUID | None,
    action: str,
    target_type: str,
    target_id: str | uuid.UUID,
    data: dict[str, Any] | None = None,
) -> None:
    """Add an audit entry to the current transaction (committed by the caller)."""
    session.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            data=data or {},
        )
    )
