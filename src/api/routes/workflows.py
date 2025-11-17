from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ...services.workflow_service import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


class WorkflowCreate(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    graph: Dict[str, Any] = Field(default_factory=dict)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[Dict[str, Any]] = None


class WorkflowResponse(BaseModel):
    id: int
    project_id: int
    name: str
    description: Optional[str]
    graph: Dict[str, Any]


class WorkflowRunRequest(BaseModel):
    input: Dict[str, Any] = Field(default_factory=dict)


class WorkflowRunResponse(BaseModel):
    workflow_id: int
    success: bool
    error: Optional[str]
    node_results: Dict[str, Any]
    last_output: Any


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(project_id: Optional[int] = Query(None)):
    try:
        workflows = await workflow_service.list_workflows(project_id=project_id)
        return [
            WorkflowResponse(
                id=w.id,
                project_id=w.project_id,
                name=w.name,
                description=w.description,
                graph=w.graph or {},
            )
            for w in workflows
        ]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: int):
    workflow = await workflow_service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse(
        id=workflow.id,
        project_id=workflow.project_id,
        name=workflow.name,
        description=workflow.description,
        graph=workflow.graph or {},
    )


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(payload: WorkflowCreate):
    try:
        workflow = await workflow_service.create_workflow(
            project_id=payload.project_id,
            name=payload.name,
            description=payload.description,
            graph=payload.graph,
        )
        return WorkflowResponse(
            id=workflow.id,
            project_id=workflow.project_id,
            name=workflow.name,
            description=workflow.description,
            graph=workflow.graph or {},
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: int, payload: WorkflowUpdate):
    workflow = await workflow_service.update_workflow(
        workflow_id=workflow_id,
        name=payload.name,
        description=payload.description,
        graph=payload.graph,
    )
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse(
        id=workflow.id,
        project_id=workflow.project_id,
        name=workflow.name,
        description=workflow.description,
        graph=workflow.graph or {},
    )


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int):
    deleted = await workflow_service.delete_workflow(workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"status": "deleted"}


@router.post("/{workflow_id}/run", response_model=WorkflowRunResponse)
async def run_workflow(workflow_id: int, payload: WorkflowRunRequest):
    try:
        result = await workflow_service.run_workflow(workflow_id, input_data=payload.input)
        return WorkflowRunResponse(
            workflow_id=result.get("workflow_id", workflow_id),
            success=bool(result.get("success")),
            error=result.get("error"),
            node_results=result.get("node_results", {}),
            last_output=result.get("last_output"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
