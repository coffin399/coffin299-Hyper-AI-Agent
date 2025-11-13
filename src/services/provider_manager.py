from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlalchemy import Select, select, update
from sqlalchemy.exc import IntegrityError

from ..core.database import session_scope
from ..core.keystore import get_keystore
from ..core.models import ProviderKey, ProviderType

FAILURE_THRESHOLD = 3


@dataclass
class ProviderKeyDTO:
    id: int
    provider: ProviderType
    label: str
    is_active: bool
    failure_count: int
    last_used_at: Optional[datetime]
    created_at: datetime

    @classmethod
    def from_model(cls, key: ProviderKey) -> "ProviderKeyDTO":
        return cls(
            id=key.id,
            provider=key.provider,
            label=key.label,
            is_active=key.is_active,
            failure_count=key.failure_count,
            last_used_at=key.last_used_at,
            created_at=key.created_at,
        )


class ProviderManager:
    """Manage provider API keys with encryption, rotation, and failover."""

    def __init__(self) -> None:
        self.keystore = get_keystore()

    async def add_key(self, provider: ProviderType, label: str, api_key: str) -> ProviderKeyDTO:
        encrypted = self.keystore.encrypt(api_key)
        async with session_scope() as session:
            key = ProviderKey(provider=provider, label=label, encrypted_key=encrypted)
            session.add(key)
            try:
                await session.flush()
            except IntegrityError as exc:
                raise ValueError(f"Key label '{label}' already exists for provider {provider.value}.") from exc
            return ProviderKeyDTO.from_model(key)

    async def list_keys(self, provider: Optional[ProviderType] = None) -> list[ProviderKeyDTO]:
        async with session_scope() as session:
            stmt: Select = select(ProviderKey)
            if provider:
                stmt = stmt.where(ProviderKey.provider == provider)
            stmt = stmt.order_by(ProviderKey.provider, ProviderKey.label)
            result = await session.scalars(stmt)
            return [ProviderKeyDTO.from_model(key) for key in result]

    async def activate_key(self, key_id: int) -> None:
        async with session_scope() as session:
            stmt = update(ProviderKey).where(ProviderKey.id == key_id).values(is_active=True, failure_count=0)
            await session.execute(stmt)

    async def deactivate_key(self, key_id: int) -> None:
        async with session_scope() as session:
            stmt = update(ProviderKey).where(ProviderKey.id == key_id).values(is_active=False)
            await session.execute(stmt)

    async def get_decrypted_key(self, key_id: int) -> Optional[str]:
        async with session_scope() as session:
            key = await session.get(ProviderKey, key_id)
            if not key or not key.is_active:
                return None
            return self.keystore.decrypt(key.encrypted_key)

    async def get_next_key(self, provider: ProviderType) -> Optional[tuple[ProviderKey, str]]:
        async with session_scope() as session:
            stmt = (
                select(ProviderKey)
                .where(ProviderKey.provider == provider, ProviderKey.is_active.is_(True))
                .order_by(ProviderKey.failure_count, ProviderKey.last_used_at.is_(None).desc(), ProviderKey.last_used_at)
            )
            key = await session.scalar(stmt)
            if not key:
                return None
            decrypted = self.keystore.decrypt(key.encrypted_key)
            if decrypted is None:
                await session.delete(key)
                return None
            key.last_used_at = datetime.utcnow()
            await session.flush()
            return key, decrypted

    async def mark_success(self, key_id: int) -> None:
        async with session_scope() as session:
            stmt = (
                update(ProviderKey)
                .where(ProviderKey.id == key_id)
                .values(failure_count=0, is_active=True, last_used_at=datetime.utcnow())
            )
            await session.execute(stmt)

    async def mark_failure(self, key_id: int) -> None:
        async with session_scope() as session:
            key = await session.get(ProviderKey, key_id)
            if not key:
                return
            key.failure_count += 1
            if key.failure_count >= FAILURE_THRESHOLD:
                key.is_active = False
            await session.flush()

    async def rotate_until_success(self, provider: ProviderType, coro_factory):
        """Attempt provider call across available keys until success."""

        attempted: set[int] = set()
        last_exception: Optional[Exception] = None

        while True:
            next_key = await self.get_next_key(provider)
            if not next_key:
                if last_exception:
                    raise last_exception
                raise RuntimeError(f"No active keys configured for provider: {provider.value}")

            key_model, secret = next_key
            if key_model.id in attempted:
                if last_exception:
                    raise last_exception
                raise RuntimeError(f"All keys exhausted for provider {provider.value}")

            attempted.add(key_model.id)
            try:
                result = await coro_factory(secret, key_model.id)
                await self.mark_success(key_model.id)
                return result
            except Exception as exc:  # pragma: no cover - network dependent
                last_exception = exc
                await self.mark_failure(key_model.id)
                await asyncio.sleep(0.1)


provider_manager = ProviderManager()
