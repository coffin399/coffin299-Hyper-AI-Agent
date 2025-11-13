from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional

from ...core.models import ProviderType
from ...services.provider_manager import ProviderManager, provider_manager

router = APIRouter(prefix="/providers", tags=["providers"])


class ProviderKeyCreate(BaseModel):
    provider: ProviderType
    label: str
    api_key: str

    @validator("label")
    def _nonempty(cls, v):  # type: ignore[override]
        if not v or not v.strip():
            raise ValueError("label must not be empty")
        return v.strip()


class ProviderKeyResponse(BaseModel):
    id: int
    provider: ProviderType
    label: str
    is_active: bool
    failure_count: int
    last_used_at: Optional[str]
    created_at: str


@router.post("/keys", response_model=ProviderKeyResponse)
async def add_key(payload: ProviderKeyCreate):
    try:
        dto = await provider_manager.add_key(
            provider=payload.provider,
            label=payload.label,
            api_key=payload.api_key,
        )
        return ProviderKeyResponse(
            id=dto.id,
            provider=dto.provider,
            label=dto.label,
            is_active=dto.is_active,
            failure_count=dto.failure_count,
            last_used_at=dto.last_used_at.isoformat() if dto.last_used_at else None,
            created_at=dto.created_at.isoformat(),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/keys", response_model=List[ProviderKeyResponse])
async def list_keys(provider: Optional[ProviderType] = None):
    dtos = await provider_manager.list_keys(provider=provider)
    return [
        ProviderKeyResponse(
            id=dto.id,
            provider=dto.provider,
            label=dto.label,
            is_active=dto.is_active,
            failure_count=dto.failure_count,
            last_used_at=dto.last_used_at.isoformat() if dto.last_used_at else None,
            created_at=dto.created_at.isoformat(),
        )
        for dto in dtos
    ]


@router.post("/keys/{key_id}/activate")
async def activate_key(key_id: int):
    await provider_manager.activate_key(key_id)
    return {"status": "activated"}


@router.post("/keys/{key_id}/deactivate")
async def deactivate_key(key_id: int):
    await provider_manager.deactivate_key(key_id)
    return {"status": "deactivated"}
