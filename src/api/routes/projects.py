from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional

from ...services.conversation_service import conversation_service

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: str


@router.post("/", response_model=ProjectResponse)
async def ensure_project(payload: ProjectCreate):
    try:
        proj = await conversation_service.ensure_project(
            name=payload.name,
            description=payload.description,
        )
        return ProjectResponse(
            id=proj.id,
            name=proj.name,
            description=proj.description,
            created_at=proj.created_at.isoformat(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int):
    async with conversation_service.session_scope() as session:
        from ...core.models import Project

        proj = await session.get(Project, project_id)
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")
        return ProjectResponse(
            id=proj.id,
            name=proj.name,
            description=proj.description,
            created_at=proj.created_at.isoformat(),
        )
