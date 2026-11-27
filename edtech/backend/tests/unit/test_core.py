from __future__ import annotations

import string
import time
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from pydantic import SecretStr, ValidationError

from edtech.core.errors import UnauthorizedError
from edtech.core.i18n import CATALOGS, localized, normalize_locale, t
from edtech.core.ids import uuid7
from edtech.core.logging import REDACTED, redact_sensitive
from edtech.core.security import create_access_token, decode_access_token, hash_token
from edtech.modules.auth.permissions import Permission, has_permission
from edtech.settings import Environment, Settings
from tests.conftest import make_settings


def test_uuid7_is_versioned_and_time_ordered() -> None:
    first = uuid7()
    time.sleep(0.002)
    second = uuid7()
    assert first.version == 7
    assert first.variant == uuid.RFC_4122
    assert first < second
    assert len({uuid7() for _ in range(1000)}) == 1000


def _placeholders(template: str) -> set[str]:
    return {name for _, name, _, _ in string.Formatter().parse(template) if name}


def test_catalogs_have_identical_keys_and_placeholders() -> None:
    reference = CATALOGS["fr"]
    for locale, catalog in CATALOGS.items():
        assert set(catalog) == set(reference), f"clés différentes pour {locale}"
        for key, template in catalog.items():
            assert _placeholders(template) == _placeholders(reference[key]), (locale, key)


def test_translation_helpers() -> None:
    assert normalize_locale("fr-FR") == "fr"
    assert normalize_locale("en_US") == "en"
    assert normalize_locale("ha") == "fr"
    assert normalize_locale(None, default="en") == "en"
    assert t("en", "welcome_back", name="Awa").startswith("Welcome back Awa")
    assert t("de", "btn_back") == t("fr", "btn_back")
    with pytest.raises(KeyError):
        t("fr", "does_not_exist")
    assert localized({"fr": "Niger", "en": "Niger (EN)"}, "en") == "Niger (EN)"
    assert localized({"fr": "Niger"}, "en") == "Niger"
    assert localized(None, "fr") == ""


def test_redaction_masks_sensitive_keys_recursively() -> None:
    event = {
        "event": "x",
        "token": "abc",
        "payload": {"first_name": "Awa", "nested": [{"text": "hello", "ok": 1}]},
        "user_id": "u-1",
    }
    out = redact_sensitive(None, "info", event)
    assert out["token"] == REDACTED
    assert out["payload"]["first_name"] == REDACTED
    assert out["payload"]["nested"][0]["text"] == REDACTED
    assert out["payload"]["nested"][0]["ok"] == 1
    assert out["user_id"] == "u-1"


def test_access_token_roundtrip_and_rejections(tmp_path) -> None:
    settings = make_settings(tmp_path)
    user_id = uuid7()
    token, _ = create_access_token(settings, user_id=user_id, role="student")
    claims = decode_access_token(settings, token)
    assert claims.user_id == user_id
    assert claims.role == "student"

    expired, _ = create_access_token(
        settings, user_id=user_id, role="student", now=datetime.now(UTC) - timedelta(hours=1)
    )
    with pytest.raises(UnauthorizedError, match="expiré"):
        decode_access_token(settings, expired)
    with pytest.raises(UnauthorizedError):
        decode_access_token(settings, token[:-2] + "xx")
    other = make_settings(tmp_path, jwt_secret=SecretStr("another-secret-another-secret-0000"))
    with pytest.raises(UnauthorizedError):
        decode_access_token(other, token)
    assert hash_token("a") != hash_token("b")
    assert len(hash_token("a")) == 64


def _prod(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "environment": Environment.PRODUCTION,
        "jwt_secret": SecretStr("x" * 40),
        "storage_backend": "s3",
        "s3_bucket": "bucket",
        "metrics_token": SecretStr("metrics"),
        "public_base_url": "https://api.example.com",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[arg-type]


def test_production_refuses_insecure_configuration() -> None:
    assert _prod().is_deployed
    with pytest.raises(ValidationError, match="JWT_SECRET"):
        Settings(_env_file=None, environment=Environment.PRODUCTION)  # type: ignore[call-arg]
    with pytest.raises(ValidationError, match="STORAGE_BACKEND"):
        _prod(storage_backend="local")
    with pytest.raises(ValidationError, match="HTTPS"):
        _prod(public_base_url="http://api.example.com")
    with pytest.raises(ValidationError, match="WEBHOOK_SECRET"):
        _prod(telegram_bot_token=SecretStr("1:x"))
    with pytest.raises(ValidationError, match="METRICS_TOKEN"):
        _prod(metrics_token=None)


def test_secrets_are_not_printed() -> None:
    settings = _prod(
        telegram_bot_token=SecretStr("1:secret"), telegram_webhook_secret=SecretStr("w")
    )
    assert "1:secret" not in repr(settings)


@pytest.mark.parametrize(
    ("role", "permission", "expected"),
    [
        ("student", Permission.JOBS_READ_OWN, True),
        ("student", Permission.JOBS_READ_ANY, False),
        ("student", Permission.CREDITS_GRANT, False),
        ("reviewer", Permission.JOBS_REVIEW, True),
        ("reviewer", Permission.CREDITS_GRANT, False),
        ("support", Permission.SUPPORT_READ, True),
        ("support", Permission.USERS_MANAGE_ROLES, False),
        ("admin", Permission.USERS_MANAGE_ROLES, True),
        ("unknown-role", Permission.JOBS_READ_OWN, False),
    ],
)
def test_role_permissions(role: str, permission: Permission, expected: bool) -> None:
    assert has_permission(role, permission) is expected


def test_managed_database_urls_and_admin_ids_are_normalized(tmp_path) -> None:
    settings = make_settings(
        tmp_path,
        database_url="postgres://u:p@db:5432/app",
        admin_telegram_ids="123, 456",
    )
    assert settings.database_url == "postgresql+asyncpg://u:p@db:5432/app"
    assert settings.admin_telegram_ids == [123, 456]
    assert make_settings(tmp_path, admin_telegram_ids="").admin_telegram_ids == []


def test_webhook_token_is_telegram_compatible(tmp_path) -> None:
    base64_like = SecretStr("aB+/cd==" * 6)  # format généré par Render (generateValue)
    token = make_settings(tmp_path, telegram_webhook_secret=base64_like).telegram_secret_token
    assert token is not None
    assert len(token) == 64
    assert all(c in "0123456789abcdef" for c in token)
    assert make_settings(tmp_path, telegram_webhook_secret=None).telegram_secret_token is None


def test_disabled_storage_is_only_allowed_while_corrections_are_closed() -> None:
    assert _prod(storage_backend="disabled").storage_backend == "disabled"
    with pytest.raises(ValidationError, match="S3"):
        _prod(storage_backend="disabled", feature_corrections_enabled=True)
