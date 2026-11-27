"""SQLAlchemy (async) setup: declarative base, naming conventions, engine and sessions."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, MetaData, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.pool import NullPool

from edtech.core.ids import uuid7
from edtech.settings import Settings

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

JsonDict = dict[str, Any]
JSON_TYPE = JSON().with_variant(JSONB(), "postgresql")


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map = {  # noqa: RUF012 - SQLAlchemy convention
        uuid.UUID: Uuid(),
        datetime: DateTime(timezone=True),
        JsonDict: JSON_TYPE,
        list[str]: JSON_TYPE,
        list[JsonDict]: JSON_TYPE,
    }


class UUIDPrimaryKey:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid7, sort_order=-100)


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), sort_order=100)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), sort_order=101
    )


class Database:
    """Owns the engine and the session factory for one process."""

    def __init__(self, engine: AsyncEngine) -> None:
        self.engine = engine
        self.sessionmaker = async_sessionmaker(engine, expire_on_commit=False)

    @classmethod
    def from_settings(cls, settings: Settings, *, worker: bool = False) -> Database:
        kwargs: dict[str, Any] = {"echo": settings.database_echo, "pool_pre_ping": True}
        if worker:
            # Celery prefork children each own one event loop; a small dedicated pool is created
            # per process, connections are not shared across forks.
            kwargs["poolclass"] = NullPool
        else:
            kwargs["pool_size"] = settings.database_pool_size
            kwargs["max_overflow"] = settings.database_max_overflow
        return cls(create_async_engine(settings.database_url, **kwargs))

    def session(self) -> AsyncSession:
        return self.sessionmaker()

    async def dispose(self) -> None:
        await self.engine.dispose()
