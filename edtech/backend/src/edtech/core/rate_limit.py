"""Fixed-window rate limiter backed by Redis (shared by every API and worker instance)."""

from __future__ import annotations

from dataclasses import dataclass

from redis.asyncio import Redis


@dataclass(frozen=True, slots=True)
class RateLimitResult:
    allowed: bool
    count: int
    limit: int
    retry_after: int

    @property
    def first_rejection(self) -> bool:
        """True only for the first rejected hit of a window (to notify the user once)."""
        return not self.allowed and self.count == self.limit + 1


class RateLimiter:
    def __init__(self, redis: Redis, prefix: str = "rl") -> None:
        self._redis = redis
        self._prefix = prefix

    async def hit(self, key: str, *, limit: int, window_seconds: int) -> RateLimitResult:
        redis_key = f"{self._prefix}:{key}"
        async with self._redis.pipeline(transaction=True) as pipe:
            pipe.set(redis_key, 0, ex=window_seconds, nx=True)
            pipe.incr(redis_key)
            pipe.ttl(redis_key)
            _, count, ttl = await pipe.execute()
        count = int(count)
        ttl = int(ttl) if int(ttl) > 0 else window_seconds
        return RateLimitResult(allowed=count <= limit, count=count, limit=limit, retry_after=ttl)
