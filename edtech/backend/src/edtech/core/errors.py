"""Domain errors and their HTTP mapping (RFC 9457 « problem+json »)."""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

PROBLEM_JSON = "application/problem+json"


class AppError(Exception):
    """Base class for expected, user-facing errors."""

    status_code: int = 400
    code: str = "bad_request"
    title: str = "Requête invalide"

    def __init__(self, detail: str | None = None, *, extra: dict[str, Any] | None = None) -> None:
        super().__init__(detail or self.title)
        self.detail = detail or self.title
        self.extra = extra or {}


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    title = "Ressource introuvable"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    title = "Authentification requise"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"
    title = "Accès refusé"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"
    title = "Conflit"


class InsufficientCreditsError(AppError):
    status_code = 402
    code = "insufficient_credits"
    title = "Crédits insuffisants"


class RateLimitedError(AppError):
    status_code = 429
    code = "rate_limited"
    title = "Trop de requêtes"

    def __init__(self, retry_after: int, detail: str | None = None) -> None:
        super().__init__(detail, extra={"retry_after": retry_after})
        self.retry_after = retry_after


def _problem(
    request: Request, status: int, code: str, title: str, detail: str, **extra: Any
) -> JSONResponse:
    body: dict[str, Any] = {
        "type": f"about:blank#{code}",
        "title": title,
        "status": status,
        "detail": detail,
        "code": code,
        "request_id": getattr(request.state, "request_id", None),
        **extra,
    }
    headers = {}
    if "retry_after" in extra:
        headers["Retry-After"] = str(extra["retry_after"])
    return JSONResponse(body, status_code=status, media_type=PROBLEM_JSON, headers=headers)


def install_error_handlers(app: FastAPI) -> None:
    log = structlog.stdlib.get_logger("edtech.errors")

    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError) -> JSONResponse:
        return _problem(request, exc.status_code, exc.code, exc.title, exc.detail, **exc.extra)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"loc": list(e.get("loc", ())), "msg": e.get("msg"), "type": e.get("type")}
            for e in exc.errors()
        ]
        return _problem(
            request,
            422,
            "validation_error",
            "Données invalides",
            "La requête contient des données invalides.",
            errors=errors,
        )

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled_exception", path=request.url.path)
        return _problem(
            request,
            500,
            "internal_error",
            "Erreur interne",
            "Une erreur inattendue s'est produite. L'équipe technique a été prévenue.",
        )
