"""Back office inside the Telegram bot (``/admin``), for the support team and administrators.

* Invisible to students: ``/admin`` answers like an unknown command and forged ``adm:`` buttons
  lead back to the main menu.
* Every action re-checks the permission (the role is read from the database on each update).
* Granting credits only offers preset amounts, asks for confirmation, and uses a one-time token
  (Redis ``GETDEL``) so a double tap can never grant twice.

Callback data: ``adm:home`` · ``adm:stats`` · ``adm:tk:<offset>`` (open tickets) ·
``adm:t|tr|tc:<ticket_id>`` (view, reply, close) · ``adm:cr`` (ask a student reference) ·
``adm:cu:<user_id>`` (student card) · ``adm:ca:<user_id>:<amount>`` (confirm) ·
``adm:cg:<token>`` (grant).
"""

from __future__ import annotations

import html
import secrets
import textwrap
import uuid
from typing import TYPE_CHECKING

import structlog

from edtech.core.i18n import t as translate
from edtech.modules.admin import service as admin_service
from edtech.modules.audit import service as audit
from edtech.modules.auth.permissions import Permission, has_permission
from edtech.modules.credits import service as credits
from edtech.modules.support import service as support
from edtech.modules.support.models import SupportTicket, TicketStatus
from edtech.modules.telegram.client import TelegramApiError
from edtech.modules.telegram.types import InlineKeyboard, inline_keyboard
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserStatus

if TYPE_CHECKING:
    from edtech.modules.telegram.bot import Ctx, TelegramBot

log = structlog.stdlib.get_logger(__name__)

STAFF_PERMISSIONS = (Permission.USERS_READ_ANY, Permission.SUPPORT_READ, Permission.CREDITS_GRANT)
TICKETS_PAGE_SIZE = 5
GRANT_AMOUNTS = (1, 5, 10, 20)
GRANT_TOKEN_TTL_SECONDS = 600
INPUT_TTL_SECONDS = 900


def is_staff(user: User) -> bool:
    return any(has_permission(user.role, p) for p in STAFF_PERMISSIONS)


