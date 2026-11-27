"""Subset of the Telegram Bot API types used by the platform (unknown fields are ignored)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class _TgModel(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class TgUser(_TgModel):
    id: int
    is_bot: bool = False
    first_name: str = ""
    language_code: str | None = None


class TgChat(_TgModel):
    id: int
    type: str


class TgPhotoSize(_TgModel):
    file_id: str
    file_unique_id: str
    width: int
    height: int
    file_size: int | None = None


class TgDocument(_TgModel):
    file_id: str
    file_unique_id: str
    file_name: str | None = None
    mime_type: str | None = None
    file_size: int | None = None


class TgMessage(_TgModel):
    message_id: int
    date: int
    chat: TgChat
    from_user: TgUser | None = Field(default=None, alias="from")
    text: str | None = None
    caption: str | None = None
    photo: list[TgPhotoSize] | None = None
    document: TgDocument | None = None
    media_group_id: str | None = None

    @property
    def has_media(self) -> bool:
        return bool(self.photo or self.document)


class TgCallbackQuery(_TgModel):
    id: str
    from_user: TgUser = Field(alias="from")
    message: TgMessage | None = None
    data: str | None = None


class TgUpdate(_TgModel):
    update_id: int
    message: TgMessage | None = None
    edited_message: TgMessage | None = None
    callback_query: TgCallbackQuery | None = None

    @property
    def kind(self) -> str:
        if self.callback_query:
            return "callback_query"
        if self.message:
            if self.message.has_media:
                return "media"
            if self.message.text and self.message.text.startswith("/"):
                return "command"
            return "message"
        if self.edited_message:
            return "edited_message"
        return "other"


InlineKeyboard = dict[str, Any]


def inline_keyboard(rows: list[list[tuple[str, str]]]) -> InlineKeyboard:
    """Build an ``InlineKeyboardMarkup`` from ``[[(label, callback_data), ...], ...]``."""
    for row in rows:
        for _, data in row:
            if len(data.encode()) > 64:
                raise ValueError(f"callback_data trop long (64 octets max) : {data!r}")
    return {
        "inline_keyboard": [
            [{"text": label, "callback_data": data} for label, data in row] for row in rows
        ]
    }
