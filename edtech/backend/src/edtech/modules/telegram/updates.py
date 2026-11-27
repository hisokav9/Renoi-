"""Shared handling of incoming updates, whatever the transport (webhook or polling)."""

from __future__ import annotations

from redis.asyncio import Redis

ALLOWED_UPDATES = ["message", "callback_query"]
DEDUP_TTL_SECONDS = 24 * 3600


async def first_delivery(redis: Redis, update_id: int) -> bool:
    """True the first time an ``update_id`` is seen (Telegram may deliver an update twice)."""
    return bool(await redis.set(f"tg:update:{update_id}", 1, ex=DEDUP_TTL_SECONDS, nx=True))
