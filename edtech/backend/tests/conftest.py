"""Shared fixtures.

Integration tests need PostgreSQL and Redis (``docker compose up -d postgres redis`` or the CI
services). URLs can be overridden with EDTECH_TEST_DATABASE_URL / EDTECH_TEST_REDIS_URL.
"""

from __future__ import annotations

import asyncio
import json
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import httpx
import pytest
from alembic import command
from alembic.config import Config
from pydantic import SecretStr
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from edtech.container import Container
from edtech.core.security import create_access_token
from edtech.infra.queue import InMemoryDispatcher
from edtech.infra.storage import LocalStorage
from edtech.main import create_app
from edtech.models import Base
from edtech.modules.curriculum import service as curriculum
from edtech.modules.jobs.pipeline import PipelineRegistry
from edtech.modules.users import service as users
from edtech.modules.users.models import User
from edtech.settings import Environment, Settings

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.environ.get(
    "EDTECH_TEST_DATABASE_URL", "postgresql+asyncpg://edtech:edtech@localhost:5432/edtech_test"
)
TEST_REDIS_URL = os.environ.get("EDTECH_TEST_REDIS_URL", "redis://localhost:6379/15")
BOT_TOKEN = "123456:TEST-TOKEN"
WEBHOOK_SECRET = "test-webhook-secret"
SUPPORT_CHAT_ID = -100999


def make_settings(tmp: Path, **overrides: Any) -> Settings:
    values: dict[str, Any] = {
        "environment": Environment.TEST,
        "database_url": TEST_DATABASE_URL,
        "redis_url": TEST_REDIS_URL,
        "telegram_bot_token": SecretStr(BOT_TOKEN),
        "telegram_webhook_secret": SecretStr(WEBHOOK_SECRET),
        "telegram_bot_username": "edtech_test_bot",
        "support_chat_id": SUPPORT_CHAT_ID,
        "storage_local_path": tmp,
        "log_json": False,
        "log_level": "WARNING",
        "signup_free_credits": 5,
        "job_lease_seconds": 30,
        "rate_limit_telegram_per_minute": 1000,
        "rate_limit_auth_per_minute": 1000,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


def alembic_config(url: str) -> Config:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.attributes["database_url"] = url
    cfg.attributes["configure_logger"] = False
    return cfg


@pytest.fixture(scope="session")
def storage_dir(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return tmp_path_factory.mktemp("storage")


@pytest.fixture(scope="session")
def settings(storage_dir: Path) -> Settings:
    return make_settings(storage_dir)


@pytest.fixture(scope="session")
async def migrated(settings: Settings) -> None:
    """Recreate the test schema from the migrations (also validates them)."""
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
    await engine.dispose()
    # env.py calls asyncio.run(): run it outside the test event loop.
    await asyncio.to_thread(command.upgrade, alembic_config(settings.database_url), "head")


# --- Faux serveur Telegram -------------------------------------------------------------------


@dataclass
class FakeTelegram:
    calls: list[tuple[str, dict[str, Any]]] = field(default_factory=list)
    fail_methods: dict[str, dict[str, Any]] = field(default_factory=dict)

    def handler(self, request: httpx.Request) -> httpx.Response:
        method = request.url.path.rsplit("/", 1)[-1]
        payload = json.loads(request.content or b"{}")
        self.calls.append((method, payload))
        if method in self.fail_methods:
            return httpx.Response(200, json={"ok": False, **self.fail_methods[method]})
        result: Any = True
        if method in ("sendMessage", "editMessageText"):
            result = {
                "message_id": len(self.calls),
                "date": 0,
                "chat": {"id": payload["chat_id"], "type": "private"},
            }
        return httpx.Response(200, json={"ok": True, "result": result})

    def sent(self, *methods: str) -> list[dict[str, Any]]:
        wanted = methods or ("sendMessage", "editMessageText")
        return [p for m, p in self.calls if m in wanted]

    def last(self) -> dict[str, Any]:
        return self.sent()[-1]

    @staticmethod
    def buttons(payload: dict[str, Any]) -> list[str]:
        markup = payload.get("reply_markup") or {}
        return [b["callback_data"] for row in markup.get("inline_keyboard", []) for b in row]

    def reset(self) -> None:
        self.calls.clear()


@pytest.fixture
def fake_telegram() -> FakeTelegram:
    return FakeTelegram()


@pytest.fixture
def dispatcher() -> InMemoryDispatcher:
    return InMemoryDispatcher()


@pytest.fixture
def registry() -> PipelineRegistry:
    return PipelineRegistry()


@pytest.fixture
async def container(
    settings: Settings,
    migrated: None,
    fake_telegram: FakeTelegram,
    dispatcher: InMemoryDispatcher,
    registry: PipelineRegistry,
    storage_dir: Path,
) -> AsyncIterator[Container]:
    http = httpx.AsyncClient(transport=httpx.MockTransport(fake_telegram.handler))
    built = Container.build(
        settings,
        dispatcher=dispatcher,
        http=http,
        storage=LocalStorage(storage_dir),
        registry=registry,
    )
    await built.redis.flushdb()
    try:
        yield built
    finally:
        tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
        async with built.db.engine.begin() as conn:
            await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
        await built.redis.flushdb()
        await built.aclose()


@pytest.fixture
async def session(container: Container) -> AsyncIterator[AsyncSession]:
    async with container.db.session() as s:
        yield s


@pytest.fixture
async def seeded(container: Container) -> None:
    async with container.db.session() as s:
        await curriculum.seed_all(s)
        await s.commit()


@pytest.fixture
async def client(container: Container) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app(container.settings, container=container)
    app.state.container = container  # ASGITransport does not run the lifespan
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


# --- Utilisateurs ----------------------------------------------------------------------------

_next_telegram_id = iter(range(500_000, 600_000))


async def create_user(container: Container, *, role: str = "student") -> User:
    async with container.db.session() as s:
        user, _ = await users.register_telegram_user(
            s, container.settings, telegram_id=next(_next_telegram_id), language_code="fr"
        )
        if role != "student":
            await users.set_role(s, user, role, actor_user_id=None)
        return user


def auth_headers(settings: Settings, user: User) -> dict[str, str]:
    token, _ = create_access_token(settings, user_id=user.id, role=user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"
