from __future__ import annotations

import pytest
from sqlalchemy import select

from edtech.container import Container
from edtech.modules.audit.models import AuditLog
from edtech.modules.credits import service as credits
from edtech.modules.support.models import SupportTicket
from edtech.modules.users import service as users
from edtech.modules.users.models import User
from tests.conftest import FakeTelegram
from tests.integration.test_telegram_bot import callback, message, send

ADMIN_TG, STUDENT_TG, SUPPORT_TG = 7001, 7002, 7003


async def join(client, container: Container, telegram_id: int, role: str = "student") -> User:  # type: ignore[no-untyped-def]
    await send(client, message("/start", user_id=telegram_id))
    async with container.db.session() as s:
        user = await users.get_by_telegram_id(s, telegram_id)
        assert user is not None
        if role != "student":
            await users.set_role(s, user, role, actor_user_id=None)
        return user


def to(fake: FakeTelegram, chat_id: int) -> list[dict]:  # type: ignore[type-arg]
    return [p for p in fake.sent() if p["chat_id"] == chat_id]


def last_to(fake: FakeTelegram, chat_id: int) -> dict:  # type: ignore[type-arg]
    return to(fake, chat_id)[-1]


@pytest.fixture
def no_support_group(container: Container):  # type: ignore[no-untyped-def]
    previous = container.settings.support_chat_id
    container.settings.support_chat_id = None
    yield
    container.settings.support_chat_id = previous


