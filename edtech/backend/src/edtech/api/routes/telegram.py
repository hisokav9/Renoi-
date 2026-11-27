"""Telegram webhook endpoint.

Telegram retries an update until it gets a 2xx answer, so this endpoint answers 200 once the update
is accepted — even if processing fails — to avoid retry storms. Duplicates are dropped using the
``update_id``. Only requests carrying the secret token set with ``setWebhook`` are accepted.
"""

from __future__ import annotations

import asyncio
import hmac
import json

import structlog
from fastapi import APIRouter, Header, Request
from pydantic import ValidationError

from edtech.api.deps import ContainerDep
from edtech.core.errors import AppError, NotFoundError, UnauthorizedError
from edtech.core.metrics import TELEGRAM_UPDATES
from edtech.modules.telegram.types import TgUpdate
from edtech.modules.telegram.updates import first_delivery

log = structlog.stdlib.get_logger(__name__)
router = APIRouter(prefix="/telegram", tags=["telegram"])

MAX_UPDATE_BYTES = 256 * 1024
HANDLER_TIMEOUT_SECONDS = 25


class PayloadTooLargeError(AppError):
    status_code = 413
    code = "payload_too_large"
    title = "Requête trop volumineuse"


@router.post("/webhook", include_in_schema=False)
async def telegram_webhook(
    request: Request,
    container: ContainerDep,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> dict[str, bool]:
    expected = container.settings.telegram_secret_token
    if container.bot is None or expected is None:
        raise NotFoundError()
    if not x_telegram_bot_api_secret_token or not hmac.compare_digest(
        x_telegram_bot_api_secret_token.encode(), expected.encode()
    ):
        raise UnauthorizedError()

    body = await request.body()
    if len(body) > MAX_UPDATE_BYTES:
        raise PayloadTooLargeError()
    try:
        update = TgUpdate.model_validate(json.loads(body))
    except (ValueError, ValidationError):
        TELEGRAM_UPDATES.labels("invalid", "rejected").inc()
        log.warning("telegram_invalid_update")
        return {"ok": True}

    if not await first_delivery(container.redis, update.update_id):
        TELEGRAM_UPDATES.labels(update.kind, "duplicate").inc()
        return {"ok": True}

    try:
        await asyncio.wait_for(container.bot.handle_update(update), HANDLER_TIMEOUT_SECONDS)
    except TimeoutError:
        log.error("telegram_update_timeout", update_id=update.update_id)
    return {"ok": True}
