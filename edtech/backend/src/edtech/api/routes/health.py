"""Liveness/readiness probes and Prometheus metrics."""

from __future__ import annotations

import hmac
from typing import Any

from fastapi import APIRouter, Header, Response
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from edtech.api.deps import ContainerDep
from edtech.core.errors import UnauthorizedError
from edtech.core.metrics import REGISTRY

router = APIRouter(tags=["health"])


@router.get("/health/live")
async def live() -> dict[str, str]:
    """The process is up (used to restart a stuck container)."""
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(container: ContainerDep) -> JSONResponse:
    """Dependencies are reachable (used to route traffic and to validate a deployment)."""
    checks: dict[str, Any] = {}
    try:
        async with container.db.session() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"error: {type(exc).__name__}"
    try:
        await container.redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {type(exc).__name__}"
    try:
        await container.storage.ping()
        checks["storage"] = "ok"
    except Exception as exc:
        checks["storage"] = f"error: {type(exc).__name__}"
    healthy = all(v == "ok" for v in checks.values())
    body = {
        "status": "ok" if healthy else "degraded",
        "version": container.settings.app_version,
        "checks": checks,
    }
    return JSONResponse(body, status_code=200 if healthy else 503)


@router.get("/metrics", include_in_schema=False)
async def metrics(
    container: ContainerDep, authorization: str | None = Header(default=None)
) -> Response:
    token = container.settings.metrics_token
    if token is not None:
        expected = f"Bearer {token.get_secret_value()}"
        if not authorization or not hmac.compare_digest(authorization, expected):
            raise UnauthorizedError()
    return Response(generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)
