"""Operations CLI: ``python -m edtech.cli <command>`` (or ``edtech <command>``)."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import uuid

from edtech.container import Container
from edtech.core.logging import configure_logging
from edtech.infra.queue import InMemoryDispatcher
from edtech.modules.curriculum import service as curriculum
from edtech.modules.telegram.bot import register_commands
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserRole
from edtech.settings import get_settings

ALLOWED_UPDATES = ["message", "callback_query"]


async def _seed(container: Container) -> int:
    async with container.db.session() as session:
        countries = await curriculum.seed_all(session)
        await session.commit()
    print(f"Catalogue chargé : {', '.join(countries)}")
    return 0


def _require_telegram(container: Container) -> None:
    if container.telegram is None:
        raise SystemExit("EDTECH_TELEGRAM_BOT_TOKEN n'est pas défini")


async def _set_webhook(container: Container, drop_pending: bool) -> int:
    _require_telegram(container)
    settings = container.settings
    if not settings.public_base_url or not settings.telegram_webhook_secret:
        raise SystemExit("EDTECH_PUBLIC_BASE_URL et EDTECH_TELEGRAM_WEBHOOK_SECRET sont requis")
    url = f"{settings.public_base_url.rstrip('/')}/api/v1/telegram/webhook"
    assert container.telegram is not None  # noqa: S101
    await container.telegram.set_webhook(
        url,
        secret_token=settings.telegram_webhook_secret.get_secret_value(),
        allowed_updates=ALLOWED_UPDATES,
        drop_pending=drop_pending,
    )
    await register_commands(container.telegram)
    print(f"Webhook enregistré : {url}")
    return 0


async def _webhook_info(container: Container) -> int:
    _require_telegram(container)
    assert container.telegram is not None  # noqa: S101
    info = await container.telegram.get_webhook_info()
    print(json.dumps(info, indent=2, ensure_ascii=False))
    return 0


async def _delete_webhook(container: Container) -> int:
    _require_telegram(container)
    assert container.telegram is not None  # noqa: S101
    await container.telegram.delete_webhook()
    print("Webhook supprimé")
    return 0


async def _set_role(container: Container, args: argparse.Namespace) -> int:
    async with container.db.session() as session:
        user: User | None
        if args.telegram_id is not None:
            user = await users.get_by_telegram_id(session, args.telegram_id)
        else:
            user = await session.get(User, uuid.UUID(args.user_id))
        if user is None:
            print("Utilisateur introuvable (il doit d'abord écrire au bot)", file=sys.stderr)
            return 1
        await users.set_role(session, user, UserRole(args.role), actor_user_id=None)
    print(f"Rôle de {user.id} : {args.role}")
    return 0


async def _main(args: argparse.Namespace) -> int:
    settings = get_settings()
    configure_logging(settings.log_level, json=settings.log_json)
    container = Container.build(settings, dispatcher=InMemoryDispatcher())
    try:
        match args.command:
            case "seed":
                return await _seed(container)
            case "telegram-set-webhook":
                return await _set_webhook(container, args.drop_pending)
            case "telegram-webhook-info":
                return await _webhook_info(container)
            case "telegram-delete-webhook":
                return await _delete_webhook(container)
            case "set-role":
                return await _set_role(container, args)
    finally:
        await container.aclose()
    return 2


def main() -> None:
    parser = argparse.ArgumentParser(prog="edtech")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("seed", help="Charger/mettre à jour le catalogue pédagogique (idempotent)")
    hook = sub.add_parser("telegram-set-webhook", help="Déclarer le webhook et les commandes")
    hook.add_argument("--drop-pending", action="store_true")
    sub.add_parser("telegram-webhook-info", help="Afficher l'état du webhook")
    sub.add_parser("telegram-delete-webhook", help="Supprimer le webhook")
    role = sub.add_parser("set-role", help="Attribuer un rôle (ex. premier administrateur)")
    target = role.add_mutually_exclusive_group(required=True)
    target.add_argument("--user-id")
    target.add_argument("--telegram-id", type=int)
    role.add_argument("--role", required=True, choices=[r.value for r in UserRole])
    sys.exit(asyncio.run(_main(parser.parse_args())))


if __name__ == "__main__":
    main()
