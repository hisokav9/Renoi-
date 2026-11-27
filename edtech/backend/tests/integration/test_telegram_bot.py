from __future__ import annotations

import asyncio
import itertools
from typing import Any

import httpx
import pytest
from sqlalchemy import select

from edtech.container import Container
from edtech.modules.support.models import SupportTicket
from edtech.modules.telegram.polling import PollingConflictError, run_polling
from edtech.modules.users import service as users
from edtech.modules.users.models import User, UserStatus
from tests.conftest import SUPPORT_CHAT_ID, WEBHOOK_SECRET, WEBHOOK_TOKEN, FakeTelegram

WEBHOOK = "/api/v1/telegram/webhook"
HEADERS = {"X-Telegram-Bot-Api-Secret-Token": WEBHOOK_TOKEN}
_update_ids = itertools.count(1)
TG_USER = 31337


def message(
    text: str | None = None, *, user_id: int = TG_USER, chat_type: str = "private", **extra: Any
) -> dict[str, Any]:
    msg: dict[str, Any] = {
        "message_id": 1,
        "date": 0,
        "chat": {"id": user_id, "type": chat_type},
        "from": {"id": user_id, "is_bot": False, "first_name": "Awa <b>", "language_code": "fr"},
        **extra,
    }
    if text is not None:
        msg["text"] = text
    return {"update_id": next(_update_ids), "message": msg}


def callback(data: str, *, user_id: int = TG_USER, message_id: int = 50) -> dict[str, Any]:
    return {
        "update_id": next(_update_ids),
        "callback_query": {
            "id": f"cb{next(_update_ids)}",
            "from": {"id": user_id, "is_bot": False, "first_name": "Awa", "language_code": "fr"},
            "message": {
                "message_id": message_id,
                "date": 0,
                "chat": {"id": user_id, "type": "private"},
            },
            "data": data,
        },
    }


async def send(client: httpx.AsyncClient, update: dict[str, Any]) -> None:
    response = await client.post(WEBHOOK, json=update, headers=HEADERS)
    assert response.status_code == 200, response.text


async def test_webhook_rejects_requests_without_the_secret(client: httpx.AsyncClient) -> None:
    assert (await client.post(WEBHOOK, json=message("/start"))).status_code == 401
    wrong = await client.post(
        WEBHOOK, json=message("/start"), headers={"X-Telegram-Bot-Api-Secret-Token": "x"}
    )
    assert wrong.status_code == 401
    raw = await client.post(  # le secret brut n'est pas le jeton attendu
        WEBHOOK, json=message("/start"), headers={"X-Telegram-Bot-Api-Secret-Token": WEBHOOK_SECRET}
    )
    assert raw.status_code == 401


async def test_invalid_and_duplicate_updates_are_acknowledged(
    client: httpx.AsyncClient, fake_telegram: FakeTelegram
) -> None:
    assert (await client.post(WEBHOOK, content=b"not json", headers=HEADERS)).json() == {"ok": True}
    update = message("/aide")
    await send(client, update)
    await send(client, update)  # Telegram renvoie la même mise à jour
    assert len(fake_telegram.sent("sendMessage")) == 1


