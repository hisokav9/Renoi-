"""FastAPI dependencies: resources, current user, permissions, rate limits."""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.container import Container
from edtech.core.errors import ForbiddenError, RateLimitedError, UnauthorizedError
from edtech.core.security import decode_access_token
from edtech.modules.auth.permissions import Permission, has_permission
from edtech.modules.users.models import User
from edtech.settings import Settings

_bearer = HTTPBearer(auto_error=False)


def get_container(request: Request) -> Container:
    container: Container = request.app.state.container
    return container


def get_settings_dep(container: Annotated[Container, Depends(get_container)]) -> Settings:
    return container.settings


async def get_session(
    container: Annotated[Container, Depends(get_container)],
) -> AsyncIterator[AsyncSession]:
    """One session per request. Services commit explicitly; anything uncommitted is rolled back."""
    async with container.db.session() as session:
        yield session


ContainerDep = Annotated[Container, Depends(get_container)]
SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(
    session: SessionDep,
    settings: SettingsDep,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError()
    claims = decode_access_token(settings, credentials.credentials)
    user = await session.get(User, claims.user_id)
    # The role is read from the database, not the token: revocations apply immediately.
    if user is None or not user.is_active:
        raise UnauthorizedError("Compte inactif ou supprimé")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require(permission: Permission) -> Callable[[User], Awaitable[User]]:
    async def _check(user: CurrentUser) -> User:
        if not has_permission(user.role, permission):
            raise ForbiddenError()
        return user

    return _check


def client_ip(request: Request) -> str:
    # Behind the platform load balancer, uvicorn runs with --proxy-headers so request.client
    # already holds the real client address.
    return request.client.host if request.client else "unknown"


async def auth_rate_limit(request: Request, container: ContainerDep) -> None:
    result = await container.rate_limiter.hit(
        f"auth:{client_ip(request)}",
        limit=container.settings.rate_limit_auth_per_minute,
        window_seconds=60,
    )
    if not result.allowed:
        raise RateLimitedError(result.retry_after)
