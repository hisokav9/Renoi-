"""Object storage port with S3-compatible and local-filesystem adapters.

Documents, audio and videos never go to the database: only their storage key does. The S3 adapter
works with AWS S3, Cloudflare R2, Scaleway, OVH, MinIO, etc. (``s3_endpoint_url``).
"""

from __future__ import annotations

import asyncio
import re
from pathlib import Path
from typing import Any, Protocol

from edtech.settings import Settings

_SAFE_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,511}$")


class StorageError(Exception):
    pass


def validate_key(key: str) -> str:
    if not _SAFE_KEY.match(key) or ".." in key.split("/"):
        raise StorageError(f"Clé de stockage invalide : {key!r}")
    return key


class ObjectStorage(Protocol):
    async def put(self, key: str, data: bytes, *, content_type: str) -> None: ...
    async def get(self, key: str) -> bytes: ...
    async def delete(self, key: str) -> None: ...
    async def exists(self, key: str) -> bool: ...
    async def ping(self) -> None: ...


class LocalStorage:
    """Filesystem storage for development and tests only."""

    def __init__(self, root: Path) -> None:
        self._root = root.resolve()

    def _path(self, key: str) -> Path:
        path = (self._root / validate_key(key)).resolve()
        if not path.is_relative_to(self._root):
            raise StorageError("Chemin hors du stockage")
        return path

    async def put(self, key: str, data: bytes, *, content_type: str) -> None:
        path = self._path(key)

        def _write() -> None:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)

        await asyncio.to_thread(_write)

    async def get(self, key: str) -> bytes:
        path = self._path(key)
        try:
            return await asyncio.to_thread(path.read_bytes)
        except FileNotFoundError as exc:
            raise StorageError(f"Objet introuvable : {key}") from exc

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(self._path(key).unlink, missing_ok=True)

    async def exists(self, key: str) -> bool:
        return await asyncio.to_thread(self._path(key).is_file)

    async def ping(self) -> None:
        await asyncio.to_thread(self._root.mkdir, parents=True, exist_ok=True)


class S3Storage:
    """S3-compatible storage. boto3 is synchronous, calls run in a worker thread."""

    def __init__(self, client: Any, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    @classmethod
    def from_settings(cls, settings: Settings) -> S3Storage:
        import boto3  # noqa: PLC0415 - optional at import time for local-only setups

        if not settings.s3_bucket:
            raise StorageError("EDTECH_S3_BUCKET manquant")
        client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            region_name=settings.s3_region,
            aws_access_key_id=(
                settings.s3_access_key_id.get_secret_value() if settings.s3_access_key_id else None
            ),
            aws_secret_access_key=(
                settings.s3_secret_access_key.get_secret_value()
                if settings.s3_secret_access_key
                else None
            ),
        )
        return cls(client, settings.s3_bucket)

    async def put(self, key: str, data: bytes, *, content_type: str) -> None:
        await asyncio.to_thread(
            self._client.put_object,
            Bucket=self._bucket,
            Key=validate_key(key),
            Body=data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )

    async def get(self, key: str) -> bytes:
        from botocore.exceptions import ClientError  # noqa: PLC0415

        try:
            response = await asyncio.to_thread(
                self._client.get_object, Bucket=self._bucket, Key=validate_key(key)
            )
        except ClientError as exc:
            raise StorageError(f"Objet introuvable : {key}") from exc
        body: bytes = await asyncio.to_thread(response["Body"].read)
        return body

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(
            self._client.delete_object, Bucket=self._bucket, Key=validate_key(key)
        )

    async def exists(self, key: str) -> bool:
        from botocore.exceptions import ClientError  # noqa: PLC0415

        try:
            await asyncio.to_thread(
                self._client.head_object, Bucket=self._bucket, Key=validate_key(key)
            )
        except ClientError:
            return False
        return True

    async def ping(self) -> None:
        await asyncio.to_thread(self._client.head_bucket, Bucket=self._bucket)


def build_storage(settings: Settings) -> ObjectStorage:
    if settings.storage_backend == "s3":
        return S3Storage.from_settings(settings)
    return LocalStorage(settings.storage_local_path)
