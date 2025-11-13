from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.memory_service import MemoryMatch, memory_service

router = APIRouter(prefix="/memories", tags=["memories"])


class MemoryCreate(BaseModel):
    project_id: int
    content: str
    summary: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MemoryResponse(BaseModel):
    id: int
    project_id: int
    content: str
    summary: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: str


class MemorySearchResponse(BaseModel):
    record: MemoryResponse
    score: float


@router.post("/", response_model=MemoryResponse)
async def add_memory(payload: MemoryCreate):
    try:
        record = await memory_service.add_memory(
            project_id=payload.project_id,
            content=payload.content,
            summary=payload.summary,
            tags=payload.tags,
            metadata=payload.metadata,
        )
        return MemoryResponse(
            id=record.id,
            project_id=record.project_id,
            content=record.content,
            summary=record.summary,
            metadata=memory_service._deserialize_metadata(record),
            created_at=record.created_at.isoformat(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/search/{project_id}", response_model=List[MemorySearchResponse])
async def search_memories(
    project_id: int,
    q: str = Query(..., alias="query"),
    top_k: Optional[int] = Query(5),
    min_score: Optional[float] = Query(0.35),
):
    try:
        matches = await memory_service.search_memories(
            project_id=project_id,
            query=q,
            top_k=top_k or 5,
            min_score=min_score or 0.35,
        )
        return [
            MemorySearchResponse(
                record=MemoryResponse(
                    id=match.record.id,
                    project_id=match.record.project_id,
                    content=match.record.content,
                    summary=match.record.summary,
                    metadata=match.metadata,
                    created_at=match.record.created_at.isoformat(),
                ),
                score=match.score,
            )
            for match in matches
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{project_id}", response_model=List[MemoryResponse])
async def list_memories(project_id: int, limit: Optional[int] = Query(None)):
    try:
        records = await memory_service.conversation_service.list_memories(
            project_id=project_id,
            limit=limit,
        )
        return [
            MemoryResponse(
                id=record.id,
                project_id=record.project_id,
                content=record.content,
                summary=record.summary,
                metadata=memory_service._deserialize_metadata(record),
                created_at=record.created_at.isoformat(),
            )
            for record in records
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
