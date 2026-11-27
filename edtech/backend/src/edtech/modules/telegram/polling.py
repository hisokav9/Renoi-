"""Long-polling transport (``getUpdates``) for development and tests.

Useful when no public HTTPS address is available (local machine, temporary server). Production
uses the webhook: both cannot be active at the same time for one bot (Telegram answers 409).
"""

from __future__ import annotations

import asyncio
import contextlib

import structlog
from pydantic import ValidationError
from redis.asyncio import Redis

from edtech.core.metrics import TELEGRAM_UPDATES
from edtech.modules.telegram.bot import TelegramBot
from edtech.modules.telegram.client import TelegramApiError, TelegramClient
from edtech.modules.telegram.types import TgUpdate
from edtech.modules.telegram.updates import ALLOWED_UPDATES, first_delivery

log = structlog.stdlib.get_logger(__name__)

HANDLER_TIMEOUT_SECONDS = 25
ERROR_BACKOFF_SECONDS = 5.0


class PollingConflictError(Exception):
    """A webhook is set, or another process is already polling this bot."""


async def run_polling(
    client: TelegramClient,
    bot: TelegramBot,
    redis: Redis,
    *,
    stop: asyncio.Event,
    poll_timeout: int = 25,
    error_backoff: float = ERROR_BACKOFF_SECONDS,
) -> int:
    """Fetch and handle updates until ``stop`` is set. Returns the number handled."""
    offset: int | None = None
    handled = 0
    while not stop.is_set():
        try:
            updates = await client.get_updates(
                offset=offset, poll_seconds=poll_timeout, allowed_updates=ALLOWED_UPDATES
            )
        except TelegramApiError as exc:
            if exc.code == 409:
                raise PollingConflictError(exc.description) from None
            log.warning("telegram_polling_error", code=exc.code)
            with contextlib.suppress(TimeoutError):
                await asyncio.wait_for(stop.wait(), error_backoff)
            continue
        for raw in updates:
            update_id = raw.get("update_id")
            if not isinstance(update_id, int):
                continue
            # Acknowledge before handling: a crashing update must not block the following ones.
            offset = update_id + 1
            try:
                update = TgUpdate.model_validate(raw)
            except ValidationError:
                TELEGRAM_UPDATES.labels("invalid", "rejected").inc()
                continue
            if not await first_delivery(redis, update.update_id):
                TELEGRAM_UPDATES.labels(update.kind, "duplicate").inc()
                continue
            try:
                await asyncio.wait_for(bot.handle_update(update), HANDLER_TIMEOUT_SECONDS)
            except TimeoutError:
                log.error("telegram_update_timeout", update_id=update.update_id)
            handled += 1
    return handled
