"""Verification of Telegram-signed login data.

* Login Widget (website): https://core.telegram.org/widgets/login#checking-authorization
  secret = SHA256(bot_token); hash = HMAC_SHA256(data_check_string, secret)
* Mini App ``initData``:
  https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  secret = HMAC_SHA256(key="WebAppData", msg=bot_token)
  hash = HMAC_SHA256(data_check_string, secret)

``data_check_string`` = every received field except ``hash``, sorted by key, as ``key=value``
lines joined with ``\\n``. ``auth_date`` must be recent to prevent replay.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from collections.abc import Mapping
from dataclasses import dataclass
from urllib.parse import parse_qsl

from edtech.core.errors import UnauthorizedError

_CLOCK_SKEW_SECONDS = 60


@dataclass(frozen=True, slots=True)
class TelegramIdentity:
    telegram_id: int
    language_code: str | None = None
    first_name: str | None = None  # affiché, jamais stocké


def _check_string(fields: Mapping[str, str]) -> str:
    return "\n".join(f"{key}={fields[key]}" for key in sorted(fields))


def _check_freshness(auth_date: str | None, max_age: int, now: float | None) -> None:
    try:
        issued = int(auth_date or "")
    except ValueError as exc:
        raise UnauthorizedError("Données Telegram invalides") from exc
    current = time.time() if now is None else now
    if issued > current + _CLOCK_SKEW_SECONDS or current - issued > max_age:
        raise UnauthorizedError("Connexion Telegram expirée, veuillez recommencer")


def verify_login_widget(
    data: Mapping[str, str | int | None],
    bot_token: str,
    *,
    max_age: int,
    now: float | None = None,
) -> TelegramIdentity:
    fields = {key: str(value) for key, value in data.items() if value is not None}
    received = fields.pop("hash", "")
    secret = hashlib.sha256(bot_token.encode()).digest()
    expected = hmac.new(secret, _check_string(fields).encode(), hashlib.sha256).hexdigest()
    if not received or not hmac.compare_digest(expected, received):
        raise UnauthorizedError("Signature Telegram invalide")
    _check_freshness(fields.get("auth_date"), max_age, now)
    try:
        telegram_id = int(fields["id"])
    except (KeyError, ValueError) as exc:
        raise UnauthorizedError("Données Telegram invalides") from exc
    return TelegramIdentity(telegram_id=telegram_id, first_name=fields.get("first_name"))


def verify_webapp_init_data(
    init_data: str, bot_token: str, *, max_age: int, now: float | None = None
) -> TelegramIdentity:
    try:
        fields = dict(parse_qsl(init_data, keep_blank_values=True, strict_parsing=True))
    except ValueError as exc:
        raise UnauthorizedError("Données Telegram invalides") from exc
    received = fields.pop("hash", "")
    secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret, _check_string(fields).encode(), hashlib.sha256).hexdigest()
    if not received or not hmac.compare_digest(expected, received):
        raise UnauthorizedError("Signature Telegram invalide")
    _check_freshness(fields.get("auth_date"), max_age, now)
    try:
        user = json.loads(fields["user"])
        telegram_id = int(user["id"])
    except (KeyError, ValueError, TypeError) as exc:
        raise UnauthorizedError("Données Telegram invalides") from exc
    return TelegramIdentity(
        telegram_id=telegram_id,
        language_code=user.get("language_code"),
        first_name=user.get("first_name"),
    )
