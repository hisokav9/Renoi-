"""Telegram bot conversation logic.

The onboarding flow is *stateless*: each button carries the identifier of the choice and the
selection is saved on the profile at every step, so an interrupted onboarding simply resumes.
Only the "waiting for a support message" step is kept in Redis (short TTL).

Callback data (64 bytes max):
``m:<screen>`` menus · ``lang:<code>`` · ``ob:c:<country>`` · ``ob:cy:<cycle>`` ·
``ob:g:<grade_id>`` · ``ob:s:<series_id|none>`` · ``pf:school`` · ``acc:del[:yes]`` · ``h:<offset>``
"""

from __future__ import annotations

import html
import textwrap
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from zoneinfo import ZoneInfo

import structlog
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from edtech.core.i18n import SUPPORTED_LOCALES, localized, normalize_locale, t
from edtech.core.metrics import TELEGRAM_UPDATES
from edtech.core.rate_limit import RateLimiter
from edtech.infra.db import Database
from edtech.modules.auth.permissions import Permission, roles_with
from edtech.modules.credits import service as credits
from edtech.modules.curriculum import service as curriculum
from edtech.modules.curriculum.models import Country, GradeLevel, Series
from edtech.modules.jobs import service as jobs
from edtech.modules.jobs.pipeline import PipelineRegistry
from edtech.modules.support import service as support
from edtech.modules.telegram.admin import AdminConsole
from edtech.modules.telegram.client import TelegramApiError, TelegramClient
from edtech.modules.telegram.types import (
    InlineKeyboard,
    TgCallbackQuery,
    TgMessage,
    TgUpdate,
    TgUser,
    inline_keyboard,
)
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserRole
from edtech.modules.users.schemas import ProfileUpdate
from edtech.settings import Settings

log = structlog.stdlib.get_logger(__name__)

HISTORY_PAGE_SIZE = 5
SUPPORT_STATE_TTL_SECONDS = 900

BOT_COMMANDS = {
    "fr": [
        ("start", "cmd_start"),
        ("menu", "cmd_menu"),
        ("compte", "cmd_account"),
        ("historique", "cmd_history"),
        ("aide", "cmd_help"),
    ],
    "en": [
        ("start", "cmd_start"),
        ("menu", "cmd_menu"),
        ("account", "cmd_account"),
        ("history", "cmd_history"),
        ("help", "cmd_help"),
    ],
}


@dataclass(slots=True)
class Ctx:
    session: AsyncSession
    user: User
    tg_user: TgUser
    chat_id: int
    message_id: int | None = None  # message à modifier (navigation par boutons)

    @property
    def locale(self) -> str:
        return self.user.locale

    @property
    def name(self) -> str:
        return html.escape(self.tg_user.first_name or "")

    def t(self, key: str, **params: object) -> str:
        return t(self.locale, key, **params)


