"""Time-ordered identifiers (UUID version 7, RFC 9562).

UUIDv7 keeps B-tree indexes compact (inserts are roughly sequential) while staying globally
unique and non-guessable enough for public identifiers. Python adds ``uuid.uuid7`` in 3.14;
this implementation keeps us compatible with 3.12+.
"""

from __future__ import annotations

import os
import time
import uuid

_48_BITS = (1 << 48) - 1
_12_BITS = (1 << 12) - 1
_62_BITS = (1 << 62) - 1


def uuid7() -> uuid.UUID:
    timestamp_ms = time.time_ns() // 1_000_000
    rand = int.from_bytes(os.urandom(10), "big")  # 80 random bits, 74 used
    value = (timestamp_ms & _48_BITS) << 80
    value |= 0x7 << 76  # version
    value |= ((rand >> 62) & _12_BITS) << 64  # rand_a
    value |= 0b10 << 62  # variant
    value |= rand & _62_BITS  # rand_b
    return uuid.UUID(int=value)
