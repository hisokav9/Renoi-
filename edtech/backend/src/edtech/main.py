"""ASGI application factory.

Run with: ``uvicorn edtech.main:create_app --factory --proxy-headers``.
"""

from __future__ import annotations

import re
import secrets
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import structlog
from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from edtech.api.routes import admin, auth, curriculum, health, jobs, me, telegram
from edtech.container import Container
from edtech.core.errors import install_error_handlers
from edtech.core.logging import configure_logging
from edtech.core.metrics import metrics_middleware
from edtech.settings import Environment, Settings, get_settings

_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{8,64}$")


def _init_sentry(settings: Settings) -> None:
    if settings.sentry_dsn is None:
        return
    import sentry_sdk  # noqa: PLC0415

    sentry_sdk.init(
        dsn=settings.sentry_dsn.get_secret_value(),
        environment=settings.environment.value,
        release=settings.app_version,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        # Données de mineurs : aucune donnée identifiante, aucun corps de requête, aucune
        # variable locale ne doit partir chez Sentry.
        data_collection={
            "user_info": False,
            "http_bodies": [],
            "database_query_data": False,
            "queues": False,
            "stack_frame_variables": False,
        },
    )


def create_app(settings: Settings | None = None, *, container: Container | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level, json=settings.log_json)
    _init_sentry(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        owned = container is None
        app.state.container = container or Container.build(settings)
        structlog.stdlib.get_logger("edtech").info(
            "app_started", environment=settings.environment.value, version=settings.app_version
        )
        try:
            yield
        finally:
            if owned:
                await app.state.container.aclose()

    docs_enabled = settings.environment != Environment.PRODUCTION
    app = FastAPI(
        title="EdTech IA — API",
        version=settings.app_version,
        lifespan=lifespan,
        docs_url="/docs" if docs_enabled else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )
    install_error_handlers(app)

    if settings.cors_allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_allowed_origins,
            allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
            allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
            max_age=600,
        )

    @app.middleware("http")
    async def _metrics(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        return await metrics_middleware(request, call_next)

    @app.middleware("http")
    async def _request_context(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if _REQUEST_ID.match(incoming) else secrets.token_hex(12)
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        if settings.is_deployed:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

    app.include_router(health.router)
    v1 = APIRouter(prefix="/api/v1")
    for module in (auth, me, jobs, curriculum, admin, telegram):
        v1.include_router(module.router)
    app.include_router(v1)
    return app