class TelegramBot:
    def __init__(
        self,
        *,
        db: Database,
        client: TelegramClient,
        redis: Redis,
        settings: Settings,
        rate_limiter: RateLimiter,
        registry: PipelineRegistry,
    ) -> None:
        self._db = db
        self._client = client
        self._redis = redis
        self._settings = settings
        self._rate_limiter = rate_limiter
        self._registry = registry
        self.admin = AdminConsole(self)
        self._commands: dict[str, Callable[[Ctx, str], Awaitable[None]]] = {
            "start": self._cmd_start,
            "menu": self._cmd_menu,
            "compte": self._cmd_account,
            "account": self._cmd_account,
            "historique": self._cmd_history,
            "history": self._cmd_history,
            "aide": self._cmd_help,
            "help": self._cmd_help,
            "support": self._cmd_support,
            "langue": self._cmd_language,
            "language": self._cmd_language,
            "admin": self._cmd_admin,
        }

    @property
    def client(self) -> TelegramClient:
        return self._client

    @property
    def redis(self) -> Redis:
        return self._redis

    @property
    def settings(self) -> Settings:
        return self._settings

    # --- Entrée --------------------------------------------------------------------------------

    async def handle_update(self, update: TgUpdate) -> None:
        kind = update.kind
        message = update.message
        callback = update.callback_query
        tg_user = callback.from_user if callback else (message.from_user if message else None)
        chat = (callback.message.chat if callback and callback.message else None) or (
            message.chat if message else None
        )
        if tg_user is None or chat is None or tg_user.is_bot:
            TELEGRAM_UPDATES.labels(kind, "ignored").inc()
            return
        if chat.type != "private":
            TELEGRAM_UPDATES.labels(kind, "ignored_group").inc()
            return

        limit = await self._rate_limiter.hit(
            f"tg:{tg_user.id}",
            limit=self._settings.rate_limit_telegram_per_minute,
            window_seconds=60,
        )
        if not limit.allowed:
            TELEGRAM_UPDATES.labels(kind, "rate_limited").inc()
            if callback:
                await self.safe(self._client.answer_callback_query(callback.id))
            if limit.first_rejection:
                await self.safe(
                    self._client.send_message(
                        chat.id,
                        t(
                            normalize_locale(tg_user.language_code),
                            "rate_limited",
                            seconds=limit.retry_after,
                        ),
                    )
                )
            return

        try:
            async with self._db.session() as session:
                user, created = await users.register_telegram_user(
                    session,
                    self._settings,
                    telegram_id=tg_user.id,
                    language_code=tg_user.language_code,
                )
                structlog.contextvars.bind_contextvars(user_id=str(user.id))
                ctx = Ctx(session=session, user=user, tg_user=tg_user, chat_id=chat.id)
                if not user.is_active:
                    await self.send(ctx, ctx.t("account_suspended"))
                    TELEGRAM_UPDATES.labels(kind, "suspended").inc()
                    return
                await users.touch(session, user)
                if tg_user.id in self._settings.admin_telegram_ids and user.role != UserRole.ADMIN:
                    await users.set_role(session, user, UserRole.ADMIN, actor_user_id=None)
                if callback:
                    await self._on_callback(ctx, callback)
                elif message:
                    await self._on_message(ctx, message, created=created)
            TELEGRAM_UPDATES.labels(kind, "ok").inc()
        except Exception:
            TELEGRAM_UPDATES.labels(kind, "error").inc()
            log.exception("telegram_update_failed", update_id=update.update_id)
            await self.safe(
                self._client.send_message(
                    chat.id, t(normalize_locale(tg_user.language_code), "error_generic")
                )
            )
        finally:
            if callback:
                await self.safe(self._client.answer_callback_query(callback.id))
            structlog.contextvars.unbind_contextvars("user_id")

    async def _on_message(self, ctx: Ctx, message: TgMessage, *, created: bool) -> None:
        if message.has_media:
            await self._on_media(ctx, message)
            return
        text = (message.text or "").strip()
        if text.startswith("/"):
            command, _, args = text[1:].partition(" ")
            command = command.split("@", 1)[0].lower()
            handler = self._commands.get(command)
            if handler is not None:
                await self.clear_state(ctx)
                await handler(ctx, args.strip())
                return
        state = await self.get_state(ctx) if text else None
        if state == "support":
            await self.clear_state(ctx)
            await self._receive_support_message(ctx, text)
            return
        if state and state.startswith("adm:") and await self.admin.on_text(ctx, state, text):
            return
        if created or ctx.user.onboarded_at is None:
            await self._cmd_start(ctx, "")
            return
        await self.send(ctx, ctx.t("unknown_input"), self.main_menu(ctx))

    async def _on_callback(self, ctx: Ctx, callback: TgCallbackQuery) -> None:
        data = callback.data or ""
        if callback.message:
            ctx.message_id = callback.message.message_id
        parts = data.split(":")
        head = parts[0]
        # Tout bouton annule une saisie en attente (message d'assistance, réponse, référence).
        await self.clear_state(ctx)
        if head == "m" and len(parts) == 2:
            await self._on_menu(ctx, parts[1])
        elif head == "lang" and len(parts) == 2:
            await self._on_language(ctx, parts[1])
        elif head == "ob" and len(parts) == 3:
            await self._on_onboarding(ctx, parts[1], parts[2])
        elif data == "pf:school":
            await self._ask_country(ctx)
        elif head == "acc":
            await self._on_account_action(ctx, parts[1:])
        elif head == "h" and len(parts) == 2 and parts[1].isdigit():
            await self._show_history(ctx, offset=int(parts[1]))
        elif head == "adm":
            await self.admin.on_callback(ctx, parts[1:])
        else:
            log.info("telegram_unknown_callback")
            await self.show_main_menu(ctx)

    # --- Commandes -----------------------------------------------------------------------------

    async def _cmd_start(self, ctx: Ctx, _args: str) -> None:
        if ctx.user.onboarded_at is None:
            await self.send(ctx, ctx.t("welcome_new", name=ctx.name))
            await self._ask_language(ctx)
            return
        await self.send(ctx, ctx.t("welcome_back", name=ctx.name), self.main_menu(ctx))

    async def _cmd_menu(self, ctx: Ctx, _args: str) -> None:
        await self.show_main_menu(ctx)

    async def _cmd_account(self, ctx: Ctx, _args: str) -> None:
        await self._show_account(ctx)

    async def _cmd_history(self, ctx: Ctx, _args: str) -> None:
        await self._show_history(ctx, offset=0)

    async def _cmd_help(self, ctx: Ctx, _args: str) -> None:
        await self._show_help(ctx)

    async def _cmd_support(self, ctx: Ctx, _args: str) -> None:
        await self._start_support(ctx)

    async def _cmd_language(self, ctx: Ctx, _args: str) -> None:
        await self._ask_language(ctx)

    async def _cmd_admin(self, ctx: Ctx, _args: str) -> None:
        await self.admin.open(ctx)

    # --- Menus ---------------------------------------------------------------------------------

    def main_menu(self, ctx: Ctx) -> InlineKeyboard:
        return inline_keyboard(
            [
                [(ctx.t("btn_correct"), "m:correct")],
                [(ctx.t("btn_history"), "m:hist"), (ctx.t("btn_account"), "m:acc")],
                [(ctx.t("btn_preferences"), "m:prefs"), (ctx.t("btn_help"), "m:help")],
            ]
        )

    def _back(self, ctx: Ctx) -> list[tuple[str, str]]:
        return [(ctx.t("btn_back"), "m:main")]

    async def _on_menu(self, ctx: Ctx, screen: str) -> None:
        match screen:
            case "correct":
                await self.show(
                    ctx, ctx.t(self._correction_message_key()), inline_keyboard([self._back(ctx)])
                )
            case "hist":
                await self._show_history(ctx, offset=0)
            case "acc":
                await self._show_account(ctx)
            case "prefs":
                await self.show(
                    ctx,
                    ctx.t("preferences_title"),
                    inline_keyboard(
                        [
                            [(ctx.t("btn_change_school"), "pf:school")],
                            [(ctx.t("btn_change_language"), "m:lang")],
                            self._back(ctx),
                        ]
                    ),
                )
            case "lang":
                await self._ask_language(ctx)
            case "help":
                await self._show_help(ctx)
            case "support":
                await self._start_support(ctx)
            case "buy":
                await self.show(
                    ctx, ctx.t("buy_credits_unavailable"), inline_keyboard([self._back(ctx)])
                )
            case _:
                await self.show_main_menu(ctx)

    async def show_main_menu(self, ctx: Ctx) -> None:
        await self.show(ctx, ctx.t("menu_title"), self.main_menu(ctx))

    async def _show_help(self, ctx: Ctx) -> None:
        await self.show(
            ctx,
            ctx.t("help"),
            inline_keyboard([[(ctx.t("btn_support"), "m:support")], self._back(ctx)]),
        )

    # --- Inscription / profil scolaire ---------------------------------------------------------

    async def _ask_language(self, ctx: Ctx) -> None:
        buttons = [[(t(code, f"lang_{code}"), f"lang:{code}") for code in SUPPORTED_LOCALES]]
        await self.show(ctx, ctx.t("onboarding_language"), inline_keyboard(buttons))

    async def _on_language(self, ctx: Ctx, code: str) -> None:
        if code not in SUPPORTED_LOCALES:
            await self.show_main_menu(ctx)
            return
        await users.update_profile(ctx.session, ctx.user, ProfileUpdate(locale=code))
        if ctx.user.onboarded_at is None:
            await self._ask_country(ctx)
        else:
            await self.show(ctx, ctx.t("language_changed"), self.main_menu(ctx))

    async def _ask_country(self, ctx: Ctx) -> None:
        countries = await curriculum.list_active_countries(ctx.session)
        rows = [[(localized(c.names, ctx.locale), f"ob:c:{c.code}")] for c in countries]
        await self.show(ctx, ctx.t("onboarding_country"), inline_keyboard(rows))

    async def _on_onboarding(self, ctx: Ctx, step: str, value: str) -> None:
        match step:
            case "c":
                await self._select_country(ctx, value)
            case "cy":
                await self._ask_grade(ctx, value)
            case "g":
                await self._select_grade(ctx, value)
            case "s":
                await self._select_series(ctx, value)
            case _:
                await self.show_main_menu(ctx)

    async def _select_country(self, ctx: Ctx, code: str) -> None:
        country = await ctx.session.get(Country, code.upper())
        if country is None or not country.active:
            await self._ask_country(ctx)
            return
        program = await curriculum.default_program(ctx.session, country.code)
        if program is None:
            await self.show(ctx, ctx.t("onboarding_no_program"), inline_keyboard([self._back(ctx)]))
            return
        await users.update_profile(
            ctx.session,
            ctx.user,
            ProfileUpdate(country_code=country.code, program_id=program.id),
        )
        cycles = await curriculum.list_cycles(ctx.session, program.id)
        rows = [[(ctx.t(f"cycle_{cycle}"), f"ob:cy:{cycle}")] for cycle in cycles]
        await self.show(ctx, ctx.t("onboarding_cycle"), inline_keyboard(rows))

    async def _ask_grade(self, ctx: Ctx, cycle: str) -> None:
        if ctx.user.program_id is None:
            await self._restart(ctx)
            return
        grades = await curriculum.list_grades(ctx.session, ctx.user.program_id, cycle=cycle)
        if not grades:
            await self._restart(ctx)
            return
        buttons = [(localized(g.names, ctx.locale), f"ob:g:{g.id}") for g in grades]
        rows = [buttons[i : i + 3] for i in range(0, len(buttons), 3)]
        await self.show(ctx, ctx.t("onboarding_grade"), inline_keyboard(rows))

    async def _select_grade(self, ctx: Ctx, raw_id: str) -> None:
        grade = await self._get_by_id(ctx, GradeLevel, raw_id)
        if grade is None or grade.program_id != ctx.user.program_id:
            await self._restart(ctx)
            return
        await users.update_profile(ctx.session, ctx.user, ProfileUpdate(grade_level_id=grade.id))
        options = await curriculum.series_for_grade(ctx.session, grade)
        if not options:
            await self._finish_onboarding(ctx)
            return
        rows = [[(localized(s.names, ctx.locale), f"ob:s:{s.id}")] for s in options]
        rows.append([(ctx.t("series_unknown"), "ob:s:none")])
        await self.show(ctx, ctx.t("onboarding_series"), inline_keyboard(rows))

    async def _select_series(self, ctx: Ctx, raw_id: str) -> None:
        if raw_id != "none":
            series = await self._get_by_id(ctx, Series, raw_id)
            if series is None or ctx.user.grade_level_id is None:
                await self._restart(ctx)
                return
            await users.update_profile(ctx.session, ctx.user, ProfileUpdate(series_id=series.id))
        await self._finish_onboarding(ctx)

    async def _finish_onboarding(self, ctx: Ctx) -> None:
        first_time = ctx.user.onboarded_at is None
        await users.complete_onboarding(ctx.session, ctx.user)
        profile = await self.profile_summary(ctx)
        if first_time:
            account = await credits.get_account(ctx.session, ctx.user.id)
            text = ctx.t(
                "onboarding_done", profile=profile, balance=account.balance if account else 0
            )
        else:
            text = ctx.t("profile_updated", profile=profile)
        await self.show(ctx, text, self.main_menu(ctx))

    async def _restart(self, ctx: Ctx) -> None:
        await self.send(ctx, ctx.t("step_expired"))
        await self._ask_country(ctx)

    async def profile_summary(self, ctx: Ctx, user: User | None = None) -> str:
        """School profile of ``user`` (default: the current user), in the reader's language."""
        unset = ctx.t("profile_not_set")
        user = user or ctx.user
        country = await ctx.session.get(Country, user.country_code) if user.country_code else None
        grade = (
            await ctx.session.get(GradeLevel, user.grade_level_id) if user.grade_level_id else None
        )
        series = await ctx.session.get(Series, user.series_id) if user.series_id else None
        return ctx.t(
            "profile_summary",
            country=html.escape(localized(country.names, ctx.locale)) if country else unset,
            grade=html.escape(localized(grade.names, ctx.locale)) if grade else unset,
            series=html.escape(localized(series.names, ctx.locale)) if series else unset,
        )

    # --- Compte --------------------------------------------------------------------------------

    async def _show_account(self, ctx: Ctx) -> None:
        account = await credits.get_account(ctx.session, ctx.user.id)
        since = ctx.user.created_at.astimezone(await self.timezone(ctx)).strftime("%d/%m/%Y")
        text = ctx.t(
            "account",
            balance=account.balance if account else 0,
            reserved=account.reserved if account else 0,
            plan=ctx.t("plan_free"),
            since=since,
            ref=users.user_reference(ctx.user.id),
            profile=await self.profile_summary(ctx),
        )
        keyboard = inline_keyboard(
            [
                [(ctx.t("btn_buy_credits"), "m:buy")],
                [(ctx.t("btn_support"), "m:support")],
                [(ctx.t("btn_delete_account"), "acc:del")],
                self._back(ctx),
            ]
        )
        await self.show(ctx, text, keyboard)

    async def _on_account_action(self, ctx: Ctx, parts: list[str]) -> None:
        if parts == ["del"]:
            await self.show(
                ctx,
                ctx.t("delete_confirm"),
                inline_keyboard(
                    [
                        [(ctx.t("btn_confirm_delete"), "acc:del:yes")],
                        [(ctx.t("btn_cancel"), "m:acc")],
                    ]
                ),
            )
        elif parts == ["del", "yes"]:
            locale = ctx.locale
            await users.delete_account(ctx.session, ctx.user, actor_user_id=ctx.user.id)
            await self.show(ctx, t(locale, "delete_done"), None)
        else:
            await self._show_account(ctx)

    # --- Historique ----------------------------------------------------------------------------

    async def _show_history(self, ctx: Ctx, *, offset: int) -> None:
        rows, total = await jobs.list_user_jobs(
            ctx.session, ctx.user.id, limit=HISTORY_PAGE_SIZE, offset=offset
        )
        if total == 0:
            await self.show(ctx, ctx.t("history_empty"), inline_keyboard([self._back(ctx)]))
            return
        tz = await self.timezone(ctx)
        lines = [ctx.t("history_title", total=total)]
        for job in rows:
            lines.append(
                ctx.t(
                    "history_item",
                    date=job.created_at.astimezone(tz).strftime("%d/%m/%Y %H:%M"),
                    status=ctx.t(f"job_status_{job.status}"),
                )
            )
        nav: list[tuple[str, str]] = []
        if offset > 0:
            nav.append((ctx.t("btn_previous"), f"h:{max(offset - HISTORY_PAGE_SIZE, 0)}"))
        if offset + HISTORY_PAGE_SIZE < total:
            nav.append((ctx.t("btn_next"), f"h:{offset + HISTORY_PAGE_SIZE}"))
        keyboard_rows = [nav] if nav else []
        keyboard_rows.append(self._back(ctx))
        await self.show(ctx, "\n".join(lines), inline_keyboard(keyboard_rows))

    # --- Corrections (phase 2) -----------------------------------------------------------------

    def _corrections_open(self) -> bool:
        return self._settings.feature_corrections_enabled and "correction" in self._registry

    def _correction_message_key(self) -> str:
        return "correct_instructions" if self._corrections_open() else "correct_unavailable"

    async def _on_media(self, ctx: Ctx, _message: TgMessage) -> None:
        # La réception des documents (validation, stockage, création du traitement) est livrée
        # en phase 2. D'ici là, aucun fichier n'est téléchargé ni conservé.
        await self.send(ctx, ctx.t("correct_unavailable"), self.main_menu(ctx))

    # --- Assistance ----------------------------------------------------------------------------

    async def _start_support(self, ctx: Ctx) -> None:
        await self.set_state(ctx, "support")
        await self.show(ctx, ctx.t("support_prompt"), inline_keyboard([self._back(ctx)]))

    async def _receive_support_message(self, ctx: Ctx, text: str) -> None:
        ticket = await support.open_ticket(
            ctx.session, user_id=ctx.user.id, channel="telegram", message=text
        )
        ref = support.ticket_reference(ticket.id)
        if self._settings.support_chat_id:
            await self.safe(
                self._client.send_message(
                    self._settings.support_chat_id,
                    t(
                        "fr",
                        "support_forward",
                        ref=ref,
                        user_ref=users.user_reference(ctx.user.id),
                        message=html.escape(ticket.message),
                    ),
                )
            )
        else:
            # Sans groupe d'assistance, l'équipe (support, admin) est prévenue directement.
            staff = await users.staff_telegram_contacts(
                ctx.session, roles_with(Permission.SUPPORT_READ)
            )
            excerpt = html.escape(textwrap.shorten(ticket.message, 200, placeholder="…"))
            for telegram_id, locale in staff:
                if telegram_id != ctx.tg_user.id:
                    await self.safe(
                        self._client.send_message(
                            telegram_id, t(locale, "admin_new_ticket", ref=ref, excerpt=excerpt)
                        )
                    )
        await self.send(ctx, ctx.t("support_received", ref=ref), self.main_menu(ctx))

    async def set_state(
        self, ctx: Ctx, value: str, *, ttl: int = SUPPORT_STATE_TTL_SECONDS
    ) -> None:
        await self._redis.set(self._state_key(ctx), value, ex=ttl)

    # --- Outils --------------------------------------------------------------------------------

    def _state_key(self, ctx: Ctx) -> str:
        return f"tg:state:{ctx.tg_user.id}"

    async def get_state(self, ctx: Ctx) -> str | None:
        value = await self._redis.get(self._state_key(ctx))
        if value is None:
            return None
        return value.decode() if isinstance(value, bytes) else str(value)

    async def clear_state(self, ctx: Ctx) -> None:
        await self._redis.delete(self._state_key(ctx))

    async def timezone(self, ctx: Ctx) -> ZoneInfo:
        if ctx.user.country_code:
            country = await ctx.session.get(Country, ctx.user.country_code)
            if country is not None:
                return ZoneInfo(country.timezone)
        return ZoneInfo("UTC")

    @staticmethod
    async def _get_by_id[M](ctx: Ctx, model: type[M], raw_id: str) -> M | None:
        try:
            return await ctx.session.get(model, uuid.UUID(raw_id))
        except ValueError:
            return None

    async def send(self, ctx: Ctx, text: str, keyboard: InlineKeyboard | None = None) -> None:
        await self._client.send_message(ctx.chat_id, text, reply_markup=keyboard)

    async def show(self, ctx: Ctx, text: str, keyboard: InlineKeyboard | None) -> None:
        """Edit the message the button belongs to, or send a new one."""
        if ctx.message_id is not None:
            try:
                await self._client.edit_message_text(
                    ctx.chat_id, ctx.message_id, text, reply_markup=keyboard
                )
                return
            except TelegramApiError as exc:
                log.info("telegram_edit_failed", code=exc.code)
        await self.send(ctx, text, keyboard)

    @staticmethod
    async def safe(call: Awaitable[object]) -> None:
        try:
            await call
        except TelegramApiError as exc:
            log.warning("telegram_call_failed", method=exc.method, code=exc.code)


async def register_commands(client: TelegramClient) -> None:
    """Publish the command list shown in Telegram's menu, per language."""
    for locale, commands in BOT_COMMANDS.items():
        await client.set_my_commands(
            [(name, t(locale, key)) for name, key in commands], language_code=locale
        )
    await client.set_my_commands([(name, t("fr", key)) for name, key in BOT_COMMANDS["fr"]])
