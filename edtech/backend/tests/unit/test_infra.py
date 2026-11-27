from __future__ import annotations

import json
from pathlib import Path

import boto3
import httpx
import pytest
from moto import mock_aws

from edtech.infra.storage import LocalStorage, S3Storage, StorageError, validate_key
from edtech.modules.jobs.pipeline import PipelineRegistry, StageResult, StageSpec
from edtech.modules.jobs.runner import retry_delay
from edtech.modules.telegram.client import TelegramApiError, TelegramClient
from edtech.modules.telegram.types import TgUpdate, inline_keyboard


async def test_local_storage_roundtrip(tmp_path: Path) -> None:
    storage = LocalStorage(tmp_path)
    await storage.put("jobs/a/page-1.jpg", b"data", content_type="image/jpeg")
    assert await storage.exists("jobs/a/page-1.jpg")
    assert await storage.get("jobs/a/page-1.jpg") == b"data"
    await storage.delete("jobs/a/page-1.jpg")
    assert not await storage.exists("jobs/a/page-1.jpg")
    with pytest.raises(StorageError):
        await storage.get("jobs/a/page-1.jpg")


@pytest.mark.parametrize("key", ["../etc/passwd", "/abs/path", "a/../../b", "", "a b"])
def test_storage_rejects_unsafe_keys(key: str) -> None:
    with pytest.raises(StorageError):
        validate_key(key)


async def test_s3_storage_roundtrip() -> None:
    with mock_aws():
        client = boto3.client("s3", region_name="eu-west-3")
        client.create_bucket(
            Bucket="edtech-test", CreateBucketConfiguration={"LocationConstraint": "eu-west-3"}
        )
        storage = S3Storage(client, "edtech-test")
        await storage.ping()
        await storage.put("k/v.pdf", b"%PDF", content_type="application/pdf")
        assert await storage.exists("k/v.pdf")
        assert await storage.get("k/v.pdf") == b"%PDF"
        head = client.head_object(Bucket="edtech-test", Key="k/v.pdf")
        assert head["ServerSideEncryption"] == "AES256"
        await storage.delete("k/v.pdf")
        assert not await storage.exists("k/v.pdf")


async def _noop(_ctx: object) -> StageResult:
    return StageResult()


def test_pipeline_registry_validation() -> None:
    registry = PipelineRegistry()
    with pytest.raises(ValueError, match="au moins"):
        registry.register("x", [])
    with pytest.raises(ValueError, match="double"):
        registry.register("x", [StageSpec("a", _noop), StageSpec("a", _noop)])
    registry.register("x", [StageSpec("a", _noop)])
    assert "x" in registry
    assert registry.kinds() == ["x"]
    with pytest.raises(LookupError):
        registry.get("y")


def test_retry_delay_is_exponential_and_capped() -> None:
    assert [retry_delay(n) for n in (1, 2, 3)] == [10, 20, 40]
    assert retry_delay(20) == 600


def test_inline_keyboard_enforces_callback_limit() -> None:
    kb = inline_keyboard([[("A", "m:main"), ("B", "m:acc")]])
    assert kb["inline_keyboard"][0][1] == {"text": "B", "callback_data": "m:acc"}
    with pytest.raises(ValueError, match="64"):
        inline_keyboard([[("A", "x" * 65)]])


def test_update_kind_detection() -> None:
    base = {"message_id": 1, "date": 0, "chat": {"id": 1, "type": "private"}, "from": {"id": 1}}
    assert (
        TgUpdate.model_validate({"update_id": 1, "message": {**base, "text": "/start"}}).kind
        == "command"
    )
    assert (
        TgUpdate.model_validate({"update_id": 1, "message": {**base, "text": "salut"}}).kind
        == "message"
    )
    photo = [{"file_id": "f", "file_unique_id": "u", "width": 1, "height": 1}]
    assert (
        TgUpdate.model_validate({"update_id": 1, "message": {**base, "photo": photo}}).kind
        == "media"
    )
    cb = {"id": "c", "from": {"id": 1}, "data": "m:main"}
    assert TgUpdate.model_validate({"update_id": 1, "callback_query": cb}).kind == "callback_query"
    assert TgUpdate.model_validate({"update_id": 1, "poll": {}}).kind == "other"


async def test_telegram_client_retries_short_flood_wait_and_hides_token() -> None:
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.path)
        if len(calls) == 1:
            return httpx.Response(
                429,
                json={
                    "ok": False,
                    "error_code": 429,
                    "description": "Too Many Requests",
                    "parameters": {"retry_after": 0},
                },
            )
        return httpx.Response(200, json={"ok": True, "result": {"message_id": 3}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        client = TelegramClient("1:SECRET", http)
        result = await client.send_message(1, "x" * 5000)
        assert result == {"message_id": 3}
        assert len(calls) == 2

    def broken(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection to https://api.telegram.org/bot1:SECRET failed")

    async with httpx.AsyncClient(transport=httpx.MockTransport(broken)) as http:
        client = TelegramClient("1:SECRET", http)
        with pytest.raises(TelegramApiError) as excinfo:
            await client.send_message(1, "hi")
        assert "SECRET" not in str(excinfo.value)
        assert excinfo.value.__cause__ is None


async def test_telegram_client_ignores_not_modified_edits() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        if "text" in body:
            assert len(body["text"]) == 4096
        return httpx.Response(
            400,
            json={
                "ok": False,
                "error_code": 400,
                "description": "Bad Request: message is not modified",
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
        client = TelegramClient("1:x", http)
        assert await client.edit_message_text(1, 2, "y" * 5000) is None
        with pytest.raises(TelegramApiError):
            await client.answer_callback_query("id")
