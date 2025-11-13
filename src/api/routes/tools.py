from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from ...services.tool_service import tool_service

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class ToolExecuteResponse(BaseModel):
    success: bool
    output: Any
    description: Optional[str]


@router.get("/", response_model=List[Dict[str, str]])
async def list_tools():
    return tool_service.list_tools()


@router.post("/execute/{project_id}", response_model=ToolExecuteResponse)
async def execute_tool(project_id: int, payload: ToolExecuteRequest):
    try:
        result = await tool_service.execute(
            project_id=project_id,
            project_name=f"project_{project_id}",
            tool_name=payload.tool_name,
            arguments=payload.arguments,
        )
        return ToolExecuteResponse(
            success=result.success,
            output=result.output,
            description=result.description,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/logs/{project_id}")
async def get_tool_logs(project_id: int, limit: Optional[int] = Query(None)):
    logs = await tool_service.get_logs(project_id, limit=limit)
    return [
        {
            "id": log.id,
            "tool_name": log.tool_name,
            "arguments": log.arguments_json,
            "output": log.output_json,
            "status": log.status,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