@pytest.mark.usefixtures("seeded")
async def test_full_onboarding_flow(
    client: httpx.AsyncClient, container: Container, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/start"))
    welcome, language = fake_telegram.sent("sendMessage")
    assert "Awa &lt;b&gt;" in welcome["text"]  # prénom échappé (HTML Telegram)
    assert fake_telegram.buttons(language) == ["lang:fr", "lang:en"]

    await send(client, callback("lang:fr"))
    assert fake_telegram.buttons(fake_telegram.last()) == ["ob:c:NE"]
    assert fake_telegram.last()["message_id"] == 50  # le message est modifié, pas renvoyé

    await send(client, callback("ob:c:NE"))
    assert fake_telegram.buttons(fake_telegram.last()) == [
        "ob:cy:primary",
        "ob:cy:lower_secondary",
        "ob:cy:upper_secondary",
        "ob:cy:higher",
    ]
    await send(client, callback("ob:cy:upper_secondary"))
    grades = fake_telegram.buttons(fake_telegram.last())
    assert len(grades) == 3
    await send(client, callback(grades[-1]))  # Terminale
    series_buttons = fake_telegram.buttons(fake_telegram.last())
    assert series_buttons[-1] == "ob:s:none"
    assert len(series_buttons) == 4
    await send(client, callback(series_buttons[1]))  # série C

    done = fake_telegram.last()
    assert "Terminale" in done["text"]
    assert "Série C" in done["text"]
    assert "<b>5</b> crédit" in done["text"]
    assert "m:correct" in fake_telegram.buttons(done)
    async with container.db.session() as s:
        user = await users.get_by_telegram_id(s, TG_USER)
        assert user is not None
        assert user.onboarded_at is not None
    callbacks_answered = [p for m, p in fake_telegram.calls if m == "answerCallbackQuery"]
    assert len(callbacks_answered) == 5  # chaque bouton est acquitté

    await send(client, message("/start"))
    assert fake_telegram.last()["text"].startswith("Re-bonjour")


@pytest.mark.usefixtures("seeded")
async def test_grade_without_series_finishes_onboarding(
    client: httpx.AsyncClient, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/start"))
    await send(client, callback("lang:en"))
    await send(client, callback("ob:c:NE"))
    await send(client, callback("ob:cy:primary"))
    cm2 = fake_telegram.buttons(fake_telegram.last())[-1]
    await send(client, callback(cm2))
    assert fake_telegram.last()["text"].startswith("Got it")
    await send(client, callback("ob:g:not-a-uuid"))
    assert any("no longer valid" in p["text"] for p in fake_telegram.sent("sendMessage"))


async def test_menus_account_history_and_help(
    client: httpx.AsyncClient, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/start"))
    await send(client, callback("m:acc"))
    account = fake_telegram.last()
    assert "Crédits disponibles : <b>5</b>" in account["text"]
    assert "acc:del" in fake_telegram.buttons(account)
    await send(client, callback("m:hist"))
    assert "aucun exercice" in fake_telegram.last()["text"]
    await send(client, message("/aide@edtech_test_bot"))
    assert "intelligence artificielle" in fake_telegram.last()["text"]
    await send(client, callback("m:correct"))
    assert "bientôt" in fake_telegram.last()["text"]
    await send(client, callback("garbage"))
    assert fake_telegram.last()["text"] == "Que veux-tu faire ?"


async def test_photo_is_not_downloaded_before_phase_2(
    client: httpx.AsyncClient, fake_telegram: FakeTelegram
) -> None:
    photo = [{"file_id": "f1", "file_unique_id": "u1", "width": 800, "height": 600}]
    await send(client, message(photo=photo))
    assert "bientôt" in fake_telegram.last()["text"]
    assert not [m for m, _ in fake_telegram.calls if m == "getFile"]


async def test_support_ticket_is_stored_and_forwarded(
    client: httpx.AsyncClient, container: Container, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/support"))
    await send(client, message("Je n'arrive pas à <envoyer> mon sujet"))
    forwarded = next(
        p for p in fake_telegram.sent("sendMessage") if p["chat_id"] == SUPPORT_CHAT_ID
    )
    assert "&lt;envoyer&gt;" in forwarded["text"]
    assert "référence" in fake_telegram.last()["text"]
    async with container.db.session() as s:
        tickets = (await s.execute(select(SupportTicket))).scalars().all()
    assert len(tickets) == 1
    await send(client, message("autre chose"))  # l'état « assistance » est consommé
    # Utilisateur pas encore inscrit : il est guidé vers l'inscription.
    assert fake_telegram.last()["text"] == "🌐 Choisis ta langue :"
    async with container.db.session() as s:
        assert len((await s.execute(select(SupportTicket))).scalars().all()) == 1


async def test_account_deletion_flow(
    client: httpx.AsyncClient, container: Container, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/start"))
    await send(client, callback("acc:del"))
    assert fake_telegram.buttons(fake_telegram.last()) == ["acc:del:yes", "m:acc"]
    await send(client, callback("acc:del:yes"))
    assert "supprimé" in fake_telegram.last()["text"]
    async with container.db.session() as s:
        statuses = (await s.execute(select(User.status))).scalars().all()
    assert statuses == [UserStatus.DELETED]
    await send(client, message("/start"))  # nouveau départ, nouveau compte
    async with container.db.session() as s:
        assert len((await s.execute(select(User))).scalars().all()) == 2


async def test_rate_limit_notifies_once(
    client: httpx.AsyncClient, container: Container, fake_telegram: FakeTelegram
) -> None:
    container.settings.rate_limit_telegram_per_minute = 2
    try:
        for _ in range(5):
            await send(client, message("/aide"))
    finally:
        container.settings.rate_limit_telegram_per_minute = 1000
    texts = [p["text"] for p in fake_telegram.sent("sendMessage")]
    assert len(texts) == 3
    assert texts[-1].startswith("Doucement")


async def test_groups_bots_and_suspended_users(
    client: httpx.AsyncClient, container: Container, fake_telegram: FakeTelegram
) -> None:
    await send(client, message("/start", chat_type="group"))
    bot_update = message("/start")
    bot_update["message"]["from"]["is_bot"] = True
    await send(client, bot_update)
    assert fake_telegram.calls == []

    await send(client, message("/start"))
    async with container.db.session() as s:
        user = await users.get_by_telegram_id(s, TG_USER)
        assert user is not None
        user.status = UserStatus.SUSPENDED
        await s.commit()
    await send(client, message("/menu"))
    assert "suspendu" in fake_telegram.last()["text"]


async def test_handler_errors_are_reported_to_the_user(
    client: httpx.AsyncClient, fake_telegram: FakeTelegram
) -> None:
    fake_telegram.fail_methods["editMessageText"] = {
        "error_code": 400,
        "description": "message to edit not found",
    }
    await send(client, message("/start"))
    await send(client, callback("m:help"))  # la modification échoue : nouveau message envoyé
    assert "Aide" in fake_telegram.sent("sendMessage")[-1]["text"]


async def _poll(container: Container, fake_telegram: FakeTelegram) -> int:
    assert container.telegram is not None
    assert container.bot is not None
    stop = asyncio.Event()
    fake_telegram.on_empty = stop.set
    return await asyncio.wait_for(
        run_polling(
            container.telegram, container.bot, container.redis, stop=stop, error_backoff=0.01
        ),
        10,
    )


async def test_polling_handles_updates_and_skips_bad_ones(
    container: Container, fake_telegram: FakeTelegram
) -> None:
    start = message("/start")
    broken = {"update_id": start["update_id"] + 1000, "message": {"unexpected": True}}
    fake_telegram.updates = [
        [start, broken],
        {"error_code": 502, "description": "Bad Gateway"},  # erreur passagère : on réessaie
        [start],  # doublon déjà traité
    ]
    assert await _poll(container, fake_telegram) == 1
    texts = [p["text"] for p in fake_telegram.sent("sendMessage")]
    assert texts[0].startswith("Bonjour")
    assert len(texts) == 2  # accueil + choix de la langue
    polls = [p for m, p in fake_telegram.calls if m == "getUpdates"]
    assert "offset" not in polls[0]
    assert polls[1]["offset"] == broken["update_id"] + 1
    assert polls[0]["allowed_updates"] == ["message", "callback_query"]


async def test_polling_stops_on_conflict_with_a_webhook(
    container: Container, fake_telegram: FakeTelegram
) -> None:
    fake_telegram.fail_methods["getUpdates"] = {
        "error_code": 409,
        "description": "Conflict: can't use getUpdates method while webhook is active",
    }
    with pytest.raises(PollingConflictError, match="webhook"):
        await _poll(container, fake_telegram)