async def test_admin_is_invisible_to_students(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    await join(client, container, STUDENT_TG)
    await send(client, message("/admin", user_id=STUDENT_TG))
    assert last_to(fake_telegram, STUDENT_TG)["text"].startswith("Je n'ai pas compris")
    await send(client, callback("adm:stats", user_id=STUDENT_TG))
    assert last_to(fake_telegram, STUDENT_TG)["text"] == "Que veux-tu faire ?"
    assert not any("Statistiques" in p["text"] for p in fake_telegram.sent())


async def test_admin_home_and_stats(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    await join(client, container, STUDENT_TG)
    await join(client, container, ADMIN_TG, role="admin")
    await send(client, message("/admin", user_id=ADMIN_TG))
    home = last_to(fake_telegram, ADMIN_TG)
    assert "Administration" in home["text"]
    assert fake_telegram.buttons(home) == ["adm:stats", "adm:tk:0", "adm:cr", "m:main"]
    await send(client, callback("adm:stats", user_id=ADMIN_TG))
    stats = last_to(fake_telegram, ADMIN_TG)["text"]
    assert "Inscrits : <b>2</b>" in stats
    assert "Crédits disponibles chez les élèves : 10" in stats


@pytest.mark.usefixtures("no_support_group")
async def test_ticket_reply_flow(client, container: Container, fake_telegram: FakeTelegram) -> None:  # type: ignore[no-untyped-def]
    admin = await join(client, container, ADMIN_TG, role="admin")
    student = await join(client, container, STUDENT_TG)
    await send(client, message("/support", user_id=STUDENT_TG))
    await send(client, message("Mon PDF ne passe pas <b>", user_id=STUDENT_TG))
    alert = last_to(fake_telegram, ADMIN_TG)["text"]
    assert alert.startswith("🆘 Nouveau ticket #")
    assert "&lt;b&gt;" in alert

    await send(client, callback("adm:tk:0", user_id=ADMIN_TG))
    ticket_button = next(
        b for b in fake_telegram.buttons(last_to(fake_telegram, ADMIN_TG)) if b.startswith("adm:t:")
    )
    ticket_id = ticket_button.removeprefix("adm:t:")
    await send(client, callback(ticket_button, user_id=ADMIN_TG))
    view = last_to(fake_telegram, ADMIN_TG)
    assert "Mon PDF ne passe pas" in view["text"]
    assert users.user_reference(student.id) in view["text"]
    assert fake_telegram.buttons(view)[:3] == [
        f"adm:tr:{ticket_id}",
        f"adm:cu:{student.id}",
        f"adm:tc:{ticket_id}",
    ]

    await send(client, callback(f"adm:tr:{ticket_id}", user_id=ADMIN_TG))
    assert "Écris ta réponse" in last_to(fake_telegram, ADMIN_TG)["text"]
    await send(client, message("Renvoie une photo nette <svp>", user_id=ADMIN_TG))
    answer = last_to(fake_telegram, STUDENT_TG)["text"]
    assert "Réponse de l'assistance" in answer
    assert "&lt;svp&gt;" in answer
    assert last_to(fake_telegram, ADMIN_TG)["text"].startswith("Réponse envoyée ✅")

    async with container.db.session() as s:
        ticket = (await s.execute(select(SupportTicket))).scalar_one()
        assert ticket.status == "closed"
        assert ticket.reply == "Renvoie une photo nette <svp>"
        assert ticket.replied_by == admin.id
        actions = (await s.execute(select(AuditLog.action))).scalars().all()
    assert "support.answered" in actions

    await send(client, callback(f"adm:tr:{ticket_id}", user_id=ADMIN_TG))
    assert last_to(fake_telegram, ADMIN_TG)["text"] == "Ce ticket a déjà été traité."


@pytest.mark.usefixtures("no_support_group")
async def test_undelivered_reply_keeps_the_ticket_open(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    await join(client, container, ADMIN_TG, role="admin")
    await join(client, container, STUDENT_TG)
    await send(client, message("/support", user_id=STUDENT_TG))
    await send(client, message("Aide", user_id=STUDENT_TG))
    async with container.db.session() as s:
        ticket = (await s.execute(select(SupportTicket))).scalar_one()
    fake_telegram.fail_chats.add(STUDENT_TG)  # l'élève a bloqué le bot
    await send(client, callback(f"adm:tr:{ticket.id}", user_id=ADMIN_TG))
    await send(client, message("Bonjour", user_id=ADMIN_TG))
    assert "non délivrée" in last_to(fake_telegram, ADMIN_TG)["text"]
    async with container.db.session() as s:
        assert (await s.get(SupportTicket, ticket.id)).status == "open"  # type: ignore[union-attr]
    await send(client, callback(f"adm:tc:{ticket.id}", user_id=ADMIN_TG))
    assert "clos" in last_to(fake_telegram, ADMIN_TG)["text"]
    async with container.db.session() as s:
        assert (await s.get(SupportTicket, ticket.id)).status == "closed"  # type: ignore[union-attr]


async def test_grant_credits_by_reference_exactly_once(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    admin = await join(client, container, ADMIN_TG, role="admin")
    student = await join(client, container, STUDENT_TG)
    ref = users.user_reference(student.id)

    await send(client, callback("adm:cr", user_id=ADMIN_TG))
    await send(client, message("ZZZZ", user_id=ADMIN_TG))
    assert "Aucun élève trouvé" in last_to(fake_telegram, ADMIN_TG)["text"]
    await send(client, message(f"#{ref.lower()}", user_id=ADMIN_TG))  # l'état est conservé
    card = last_to(fake_telegram, ADMIN_TG)
    assert ref in card["text"]
    assert fake_telegram.buttons(card)[:4] == [f"adm:ca:{student.id}:{n}" for n in (1, 5, 10, 20)]

    await send(client, callback(f"adm:ca:{student.id}:7", user_id=ADMIN_TG))  # montant non proposé
    assert "Administration" in last_to(fake_telegram, ADMIN_TG)["text"]
    await send(client, callback(f"adm:ca:{student.id}:5", user_id=ADMIN_TG))
    confirm = fake_telegram.buttons(last_to(fake_telegram, ADMIN_TG))[0]
    assert confirm.startswith("adm:cg:")

    await send(client, callback(confirm, user_id=ADMIN_TG))
    assert last_to(fake_telegram, ADMIN_TG)["text"].startswith(
        "✅ 5 crédit(s) ajouté(s). Nouveau solde de l'élève : 10."
    )
    assert "L'équipe t'a offert 5 crédit(s)" in last_to(fake_telegram, STUDENT_TG)["text"]
    await send(client, callback(confirm, user_id=ADMIN_TG))  # double appui
    assert (
        last_to(fake_telegram, ADMIN_TG)["text"]
        == "Cette opération a expiré ou a déjà été effectuée."
    )

    async with container.db.session() as s:
        account = await credits.get_account(s, student.id)
        assert account is not None
        assert account.balance == 10
        audit_rows = (
            (await s.execute(select(AuditLog).where(AuditLog.action == "credits.granted")))
            .scalars()
            .all()
        )
    assert len(audit_rows) == 1
    assert audit_rows[0].actor_user_id == admin.id


async def test_support_role_has_no_credit_powers(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    student = await join(client, container, STUDENT_TG)
    await join(client, container, SUPPORT_TG, role="support")
    await send(client, message("/admin", user_id=SUPPORT_TG))
    assert fake_telegram.buttons(last_to(fake_telegram, SUPPORT_TG)) == [
        "adm:stats",
        "adm:tk:0",
        "m:main",
    ]
    for forged in ("adm:cr", f"adm:cu:{student.id}", f"adm:ca:{student.id}:5", "adm:cg:deadbeef"):
        await send(client, callback(forged, user_id=SUPPORT_TG))
        assert "Administration" in last_to(fake_telegram, SUPPORT_TG)["text"]
    async with container.db.session() as s:
        account = await credits.get_account(s, student.id)
        assert account is not None
        assert account.balance == 5


async def test_admin_ids_from_settings_are_promoted(client, container: Container) -> None:  # type: ignore[no-untyped-def]
    container.settings.admin_telegram_ids = [ADMIN_TG]
    try:
        user = await join(client, container, ADMIN_TG)
    finally:
        container.settings.admin_telegram_ids = []
    async with container.db.session() as s:
        refreshed = await s.get(User, user.id)
        assert refreshed is not None
        assert refreshed.role == "admin"


async def test_account_screen_shows_the_reference(
    client, container: Container, fake_telegram: FakeTelegram
) -> None:  # type: ignore[no-untyped-def]
    student = await join(client, container, STUDENT_TG)
    await send(client, callback("m:acc", user_id=STUDENT_TG))
    assert (
        f"<code>{users.user_reference(student.id)}</code>"
        in last_to(fake_telegram, STUDENT_TG)["text"]
    )
