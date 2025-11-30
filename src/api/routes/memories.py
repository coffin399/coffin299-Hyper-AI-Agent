from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.memory_service import MemoryMatch, memory_service
from ...services.ocr_service import ocr_service

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


@router.post("/ingest-file", response_model=List[MemoryResponse])
async def ingest_file(
    project_id: int = Query(...),
    file: UploadFile = File(...),
    tags: Optional[List[str]] = Query(default=None),
):
    try:
        content = await file.read()

        allowed_types = [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/pdf",
            "text/plain",
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported document format")

        import tempfile

        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp_file:
            tmp_file.write(content)
            file_path = tmp_file.name

        if file.content_type == "application/pdf":
            ocr_result = await ocr_service.extract_text_from_pdf(file_path)
            text = ocr_result.get("text", "")
        else:
            ocr_result = await ocr_service.extract_text_from_document(file_path, True)
            text = ocr_result.get("text", "")

        if not text.strip():
            raise HTTPException(status_code=400, detail="No text content could be extracted from the document")

        records = await memory_service.add_document_memories(
            project_id=project_id,
            text=text,
            source=file.filename,
            tags=tags,
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
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
