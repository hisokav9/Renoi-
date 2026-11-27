from __future__ import annotations

import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import pytest

from edtech.core.errors import UnauthorizedError
from edtech.modules.auth.telegram import verify_login_widget, verify_webapp_init_data

TOKEN = "123456:ABC-DEF"


def _check_string(fields: dict[str, str]) -> str:
    return "\n".join(f"{k}={fields[k]}" for k in sorted(fields))


def signed_widget(**fields: str | int) -> dict[str, str | int]:
    data = {k: str(v) for k, v in fields.items()}
    secret = hashlib.sha256(TOKEN.encode()).digest()
    data["hash"] = hmac.new(secret, _check_string(data).encode(), hashlib.sha256).hexdigest()
    return dict(data)


def signed_init_data(**fields: str) -> str:
    secret = hmac.new(b"WebAppData", TOKEN.encode(), hashlib.sha256).digest()
    digest = hmac.new(secret, _check_string(fields).encode(), hashlib.sha256).hexdigest()
    return urlencode({**fields, "hash": digest})


def test_valid_login_widget() -> None:
    now = int(time.time())
    data = signed_widget(id=42, first_name="Awa", auth_date=now)
    identity = verify_login_widget(data, TOKEN, max_age=60)
    assert identity.telegram_id == 42
    assert identity.first_name == "Awa"


def test_login_widget_rejects_tampering_and_old_data() -> None:
    now = int(time.time())
    data = signed_widget(id=42, auth_date=now)
    with pytest.raises(UnauthorizedError):
        verify_login_widget({**data, "id": "43"}, TOKEN, max_age=60)
    with pytest.raises(UnauthorizedError):
        verify_login_widget({k: v for k, v in data.items() if k != "hash"}, TOKEN, max_age=60)
    with pytest.raises(UnauthorizedError):
        verify_login_widget(data, "other:token", max_age=60)
    old = signed_widget(id=42, auth_date=now - 3600)
    with pytest.raises(UnauthorizedError, match="expirée"):
        verify_login_widget(old, TOKEN, max_age=60)
    future = signed_widget(id=42, auth_date=now + 3600)
    with pytest.raises(UnauthorizedError):
        verify_login_widget(future, TOKEN, max_age=60)


def test_valid_webapp_init_data() -> None:
    user = json.dumps({"id": 7, "first_name": "Ibrahim", "language_code": "fr"})
    init_data = signed_init_data(
        auth_date=str(int(time.time())), query_id="AAA", user=user, signature="sig"
    )
    identity = verify_webapp_init_data(init_data, TOKEN, max_age=60)
    assert identity.telegram_id == 7
    assert identity.language_code == "fr"


def test_webapp_init_data_rejects_tampering() -> None:
    user = json.dumps({"id": 7})
    init_data = signed_init_data(auth_date=str(int(time.time())), user=user)
    with pytest.raises(UnauthorizedError):
        verify_webapp_init_data(init_data.replace("7", "8", 1), TOKEN, max_age=60)
    with pytest.raises(UnauthorizedError):
        verify_webapp_init_data("not a query string", TOKEN, max_age=60)
    without_user = signed_init_data(auth_date=str(int(time.time())))
    with pytest.raises(UnauthorizedError):
        verify_webapp_init_data(without_user, TOKEN, max_age=60)
