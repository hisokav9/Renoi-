"""Thin asynchronous Telegram Bot API client (see docs/adr/0003-client-telegram.md).

The bot token is part of every request URL: this module never logs URLs, and the ``httpx``
logger is kept at WARNING (see :mod:`edtech.core.logging`).
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx
import structlog

from edtech.modules.telegram.types import InlineKeyboard

log = structlog.stdlib.get_logger(__name__)

MAX_MESSAGE_LENGTH = 4096


class TelegramApiError(Exception):
    def __init__(self, method: str, code: int, description: str, retry_after: int | None) -> None:
        super().__init__(f"{method}: {code} {description}")
        self.method = method
        self.code = code
        self.description = description
        self.retry_after = retry_after


class TelegramClient:
    def __init__(
        self,
        token: str,
        http: httpx.AsyncClient,
        *,
        base_url: str = "https://api.telegram.org",
        max_retry_after: int = 5,
    ) -> None:
        self._url = f"{base_url.rstrip('/')}/bot{token}"
        self._http = http
        self._max_retry_after = max_retry_after

    async def call(
        self, method: str, payload: dict[str, Any] | None = None, *, http_timeout: float = 15.0
    ) -> Any:
        """Call a Bot API method. Retries once on flood control if the wait is short."""
        for attempt in range(2):
            try:
                response = await self._http.post(
                    f"{self._url}/{method}", json=payload or {}, timeout=http_timeout
                )
            except httpx.HTTPError as exc:
                # The exception text may contain the URL (and therefore the token).
                raise TelegramApiError(method, 0, type(exc).__name__, None) from None
            try:
                body = response.json()
            except ValueError:
                raise TelegramApiError(method, response.status_code, "invalid JSON", None) from None
            if body.get("ok"):
                return body.get("result")
            retry_after = (body.get("parameters") or {}).get("retry_after")
            error = TelegramApiError(
                method,
                int(body.get("error_code") or response.status_code),
                str(body.get("description", "")),
                retry_after,
            )
            if error.code == 429 and attempt == 0 and (retry_after or 0) <= self._max_retry_after:
                await asyncio.sleep(retry_after or 1)
                continue
            raise error
        raise AssertionError("unreachable")  # pragma: no cover

    async def send_message(
        self,
        chat_id: int,
        text: str,
        *,
        reply_markup: InlineKeyboard | None = None,
        parse_mode: str | None = "HTML",
    ) -> Any:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "text": text[:MAX_MESSAGE_LENGTH],
            "link_preview_options": {"is_disabled": True},
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup
        return await self.call("sendMessage", payload)

    async def edit_message_text(
        self,
        chat_id: int,
        message_id: int,
        text: str,
        *,
        reply_markup: InlineKeyboard | None = None,
        parse_mode: str | None = "HTML",
    ) -> Any:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text[:MAX_MESSAGE_LENGTH],
            "link_preview_options": {"is_disabled": True},
        }
        if parse_mode:
            payload["parse_mode"] = parse_mode
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            return await self.call("editMessageText", payload)
        except TelegramApiError as exc:
            if "message is not modified" in exc.description:
                return None
            raise

    async def answer_callback_query(self, callback_query_id: str, text: str | None = None) -> Any:
        payload: dict[str, Any] = {"callback_query_id": callback_query_id}
        if text:
            payload["text"] = text
        return await self.call("answerCallbackQuery", payload)

    async def set_webhook(
        self, url: str, *, secret_token: str, allowed_updates: list[str], drop_pending: bool
    ) -> Any:
        return await self.call(
            "setWebhook",
            {
                "url": url,
                "secret_token": secret_token,
                "allowed_updates": allowed_updates,
                "drop_pending_updates": drop_pending,
                "max_connections": 40,
            },
        )

    async def get_me(self) -> Any:
        return await self.call("getMe")

    async def get_updates(
        self, *, offset: int | None, poll_seconds: int, allowed_updates: list[str]
    ) -> list[dict[str, Any]]:
        """Long polling: Telegram holds the request up to ``poll_seconds`` seconds."""
        payload: dict[str, Any] = {"timeout": poll_seconds, "allowed_updates": allowed_updates}
        if offset is not None:
            payload["offset"] = offset
        result = await self.call("getUpdates", payload, http_timeout=poll_seconds + 15)
        return list(result or [])

    async def delete_webhook(self) -> Any:
        return await self.call("deleteWebhook", {"drop_pending_updates": False})

    async def get_webhook_info(self) -> Any:
        return await self.call("getWebhookInfo")

    async def set_my_commands(
        self, commands: list[tuple[str, str]], *, language_code: str | None = None
    ) -> Any:
        payload: dict[str, Any] = {
            "commands": [{"command": c, "description": d} for c, d in commands]
        }
        if language_code:
            payload["language_code"] = language_code
        return await self.call("setMyCommands", payload)