def _uuid(raw: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(raw)
    except ValueError:
        return None


class AdminConsole:
    def __init__(self, bot: TelegramBot) -> None:
        self._bot = bot

    # --- Entrées -------------------------------------------------------------------------------

    async def open(self, ctx: Ctx) -> None:
        """``/admin`` and the « Administration » button."""
        if not is_staff(ctx.user):
            await self._bot.send(ctx, ctx.t("unknown_input"), self._bot.main_menu(ctx))
            return
        await self._bot.show(ctx, ctx.t("admin_home"), await self._home_keyboard(ctx))

    async def on_callback(self, ctx: Ctx, parts: list[str]) -> None:
        if not is_staff(ctx.user):
            log.warning("admin_callback_denied")
            await self._bot.show_main_menu(ctx)
            return

        def allowed(permission: Permission) -> bool:
            return has_permission(ctx.user.role, permission)

        match parts:
            case ["stats"] if allowed(Permission.USERS_READ_ANY):
                await self._show_stats(ctx)
            case ["tk", offset] if offset.isdigit() and allowed(Permission.SUPPORT_READ):
                await self._show_tickets(ctx, int(offset))
            case ["t", raw] if allowed(Permission.SUPPORT_READ):
                await self._show_ticket(ctx, raw)
            case ["tr", raw] if allowed(Permission.SUPPORT_READ):
                await self._ask_reply(ctx, raw)
            case ["tc", raw] if allowed(Permission.SUPPORT_READ):
                await self._close_ticket(ctx, raw)
            case ["cr"] if allowed(Permission.CREDITS_GRANT):
                await self._bot.set_state(ctx, "adm:credit_ref", ttl=INPUT_TTL_SECONDS)
                await self._bot.show(ctx, ctx.t("admin_credit_prompt"), self._back_home(ctx))
            case ["cu", raw] if allowed(Permission.CREDITS_GRANT):
                await self._show_user_card(ctx, raw)
            case ["ca", raw, amount] if amount.isdigit() and allowed(Permission.CREDITS_GRANT):
                await self._confirm_grant(ctx, raw, int(amount))
            case ["cg", token] if allowed(Permission.CREDITS_GRANT):
                await self._grant(ctx, token)
            case _:
                await self.open(ctx)

    async def on_text(self, ctx: Ctx, state: str, text: str) -> bool:
        """Handle a typed message while an admin input is pending. True if consumed."""
        if not is_staff(ctx.user):
            await self._bot.clear_state(ctx)
            return False
        if state.startswith("adm:reply:") and has_permission(
            ctx.user.role, Permission.SUPPORT_READ
        ):
            await self._bot.clear_state(ctx)
            await self._send_reply(ctx, state.removeprefix("adm:reply:"), text)
            return True
        if state == "adm:credit_ref" and has_permission(ctx.user.role, Permission.CREDITS_GRANT):
            target = await users.find_by_reference(ctx.session, text)
            if target is None:
                await self._bot.send(
                    ctx,
                    ctx.t("admin_user_not_found", ref=html.escape(text.strip()[:20])),
                    self._back_home(ctx),
                )
                return True  # l'état est conservé : l'équipe peut renvoyer la référence
            await self._bot.clear_state(ctx)
            ctx.message_id = None  # nouvelle fiche sous le message tapé
            await self._show_user_card(ctx, str(target.id))
            return True
        await self._bot.clear_state(ctx)
        return False

    # --- Accueil et statistiques ---------------------------------------------------------------

    async def _home_keyboard(self, ctx: Ctx) -> InlineKeyboard:
        role = ctx.user.role
        rows: list[list[tuple[str, str]]] = []
        if has_permission(role, Permission.USERS_READ_ANY):
            rows.append([(ctx.t("btn_admin_stats"), "adm:stats")])
        if has_permission(role, Permission.SUPPORT_READ):
            count = await support.count_tickets(ctx.session)
            rows.append([(ctx.t("btn_admin_tickets", count=count), "adm:tk:0")])
        if has_permission(role, Permission.CREDITS_GRANT):
            rows.append([(ctx.t("btn_admin_credits"), "adm:cr")])
        rows.append([(ctx.t("btn_main_menu"), "m:main")])
        return inline_keyboard(rows)

    def _back_home(self, ctx: Ctx) -> InlineKeyboard:
        return inline_keyboard([[(ctx.t("btn_admin_home"), "adm:home")]])

    async def _show_stats(self, ctx: Ctx) -> None:
        stats = await admin_service.platform_stats(ctx.session)
        jobs = ", ".join(
            f"{ctx.t(f'job_status_{status}')} : {count}"
            for status, count in sorted(stats.jobs_7d.items())
        )
        text = ctx.t(
            "admin_stats",
            users=stats.users,
            onboarded=stats.onboarded,
            new_24h=stats.new_24h,
            new_7d=stats.new_7d,
            active_7d=stats.active_7d,
            open_tickets=stats.open_tickets,
            credits=stats.credits_available,
            jobs=jobs or ctx.t("admin_none"),
        )
        await self._bot.show(ctx, text, self._back_home(ctx))

    # --- Tickets -------------------------------------------------------------------------------

    async def _show_tickets(self, ctx: Ctx, offset: int) -> None:
        total = await support.count_tickets(ctx.session)
        if total == 0:
            await self._bot.show(ctx, ctx.t("admin_tickets_empty"), self._back_home(ctx))
            return
        tickets = await support.list_tickets(
            ctx.session, status=TicketStatus.OPEN, limit=TICKETS_PAGE_SIZE, offset=offset
        )
        tz = await self._bot.timezone(ctx)
        lines = [ctx.t("admin_tickets_title", total=total)]
        rows: list[list[tuple[str, str]]] = []
        for ticket in tickets:
            ref = support.ticket_reference(ticket.id)
            lines.append(
                ctx.t(
                    "admin_ticket_line",
                    ref=ref,
                    date=ticket.created_at.astimezone(tz).strftime("%d/%m %H:%M"),
                    excerpt=html.escape(textwrap.shorten(ticket.message, 60, placeholder="…")),
                )
            )
            rows.append([(f"#{ref}", f"adm:t:{ticket.id}")])
        nav: list[tuple[str, str]] = []
        if offset > 0:
            nav.append((ctx.t("btn_previous"), f"adm:tk:{max(offset - TICKETS_PAGE_SIZE, 0)}"))
        if offset + TICKETS_PAGE_SIZE < total:
            nav.append((ctx.t("btn_next"), f"adm:tk:{offset + TICKETS_PAGE_SIZE}"))
        if nav:
            rows.append(nav)
        rows.append([(ctx.t("btn_admin_home"), "adm:home")])
        await self._bot.show(ctx, "\n".join(lines), inline_keyboard(rows))

    async def _load_ticket(self, ctx: Ctx, raw: str) -> SupportTicket | None:
        ticket_id = _uuid(raw)
        return await support.get_ticket(ctx.session, ticket_id) if ticket_id else None

    async def _show_ticket(self, ctx: Ctx, raw: str) -> None:
        ticket = await self._load_ticket(ctx, raw)
        if ticket is None:
            await self.open(ctx)
            return
        student = await ctx.session.get(User, ticket.user_id)
        account = await credits.get_account(ctx.session, ticket.user_id)
        tz = await self._bot.timezone(ctx)
        text = ctx.t(
            "admin_ticket",
            ref=support.ticket_reference(ticket.id),
            date=ticket.created_at.astimezone(tz).strftime("%d/%m/%Y %H:%M"),
            user_ref=users.user_reference(ticket.user_id),
            balance=account.balance if account else 0,
            profile=await self._bot.profile_summary(ctx, student) if student else "",
            message=html.escape(ticket.message),
        )
        rows: list[list[tuple[str, str]]] = []
        if ticket.status == TicketStatus.OPEN:
            rows.append([(ctx.t("btn_admin_reply"), f"adm:tr:{ticket.id}")])
        if has_permission(ctx.user.role, Permission.CREDITS_GRANT):
            rows.append([(ctx.t("btn_admin_gift"), f"adm:cu:{ticket.user_id}")])
        if ticket.status == TicketStatus.OPEN:
            rows.append([(ctx.t("btn_admin_close"), f"adm:tc:{ticket.id}")])
        rows.append([(ctx.t("btn_back"), "adm:tk:0")])
        await self._bot.show(ctx, text, inline_keyboard(rows))

    async def _ask_reply(self, ctx: Ctx, raw: str) -> None:
        ticket = await self._load_ticket(ctx, raw)
        if ticket is None or ticket.status != TicketStatus.OPEN:
            await self._bot.show(ctx, ctx.t("admin_ticket_done"), self._back_home(ctx))
            return
        await self._bot.set_state(ctx, f"adm:reply:{ticket.id}", ttl=INPUT_TTL_SECONDS)
        await self._bot.show(
            ctx,
            ctx.t("admin_reply_prompt", ref=support.ticket_reference(ticket.id)),
            inline_keyboard([[(ctx.t("btn_cancel"), f"adm:t:{ticket.id}")]]),
        )

    async def _send_reply(self, ctx: Ctx, raw: str, text: str) -> None:
        ticket = await self._load_ticket(ctx, raw)
        if ticket is None or ticket.status != TicketStatus.OPEN:
            await self._bot.send(ctx, ctx.t("admin_ticket_done"), self._back_home(ctx))
            return
        ref = support.ticket_reference(ticket.id)
        student = await ctx.session.get(User, ticket.user_id)
        chat_id = await users.telegram_id_of(ctx.session, ticket.user_id)
        delivered = False
        if student is not None and student.status == UserStatus.ACTIVE and chat_id is not None:
            try:
                await self._bot.client.send_message(
                    chat_id,
                    translate(student.locale, "support_reply", ref=ref, message=html.escape(text)),
                )
                delivered = True
            except TelegramApiError as exc:
                log.warning("admin_reply_not_delivered", code=exc.code)
        if not delivered:
            await self._bot.send(ctx, ctx.t("admin_reply_failed"), self._back_home(ctx))
            return
        await support.answer_ticket(ctx.session, ticket, reply=text, actor_user_id=ctx.user.id)
        await self._bot.send(
            ctx, ctx.t("admin_reply_sent", ref=ref), await self._home_keyboard(ctx)
        )

    async def _close_ticket(self, ctx: Ctx, raw: str) -> None:
        ticket = await self._load_ticket(ctx, raw)
        if ticket is None or ticket.status != TicketStatus.OPEN:
            await self._bot.show(ctx, ctx.t("admin_ticket_done"), self._back_home(ctx))
            return
        await support.close_ticket(ctx.session, ticket, actor_user_id=ctx.user.id)
        await self._bot.show(
            ctx,
            ctx.t("admin_ticket_closed", ref=support.ticket_reference(ticket.id)),
            await self._home_keyboard(ctx),
        )

    # --- Crédits -------------------------------------------------------------------------------

    async def _active_user(self, ctx: Ctx, raw: str) -> User | None:
        user_id = _uuid(raw)
        user = await ctx.session.get(User, user_id) if user_id else None
        return user if user is not None and user.status != UserStatus.DELETED else None

    async def _show_user_card(self, ctx: Ctx, raw: str) -> None:
        student = await self._active_user(ctx, raw)
        if student is None:
            await self.open(ctx)
            return
        account = await credits.get_account(ctx.session, student.id)
        tz = await self._bot.timezone(ctx)
        text = ctx.t(
            "admin_user_card",
            user_ref=users.user_reference(student.id),
            since=student.created_at.astimezone(tz).strftime("%d/%m/%Y"),
            balance=account.balance if account else 0,
            profile=await self._bot.profile_summary(ctx, student),
        )
        amounts = [(f"+{n}", f"adm:ca:{student.id}:{n}") for n in GRANT_AMOUNTS]
        keyboard = inline_keyboard([amounts, [(ctx.t("btn_admin_home"), "adm:home")]])
        await self._bot.show(ctx, text, keyboard)

    async def _confirm_grant(self, ctx: Ctx, raw: str, amount: int) -> None:
        student = await self._active_user(ctx, raw)
        if student is None or amount not in GRANT_AMOUNTS:
            await self.open(ctx)
            return
        token = secrets.token_hex(8)
        await self._bot.redis.set(
            f"tg:admin:grant:{token}",
            f"{student.id}:{amount}:{ctx.user.id}",
            ex=GRANT_TOKEN_TTL_SECONDS,
        )
        await self._bot.show(
            ctx,
            ctx.t("admin_grant_confirm", amount=amount, user_ref=users.user_reference(student.id)),
            inline_keyboard(
                [
                    [(ctx.t("btn_confirm"), f"adm:cg:{token}")],
                    [(ctx.t("btn_cancel"), "adm:home")],
                ]
            ),
        )

    async def _grant(self, ctx: Ctx, token: str) -> None:
        raw = await self._bot.redis.getdel(f"tg:admin:grant:{token}")
        payload = raw.decode() if isinstance(raw, bytes) else raw
        try:
            user_raw, amount_raw, actor_raw = str(payload).split(":")
            amount = int(amount_raw)
        except ValueError:
            await self._bot.show(ctx, ctx.t("admin_grant_expired"), self._back_home(ctx))
            return
        student = await self._active_user(ctx, user_raw)
        if student is None or actor_raw != str(ctx.user.id) or amount not in GRANT_AMOUNTS:
            await self._bot.show(ctx, ctx.t("admin_grant_expired"), self._back_home(ctx))
            return
        transaction = await credits.grant(
            ctx.session,
            student.id,
            amount,
            idempotency_key=f"admin-bot:{token}",
            reason="Ajout par l'équipe (bot)",
            actor_user_id=ctx.user.id,
        )
        audit.record(
            ctx.session,
            actor_user_id=ctx.user.id,
            action="credits.granted",
            target_type="user",
            target_id=student.id,
            data={"amount": amount, "transaction_id": str(transaction.id), "source": "bot"},
        )
        await ctx.session.commit()
        await self._bot.show(
            ctx,
            ctx.t("admin_grant_done", amount=amount, balance=transaction.balance_after),
            await self._home_keyboard(ctx),
        )
        chat_id = await users.telegram_id_of(ctx.session, student.id)
        if chat_id is not None and chat_id != ctx.tg_user.id:
            await self._bot.safe(
                self._bot.client.send_message(
                    chat_id,
                    translate(
                        student.locale,
                        "credits_gift",
                        amount=amount,
                        balance=transaction.balance_after,
                    ),
                )
            )
