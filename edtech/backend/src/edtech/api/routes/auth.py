"""Authentication for the web and mobile clients (the bot authenticates via the webhook)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, status

from edtech.api.deps import SessionDep, SettingsDep, auth_rate_limit
from edtech.api.schemas import RefreshRequest, TokenResponse, WebAppLoginRequest
from edtech.core.errors import NotFoundError
from edtech.modules.auth import service as auth
from edtech.modules.auth.service import TokenPair
from edtech.modules.auth.telegram import verify_login_widget, verify_webapp_init_data
from edtech.settings import Settings

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(auth_rate_limit)])

WidgetPayload = Annotated[dict[str, str | int], Body(max_length=16)]


def _bot_token(settings: Settings) -> str:
    if settings.telegram_bot_token is None:
        raise NotFoundError("Connexion Telegram non configurée")
    return settings.telegram_bot_token.get_secret_value()


def _response(pair: TokenPair) -> TokenResponse:
    return TokenResponse(
        access_token=pair.access_token,
        expires_at=pair.access_expires_at,
        refresh_token=pair.refresh_token,
        refresh_expires_at=pair.refresh_expires_at,
    )


@router.post("/telegram/widget", response_model=TokenResponse)
async def login_telegram_widget(
    payload: WidgetPayload, session: SessionDep, settings: SettingsDep
) -> TokenResponse:
    """Log in with the Telegram Login Widget (website)."""
    identity = verify_login_widget(
        payload, _bot_token(settings), max_age=settings.telegram_login_max_age_seconds
    )
    return _response(await auth.login_with_telegram(session, settings, identity))


@router.post("/telegram/webapp", response_model=TokenResponse)
async def login_telegram_webapp(
    body: WebAppLoginRequest, session: SessionDep, settings: SettingsDep
) -> TokenResponse:
    """Log in from a Telegram Mini App (``Telegram.WebApp.initData``)."""
    identity = verify_webapp_init_data(
        body.init_data, _bot_token(settings), max_age=settings.telegram_login_max_age_seconds
    )
    return _response(await auth.login_with_telegram(session, settings, identity))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest, session: SessionDep, settings: SettingsDep
) -> TokenResponse:
    return _response(await auth.rotate(session, settings, body.refresh_token))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshRequest, session: SessionDep) -> None:
    await auth.logout(session, body.refresh_token)
