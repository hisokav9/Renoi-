"""Token primitives: short-lived JWT access tokens and opaque refresh tokens."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt

from edtech.core.errors import UnauthorizedError
from edtech.settings import Settings

_ALGORITHM = "HS256"


@dataclass(frozen=True, slots=True)
class AccessClaims:
    user_id: uuid.UUID
    role: str
    expires_at: datetime


def create_access_token(
    settings: Settings, *, user_id: uuid.UUID, role: str, now: datetime | None = None
) -> tuple[str, datetime]:
    issued = now or datetime.now(UTC)
    expires = issued + timedelta(seconds=settings.jwt_access_ttl_seconds)
    payload = {
        "sub": str(user_id),
        "role": role,
        "typ": "access",
        "iss": settings.jwt_issuer,
        "iat": int(issued.timestamp()),
        "exp": int(expires.timestamp()),
        "jti": secrets.token_hex(8),
    }
    token = jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm=_ALGORITHM)
    return token, expires


def decode_access_token(settings: Settings, token: str) -> AccessClaims:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret.get_secret_value(),
            algorithms=[_ALGORITHM],
            issuer=settings.jwt_issuer,
            options={"require": ["sub", "exp", "iat", "iss", "typ"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Jeton expiré") from exc
    except jwt.PyJWTError as exc:
        raise UnauthorizedError("Jeton invalide") from exc
    if payload.get("typ") != "access":
        raise UnauthorizedError("Jeton invalide")
    try:
        user_id = uuid.UUID(payload["sub"])
    except ValueError as exc:
        raise UnauthorizedError("Jeton invalide") from exc
    return AccessClaims(
        user_id=user_id,
        role=str(payload.get("role", "")),
        expires_at=datetime.fromtimestamp(payload["exp"], UTC),
    )


def generate_refresh_token() -> str:
    """256-bit random opaque token. Only its SHA-256 hash is stored."""
    return secrets.token_urlsafe(32)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
