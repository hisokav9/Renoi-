"""Operations CLI: ``python -m edtech.cli <command>`` (or ``edtech <command>``)."""

from __future__ import annotations

import argparse
import asyncio
import json
import signal
import sys
import uuid

from edtech.container import Container
from edtech.core.logging import configure_logging
from edtech.infra.queue import InMemoryDispatcher
from edtech.modules.curriculum import service as curriculum
from edtech.modules.telegram.bot import register_commands
from edtech.modules.telegram.polling import PollingConflictError, run_polling
from edtech.modules.telegram.updates import ALLOWED_UPDATES
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserRole
from edtech.settings import get_settings


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


async def _poll(container: Container, args: argparse.Namespace) -> int:
    """Run the bot with long polling (no public HTTPS address needed)."""
    _require_telegram(container)
    assert container.telegram is not None  # noqa: S101
    assert container.bot is not None  # noqa: S101
    if container.settings.is_deployed and not args.force:
        raise SystemExit("Le mode polling est réservé au développement (--force pour passer outre)")
    webhook = await container.telegram.get_webhook_info()
    if webhook.get("url"):
        if not args.replace_webhook:
            raise SystemExit(
                f"Un webhook est actif ({webhook['url']}). Ajoutez --replace-webhook pour le "
                "supprimer, puis relancez telegram-set-webhook après vos tests."
            )
        await container.telegram.delete_webhook()
    me = await container.telegram.get_me()
    await register_commands(container.telegram)
    print(f"Bot @{me.get('username')} en écoute (polling). Ctrl+C pour arrêter.", flush=True)

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    task = asyncio.create_task(
        run_polling(container.telegram, container.bot, container.redis, stop=stop)
    )
    stop_waiter = asyncio.create_task(stop.wait())
    done, _ = await asyncio.wait({task, stop_waiter}, return_when=asyncio.FIRST_COMPLETED)
    if task not in done:
        task.cancel()  # interrompt l'attente longue de getUpdates
    stop_waiter.cancel()
    try:
        handled = await task
    except asyncio.CancelledError:
        handled = None
    except PollingConflictError as exc:
        print(f"Conflit Telegram : {exc}", file=sys.stderr)
        return 1
    print(f"Arrêt du polling ({handled if handled is not None else '?'} mises à jour traitées).")
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


async def _main(args: argparse.Namespace) -> int:  # noqa: PLR0911 - one return per command
    settings = get_settings()
    configure_logging(settings.log_level, json=settings.log_json)
    # Le bot en polling peut créer des traitements : il lui faut la vraie file.
    dispatcher = None if args.command == "telegram-poll" else InMemoryDispatcher()
    container = Container.build(settings, dispatcher=dispatcher)
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
            case "telegram-poll":
                return await _poll(container, args)
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
    poll = sub.add_parser(
        "telegram-poll", help="Faire tourner le bot sans webhook (développement, tests)"
    )
    poll.add_argument("--replace-webhook", action="store_true")
    poll.add_argument("--force", action="store_true")
    role = sub.add_parser("set-role", help="Attribuer un rôle (ex. premier administrateur)")
    target = role.add_mutually_exclusive_group(required=True)
    target.add_argument("--user-id")
    target.add_argument("--telegram-id", type=int)
    role.add_argument("--role", required=True, choices=[r.value for r in UserRole])
    sys.exit(asyncio.run(_main(parser.parse_args())))


if __name__ == "__main__":
    main()
