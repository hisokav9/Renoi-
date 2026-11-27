"""Process-wide resources, built once at startup and closed at shutdown.

Tests build a container with in-memory doubles (dispatcher, HTTP transport) instead of patching.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx
from redis.asyncio import Redis

from edtech.core.rate_limit import RateLimiter
from edtech.infra.db import Database
from edtech.infra.queue import CeleryDispatcher, JobDispatcher
from edtech.infra.storage import ObjectStorage, build_storage
from edtech.modules.jobs.pipeline import PipelineRegistry, default_registry
from edtech.modules.telegram.bot import TelegramBot
from edtech.modules.telegram.client import TelegramClient
from edtech.settings import Settings


@dataclass
class Container:
    settings: Settings
    db: Database
    redis: Redis
    storage: ObjectStorage
    dispatcher: JobDispatcher
    registry: PipelineRegistry
    http: httpx.AsyncClient
    rate_limiter: RateLimiter
    telegram: TelegramClient | None = None
    bot: TelegramBot | None = None

    @classmethod
    def build(
        cls,
        settings: Settings,
        *,
        worker: bool = False,
        dispatcher: JobDispatcher | None = None,
        http: httpx.AsyncClient | None = None,
        storage: ObjectStorage | None = None,
        registry: PipelineRegistry | None = None,
    ) -> Container:
        db = Database.from_settings(settings, worker=worker)
        redis = Redis.from_url(settings.redis_url, socket_timeout=5, health_check_interval=30)
        if dispatcher is None:
            from edtech.worker.celery_app import create_celery_app  # noqa: PLC0415

            dispatcher = CeleryDispatcher(create_celery_app(settings))
        http = http or httpx.AsyncClient(timeout=httpx.Timeout(20.0, connect=5.0))
        registry = registry or default_registry()
        rate_limiter = RateLimiter(redis)
        container = cls(
            settings=settings,
            db=db,
            redis=redis,
            storage=storage or build_storage(settings),
            dispatcher=dispatcher,
            registry=registry,
            http=http,
            rate_limiter=rate_limiter,
        )
        if settings.telegram_bot_token is not None:
            container.telegram = TelegramClient(
                settings.telegram_bot_token.get_secret_value(),
                http,
                base_url=settings.telegram_api_base_url,
            )
            container.bot = TelegramBot(
                db=db,
                client=container.telegram,
                redis=redis,
                settings=settings,
                rate_limiter=rate_limiter,
                registry=registry,
            )
        return container

    async def aclose(self) -> None:
        await self.http.aclose()
        await self.redis.aclose()
        await self.db.dispose()
